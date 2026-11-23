# Instrucciones para tu agente (Claude Code)

> **Para la persona:** abre Claude Code en una carpeta vacía y pega esto:
>
> *Lee https://github.com/hiveflowai/claude-avanzado/blob/main/TALLER.md y guíame paso a paso por el taller. Haz tú los comandos y explícame qué aprendí en cada paso.*

---

**Para el agente.** Eres el guía del taller «Claude avanzado con MCP». Llevas a la persona por 6 pasos, **uno a la vez**: ejecuta los comandos, comprueba el resultado, explícale en 2 o 3 frases qué aprendió y pregúntale si sigue. Habla en el idioma de la persona. No te saltes las comprobaciones. Si algo falla, usa el «si falla» del paso antes de seguir.

Reglas:
- No envíes nada a nadie (correos, mensajes). En este taller todo se queda en archivos.
- No instales nada fuera de lo que dice cada paso. No uses `sudo`.
- Los archivos de datos son de ejemplo: puedes modificarlos.

## Paso 0 · Preparar (2 min)

```bash
node --version        # necesita 18 o más
git --version
git clone https://github.com/hiveflowai/claude-avanzado
cd claude-avanzado
```

**Comprueba:** existen `ejemplo/CLAUDE.md`, `plugins/leads/mcp/server.js` y `ejemplo/datos/leads.json`.
**Si falla:** sin Node 18+, dile a la persona que lo instale (nodejs.org) y espera. Sin git, descarga el zip de `https://github.com/hiveflowai/claude-avanzado/archive/refs/heads/main.zip`.

Trabaja desde `claude-avanzado/ejemplo` en los pasos siguientes.

## Paso 1 · Contexto: `CLAUDE.md`

1. Lee `ejemplo/CLAUDE.md` y resúmelo en 3 líneas (qué vende Acme Agenda, a quién, reglas).
2. Haz la prueba: responde como si la persona te pidiera un **descuento** para un cliente. Según el CLAUDE.md debes negarte (los decide Ana).

**Explica:** Claude Code lee `CLAUDE.md` siempre al entrar a la carpeta. No dice qué tarea hacer: dice cómo se trabaja ahí. Para su startup, `/init` crea uno. Menos de 200 líneas; la prueba de cada línea: *¿si la quito, se equivoca?*

**Pregúntale** a qué se dedica su startup y propónle 5 líneas de reglas para su propio `CLAUDE.md` (no lo escribas todavía si no quiere).

## Paso 2 · Skills y subagentes

Para crear las suyas con el formato correcto usa la skill `crear-skill` (o `plugins/kit/skills/crear-skill/SKILL.md`); para empaquetarlas y conectar servicios por URL, `crear-plugin`.

1. Lee `ejemplo/.claude/skills/follow-up/SKILL.md`.
2. Sigue esa skill para escribir el follow-up a **Dra. Paula Ríos, Clínica Dental Sonrisa** (lead `L1` de `datos/leads.json`) y guárdalo en `ejemplo/borradores/AAAA-MM-DD-clinica-dental-sonrisa.md`.
3. Lee `ejemplo/.claude/agents/revisor.md` y revisa el borrador con esos criterios (si puedes lanzar subagentes, usa el subagente `revisor`).

**Comprueba:** el archivo existe en `borradores/`, tiene menos de 5 líneas de cuerpo, no ofrece descuento y no se envió a nadie.
**Explica:** una skill es un instructivo con nombre; Claude la carga cuando la petición coincide con su `description`. Un subagente trabaja con sus propias herramientas y te devuelve un resumen.

## Paso 3 · Herramientas: MCP y plugins

Instala los dos plugins del repo: **leads** (un MCP + una skill) y **kit** (skills que te enseñan a crear MCP, skills, plugins y agentes con horario, con el formato correcto):

```bash
claude plugin marketplace add hiveflowai/claude-avanzado
claude plugin install leads@claude-avanzado
claude plugin install kit@claude-avanzado
```

**Si falla** (versión vieja de Claude Code o sin red a GitHub), conecta el MCP directo:

```bash
claude mcp add leads -- node "$(pwd)/../plugins/leads/mcp/server.js"
```

Dile a la persona que **reinicie Claude Code** (o escriba `/reload-plugins`) y que en la sesión nueva escriba `/mcp`: debe ver **leads** conectado con 3 herramientas. Después, en esa sesión, que pida:

> Califica los leads nuevos y dime a quién llamo primero.

**Resultado esperado:** Clínica Dental Sonrisa y Hospital San José arriba (score alto), Fisioterapia Movimiento abajo (busca algo gratis).

Si no puede reiniciar ahora, prueba el MCP tú mismo sin Claude (paso 5, comando de prueba) y sigue.

**Explica:** MCP es el USB-C de la IA: un estándar para que Claude use herramientas. Un plugin empaqueta skills, MCP y agentes y se instala con un comando para todo el equipo. Da solo los permisos que la tarea necesita.

## Paso 4 · Un agente: el mismo prompt + un horario

Guíate con la skill `programar-agente` (o `plugins/kit/skills/programar-agente/SKILL.md`).

1. Lee `agente/prompt-lunes.md` y `agente/cron.sh`.
2. Explica las dos formas de programarlo:
   - En Claude Code: `/schedule` → «cada lunes a las 8 a.m.» + el prompt (lo escribe la persona en la sesión).
   - Hecho en casa: `cron.sh` con `claude -p`, `--allowedTools` (solo las herramientas que necesita) y `--output-format json`.
3. **No instales el cron sin permiso.** Si la persona quiere, muéstrale la línea de `crontab -e` que está en el comentario de `cron.sh`.

**Explica:** un comando es una tarea; con horario (o un evento que lo dispare) es un agente. El prompt es el proceso.

## Paso 5 · Su propio MCP: datos → API → MCP → conectar → probar

Primero, para entender el formato, lee `plugins/leads/mcp/server.js` y explícale sus 3 partes: **los datos**, **las herramientas** (nombre + descripción escrita para Claude + esquema) y **el protocolo** (JSON-RPC por stdin/stdout: `initialize`, `tools/list`, `tools/call`). Ahora construyen uno de verdad, de punta a punta. Todo desde `ejemplo/`.

### 5.1 · Los datos
Muéstrale como **tablas** `datos/agenda.json` (horario por día y citas ya tomadas) y `datos/leads.json` (id, empresa, contacto, qué pidió). Es la información de la startup que el agente va a usar.

### 5.2 · Monta la API
```bash
node api/server.js        # deja esta terminal abierta: http://localhost:4000
```
En otra terminal, pruébala:
```bash
curl "localhost:4000/disponibilidad?desde=2026-11-13&dias=3"
curl -X POST localhost:4000/citas -H "Content-Type: application/json" -d '{"lead_id":"L1","fecha":"2026-11-16","hora":"10:00"}'
```
**Comprueba:** el 16 de noviembre de 2026 sale como `festivo: "Día de la Revolución"` sin horarios (la API consulta los festivos de México en Nager.Date) y la segunda llamada responde `409` porque ese día no está libre.
**Explica:** la API ya existía antes de la IA (aquí es `api/server.js`; en su startup es la suya). El MCP no la reemplaza: la envuelve para que Claude la use.

### 5.3 · De la API al MCP
Con la skill `crear-mcp` (o `plugins/kit/skills/crear-mcp/SKILL.md`), crea `mcp/agenda.js`, Node 18+ sin dependencias, que llame a la API (`AGENDA_API_URL`, por defecto `http://localhost:4000`):
- `GET /disponibilidad` → herramienta `ver_disponibilidad({ desde, dias })`
- `POST /citas` → herramienta `agendar_demo({ lead_id, fecha, hora })`; si la API responde 409, devuélvelo con `isError: true` y los horarios libres.

Cada `description` escrita para Claude; logs solo a stderr. Si la persona se atora, la solución está en `soluciones/mcp-agenda.js` (compárala y explícala, no la copies sin más).

Estructura final:
```
ejemplo/
├── datos/agenda.json · leads.json   ← los datos
├── api/server.js                    ← la API
└── mcp/agenda.js                    ← el MCP (llama a la API)
```

### 5.4 · Conéctalo
**Claude de escritorio** (díselo paso a paso; no edites su configuración sin permiso):
1. Claude → **Configuración → Desarrollador → Editar configuración**. Abre `claude_desktop_config.json` (Mac: `~/Library/Application Support/Claude/`, Windows: `%APPDATA%\Claude\`).
2. Agrega, con la **ruta absoluta** real (dásela con `pwd`):
```json
{
  "mcpServers": {
    "agenda": {
      "command": "node",
      "args": ["/RUTA/ABSOLUTA/claude-avanzado/ejemplo/mcp/agenda.js"],
      "env": { "AGENDA_API_URL": "http://localhost:4000" }
    }
  }
}
```
3. **Cierra Claude por completo** (Cmd+Q) y ábrelo. Si no conecta, usa la ruta completa de node en `"command"` (la que da `which node`, p. ej. `/opt/homebrew/bin/node`): las apps de escritorio no siempre ven el PATH de la terminal. En el chat, el menú de herramientas debe mostrar **agenda** con 2 herramientas.

**Claude Code:**
```bash
claude mcp add agenda -e AGENDA_API_URL=http://localhost:4000 -- node "$(pwd)/mcp/agenda.js"
```
Reinicia y revisa con `/mcp`.

### 5.5 · Pruébalo (de abajo hacia arriba)
1. **La API:** los `curl` del 5.2.
2. **El MCP sin Claude:**
```bash
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node mcp/agenda.js
printf '%s\n' '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"ver_disponibilidad","arguments":{"dias":3}}}' | node mcp/agenda.js
```
3. **Con el Inspector** (una página web para llamar las herramientas a mano): `npx @modelcontextprotocol/inspector node mcp/agenda.js`.
4. **En Claude:** *«¿Qué horarios tengo para la demo con la Clínica Dental Sonrisa? Agéndala el primero libre.»* Debe llamar `ver_disponibilidad` y luego `agendar_demo`; revisa que la cita quedó en `datos/agenda.json`.
5. **Si no aparece en Claude de escritorio:** revisa la ruta absoluta, que la API esté corriendo y el log `~/Library/Logs/Claude/mcp-server-agenda.log` (Mac).

**Explica:** se prueba de abajo hacia arriba: si la API falla, el MCP falla; si el MCP no responde a `tools/list`, Claude no lo ve. La descripción de cada herramienta es un prompt: es lo que hace que Claude la use bien.

## Paso 6 · Producción: Hiveflow y WhatsApp

Explica, sin ejecutar nada salvo que la persona lo pida: todo esto corre en su laptop. Para que el agente corra solo, con aprobación humana, bitácora, para su equipo y **contestando por WhatsApp**, se monta en **Hiveflow**:

1. Cuenta en `https://app.hiveflow.ai/signup`.
2. Conectar su Claude: `claude mcp add --transport http hiveflow https://mcp.hiveflow.ai` y autorizar con `/mcp`.
3. Pedirle a Claude: *«Hospeda mi MCP (mi-mcp.js) en Hiveflow con deploy_mcp_server y úsalo en un agente de WhatsApp que me pida aprobación antes de ofrecer descuentos.»* Un flujo necesita un nodo de inicio (Trigger, Chat Input o WhatsApp Input).

## Al terminar

Haz un resumen de 5 líneas de lo que construyó la persona y propónle su siguiente paso: su `CLAUDE.md`, una skill del proceso que más repite y su MCP conectado a un agente con horario.
