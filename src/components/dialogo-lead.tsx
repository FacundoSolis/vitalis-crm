'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, LoaderCircle, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { Perfil } from '@/lib/supabase/servidor'
import {
  actualizarLead,
  buscarPacienteEnOtrasClinicas,
  crearLead,
  reclamarLead,
  type PacienteEnOtraClinica,
} from '@/app/acciones/leads'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CLINICAS,
  ESTADOS,
  ETIQUETA_ESTADO,
  ETIQUETA_FUENTE,
  ETIQUETA_TRATAMIENTO,
  FUENTES,
  TRATAMIENTOS,
  formatearFecha,
  normalizarTelefono,
  type Lead,
} from '@/lib/dominio'

export function DialogoLead({
  perfil,
  lead,
  disparador,
}: {
  perfil: Perfil
  lead?: Lead
  disparador?: React.ReactNode
}) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [guardando, empezar] = useTransition()
  const [trayendo, empezarTraspaso] = useTransition()
  const editando = Boolean(lead)

  // Recepción solo puede dar de alta en su propia clínica.
  const clinicasDisponibles = perfil.rol === 'admin' ? CLINICAS : [perfil.clinica!]

  /**
   * Un paciente que pidió cita en otra sede y ahora se atiende en esta. Recepción
   * no lo ve en su listado, así que sin esto lo daría de alta otra vez y el
   * historial anterior se quedaría huérfano en la otra clínica.
   */
  const [enOtraClinica, setEnOtraClinica] = useState<PacienteEnOtraClinica | null>(null)
  const [telefonoBuscado, setTelefonoBuscado] = useState('')
  const buscaTraspasos = !editando && perfil.rol !== 'admin'

  async function comprobarTelefono(valor: string) {
    if (!buscaTraspasos || normalizarTelefono(valor).length < 9) {
      setEnOtraClinica(null)
      return
    }
    const encontrados = await buscarPacienteEnOtrasClinicas(valor)
    setTelefonoBuscado(valor)
    setEnOtraClinica(encontrados[0] ?? null)
  }

  function traerPaciente() {
    if (!enOtraClinica) return
    empezarTraspaso(async () => {
      const r = await reclamarLead(enOtraClinica.id, telefonoBuscado)
      if (!r.ok) {
        toast.error(r.error)
        return
      }
      toast.success(`Ficha traída a ${perfil.clinica}, con su historial.`)
      cerrar()
      router.push(`/leads/${enOtraClinica.id}`)
    })
  }

  function cerrar() {
    setAbierto(false)
    setEnOtraClinica(null)
    setTelefonoBuscado('')
  }

  function guardar(datos: FormData) {
    empezar(async () => {
      const r = editando ? await actualizarLead(lead!.id, datos) : await crearLead(datos)
      if (!r.ok) {
        toast.error(r.error)
        return
      }
      toast.success(editando ? 'Lead actualizado' : 'Lead creado')
      cerrar()
      router.refresh()
    })
  }

  return (
    <Dialog open={abierto} onOpenChange={(v) => (v ? setAbierto(true) : cerrar())}>
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
              <Input
                id="nombre"
                name="nombre"
                defaultValue={lead?.nombre}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                type="tel"
                placeholder="+34 600 000 000"
                defaultValue={lead?.telefono}
                required
                onBlur={(e) => comprobarTelefono(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email{' '}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={lead?.email ?? ''}
              />
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
                    <SelectItem key={c} value={c!}>
                      {c}
                    </SelectItem>
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
                    <SelectItem key={t} value={t}>
                      {ETIQUETA_TRATAMIENTO[t]}
                    </SelectItem>
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
                    <SelectItem key={f} value={f}>
                      {ETIQUETA_FUENTE[f]}
                    </SelectItem>
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
                    <SelectItem key={e} value={e}>
                      {ETIQUETA_ESTADO[e]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {enOtraClinica && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/8 px-3.5 py-3 text-sm text-amber-900 dark:text-amber-200"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">Este paciente ya está en {enOtraClinica.clinica}</p>
                <p className="mt-0.5">
                  {enOtraClinica.nombre} · {ETIQUETA_ESTADO[enOtraClinica.estado]} ·
                  desde el {formatearFecha(enOtraClinica.creado_en)}. Si viene a
                  atenderse aquí, tráete su ficha en vez de crear una nueva: se conserva
                  todo lo que se habló con él.
                </p>
                <Button
                  type="button"
                  size="sm"
                  className="mt-2.5"
                  onClick={traerPaciente}
                  disabled={trayendo}
                >
                  {trayendo && <LoaderCircle className="animate-spin" />}
                  Traer la ficha a {perfil.clinica}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={cerrar}>
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
