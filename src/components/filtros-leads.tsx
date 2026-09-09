'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Search, X } from 'lucide-react'
import type { Perfil } from '@/lib/supabase/servidor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CLINICAS, ESTADOS, ETIQUETA_ESTADO } from '@/lib/dominio'

const TODOS = 'todos'

export function FiltrosLeads({ perfil }: { perfil: Perfil }) {
  const parametros = useSearchParams()

  const clinica = parametros.get('clinica') ?? TODOS
  const estado = parametros.get('estado') ?? TODOS
  const [texto, setTexto] = useState(parametros.get('q') ?? '')

  /**
   * Escribe el filtro en la URL sin navegar. `replaceState` se sincroniza con
   * `useSearchParams`, así que el listado se recalcula en el mismo fotograma;
   * `router.replace` disparaba un renderizado en el servidor por cada clic.
   */
  function aplicar(clave: string, valor: string) {
    const nuevos = new URLSearchParams(parametros)
    if (!valor || valor === TODOS) nuevos.delete(clave)
    else nuevos.set(clave, valor)
    const cadena = nuevos.toString()
    window.history.replaceState(null, '', cadena ? `/?${cadena}` : '/')
  }

  function escribir(valor: string) {
    setTexto(valor)
    aplicar('q', valor)
  }

  const hayFiltros = clinica !== TODOS || estado !== TODOS || texto !== ''

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[200px] flex-1">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={texto}
          onChange={(e) => escribir(e.target.value)}
          placeholder="Buscar por nombre o teléfono…"
          className="pl-9"
          aria-label="Buscar leads"
        />
      </div>

      {/* Recepción solo trabaja con su clínica, así que el filtro no aporta nada. */}
      {perfil.rol === 'admin' && (
        <Select value={clinica} onValueChange={(v) => aplicar('clinica', v)}>
          <SelectTrigger className="w-[168px]" aria-label="Filtrar por clínica">
            <SelectValue placeholder="Clínica" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todas las clínicas</SelectItem>
            {CLINICAS.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select value={estado} onValueChange={(v) => aplicar('estado', v)}>
        <SelectTrigger className="w-[165px]" aria-label="Filtrar por estado">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>Todos los estados</SelectItem>
          {ESTADOS.map((e) => (
            <SelectItem key={e} value={e}>
              {ETIQUETA_ESTADO[e]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hayFiltros && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setTexto('')
            window.history.replaceState(null, '', '/')
          }}
        >
          <X /> Limpiar
        </Button>
      )}
    </div>
  )
}
