'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, LoaderCircle } from 'lucide-react'
import { clienteNavegador } from '@/lib/supabase/cliente'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/** Usuarios de demo: rellenan el formulario con un clic durante la presentación. */
const DEMO = [
  { etiqueta: 'Gerencia (ve las 3 clínicas)', email: 'gerencia@vitalis.es' },
  { etiqueta: 'Recepción Madrid', email: 'madrid@vitalis.es' },
  { etiqueta: 'Recepción Valencia', email: 'valencia@vitalis.es' },
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
    <Card>
      <CardContent className="pt-6">
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

          <Button type="submit" className="w-full" disabled={enviando}>
            {enviando && <LoaderCircle className="animate-spin" />}
            Entrar
          </Button>
        </form>

        <div className="mt-6 border-t pt-4">
          <p className="text-muted-foreground mb-2 text-xs font-medium">
            Usuarios de prueba
          </p>
          <div className="flex flex-col gap-1">
            {DEMO.map((u) => (
              <button
                key={u.email}
                type="button"
                onClick={() => {
                  setEmail(u.email)
                  setClave(CLAVE_DEMO)
                }}
                className="hover:bg-accent flex items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors"
              >
                <span>{u.etiqueta}</span>
                <span className="text-muted-foreground font-mono">{u.email}</span>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
