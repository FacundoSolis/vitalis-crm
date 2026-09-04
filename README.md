# Vitalis · Panel de leads

Panel interno de captación de pacientes para Clínica Dental Vitalis (Madrid, Valencia y Sevilla).
Sustituye el Excel que hoy se pasan por email entre las tres clínicas.

**Stack:** Next.js 16 (App Router, Server Actions) · Supabase (Postgres + Auth + RLS) · Vercel · Claude Opus 5 · shadcn/ui

---

## Qué hace

- **Todos los leads en un sitio**, vengan de Instagram, del formulario web o de una llamada.
- **Filtros** por clínica, por estado y búsqueda por nombre o teléfono.
- **Ficha de lead** con historial completo: cada llamada y cada mensaje quedan apuntados.
- **Generador de mensajes de seguimiento**: un botón redacta el WhatsApp con Claude a partir del
  tratamiento, el estado y lo último que se habló. Se guarda como nota para que el equipo lo revise
  antes de enviarlo — nunca se envía solo.
- **Login por usuario**, con permisos distintos para gerencia y para recepción.

---

## Decisiones que he tomado yo

El brief dejaba huecos a propósito. Esto es lo que he decidido y por qué.

### 1. ¿Puede un lead cambiar de clínica de interés? → Sí, es editable

Alguien puede pedir información en Madrid y acabar tratándose en Valencia porque le pilla mejor, o
llamar a la sede equivocada. Bloquearlo obligaría a duplicar el lead y perderías su historial.

Ahora bien, cambiar de clínica cambia quién ve ese lead, así que no puede ser un cambio silencioso:
**cada cambio de clínica (y de estado) se registra automáticamente como una nota de sistema**
mediante un trigger de Postgres. El historial cuenta la verdad completa sin que nadie tenga que
acordarse de apuntarlo.

### 2. ¿Dos leads con el mismo teléfono? → Se avisa, no se fusiona ni se bloquea

Fusionar automáticamente es destructivo y se equivoca: en una familia se comparte teléfono, y la
misma persona puede pedir ortodoncia para su hija y un implante para ella. Bloquear el alta es peor:
la recepcionista está al teléfono con un paciente y el sistema le dice que no.

La solución es **detectar y avisar**. Guardo el teléfono normalizado (solo dígitos, sin el `+34`)
como columna generada de Postgres, y con eso:

- el listado marca los leads con teléfono repetido,
- la ficha enlaza directamente al otro lead, mostrando qué tratamiento pidió y en qué sede.

Decide la persona, que es quien tiene el contexto. Es la decisión reversible; fusionar no lo es.

### 3. ¿Quién ve qué? → Gerencia ve las tres clínicas, recepción solo la suya

El brief pedía "que no pueda entrar cualquiera", y en una clínica con tres sedes eso significa dos
niveles reales: la recepcionista de Madrid trabaja con sus pacientes, y gerencia necesita la foto
completa para comparar sedes.

Lo importante: **está implementado con Row Level Security en Postgres, no escondiendo botones en la
interfaz**. Aunque alguien llamara a la API directamente con su sesión, la base de datos le devuelve
solo sus leads. La interfaz simplemente refleja lo que la base de datos ya impone (a recepción ni
siquiera se le muestra el filtro de clínica, porque no le aporta nada).

### 4. ¿Qué tono usa la IA? → Cercano y profesional, de tú, español de España

Es una clínica dental, no un banco ni una marca de zapatillas. El mensaje tutea, saluda por el nombre
de pila, va entre 30 y 60 palabras (es un WhatsApp) y termina con una única llamada a la acción.

Tres límites que el prompt no cruza nunca, porque el coste de equivocarse es alto:

- **No da precios ni presupuestos.** Eso lo dice la clínica tras ver al paciente.
- **No hace diagnósticos ni promete resultados clínicos.**
- **No se inventa citas, fechas ni promociones** que no estén en la ficha.

Y el mensaje cambia según el estado: a un lead *nuevo* se le agradece el interés, a uno *contactado*
que no respondió se le retoma sin reprochar el silencio, a uno con *cita agendada* se le recuerda, y
a uno *no interesado* se le deja la puerta abierta sin presión.

**El mensaje nunca se envía solo.** Se guarda como nota de tipo "mensaje generado por IA", marcada
visualmente, con un botón de copiar. La persona lo revisa y lo pega en WhatsApp. Un CRM que manda
WhatsApps a pacientes sin supervisión es un problema, no una función.

### Decisiones menores

- **Los implantes y la ortodoncia se marcan como alto valor.** El brief decía que los implantes se
  enfrían por tardar en contactar, así que hay una métrica arriba —"alto valor en frío"— que cuenta
  los leads de alto valor todavía sin contactar. Es el número que importa cada mañana.
- **Estados como embudo, no como etiquetas sueltas.** `nuevo → contactado → cita agendada → cliente`,
  con `no interesado` como salida. Se puede cambiar de estado desde el listado sin abrir la ficha.
- **Las notas de sistema no se pueden borrar.** Son el rastro de auditoría; las notas escritas por
  personas sí.

---

## Cómo se levanta en local

```bash
pnpm install
cp .env.example .env.local     # y rellena las cuatro variables
pnpm seed                      # crea los usuarios de prueba y datos de ejemplo
pnpm dev
```

Variables de entorno:

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Proyecto de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente de navegador (limitado por RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo para el script de seed, nunca en el navegador |
| `ANTHROPIC_API_KEY` | Generación de mensajes de seguimiento |

### Usuarios de prueba

| Usuario | Rol | Ve |
|---|---|---|
| `gerencia@vitalis.es` | admin | Las tres clínicas |
| `madrid@vitalis.es` | recepción | Solo Madrid |
| `valencia@vitalis.es` | recepción | Solo Valencia |

Contraseña de los tres: `Vitalis2026!`

### Comprobar que los permisos funcionan

```bash
node --env-file=.env.local scripts/verificar.mjs
```

Se conecta a la base de datos real con cada usuario y comprueba que recepción solo ve su clínica,
que no puede crear leads en otra, que el rastro de auditoría se escribe solo y que un anónimo no ve
nada.

---

## Estructura

```
src/
├── app/
│   ├── acciones/leads.ts     Server Actions del CRUD (validadas con zod)
│   ├── acciones/ia.ts        Generación del mensaje con Claude
│   ├── leads/[id]/page.tsx   Ficha del lead
│   ├── login/page.tsx
│   └── page.tsx              Listado con filtros y métricas
├── components/               Interfaz (shadcn/ui en components/ui)
├── lib/dominio.ts            Vocabulario del CRM: tipos, etiquetas, colores
├── lib/supabase/             Clientes de navegador y de servidor
└── proxy.ts                  Refresco de sesión y protección de rutas
supabase/migrations/          Esquema, triggers y políticas de RLS
```

---

## Qué haría distinto con más tiempo

**Lo que más echo en falta, por orden:**

1. **Entrada automática de leads.** Hoy se dan de alta a mano, que es justo el trabajo que Vitalis
   quiere quitarse. Un endpoint webhook para el formulario web y para los anuncios de Instagram
   cerraría el círculo de verdad.
2. **Enviar el WhatsApp, no solo redactarlo.** Con la API de WhatsApp Business, el flujo sería
   generar → revisar → enviar sin salir del panel, y la respuesta del paciente entraría como nota.
   Mantendría el paso de revisión humana.
3. **Avisos de leads que se enfrían.** Un lead de implantes en estado "nuevo" a las 24 horas debería
   avisar a alguien. Hoy la métrica está, pero hay que mirarla.
4. **Tests automatizados.** El script de verificación cubre los permisos, que es la parte más
   delicada, pero es un script, no una suite. Con más tiempo: Playwright para los flujos y tests de
   las políticas de RLS en CI.

**Cosas que revisaría de lo que ya hay:**

- **La eliminación es un borrado real.** Para un CRM sería mejor un borrado lógico: si alguien borra
  un lead por error se pierde su historial. Lo dejé simple porque el enunciado pedía CRUD completo,
  pero en producción sería `archivado_en` y una papelera.
- **El listado no pagina.** Con 18 leads da igual; con 2.000 no. Haría paginación en servidor.
- **`confirm()` del navegador para confirmar borrados.** Funciona, pero desentona con el resto de la
  interfaz. Un diálogo de shadcn quedaría mejor.
- **Streaming del mensaje de IA.** Ahora aparece de golpe tras un par de segundos. Verlo escribirse
  se siente bastante más rápido aunque tarde lo mismo.
