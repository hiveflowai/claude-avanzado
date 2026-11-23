# Claude avanzado con MCP

Taller práctico de **John Olven** ([Hiveflow](https://hiveflow.ai)). Lo sigues en tu computadora, paso a paso: **contexto → skills → herramientas y plugins → un agente con horario → tu propio MCP**.

```
CLAUDE.md (contexto) ─► Skill (proceso) ─► MCP + plugin (herramientas) ─► agente con horario ─► tu MCP en la nube
```

> **¿Prefieres que tu agente te guíe?** Abre Claude Code en una carpeta vacía y pégale:
> *Lee https://github.com/hiveflowai/claude-avanzado/blob/main/TALLER.md y guíame paso a paso por el taller. Haz tú los comandos y explícame qué aprendí en cada paso.*

Ejemplo: **Acme Agenda**, una startup ficticia que vende recordatorios por WhatsApp a clínicas. Cámbiala por la tuya.

## 0 · Antes de empezar (2 min)

- [Claude Code](https://docs.claude.com/en/docs/claude-code) instalado y con sesión (`claude` en la terminal) · Node 18+ · git.

```bash
git clone https://github.com/hiveflowai/claude-avanzado
cd claude-avanzado/ejemplo
claude
```

## 1 · Contexto: `CLAUDE.md` (5 min)

Claude lee [`ejemplo/CLAUDE.md`](ejemplo/CLAUDE.md) **siempre** al entrar: quiénes somos, precios, tono y reglas. Pruébalo:

> ¿Qué vendemos y a quién? ¿Puedes ofrecer un descuento?

Para tu startup: `/init` crea uno a partir de tu proyecto. Menos de 200 líneas, concreto, y la prueba de cada línea: *¿si la quito, se equivoca?*

## 2 · Skills: un proceso que se repite igual (5 min)

Una skill es una carpeta con un `SKILL.md`: **cuándo** usarla y **cómo**. Mira [`ejemplo/.claude/skills/follow-up/SKILL.md`](ejemplo/.claude/skills/follow-up/SKILL.md) y pide:

> Escríbele un follow-up a la Dra. Paula Ríos de Clínica Dental Sonrisa.

Claude la carga sola cuando la petición coincide con su `description`. Deja el borrador en `borradores/`, sin enviarlo.

Y un **subagente** para revisar: [`ejemplo/.claude/agents/revisor.md`](ejemplo/.claude/agents/revisor.md) → *«Que el revisor revise los borradores»*.

## 3 · Herramientas: MCP y plugins (10 min)

MCP es el USB-C de la IA: un estándar para que Claude use herramientas. Instala el plugin de este repo (trae un MCP de leads y una skill):

```
/plugin marketplace add hiveflowai/claude-avanzado
/plugin install leads@claude-avanzado
```

O desde la terminal: `claude plugin marketplace add hiveflowai/claude-avanzado && claude plugin install leads@claude-avanzado`.

Y el **kit** para construir lo tuyo: `/plugin install kit@claude-avanzado` trae 4 skills que le enseñan a tu Claude a crear, con el formato correcto, tu propio **MCP** (`crear-mcp`), **skills** (`crear-skill`), **plugins y conectores** (`crear-plugin`) y **agentes con horario** (`programar-agente`).

Reinicia (o `/reload-plugins`), revisa con `/mcp` que esté **leads** y pide:

> Califica los leads nuevos y dime a quién llamo primero.

Conectores remotos, igual de fácil: `claude mcp add --transport http <nombre> <url>`. Regla: da solo los permisos que la tarea necesita.

## 4 · Un agente: el mismo prompt + un horario (5 min)

Un comando es una tarea; **con horario es un agente**. El prompt: [`agente/prompt-lunes.md`](agente/prompt-lunes.md).

- **En Claude Code:** `/schedule` → «cada lunes 8 a.m.» + el prompt.
- **Hecho en casa:** [`agente/cron.sh`](agente/cron.sh) con `claude -p`, solo las herramientas permitidas (`--allowedTools`) y salida JSON.

## 5 · Tu propio MCP: datos → API → MCP → conectar → probar (15 min)

Primero mira [`plugins/leads/mcp/server.js`](plugins/leads/mcp/server.js): ~100 líneas, sin dependencias, tres partes (**datos**, **herramientas**, **protocolo**). Ahora uno de verdad, desde `ejemplo/`:

1. **Los datos:** [`datos/agenda.json`](ejemplo/datos/agenda.json) (horario y citas) y [`datos/leads.json`](ejemplo/datos/leads.json).
2. **La API:** `node api/server.js` → `http://localhost:4000` (`GET /disponibilidad`, `POST /citas`; descarta los festivos de México con Nager.Date). Pruébala: `curl "localhost:4000/disponibilidad?dias=3"`.
3. **El MCP:** pídele a Claude *«Usa la skill crear-mcp: hazme mcp/agenda.js sobre la API (ver_disponibilidad y agendar_demo)»*. Solución de referencia: [`soluciones/mcp-agenda.js`](soluciones/mcp-agenda.js).
4. **Conéctalo:**
   - **Claude de escritorio:** Configuración → Desarrollador → Editar configuración → en `claude_desktop_config.json`:
     ```json
     { "mcpServers": { "agenda": { "command": "node", "args": ["/RUTA/ABSOLUTA/ejemplo/mcp/agenda.js"], "env": { "AGENDA_API_URL": "http://localhost:4000" } } } }
     ```
     Cierra Claude por completo y ábrelo: verás **agenda** en las herramientas.
   - **Claude Code:** `claude mcp add agenda -e AGENDA_API_URL=http://localhost:4000 -- node "$(pwd)/mcp/agenda.js"`
5. **Pruébalo:** `printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node mcp/agenda.js` · el Inspector: `npx @modelcontextprotocol/inspector node mcp/agenda.js` · y en Claude: *«¿Qué horarios tengo para la demo con la Clínica Dental Sonrisa? Agéndala.»*

¿Tienes tu propia API? Mismos pasos con tus endpoints.

## 6 · ¿Y en producción? Hiveflow

Todo esto corre en tu laptop. Cuando el agente tiene que correr solo, con aprobación humana, bitácora y para tu equipo, eso es **[Hiveflow](https://hiveflow.ai)**: conecta tu Claude a `https://mcp.hiveflow.ai` y pídele que **hospede tu MCP** (corre aislado en un sandbox) y lo use en un agente que **conteste por WhatsApp**: el lead escribe, el agente lo registra y califica con tu MCP, agenda la demo y, si pide descuento, te pide aprobación al celular. Cuenta: [app.hiveflow.ai/signup](https://app.hiveflow.ai/signup).

---

Licencia MIT · [hiveflow.ai](https://hiveflow.ai) · [@johnolven](https://instagram.com/johnolven)
