/** Esqueleto de la ficha, con la misma retícula que la página real. */
export default function CargandoLead() {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <div className="bg-muted h-8 w-40 animate-pulse rounded" />
      <div className="bg-muted mt-4 h-4 w-56 animate-pulse rounded" />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_270px]">
        <div className="space-y-4 lg:order-1">
          <div className="border-primary/20 bg-primary/[0.04] h-28 animate-pulse rounded-xl border" />
          <div className="border-border bg-card h-40 animate-pulse rounded-xl border" />
          <div className="border-border bg-card h-24 animate-pulse rounded-xl border" />
        </div>
        <div className="border-border bg-card h-56 animate-pulse rounded-xl border lg:order-2" />
      </div>
    </div>
  )
}
