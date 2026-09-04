'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, LoaderCircle } from 'lucide-react'
import { clienteNavegador } from '@/lib/supabase/cliente'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/** Usuarios de demo: rellenan el formulario de un clic durante la presentación. */
const DEMO = [
  { rol: 'Gerencia', alcance: 'las tres clínicas', email: 'gerencia@vitalis.es' },
  { rol: 'Recepción', alcance: 'solo Madrid', email: 'madrid@vitalis.es' },
  { rol: 'Recepción', alcance: 'solo Valencia', email: 'valencia@vitalis.es' },
]
const CLAVE_DEMO = 'Vitalis2026!'

export function FormularioLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, empezar] = useTransition()

  function entrar(evento: React.FormEvent) {
    evento.preventDefault()
    setError(null)

    empezar(async () => {
      const supabase = clienteNavegador()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: clave,
      })

      if (error) {
        setError(
          error.message === 'Invalid login credentials'
            ? 'Email o contraseña incorrectos.'
            : error.message,
        )
        return
      }

      router.replace('/')
      router.refresh()
    })
  }

  return (
    <div>
      <form onSubmit={entrar} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            placeholder="nombre@vitalis.es"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clave">Contraseña</Label>
          <Input
            id="clave"
            type="password"
            autoComplete="current-password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            required
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full active:scale-[0.99]" disabled={enviando}>
          {enviando && <LoaderCircle className="animate-spin" />}
          {enviando ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <div className="mt-8">
        <p className="text-muted-foreground mb-3 text-xs font-medium">
          Usuarios de prueba
        </p>
        <div className="divide-border border-border divide-y rounded-lg border">
          {DEMO.map((u) => (
            <button
              key={u.email}
              type="button"
              onClick={() => {
                setEmail(u.email)
                setClave(CLAVE_DEMO)
              }}
              className="hover:bg-accent focus-visible:bg-accent flex w-full items-baseline justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              <span>
                <span className="font-medium">{u.rol}</span>
                <span className="text-muted-foreground ml-1.5 text-xs">{u.alcance}</span>
              </span>
              <span className="text-muted-foreground font-mono text-[11px]">
                {u.email.split('@')[0]}
              </span>
            </button>
          ))}
        </div>
        <p className="text-muted-foreground mt-2.5 text-xs">
          Pulsa cualquiera para rellenar el formulario.
        </p>
      </div>
    </div>
  )
}
