# Vitalis · Panel de leads

Panel interno de captación de pacientes para Clínica Dental Vitalis (Madrid, Valencia y
Sevilla). Sustituye el Excel que hoy se pasan por email entre las tres clínicas.

**En producción:** https://vitalis-crm-one.vercel.app
**Stack:** Next.js 16 (App Router, Server Actions) · Supabase (Postgres + Auth + RLS) · Vercel · OpenAI · shadcn/ui

Todos los leads en un sitio vengan de donde vengan, con filtros por clínica y estado,
historial de cada llamada y cada mensaje, y un botón que redacta el WhatsApp de
seguimiento para que el equipo lo revise antes de enviarlo.

---

## Las decisiones que tomé yo

**¿Un lead puede cambiar de clínica? Sí, es editable.** Alguien pide información en Madrid
y acaba tratándose en Valencia. Bloquearlo obligaría a duplicar el lead y perder su
historial. Pero como cambiar de clínica cambia quién ve ese lead, no puede ser silencioso:
un trigger de Postgres registra cada cambio de clínica y de estado como nota de sistema.

**¿Dos leads con el mismo teléfono? Se avisa, no se fusiona ni se bloquea.** Fusionar es
destructivo y se equivoca: en una familia se comparte teléfono. Bloquear el alta es peor,
porque la recepcionista está al teléfono con el paciente. Así que guardo el teléfono
normalizado como columna generada, el listado marca los repetidos y la ficha enlaza al
otro lead. Decide quien tiene el contexto. Avisar es reversible; fusionar no.

**¿Quién ve qué? Gerencia ve las tres clínicas, recepción solo la suya.** Lo importante es
que está implementado con Row Level Security en Postgres, no escondiendo botones: aunque
alguien llamara a la API con su sesión, la base de datos solo le devuelve sus leads.

**¿Qué tono usa la IA? Cercano y profesional, de tú, español de España.** Entre 30 y 60
palabras, porque es un WhatsApp, y una sola llamada a la acción. Tres límites que el prompt
no cruza: no da precios, no hace diagnósticos ni promete resultados, y no se inventa citas
ni promociones. El mensaje cambia según el estado del lead, y **nunca se envía solo**: se
guarda como nota marcada para que una persona lo revise. Un CRM que manda WhatsApps a
pacientes sin supervisión es un problema, no una función.

**Sobre la marca:** el panel es de Vitalis, que es de quien es la herramienta; DelegIA
aparece como quien la construye. La identidad visual sí sale de su logo: el índigo
`#6569F7` es el color de acción de toda la aplicación.

---

## Cómo se levanta

```bash
pnpm install
cp .env.example .env.local   # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
                             # SUPABASE_SERVICE_ROLE_KEY (solo seed) y OPENAI_API_KEY
pnpm seed                    # usuarios de prueba y datos de ejemplo
pnpm dev
```

| Usuario | Ve |
|---|---|
| `gerencia@vitalis.es` | Las tres clínicas |
| `madrid@vitalis.es` | Solo Madrid |
| `valencia@vitalis.es` | Solo Valencia |

Contraseña de los tres: `Vitalis2026!`

`pnpm verificar` comprueba contra la base de datos real que recepción solo ve su clínica y
que un anónimo no ve nada. `pnpm ensayo` recorre en producción el flujo completo con un
navegador real: crear, duplicado, nota, IA, editar y borrar.

---

## Qué haría distinto con más tiempo

1. **Entrada automática de leads.** Hoy se dan de alta a mano, que es justo el trabajo que
   Vitalis quiere quitarse. Un webhook para el formulario web y para Instagram cerraría el
   círculo.
2. **Enviar el WhatsApp, no solo redactarlo,** con la API de WhatsApp Business, manteniendo
   el paso de revisión humana.
3. **Avisos de leads que se enfrían.** La métrica está, pero hay que acordarse de mirarla.
4. **Tests de verdad.** Lo que hay son scripts, no una suite en CI.

Y de lo ya construido revisaría tres cosas: el borrado es real y debería ser lógico, el
listado no pagina, y las confirmaciones usan el `confirm()` del navegador.
