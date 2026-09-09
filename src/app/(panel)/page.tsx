import { clienteServidor, perfilActual } from '@/lib/supabase/servidor'
import { DialogoLead } from '@/components/dialogo-lead'
import { PanelLeads } from '@/components/panel-leads'
import type { Lead } from '@/lib/dominio'

export default async function PaginaLeads() {
  const supabase = await clienteServidor()

  // El perfil y los leads no dependen el uno del otro, así que van en paralelo:
  // encadenarlos sumaba un viaje entero a Supabase en cada carga. RLS ya limita
  // los leads a la clínica de quien mira, no hace falta saber quién es antes.
  const [perfil, { data, error }] = await Promise.all([
    perfilActual(),
    supabase
      .from('leads')
      .select('*')
      .order('creado_en', { ascending: false })
      .returns<Lead[]>(),
  ])

  const leads = data ?? []

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

      {error ? (
        <div className="border-destructive/25 bg-destructive/5 rounded-xl border p-10 text-center">
          <p className="text-sm font-medium">No se han podido cargar los leads.</p>
          <p className="text-muted-foreground mt-1.5 text-sm">{error.message}</p>
        </div>
      ) : (
        <PanelLeads perfil={perfil} todos={leads} />
      )}
    </main>
  )
}
