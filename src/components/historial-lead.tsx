'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bot,
  Check,
  Copy,
  GitCommitVertical,
  LoaderCircle,
  MessageSquare,
  Phone,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { crearNota, eliminarNota } from '@/app/acciones/leads'
import { generarMensajeSeguimiento } from '@/app/acciones/ia'
import { Button } from '@/components/ui/button'
import { ConfirmarBorrado } from '@/components/confirmar-borrado'

import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ETIQUETA_TIPO_NOTA,
  formatearFechaHora,
  type Lead,
  type Nota,
  type TipoNota,
} from '@/lib/dominio'

const ICONO_NOTA: Record<TipoNota, typeof Phone> = {
  llamada: Phone,
  mensaje: MessageSquare,
  mensaje_ia: Bot,
  sistema: GitCommitVertical,
}

export function HistorialLead({ lead, notas }: { lead: Lead; notas: Nota[] }) {
  const router = useRouter()
  const formulario = useRef<HTMLFormElement>(null)
  const [tipo, setTipo] = useState<TipoNota>('llamada')
  const [guardando, empezarNota] = useTransition()
  const [generando, empezarIA] = useTransition()
  const [borrando, empezarBorrado] = useTransition()
  const [copiada, setCopiada] = useState<string | null>(null)

  function anotar(datos: FormData) {
    datos.set('tipo', tipo)
    empezarNota(async () => {
      const r = await crearNota(lead.id, datos)
      if (!r.ok) {
        toast.error(r.error)
        return
      }
      formulario.current?.reset()
      toast.success('Nota añadida')
      router.refresh()
    })
  }

  function generar() {
    empezarIA(async () => {
      const r = await generarMensajeSeguimiento(lead.id)
      if (!r.ok) {
        toast.error(r.error)
        return
      }
      toast.success('Mensaje generado', {
        description: 'Está guardado como nota. Revísalo antes de enviarlo.',
      })
      router.refresh()
    })
  }

  function borrar(id: string) {
    empezarBorrado(async () => {
      const r = await eliminarNota(id, lead.id)
      if (r.ok) router.refresh()
      else toast.error(r.error)
    })
  }

  async function copiar(nota: Nota) {
    // El portapapeles falla en contextos no seguros y si el navegador deniega el
    // permiso. Sin este control el botón no hacía nada y no lo decía.
    try {
      await navigator.clipboard.writeText(nota.texto)
      setCopiada(nota.id)
      toast.success('Mensaje copiado. Ya lo puedes pegar en WhatsApp.')
      setTimeout(() => setCopiada(null), 2000)
    } catch {
      toast.error('Tu navegador no deja copiar automáticamente.', {
        description: 'Selecciona el texto del mensaje y cópialo a mano.',
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Generador de mensajes ─────────────────────────────────────────── */}
      <div className="border-primary/25 from-primary/[0.06] relative overflow-hidden rounded-xl border bg-gradient-to-br to-transparent p-5">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-md">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="text-primary size-4" />
              Mensaje de seguimiento
            </p>
            <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
              Redacta un WhatsApp para {lead.nombre.split(' ')[0]} a partir de su
              tratamiento, su estado y lo último que hablasteis. Lo revisas tú antes de
              enviarlo.
            </p>
          </div>
          <Button
            onClick={generar}
            disabled={generando}
            className="shrink-0 active:scale-[0.99]"
          >
            {generando ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
            {generando ? 'Redactando…' : 'Generar mensaje'}
          </Button>
        </div>

        {generando && (
          <div className="mt-5 space-y-2" aria-live="polite">
            <div className="bg-primary/12 h-3 w-full animate-pulse rounded" />
            <div className="bg-primary/12 h-3 w-[88%] animate-pulse rounded [animation-delay:120ms]" />
            <div className="bg-primary/12 h-3 w-[62%] animate-pulse rounded [animation-delay:240ms]" />
          </div>
        )}
      </div>

      {/* ── Nueva nota ────────────────────────────────────────────────────── */}
      <div className="border-border bg-card rounded-xl border p-5">
        <label htmlFor="texto" className="mb-3 block text-sm font-medium">
          Apuntar un contacto
        </label>
        <form ref={formulario} action={anotar} className="space-y-3">
          <Textarea
            id="texto"
            name="texto"
            rows={3}
            required
            placeholder="Qué habéis hablado, qué queda pendiente, cuándo volver a llamar…"
            className="resize-none"
          />
          <div className="flex items-center justify-between gap-3">
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoNota)}>
              <SelectTrigger className="w-[150px]" aria-label="Tipo de contacto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="llamada">Llamada</SelectItem>
                <SelectItem value="mensaje">Mensaje</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" variant="outline" disabled={guardando}>
              {guardando && <LoaderCircle className="animate-spin" />}
              Añadir nota
            </Button>
          </div>
        </form>
      </div>

      {/* ── Historial ─────────────────────────────────────────────────────── */}
      <div>
        <h2 className="mb-4 flex items-baseline gap-2 text-sm font-medium">
          Historial
          <span className="text-muted-foreground text-xs font-normal">
            {notas.length} {notas.length === 1 ? 'apunte' : 'apuntes'}
          </span>
        </h2>

        {notas.length === 0 ? (
          <div className="border-border bg-card rounded-xl border px-6 py-12 text-center">
            <p className="text-sm font-medium">Todavía no hay contacto</p>
            <p className="text-muted-foreground mx-auto mt-1.5 max-w-xs text-sm leading-relaxed">
              Cuando llames o escribas a {lead.nombre.split(' ')[0]}, apúntalo aquí para
              que el resto del equipo lo sepa.
            </p>
          </div>
        ) : (
          <ol className="before:bg-border relative space-y-3 before:absolute before:top-2 before:bottom-2 before:left-[13px] before:w-px">
            {notas.map((nota) => {
              const Icono = ICONO_NOTA[nota.tipo]
              const esIA = nota.tipo === 'mensaje_ia'
              const esSistema = nota.tipo === 'sistema'

              return (
                <li key={nota.id} className="relative flex gap-3.5">
                  <span
                    className={`bg-background relative z-10 mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border ${
                      esIA ? 'border-primary/35 text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <Icono className="size-3.5" />
                  </span>

                  <div
                    className={`min-w-0 flex-1 rounded-xl border px-4 py-3 ${
                      esIA
                        ? 'border-primary/25 bg-primary/[0.04]'
                        : esSistema
                          ? 'border-dashed bg-transparent'
                          : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">
                        {ETIQUETA_TIPO_NOTA[nota.tipo]}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatearFechaHora(nota.fecha)}
                      </span>

                      <div className="ml-auto flex items-center gap-0.5">
                        {esIA && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => copiar(nota)}
                          >
                            {copiada === nota.id ? <Check /> : <Copy />}
                            {copiada === nota.id ? 'Copiado' : 'Copiar'}
                          </Button>
                        )}
                        {!esSistema && (
                          <ConfirmarBorrado
                            titulo="¿Eliminar este apunte?"
                            descripcion="Desaparece del historial del lead para todo el equipo. No se puede deshacer."
                            accion="Eliminar apunte"
                            onConfirmar={() => borrar(nota.id)}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive size-7"
                              disabled={borrando}
                              aria-label="Eliminar nota"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </ConfirmarBorrado>
                        )}
                      </div>
                    </div>

                    <p
                      className={`mt-1.5 text-sm leading-relaxed whitespace-pre-wrap ${
                        esSistema ? 'text-muted-foreground' : ''
                      }`}
                    >
                      {nota.texto}
                    </p>

                    {esIA && (
                      <p className="text-muted-foreground mt-3 border-t pt-2.5 text-xs">
                        Borrador generado por IA. Revísalo antes de enviarlo.
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </div>
  )
}
