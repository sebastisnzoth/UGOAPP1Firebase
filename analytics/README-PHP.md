# Despliegue del Dashboard Analítico en PHP

Como las plataformas Python/Streamlit Cloud a veces pueden presentar problemas de configuración de dependencias, he adaptado la inteligencia analítica directamente a **PHP Nativo**, lo que significa que puedes desplegarlo en cualquier servidor compartido tradicional (Hostinger, cPanel, Apache, Nginx o XAMPP local).

## Archivos Críticos

- `index.php`: Código principal de visualización (Tailwind + Chart.js + SDK de Google Cloud PHP).
- `composer.json`: Archivo de configuración de paquetes PHP para usar Firebase/Google Cloud en PHP.

## Pasos para ejecutar en tu servidor (cPanel / Servidor PHP)

1. **Sube los archivos al servidor**
   Copia el contenido de la carpeta `/analytics` (particularmente `index.php` y `composer.json`) a la carpeta pública (`public_html` o similar) de tu hosting PHP, o a una subcarpeta (por ejemplo: `tusitio.com/analytics`).

2. **Añadir Credenciales de Firebase**
   - Ingresa a [Firebase Console](https://console.firebase.google.com/), entra a tu proyecto.
   - Ve a configuración ⚙️ > **Cuentas de Servicio**.
   - Presiona **"Generar nueva clave privada"**. Se descargará un archivo `.json`.
   - Renombra este archivo a `firebase-credentials.json` y súbelo a la misma carpeta donde está el archivo `index.php`.

3. **Instalar el SDK de Google Cloud PHP**
   Como PHP necesita una forma segura de conectar a los gRPC de Firestore, usamos Composer:
   - Ingresa vía Terminal SSH a tu servidor web (o si trabajas en Local localhost, en tu terminal).
   - Navega a la carpeta del dashboard: `cd analytics/`
   - Ejecuta el comando de instalación de paquetes:
     ```sh
     composer install
     ```
   *(Nota: si tu hosting cPanel no tiene terminal, puedes correr Composer en tu computadora local y luego subir la carpeta `vendor` recién creada mediante FTP/cPanel).*

4. **Acceder**
   Entra a la URL de tu dashboard (ej. `http://localhost/analytics/index.php` o `https://tusitio.com/analytics/`) y verás la volumetría de la red cargando en tiempo real con la integración visual.
