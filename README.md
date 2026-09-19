# UGO — Servicios en tiempo real

**Un pedido. Un profesional. Sin vueltas.**

UGO conecta clientes con profesionales disponibles y mantiene todo el ciclo del servicio sincronizado en Firebase.

## Estado del proyecto

La rama de trabajo y producción es **`main`**.

Stack principal:

- React 19 + TypeScript + Vite
- Firebase Authentication
- Cloud Firestore
- Leaflet / React Leaflet
- Gemini para Hugo (asistente de voz/chat)
- Vercel para frontend/API
- GitHub Actions para TypeScript + build de producción

## Fuente de verdad

### Servicios

La colección **`bookings`** es la única fuente de verdad para Cliente, Proveedor, Agenda, Historial y Admin.

Ciclo canónico:

```text
solicitado
  -> aceptado
  -> en_camino
  -> en_curso
  -> pendiente_confirmacion_cliente
  -> pendiente_pago
  -> pago_informado
  -> cerrado
```

Antes de iniciar el trabajo, el cliente puede pasar el pedido a `cancelado`.

El proveedor puede aceptar más de un pedido. Un servicio en curso no bloquea trabajos futuros o agendados.

### Agenda

Los servicios futuros no usan una colección separada. La fecha se guarda en:

```text
bookings.scheduledFor
```

### Proveedores

- `profiles/{uid}`: perfil privado del usuario.
- `profiles_providers/{uid}`: ficha pública y presencia del proveedor en el radar.
- El radar Cliente lee exclusivamente `profiles_providers`.
- Rating y cantidad de reseñas se calculan desde `avaliacoes`.

### Reseñas

Cada booking cerrado puede generar una sola reseña.

El documento usa el ID del booking:

```text
avaliacoes/{bookingId}
```

Las reglas validan que el autor sea el cliente real del booking cerrado.

## Pago

El método predeterminado es **efectivo** y no impide crear un pedido.

Orden de cierre:

1. El proveedor finaliza el trabajo.
2. El cliente confirma que el trabajo terminó.
3. UGO indica el importe a pagar.
4. El cliente informa que pagó.
5. El proveedor confirma la recepción.
6. El booking pasa a `cerrado`.

La Bóveda no permite modificar saldo desde el navegador.

## Firebase

Proyecto:

```text
ugoappa1-e9522
```

Base Firestore usada por la app:

```text
ai-studio-489ba6ee-a3ef-4e52-b0f2-babfa1103af3
```

`.firebaserc` y `firebase.json` están configurados explícitamente para este proyecto/base.

Las reglas viven en:

```text
firestore.rules
```

Los índices viven en:

```text
firestore.indexes.json
```

Las colecciones `contratos` y `agendamentos` son **legado**. El cliente y el proveedor ya no deben escribir en ellas.

## Desarrollo

Requiere Node.js 22+.

```bash
npm ci
npm run dev
```

Validación:

```bash
npm run lint
npm run build
```

## Variables de entorno

Copiar `.env.example` a `.env` y configurar las claves necesarias.

Nunca commitear secretos reales.

## Hugo

Hugo puede:

- interpretar la necesidad del cliente;
- abrir el radar;
- conversar por texto/voz;
- orientar sobre el flujo.

Hugo **no inventa proveedores**. Los profesionales, disponibilidad, ubicación, tarifa y rating vienen exclusivamente de Firebase.

Las acciones críticas del servicio se ejecutan mediante el ciclo real de `bookings`, no mediante texto generado por IA.

## CI

`.github/workflows/ci.yml` ejecuta:

```text
npm ci
npm run lint
npm run build
```

Los commits que no compilan deben considerarse bloqueados.

## Deploy

Vercel está conectado al repositorio y a `main`.

Las reglas e índices de Firestore requieren despliegue independiente de Firebase. Tener los archivos actualizados en GitHub **no los publica automáticamente** en Firestore.

Antes de producción real, validar:

- autenticación;
- reglas Firestore en la base nombrada;
- creación de booking;
- flujo Cliente ↔ Proveedor;
- agenda;
- confirmación de trabajo;
- pago;
- cierre;
- reseña;
- prueba real en celular.
