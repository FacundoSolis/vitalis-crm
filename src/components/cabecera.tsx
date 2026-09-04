import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { clienteServidor, type Perfil } from '@/lib/supabase/servidor'
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

  return (
    <header className="bg-background/80 sticky top-0 z-30 border-b backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg text-sm font-semibold">
            V
          </span>
          <span className="text-sm font-semibold tracking-tight">
            Vitalis
            <span className="text-muted-foreground ml-2 font-normal">
              Panel de leads
            </span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm leading-tight font-medium">{perfil.nombre}</p>
            <p className="text-muted-foreground text-xs leading-tight">{alcance}</p>
          </div>
          <form action={salir}>
            <Button
              type="submit"
              variant="ghost"
              size="icon"
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
