---
name: programar-agente
description: Convierte un prompt en un agente que corre solo a cierta hora (Claude /schedule o cron con claude -p), con herramientas mínimas y salida verificable. Úsala cuando pidan «que corra cada lunes», «agéndalo», «a las 8 a.m.», «un agente que trabaje solo» o automatizar una tarea repetida.
---

# Programar un agente

Un comando es una tarea; **con horario (o un evento) es un agente**.

## 1 · Escribe el prompt como proceso
Archivo `agente/<nombre>.md`: objetivo, pasos numerados, qué herramientas usa, dónde deja el resultado (un archivo con fecha) y la línea **«No envíes nada a nadie»** (o qué requiere aprobación).

## 2 · Elige cómo arrancarlo
- **En Claude Code:** `/schedule` → describe la frecuencia («lunes a viernes 8 a.m.») y pega el prompt. Se pausa y edita desde ahí.
- **En la app de Claude:** Tareas programadas → Nueva tarea → instrucciones + cuándo.
- **Hecho en casa (cron):**
```bash
0 8 * * 1-5  cd /ruta/proyecto && claude -p "$(cat agente/lunes.md)" \
  --allowedTools "Read,Write,Glob,mcp__<servidor>__<herramienta>" \
  --output-format json > "resultado-$(date +\%F).json"
```
  - `--allowedTools`: solo lo que necesita. Nada de enviar o borrar sin aprobación.
  - En crontab el `%` va escapado (`\%`).
  - La computadora debe estar encendida a esa hora.

## 3 · Pruébalo antes de agendarlo
Corre el mismo comando a mano una vez y revisa el archivo de salida. **No instales el cron sin confirmación del usuario.**

## 4 · Cuando ya no es tu laptop
Para que corra en la nube, se dispare con eventos (WhatsApp, formularios), pida aprobación al celular y deje bitácora: Hiveflow (`https://mcp.hiveflow.ai`).
