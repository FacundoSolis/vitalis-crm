-- ═══════════════════════════════════════════════════════════════════════════
--  Paciente que cambia de clínica
-- ═══════════════════════════════════════════════════════════════════════════
-- El problema: recepción solo ve su clínica. Si alguien pide presupuesto en
-- Madrid y luego se atiende en Valencia, Valencia no lo encuentra al buscar y
-- lo da de alta otra vez. El aviso de duplicado tampoco salta, porque se
-- calcula sobre los leads que esa persona puede ver. Resultado: dos fichas del
-- mismo paciente y el historial de Madrid perdido — justo lo que este CRM
-- viene a evitar.
--
-- La solución no es abrir el listado: es dar una pregunta muy concreta y un
-- traspaso explícito.
--   · Recepción sigue SIN poder listar los leads de otra clínica.
--   · Puede preguntar por UN teléfono exacto —el que el paciente le acaba de
--     dar en el mostrador— y recibe lo mínimo para reconocerlo: nombre,
--     clínica, estado y fecha. Ni el tratamiento, ni el email, ni las notas.
--   · Y puede traérselo, demostrando que tiene ese teléfono. El traspaso queda
--     registrado en el historial por el trigger que ya existía.
-- ═══════════════════════════════════════════════════════════════════════════

-- Misma normalización que la columna generada de `leads`, como función, para no
-- repetir la expresión en cada consulta.
create or replace function normalizar_telefono(t text)
returns text language sql immutable as $$
  select regexp_replace(regexp_replace(coalesce(t, ''), '\D', '', 'g'), '^34(?=\d{9}$)', '')
$$;

-- ── ¿Este paciente ya está en otra clínica? ─────────────────────────────────
-- SECURITY DEFINER a propósito: es la única puerta que cruza clínicas, y por eso
-- está acotada a un teléfono completo y devuelve cuatro campos. No hay búsqueda
-- por nombre ni listados: sin el teléfono del paciente delante, no se ve nada.
create or replace function buscar_paciente_en_otras_clinicas(telefono_buscado text)
returns table (
  id        uuid,
  nombre    text,
  clinica   clinica,
  estado    estado_lead,
  creado_en timestamptz
)
language sql stable security definer set search_path = public as $$
  select l.id, l.nombre, l.clinica, l.estado, l.creado_en
  from leads l
  where auth.uid() is not null
    and length(normalizar_telefono(telefono_buscado)) >= 9
    and l.telefono_normalizado = normalizar_telefono(telefono_buscado)
    -- Solo lo que esta persona NO ve ya por RLS. Para gerencia no devuelve nada:
    -- ya las ve las tres, y el aviso de duplicado de siempre le sirve igual.
    and not (es_admin() or l.clinica = mi_clinica())
  order by l.creado_en desc
  limit 5;
$$;

-- ── Traerse el lead a la clínica propia ─────────────────────────────────────
-- Pide el teléfono además del id: así hay que haberlo encontrado en la búsqueda
-- anterior, y no basta con adivinar un identificador.
create or replace function reclamar_lead(lead_id uuid, telefono_buscado text)
returns void language plpgsql security definer set search_path = public as $$
declare
  destino clinica := mi_clinica();
  origen  clinica;
begin
  if auth.uid() is null then
    raise exception 'Hay que iniciar sesión.';
  end if;

  -- Gerencia no reclama: cambia la clínica editando el lead, que ya puede.
  if destino is null then
    raise exception 'Gerencia cambia la clínica desde la ficha del lead.';
  end if;

  select l.clinica into origen
  from leads l
  where l.id = lead_id
    and l.telefono_normalizado = normalizar_telefono(telefono_buscado);

  if origen is null then
    raise exception 'Ese paciente ya no está donde estaba. Vuelve a buscarlo.';
  end if;

  if origen = destino then
    return;  -- ya es suyo; nada que hacer
  end if;

  -- El update va como dueño de la función, que es lo que permite mover el lead
  -- entre clínicas sin abrir la política de UPDATE a todo el mundo.
  update leads set clinica = destino where id = lead_id;
end;
$$;

-- Ninguna de las dos es para anónimos.
revoke execute on function buscar_paciente_en_otras_clinicas(text) from public, anon;
revoke execute on function reclamar_lead(uuid, text)              from public, anon;
grant  execute on function buscar_paciente_en_otras_clinicas(text) to authenticated;
grant  execute on function reclamar_lead(uuid, text)               to authenticated;
