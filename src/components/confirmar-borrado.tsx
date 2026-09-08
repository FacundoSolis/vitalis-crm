'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

/**
 * Confirmación única para todo lo que borra. Antes convivían un `confirm()` del
 * navegador al eliminar un lead y ningún aviso al eliminar una nota: dos
 * comportamientos distintos para la misma acción irreversible.
 *
 * Se usa de dos formas según quién la abra:
 *  - con `children`, que actúa de disparador (un botón normal);
 *  - controlada con `abierto` / `onAbiertoChange`, para abrirla desde un menú
 *    desplegable, que se cierra al elegir y se llevaría el diálogo por delante.
 */
export function ConfirmarBorrado({
  titulo,
  descripcion,
  accion = 'Eliminar',
  onConfirmar,
  abierto,
  onAbiertoChange,
  children,
}: {
  titulo: string
  descripcion: string
  accion?: string
  onConfirmar: () => void
  abierto?: boolean
  onAbiertoChange?: (abierto: boolean) => void
  children?: React.ReactNode
}) {
  return (
    <AlertDialog open={abierto} onOpenChange={onAbiertoChange}>
      {children && <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descripcion}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmar}>{accion}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
