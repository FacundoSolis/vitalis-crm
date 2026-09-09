-- ═══════════════════════════════════════════════════════════════════════════
--  La fecha de la cita
-- ═══════════════════════════════════════════════════════════════════════════
-- Faltaba la mitad del estado «cita agendada»: se sabía que había cita, pero no
-- cuándo. La hora acababa escrita a mano dentro de una nota («cita el viernes a
-- las 16:00»), donde no se puede ordenar, ni recordar, ni leer desde el
-- generador de mensajes — que además tiene prohibido inventarse fechas, así que
-- redactaba recordatorios de cita sin decir la cita.
--
-- Se guarda como timestamptz aparte del estado, y opcional a propósito: desde el
-- listado se puede mover un lead a «cita agendada» de un clic mientras se está
-- al teléfono, y la fecha se completa después en la ficha.
-- ═══════════════════════════════════════════════════════════════════════════

alter table leads add column fecha_cita timestamptz;

-- Parcial: solo interesan los leads que tienen cita, para sacar la agenda del día.
create index leads_fecha_cita_idx on leads (fecha_cita) where fecha_cita is not null;

-- Cambiar la hora de una cita es exactamente el tipo de cosa que el paciente
-- jura que avisó y nadie recuerda: al historial, como el estado y la clínica.
create or replace function registrar_cambios_lead()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.estado is distinct from old.estado then
    insert into notas (lead_id, texto, tipo, autor_id)
    values (new.id,
            format('Estado: %s → %s', old.estado, new.estado),
            'sistema', auth.uid());
  end if;
  if new.clinica is distinct from old.clinica then
    insert into notas (lead_id, texto, tipo, autor_id)
    values (new.id,
            format('Clínica de interés: %s → %s', old.clinica, new.clinica),
            'sistema', auth.uid());
  end if;
  if new.fecha_cita is distinct from old.fecha_cita then
    insert into notas (lead_id, texto, tipo, autor_id)
    values (new.id,
            format('Cita: %s → %s',
                   coalesce(to_char(old.fecha_cita at time zone 'Europe/Madrid',
                                    'DD/MM/YYYY HH24:MI'), 'sin fecha'),
                   coalesce(to_char(new.fecha_cita at time zone 'Europe/Madrid',
                                    'DD/MM/YYYY HH24:MI'), 'sin fecha')),
            'sistema', auth.uid());
  end if;
  return new;
end;
$$;
