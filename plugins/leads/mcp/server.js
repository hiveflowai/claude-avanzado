#!/usr/bin/env node
// MCP «leads»: tu primer servidor MCP, sin dependencias (Node 18+).
// Por dentro MCP es JSON-RPC por stdin/stdout: initialize → tools/list → tools/call.
// Los leads viven en un JSON local (LEADS_FILE, por defecto ./datos/leads.json de donde corras Claude).
const fs = require('fs');
const path = require('path');

const PROTOCOL = '2025-06-18';
const FILE = process.env.LEADS_FILE || path.join(process.cwd(), 'datos', 'leads.json');

const read = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return []; } };
const write = (rows) => { fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(rows, null, 2)); };

// Reglas simples y explicables: el modelo decide, la herramienta da un número con su porqué
function score({ mensaje = '', tamano = '' }) {
  const t = String(mensaje).toLowerCase();
  const porque = [];
  let s = 30;
  if (/cotiz|precio|plan|comprar|contratar|demo/.test(t)) { s += 30; porque.push('pide precio o demo'); }
  if (/urgente|esta semana|hoy|ya/.test(t)) { s += 20; porque.push('tiene urgencia'); }
  if (/equipo|empresa|sucursal|empleados/.test(t) || Number(tamano) >= 10) { s += 15; porque.push('es un equipo, no una persona'); }
  if (/gratis|estudiante|solo curiosidad/.test(t)) { s -= 25; porque.push('busca algo gratis'); }
  return { score: Math.max(0, Math.min(100, s)), porque };
}

const TOOLS = [
  {
    name: 'listar_leads',
    title: 'Listar leads',
    description: 'Lista los leads guardados. Filtra por estado (nuevo, calificado, contactado). Úsala antes de calificar o redactar seguimientos.',
    inputSchema: { type: 'object', properties: { estado: { type: 'string', enum: ['nuevo', 'calificado', 'contactado'] } } },
    annotations: { readOnlyHint: true },
    run: ({ estado }) => read().filter((l) => !estado || l.estado === estado)
  },
  {
    name: 'calificar_lead',
    title: 'Calificar lead',
    description: 'Califica un lead de 0 a 100 con su porqué y lo marca como calificado. Úsala con el id de un lead de listar_leads.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    annotations: { readOnlyHint: false, idempotentHint: true },
    run: ({ id }) => {
      const rows = read(); const l = rows.find((r) => r.id === id);
      if (!l) throw new Error(`No existe el lead ${id}. Usa listar_leads para ver los ids.`);
      Object.assign(l, score(l), { estado: 'calificado' }); write(rows);
      return l;
    }
  },
  {
    name: 'registrar_lead',
    title: 'Registrar lead',
    description: 'Guarda un lead nuevo (empresa, contacto y lo que pidió). Úsala cuando el usuario te pase un prospecto.',
    inputSchema: { type: 'object', properties: { empresa: { type: 'string' }, contacto: { type: 'string' }, mensaje: { type: 'string' }, tamano: { type: 'integer' } }, required: ['empresa', 'mensaje'] },
    annotations: { readOnlyHint: false },
    run: (a) => { const rows = read(); const l = { id: 'L' + (rows.length + 1), estado: 'nuevo', ...a, creado: new Date().toISOString() }; rows.push(l); write(rows); return l; }
  }
];

// ── El protocolo: JSON-RPC por stdio ──
const send = (msg) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', ...msg }) + '\n');
const log = (...a) => process.stderr.write(a.join(' ') + '\n'); // stdout es solo para el protocolo

async function handle(req) {
  const { id, method, params = {} } = req;
  if (method === 'initialize') return send({ id, result: { protocolVersion: params.protocolVersion || PROTOCOL, capabilities: { tools: {} }, serverInfo: { name: 'leads', version: '1.0.0' } } });
  if (method === 'notifications/initialized' || id === undefined) return;
  if (method === 'ping') return send({ id, result: {} });
  if (method === 'tools/list') return send({ id, result: { tools: TOOLS.map(({ run, ...t }) => t) } });
  if (method === 'tools/call') {
    const tool = TOOLS.find((t) => t.name === params.name);
    if (!tool) return send({ id, error: { code: -32602, message: `Herramienta desconocida: ${params.name}` } });
    try { return send({ id, result: { content: [{ type: 'text', text: JSON.stringify(await tool.run(params.arguments || {}), null, 2) }] } }); }
    catch (e) { return send({ id, result: { content: [{ type: 'text', text: e.message }], isError: true } }); }
  }
  return send({ id, error: { code: -32601, message: `Método no soportado: ${method}` } });
}

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk; let i;
  while ((i = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, i).trim(); buffer = buffer.slice(i + 1);
    if (!line) continue;
    let req; try { req = JSON.parse(line); } catch { send({ id: null, error: { code: -32700, message: 'JSON inválido' } }); continue; }
    handle(req).catch((e) => log('error', e.message));
  }
});
log(`MCP leads listo (stdio) · datos: ${FILE}`);
