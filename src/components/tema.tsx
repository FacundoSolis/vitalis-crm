'use client'

import { ThemeProvider, useTheme } from 'next-themes'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ProveedorTema({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  )
}

const OPCIONES = [
  { valor: 'light', etiqueta: 'Claro', icono: Sun },
  { valor: 'dark', etiqueta: 'Oscuro', icono: Moon },
  { valor: 'system', etiqueta: 'Automático', icono: Monitor },
] as const

// El tema real solo se conoce en cliente. Se lee como "estado externo": en el
// servidor y durante la hidratación vale false, y React vuelve a pintar solo
// cuando ya está hidratado. Así se evita el setState dentro de un efecto.
const SIN_SUSCRIPCION = () => () => {}
const useHidratado = () =>
  useSyncExternalStore(
    SIN_SUSCRIPCION,
    () => true,
    () => false,
  )

export function SelectorTema() {
  const { theme, setTheme } = useTheme()
  const hidratado = useHidratado()

  // Hasta hidratar se reserva el hueco para que la cabecera no dé un salto.
  if (!hidratado) return <div className="size-9" aria-hidden />

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          aria-label="Cambiar tema"
        >
          <Sun className="scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {OPCIONES.map((o) => (
          <DropdownMenuItem
            key={o.valor}
            onSelect={() => setTheme(o.valor)}
            className={theme === o.valor ? 'bg-accent' : ''}
          >
            <o.icono /> {o.etiqueta}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
