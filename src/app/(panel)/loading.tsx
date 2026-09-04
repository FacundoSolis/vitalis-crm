/** Esqueleto del listado: misma forma que el contenido real, sin spinners. */
export default function CargandoLeads() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <div className="bg-muted h-7 w-28 animate-pulse rounded" />
      <div className="bg-muted mt-3 h-4 w-72 animate-pulse rounded" />

      <div className="bg-border mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card px-5 py-4">
            <div className="bg-muted h-3 w-20 animate-pulse rounded" />
            <div className="bg-muted mt-3 h-7 w-10 animate-pulse rounded" />
            <div className="bg-muted mt-2 h-3 w-24 animate-pulse rounded" />
          </div>
        ))}
      </div>

      <div className="border-border bg-card divide-border mt-8 divide-y overflow-hidden rounded-xl border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="bg-muted size-2 shrink-0 animate-pulse rounded-full" />
            <div className="flex-1">
              <div className="bg-muted h-4 w-44 animate-pulse rounded" />
              <div className="bg-muted mt-2 h-3 w-32 animate-pulse rounded" />
            </div>
            <div className="bg-muted hidden h-4 w-24 animate-pulse rounded md:block" />
            <div className="bg-muted h-6 w-20 animate-pulse rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
