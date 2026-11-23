#!/usr/bin/env bash
# Agente hecho en casa: el mismo prompt, sin que estés, con un horario (cron).
# crontab -e  →  0 8 * * 1  cd ~/claude-avanzado/ejemplo && ../agente/cron.sh
set -euo pipefail
claude -p "$(cat "$(dirname "$0")/prompt-lunes.md")" \
  --allowedTools "mcp__leads__listar_leads,mcp__leads__calificar_lead,Read,Write,Glob,Task" \
  --output-format json > "resumen-$(date +%F).json"
