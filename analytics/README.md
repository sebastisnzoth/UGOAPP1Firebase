# U.G.O. QUANTUM OS - Analytics (Streamlit)

Esta carpeta contiene la integración analítica en Python solicitada para desplegar en [Streamlit Community Cloud](https://share.streamlit.io/deploy).

## Estructura
- `app.py`: El script principal del dashboard de Streamlit que lee en tiempo real desde Firebase Firestore.
- `requirements.txt`: Dependencias de Python requeridas para la ejecución de la aplicación.

## Guía de Despliegue en Streamlit Cloud

1. Haz push de este proyecto a tu repositorio de GitHub.
2. Inicia sesión en [share.streamlit.io](https://share.streamlit.io/deploy) y conecta tu cuenta.
3. En el formulario de "Deploy an app":
   - **Repository**: Selecciona este repositorio.
   - **Branch**: `main` (o la rama que uses).
   - **Main file path**: Escribe exactamente `analytics/app.py`.
4. Antes de darle a *Deploy*, haz clic en **Advanced settings**.

## Configuración de Secretos (Firebase)

Para que el script pueda leer tu base de datos de Firestore en tiempo real, necesitas proveer la clave de cuenta de servicio de Firebase.

1. Ve a la Consola de Firebase -> Project Settings (Configuración del proyecto) -> Service Accounts (Cuentas de servicio).
2. Haz clic en "Generar nueva clave privada" y descarga el archivo JSON.
3. En Streamlit (*Advanced settings* -> *Secrets*), agrega una variable de entorno llamada `firebase` con el contenido del JSON en formato de string en una sola línea (o en bloque TOML):

```toml
firebase = '{"type": "service_account", "project_id": "...", "private_key": "...", "client_email": "...", "client_id": "...", "auth_uri": "...", "token_uri": "...", "auth_provider_x509_cert_url": "...", "client_x509_cert_url": "..."}'
```

¡Guarda y despliega! Streamlit se conectará a Firebase y generar métricas con Pandas en tiempo real.
