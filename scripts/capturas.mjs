// Abre la app con un navegador real, hace login y captura las pantallas clave.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.argv[2] ?? 'http://localhost:3000'
const DIR =
  process.argv[3] ??
  '/private/tmp/claude-501/-Users-fakun-Desktop-proyectos-albert-prueba/25e55769-6e94-472e-ac1a-ff61febfb015/scratchpad/capturas'
mkdirSync(DIR, { recursive: true })

const navegador = await chromium.launch()
const errores = []

async function sesion(tema) {
  const ctx = await navegador.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: tema,
    locale: 'es-ES',
  })
  const pag = await ctx.newPage()
  pag.on('console', (m) => {
    if (m.type() === 'error') errores.push(`[${tema}] ${m.text()}`)
  })
  pag.on('pageerror', (e) => errores.push(`[${tema}] ${e.message}`))
  return { ctx, pag }
}

for (const tema of ['light', 'dark']) {
  const { ctx, pag } = await sesion(tema)

  await pag.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await pag.screenshot({ path: `${DIR}/1-login-${tema}.png` })

  // Entrar como gerencia usando el atajo de usuarios de prueba.
  await pag.getByRole('button', { name: /Gerencia/ }).click()
  await pag.getByRole('button', { name: 'Entrar', exact: true }).click()
  await pag.waitForURL(`${BASE}/`, { timeout: 20000 })
  // El esqueleto de carga se parece al contenido real: hay que esperar a un
  // dato que solo existe cuando la consulta ha terminado.
  await pag.getByRole('heading', { name: 'Leads', level: 1 }).waitFor({ timeout: 20000 })
  await pag.locator('a[href^="/leads/"]').first().waitFor({ timeout: 20000 })
  await pag.waitForLoadState('networkidle')
  await pag.screenshot({ path: `${DIR}/2-listado-${tema}.png`, fullPage: true })

  // Abrir la ficha del primer lead.
  await pag.locator('a[href^="/leads/"]').first().click()
  await pag.waitForURL(/\/leads\//, { timeout: 20000 })
  await pag.getByRole('heading', { level: 1 }).waitFor({ timeout: 20000 })
  await pag.getByRole('button', { name: /Generar mensaje/ }).waitFor({ timeout: 20000 })
  await pag.waitForLoadState('networkidle')
  await pag.screenshot({ path: `${DIR}/3-ficha-${tema}.png`, fullPage: true })

  if (tema === 'light') {
    // Diálogo de creación.
    await pag.goto(`${BASE}/`, { waitUntil: 'networkidle' })
    await pag.getByRole('button', { name: /Nuevo lead/ }).click()
    await pag.waitForTimeout(400)
    await pag.screenshot({ path: `${DIR}/4-dialogo.png` })
  }

  await ctx.close()
}

// Móvil
{
  const ctx = await navegador.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    locale: 'es-ES',
  })
  const pag = await ctx.newPage()
  await pag.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await pag.getByRole('button', { name: /Gerencia/ }).click()
  await pag.getByRole('button', { name: 'Entrar', exact: true }).click()
  await pag.waitForURL(`${BASE}/`, { timeout: 20000 })
  await pag.locator('a[href^="/leads/"]').first().waitFor({ timeout: 20000 })
  await pag.waitForLoadState('networkidle')
  await pag.screenshot({ path: `${DIR}/5-movil.png`, fullPage: true })
  await ctx.close()
}

await navegador.close()
console.log(`capturas en ${DIR}`)
if (errores.length) {
  console.log('\nErrores de consola:')
  errores.slice(0, 10).forEach((e) => console.log('  ' + e))
} else console.log('sin errores de consola')
