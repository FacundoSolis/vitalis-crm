'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { clienteServidor, perfilActual } from '@/lib/supabase/servidor'
import {
  CLINICAS,
  ESTADOS,
  FUENTES,
  TRATAMIENTOS,
  TIPOS_NOTA,
  normalizarTelefono,
  type Clinica,
  type Estado,
} from '@/lib/dominio'

export type Resultado = { ok: true } | { ok: false; error: string }

const esquemaLead = z.object({
  nombre: z.string().trim().min(2, 'El nombre es obligatorio.'),
  telefono: z
    .string()
    .trim()
    .refine(
      (t) => normalizarTelefono(t).length >= 9,
      'El teléfono debe tener al menos 9 dígitos.',
    ),
  email: z.string().trim().email('El email no es válido.').or(z.literal('')).nullable(),
  clinica: z.enum(CLINICAS),
  tratamiento: z.enum(TRATAMIENTOS),
  fuente: z.enum(FUENTES),
  estado: z.enum(ESTADOS),
})

function leerFormulario(datos: FormData) {
  return esquemaLead.safeParse({
    nombre: datos.get('nombre'),
    telefono: datos.get('telefono'),
    email: datos.get('email') || null,
    clinica: datos.get('clinica'),
    tratamiento: datos.get('tratamiento'),
    fuente: datos.get('fuente'),
    estado: datos.get('estado') ?? 'nuevo',
  })
}

export async function crearLead(datos: FormData): Promise<Resultado> {
  const perfil = await perfilActual()
  const validado = leerFormulario(datos)
  if (!validado.success) return { ok: false, error: validado.error.issues[0].message }

  const supabase = await clienteServidor()
  const { error } = await supabase.from('leads').insert({
    ...validado.data,
    email: validado.data.email || null,
    creado_por: perfil.id,
  })

  if (error) return { ok: false, error: traducirError(error.message) }
  revalidatePath('/')
  return { ok: true }
}

export async function actualizarLead(id: string, datos: FormData): Promise<Resultado> {
  await perfilActual()
  const validado = leerFormulario(datos)
  if (!validado.success) return { ok: false, error: validado.error.issues[0].message }

  const supabase = await clienteServidor()
  const { error } = await supabase
    .from('leads')
    .update({ ...validado.data, email: validado.data.email || null })
    .eq('id', id)

  if (error) return { ok: false, error: traducirError(error.message) }
  revalidatePath('/')
  revalidatePath(`/leads/${id}`)
  return { ok: true }
}

/** Cambio rápido de estado desde el listado, sin abrir la ficha. */
export async function cambiarEstado(id: string, estado: string): Promise<Resultado> {
  await perfilActual()
  const validado = z.enum(ESTADOS).safeParse(estado)
  if (!validado.success) return { ok: false, error: 'Estado no válido.' }

  const supabase = await clienteServidor()
  const { error } = await supabase
    .from('leads')
    .update({ estado: validado.data })
    .eq('id', id)

  if (error) return { ok: false, error: traducirError(error.message) }
  revalidatePath('/')
  revalidatePath(`/leads/${id}`)
  return { ok: true }
}

// ── Paciente que ya existe en otra clínica ──────────────────────────────────

export type PacienteEnOtraClinica = {
  id: string
  nombre: string
  clinica: Clinica
  estado: Estado
  creado_en: string
}

/**
 * Pregunta acotada: ¿este teléfono ya está dado de alta en otra clínica? Devuelve
 * lo justo para reconocer al paciente en el mostrador, nunca su historial. Para
 * gerencia siempre vuelve vacía, porque ya ve las tres clínicas.
 */
export async function buscarPacienteEnOtrasClinicas(
  telefono: string,
): Promise<PacienteEnOtraClinica[]> {
  await perfilActual()
  if (normalizarTelefono(telefono).length < 9) return []

  const supabase = await clienteServidor()
  const { data, error } = await supabase.rpc('buscar_paciente_en_otras_clinicas', {
    telefono_buscado: telefono,
  })

  // Si la consulta falla, el alta sigue su curso: esto es una ayuda, no un filtro.
  if (error) return []
  return (data ?? []) as PacienteEnOtraClinica[]
}

/** Trae a la clínica propia un lead encontrado con la búsqueda anterior. */
export async function reclamarLead(id: string, telefono: string): Promise<Resultado> {
  await perfilActual()
  const supabase = await clienteServidor()
  const { error } = await supabase.rpc('reclamar_lead', {
    lead_id: id,
    telefono_buscado: telefono,
  })

  if (error) return { ok: false, error: traducirError(error.message) }
  revalidatePath('/')
  revalidatePath(`/leads/${id}`)
  return { ok: true }
}

export async function eliminarLead(id: string): Promise<Resultado> {
  await perfilActual()
  const supabase = await clienteServidor()
  const { error } = await supabase.from('leads').delete().eq('id', id)

  if (error) return { ok: false, error: traducirError(error.message) }
  revalidatePath('/')
  return { ok: true }
}

export async function eliminarLeadYVolver(id: string) {
  const resultado = await eliminarLead(id)
  if (resultado.ok) redirect('/')
  return resultado
}

// ── Notas ───────────────────────────────────────────────────────────────────

export async function crearNota(leadId: string, datos: FormData): Promise<Resultado> {
  const perfil = await perfilActual()
  const validado = z
    .object({
      texto: z.string().trim().min(1, 'La nota no puede estar vacía.'),
      tipo: z.enum(TIPOS_NOTA),
    })
    .safeParse({ texto: datos.get('texto'), tipo: datos.get('tipo') ?? 'llamada' })

  if (!validado.success) return { ok: false, error: validado.error.issues[0].message }

  const supabase = await clienteServidor()
  const { error } = await supabase
    .from('notas')
    .insert({ lead_id: leadId, ...validado.data, autor_id: perfil.id })

  if (error) return { ok: false, error: traducirError(error.message) }
  revalidatePath(`/leads/${leadId}`)
  return { ok: true }
}

export async function eliminarNota(id: string, leadId: string): Promise<Resultado> {
  await perfilActual()
  const supabase = await clienteServidor()
  const { error } = await supabase.from('notas').delete().eq('id', id)

  if (error) return { ok: false, error: traducirError(error.message) }
  revalidatePath(`/leads/${leadId}`)
  return { ok: true }
}

/** Los errores de RLS de Postgres son crípticos; se traducen a algo accionable. */
function traducirError(mensaje: string) {
  if (mensaje.includes('row-level security')) {
    return 'No tienes permiso sobre esa clínica. Solo gerencia puede trabajar con las tres.'
  }
  return mensaje
}
