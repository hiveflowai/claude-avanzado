#!/usr/bin/env node
// API de Acme Agenda (Node 18+, sin dependencias). Lee ../datos/*.json y consulta los festivos de México.
//   node api/server.js            → http://localhost:4000
//   GET  /leads                   → los leads
//   GET  /disponibilidad?desde=AAAA-MM-DD&dias=5  → horarios libres (sin citas, fines de semana ni festivos)
//   POST /citas {lead_id, fecha, hora}            → agenda una demo (409 si el horario no está libre)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 4000;
const DATOS = path.join(__dirname, '..', 'datos');
const leer = (f) => JSON.parse(fs.readFileSync(path.join(DATOS, f), 'utf8'));
const guardar = (f, d) => fs.writeFileSync(path.join(DATOS, f), JSON.stringify(d, null, 2) + '\n');
const DIAS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

const festivosCache = {};
async function festivos(anio) {
  if (!festivosCache[anio]) {
    try {
      const r = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${anio}/MX`);
      festivosCache[anio] = r.ok ? (await r.json()).map((f) => ({ fecha: f.date, nombre: f.localName })) : [];
    } catch { festivosCache[anio] = []; } // sin internet: sin festivos, pero la API sigue
  }
  return festivosCache[anio];
}

const hoy = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
const sumarDias = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

async function disponibilidad(desde = hoy(), dias = 5) {
  const agenda = leer('agenda.json');
  const out = [];
  for (let i = 0; out.length < dias && i < dias + 14; i++) {
    const fecha = sumarDias(desde, i);
    const dia = DIAS[new Date(fecha + 'T12:00:00Z').getUTCDay()];
    const fest = (await festivos(fecha.slice(0, 4))).find((f) => f.fecha === fecha);
    if (fest) { out.push({ fecha, dia, festivo: fest.nombre, horas: [] }); continue; }
    const base = agenda.horario[dia];
    if (!base) continue; // fin de semana
    const tomadas = agenda.citas.filter((c) => c.fecha === fecha).map((c) => c.hora);
    out.push({ fecha, dia, horas: base.filter((h) => !tomadas.includes(h)) });
  }
  return out;
}

async function agendar({ lead_id, fecha, hora }) {
  if (!lead_id || !fecha || !hora) return [400, { error: 'Faltan lead_id, fecha u hora' }];
  const lead = leer('leads.json').find((l) => l.id === lead_id);
  if (!lead) return [404, { error: `No existe el lead ${lead_id}` }];
  const [dia] = await disponibilidad(fecha, 1);
  if (!dia || dia.fecha !== fecha || !dia.horas.includes(hora)) {
    return [409, { error: `El ${fecha} a las ${hora} no está libre`, libres: dia && dia.fecha === fecha ? dia.horas : [], festivo: dia?.festivo }];
  }
  const agenda = leer('agenda.json');
  const cita = { fecha, hora, lead_id, empresa: lead.empresa };
  agenda.citas.push(cita); guardar('agenda.json', agenda);
  return [201, { ok: true, cita }];
}

const json = (res, code, body) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body, null, 2)); };

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (req.method === 'GET' && url.pathname === '/leads') return json(res, 200, leer('leads.json'));
    if (req.method === 'GET' && url.pathname === '/disponibilidad') {
      return json(res, 200, await disponibilidad(url.searchParams.get('desde') || undefined, Number(url.searchParams.get('dias')) || 5));
    }
    if (req.method === 'POST' && url.pathname === '/citas') {
      let body = ''; for await (const ch of req) body += ch;
      const [code, out] = await agendar(JSON.parse(body || '{}'));
      return json(res, code, out);
    }
    json(res, 404, { error: 'Ruta no encontrada', rutas: ['GET /leads', 'GET /disponibilidad', 'POST /citas'] });
  } catch (e) { json(res, 500, { error: e.message }); }
}).listen(PORT, () => console.log(`API de Acme Agenda en http://localhost:${PORT}`));
