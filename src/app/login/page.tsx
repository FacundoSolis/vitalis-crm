import { CalendarCheck, ShieldCheck, Sparkles } from 'lucide-react'
import { FormularioLogin } from '@/components/formulario-login'
import { LogoDelegia, MarcaVitalis } from '@/components/marca'

export const metadata = { title: 'Entrar · Vitalis' }

const CAPACIDADES = [
  {
    icono: CalendarCheck,
    titulo: 'Todos los leads en un sitio',
    texto: 'Instagram, formulario web y llamadas, sin el Excel de siempre.',
  },
  {
    icono: Sparkles,
    titulo: 'Seguimientos que se escriben solos',
    texto: 'El borrador del WhatsApp lo redacta la IA. Lo revisas tú.',
  },
  {
    icono: ShieldCheck,
    titulo: 'Cada clínica ve lo suyo',
    texto: 'Madrid, Valencia y Sevilla, con permisos separados de verdad.',
  },
]

export default function PaginaLogin() {
  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[1.1fr_1fr]">
      {/* Panel de marca. El logo de DelegIA es blanco, así que vive aquí. */}
      <aside className="bg-marca text-marca-foreground relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-24 size-[28rem] rounded-full opacity-30 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, oklch(0.585 0.213 273) 0%, transparent 70%)',
          }}
        />

        <MarcaVitalis tamano="lg" invertida />

        <div className="relative max-w-md">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance">
            El seguimiento de pacientes, ordenado.
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Tres clínicas, un solo panel. Lo que antes se perdía en una hoja de cálculo
            compartida por email.
          </p>

          <ul className="mt-10 space-y-6">
            {CAPACIDADES.map((c) => (
              <li key={c.titulo} className="flex gap-3.5">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/8 ring-1 ring-white/10">
                  <c.icono className="size-4 text-white/80" />
                </span>
                <span>
                  <span className="block text-sm font-medium">{c.titulo}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-white/50">
                    {c.texto}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-2.5 text-xs text-white/40">
          <span>Un sistema de</span>
          <LogoDelegia ancho={78} className="opacity-90" />
        </div>
      </aside>

      {/* Formulario */}
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <MarcaVitalis tamano="md" />
          </div>

          <h2 className="text-xl font-semibold tracking-tight">Entrar al panel</h2>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Acceso restringido al equipo de Vitalis.
          </p>

          <div className="mt-7">
            <FormularioLogin />
          </div>

          <p className="text-muted-foreground mt-8 text-center text-xs lg:hidden">
            Un sistema de DelegIA
          </p>
        </div>
      </main>
    </div>
  )
}
