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

## Paso 5 · Su propio MCP

1. Lee `plugins/leads/mcp/server.js` y explícale sus 3 partes: **los datos**, **las herramientas** (nombre + descripción escrita para Claude + esquema de entrada) y **el protocolo** (JSON-RPC por stdin/stdout: `initialize`, `tools/list`, `tools/call`).
2. Pruébalo sin Claude (desde `ejemplo/`):

```bash
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node ../plugins/leads/mcp/server.js
```

   **Comprueba:** responde con `listar_leads`, `calificar_lead` y `registrar_lead`.

3. **Ahora el suyo: el MCP `agenda` de Acme Agenda.** Sigue la skill `crear-mcp` del plugin kit (o `plugins/kit/skills/crear-mcp/SKILL.md` si no está instalado). Es la pieza que usa el agente de WhatsApp para agendar la demo con un lead. Si la persona prefiere conectar la API de su propia startup, usa la suya y aplica los mismos pasos.
   - Crea `ejemplo/mcp-agenda.js` (Node 18+, sin dependencias; parte de `plantillas/mi-mcp-hospedado.js`) con dos herramientas:
     - `ver_disponibilidad({ desde, dias })`: horarios libres de los próximos `dias` (por defecto 5) a partir de `desde` (AAAA-MM-DD, por defecto hoy), usando el `horario` de `datos/agenda.json`, quitando las `citas` ya tomadas, los fines de semana y los **días festivos de México** de la API pública **Nager.Date** (gratis, sin llave): `https://date.nager.at/api/v3/PublicHolidays/<año>/MX`.
     - `agendar_demo({ lead_id, fecha, hora })`: valida que el horario esté libre (si no, `isError: true` con los horarios libres de ese día), lo guarda en `citas` con la empresa del lead (de `datos/leads.json`) y devuelve la confirmación.
   - Escribe cada `description` para Claude: qué hace y cuándo usarla. Errores corregibles con `isError: true`. Nada de logs en stdout (solo stderr).
   - Pruébalo con `tools/list` y con `tools/call` de las dos herramientas (por ejemplo, agenda una demo para `L1`). Comprueba que un día festivo (16 de noviembre de 2026, Revolución) **no** aparezca como disponible.
   - Conéctalo: `claude mcp add agenda -- node "$(pwd)/mcp-agenda.js"` y dile que reinicie y pida: *«¿Qué horarios tengo para la demo con la Clínica Dental Sonrisa? Agéndala el primero libre.»*

**Explica:** la descripción de cada herramienta es un prompt; es lo que hace que Claude la use bien.

## Paso 6 · Producción: Hiveflow y WhatsApp

Explica, sin ejecutar nada salvo que la persona lo pida: todo esto corre en su laptop. Para que el agente corra solo, con aprobación humana, bitácora, para su equipo y **contestando por WhatsApp**, se monta en **Hiveflow**:

1. Cuenta en `https://app.hiveflow.ai/signup`.
2. Conectar su Claude: `claude mcp add --transport http hiveflow https://mcp.hiveflow.ai` y autorizar con `/mcp`.
3. Pedirle a Claude: *«Hospeda mi MCP (mi-mcp.js) en Hiveflow con deploy_mcp_server y úsalo en un agente de WhatsApp que me pida aprobación antes de ofrecer descuentos.»* Un flujo necesita un nodo de inicio (Trigger, Chat Input o WhatsApp Input).

## Al terminar

Haz un resumen de 5 líneas de lo que construyó la persona y propónle su siguiente paso: su `CLAUDE.md`, una skill del proceso que más repite y su MCP conectado a un agente con horario.
