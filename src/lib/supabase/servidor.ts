import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

/** Cliente de Supabase para Server Components, Server Actions y Route Handlers. */
export async function clienteServidor() {
  const almacen = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => almacen.getAll(),
        setAll: (nuevas) => {
          try {
            nuevas.forEach(({ name, value, options }) =>
              almacen.set(name, value, options),
            )
          } catch {
            // Los Server Components no pueden escribir cookies; el middleware
            // ya se encarga de refrescar la sesión en cada petición.
          }
        },
      },
    },
  )
}

export type Perfil = {
  id: string
  nombre: string
  email: string
  rol: 'admin' | 'recepcion'
  clinica: 'Madrid' | 'Valencia' | 'Sevilla' | null
}

/**
 * Devuelve el perfil de quien ha iniciado sesión, o redirige a /login.
 * Es la puerta de entrada de todas las páginas del panel.
 */
export async function perfilActual(): Promise<Perfil> {
  const supabase = await clienteServidor()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('id, nombre, email, rol, clinica')
    .eq('id', user.id)
    .single()

  if (!perfil) redirect('/login?error=sin-perfil')
  return perfil as Perfil
}
