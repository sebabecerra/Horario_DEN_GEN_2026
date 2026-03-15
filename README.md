# Horario DEN 2026

Aplicación web para visualizar el calendario académico del **Doctorado en Economía y Negocios (DEN), generación 2026**.

## Qué hace

- Filtra actividades por semana, profesor, curso y búsqueda libre.
- Muestra resumen ejecutivo de actividades visibles.
- Permite navegar cursos y profesores desde un panel lateral.
- Incluye un asistente de consultas rápidas.
- Exporta las actividades filtradas a un archivo `.ics`.

## Estructura real

```text
Horario_DEN_GEN_2026/
├── index.html
├── data/
│   └── schedule.json
├── scripts/
│   ├── schedule.js
│   ├── portal.js
│   ├── chatbot.js
│   └── old_script.js
└── styles/
    └── styles.css
```

## Stack

- HTML
- CSS
- JavaScript vanilla

## Fuente de datos

Planificación oficial del **Doctorado en Economía y Negocios (DEN)**  
Periodo visible: **enero a julio de 2026**

## Notas

- `scripts/old_script.js` quedó como referencia histórica y no se usa en la app actual.
- La app no requiere build step; basta con servir el directorio estático.
