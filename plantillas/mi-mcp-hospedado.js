// Tu MCP en una sola herramienta, listo para hospedarlo (por ejemplo en Hiveflow con deploy_mcp_server).
// Cambia la herramienta por la de tu API y prueba local:
//   printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node plantillas/mi-mcp-hospedado.js
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const send = (m) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', ...m }) + '\n');
const tools = [{
  name: 'mi_herramienta',
  description: 'Describe para Claude qué hace y cuándo usarla.',
  inputSchema: { type: 'object', properties: { texto: { type: 'string' } }, required: ['texto'] }
}];
rl.on('line', (line) => {
  let m; try { m = JSON.parse(line); } catch { return; }
  if (m.method === 'initialize') return send({ id: m.id, result: { protocolVersion: m.params?.protocolVersion || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'mi-mcp', version: '0.1.0' } } });
  if (m.id === undefined) return;
  if (m.method === 'tools/list') return send({ id: m.id, result: { tools } });
  if (m.method === 'tools/call') return send({ id: m.id, result: { content: [{ type: 'text', text: `Recibí: ${m.params?.arguments?.texto}` }] } });
  send({ id: m.id, error: { code: -32601, message: 'Método no soportado' } });
});
