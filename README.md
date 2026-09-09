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

**¿Un lead puede cambiar de clínica? Sí.** Alguien pide información en Madrid y acaba
tratándose en Valencia. Bloquearlo obligaría a duplicar el lead y perder su historial.
Gerencia lo cambia editando la ficha y recepción se lo trae ella misma (más abajo). Pero
como cambiar de clínica cambia quién ve ese lead, no puede ser silencioso: un trigger de
Postgres registra cada cambio de clínica y de estado como nota de sistema.

**¿Dos leads con el mismo teléfono? Se avisa, no se fusiona ni se bloquea.** Fusionar es
destructivo y se equivoca: en una familia se comparte teléfono. Bloquear el alta es peor,
porque la recepcionista está al teléfono con el paciente. Así que guardo el teléfono
normalizado como columna generada, el listado marca los repetidos y la ficha enlaza al
otro lead. Decide quien tiene el contexto. Avisar es reversible; fusionar no.

**¿Quién ve qué? Gerencia ve las tres clínicas, recepción solo la suya.** Lo importante es
que está implementado con Row Level Security en Postgres, no escondiendo botones: aunque
alguien llamara a la API con su sesión, la base de datos solo le devuelve sus leads.

**¿Y el paciente que pide cita en Madrid y se atiende en Valencia?** Ese caso rompía lo
anterior: Valencia no lo encuentra al buscar, el aviso de duplicado tampoco salta —se
calcula sobre lo que esa persona ve— y acaba con dos fichas y el historial de Madrid
huérfano. Justo lo que este CRM viene a evitar. La respuesta no es abrir el listado, sino
abrir **una pregunta muy concreta**: recepción puede consultar un teléfono completo —el
que el paciente le acaba de dar en el mostrador— y recibe cuatro campos para reconocerlo
(nombre, clínica, estado y fecha), nunca su historial. Si es él, un botón se trae la ficha
entera y el traspaso queda registrado. Sigue sin poder listar los leads de otra clínica:
sin el teléfono delante no ve nada. Está en `buscar_paciente_en_otras_clinicas` y
`reclamar_lead`, y `pnpm verificar` comprueba también que no se puede reclamar un lead sin
acertar su teléfono.

**¿Qué tono usa la IA? Cercano y profesional, de tú, español de España.** Entre 30 y 60
palabras, porque es un WhatsApp, y una sola llamada a la acción. Tres límites que el prompt
no cruza: no da precios, no hace diagnósticos ni promete resultados, y no se inventa
promociones ni fechas —la única que puede escribir es la cita que ve en la ficha—. El mensaje cambia según el estado del lead, y **nunca se envía solo**: se
guarda como nota marcada para que una persona lo revise. Un CRM que manda WhatsApps a
pacientes sin supervisión es un problema, no una función.

**¿Dónde vive la fecha de la cita? En su propio campo, no dentro de una nota.** El estado
«cita agendada» decía que había cita pero no cuándo, así que la hora acababa escrita a mano
en el texto de una nota: ahí no se puede ordenar, ni avisar, ni leerla desde el generador
de mensajes —que además tiene prohibido inventarse fechas y por eso redactaba recordatorios
sin decir la cita—. Ahora es una columna, se guarda siempre en hora de la clínica (todas
están en España, así que la hora que ve el paciente y la que ve el equipo son la misma), y
cambiarla queda en el historial como cualquier otro cambio. Es **opcional a propósito**:
desde el listado se mueve un lead a «cita agendada» de un clic mientras se está al
teléfono, y la fecha se completa después en la ficha, que es donde la pide el formulario.

**¿Dónde se filtra, en el servidor o en el navegador? En el navegador.** Cada clic en un
filtro costaba un renderizado entero en el servidor —casi un segundo medido en producción—
para devolver un subconjunto de los leads que el navegador ya tenía delante. Ahora es
inmediato, y la URL se sigue actualizando con `history.replaceState`, así que un listado
filtrado se puede compartir por su enlace igual que antes. La condición es que **el listado
no pagine**: los leads de una clínica caben de sobra en una carga. El día que haya que
paginar, el filtro tiene que volver al servidor; está anotado en el propio componente.

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

`pnpm verificar` comprueba contra la base de datos real que recepción solo ve su clínica,
que puede traerse un paciente de otra sede sin duplicarlo y que un anónimo no ve nada.
`pnpm ensayo` recorre en producción el flujo completo con un navegador real: crear,
duplicado, nota, IA, editar, borrar con confirmación y traspaso entre clínicas.

---

## Qué haría distinto con más tiempo

1. **Entrada automática de leads.** Hoy se dan de alta a mano, que es justo el trabajo que
   Vitalis quiere quitarse. Un webhook para el formulario web y para Instagram cerraría el
   círculo.
2. **Enviar el WhatsApp, no solo redactarlo,** con la API de WhatsApp Business, manteniendo
   el paso de revisión humana.
3. **Avisos de leads que se enfrían.** La métrica está, pero hay que acordarse de mirarla.
4. **Tests de verdad.** Lo que hay son scripts, no una suite en CI.

Y de lo ya construido revisaría dos cosas: el borrado es real y debería ser lógico (una
papelera de 30 días evitaría el susto), y el listado no pagina —que es justo el
supuesto del que depende el filtrado en el navegador—.
