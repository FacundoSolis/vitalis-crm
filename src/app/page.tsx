import { AlertTriangle, Flame, CalendarCheck, Inbox, Users } from 'lucide-react'
import { clienteServidor, perfilActual } from '@/lib/supabase/servidor'
import { Cabecera } from '@/components/cabecera'
import { FiltrosLeads } from '@/components/filtros-leads'
import { TablaLeads } from '@/components/tabla-leads'
import { DialogoLead } from '@/components/dialogo-lead'
import { Card } from '@/components/ui/card'
import { CLINICAS, ES_ALTO_VALOR, ESTADOS, type Lead } from '@/lib/dominio'

export default async function PaginaLeads({ searchParams }: PageProps<'/'>) {
  const perfil = await perfilActual()
  const filtros = await searchParams

  const clinica = typeof filtros.clinica === 'string' ? filtros.clinica : ''
  const estado = typeof filtros.estado === 'string' ? filtros.estado : ''
  const busqueda = typeof filtros.q === 'string' ? filtros.q.trim() : ''

  const supabase = await clienteServidor()
  let consulta = supabase.from('leads').select('*').order('creado_en', { ascending: false })

  // RLS ya limita a la clínica del usuario; este filtro es el de la interfaz.
  if (CLINICAS.includes(clinica as never)) consulta = consulta.eq('clinica', clinica)
  if (ESTADOS.includes(estado as never)) consulta = consulta.eq('estado', estado)
  if (busqueda) {
    const soloDigitos = busqueda.replace(/\D/g, '')
    consulta = consulta.or(
      soloDigitos.length >= 3
        ? `nombre.ilike.%${busqueda}%,telefono_normalizado.ilike.%${soloDigitos}%`
        : `nombre.ilike.%${busqueda}%`,
    )
  }

  const { data, error } = await consulta.returns<Lead[]>()
  const leads = data ?? []

  // Teléfonos que aparecen en más de un lead: se avisa, no se fusiona.
  // (Decisión de producto, ver README.)
  const repeticiones = new Map<string, number>()
  for (const l of leads) {
    repeticiones.set(l.telefono_normalizado, (repeticiones.get(l.telefono_normalizado) ?? 0) + 1)
  }
  const duplicados = new Set(
    [...repeticiones.entries()].filter(([, n]) => n > 1).map(([tel]) => tel),
  )

  const metricas = [
    { icono: Users, etiqueta: 'Leads', valor: leads.length },
    {
      icono: Inbox,
      etiqueta: 'Sin contactar',
      valor: leads.filter((l) => l.estado === 'nuevo').length,
    },
    {
      icono: Flame,
      etiqueta: 'Alto valor en frío',
      valor: leads.filter((l) => l.estado === 'nuevo' && ES_ALTO_VALOR[l.tratamiento]).length,
      acento: true,
    },
    {
      icono: CalendarCheck,
      etiqueta: 'Citas agendadas',
      valor: leads.filter((l) => l.estado === 'cita_agendada').length,
    },
  ]

  return (
    <>
      <Cabecera perfil={perfil} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Instagram, formulario web y llamadas, en un solo sitio.
            </p>
          </div>
          <DialogoLead perfil={perfil} />
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {metricas.map((m) => (
            <Card key={m.etiqueta} className="gap-0 p-4">
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                <m.icono className="size-3.5" />
                {m.etiqueta}
              </div>
              <p
                className={`mt-1.5 text-2xl font-semibold tabular-nums ${
                  m.acento && m.valor > 0 ? 'text-orange-600 dark:text-orange-400' : ''
                }`}
              >
                {m.valor}
              </p>
            </Card>
          ))}
        </div>

        <FiltrosLeads perfil={perfil} />

        {duplicados.size > 0 && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/8 px-3.5 py-2.5 text-sm text-amber-900 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>
              Hay {duplicados.size === 1 ? 'un teléfono repetido' : `${duplicados.size} teléfonos repetidos`} entre
              estos leads. Están marcados en la tabla: revísalos y decide si es la misma persona antes de
              llamar dos veces.
            </p>
          </div>
        )}

        <div className="mt-4">
          {error ? (
            <Card className="p-8 text-center">
              <p className="text-sm font-medium">No se han podido cargar los leads.</p>
              <p className="text-muted-foreground mt-1 text-sm">{error.message}</p>
            </Card>
          ) : (
            <TablaLeads leads={leads} duplicados={[...duplicados]} perfil={perfil} />
          )}
        </div>
      </main>
    </>
  )
}
