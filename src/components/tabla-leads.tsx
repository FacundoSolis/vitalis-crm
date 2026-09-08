'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import {
  Camera,
  ChevronRight,
  Copy,
  Globe,
  MoreHorizontal,
  Pencil,
  Phone,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Perfil } from '@/lib/supabase/servidor'
import { cambiarEstado, eliminarLead } from '@/app/acciones/leads'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  COLOR_ESTADO,
  ES_ALTO_VALOR,
  ESTADOS,
  ETIQUETA_ESTADO,
  ETIQUETA_FUENTE,
  ETIQUETA_TRATAMIENTO,
  PUNTO_ESTADO,
  haceCuanto,
  type Estado,
  type Lead,
} from '@/lib/dominio'

const ICONO_FUENTE = { instagram: Camera, web: Globe, llamada: Phone }

export function TablaLeads({
  leads,
  duplicados,
  perfil,
}: {
  leads: Lead[]
  duplicados: string[]
  perfil: Perfil
}) {
  const router = useRouter()
  const [pendiente, empezar] = useTransition()
  const repetidos = new Set(duplicados)

  function borrar(lead: Lead) {
    if (!confirm(`¿Eliminar el lead de ${lead.nombre}? Se borrarán también sus notas.`))
      return
    empezar(async () => {
      const r = await eliminarLead(lead.id)
      if (r.ok) {
        toast.success(`Lead de ${lead.nombre} eliminado`)
        router.refresh()
      } else toast.error(r.error)
    })
  }

  function moverA(lead: Lead, estado: Estado) {
    empezar(async () => {
      const r = await cambiarEstado(lead.id, estado)
      if (r.ok) {
        toast.success(
          `${lead.nombre.split(' ')[0]} pasa a ${ETIQUETA_ESTADO[estado].toLowerCase()}`,
        )
        router.refresh()
      } else toast.error(r.error)
    })
  }

  if (leads.length === 0) {
    return (
      <div className="border-border bg-card rounded-xl border px-6 py-16 text-center">
        <p className="font-medium">No hay leads que coincidan</p>
        <p className="text-muted-foreground mx-auto mt-1.5 max-w-sm text-sm leading-relaxed">
          Prueba a quitar algún filtro, o da de alta el paciente que acaba de llamar.
        </p>
      </div>
    )
  }

  return (
    <div
      className={`border-border bg-card divide-border divide-y overflow-hidden rounded-xl border transition-opacity ${
        pendiente ? 'opacity-60' : ''
      }`}
    >
      {leads.map((lead) => {
        const IconoFuente = ICONO_FUENTE[lead.fuente]
        const esRepetido = repetidos.has(lead.telefono_normalizado)
        // Solo se marca lo accionable: tratamiento caro que nadie ha llamado aún.
        // Marcar todos los "alto valor" llenaba la tabla de naranja y no decía nada.
        const enFrio = ES_ALTO_VALOR[lead.tratamiento] && lead.estado === 'nuevo'

        return (
          <div
            key={lead.id}
            className="hover:bg-accent/40 has-[a:focus-visible]:outline-ring group relative grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3.5 transition-colors has-[a:focus-visible]:outline-2 has-[a:focus-visible]:-outline-offset-2 sm:px-5 md:grid-cols-[minmax(0,1fr)_170px_128px_84px_auto]"
          >
            {enFrio && (
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-[3px] bg-amber-500"
                title="Alto valor sin contactar"
              />
            )}

            <div className="min-w-0">
              {/* El enlace ocupa toda la fila con el span de abajo, así que su
                  propio contorno de foco quedaría a media fila: lo dibuja el
                  contenedor con has-[a:focus-visible]. */}
              <Link
                href={`/leads/${lead.id}`}
                className="block focus-visible:outline-none"
              >
                <span className="absolute inset-0" aria-hidden />
                <span className="block truncate text-[15px] font-medium group-hover:underline">
                  {lead.nombre}
                </span>
                {enFrio && <span className="sr-only">Alto valor sin contactar</span>}
                <span className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="flex items-center gap-1.5">
                    <IconoFuente className="size-3 shrink-0" />
                    <span className="font-mono">{lead.telefono}</span>
                  </span>
                  <span className="hidden sm:inline">{ETIQUETA_FUENTE[lead.fuente]}</span>
                  <span className="md:hidden">
                    {ETIQUETA_TRATAMIENTO[lead.tratamiento]} · {lead.clinica}
                  </span>
                  {esRepetido && (
                    <span
                      className="flex items-center gap-1 text-amber-600 dark:text-amber-400"
                      title="Otro lead tiene este mismo teléfono"
                    >
                      <Copy className="size-3" /> repetido
                    </span>
                  )}
                </span>
              </Link>
            </div>

            <div className="hidden min-w-0 md:block">
              <p className="truncate text-sm">{ETIQUETA_TRATAMIENTO[lead.tratamiento]}</p>
              <p className="text-muted-foreground mt-0.5 truncate text-xs">
                {lead.clinica}
              </p>
            </div>

            <span
              className={`col-start-1 row-start-2 justify-self-start rounded-md border px-2 py-1 text-xs font-medium whitespace-nowrap md:col-start-auto md:row-start-auto ${COLOR_ESTADO[lead.estado]}`}
            >
              {ETIQUETA_ESTADO[lead.estado]}
            </span>

            <span className="text-muted-foreground hidden text-xs whitespace-nowrap lg:block">
              {haceCuanto(lead.creado_en)}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground relative z-10 shrink-0 justify-self-end"
                  aria-label={`Acciones de ${lead.nombre}`}
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href={`/leads/${lead.id}`}>
                    <Pencil /> Abrir ficha
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-muted-foreground text-[11px] font-normal">
                  Mover a
                </DropdownMenuLabel>
                {ESTADOS.filter((e) => e !== lead.estado).map((e) => (
                  <DropdownMenuItem key={e} onSelect={() => moverA(lead, e)}>
                    <span
                      className={`size-2 rounded-full ${PUNTO_ESTADO[e]}`}
                      aria-hidden
                    />
                    {ETIQUETA_ESTADO[e]}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => borrar(lead)}>
                  <Trash2 /> Eliminar lead
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      })}
    </div>
  )
}
