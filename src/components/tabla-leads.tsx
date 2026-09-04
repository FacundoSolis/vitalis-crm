'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Copy, Camera, MoreHorizontal, Phone, Globe, Trash2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import type { Perfil } from '@/lib/supabase/servidor'
import { cambiarEstado, eliminarLead } from '@/app/acciones/leads'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  COLOR_ESTADO, ES_ALTO_VALOR, ESTADOS, ETIQUETA_ESTADO,
  ETIQUETA_TRATAMIENTO, haceCuanto, type Estado, type Lead,
} from '@/lib/dominio'

const ICONO_FUENTE = { instagram: Camera, web: Globe, llamada: Phone }

export function TablaLeads({
  leads, duplicados, perfil,
}: {
  leads: Lead[]
  duplicados: string[]
  perfil: Perfil
}) {
  const router = useRouter()
  const [, empezar] = useTransition()
  const repetidos = new Set(duplicados)

  function borrar(lead: Lead) {
    if (!confirm(`¿Eliminar el lead de ${lead.nombre}? Se borrarán también sus notas.`)) return
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
        toast.success(`${lead.nombre} → ${ETIQUETA_ESTADO[estado]}`)
        router.refresh()
      } else toast.error(r.error)
    })
  }

  if (leads.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="font-medium">No hay leads que coincidan.</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Prueba a quitar algún filtro, o da de alta un lead nuevo.
        </p>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden py-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Paciente</TableHead>
              <TableHead>Tratamiento</TableHead>
              <TableHead className="hidden md:table-cell">Clínica</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="hidden lg:table-cell">Entró</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {leads.map((lead) => {
              const IconoFuente = ICONO_FUENTE[lead.fuente]
              const esRepetido = repetidos.has(lead.telefono_normalizado)

              return (
                <TableRow key={lead.id} className="group">
                  <TableCell>
                    <Link href={`/leads/${lead.id}`} className="block">
                      <span className="font-medium group-hover:underline">{lead.nombre}</span>
                      <span className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
                        <IconoFuente className="size-3" />
                        {lead.telefono}
                        {esRepetido && (
                          <span
                            className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400"
                            title="Otro lead tiene este mismo teléfono"
                          >
                            <Copy className="size-3" /> repetido
                          </span>
                        )}
                      </span>
                    </Link>
                  </TableCell>

                  <TableCell>
                    <span className="text-sm">{ETIQUETA_TRATAMIENTO[lead.tratamiento]}</span>
                    {ES_ALTO_VALOR[lead.tratamiento] && (
                      <span
                        className="ml-1.5 text-orange-500"
                        title="Tratamiento de alto valor: prioriza el contacto"
                      >
                        ●
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-muted-foreground hidden text-sm md:table-cell">
                    {lead.clinica}
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className={COLOR_ESTADO[lead.estado]}>
                      {ETIQUETA_ESTADO[lead.estado]}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-muted-foreground hidden text-sm whitespace-nowrap lg:table-cell">
                    {haceCuanto(lead.creado_en)}
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Acciones de ${lead.nombre}`}>
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem asChild>
                          <Link href={`/leads/${lead.id}`}>
                            <Pencil /> Abrir ficha
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs">Mover a</DropdownMenuLabel>
                        {ESTADOS.filter((e) => e !== lead.estado).map((e) => (
                          <DropdownMenuItem key={e} onSelect={() => moverA(lead, e)}>
                            {ETIQUETA_ESTADO[e]}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => borrar(lead)}>
                          <Trash2 /> Eliminar lead
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
