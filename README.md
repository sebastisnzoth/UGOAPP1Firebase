# U.G.O. QUANTUM OS - Sistema Ejecutivo

Este repositorio contiene la arquitectura completa del núcleo **U.G.O.**, incluyendo el **AdminPanel (Touchboard)**, lógica de **Asignación Cuántica** y comandos de voz.

## Tecnologías Principales
- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion.
- **Backend/Base de Datos:** Firebase (Firestore).
- **Mapas:** Leaflet y React-Leaflet (Estilo oscuro).
- **Voz:** Web Speech API integrada.

## Requisitos Previos
- Node.js v22+
- Proyecto en Firebase con Firestore habilitado.

## Instalación y Ejecución

### 1. Configuración de Firebase
Crea un archivo `/src/firebase.ts` utilizando tus credenciales de Firebase:

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO_ID",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_ID",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

### 2. Instalación de Dependencias
Ejecuta el siguiente comando en la raíz del proyecto para asegurar todas las bibliotecas:

```bash
npm install
```

### 3. Ejecución en Desarrollo
Inicia el servidor de desarrollo en el puerto 3000:

```bash
npm run dev
```

### 4. Producción (Contenedores)
El proyecto está optimizado para despliegue en entornos modernos.
```bash
npm run build
npm run preview
```

## Estructura del Sistema
- `/src/components/`: Componentes modulares (AdminPanel, QuantumMap, HugoOrb, etc.).
- `/src/services/`: Lógica de negocio (asignación de tareas, integración de voz, listeners de Firebase).
- `/src/types.ts`: Definiciones de interfaces globales.

## Protocolo de Voz
Hugo escucha comandos en español. Asegúrate de que el micrófono esté activo en el navegador. Comandos principales:
- "Hugo, bono norte": Activa bono dinámico en zona norte.
- "Hugo, reporte": Genera reporte ejecutivo de métricas en la terminal del panel.
