---
name: crear-plugin
description: Empaqueta skills, servidores MCP y agentes en un plugin de Claude Code con su marketplace, y explica conectores remotos. Úsala cuando pidan «hazlo plugin», «compártelo con mi equipo», «instalar con un comando» o conectar Claude a un servicio por URL.
---

# Crear un plugin (y conectores)

## Estructura
```
mi-repo/
├── .claude-plugin/marketplace.json     ← el catálogo
└── plugins/mi-plugin/
    ├── .claude-plugin/plugin.json      ← nombre, versión, descripción
    ├── .mcp.json                       ← servidores MCP (opcional)
    ├── skills/<skill>/SKILL.md         ← skills (opcional)
    ├── agents/<agente>.md              ← subagentes (opcional)
    └── mcp/server.js
```

## Archivos exactos
`.claude-plugin/marketplace.json`:
```json
{ "name": "mi-marketplace", "owner": { "name": "Mi startup" },
  "plugins": [ { "name": "mi-plugin", "source": "./plugins/mi-plugin", "description": "Qué trae" } ] }
```
`plugins/mi-plugin/.claude-plugin/plugin.json`:
```json
{ "name": "mi-plugin", "version": "1.0.0", "description": "Qué hace", "author": { "name": "Mi startup" } }
```
`plugins/mi-plugin/.mcp.json` (rutas con `${CLAUDE_PLUGIN_ROOT}`):
```json
{ "mcpServers": { "mi-mcp": { "command": "node", "args": ["${CLAUDE_PLUGIN_ROOT}/mcp/server.js"] } } }
```

## Validar e instalar
```bash
claude plugin validate .
claude plugin marketplace add <usuario>/<repo>      # o una ruta local
claude plugin install mi-plugin@mi-marketplace
```
En la sesión: `/plugin`, `/reload-plugins`, `/mcp`. Las herramientas quedan como `mcp__plugin_<plugin>_<servidor>__<herramienta>`.

## Conectores remotos (MCP por URL)
- Claude Code: `claude mcp add --transport http <nombre> <url>` y autorizar con `/mcp`.
- App de Claude: Personalizar → Conectores → Add custom connector → URL → iniciar sesión.
- Ejemplo: `claude mcp add --transport http hiveflow https://mcp.hiveflow.ai`.
- Lee la pantalla de permisos: da solo lo que la tarea necesita.
