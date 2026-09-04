import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, AlertTriangle, Mail, Pencil, Phone } from 'lucide-react'
import { clienteServidor, perfilActual } from '@/lib/supabase/servidor'
import { DialogoLead } from '@/components/dialogo-lead'
import { HistorialLead } from '@/components/historial-lead'
import { BorrarLead } from '@/components/borrar-lead'

import { Button } from '@/components/ui/button'

import {
  COLOR_ESTADO,
  ES_ALTO_VALOR,
  ETIQUETA_ESTADO,
  ETIQUETA_FUENTE,
  ETIQUETA_TRATAMIENTO,
  formatearFecha,
  haceCuanto,
  type Lead,
  type Nota,
} from '@/lib/dominio'

export default async function PaginaLead({ params }: PageProps<'/leads/[id]'>) {
  const perfil = await perfilActual()
  const { id } = await params

  const supabase = await clienteServidor()
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single<Lead>()

  if (!lead) notFound()

  const [{ data: notas }, { data: mismosTelefonos }] = await Promise.all([
    supabase
      .from('notas')
      .select('*')
      .eq('lead_id', id)
      .order('fecha', { ascending: false })
      .returns<Nota[]>(),
    supabase
      .from('leads')
      .select('id, nombre, clinica, tratamiento')
      .eq('telefono_normalizado', lead.telefono_normalizado)
      .neq('id', id),
  ])

  const datos = [
    { etiqueta: 'Clínica de interés', valor: lead.clinica },
    { etiqueta: 'Tratamiento', valor: ETIQUETA_TRATAMIENTO[lead.tratamiento] },
    { etiqueta: 'Cómo nos llegó', valor: ETIQUETA_FUENTE[lead.fuente] },
    {
      etiqueta: 'Dado de alta',
      valor: `${formatearFecha(lead.creado_en)} · ${haceCuanto(lead.creado_en)}`,
    },
  ]

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link href="/">
          <ArrowLeft /> Volver a los leads
        </Link>
      </Button>

      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[26px] leading-none font-semibold tracking-tight">
              {lead.nombre}
            </h1>
            <span
              className={`rounded-md border px-2 py-1 text-xs font-medium ${COLOR_ESTADO[lead.estado]}`}
            >
              {ETIQUETA_ESTADO[lead.estado]}
            </span>
            {ES_ALTO_VALOR[lead.tratamiento] && (
              <span className="rounded-md border border-amber-500/30 bg-amber-500/12 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                Alto valor
              </span>
            )}
          </div>

          <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
            <a
              href={`tel:${lead.telefono.replace(/\s/g, '')}`}
              className="hover:text-foreground flex items-center gap-1.5 transition-colors"
            >
              <Phone className="size-3.5" />
              <span className="font-mono">{lead.telefono}</span>
            </a>
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="hover:text-foreground flex items-center gap-1.5 transition-colors"
              >
                <Mail className="size-3.5" /> {lead.email}
              </a>
            )}
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <DialogoLead
            perfil={perfil}
            lead={lead}
            disparador={
              <Button variant="outline">
                <Pencil /> Editar
              </Button>
            }
          />
          <BorrarLead id={lead.id} nombre={lead.nombre} />
        </div>
      </div>

      {mismosTelefonos && mismosTelefonos.length > 0 && (
        <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/8 px-3.5 py-3 text-sm text-amber-900 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">Posible duplicado</p>
            <p className="mt-0.5">
              Este teléfono también aparece en{' '}
              {mismosTelefonos.map((otro, i) => (
                <span key={otro.id}>
                  {i > 0 && ', '}
                  <Link
                    href={`/leads/${otro.id}`}
                    className="font-medium underline underline-offset-2"
                  >
                    {otro.nombre}
                  </Link>{' '}
                  (
                  {
                    ETIQUETA_TRATAMIENTO[
                      otro.tratamiento as keyof typeof ETIQUETA_TRATAMIENTO
                    ]
                  }
                  , {otro.clinica})
                </span>
              ))}
              . Compruébalo antes de llamar: puede ser la misma persona pidiendo dos cosas
              distintas.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_270px]">
        <aside className="lg:order-2">
          <div className="border-border bg-card divide-border divide-y overflow-hidden rounded-xl border">
            {datos.map((d) => (
              <div key={d.etiqueta} className="px-4 py-3">
                <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                  {d.etiqueta}
                </p>
                <p className="mt-1 text-sm font-medium">{d.valor}</p>
              </div>
            ))}
          </div>
        </aside>

        <div className="lg:order-1">
          <HistorialLead lead={lead} notas={notas ?? []} />
        </div>
      </div>
    </main>
  )
}
