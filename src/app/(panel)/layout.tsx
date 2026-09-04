import { Cabecera } from '@/components/cabecera'
import { perfilActual } from '@/lib/supabase/servidor'

/**
 * Envuelve todo el panel. Al vivir la cabecera aquí y no en cada página, se
 * queda fija mientras el contenido carga, en vez de parpadear en cada ruta.
 */
export default async function LayoutPanel({ children }: LayoutProps<'/'>) {
  const perfil = await perfilActual()

  return (
    <>
      <Cabecera perfil={perfil} />
      {children}
    </>
  )
}
