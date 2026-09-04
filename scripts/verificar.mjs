// Comprueba contra la base de datos real que los permisos por clínica funcionan.
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const CLAVE = 'Vitalis2026!'

async function como(email) {
  const c = createClient(url, anon, { auth: { persistSession: false } })
  const { error } = await c.auth.signInWithPassword({ email, password: CLAVE })
  if (error) throw new Error(`login ${email}: ${error.message}`)
  return c
}

const check = (ok, texto) => console.log(`  ${ok ? '✓' : '✗'} ${texto}`)
let fallos = 0
const exigir = (ok, texto) => {
  check(ok, texto)
  if (!ok) fallos++
}

console.log('\nRecepción de Madrid (madrid@vitalis.es)')
{
  const c = await como('madrid@vitalis.es')
  const { data: leads } = await c.from('leads').select('clinica')
  const clinicas = [...new Set(leads.map((l) => l.clinica))]
  exigir(
    clinicas.length === 1 && clinicas[0] === 'Madrid',
    `solo ve leads de Madrid (${leads.length} leads, clínicas: ${clinicas.join()})`,
  )

  const { error } = await c.from('leads').insert({
    nombre: 'Intruso',
    telefono: '600000000',
    clinica: 'Sevilla',
    tratamiento: 'implantes',
    fuente: 'web',
  })
  exigir(Boolean(error), 'no puede crear un lead en Sevilla (RLS lo bloquea)')

  const { data: propio, error: errorPropio } = await c
    .from('leads')
    .insert({
      nombre: 'Prueba Madrid',
      telefono: '+34 600 111 222',
      clinica: 'Madrid',
      tratamiento: 'ortodoncia',
      fuente: 'llamada',
    })
    .select('id, telefono_normalizado')
    .single()
  exigir(!errorPropio, 'sí puede crear un lead en Madrid')
  exigir(
    propio?.telefono_normalizado === '600111222',
    `el teléfono se normaliza para detectar duplicados (${propio?.telefono_normalizado})`,
  )

  // Cambiar el estado debe dejar rastro automático en el historial.
  await c.from('leads').update({ estado: 'contactado' }).eq('id', propio.id)
  const { data: notas } = await c
    .from('notas')
    .select('texto, tipo')
    .eq('lead_id', propio.id)
  exigir(
    notas?.some((n) => n.tipo === 'sistema' && n.texto.includes('nuevo → contactado')),
    'el cambio de estado se registra solo en el historial',
  )

  await c.from('leads').delete().eq('id', propio.id)
  const { data: tras } = await c.from('leads').select('id').eq('id', propio.id)
  exigir(tras?.length === 0, 'el borrado funciona y arrastra sus notas')
}

console.log('\nGerencia (gerencia@vitalis.es)')
{
  const c = await como('gerencia@vitalis.es')
  const { data: leads } = await c.from('leads').select('clinica')
  const clinicas = [...new Set(leads.map((l) => l.clinica))].sort()
  exigir(clinicas.length === 3, `ve las tres clínicas (${clinicas.join(', ')})`)

  const { data: dup } = await c
    .from('leads')
    .select('nombre')
    .eq('telefono_normalizado', '611245890')
  exigir(
    dup?.length === 2,
    `detecta el teléfono repetido: ${dup?.map((d) => d.nombre).join(' y ')}`,
  )
}

console.log('\nSin sesión')
{
  const c = createClient(url, anon, { auth: { persistSession: false } })
  const { data } = await c.from('leads').select('id')
  exigir(!data || data.length === 0, 'un anónimo no ve ningún lead')
}

console.log(
  fallos === 0 ? '\n✓ Todo correcto.\n' : `\n✗ ${fallos} comprobaciones fallidas.\n`,
)
process.exit(fallos === 0 ? 0 : 1)
