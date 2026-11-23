---
name: crear-skill
description: Crea una skill de Claude con el formato correcto (carpeta + SKILL.md con frontmatter name y description) a partir de un proceso del usuario. Úsala cuando pidan «crea una skill», «enséñale a Claude a hacer X siempre igual» o documentar un procedimiento repetible.
---

# Crear una skill

Una skill es una **carpeta con un `SKILL.md`**. Claude lee solo el `name` y la `description` de todas; carga el cuerpo cuando la petición coincide con la descripción.

## Dónde va
- Proyecto (todo el equipo, por git): `.claude/skills/<nombre>/SKILL.md`
- Personal (todos tus proyectos): `~/.claude/skills/<nombre>/SKILL.md`
- Dentro de un plugin: `plugins/<plugin>/skills/<nombre>/SKILL.md`
- En la app de Claude: comprime la carpeta en .zip y súbela en Personalizar → Skills.

## Formato exacto
```markdown
---
name: nombre-en-kebab-case
description: Qué hace y CUÁNDO usarla, con las frases que diría el usuario. Una o dos oraciones.
---

# Título

## Cuándo
## Cómo (pasos numerados, concretos)
## Reglas (lo que nunca hace)
```
- `name`: minúsculas y guiones, igual que la carpeta.
- `description`: es lo que decide si se activa. Incluye verbos y palabras que usaría el usuario.
- Cuerpo: corto (menos de ~200 líneas). Lo largo va en archivos al lado (`plantilla.md`, `ejemplos/`) y la skill dice cuándo leerlos.

## Proceso
1. Pregunta el proceso (o léelo de lo que ya hicieron): entradas, pasos, salida, qué NO hacer.
2. Escribe el SKILL.md con el formato de arriba.
3. Pruébala: haz una petición que debería activarla y confirma que se usó y que respetó las reglas.
