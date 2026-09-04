'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LoaderCircle, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { Perfil } from '@/lib/supabase/servidor'
import { actualizarLead, crearLead } from '@/app/acciones/leads'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  CLINICAS, ESTADOS, ETIQUETA_ESTADO, ETIQUETA_FUENTE,
  ETIQUETA_TRATAMIENTO, FUENTES, TRATAMIENTOS, type Lead,
} from '@/lib/dominio'

export function DialogoLead({
  perfil, lead, disparador,
}: {
  perfil: Perfil
  lead?: Lead
  disparador?: React.ReactNode
}) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [guardando, empezar] = useTransition()
  const editando = Boolean(lead)

  // Recepción solo puede dar de alta en su propia clínica.
  const clinicasDisponibles = perfil.rol === 'admin' ? CLINICAS : [perfil.clinica!]

  function guardar(datos: FormData) {
    empezar(async () => {
      const r = editando ? await actualizarLead(lead!.id, datos) : await crearLead(datos)
      if (!r.ok) {
        toast.error(r.error)
        return
      }
      toast.success(editando ? 'Lead actualizado' : 'Lead creado')
      setAbierto(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        {disparador ?? (
          <Button>
            <Plus /> Nuevo lead
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar lead' : 'Nuevo lead'}</DialogTitle>
          <DialogDescription>
            {editando
              ? 'Los cambios de estado y de clínica quedan registrados en el historial del lead.'
              : 'Apunta aquí el paciente potencial que acaba de llamar o escribir.'}
          </DialogDescription>
        </DialogHeader>

        <form action={guardar} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nombre">Nombre y apellidos</Label>
              <Input id="nombre" name="nombre" defaultValue={lead?.nombre} required autoFocus />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono" name="telefono" type="tel"
                placeholder="+34 600 000 000"
                defaultValue={lead?.telefono} required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input id="email" name="email" type="email" defaultValue={lead?.email ?? ''} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinica">Clínica de interés</Label>
              <Select
                name="clinica"
                defaultValue={lead?.clinica ?? clinicasDisponibles[0]}
                disabled={clinicasDisponibles.length === 1}
              >
                <SelectTrigger id="clinica" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {clinicasDisponibles.map((c) => (
                    <SelectItem key={c} value={c!}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clinicasDisponibles.length === 1 && (
                <input type="hidden" name="clinica" value={clinicasDisponibles[0]!} />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tratamiento">Tratamiento</Label>
              <Select name="tratamiento" defaultValue={lead?.tratamiento ?? 'implantes'}>
                <SelectTrigger id="tratamiento" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRATAMIENTOS.map((t) => (
                    <SelectItem key={t} value={t}>{ETIQUETA_TRATAMIENTO[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuente">Cómo nos ha llegado</Label>
              <Select name="fuente" defaultValue={lead?.fuente ?? 'llamada'}>
                <SelectTrigger id="fuente" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FUENTES.map((f) => (
                    <SelectItem key={f} value={f}>{ETIQUETA_FUENTE[f]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select name="estado" defaultValue={lead?.estado ?? 'nuevo'}>
                <SelectTrigger id="estado" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS.map((e) => (
                    <SelectItem key={e} value={e}>{ETIQUETA_ESTADO[e]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando}>
              {guardando && <LoaderCircle className="animate-spin" />}
              {editando ? 'Guardar cambios' : 'Crear lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
