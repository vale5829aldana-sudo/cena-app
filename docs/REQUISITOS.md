# Requisitos — Cena App (distribución equitativa de costos)

## 1. Resumen

Aplicación web (Next.js full-stack) para repartir de forma equitativa el costo de la
cena de un evento. Existe un **límite de gasto por persona** (configurable) y cada
comensal debe poder tomar **una entrada (compartida entre dos personas), un plato
fuerte y una bebida**, sin superar su límite.

## 2. Objetivo

- Que cada comensal arme su consumo (entrada + plato fuerte + bebida) dentro de un tope.
- Repartir el costo de la entrada 50/50 entre dos comensales con confirmación mutua.
- Dar al administrador control total: límites, asistentes, menú y cierre del evento.
- Entregar a la cocina un reporte consolidado de pedidos.

## 3. Actores

| Actor | Descripción |
|---|---|
| **Administrador** | Configura el evento, límites, asistentes y menú. Cierra el evento y ve reportes. |
| **Comensal** | Se identifica por su nombre, elige entrada + pareja, plato fuerte y bebida. |

## 4. Reglas de negocio

| ID | Regla |
|---|---|
| RN-1 | El límite de gasto es **por persona** y **configurable** por el administrador (valor por defecto sugerido: $100.000). |
| RN-2 | Cada comensal consume **exactamente**: 1 entrada (compartida), 1 plato fuerte y 1 bebida. |
| RN-3 | Validación: `(precio_entrada / 2) + precio_plato_fuerte + precio_bebida ≤ límite_persona`. |
| RN-4 | La entrada se comparte **exactamente entre 2 personas**. Requiere **confirmación mutua**: uno propone (entrada + pareja) y el otro acepta o rechaza. |
| RN-5 | Los **topes por categoría** son configurables: entradas ≤ $40.000 y platos fuertes ≤ $70.000 (valores iniciales). |
| RN-6 | **Número impar de asistentes:** el administrador resuelve el caso (emparejamiento manual). Como respaldo, se permite la opción de entrada sin compartir (paga el 100%). |
| RN-7 | El comensal puede **editar** su pedido hasta que el administrador **cierre el evento**. |
| RN-8 | Todos los precios están en **COP** y se muestran con formato colombiano. |
| RN-9 | Un comensal solo puede tener **una pareja activa** para la entrada a la vez. |

## 5. Menú aprobado

### 5.1 Entradas — tope $40.000 (10)

| # | Nombre | Precio | Mitad | Etiquetas |
|---|---|---|---|---|
| 1 | Hummus Bombay | 29.000 | 14.500 | Vegetariano, Vegano |
| 2 | Kibbes de Morcilla | 33.500 | 16.750 | |
| 3 | Tacos Shiva X2 | 29.900 | 14.950 | |
| 4 | Karma Mini Burguers | 37.900 | 18.950 | |
| 5 | Brochetas de Pollo Tandoori | 39.900 | 19.950 | |
| 6 | Veggie Samosa | 31.900 | 15.950 | Vegetariano |
| 7 | Chicken Samosa | 33.500 | 16.750 | |
| 8 | Jheenga Samosa | 33.900 | 16.950 | |
| 9 | Ceviche de Chicharrón Cremoso | 38.000 | 19.000 | |
| 10 | Ceviche de Salmón | 38.000 | 19.000 | |

### 5.2 Platos fuertes — tope $70.000 (6)

| # | Nombre | Precio | Etiquetas |
|---|---|---|---|
| 1 | Fogata de Mariscos (Marisco al Fuego) | 45.900 | |
| 2 | Caribbean Chicken Tikka-Masala | 49.000 | |
| 3 | Ensalada Bombay | 35.000 | Vegetariano, Vegano |
| 4 | Wrap de Pollo Tandoori (Kathi Roll) | 44.900 | |
| 5 | Ensalada Frutos del Mar de Goa | 45.000 | |
| 6 | Cheeseburger | 45.000 | |

### 5.3 Mocktails (4)

| # | Nombre | Precio |
|---|---|---|
| 1 | Pasión de Rosas | 24.000 |
| 2 | Gulupa Caliente | 22.000 |
| 3 | Piña & Albahaca | 22.000 |
| 4 | Jengibre y Cardamomo | 24.000 |

### 5.4 Bebidas (9)

| # | Nombre | Precio |
|---|---|---|
| 1 | Ginger Mil976 | 13.000 |
| 2 | Tónica Mil976 | 13.000 |
| 3 | Coca Cola Original | 10.500 |
| 4 | Coca Cola Zero | 10.500 |
| 5 | Ginger Schweppes | 10.500 |
| 6 | Soda Schweppes | 10.500 |
| 7 | Tónica Schweppes | 10.500 |
| 8 | Manantial | 10.500 |
| 9 | Manantial Gas | 10.500 |

> Las descripciones completas y las imágenes se cargarán desde el panel administrativo.

## 6. Modelo de datos (propuesto)

- **Event** — evento único: `id`, `name`, `description`, `status` (OPEN/CLOSED), `defaultLimit`, `createdAt`, `closedAt`.
- **Attendee** — `id`, `eventId`, `name`, `limitAmount`, `createdAt`.
- **Category** — `id`, `eventId`, `name`, `slug`, `maxPrice` (tope), `requiredQty`, `shareable` (bool), `sortOrder`.
- **Dish** — `id`, `categoryId`, `name`, `description`, `price`, `imageUrl`, `active`, `isVegetarian`, `isVegan`.
- **Pairing** — `id`, `eventId`, `dishId` (entrada), `initiatorId`, `partnerId`, `status` (PENDING/CONFIRMED/REJECTED/CANCELLED), `createdAt`, `confirmedAt`.
- **OrderItem** — `id`, `attendeeId`, `categoryId`, `dishId`, `pairingId?`, `price`, `sharePercent` (100 | 50).
- **AdminUser** — `id`, `username`, `passwordHash`, `createdAt`.

## 7. Flujos

### 7.1 Comensal
1. Abre la app y **selecciona su nombre** de la lista de asistentes.
2. Elige una **entrada** y **con quién compartirla** → queda `PENDING`.
3. La pareja recibe la propuesta y **confirma o rechaza**.
4. Con la pareja confirmada, elige **plato fuerte** y **bebida**.
5. El sistema valida `(entrada/2) + plato + bebida ≤ límite`.
6. Ve un **resumen** y confirma su pedido.
7. Puede editar hasta que el administrador cierre el evento.

### 7.2 Administrador
1. Inicia sesión (usuario y contraseña).
2. Configura el **nombre y la descripción del evento**, el **límite por persona** (global y/o individual) y los **topes por categoría**.
3. Administra **asistentes** (crear, editar, eliminar).
4. Administra **platos y bebidas** (CRUD + subida de imágenes).
5. Resuelve **casos impares** (emparejamiento manual).
6. **Cierra el evento** (bloquea la edición de comensales).
7. Consulta el **reporte consolidado** y lo exporta (PDF/Excel) para la cocina.

## 8. Requisitos funcionales

- **RF-01** CRUD de asistentes (nombre + límite).
- **RF-02** CRUD de categorías con tope de precio configurable.
- **RF-03** CRUD de platos/bebidas con nombre, descripción, precio e imagen.
- **RF-04** Subida de imágenes desde el panel administrativo.
- **RF-05** Selección de comensal por nombre (sin contraseña).
- **RF-06** Propuesta de emparejamiento de entrada (entrada + pareja).
- **RF-07** Confirmación/rechazo de la propuesta por la pareja.
- **RF-08** Selección de plato fuerte y bebida con validación de límite en tiempo real.
- **RF-09** Resumen y confirmación del pedido.
- **RF-10** Edición del pedido hasta el cierre del evento.
- **RF-11** Resolución de casos impares por el administrador.
- **RF-12** Apertura/cierre del evento.
- **RF-13** Reporte consolidado de pedidos + exportación.
- **RF-14** Autenticación del administrador (usuario/contraseña).

## 9. Requisitos no funcionales

- **RNF-01** Interfaz en español, formato de moneda COP.
- **RNF-02** Diseño responsive (móvil primero).
- **RNF-03** Soporte multi-dispositivo simultáneo (sincronización por sondeo periódico).
- **RNF-04** Contraseña de la BD fuera del control de versiones (`.env`).
- **RNF-05** Validación de límites en servidor (no solo en cliente).

## 10. Stack y arquitectura

- **Frontend/Backend:** Next.js (App Router) + TypeScript + Tailwind CSS.
- **Base de datos:** MySQL 8.0 local, base `eventos`, ORM **Prisma** (provider `mysql`).
- **Autenticación admin:** sesión con cookie (usuario + hash de contraseña).
- **Sesión comensal:** cookie con el `attendeeId`.
- **Archivos subidos:** carpeta `public/uploads`.

## 11. Fases de implementación

1. **Fase 0** — Scaffold de Next.js + Tailwind + Prisma + conexión a MySQL + migración.
2. **Fase 1** — Modelo de datos + seed del menú aprobado.
3. **Fase 2** — Autenticación y panel administrativo (límites, asistentes, CRUD menú, abrir/cerrar).
4. **Fase 3** — Pantalla del comensal (identificación, emparejamiento, selección, validación, resumen).
5. **Fase 4** — Confirmación de pareja, edición y sincronización multi-dispositivo.
6. **Fase 5** — Reporte y exportación para la cocina.
7. **Fase 6** — Pulido de UI, imágenes y pruebas.

## 12. Configuración del entorno

- Node `v24.19.0`, npm `11.17.0` (usar `npm.cmd` por la política de ejecución de PowerShell).
- Cliente MySQL: `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe`.
- BD: `eventos` (host `localhost:3306`, usuario `root`).
- La cadena de conexión se guarda en `.env` (no versionado).
