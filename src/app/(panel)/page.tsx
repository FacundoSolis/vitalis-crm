import { AlertTriangle, CalendarCheck, Flame, Inbox, Users } from 'lucide-react'
import { clienteServidor, perfilActual } from '@/lib/supabase/servidor'
import { FiltrosLeads } from '@/components/filtros-leads'
import { TablaLeads } from '@/components/tabla-leads'
import { DialogoLead } from '@/components/dialogo-lead'
import { CLINICAS, ES_ALTO_VALOR, ESTADOS, type Lead } from '@/lib/dominio'

export default async function PaginaLeads({ searchParams }: PageProps<'/'>) {
  const perfil = await perfilActual()
  const filtros = await searchParams

  const clinica = typeof filtros.clinica === 'string' ? filtros.clinica : ''
  const estado = typeof filtros.estado === 'string' ? filtros.estado : ''
  const busqueda = typeof filtros.q === 'string' ? filtros.q.trim() : ''

  const supabase = await clienteServidor()
  let consulta = supabase
    .from('leads')
    .select('*')
    .order('creado_en', { ascending: false })

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
    repeticiones.set(
      l.telefono_normalizado,
      (repeticiones.get(l.telefono_normalizado) ?? 0) + 1,
    )
  }
  const duplicados = new Set(
    [...repeticiones.entries()].filter(([, n]) => n > 1).map(([tel]) => tel),
  )

  const enFrio = leads.filter((l) => l.estado === 'nuevo' && ES_ALTO_VALOR[l.tratamiento])

  const metricas = [
    { icono: Users, etiqueta: 'Leads', valor: leads.length, pie: 'en tu alcance' },
    {
      icono: Inbox,
      etiqueta: 'Sin contactar',
      valor: leads.filter((l) => l.estado === 'nuevo').length,
      pie: 'esperando llamada',
    },
    {
      icono: Flame,
      etiqueta: 'Alto valor en frío',
      valor: enFrio.length,
      pie: 'implantes y ortodoncia',
      urgente: enFrio.length > 0,
    },
    {
      icono: CalendarCheck,
      etiqueta: 'Citas agendadas',
      valor: leads.filter((l) => l.estado === 'cita_agendada').length,
      pie: 'ya en agenda',
    },
  ]

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] leading-none font-semibold tracking-tight">Leads</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Instagram, formulario web y llamadas, en un solo sitio.
          </p>
        </div>
        <DialogoLead perfil={perfil} />
      </div>

      {/* Hairlines reales: el contenedor pinta el borde y las celdas lo tapan.
            Aguanta cualquier breakpoint sin condicionales por índice. */}
      <div className="bg-border mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border lg:grid-cols-4">
        {metricas.map((m) => (
          <div key={m.etiqueta} className="bg-card px-5 py-4">
            <div className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium tracking-wide uppercase">
              <m.icono className="size-3.5" />
              {m.etiqueta}
            </div>
            <p
              className={`mt-2 text-[28px] leading-none font-semibold ${
                m.urgente ? 'text-amber-600 dark:text-amber-400' : ''
              }`}
            >
              {m.valor}
            </p>
            <p className="text-muted-foreground mt-1.5 text-xs">{m.pie}</p>
          </div>
        ))}
      </div>

      <FiltrosLeads perfil={perfil} />

      {/* Al filtrar, la lista cambia sin que nada lo diga en voz alta. */}
      <p role="status" className="sr-only">
        {leads.length === 1 ? '1 lead' : `${leads.length} leads`} con los filtros
        actuales.
      </p>

      {duplicados.size > 0 && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p className="leading-relaxed">
            {duplicados.size === 1
              ? 'Hay un teléfono repetido'
              : `Hay ${duplicados.size} teléfonos repetidos`}{' '}
            entre estos leads. Están marcados en la tabla: revísalos antes de llamar dos
            veces a la misma persona.
          </p>
        </div>
      )}

      <div className="mt-4">
        {error ? (
          <div className="border-destructive/25 bg-destructive/5 rounded-xl border p-10 text-center">
            <p className="text-sm font-medium">No se han podido cargar los leads.</p>
            <p className="text-muted-foreground mt-1.5 text-sm">{error.message}</p>
          </div>
        ) : (
          <TablaLeads leads={leads} duplicados={[...duplicados]} />
        )}
      </div>
    </main>
  )
}
