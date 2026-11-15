// Datos iniciales (seed) — Cena App
// Uso: node prisma/seed.mjs
import 'dotenv/config'
import mariadb from 'mariadb'
import { randomBytes, scryptSync } from 'node:crypto'

const EVENT_ID = 'evt-principal'

const CATEGORIES = [
  { id: 'cat-entradas', name: 'Entradas', slug: 'entradas', maxPrice: 40000, shareable: 1, sortOrder: 1 },
  { id: 'cat-fuertes', name: 'Platos fuertes', slug: 'platos-fuertes', maxPrice: 50000, shareable: 0, sortOrder: 2 },
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
      `INSERT INTO Event (id, name, status, defaultLimit, createdAt)
       VALUES (?, ?, 'OPEN', ?, NOW())
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [EVENT_ID, 'Cena Evento', defaultLimit],
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
      await conn.query(
        `INSERT INTO Dish (id, categoryId, name, description, price, imageUrl, subgroup, active, isVegetarian, isVegan, createdAt)
         VALUES (?, ?, ?, ?, ?, NULL, ?, 1, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), price=VALUES(price),
           subgroup=VALUES(subgroup), isVegetarian=VALUES(isVegetarian), isVegan=VALUES(isVegan)`,
        [d.id, d.categoryId, d.name, d.description, d.price, d.subgroup, d.vegetarian, d.vegan],
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
