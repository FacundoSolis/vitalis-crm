/** Vocabulario del CRM de Vitalis: valores, etiquetas y estilos compartidos. */

export const CLINICAS = ['Madrid', 'Valencia', 'Sevilla'] as const
export const TRATAMIENTOS = ['implantes', 'ortodoncia', 'estetica', 'revision'] as const
export const FUENTES = ['instagram', 'web', 'llamada'] as const
export const ESTADOS = [
  'nuevo',
  'contactado',
  'cita_agendada',
  'no_interesado',
  'cliente',
] as const
export const TIPOS_NOTA = ['llamada', 'mensaje', 'mensaje_ia', 'sistema'] as const

export type Clinica = (typeof CLINICAS)[number]
export type Tratamiento = (typeof TRATAMIENTOS)[number]
export type Fuente = (typeof FUENTES)[number]
export type Estado = (typeof ESTADOS)[number]
export type TipoNota = (typeof TIPOS_NOTA)[number]

export type Lead = {
  id: string
  nombre: string
  telefono: string
  email: string | null
  clinica: Clinica
  tratamiento: Tratamiento
  fuente: Fuente
  estado: Estado
  fecha_cita: string | null
  creado_en: string
  actualizado_en: string
  telefono_normalizado: string
}

export type Nota = {
  id: string
  lead_id: string
  texto: string
  tipo: TipoNota
  fecha: string
  autor_id: string | null
}

export const ETIQUETA_TRATAMIENTO: Record<Tratamiento, string> = {
  implantes: 'Implantes',
  ortodoncia: 'Ortodoncia',
  estetica: 'Estética dental',
  revision: 'Revisión',
}

export const ETIQUETA_FUENTE: Record<Fuente, string> = {
  instagram: 'Instagram',
  web: 'Formulario web',
  llamada: 'Llamada',
}

export const ETIQUETA_ESTADO: Record<Estado, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  cita_agendada: 'Cita agendada',
  no_interesado: 'No interesado',
  cliente: 'Cliente',
}

export const ETIQUETA_TIPO_NOTA: Record<TipoNota, string> = {
  llamada: 'Llamada',
  mensaje: 'Mensaje',
  mensaje_ia: 'Mensaje generado por IA',
  sistema: 'Cambio registrado',
}

/**
 * Colores del embudo. Cuatro tonos bien separados entre sí (ámbar, cielo,
 * violeta, esmeralda) más un neutro para la salida, de forma que el estado se
 * lea de un vistazo sin confundirse con el índigo, que se reserva para acciones.
 */
export const COLOR_ESTADO: Record<Estado, string> = {
  nuevo: 'border-amber-500/30 bg-amber-500/12 text-amber-700 dark:text-amber-300',
  contactado: 'border-sky-500/30 bg-sky-500/12 text-sky-700 dark:text-sky-300',
  cita_agendada:
    'border-violet-500/30 bg-violet-500/12 text-violet-700 dark:text-violet-300',
  cliente:
    'border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
  no_interesado: 'border-border bg-muted text-muted-foreground',
}

/** Punto de color sólido, para la tabla, donde el badge completo pesa demasiado. */
export const PUNTO_ESTADO: Record<Estado, string> = {
  nuevo: 'bg-amber-500',
  contactado: 'bg-sky-500',
  cita_agendada: 'bg-violet-500',
  cliente: 'bg-emerald-500',
  no_interesado: 'bg-muted-foreground/40',
}

/** Orden real del embudo, para ordenar y para leer el progreso. */
export const ORDEN_EMBUDO: Estado[] = [
  'nuevo',
  'contactado',
  'cita_agendada',
  'cliente',
  'no_interesado',
]

/** Los implantes son el tratamiento de mayor valor: se marcan para priorizarlos. */
export const ES_ALTO_VALOR: Record<Tratamiento, boolean> = {
  implantes: true,
  ortodoncia: true,
  estetica: false,
  revision: false,
}

export function normalizarTelefono(telefono: string) {
  return telefono.replace(/\D/g, '').replace(/^34(?=\d{9}$)/, '')
}

export function formatearFecha(iso: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

/**
 * Las tres sedes están en España, así que una cita a las 17:00 son las 17:00 de
 * la clínica: se escriba desde donde se escriba y se lea desde donde se lea
 * —incluido el servidor, que corre en UTC—. Todo lo que toca `fecha_cita` pasa
 * por esta zona para que la hora que ve el paciente y la que ve el equipo sean
 * la misma.
 */
const ZONA_CLINICA = 'Europe/Madrid'

/** «vie, 12 sept, 17:00» — para la tabla y la ficha. */
export function formatearCita(iso: string) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: ZONA_CLINICA,
  }).format(new Date(iso))
}

/** «viernes, 12 de septiembre, 17:00» — para el mensaje de WhatsApp. */
export function formatearCitaLarga(iso: string) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: ZONA_CLINICA,
  }).format(new Date(iso))
}

/** El valor que espera un `<input type="datetime-local">`: `2026-09-12T17:00`. */
export function paraInputCita(iso: string) {
  // sv-SE ya da «2026-09-12 17:00»; solo hay que cambiar el espacio por la T.
  return new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: ZONA_CLINICA,
  })
    .format(new Date(iso))
    .replace(' ', 'T')
}

/** Cuánto se adelanta la hora de la clínica sobre UTC en ese instante. */
function desfaseClinica(t: number) {
  return Date.parse(`${paraInputCita(new Date(t).toISOString())}:00Z`) - t
}

/**
 * El camino de vuelta: lo que escribió el formulario es hora de la clínica, no
 * hora del navegador. La segunda pasada es por los dos fines de semana al año en
 * que el desfase cambia y la primera estimación se queda a una hora.
 */
export function citaDesdeInput(valor: string) {
  // Con el campo vacío esto era `Date.parse(':00Z')`, que NO es NaN: V8 lo lee
  // como el 1 de enero de 2000 y colaba una cita fantasma en cada alta. Se
  // exige la forma completa que manda `datetime-local` en vez de fiarse.
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(valor)) return null
  const enPared = Date.parse(`${valor}:00Z`)
  if (Number.isNaN(enPared)) return null
  const aproximado = enPared - desfaseClinica(enPared)
  return new Date(enPared - desfaseClinica(aproximado)).toISOString()
}

export function formatearFechaHora(iso: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

/** «hace 3 días», para que se vea de un vistazo qué lead se está enfriando. */
export function haceCuanto(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const dias = Math.floor(ms / 864e5)
  if (dias === 0) return 'hoy'
  if (dias === 1) return 'ayer'
  if (dias < 30) return `hace ${dias} días`
  const meses = Math.floor(dias / 30)
  return meses === 1 ? 'hace 1 mes' : `hace ${meses} meses`
}
