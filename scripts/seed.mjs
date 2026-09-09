// Crea los usuarios de prueba de Vitalis y siembra leads + notas de ejemplo.
// Uso: pnpm seed
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key)
  throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')

const db = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PASSWORD = 'Vitalis2026!'
const USUARIOS = [
  { email: 'gerencia@vitalis.es', nombre: 'Marta Ferrer', rol: 'admin', clinica: null },
  {
    email: 'madrid@vitalis.es',
    nombre: 'Lucía Ramos',
    rol: 'recepcion',
    clinica: 'Madrid',
  },
  {
    email: 'valencia@vitalis.es',
    nombre: 'Sergio Bataller',
    rol: 'recepcion',
    clinica: 'Valencia',
  },
]

const hace = (dias, horas = 0) =>
  new Date(Date.now() - dias * 864e5 - horas * 36e5).toISOString()

// Las citas de ejemplo se sitúan en días concretos a horas de clínica. Ojo: la
// hora local de quien lanza el seed NO sirve, aunque esté en España —Canarias va
// una hora por detrás de Madrid, y desde fuera el desfase es cualquiera—. Se
// construye siempre en la zona de la clínica, igual que `citaDesdeInput`.
const ZONA_CLINICA = 'Europe/Madrid'

const enZonaClinica = (t) =>
  new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: ZONA_CLINICA,
  })
    .format(new Date(t))
    .replace(' ', 'T')

/** Cuánto se adelanta la hora de la clínica sobre UTC en ese instante. */
const desfaseClinica = (t) => Date.parse(`${enZonaClinica(t)}:00Z`) - t

const dentroDe = (dias, hora, minuto = 0) => {
  const dia = enZonaClinica(Date.now() + dias * 864e5).slice(0, 10)
  const hh = String(hora).padStart(2, '0')
  const mm = String(minuto).padStart(2, '0')
  const enPared = Date.parse(`${dia}T${hh}:${mm}:00Z`)
  // Segunda pasada por los dos fines de semana al año en que cambia el desfase.
  const aproximado = enPared - desfaseClinica(enPared)
  return new Date(enPared - desfaseClinica(aproximado)).toISOString()
}

const LEADS = [
  {
    nombre: 'Ana Belén Cortés',
    telefono: '+34 611 245 890',
    email: 'anabelen.cortes@gmail.com',
    clinica: 'Madrid',
    tratamiento: 'implantes',
    fuente: 'instagram',
    estado: 'nuevo',
    dias: 0,
    notas: [],
  },
  {
    nombre: 'Javier Ruiz Molina',
    telefono: '622 118 304',
    email: null,
    clinica: 'Madrid',
    tratamiento: 'implantes',
    fuente: 'llamada',
    estado: 'cita_agendada',
    cita: dentroDe(2, 18, 30),
    dias: 3,
    notas: [
      {
        tipo: 'llamada',
        texto:
          'Llama preguntando por implante unitario en molar inferior. Le paso presupuesto orientativo y le agendo primera visita.',
      },
    ],
  },
  {
    nombre: 'Carmen Villalba',
    telefono: '+34 655 902 117',
    email: 'cvillalba@hotmail.com',
    clinica: 'Valencia',
    tratamiento: 'ortodoncia',
    fuente: 'web',
    estado: 'contactado',
    dias: 5,
    notas: [
      { tipo: 'llamada', texto: 'No coge el teléfono, salta buzón.' },
      {
        tipo: 'mensaje',
        texto:
          'Le mando WhatsApp presentándome y ofreciendo primera visita gratuita. Leído, sin respuesta todavía.',
      },
    ],
  },
  {
    nombre: 'Diego Santamaría',
    telefono: '699 340 118',
    email: null,
    clinica: 'Sevilla',
    tratamiento: 'estetica',
    fuente: 'instagram',
    estado: 'nuevo',
    dias: 1,
    notas: [],
  },
  {
    nombre: 'Nuria Pastor Gil',
    telefono: '+34 611 245 890',
    email: 'nuria.pastor@gmail.com',
    clinica: 'Madrid',
    tratamiento: 'revision',
    fuente: 'web',
    estado: 'nuevo',
    dias: 0,
    notas: [],
  }, // ← mismo teléfono que Ana Belén: dispara el aviso de duplicado
  {
    nombre: 'Rafael Ortega',
    telefono: '634 771 205',
    email: null,
    clinica: 'Valencia',
    tratamiento: 'implantes',
    fuente: 'llamada',
    estado: 'cliente',
    dias: 21,
    notas: [
      {
        tipo: 'llamada',
        texto: 'Acepta presupuesto de 3 implantes. Primera fase el 12.',
      },
    ],
  },
  {
    nombre: 'Elena Vázquez',
    telefono: '+34 688 512 663',
    email: 'elenavq@outlook.es',
    clinica: 'Sevilla',
    tratamiento: 'ortodoncia',
    fuente: 'instagram',
    estado: 'contactado',
    dias: 8,
    notas: [
      {
        tipo: 'mensaje',
        texto:
          'Pregunta por ortodoncia invisible. Le explico que la primera visita incluye escáner 3D.',
      },
    ],
  },
  {
    nombre: 'Marcos Iglesias',
    telefono: '677 003 941',
    email: null,
    clinica: 'Madrid',
    tratamiento: 'implantes',
    fuente: 'web',
    estado: 'no_interesado',
    dias: 14,
    notas: [
      {
        tipo: 'llamada',
        texto:
          'Ha encontrado precio más bajo en otra clínica. Prefiere no seguir de momento.',
      },
    ],
  },
  {
    nombre: 'Silvia Andrade',
    telefono: '+34 640 228 507',
    email: 'sandrade@gmail.com',
    clinica: 'Valencia',
    tratamiento: 'estetica',
    fuente: 'instagram',
    estado: 'cita_agendada',
    cita: dentroDe(5, 10, 0),
    dias: 2,
    notas: [
      {
        tipo: 'mensaje',
        texto: 'Quiere carillas antes de una boda en junio. Le doy cita para verla.',
      },
    ],
  },
  {
    nombre: 'Tomás Berenguer',
    telefono: '618 449 730',
    email: null,
    clinica: 'Sevilla',
    tratamiento: 'implantes',
    fuente: 'llamada',
    estado: 'contactado',
    dias: 6,
    notas: [
      {
        tipo: 'llamada',
        texto:
          'Le interesa financiación a 12 meses. Pide que le llamemos la semana que viene.',
      },
    ],
  },
  {
    nombre: 'Patricia Nogueira',
    telefono: '+34 693 810 224',
    email: 'pnogueira@gmail.com',
    clinica: 'Madrid',
    tratamiento: 'ortodoncia',
    fuente: 'instagram',
    estado: 'nuevo',
    dias: 0,
    notas: [],
  },
  {
    nombre: 'Álvaro Cebrián',
    telefono: '627 335 619',
    email: null,
    clinica: 'Valencia',
    tratamiento: 'revision',
    fuente: 'web',
    estado: 'cliente',
    dias: 30,
    notas: [
      {
        tipo: 'llamada',
        texto: 'Revisión anual hecha. Sin caries, próxima cita en 12 meses.',
      },
    ],
  },
  {
    nombre: 'Beatriz Salgado',
    telefono: '+34 652 907 448',
    email: 'bsalgado@yahoo.es',
    clinica: 'Sevilla',
    tratamiento: 'estetica',
    fuente: 'web',
    estado: 'nuevo',
    dias: 1,
    notas: [],
  },
  {
    nombre: 'Óscar Prieto',
    telefono: '600 774 182',
    email: null,
    clinica: 'Madrid',
    tratamiento: 'implantes',
    fuente: 'instagram',
    estado: 'contactado',
    dias: 4,
    notas: [
      {
        tipo: 'mensaje',
        texto:
          'Le mando WhatsApp con enlace al caso antes/después. Responde que se lo piensa.',
      },
    ],
  },
  {
    nombre: 'Lorena Ibáñez',
    telefono: '+34 671 226 093',
    email: 'lorena.ib@gmail.com',
    clinica: 'Valencia',
    tratamiento: 'ortodoncia',
    fuente: 'llamada',
    estado: 'cita_agendada',
    cita: dentroDe(1, 16, 0),
    dias: 1,
    notas: [
      {
        tipo: 'llamada',
        texto: 'Ortodoncia para su hija de 14 años. Le doy cita por la tarde.',
      },
    ],
  },
  {
    nombre: 'Guillermo Estévez',
    telefono: '682 550 371',
    email: null,
    clinica: 'Sevilla',
    tratamiento: 'revision',
    fuente: 'llamada',
    estado: 'no_interesado',
    dias: 11,
    notas: [],
  },
  {
    nombre: 'Rocío Marín',
    telefono: '+34 645 118 902',
    email: 'rmarin@gmail.com',
    clinica: 'Madrid',
    tratamiento: 'estetica',
    fuente: 'instagram',
    estado: 'nuevo',
    dias: 2,
    notas: [],
  },
  {
    nombre: 'Fernando Aguilar',
    telefono: '698 201 745',
    email: null,
    clinica: 'Valencia',
    tratamiento: 'implantes',
    fuente: 'web',
    estado: 'contactado',
    dias: 9,
    notas: [
      {
        tipo: 'llamada',
        texto:
          'Le falta una pieza desde hace años. Duda entre implante y puente. Enviar comparativa.',
      },
    ],
  },
]

async function main() {
  console.log('→ Creando usuarios de prueba…')
  const idPorEmail = {}
  for (const u of USUARIOS) {
    const { data: existentes } = await db.auth.admin.listUsers({ perPage: 200 })
    const ya = existentes?.users.find((x) => x.email === u.email)
    if (ya) {
      idPorEmail[u.email] = ya.id
      console.log(`   · ${u.email} ya existía`)
      continue
    }
    const { data, error } = await db.auth.admin.createUser({
      email: u.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { nombre: u.nombre, rol: u.rol, clinica: u.clinica },
    })
    if (error) throw error
    idPorEmail[u.email] = data.user.id
    console.log(`   ✓ ${u.email} (${u.rol}${u.clinica ? ' · ' + u.clinica : ''})`)
  }

  const autorDe = (clinica) =>
    idPorEmail[
      clinica === 'Valencia'
        ? 'valencia@vitalis.es'
        : clinica === 'Madrid'
          ? 'madrid@vitalis.es'
          : 'gerencia@vitalis.es'
    ]

  console.log('→ Limpiando leads anteriores…')
  await db.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  console.log('→ Sembrando leads…')
  for (const l of LEADS) {
    const { data: lead, error } = await db
      .from('leads')
      .insert({
        nombre: l.nombre,
        telefono: l.telefono,
        email: l.email,
        clinica: l.clinica,
        tratamiento: l.tratamiento,
        fuente: l.fuente,
        estado: l.estado,
        fecha_cita: l.cita ?? null,
        creado_en: hace(l.dias, 3),
        actualizado_en: hace(l.dias, 1),
        creado_por: autorDe(l.clinica),
      })
      .select('id')
      .single()
    if (error) throw error

    for (const [i, n] of l.notas.entries()) {
      const { error: e2 } = await db.from('notas').insert({
        lead_id: lead.id,
        texto: n.texto,
        tipo: n.tipo,
        fecha: hace(Math.max(0, l.dias - i - 1), 2),
        autor_id: autorDe(l.clinica),
      })
      if (e2) throw e2
    }
  }

  console.log(`\n✓ Listo: ${USUARIOS.length} usuarios y ${LEADS.length} leads.`)
  console.log(`  Contraseña de todos los usuarios: ${PASSWORD}`)
}

main().catch((e) => {
  console.error('✗', e.message ?? e)
  process.exit(1)
})
