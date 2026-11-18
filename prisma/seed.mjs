// Datos iniciales (seed) — Cena App
// Uso: node prisma/seed.mjs
import 'dotenv/config'
import mariadb from 'mariadb'
import { randomBytes, scryptSync } from 'node:crypto'

const EVENT_ID = 'evt-principal'

const EVENT_DESCRIPTION =
  'Una noche bajo las estrellas. Cada comensal arma su experiencia —entrada compartida, plato fuerte y bebida— dentro de su límite de gasto.'

const CATEGORIES = [
  { id: 'cat-entradas', name: 'Entradas', slug: 'entradas', maxPrice: 40000, shareable: 1, sortOrder: 1 },
  { id: 'cat-fuertes', name: 'Platos fuertes', slug: 'platos-fuertes', maxPrice: 70000, shareable: 0, sortOrder: 2 },
  { id: 'cat-bebidas', name: 'Bebidas', slug: 'bebidas', maxPrice: 30000, shareable: 0, sortOrder: 3 },
]

const DISHES = [
  // Entradas
  {
    id: 'dish-hummus-bombay', categoryId: 'cat-entradas', name: 'Hummus Bombay', price: 29000,
    vegetarian: 1, vegan: 1, subgroup: null,
    description: 'Pasta de garbanzo aderezado con aceite de oliva, zumo de limón, crema de sésamo y ajo. Acompañado de garbanzos crocantes y pan Naan.',
  },
  {
    id: 'dish-kibbes-de-morcilla', categoryId: 'cat-entradas', name: 'Kibbes de Morcilla', price: 33500,
    vegetarian: 0, vegan: 0, subgroup: null,
    description: 'Croqueta de morcilla y trigo, sobre salsa Raita, acompañada de papa crocante y manzana caramelizada con alioli de albahaca.',
  },
  {
    id: 'dish-tacos-shiva-x2', categoryId: 'cat-entradas', name: 'Tacos Shiva X2', price: 29900,
    vegetarian: 0, vegan: 0, subgroup: null,
    description: '2 tacos de panceta de cerdo ahumada en pan naan con salsa tikka-masala y salsa raita. Acompañados de rábanos encurtidos y aliolí de albahaca.',
  },
  {
    id: 'dish-karma-mini-burguers', categoryId: 'cat-entradas', name: 'Karma Mini Burguers', price: 37900,
    vegetarian: 0, vegan: 0, subgroup: null,
    description: 'Tres mini hamburguesas de pollo crocante marinadas en nuestra clásica salsa india tandoori, con queso mozzarella y ensalada coleslaw. Acompañado de chips de tubérculos colombianos y salsa Asia.',
  },
  {
    id: 'dish-brochetas-pollo-tandoori', categoryId: 'cat-entradas', name: 'Brochetas de Pollo Tandoori', price: 39900,
    vegetarian: 0, vegan: 0, subgroup: null,
    description: 'Cuatro brochetas de pollo parrillado, plátano y piña ahumada, acompañados de ají maní garrapiñado y rábano encurtido.',
  },
  {
    id: 'dish-veggie-samosa', categoryId: 'cat-entradas', name: 'Veggie Samosa', price: 31900,
    vegetarian: 1, vegan: 0, subgroup: null,
    description: 'Empanada india en masa fillo crocante rellena de berenjenas asadas, shitake, nueces y tofu. Sobre una base de salsa raita y salsa korma de coco. Nota: salsa servida con rodajas de ají limo picante.',
  },
  {
    id: 'dish-chicken-samosa', categoryId: 'cat-entradas', name: 'Chicken Samosa', price: 33500,
    vegetarian: 0, vegan: 0, subgroup: null,
    description: 'Empanada india de masa fillo crocante rellena de pollo masala, papa y queso mozzarella. En una base de salsa raita y curry en leche de coco. Nota: salsa servida con rodajas de ají limo picante.',
  },
  {
    id: 'dish-jheenga-samosa', categoryId: 'cat-entradas', name: 'Jheenga Samosa', price: 33900,
    vegetarian: 0, vegan: 0, subgroup: null,
    description: 'Empanada india de masa philo crocante, rellena de camarón al tamarindo y coco con papa saborizada en cúrcuma y queso mozzarella. Nota: salsa servida con rodajas de ají limo picante.',
  },
  {
    id: 'dish-ceviche-chicharron', categoryId: 'cat-entradas', name: 'Ceviche de Chicharrón Cremoso', price: 38000,
    vegetarian: 0, vegan: 0, subgroup: null,
    description: 'Chicharrón carnudo crocante, plátano maduro en leche tigre cremosa acompañada con chips de plátano maduro.',
  },
  {
    id: 'dish-ceviche-salmon', categoryId: 'cat-entradas', name: 'Ceviche de Salmón', price: 38000,
    vegetarian: 0, vegan: 0, subgroup: null,
    description: 'Ceviche de salmón curado, palta, leche de tigre tradicional acompañado de chips de camote.',
  },

  // Platos fuertes
  {
    id: 'dish-fogata-de-mariscos', categoryId: 'cat-fuertes', name: 'Fogata de Mariscos', price: 45900,
    vegetarian: 0, vegan: 0, subgroup: null,
    description: 'Conchas al fuego con pesca blanca y camarones en salsa korma cremosa y toques ácidos.',
  },
  {
    id: 'dish-caribbean-chicken', categoryId: 'cat-fuertes', name: 'Caribbean Chicken Tikka-Masala', price: 49000,
    vegetarian: 0, vegan: 0, subgroup: null,
    description: 'Famoso plato indio de pollo en salsa masala, con tomates y leche de coco, acompañado de arroz verde con almendras y pan Naan al ajo.',
  },
  {
    id: 'dish-ensalada-bombay', categoryId: 'cat-fuertes', name: 'Ensalada Bombay', price: 35000,
    vegetarian: 1, vegan: 1, subgroup: null,
    description: 'Mix de hojas frescas mezcladas con sandía curada y ahumada, frutos secos, lentejas crocantes y tofu en tempura, acompañadas con vinagreta y chutney.',
  },
  {
    id: 'dish-wrap-pollo-tandoori', categoryId: 'cat-fuertes', name: 'Wrap de Pollo Tandoori (Kathi Roll)', price: 44900,
    vegetarian: 0, vegan: 0, subgroup: null,
    description: 'Wrap de pollo Tandoori y vegetales salteados en salsa chutney tropical envuelto en pan naan. Acompañado de reducción de corozo y aliolí de albahaca.',
  },
  {
    id: 'dish-ensalada-goa', categoryId: 'cat-fuertes', name: 'Ensalada Frutos del Mar de Goa', price: 45000,
    vegetarian: 0, vegan: 0, subgroup: null,
    description: 'Ensalada verde con un mix de mariscos de pulpo, camarón y tilapia. Acompañado de vinagreta de curry asiática, aguacate, tomate cherry y coco garrapiñado.',
  },
  {
    id: 'dish-cheeseburger', categoryId: 'cat-fuertes', name: 'Cheeseburger', price: 45000,
    vegetarian: 0, vegan: 0, subgroup: null,
    description: 'Blend de carnes maduradas, tocineta crocante, queso cheddar y salsa de pepinillos en un pan brioche, acompañado de papas rústicas y alioli asiático.',
  },
  {
    id: 'cmwk5u61n0007m0pof5a2nuaq', categoryId: 'cat-fuertes', name: 'Bife', price: 62000,
    vegetarian: 0, vegan: 0, subgroup: null,
    description: 'Bife argentino a término al josper acompañado de papines al romero en mantequilla y chimichurri',
  },
  {
    id: 'cmwk5wgyt0008m0poorbn0le1', categoryId: 'cat-fuertes', name: 'Cremoso de Salmon', price: 62000,
    vegetarian: 0, vegan: 0, subgroup: null,
    description: 'Salmon al josper sobre una cama de arroz cremoso y mizuna aderezada',
  },

  // Bebidas — Mocktails
  {
    id: 'dish-mocktail-pasion-rosas', categoryId: 'cat-bebidas', name: 'Mocktail Pasión de Rosas', price: 24000,
    vegetarian: 0, vegan: 0, subgroup: 'Mocktails',
    description: 'Refrescante infusión de flor de jamaica, balanceada con la efervescencia especiada del ginger ale y el toque frutal de arándanos frescos. Sin alcohol, vibrante y ligero.',
  },
  {
    id: 'dish-mocktail-gulupa-caliente', categoryId: 'cat-bebidas', name: 'Mocktail de Gulupa Caliente', price: 22000,
    vegetarian: 0, vegan: 0, subgroup: 'Mocktails',
    description: 'Mocktail de gulupa ligeramente picante, acompañado de gulupa, zumo de limón y toronja y miel de piña.',
  },
  {
    id: 'dish-pina-albahaca', categoryId: 'cat-bebidas', name: 'Piña & Albahaca', price: 22000,
    vegetarian: 0, vegan: 0, subgroup: 'Mocktails',
    description: 'Jugo fresco de piña madura, equilibrado con la nota herbal y aromática de la albahaca, que aporta profundidad y frescura natural.',
  },
  {
    id: 'dish-mocktail-jengibre-cardamomo', categoryId: 'cat-bebidas', name: 'Mocktail de Jengibre y Cardamomo', price: 24000,
    vegetarian: 0, vegan: 0, subgroup: 'Mocktails',
    description: 'Infusión intensa de jengibre fresco con notas cálidas de cardamomo, equilibrada con un toque cítrico y burbuja ligera.',
  },

  // Bebidas — Gaseosas y aguas
  { id: 'dish-ginger-mil976', categoryId: 'cat-bebidas', name: 'Ginger Mil976', price: 13000, vegetarian: 0, vegan: 0, subgroup: 'Gaseosas y aguas', description: 'Bebida de jengibre.' },
  { id: 'dish-tonica-mil976', categoryId: 'cat-bebidas', name: 'Tónica Mil976', price: 13000, vegetarian: 0, vegan: 0, subgroup: 'Gaseosas y aguas', description: 'Agua tónica.' },
  { id: 'dish-coca-cola-original', categoryId: 'cat-bebidas', name: 'Coca Cola Original', price: 10500, vegetarian: 0, vegan: 0, subgroup: 'Gaseosas y aguas', description: 'Gaseosa.' },
  { id: 'dish-coca-cola-zero', categoryId: 'cat-bebidas', name: 'Coca Cola Zero', price: 10500, vegetarian: 0, vegan: 0, subgroup: 'Gaseosas y aguas', description: 'Gaseosa sin azúcar.' },
  { id: 'dish-ginger-schweppes', categoryId: 'cat-bebidas', name: 'Ginger Schweppes', price: 10500, vegetarian: 0, vegan: 0, subgroup: 'Gaseosas y aguas', description: 'Gaseosa de jengibre.' },
  { id: 'dish-soda-schweppes', categoryId: 'cat-bebidas', name: 'Soda Schweppes', price: 10500, vegetarian: 0, vegan: 0, subgroup: 'Gaseosas y aguas', description: 'Agua con gas saborizada.' },
  { id: 'dish-tonica-schweppes', categoryId: 'cat-bebidas', name: 'Tónica Schweppes', price: 10500, vegetarian: 0, vegan: 0, subgroup: 'Gaseosas y aguas', description: 'Agua tónica.' },
  { id: 'dish-manantial', categoryId: 'cat-bebidas', name: 'Manantial', price: 10500, vegetarian: 0, vegan: 0, subgroup: 'Gaseosas y aguas', description: 'Agua sin gas.' },
  { id: 'dish-manantial-gas', categoryId: 'cat-bebidas', name: 'Manantial Gas', price: 10500, vegetarian: 0, vegan: 0, subgroup: 'Gaseosas y aguas', description: 'Agua con gas.' },
]

/**
 * Imagen de cada plato/bebida. Los archivos viven en `data/uploads/` y se
 * versionan en el repositorio, así que un despliegue nuevo ya trae las fotos.
 * El `imageUrl` se guarda en la base de datos, por eso el seed debe asignarlo.
 */
const DISH_IMAGES = {
  // Entradas
  'dish-hummus-bombay': '31d5c9f4-f08f-4543-a8b8-8f0e495e1476.avif',
  'dish-kibbes-de-morcilla': 'e7ffec3d-1a56-460f-9ca9-2349a072f386.avif',
  'dish-tacos-shiva-x2': '75c3e251-a5de-4ee3-99a2-96dafc49a7b3.avif',
  'dish-karma-mini-burguers': 'f2b3d86b-0292-4901-ba18-8b223207ca28.avif',
  'dish-brochetas-pollo-tandoori': '772f285f-9551-4177-b56a-e54ceb2e007f.avif',
  'dish-veggie-samosa': '4540333d-f950-4294-9003-4ba5d194dbdf.avif',
  'dish-chicken-samosa': 'a9cf5cf6-4d47-4501-8237-f86788a5dcf6.avif',
  'dish-jheenga-samosa': 'ece1c9f8-0608-43f4-b4dd-5a43266726ef.avif',
  'dish-ceviche-chicharron': 'c1256005-808a-4545-aea5-504c49140096.avif',
  'dish-ceviche-salmon': '5cb30084-8d09-4427-9224-2e885732b670.avif',

  // Platos fuertes
  'dish-fogata-de-mariscos': '4897cb06-86b0-4917-9335-f78c4caabedf.avif',
  'dish-caribbean-chicken': 'ab783184-5477-4842-bfcc-3b866fc5ac5c.avif',
  'dish-wrap-pollo-tandoori': '717dfa77-23b5-474f-8e06-8586db4bcd84.avif',
  'dish-ensalada-goa': '6720831b-a7bc-4a20-a3a5-fd30ade61359.avif',
  'dish-cheeseburger': '4f6bb11a-fe3c-445b-bbdc-8a62ad451099.avif',
  'cmwk5u61n0007m0pof5a2nuaq': 'c241aedf-58be-4b45-8a96-e449147287c1.avif', // Bife
  'cmwk5wgyt0008m0poorbn0le1': '8b91e1f7-33e4-45b6-837b-69c939f61ecc.avif', // Cremoso de Salmon

  // Bebidas
  'dish-mocktail-pasion-rosas': '69ec9a76-feb3-48ca-8278-d36324063a53.avif',
  'dish-mocktail-jengibre-cardamomo': 'e3a699bb-20e2-4690-9b55-e6a9c988ff34.avif',
  'dish-ginger-mil976': 'd8ae756e-f17a-4109-8278-8f383f9dc044.avif',
  'dish-tonica-mil976': '0d95e16b-50d4-484f-9b4a-f9c1bdb496f7.avif',
  'dish-coca-cola-original': '6450ea44-b5cb-4b2b-bc99-3ec3e0fb6c34.avif',
  'dish-coca-cola-zero': '8126a89c-8332-4be6-b88b-c973fe4a0344.avif',
  'dish-ginger-schweppes': 'ca45898a-04d5-4023-8fd3-e42fe029debd.avif',
  'dish-soda-schweppes': 'e81814f5-6f93-4620-be4f-4d78ee60c037.avif',
  'dish-tonica-schweppes': '699c61b4-6d08-4039-bfef-156e6903631b.avif',
  'dish-manantial': 'c96366cb-e7e2-4400-9413-ec7d6deca26f.avif',
  'dish-manantial-gas': '48e4ba89-9227-41e8-8c15-e09275c1a003.avif',
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt:${salt}:${hash}`
}

async function main() {
  const conn = await mariadb.createConnection({
    host: process.env.MYSQL_HOST ?? 'localhost',
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    multipleStatements: true,
    allowPublicKeyRetrieval: true,
  })

  try {
    const defaultLimit = 100000

    await conn.query(
      `INSERT INTO Event (id, name, description, status, defaultLimit, createdAt)
       VALUES (?, ?, ?, 'OPEN', ?, NOW())
       ON DUPLICATE KEY UPDATE name = VALUES(name),
         description = IF(Event.description = '', VALUES(description), Event.description)`,
      [EVENT_ID, 'Cena Evento', EVENT_DESCRIPTION, defaultLimit],
    )

    for (const c of CATEGORIES) {
      await conn.query(
        `INSERT INTO Category (id, eventId, name, slug, maxPrice, requiredQty, shareable, sortOrder)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), maxPrice=VALUES(maxPrice), shareable=VALUES(shareable), sortOrder=VALUES(sortOrder)`,
        [c.id, EVENT_ID, c.name, c.slug, c.maxPrice, c.shareable, c.sortOrder],
      )
    }

    for (const d of DISHES) {
      const imageName = DISH_IMAGES[d.id]
      const imageUrl = imageName ? `/uploads/${imageName}` : null
      await conn.query(
        `INSERT INTO Dish (id, categoryId, name, description, price, imageUrl, subgroup, active, isVegetarian, isVegan, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), price=VALUES(price),
           subgroup=VALUES(subgroup), isVegetarian=VALUES(isVegetarian), isVegan=VALUES(isVegan),
           imageUrl=IFNULL(Dish.imageUrl, VALUES(imageUrl))`,
        [d.id, d.categoryId, d.name, d.description, d.price, imageUrl, d.subgroup, d.vegetarian, d.vegan],
      )
    }

    const adminRows = await conn.query('SELECT COUNT(*) AS n FROM AdminUser')
    if (Number(adminRows[0].n) === 0) {
      await conn.query(
        `INSERT INTO AdminUser (id, username, passwordHash, createdAt) VALUES (?, ?, ?, NOW())`,
        ['admin-1', 'admin', hashPassword('admin123')],
      )
      console.log('✔ Usuario admin creado: admin / admin123 (cámbialo en el panel)')
    } else {
      console.log('• Usuario admin ya existe, no se modificó.')
    }

    const dishCount = Number((await conn.query('SELECT COUNT(*) AS n FROM Dish'))[0].n)
    console.log(`✔ Seed completado: ${CATEGORIES.length} categorías, ${dishCount} platos/bebidas.`)
  } finally {
    await conn.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
