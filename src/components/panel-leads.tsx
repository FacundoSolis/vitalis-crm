'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertTriangle, CalendarCheck, Flame, Inbox, Users } from 'lucide-react'
import type { Perfil } from '@/lib/supabase/servidor'
import { FiltrosLeads } from '@/components/filtros-leads'
import { TablaLeads } from '@/components/tabla-leads'
import { CLINICAS, ES_ALTO_VALOR, ESTADOS, type Lead } from '@/lib/dominio'

/**
 * Filtra en el navegador, no en el servidor.
 *
 * Los leads que caben en el panel son pocos y ya viajan enteros en la primera
 * carga, así que cada clic en un filtro costaba un viaje de ida y vuelta
 * completo (~900 ms) sin traer ni un dato nuevo. Aquí el filtro es inmediato y
 * la URL se sigue actualizando, así que el enlace se puede compartir igual.
 *
 * Esto vale porque el listado no pagina. El día que lo haga, el filtro tiene
 * que volver al servidor.
 */
export function PanelLeads({ perfil, todos }: { perfil: Perfil; todos: Lead[] }) {
  const parametros = useSearchParams()
  const clinica = parametros.get('clinica') ?? ''
  const estado = parametros.get('estado') ?? ''
  const busqueda = (parametros.get('q') ?? '').trim()

  const leads = useMemo(() => {
    const texto = busqueda.toLowerCase()
    const soloDigitos = busqueda.replace(/\D/g, '')
    return todos.filter((l) => {
      if (CLINICAS.includes(clinica as never) && l.clinica !== clinica) return false
      if (ESTADOS.includes(estado as never) && l.estado !== estado) return false
      if (!busqueda) return true
      if (l.nombre.toLowerCase().includes(texto)) return true
      // Igual que en el servidor: por teléfono solo a partir de tres dígitos.
      return soloDigitos.length >= 3 && l.telefono_normalizado.includes(soloDigitos)
    })
  }, [todos, clinica, estado, busqueda])

  // Teléfonos que aparecen en más de un lead: se avisa, no se fusiona.
  // (Decisión de producto, ver README.)
  const duplicados = useMemo(() => {
    const repeticiones = new Map<string, number>()
    for (const l of leads) {
      repeticiones.set(
        l.telefono_normalizado,
        (repeticiones.get(l.telefono_normalizado) ?? 0) + 1,
      )
    }
    return [...repeticiones.entries()].filter(([, n]) => n > 1).map(([tel]) => tel)
  }, [leads])

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
    <>
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

      {duplicados.length > 0 && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p className="leading-relaxed">
            {duplicados.length === 1
              ? 'Hay un teléfono repetido'
              : `Hay ${duplicados.length} teléfonos repetidos`}{' '}
            entre estos leads. Están marcados en la tabla: revísalos antes de llamar dos
            veces a la misma persona.
          </p>
        </div>
      )}

      <div className="mt-4">
        <TablaLeads leads={leads} duplicados={duplicados} />
      </div>
    </>
  )
}
