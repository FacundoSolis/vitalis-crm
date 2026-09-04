import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Refresca la sesión de Supabase en cada petición y protege el panel:
 * sin sesión no se entra a ninguna ruta que no sea /login.
 */
export async function proxy(peticion: NextRequest) {
  let respuesta = NextResponse.next({ request: peticion })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => peticion.cookies.getAll(),
        setAll: (nuevas) => {
          nuevas.forEach(({ name, value }) => peticion.cookies.set(name, value))
          respuesta = NextResponse.next({ request: peticion })
          nuevas.forEach(({ name, value, options }) =>
            respuesta.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  const esLogin = peticion.nextUrl.pathname.startsWith('/login')

  if (!user && !esLogin) {
    const destino = peticion.nextUrl.clone()
    destino.pathname = '/login'
    return NextResponse.redirect(destino)
  }

  if (user && esLogin) {
    const destino = peticion.nextUrl.clone()
    destino.pathname = '/'
    return NextResponse.redirect(destino)
  }

  return respuesta
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
