import { FormularioLogin } from '@/components/formulario-login'

export const metadata = { title: 'Entrar · Vitalis' }

export default function PaginaLogin() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="bg-primary text-primary-foreground mx-auto mb-4 flex size-11 items-center justify-center rounded-xl text-lg font-semibold">
            V
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Clínica Dental Vitalis
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Panel interno de captación de pacientes
          </p>
        </div>

        <FormularioLogin />

        <p className="text-muted-foreground mt-6 text-center text-xs leading-relaxed">
          Acceso restringido al equipo de Vitalis.
          <br />
          ¿Problemas para entrar? Escribe a sistemas@vitalis.es
        </p>
      </div>
    </main>
  )
}
