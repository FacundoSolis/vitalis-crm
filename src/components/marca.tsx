import Image from 'next/image'

/**
 * El logo de DelegIA es blanco sobre transparente, así que solo funciona sobre
 * fondo oscuro. Este componente garantiza esa superficie allá donde se use.
 *
 * Nota de producto: la marca del panel es Vitalis, que es de quien es la
 * herramienta. DelegIA aparece como quien la construye, no como el producto.
 */
export function LogoDelegia({
  className = '',
  ancho = 96,
}: {
  className?: string
  ancho?: number
}) {
  return (
    <Image
      src="/transparenteblanco.webp"
      alt="DelegIA"
      width={ancho}
      height={Math.round((ancho * 55) / 128)}
      priority
      className={className}
    />
  )
}

/** Marca de Vitalis: monograma más nombre. Se usa en la cabecera y en el login. */
export function MarcaVitalis({
  tamano = 'md',
  invertida = false,
}: {
  tamano?: 'sm' | 'md' | 'lg'
  invertida?: boolean
}) {
  const cuadro = {
    sm: 'size-7 text-[13px] rounded-lg',
    md: 'size-9 text-base rounded-[10px]',
    lg: 'size-12 text-xl rounded-xl',
  }[tamano]

  const texto = {
    sm: 'text-sm',
    md: 'text-[15px]',
    lg: 'text-lg',
  }[tamano]

  return (
    <span className="flex items-center gap-2.5">
      <span
        className={`${cuadro} flex shrink-0 items-center justify-center font-semibold tracking-tight ${
          invertida
            ? 'bg-white/10 text-white ring-1 ring-white/15'
            : 'bg-primary text-primary-foreground'
        }`}
      >
        V
      </span>
      <span className={`${texto} leading-tight font-semibold tracking-tight`}>
        Vitalis
        <span
          className={`block text-[11px] font-normal ${
            invertida ? 'text-white/55' : 'text-muted-foreground'
          }`}
        >
          Clínica Dental
        </span>
      </span>
    </span>
  )
}
