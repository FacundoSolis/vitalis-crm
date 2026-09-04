-- ═══════════════════════════════════════════════════════════════════════════
--  Clínica Dental Vitalis — CRM de leads
--  Esquema inicial: perfiles, leads y notas (+ RLS por clínica)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Tipos ───────────────────────────────────────────────────────────────────
create type clinica      as enum ('Madrid', 'Valencia', 'Sevilla');
create type tratamiento  as enum ('implantes', 'ortodoncia', 'estetica', 'revision');
create type fuente       as enum ('instagram', 'web', 'llamada');
create type estado_lead  as enum ('nuevo', 'contactado', 'cita_agendada', 'no_interesado', 'cliente');
create type tipo_nota    as enum ('llamada', 'mensaje', 'mensaje_ia', 'sistema');
create type rol_usuario  as enum ('admin', 'recepcion');

-- ── Perfiles ────────────────────────────────────────────────────────────────
-- Extiende auth.users con el rol y la clínica a la que pertenece cada persona.
create table perfiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  nombre     text        not null,
  email      text        not null,
  rol        rol_usuario not null default 'recepcion',
  clinica    clinica,                       -- null solo para admin (ve las tres)
  creado_en  timestamptz not null default now(),
  constraint recepcion_necesita_clinica check (rol = 'admin' or clinica is not null)
);

-- ── Leads ───────────────────────────────────────────────────────────────────
create table leads (
  id            uuid primary key default gen_random_uuid(),
  nombre        text        not null,
  telefono      text        not null,
  email         text,
  clinica       clinica     not null,
  tratamiento   tratamiento not null,
  fuente        fuente      not null,
  estado        estado_lead not null default 'nuevo',
  creado_en     timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  creado_por    uuid references perfiles (id) on delete set null,

  -- Teléfono normalizado (solo dígitos, sin prefijo +34) para detectar duplicados.
  -- Decisión de producto: NO se bloquea ni se fusiona automáticamente; se detecta
  -- y se avisa en la UI para que el equipo decida. Ver README, sección Decisiones.
  telefono_normalizado text generated always as (
    regexp_replace(regexp_replace(telefono, '\D', '', 'g'), '^34(?=\d{9}$)', '')
  ) stored
);

create index leads_clinica_idx    on leads (clinica);
create index leads_estado_idx     on leads (estado);
create index leads_creado_en_idx  on leads (creado_en desc);
create index leads_telefono_idx   on leads (telefono_normalizado);

-- ── Notas ───────────────────────────────────────────────────────────────────
create table notas (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid      not null references leads (id) on delete cascade,
  texto      text      not null,
  tipo       tipo_nota not null default 'llamada',
  fecha      timestamptz not null default now(),
  autor_id   uuid references perfiles (id) on delete set null
);

create index notas_lead_id_idx on notas (lead_id, fecha desc);

-- ── Triggers ────────────────────────────────────────────────────────────────
create or replace function tocar_actualizado_en()
returns trigger language plpgsql as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

create trigger leads_actualizado_en
  before update on leads
  for each row execute function tocar_actualizado_en();

-- Registra automáticamente los cambios de estado y de clínica como nota de sistema,
-- para que el historial del lead cuente la verdad completa sin trabajo manual.
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
  return new;
end;
$$;

create trigger leads_registrar_cambios
  after update on leads
  for each row execute function registrar_cambios_lead();

-- Crea el perfil automáticamente al dar de alta un usuario en Supabase Auth,
-- leyendo rol y clínica de los metadatos del usuario.
create or replace function crear_perfil_para_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into perfiles (id, nombre, email, rol, clinica)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data ->> 'rol')::rol_usuario, 'recepcion'),
    (new.raw_user_meta_data ->> 'clinica')::clinica
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function crear_perfil_para_usuario();

-- ── Row Level Security ──────────────────────────────────────────────────────
-- Decisión de producto: admin (gerencia) ve las tres clínicas; recepción solo la
-- suya. Se aplica en la base de datos, no solo en la UI.

create or replace function es_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and rol = 'admin');
$$;

create or replace function mi_clinica()
returns clinica language sql stable security definer set search_path = public as $$
  select clinica from perfiles where id = auth.uid();
$$;

create or replace function puedo_ver_lead(lead uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from leads l
    where l.id = lead and (es_admin() or l.clinica = mi_clinica())
  );
$$;

alter table perfiles enable row level security;
alter table leads    enable row level security;
alter table notas    enable row level security;

-- Perfiles: cada quien ve el suyo; el admin ve todos.
create policy "perfiles visibles" on perfiles for select
  to authenticated using (id = auth.uid() or es_admin());

-- Leads: visibles y editables según clínica.
create policy "leads visibles" on leads for select
  to authenticated using (es_admin() or clinica = mi_clinica());

create policy "leads creables" on leads for insert
  to authenticated with check (es_admin() or clinica = mi_clinica());

create policy "leads editables" on leads for update
  to authenticated using (es_admin() or clinica = mi_clinica())
  with check (es_admin() or clinica = mi_clinica());

create policy "leads borrables" on leads for delete
  to authenticated using (es_admin() or clinica = mi_clinica());

-- Notas: heredan la visibilidad del lead al que pertenecen.
create policy "notas visibles" on notas for select
  to authenticated using (puedo_ver_lead(lead_id));

create policy "notas creables" on notas for insert
  to authenticated with check (puedo_ver_lead(lead_id));

create policy "notas borrables" on notas for delete
  to authenticated using (puedo_ver_lead(lead_id));
