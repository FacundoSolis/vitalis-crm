// Ensaya en producción, con un navegador real, exactamente el guion del vídeo:
// crear → duplicado → generar con IA → editar → borrar. Si esto pasa, la
// demo en directo no se cae.
import { chromium } from 'playwright'

const BASE = process.argv[2] ?? 'https://vitalis-crm-one.vercel.app'
const navegador = await chromium.launch()
const ctx = await navegador.newContext({
  viewport: { width: 1440, height: 900 },
  locale: 'es-ES',
  permissions: ['clipboard-read', 'clipboard-write'],
})
const pag = await ctx.newPage()

const fallos = []
const paso = async (texto, fn) => {
  try {
    await fn()
    console.log(`  ✓ ${texto}`)
  } catch (e) {
    console.log(`  ✗ ${texto}\n      ${String(e).split('\n')[0]}`)
    fallos.push(texto)
  }
}

console.log(`\nEnsayo del guion del Loom contra ${BASE}\n`)

await paso('entra como gerencia', async () => {
  await pag.goto(`${BASE}/login`)
  await pag.getByRole('button', { name: /Gerencia/ }).click()
  await pag.getByRole('button', { name: 'Entrar', exact: true }).click()
  await pag.waitForURL(`${BASE}/`, { timeout: 25000 })
  await pag.getByRole('heading', { name: 'Leads', level: 1 }).waitFor({ timeout: 25000 })
})

await paso('filtra por clínica y por estado', async () => {
  await pag.getByLabel('Filtrar por estado').click()
  await pag.getByRole('option', { name: 'Cita agendada' }).click()
  await pag.waitForTimeout(1200)
  await pag.getByRole('button', { name: /Limpiar/ }).click()
  await pag.waitForTimeout(1200)
})

const NOMBRE = 'Ensayo Loom Paciente'
await paso('crea un lead con teléfono duplicado', async () => {
  await pag.getByRole('button', { name: /Nuevo lead/ }).click()
  await pag.getByLabel('Nombre y apellidos').fill(NOMBRE)
  await pag.getByLabel('Teléfono').fill('611 245 890') // el de Ana Belén
  await pag.getByRole('button', { name: 'Crear lead' }).click()
  await pag.getByText(NOMBRE).waitFor({ timeout: 25000 })
})

await paso('el aviso de duplicado aparece en el listado', async () => {
  const fila = pag.locator('div').filter({ hasText: NOMBRE }).last()
  await fila.getByText('repetido').waitFor({ timeout: 10000 })
})

await paso('abre la ficha', async () => {
  await pag
    .getByRole('link', { name: new RegExp(NOMBRE) })
    .first()
    .click()
  await pag.waitForURL(/\/leads\//, { timeout: 25000 })
  await pag.getByRole('heading', { level: 1, name: NOMBRE }).waitFor({ timeout: 25000 })
})

await paso('la ficha enlaza al posible duplicado', async () => {
  await pag.getByText('Posible duplicado').waitFor({ timeout: 10000 })
})

await paso('añade una nota a mano', async () => {
  await pag
    .getByPlaceholder(/Qué habéis hablado/)
    .fill('Llama preguntando por implantes. Pide presupuesto por WhatsApp.')
  await pag.getByRole('button', { name: 'Añadir nota' }).click()
  await pag.getByText(/Pide presupuesto por WhatsApp/).waitFor({ timeout: 25000 })
})

await paso('genera el mensaje con IA y lo guarda como nota', async () => {
  await pag.getByRole('button', { name: /Generar mensaje/ }).click()
  await pag.getByText('Mensaje generado por IA').waitFor({ timeout: 60000 })
})

await paso('el botón de copiar el mensaje funciona', async () => {
  await pag
    .getByRole('button', { name: /Copiar/ })
    .first()
    .click()
  await pag.getByText('Copiado').waitFor({ timeout: 10000 })
})

await paso('edita el lead y el cambio queda en el historial', async () => {
  await pag.getByRole('button', { name: 'Editar' }).click()
  await pag.getByLabel('Estado').click()
  await pag.getByRole('option', { name: 'Contactado' }).click()
  await pag.getByRole('button', { name: 'Guardar cambios' }).click()
  await pag.getByText(/nuevo → contactado/).waitFor({ timeout: 25000 })
})

await paso('borra el lead y vuelve al listado', async () => {
  pag.once('dialog', (d) => d.accept())
  await pag.getByRole('button', { name: 'Eliminar lead', exact: true }).click()
  await pag.waitForURL(`${BASE}/`, { timeout: 25000 })
  await pag.getByRole('heading', { name: 'Leads', level: 1 }).waitFor({ timeout: 25000 })
})

await paso('recepción de Madrid no ve los leads de otras clínicas', async () => {
  await pag.getByRole('button', { name: 'Cerrar sesión' }).click()
  await pag.waitForURL(/\/login/, { timeout: 25000 })
  await pag.getByRole('button', { name: /solo Madrid/ }).click()
  await pag.getByRole('button', { name: 'Entrar', exact: true }).click()
  await pag.waitForURL(`${BASE}/`, { timeout: 25000 })
  await pag.getByRole('heading', { name: 'Leads', level: 1 }).waitFor({ timeout: 25000 })
  const cuerpo = await pag.locator('body').innerText()
  if (cuerpo.includes('Rafael Ortega') || cuerpo.includes('Elena Vázquez')) {
    throw new Error('ve leads de Valencia o Sevilla')
  }
})

await navegador.close()
console.log(
  fallos.length
    ? `\n✗ ${fallos.length} pasos fallan\n`
    : '\n✓ El guion completo funciona en producción.\n',
)
process.exit(fallos.length ? 1 : 0)
