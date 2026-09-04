'use client'

import { ThemeProvider, useTheme } from 'next-themes'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
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

export function SelectorTema() {
  const { theme, setTheme } = useTheme()
  const [montado, setMontado] = useState(false)

  // El tema real solo se conoce en cliente; hasta entonces se reserva el hueco
  // para que la cabecera no dé un salto al hidratar.
  useEffect(() => setMontado(true), [])
  if (!montado) return <div className="size-9" aria-hidden />

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
