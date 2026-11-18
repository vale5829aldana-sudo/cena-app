# Cena App — Bombay Rooftop

Aplicación web para repartir **equitativamente el costo de la cena de un evento**.
Cada comensal arma su experiencia —**entrada compartida, plato fuerte y bebida**—
dentro de su límite de gasto, y el administrador obtiene el reporte consolidado
para la cocina.

Tema visual: *Bombay Rooftop*, una terraza nocturna de cocina de fusión
latino-india (negro azulado, marfil y ámbar).

---

## ✨ Funcionalidad

- **Comensal**: se identifica por su nombre, elige una **entrada y la comparte con
  otro comensal** (ambos confirman y el costo se divide 50/50), luego elige
  **plato fuerte y bebida** del menú. El sistema valida
  `(entrada ÷ 2) + plato + bebida ≤ límite` antes de confirmar.
- **Reglas de negocio**: límite por persona (global e individual), topes de precio
  por categoría, caso especial "solo entrada" (paga el 100 %), emparejamiento
  manual para número impar de comensales, edición permitida hasta que el
  administrador cierra el evento.
- **Administrador**: panel con CRUD de asistentes, menú (platos/bebidas con
  subida de imágenes), configuración del evento (nombre, descripción, límites,
  topes), emparejamientos manuales, cierre del evento y **reporte consolidado
  para la cocina con exportación a CSV**.
- **Multidispositivo**: sondeo (polling) para reflejar los cambios entre equipos.
- Interfaz en **español**.

---

## 🧰 Requisitos

- **Node.js ≥ 20.9** (probado con 24.x)
- **MySQL 8** o **MariaDB** en ejecución
- `npm`

---

## 🚀 Puesta en marcha (desarrollo)

```bash
# 1. Clonar e instalar dependencias
git clone https://github.com/vale5829aldana-sudo/cena-app.git
cd cena-app
npm install

# 2. Crear el archivo de entorno a partir de la plantilla
cp .env.example .env        # en Windows: copy .env.example .env
#   ...y edita .env con tus credenciales de MySQL y un SESSION_SECRET propio.

# 3. Crear la base de datos (una sola vez, con tu cliente MySQL)
mysql -u root -p -e "CREATE DATABASE eventos CHARACTER SET utf8mb4;"

# 4. Aplicar migraciones y generar el cliente de Prisma
npx prisma migrate deploy    # en desarrollo puedes usar: npm run db:migrate
npm run db:generate

# 5. Cargar los datos iniciales (categorías, menú y usuario admin)
npm run db:seed

# 6. Levantar en modo desarrollo
npm run dev                 # http://localhost:3000
```

El **usuario administrador por defecto** es:

```
usuario:  admin
contraseña:  admin123
```

> ⚠️ Cámbiala en **Administración → Configuración → Seguridad** antes de usarlo
> en producción.

---

## ⚙️ Variables de entorno

Todas viven en `.env` (no se versiona). Ver `.env.example` para la plantilla.

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión para Prisma: `mysql://usuario:contraseña@host:3306/eventos`. Codifica los caracteres especiales (`$` → `%24`). |
| `MYSQL_HOST` | Host de MySQL (por defecto `localhost`). |
| `MYSQL_PORT` | Puerto de MySQL (por defecto `3306`). |
| `MYSQL_USER` | Usuario de MySQL. |
| `MYSQL_PASSWORD` | Contraseña de MySQL. |
| `MYSQL_DATABASE` | Nombre de la base de datos (`eventos`). |
| `SESSION_SECRET` | Secreto para firmar la cookie del administrador. Genera uno propio: `openssl rand -base64 32`. |

---

## 🏗️ Despliegue en producción

```bash
npm ci                       # instalación reproducible
npm run build                # compila la app (Next.js)
npm run start                # arranca en el puerto 3000
# o, para exponerla en la red local:
npm run start:local          # next start -H 0.0.0.0 -p 3000
```

Notas de despliegue:

- Antes del primer arranque aplica las migraciones y el seed:
  `npx prisma migrate deploy && npm run db:seed` (el cliente de Prisma se genera
  solo al instalar, gracias al script `postinstall`).
- El servidor sirve las **imágenes del menú** desde `data/uploads/` mediante la
  ruta `/uploads/[file]` (leen el disco en cada petición, así que las fotos
  subidas desde el panel aparecen sin reiniciar).
- Para mantenerlo vivo puedes usar **PM2** (`pm2 start "npm run start" --name cena-app`)
  o un servicio de **systemd**, y ponerlo detrás de un proxy inverso (Nginx, Caddy)
  con HTTPS.
- Asegúrate de que el puerto (3000) esté permitido en el firewall si vas a
  acceder desde otros dispositivos de la red.

---

## 📜 Scripts

| Script | Acción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo. |
| `npm run build` | Compila para producción. |
| `npm run start` | Arranca el build de producción. |
| `npm run start:local` | Igual que `start`, escuchando en `0.0.0.0:3000`. |
| `npm run lint` | ESLint. |
| `npm run db:migrate` | Crea/aplica migraciones de Prisma en desarrollo. |
| `npm run db:generate` | Regenera el cliente de Prisma. |
| `npm run db:seed` | Carga categorías, menú y admin iniciales. |
| `npm run db:studio` | Abre Prisma Studio. |
| `npm run db:reset` | Reinicia la base de datos y vuelve a sembrarla. |

---

## 🗂️ Estructura

```
prisma/
  schema.prisma        Modelo de datos (Event, Attendee, Category, Dish, Pairing, OrderItem, AdminUser)
  migrations/          Migraciones de la base de datos
  seed.mjs             Datos iniciales (categorías, menú, admin)
src/
  app/
    page.tsx           Portada (dinámica del evento)
    comensal/          Selección de comensal y armado del pedido
    admin/             Panel administrativo (resumen, asistentes, menú, config, reportes)
    uploads/[file]/    Sirve las imágenes subidas desde data/uploads
  components/          UI y marca (Bombay Rooftop)
  lib/                 Acceso a datos, autenticación, formato, subida de imágenes
data/uploads/          Imágenes del menú (versionadas para que el deploy las incluya)
docs/REQUISITOS.md     Especificación de requisitos y reglas de negocio
```

---

## 📄 Documentación

- [`docs/REQUISITOS.md`](docs/REQUISITOS.md): requisitos funcionales, reglas de
  negocio y modelo de datos.
