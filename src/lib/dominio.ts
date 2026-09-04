/** Vocabulario del CRM de Vitalis: valores, etiquetas y estilos compartidos. */

export const CLINICAS = ['Madrid', 'Valencia', 'Sevilla'] as const
export const TRATAMIENTOS = ['implantes', 'ortodoncia', 'estetica', 'revision'] as const
export const FUENTES = ['instagram', 'web', 'llamada'] as const
export const ESTADOS = ['nuevo', 'contactado', 'cita_agendada', 'no_interesado', 'cliente'] as const
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

/** Colores del embudo: de gris (frío) a verde (cerrado). */
export const COLOR_ESTADO: Record<Estado, string> = {
  nuevo:
    'bg-blue-500/10 text-blue-700 border-blue-500/25 dark:text-blue-300',
  contactado:
    'bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-amber-300',
  cita_agendada:
    'bg-violet-500/10 text-violet-700 border-violet-500/25 dark:text-violet-300',
  cliente:
    'bg-emerald-500/10 text-emerald-700 border-emerald-500/25 dark:text-emerald-300',
  no_interesado:
    'bg-neutral-500/10 text-neutral-600 border-neutral-500/25 dark:text-neutral-400',
}

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
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(iso))
}

export function formatearFechaHora(iso: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
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
