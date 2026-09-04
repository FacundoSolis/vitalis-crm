'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bot, Check, Copy, GitCommitVertical, LoaderCircle,
  MessageSquare, Phone, Sparkles, Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { crearNota, eliminarNota } from '@/app/acciones/leads'
import { generarMensajeSeguimiento } from '@/app/acciones/ia'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  ETIQUETA_TIPO_NOTA, formatearFechaHora, type Lead, type Nota, type TipoNota,
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
    await navigator.clipboard.writeText(nota.texto)
    setCopiada(nota.id)
    toast.success('Mensaje copiado. Ya lo puedes pegar en WhatsApp.')
    setTimeout(() => setCopiada(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* ── Generador de mensajes ─────────────────────────────────────────── */}
      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <Sparkles className="text-primary size-4" />
              Mensaje de seguimiento
            </p>
            <p className="text-muted-foreground mt-1 max-w-md text-sm">
              Redacta un WhatsApp para {lead.nombre.split(' ')[0]} a partir de su tratamiento,
              su estado y lo último que hablasteis. Lo revisas tú antes de enviarlo.
            </p>
          </div>
          <Button onClick={generar} disabled={generando}>
            {generando ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
            {generando ? 'Redactando…' : 'Generar mensaje'}
          </Button>
        </CardContent>
      </Card>

      {/* ── Nueva nota ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Apuntar un contacto</CardTitle>
        </CardHeader>
        <CardContent>
          <form ref={formulario} action={anotar} className="space-y-3">
            <Textarea
              name="texto"
              rows={3}
              required
              placeholder="Qué habéis hablado, qué queda pendiente, cuándo volver a llamar…"
            />
            <div className="flex items-center justify-between gap-3">
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoNota)}>
                <SelectTrigger className="w-[160px]" aria-label="Tipo de contacto">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="llamada">Llamada</SelectItem>
                  <SelectItem value="mensaje">Mensaje</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={guardando}>
                {guardando && <LoaderCircle className="animate-spin" />}
                Añadir nota
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Historial ─────────────────────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-sm font-medium">
          Historial
          <span className="text-muted-foreground ml-1.5 font-normal">
            {notas.length} {notas.length === 1 ? 'apunte' : 'apuntes'}
          </span>
        </h2>

        {notas.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground text-sm">
              Todavía no hay ningún contacto con este lead.
            </p>
          </Card>
        ) : (
          <ol className="space-y-3">
            {notas.map((nota) => {
              const Icono = ICONO_NOTA[nota.tipo]
              const esIA = nota.tipo === 'mensaje_ia'
              const esSistema = nota.tipo === 'sistema'

              return (
                <li key={nota.id}>
                  <Card
                    className={`gap-0 py-4 ${esIA ? 'border-primary/25 bg-primary/[0.03]' : ''}`}
                  >
                    <CardContent className="px-4">
                      <div className="flex items-center gap-2">
                        <Icono
                          className={`size-3.5 shrink-0 ${esIA ? 'text-primary' : 'text-muted-foreground'}`}
                        />
                        <span className="text-xs font-medium">
                          {ETIQUETA_TIPO_NOTA[nota.tipo]}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {formatearFechaHora(nota.fecha)}
                        </span>

                        <div className="ml-auto flex items-center gap-1">
                          {esIA && (
                            <Button
                              variant="ghost" size="sm" className="h-7 px-2 text-xs"
                              onClick={() => copiar(nota)}
                            >
                              {copiada === nota.id ? <Check /> : <Copy />}
                              {copiada === nota.id ? 'Copiado' : 'Copiar'}
                            </Button>
                          )}
                          {!esSistema && (
                            <Button
                              variant="ghost" size="icon" className="size-7"
                              disabled={borrando}
                              onClick={() => borrar(nota.id)}
                              aria-label="Eliminar nota"
                            >
                              <Trash2 className="text-muted-foreground size-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <p
                        className={`mt-2 text-sm whitespace-pre-wrap ${
                          esSistema ? 'text-muted-foreground' : ''
                        }`}
                      >
                        {nota.texto}
                      </p>

                      {esIA && (
                        <p className="text-muted-foreground mt-2.5 border-t pt-2.5 text-xs">
                          Borrador generado por IA · revísalo antes de enviarlo
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </div>
  )
}
