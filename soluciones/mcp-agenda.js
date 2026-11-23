#!/usr/bin/env node
// Solución de referencia: el MCP «agenda» sobre la API de Acme Agenda (ejemplo/api/server.js).
// Cada endpoint de la API se vuelve una herramienta. Node 18+, sin dependencias.
//   AGENDA_API_URL (por defecto http://localhost:4000)
const API = process.env.AGENDA_API_URL || 'http://localhost:4000';

async function api(method, ruta, body) {
  const r = await fetch(API + ruta, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(data.error || `HTTP ${r.status}`); e.data = data; throw e; }
  return data;
}

const TOOLS = [
  {
    name: 'ver_disponibilidad',
    description: 'Horarios libres para demos de los próximos días (sin citas tomadas, fines de semana ni días festivos de México). Úsala antes de proponer u agendar una demo.',
    inputSchema: { type: 'object', properties: { desde: { type: 'string', description: 'Fecha inicial AAAA-MM-DD (por defecto hoy)' }, dias: { type: 'integer', minimum: 1, maximum: 15, description: 'Cuántos días hábiles (por defecto 5)' } } },
    annotations: { readOnlyHint: true },
    run: ({ desde, dias }) => api('GET', `/disponibilidad?${new URLSearchParams({ ...(desde && { desde }), ...(dias && { dias: String(dias) }) })}`)
  },
  {
    name: 'agendar_demo',
    description: 'Agenda una demo de 30 min con un lead (id de la tabla de leads) en una fecha y hora libres. Si el horario no está libre, devuelve los horarios libres de ese día para que propongas otro.',
    inputSchema: { type: 'object', properties: { lead_id: { type: 'string', description: 'Id del lead, p. ej. L1' }, fecha: { type: 'string', description: 'AAAA-MM-DD' }, hora: { type: 'string', description: 'HH:MM, p. ej. 10:00' } }, required: ['lead_id', 'fecha', 'hora'] },
    annotations: { readOnlyHint: false },
    run: (a) => api('POST', '/citas', a)
  }
];

// ── Protocolo MCP: JSON-RPC por stdin/stdout ──
const send = (m) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', ...m }) + '\n');
async function handle({ id, method, params = {} }) {
  if (method === 'initialize') return send({ id, result: { protocolVersion: params.protocolVersion || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'agenda', version: '1.0.0' } } });
  if (id === undefined) return; // notificaciones
  if (method === 'ping') return send({ id, result: {} });
  if (method === 'tools/list') return send({ id, result: { tools: TOOLS.map(({ run, ...t }) => t) } });
  if (method === 'tools/call') {
    const t = TOOLS.find((x) => x.name === params.name);
    if (!t) return send({ id, error: { code: -32602, message: `Herramienta desconocida: ${params.name}` } });
    try { return send({ id, result: { content: [{ type: 'text', text: JSON.stringify(await t.run(params.arguments || {}), null, 2) }] } }); }
    catch (e) {
      const extra = e.data ? `\n${JSON.stringify(e.data)}` : (e.cause?.code === 'ECONNREFUSED' ? `\n¿Está corriendo la API? node api/server.js (${API})` : '');
      return send({ id, result: { content: [{ type: 'text', text: e.message + extra }], isError: true } });
    }
  }
  send({ id, error: { code: -32601, message: `Método no soportado: ${method}` } });
}
let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { buf += c; let i; while ((i = buf.indexOf('\n')) >= 0) { const l = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (l) { try { handle(JSON.parse(l)).catch((e) => process.stderr.write(e.message + '\n')); } catch { send({ id: null, error: { code: -32700, message: 'JSON inválido' } }); } } } });
process.stderr.write(`MCP agenda listo · API ${API}\n`);
