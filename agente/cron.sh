#!/usr/bin/env bash
# Agente hecho en casa: el mismo prompt, sin que estés, con un horario (cron).
# crontab -e  →  0 8 * * 1  cd ~/claude-avanzado/ejemplo && ../agente/cron.sh
set -euo pipefail
# Herramientas del MCP: mcp__plugin_leads_leads__* si lo instalaste como plugin; mcp__leads__* si usaste `claude mcp add leads`.
claude -p "$(cat "$(dirname "$0")/prompt-lunes.md")" \
  --allowedTools "mcp__plugin_leads_leads__listar_leads,mcp__plugin_leads_leads__calificar_lead,mcp__leads__listar_leads,mcp__leads__calificar_lead,Read,Write,Glob,Task" \
  --output-format json > "resumen-$(date +%F).json"
