'use server'

import OpenAI from 'openai'
import { revalidatePath } from 'next/cache'
import { clienteServidor, perfilActual } from '@/lib/supabase/servidor'
import {
  ETIQUETA_ESTADO,
  ETIQUETA_FUENTE,
  ETIQUETA_TRATAMIENTO,
  formatearCitaLarga,
  haceCuanto,
  type Lead,
  type Nota,
} from '@/lib/dominio'

/** Configurable por entorno para poder cambiar de modelo sin tocar el código. */
const MODELO = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'

export type ResultadoIA = { ok: true; mensaje: string } | { ok: false; error: string }

/**
 * Tono elegido para Vitalis (decisión de producto, ver README):
 * cercano pero profesional, de tú, español de España. Sin diagnósticos,
 * sin precios y sin promesas clínicas — eso lo dice el dentista, no un CRM.
 */
const INSTRUCCIONES = `Eres la recepcionista de Clínica Dental Vitalis, una clínica con sedes en Madrid, Valencia y Sevilla.

Escribes el borrador de un mensaje de WhatsApp de seguimiento para un paciente potencial. Una persona del equipo lo revisará antes de enviarlo.

Cómo escribes:
- En español de España, tuteando, cercano pero profesional. Nada de márketing agresivo ni exceso de emojis (como mucho uno, y solo si encaja).
- Entre 30 y 60 palabras. Es un WhatsApp, no un email.
- Empiezas saludando por el nombre de pila y te presentas como el equipo de Vitalis mencionando su sede.
- Haces referencia concreta al tratamiento que le interesa y a lo último que sabemos de él (mira las notas del historial).
- Terminas con UNA llamada a la acción clara y fácil de responder.

Límites que no cruzas nunca:
- No das precios, ni presupuestos, ni rangos de precio.
- No haces diagnósticos ni prometes resultados clínicos.
- No te inventas promociones ni datos que no aparezcan en la ficha.
- La única fecha que puedes escribir es la cita que viene en la ficha, tal cual. Si la ficha dice que no hay cita, no mencionas ninguna fecha ni das por hecho que exista.
- No usas asteriscos, markdown ni encabezados. Es texto plano de WhatsApp.

Cómo adaptas el mensaje al estado del lead:
- nuevo: primer contacto. Agradeces su interés y ofreces resolver dudas o agendar una primera visita.
- contactado: ya hablamos con él y no ha respondido. Retomas con naturalidad, sin reprochar el silencio.
- cita_agendada: recuerdas la cita diciendo el día y la hora que aparecen en la ficha, confirmas que le sigue viniendo bien y ofreces cambiarla si no. Si la ficha no tiene fecha, pides que te confirme el día que habíais hablado en vez de inventarte uno.
- no_interesado: mensaje breve, sin presión, dejando la puerta abierta para el futuro.
- cliente: seguimiento post-tratamiento. Interesarte por cómo va y recordar la revisión.

Respondes ÚNICAMENTE con el texto del mensaje. Sin comillas, sin preámbulos, sin explicaciones.`

/** «es dentro de 3 días», «fue ayer»: el modelo necesita saber si la cita ya pasó. */
function cuandoEsLaCita(iso: string) {
  const dias = Math.round((new Date(iso).getTime() - Date.now()) / 864e5)
  if (dias === 0) return 'es hoy'
  if (dias === 1) return 'es mañana'
  if (dias > 1) return `es dentro de ${dias} días`
  if (dias === -1) return 'fue ayer'
  return `fue hace ${Math.abs(dias)} días`
}

function fichaDelLead(lead: Lead, notas: Nota[]) {
  const historial = notas.length
    ? notas
        .slice(0, 5)
        .map((n) => `- (${haceCuanto(n.fecha)}) ${n.texto}`)
        .join('\n')
    : '- Todavía no hay ningún contacto registrado.'

  // Sin esta línea el modelo tenía que recordar una cita cuya fecha no le
  // habíamos dado, y el prompt le prohíbe inventársela: salían recordatorios sin
  // día ni hora, justo lo que hay que decir en un recordatorio.
  const cita = lead.fecha_cita
    ? `${formatearCitaLarga(lead.fecha_cita)} (${cuandoEsLaCita(lead.fecha_cita)})`
    : 'no hay ninguna cita puesta en la ficha'

  return `Nombre: ${lead.nombre}
Sede de interés: ${lead.clinica}
Tratamiento: ${ETIQUETA_TRATAMIENTO[lead.tratamiento]}
Estado actual: ${lead.estado} (${ETIQUETA_ESTADO[lead.estado]})
Cita: ${cita}
Cómo nos llegó: ${ETIQUETA_FUENTE[lead.fuente]}
Entró en la base de datos: ${haceCuanto(lead.creado_en)}

Historial de contactos (de más reciente a más antiguo):
${historial}`
}

/**
 * Genera el borrador de WhatsApp con OpenAI y lo guarda como nota del lead,
 * marcada como `mensaje_ia` para que el equipo sepa que hay que revisarla.
 */
export async function generarMensajeSeguimiento(leadId: string): Promise<ResultadoIA> {
  const perfil = await perfilActual()

  if (!process.env.OPENAI_API_KEY) {
    return { ok: false, error: 'Falta configurar OPENAI_API_KEY en el entorno.' }
  }

  const supabase = await clienteServidor()

  // RLS se encarga de que solo se pueda leer un lead de tu clínica.
  const { data: lead, error: errorLead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single<Lead>()

  if (errorLead || !lead) {
    return { ok: false, error: 'No se ha encontrado el lead.' }
  }

  const { data: notas } = await supabase
    .from('notas')
    .select('*')
    .eq('lead_id', leadId)
    .neq('tipo', 'sistema')
    .order('fecha', { ascending: false })
    .limit(5)
    .returns<Nota[]>()

  let mensaje: string
  try {
    const openai = new OpenAI()
    const respuesta = await openai.chat.completions.create({
      model: MODELO,
      // Un WhatsApp de 50 palabras no da para más; el límite evita sorpresas
      // en la factura si el modelo se enrolla.
      max_completion_tokens: 300,
      messages: [
        { role: 'system', content: INSTRUCCIONES },
        {
          role: 'user',
          content: `Redacta el mensaje de seguimiento para este paciente potencial:\n\n${fichaDelLead(lead, notas ?? [])}`,
        },
      ],
    })

    mensaje = respuesta.choices[0]?.message?.content?.trim() ?? ''
    if (!mensaje)
      return { ok: false, error: 'El modelo ha devuelto una respuesta vacía.' }
  } catch (e) {
    if (e instanceof OpenAI.AuthenticationError) {
      return { ok: false, error: 'La clave de la API de OpenAI no es válida.' }
    }
    if (e instanceof OpenAI.RateLimitError) {
      return {
        ok: false,
        error:
          'Límite alcanzado o sin saldo en la cuenta de OpenAI. Inténtalo en unos segundos.',
      }
    }
    if (e instanceof OpenAI.NotFoundError) {
      return {
        ok: false,
        error: `El modelo "${MODELO}" no está disponible en esta cuenta.`,
      }
    }
    if (e instanceof OpenAI.APIError) {
      return { ok: false, error: `Error de la API (${e.status}): ${e.message}` }
    }
    return { ok: false, error: 'No se ha podido contactar con el servicio de IA.' }
  }

  const { error: errorNota } = await supabase.from('notas').insert({
    lead_id: leadId,
    texto: mensaje,
    tipo: 'mensaje_ia',
    autor_id: perfil.id,
  })

  if (errorNota) {
    return { ok: false, error: 'El mensaje se generó pero no se pudo guardar como nota.' }
  }

  revalidatePath(`/leads/${leadId}`)
  return { ok: true, mensaje }
}
