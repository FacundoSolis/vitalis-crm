'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { eliminarLeadYVolver } from '@/app/acciones/leads'
import { Button } from '@/components/ui/button'
import { ConfirmarBorrado } from '@/components/confirmar-borrado'

export function BorrarLead({ id, nombre }: { id: string; nombre: string }) {
  const [borrando, empezar] = useTransition()

  return (
    <ConfirmarBorrado
      titulo={`¿Eliminar el lead de ${nombre}?`}
      descripcion="Se borrarán también todas sus notas y su historial. No se puede deshacer."
      accion="Eliminar lead"
      onConfirmar={() =>
        empezar(async () => {
          const r = await eliminarLeadYVolver(id)
          if (r && !r.ok) toast.error(r.error)
        })
      }
    >
      <Button
        variant="ghost"
        className="text-muted-foreground hover:text-destructive hover:bg-destructive/8"
        disabled={borrando}
      >
        <Trash2 /> Eliminar lead
      </Button>
    </ConfirmarBorrado>
  )
}
