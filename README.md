# Brooklyn Store — Tienda online de zapatos multimarca (Ecuador)

Tienda de ecommerce completa estilo Shopify, sin Shopify: Next.js 14 + Tailwind,
Firebase (Firestore + Auth) como backend, Cloudinary para las fotos y lista
para desplegar en Vercel. Basada en la tienda de Calzado Hamsa, adaptada a
Ecuador, a zapatos multimarca y a los colores dorado / negro / blanco del logo
de Brooklyn Store.

## Qué incluye

- **Inicio tipo tienda deportiva grande** (inspirado en Adidas): portada a
  pantalla completa, barra de confianza, cinta de marcas, categorías (Hombre,
  Mujer, Running, Ofertas), productos con pestañas (Más vendidos / Lo nuevo /
  Ofertas), explicación de formas de pago, cómo comprar en 4 pasos, guía de
  tallas, beneficios, testimonios, preguntas frecuentes y llamado final.
- **Catálogo con filtros** por género, marca, estilo, talla (EC), precio y
  ofertas + buscador. Los filtros van en la URL (`/catalogo?marca=Nike`).
- **Ficha de producto**: galería deslizable en celular y con zoom en PC,
  selector de talla obligatorio, **"¿Cuál es mi talla?"** (calculadora por
  centímetros, cómo medir el pie y tabla EC / EU / US hombre, mujer y niños),
  medidor de horma (pequeña / normal / grande), temporizador, stock, reseñas,
  productos relacionados y barra fija de compra en celular.
- **Pagos (los dos terminan confirmando el pedido por WhatsApp):**
  - 🏦 **Transferencia o depósito bancario**: paga el total; envío gratis por
    defecto (configurable por provincia).
  - 💵 **Contra entrega**: el cliente **adelanta solo $5 (valor del envío)** y
    paga el resto en efectivo al recibir en su dirección. El valor de $5 es
    editable desde el panel.
- **Formulario de envío de Ecuador**: provincias y cantones, cédula, referencia,
  ubicación GPS opcional; recuerda los datos del cliente para la próxima compra.
- **Confirmación de pedido** con las cuentas bancarias (botón copiar), cuánto
  paga ahora y cuánto al recibir, y botón para enviar el comprobante.
- Ruleta de descuento (cupón `BROOKLYN5`), WhatsApp flotante, insignia de
  ofertas, prueba social, frases ecuatorianas en todo el sitio.
- **Panel administrativo** en `/admin`: productos (marca, género, horma, tallas
  EC, fotos), pedidos (con adelanto / saldo a cobrar en contra entrega y
  mensajes de estado por WhatsApp), pedidos manuales y **configuración** en
  vivo: WhatsApp, cuentas bancarias, adelanto de contra entrega, envíos por
  provincia, marcas, colores, textos, testimonios, preguntas frecuentes.

### Funciona desde el primer día

Sin Firebase configurado (o mientras no hayas publicado productos) la tienda
muestra un **catálogo de demostración** de 12 modelos con fotos de ejemplo, y
los pedidos igual llegan completos a tu WhatsApp. Apenas publicas tu primer
producto desde `/admin`, el catálogo de demostración desaparece solo.

> ⚠️ Antes de vender: configura tu **número de WhatsApp** y tus **cuentas
> bancarias reales** en `/admin/configuracion` (o `NEXT_PUBLIC_WHATSAPP_NUMBER`
> en Vercel). Las cuentas que vienen por defecto son de ejemplo (`0000000000`).
> Reemplaza también las fotos de ejemplo por fotos reales de tus productos.

## 1. Crear el proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/) → **Crear proyecto**.
2. Dentro del proyecto, activa:
   - **Firestore Database** (modo producción, elige una región cercana, ej. `southamerica-east1`).
   - **Authentication** → método **Correo/Contraseña**.

   (Firebase **Storage** no se usa — ahora exige el plan de pago Blaze incluso
   para uso gratuito, así que las fotos de producto se hospedan en Cloudinary,
   ver paso 1.b.)
3. Ve a **Configuración del proyecto → Tus apps → Agregar app Web (`</>`)**.
   Copia los valores del objeto `firebaseConfig`.

## 1.b. Crear cuenta en Cloudinary (fotos de producto, gratis, sin tarjeta)

1. Ve a [cloudinary.com](https://cloudinary.com) → **Sign up free** (con correo o Google, no pide tarjeta).
2. En el dashboard, copia tu **Cloud name** (aparece arriba, ej. `dxxxx1234`).
3. Ve a **Settings (⚙️) → Upload → Upload presets → Add upload preset**.
   - **Signing Mode**: cámbialo a **Unsigned**.
   - Dale un nombre corto (ej. `brooklyn_productos`) y **Save**.
4. Guarda esos dos valores (Cloud name y el nombre del preset) para el siguiente paso.

## 2. Configurar variables de entorno

Dentro de `webapp/`:

```bash
cp .env.local.example .env.local
```

Completa `.env.local` con los valores de Firebase y Cloudinary de los pasos
anteriores, y los datos de tu WhatsApp (`NEXT_PUBLIC_WHATSAPP_NUMBER`, sin el
0 inicial ni el código de país).

## 3. Instalar dependencias y correr localmente

```bash
cd webapp
npm install
npm run dev
```

Abre http://localhost:3000

## 4. Publicar las reglas de seguridad

Instala el CLI de Firebase (una sola vez) y publica `firestore.rules`:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # selecciona tu proyecto, usa el archivo ya existente
firebase deploy --only firestore:rules
```

Si prefieres no usar el CLI, puedes pegar el contenido de `firestore.rules`
directamente en la consola de Firebase (Firestore Database → Reglas) y
publicar desde ahí.

## 5. Crear tu primer usuario administrador

1. En Firebase Console → **Authentication → Users → Add user**, crea tu
   usuario (correo + contraseña) con el que vas a entrar al panel `/admin`.
2. Copia el **UID** de ese usuario (aparece en la lista de usuarios).
3. En **Firestore Database**, crea manualmente la colección `admins` con un
   documento cuyo **ID sea ese UID** (el contenido puede quedar vacío, `{}`).
4. Listo: ahora ese correo puede entrar a `/admin/login`.

> Cualquier usuario que quieras que administre la tienda necesita: (a) existir
> en Authentication y (b) tener un documento en `admins/{su-uid}`.

## 6. (Opcional) Cargar productos de ejemplo

```bash
echo "SEED_ADMIN_EMAIL=tu-correo@ejemplo.com" >> .env.local
echo "SEED_ADMIN_PASSWORD=tu-contraseña" >> .env.local
npm run seed
```

Esto sube los 12 modelos del catálogo de demostración — entra a
`/admin/productos` para ajustar precios, stock y cambiar las fotos por las reales.

## 7. Desplegar en Vercel

1. Ve a [vercel.com](https://vercel.com) → **Add New → Project** → importa
   este repositorio de GitHub.
2. Deja el **Root Directory** en la raíz del repositorio (`./`).
3. En **Environment Variables**, agrega las mismas variables de tu
   `.env.local` (las `NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_CLOUDINARY_*`,
   `NEXT_PUBLIC_STORE_NAME`, `NEXT_PUBLIC_WHATSAPP_COUNTRY_CODE`,
   `NEXT_PUBLIC_WHATSAPP_NUMBER` y `NEXT_PUBLIC_SITE_URL`). Sin las de
   Firebase la tienda igual funciona con el catálogo de demostración.
4. Click **Deploy**. En unos minutos tendrás tu tienda en una URL
   `tu-proyecto.vercel.app` — puedes conectar tu dominio propio desde
   **Project Settings → Domains**.

Cada vez que hagas `git push` a la rama conectada, Vercel vuelve a desplegar
automáticamente.

## Notificación por correo de cada pedido nuevo

Igual que la notificación automática de Shopify, puedes recibir un correo
con diseño profesional cada vez que alguien complete un pedido (sin importar
el método de pago). Usa [Resend](https://resend.com) — tiene plan gratis
(3.000 correos/mes) y no requiere tarjeta para empezar.

1. Crea una cuenta gratis en [resend.com](https://resend.com) y genera una
   **API Key** en **API Keys > Create API Key**.
2. Agrega esa llave como `RESEND_API_KEY` en **Vercel > Project Settings >
   Environment Variables** (nunca lleva el prefijo `NEXT_PUBLIC_`, porque el
   correo se envía desde el servidor en `/api/notify-order`, no desde el
   navegador).
3. En `/admin/configuracion`, sección **General**, escribe el correo donde
   quieres recibir los pedidos en **"Correo para recibir notificación de
   cada pedido nuevo"**.
4. (Opcional pero recomendado) Por defecto los correos se envían desde
   `onboarding@resend.dev`, una dirección de pruebas de Resend que solo
   entrega de forma confiable al correo con el que creaste la cuenta. Para
   recibir en cualquier correo (el de tu negocio, tu contador, etc.) sin
   restricciones, verifica tu propio dominio en **Resend > Domains** y
   agrega `RESEND_FROM_EMAIL` con un remitente de ese dominio, por ejemplo:
   `Brooklyn Shoes <pedidos@tudominio.com>`.

Si no configuras `RESEND_API_KEY`, el checkout sigue funcionando normal —
simplemente no se envía el correo.

## Notificación push al celular (como la app de Shopify)

Además del correo, la administradora puede recibir un **aviso push en el
celular** cada vez que llega un pedido — con sonido y vibración del
sistema, funcione o no la tienda abierta en ese momento, exactamente como
la app de Shopify. Se activa una sola vez y queda guardado en el
navegador/teléfono para siempre, sin tener que repetirlo cada vez que se
vuelve a entrar.

**Activarlo (una sola vez, gratis, sin servicios externos):**

1. En tu computador, corre este comando dentro de la carpeta `webapp/`
   (no hace falta instalar nada aparte, `npx` lo descarga solo):
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Te va a dar dos líneas, "Public Key" y "Private Key". En **Vercel >
   Project Settings > Environment Variables** agrega:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` → la llave pública
   - `VAPID_PRIVATE_KEY` → la llave privada (nunca lleva `NEXT_PUBLIC_`
     porque solo se usa en el servidor, en `/api/send-push`)
   - `VAPID_SUBJECT` → `mailto:` seguido de un correo tuyo, por ejemplo
     `mailto:contacto@calzadobrooklyn.com`
3. Vuelve a desplegar el sitio en Vercel para que tome las variables.
4. Desde el celular de la administradora, entra a `/admin` (idealmente ya
   instalada como app, ver más abajo) y toca el botón **"🔔 Activar
   notificaciones de pedidos"**. El teléfono va a pedir permiso de
   notificaciones — hay que aceptar.

Importante: genera esas llaves **una sola vez** y no las cambies después
— si las regeneras, todos los celulares que ya se habían suscrito dejan de
recibir avisos y tendrían que volver a activarlos.

**Compatibilidad:** funciona perfecto en Android (Chrome, directamente).
En iPhone requiere iOS 16.4 o superior y que la tienda esté **agregada a
la pantalla de inicio** como app (ver la sección de abajo) — Safari no
entrega notificaciones push a pestañas normales, solo a la app instalada.

Sin `VAPID_PRIVATE_KEY` configurada, el botón de activar simplemente no
hace nada — el checkout y el resto de la tienda siguen funcionando
normal.

## Fotos de producto: encuadre automático a cuadrado

Al subir fotos en `/admin/productos` no hace falta recortarlas ni ajustar
nada manualmente: se suben tal cual (cualquier tamaño o proporción), y
Cloudinary las encuadra a cuadrado automáticamente usando su función de
"gravedad automática" (`g_auto`), que detecta con IA en qué parte de la
foto está el producto y recorta ahí — sin dejar franjas de fondo ni
cortar el producto, sin importar si quedó centrado o no en la foto
original. Esto pasa en la propia URL de Cloudinary (parámetro
`AUTO_OPTIMIZE` en `src/lib/storage.ts`), no en el navegador, así que
funciona igual de bien para cualquier foto que subas.

Las fotos que ya estaban subidas antes de este cambio y que se ven con
franjas de fondo a los lados hay que volver a subirlas (editar el
producto → reemplazar la foto) para que tomen el nuevo encuadre — esas
fotos anteriores ya se guardaron recortadas a cuadrado con la franja
"quemada" en los píxeles, así que no hay forma de arreglarlas sin volver
a procesar la imagen original.

## Cómo funciona una compra

1. El cliente elige talla (si no la elige, el botón lo lleva al selector).
2. Toca **Comprar con transferencia** o **Pago contra entrega** → se abre la
   compra rápida (o usa el carrito → `/checkout`).
3. Llena sus datos y toca **Confirmar pedido por WhatsApp**: el pedido se
   guarda en Firestore (si está configurado), se abre WhatsApp con el resumen
   completo (productos, total, cuánto paga ahora y cuánto al recibir, dirección)
   y llega a la página de confirmación con tus cuentas bancarias.
4. El cliente te manda el comprobante por WhatsApp y tú despachas.

Todo el cálculo de montos está en `src/lib/shipping.ts` (`computeOrderTotals`).

## Estructura del proyecto

```
src/
  app/(shop)/          Tienda pública (inicio, catálogo, producto, carrito,
                       checkout, pedido-confirmado, guia-de-tallas)
  app/admin/           Panel administrativo
  components/          Componentes (home/, product/, checkout/, sizes/, admin/)
  lib/                 Datos y lógica (settings, products, orders, shipping,
                       ecuador, sizes, demo-products...)
public/logo.png        Logo de Brooklyn Store
```
