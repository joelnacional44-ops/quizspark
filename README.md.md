# QuizSpark

Plataforma educativa de quizzes interactivos al estilo Kahoot/Quizizz, creada para el aula.

**Demo en vivo:** https://TUUSUARIO.github.io/quizspark/

## Características

- Creador de quizzes con múltiples tipos de pregunta
- Modo host (sala en vivo) y modo participante
- Dashboard de resultados con exportación
- Diseño responsivo

## Tecnología

- React 18 (cargado por CDN)
- Babel Standalone (compilación JSX en el navegador)
- HTML/CSS estático — no requiere build

## Estructura

```
quizspark/
├── index.html          # Punto de entrada
├── styles.css          # Tokens de diseño y componentes
├── 01-core.js          # Iconos, datos mock, helpers, store
├── 02-tweaks.js        # Panel de ajustes y form controls
├── 03-creator.js       # Vistas de creación: Dashboard, Editor
├── 04-host.js          # Modo host: lobby, pregunta, revelación
├── 05-participant.js   # Flujo de participante
├── 06-results.js       # Dashboard de resultados
└── 07-app.js           # Shell de la app y router
```

## Uso local

Abre `index.html` con un servidor estático. Por ejemplo, con Python:

```bash
python3 -m http.server 8000
```

Y visita `http://localhost:8000`.

## Autor

Andersson Joel Albarracín Cortes — Bogotá, Colombia.
