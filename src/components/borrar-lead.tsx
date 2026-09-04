'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { eliminarLeadYVolver } from '@/app/acciones/leads'
import { Button } from '@/components/ui/button'

export function BorrarLead({ id, nombre }: { id: string; nombre: string }) {
  const [borrando, empezar] = useTransition()

  return (
    <Button
      variant="outline"
      className="text-destructive hover:text-destructive"
      disabled={borrando}
      onClick={() => {
        if (!confirm(`¿Eliminar el lead de ${nombre}? Se borrarán también todas sus notas.`)) return
        empezar(async () => {
          const r = await eliminarLeadYVolver(id)
          if (r && !r.ok) toast.error(r.error)
        })
      }}
    >
      <Trash2 /> Eliminar
    </Button>
  )
}
