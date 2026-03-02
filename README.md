# Dashboard Unificado de Agentes

Base técnica para centralizar, tras login, los reportes que generan los agentes (Coach, Geek, Pesito, Florencia, Researcher y Nexus). Incluye menú con tabs por sección y vista rápida de todas las tarjetas.

## Stack

- Next.js 16.1 (App Router + TypeScript)
- TailwindCSS para la capa visual
- Autenticación propietaria (POST `/api/login` + cookie httpOnly firmada)
- API REST por agente (`/api/agents/[agent]`) con tokens por header `x-agent-token`
- Persistencia primaria en **Supabase** (tabla `agent_sections`) con fallback local `data/agents.json`

## Setup local

```bash
cd unified-dashboard
cp .env.example .env.local
# Rellena las variables (login, tokens y credenciales de Supabase)
npm install
npm run dev
```

Variables necesarias:

| Variable | Uso |
| --- | --- |
| `ADMIN_EMAIL` | Email autorizado (Sebastián) |
| `ADMIN_PASSWORD` | Contraseña asociada |
| `SESSION_TOKEN` | Secreto usado para firmar la cookie de sesión |
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Key con permisos de escritura (solo server) |
| `SUPABASE_ANON_KEY` | Anon key para futuras integraciones en cliente |
| `SUPABASE_TABLE` *(opcional)* | Nombre de la tabla (default `agent_sections`) |
| `AGENT_TOKEN_<AGENTE>` | Token privado que cada agente enviará en `x-agent-token` |

### Tabla recomendada en Supabase

```sql
create table if not exists agent_sections (
  agent text primary key,
  data jsonb not null
);
```

> La app upsertea `data` por `agent`. Si la tabla está vacía, se insertan los valores iniciales al primer acceso.

## Flujo de autenticación

1. `/login` muestra formulario email + password.
2. `POST /api/login` valida contra `ADMIN_EMAIL` / `ADMIN_PASSWORD` y, si coincide, emite cookie httpOnly (`SESSION_TOKEN`).
3. `middleware.ts` deja pasar `/login`, `/api/login` y `/api/agents/*`; todo lo demás exige la cookie válida.
4. `POST /api/logout` borra la cookie y redirige a `/login`.

## UI / UX

- Tabs laterales con las secciones solicitadas:
  - 💰 Finanzas (Pesito)
  - 🔬 Investigación (Researcher)
  - 💪 Vida Sana (Coach)
  - 📅 Agenda (Florencia)
  - 📊 Datos (Geek)
  - 🔗 Coordinación (Nexus)
- Atajos de teclado: presiona `1`–`6` para saltar instantáneamente entre tabs sin tocar el mouse.
- Al seleccionar un tab se muestra el widget (AgentCard) con resumen, highlights, métricas y links.
- La selección persiste en `localStorage` y en la URL vía `?agent=<clave>`, habilitando deep links compartibles.
- Sección “Vista rápida” que lista todos los widgets para inspección masiva.

## API para agentes

Endpoint: `POST /api/agents/:agent`

Headers:
```
Content-Type: application/json
x-agent-token: <AGENT_TOKEN_AGENT>
```

Body (cualquier campo es opcional, se mergea con lo existente):
```json
{
  "summary": "Nueva síntesis del día",
  "highlights": ["Logro 1", "Logro 2"],
  "metrics": {"tasks": 4, "impact": 9},
  "links": [{"label": "Reporte", "url": "https://..."}]
}
```

Respuesta:
```json
{
  "data": {
    "title": "Pesito",
    "summary": "…",
    "highlights": ["…"],
    "metrics": {"…": 10},
    "links": [{"label": "…", "url": "…"}],
    "lastUpdated": "2026-02-26T13:45:00.000Z"
  }
}
```

`GET /api/agents/:agent` devuelve el bloque completo (útil para debugging o integraciones).

## Próximos pasos sugeridos

1. Integrar orígenes de datos reales por agente (e.g. Pesito → API financiera, Florencia → Calendar).
2. Añadir métricas/visualizaciones específicas (Recharts para Pesito, timeline para Florencia, etc.).
3. Configurar revalidación o streaming para mostrar actualizaciones al instante.
4. Añadir auditoría de cambios y backups automáticos (Supabase cron o triggers).
