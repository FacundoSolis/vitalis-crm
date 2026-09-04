import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ProveedorTema } from '@/components/tema'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vitalis · Panel de leads',
  description:
    'Panel de captación y seguimiento de pacientes de Clínica Dental Vitalis (Madrid, Valencia y Sevilla).',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-background flex min-h-full flex-col">
        <ProveedorTema>
          {children}
          <Toaster position="top-center" richColors />
        </ProveedorTema>
      </body>
    </html>
  )
}
