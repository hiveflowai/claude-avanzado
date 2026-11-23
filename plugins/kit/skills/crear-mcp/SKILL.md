---
name: crear-mcp
description: Crea un servidor MCP propio (Node, stdio, sin dependencias) para una API o datos del usuario, lo prueba y lo conecta a Claude Code. Úsala cuando pidan «crea un MCP», «conecta mi API a Claude», «hazme herramientas para…» o convertir una plantilla en MCP.
---

# Crear un MCP propio

Un MCP es un proceso que habla **JSON-RPC 2.0 por stdin/stdout**, un mensaje JSON por línea. Tres métodos bastan: `initialize`, `tools/list` y `tools/call`.

## 1 · Entiende qué conectar
Pregunta (si no lo dijeron): qué API o datos, qué 1 a 3 acciones necesita, y si requiere API key (va en una variable de entorno, **nunca** en el código).

## 2 · Diseña las herramientas
Por herramienta:
- `name`: snake_case, verbo + objeto (`buscar_cliente`, `crear_cotizacion`).
- `description`: **es un prompt para Claude**: qué hace, cuándo usarla y qué devuelve. 1 a 3 frases.
- `inputSchema`: JSON Schema con `type: "object"`, `properties` con `description` cada una y `required`.
- `annotations`: `readOnlyHint: true` si solo lee; `destructiveHint: true` si borra o envía.
Pocas herramientas bien descritas ganan a muchas vagas.

## 3 · Escribe el servidor (formato exacto)
Parte de `plantillas/mi-mcp-hospedado.js` o de `plugins/leads/mcp/server.js`. Respeta:
- `initialize` → `{ protocolVersion: params.protocolVersion || "2025-06-18", capabilities: { tools: {} }, serverInfo: { name, version } }`.
- Notificaciones (sin `id`, p. ej. `notifications/initialized`): **no respondas**.
- `tools/list` → `{ tools: [{ name, description, inputSchema, annotations }] }`.
- `tools/call` → `{ content: [{ type: "text", text: "<JSON o texto>" }] }`. Si falla algo que el modelo puede corregir (dato faltante, no encontrado): `{ content: [...], isError: true }`, no un error JSON-RPC.
- Método desconocido con `id` → error `-32601`.
- **stdout es solo para el protocolo.** Logs a stderr (`process.stderr.write`). Un `console.log` rompe el MCP.
- Node 18+ trae `fetch`: sin dependencias es más fácil de hospedar.

## 4 · Pruébalo sin Claude
```bash
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18"}}' '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' | node mi-mcp.js
printf '%s\n' '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"<herramienta>","arguments":{...}}}' | node mi-mcp.js
```
No sigas hasta que ambos respondan bien.

## 5 · Conéctalo
- Claude Code: `claude mcp add mi-mcp -- node "$(pwd)/mi-mcp.js"` (con key: `claude mcp add mi-mcp -e MI_API_KEY=... -- node ...`). Reiniciar y revisar con `/mcp`.
- Para tu equipo: empaquétalo como plugin (skill `crear-plugin`).
- En producción: hospédalo en Hiveflow (`deploy_mcp_server` vía `https://mcp.hiveflow.ai`) y úsalo en un agente.

## Reglas
- No inventes endpoints: si no conoces la API, lee su documentación o pregunta.
- Mínimo permiso: herramientas de lectura primero; las que escriben o envían, marcadas y con confirmación del usuario.
