import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { clienteServidor, type Perfil } from '@/lib/supabase/servidor'
import { MarcaVitalis } from '@/components/marca'
import { SelectorTema } from '@/components/tema'
import { Button } from '@/components/ui/button'

export function Cabecera({ perfil }: { perfil: Perfil }) {
  async function salir() {
    'use server'
    const supabase = await clienteServidor()
    await supabase.auth.signOut()
    redirect('/login')
  }

  const alcance =
    perfil.rol === 'admin' ? 'Las tres clínicas' : `Clínica de ${perfil.clinica}`

  const iniciales = perfil.nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')

  return (
    <header className="bg-background/85 sticky top-0 z-30 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="rounded-md focus-visible:outline-none"
          aria-label="Ir al listado de leads"
        >
          <MarcaVitalis tamano="sm" />
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-[13px] leading-tight font-medium">{perfil.nombre}</p>
            <p className="text-muted-foreground text-[11px] leading-tight">{alcance}</p>
          </div>

          <span
            className="bg-accent text-accent-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
            aria-hidden
          >
            {iniciales}
          </span>

          <SelectorTema />

          <form action={salir}>
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut />
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
