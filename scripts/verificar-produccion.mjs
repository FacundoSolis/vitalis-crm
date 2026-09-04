// Inicia sesión de verdad y pide el panel a producción con esa cookie,
// como haría el navegador. Comprueba que el SSR y los permisos funcionan allí.
import { createClient } from '@supabase/supabase-js'

const BASE = process.argv[2] ?? 'https://vitalis-crm-one.vercel.app'
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const ref = new URL(url).hostname.split('.')[0]

let fallos = 0
const exigir = (ok, texto) => { console.log(`  ${ok ? '✓' : '✗'} ${texto}`); if (!ok) fallos++ }

/** Reproduce el formato de cookie de @supabase/ssr, troceada si hace falta. */
function cookieDeSesion(sesion) {
  const valor = 'base64-' + Buffer.from(JSON.stringify(sesion)).toString('base64url')
  const nombre = `sb-${ref}-auth-token`
  if (valor.length <= 3180) return `${nombre}=${valor}`
  const trozos = valor.match(/.{1,3180}/g)
  return trozos.map((t, i) => `${nombre}.${i}=${t}`).join('; ')
}

async function panelComo(email) {
  const c = createClient(url, anon, { auth: { persistSession: false } })
  const { data, error } = await c.auth.signInWithPassword({ email, password: 'Vitalis2026!' })
  if (error) throw new Error(`${email}: ${error.message}`)

  const r = await fetch(`${BASE}/`, {
    headers: { cookie: cookieDeSesion(data.session) },
    redirect: 'manual',
  })
  return { estado: r.status, html: await r.text() }
}

console.log(`\nProducción: ${BASE}`)

{
  const r = await fetch(`${BASE}/`, { redirect: 'manual' })
  exigir(r.status === 307, `sin sesión la raíz redirige al login (${r.status})`)
}

console.log('\nGerencia')
{
  const { estado, html } = await panelComo('gerencia@vitalis.es')
  exigir(estado === 200, `el panel renderiza en servidor (${estado})`)
  exigir(html.includes('Marta Ferrer'), 'muestra el nombre de quien ha entrado')
  exigir(html.includes('Las tres clínicas'), 'indica que ve las tres clínicas')
  for (const nombre of ['Ana Belén Cortés', 'Rafael Ortega', 'Elena Vázquez']) {
    exigir(html.includes(nombre), `ve el lead de ${nombre}`)
  }
  exigir(html.includes('repetido'), 'marca el teléfono repetido en el listado')
}

console.log('\nRecepción de Madrid')
{
  const { estado, html } = await panelComo('madrid@vitalis.es')
  exigir(estado === 200, `el panel renderiza en servidor (${estado})`)
  exigir(html.includes('Clínica de Madrid'), 'indica que su alcance es solo Madrid')
  exigir(html.includes('Ana Belén Cortés'), 've un lead de Madrid')
  exigir(!html.includes('Rafael Ortega'), 'NO ve el lead de Valencia (Rafael Ortega)')
  exigir(!html.includes('Elena Vázquez'), 'NO ve el lead de Sevilla (Elena Vázquez)')
}

console.log(fallos === 0 ? '\n✓ Producción correcta.\n' : `\n✗ ${fallos} fallos.\n`)
process.exit(fallos === 0 ? 0 : 1)
