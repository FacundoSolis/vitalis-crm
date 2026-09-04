import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, AlertTriangle, Mail, Pencil, Phone } from 'lucide-react'
import { clienteServidor, perfilActual } from '@/lib/supabase/servidor'
import { Cabecera } from '@/components/cabecera'
import { DialogoLead } from '@/components/dialogo-lead'
import { HistorialLead } from '@/components/historial-lead'
import { BorrarLead } from '@/components/borrar-lead'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  COLOR_ESTADO, ES_ALTO_VALOR, ETIQUETA_ESTADO, ETIQUETA_FUENTE,
  ETIQUETA_TRATAMIENTO, formatearFecha, haceCuanto, type Lead, type Nota,
} from '@/lib/dominio'

export default async function PaginaLead({ params }: PageProps<'/leads/[id]'>) {
  const perfil = await perfilActual()
  const { id } = await params

  const supabase = await clienteServidor()
  const { data: lead } = await supabase
    .from('leads').select('*').eq('id', id).single<Lead>()

  if (!lead) notFound()

  const [{ data: notas }, { data: mismosTelefonos }] = await Promise.all([
    supabase.from('notas').select('*').eq('lead_id', id)
      .order('fecha', { ascending: false }).returns<Nota[]>(),
    supabase.from('leads').select('id, nombre, clinica, tratamiento')
      .eq('telefono_normalizado', lead.telefono_normalizado).neq('id', id),
  ])

  const datos = [
    { etiqueta: 'Clínica de interés', valor: lead.clinica },
    { etiqueta: 'Tratamiento', valor: ETIQUETA_TRATAMIENTO[lead.tratamiento] },
    { etiqueta: 'Cómo nos llegó', valor: ETIQUETA_FUENTE[lead.fuente] },
    { etiqueta: 'Dado de alta', valor: `${formatearFecha(lead.creado_en)} · ${haceCuanto(lead.creado_en)}` },
  ]

  return (
    <>
      <Cabecera perfil={perfil} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
          <Link href="/"><ArrowLeft /> Volver a los leads</Link>
        </Button>

        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight">{lead.nombre}</h1>
              <Badge variant="outline" className={COLOR_ESTADO[lead.estado]}>
                {ETIQUETA_ESTADO[lead.estado]}
              </Badge>
              {ES_ALTO_VALOR[lead.tratamiento] && (
                <Badge variant="outline" className="border-orange-500/25 bg-orange-500/10 text-orange-700 dark:text-orange-300">
                  Alto valor
                </Badge>
              )}
            </div>

            <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <a href={`tel:${lead.telefono.replace(/\s/g, '')}`} className="hover:text-foreground flex items-center gap-1.5">
                <Phone className="size-3.5" /> {lead.telefono}
              </a>
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="hover:text-foreground flex items-center gap-1.5">
                  <Mail className="size-3.5" /> {lead.email}
                </a>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <DialogoLead
              perfil={perfil}
              lead={lead}
              disparador={<Button variant="outline"><Pencil /> Editar</Button>}
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
                    <Link href={`/leads/${otro.id}`} className="font-medium underline underline-offset-2">
                      {otro.nombre}
                    </Link>{' '}
                    ({ETIQUETA_TRATAMIENTO[otro.tratamiento as keyof typeof ETIQUETA_TRATAMIENTO]}, {otro.clinica})
                  </span>
                ))}
                . Compruébalo antes de llamar: puede ser la misma persona pidiendo dos cosas distintas.
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="lg:order-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Datos del lead</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {datos.map((d) => (
                  <div key={d.etiqueta}>
                    <p className="text-muted-foreground text-xs">{d.etiqueta}</p>
                    <p className="mt-0.5 text-sm font-medium">{d.valor}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="lg:order-1">
            <HistorialLead lead={lead} notas={notas ?? []} />
          </div>
        </div>
      </main>
    </>
  )
}
