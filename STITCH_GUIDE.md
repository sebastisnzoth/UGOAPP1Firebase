# U.G.O. QUANTUM OS — GUÍA DE DESPLIEGUE EN VERCEL e INTEGRACIÓN CON GOOGLE STITCH

Esta guía contiene las instrucciones detalladas y profesionales para configurar, desplegar tu aplicación en **Vercel** de manera correcta (soportando tanto el frontend en React como el proxy backend de Hugo/Genkit) y cómo integrarla en **Google Stitch** (`https://stitch.withgoogle.com/projects`) para la ideación y el diseño continuo de interfaces asistido por IA.

---

## PARTE 1: Configuración y Despliegue en Vercel ($ v3)

Hemos provisto una arquitectura full-stack híbrida lista para producción. El archivo `/vercel.json` ya fue creado en la raíz de tu proyecto para orquestar la redirección del tráfico del frontend (React/Vite) y el backend serverless (Express/Genkit) de forma unificada.

### 1. Preparar la Estructura en GitHub
Para desplegar tu proyecto en Vercel, primero debes subirlo a un repositorio de GitHub:
1. Abre tu terminal de desarrollo o el gestor de control de versiones de tu entorno de trabajo.
2. Inicializa el repositorio si no está ya activo:
   ```bash
   git init
   git add .
   git commit -m "feat: setup vercel routing and stitch integration configurations"
   ```
3. Crea un repositorio privado o público en tu cuenta de GitHub y enlázalo:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/ugo-quantum-os.git
   git branch -M main
   git push -u origin main
   ```

### 2. Importar y Configurar en Vercel
1. Ve al panel de control de Vercel (`https://vercel.com`) e inicia sesión con tu cuenta.
2. Presiona el botón **"Add New..."** y selecciona **"Project"**.
3. Importa el repositorio `ugo-quantum-os` que acabas de subir de tu cuenta de GitHub.
4. En la configuración de construcción (**Build and Output Settings**), verifica que Vercel detecte de forma automática que es una aplicación de **Vite** (o de lo contrario configúralo manualmente):
   - **Framework Preset**: `Vite` (o `Other` si es híbrido).
   - **Build Command**: `vite build` (por defecto se ejecuta el build optimizado de producción).
   - **Output Directory**: `dist` (la carpeta donde se empaquetan las pantallas optimizadas de U.G.O.).

### 3. Inyección de Variables de Entorno (Crucial para el Cerebro de Hugo & Firebase)
Vercel necesita acceso a las API keys y bases de datos para que Hugo Core funcione sin latencia. Agrega las siguientes variables en la sección **Environment Variables** de tu proyecto en Vercel:

| Variable | Tipo | Descripción / Valor |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Secreto | Tu clave de API de Google Gemini para activar el Cerebro de Hugo (Hugo Core). |
| `FIREBASE_PROJECT_ID` | Config | El ID de tu base de datos de Firebase Firestore provista (`ugoappa1-e9522`). |
| `CLIENT_ID` | OAuth | Tu ID de cliente de Google OAuth para el login y handshake seguro. |
| `CLIENT_SECRET` | Secreto | Secreto de Google OAuth para gestionar la autenticación persistente. |

5. Presiona **Deploy**. ¡Tu aplicación estará en vivo en segundos con una URL segura de producción (ej. `https://ugo-quantum-os.vercel.app`)!

---

## PARTE 2: Integración y Stitching en Google Stitch (`https://stitch.withgoogle.com/projects`)

**Google Stitch** es el entorno de ideación rápida de UIs para aplicaciones móviles y web potenciado por Inteligencia Artificial. Permite crear flujos interactivos, prototipos listos para producción y refinar la estética de tus componentes de forma visual y guiada.

Para orquestar el flujo estético de U.G.O. en Stitch, sigue estos pasos:

### 1. Acceder al Panel de Proyectos de Stitch
1. Entra a tu navegador y navega a [stitch.withgoogle.com/projects](https://stitch.withgoogle.com/projects).
2. Regístrate o inicia sesión utilizando la misma cuenta de Google con la que gestionas tu entorno de desarrollo.

### 2. Crear un Nuevo Proyecto para U.G.O. Quantum OS
1. Una vez dentro de la plataforma, presiona **"Create New Project"** o **"New Prototype"**.
2. Asígnale el nombre literal: **U.G.O. Quantum OS**.
3. En la descripción técnica, copia el siguiente manifiesto de identidad para que la IA de Stitch comprenda el estilo gráfico unificado de tu ecosistema logístico:
   > *"U.G.O. Quantum OS es una plataforma híbrida bajo demanda (Uber + Taskrabbit) diseñada con una estética de alta fidelidad Cyberpunk Ejecutivo y Glassmorphism. El núcleo central está gobernado por Hugo, un Orbe inteligente de calma, autoridad profesional y calma absoluta que asume la gobernanza y logística en tiempo real."*

### 3. Configurar el Enlace de Vista Previa (Live Preview Stitching)
Stitch permite incrustar vistas previas interactivas para simular flujos de usuario reales:
1. En el panel lateral de tu proyecto en Stitch, selecciona **"Connect Source"** o **"Embed Live App"**.
2. Pega la URL de tu aplicación en producción generada por Vercel (ej. `https://ugo-quantum-os.vercel.app`) o utiliza la URL de desarrollo activo provista por tu entorno seguro de Google AI Studio:
   `https://ais-dev-fdokyqh4r5zpfxp3l5v335-129247913307.us-east5.run.app`
3. Esto conectará bidireccionalmente el flujo visual, permitiendo que las interacciones del "Handshake OAuth" y la Bóveda Escrow se prueben directamente dentro del marco simulado de Stitch.

### 4. Flujo de Refinamiento Estético con IA en Stitch
Con el proyecto conectado, puedes usar las directivas de Stitch para generar pantallas adicionales de forma nativa:
- **Ideación de Nuevas Tarjetas**: Utiliza las directivas de Stitch de "Design with AI" para proponer refinamientos en los paneles del *Cliente*, *Proveedor*, o del *Soberano/Administrador*.
- **Mantener el Stagger Animation**: Asegúrate de indicarle a Stitch que respete las animaciones de entrada basadas en `framer-motion` (`staggerChildren` y escalamiento de widgets) para las tarjetas métricas del panel administrativo.
- **Exportar Código**: Una vez modelado un nuevo flujo en Stitch, puedes exportar los fragmentos JSX/TSX optimizados con clases utilitarias de Tailwind y copiarlos directamente en `/src/components/` para mantener el ecosistema completamente sincronizado.

---

*Desarrollado y optimizado por el Cerebro de Hugo Core para Sebastián. v3 - Mayo, 2026. Clasificación de Seguridad: Estrictamente Confidencial.*
