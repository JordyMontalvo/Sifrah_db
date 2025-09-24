require('dotenv').config()

const prod = ['-p', '--p', '--prod']
const args = process.argv.slice(2)

const URL  = prod.includes(args[0]) ? process.env.DB_URL_PROD  : process.env.DB_URL_DEV
const name = prod.includes(args[0]) ? process.env.DB_NAME_PROD : process.env.DB_NAME_DEV

const { MongoClient } = require('mongodb');

// const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sifrah';

async function initDeliveryZones() {
  const client = new MongoClient(URL, { useUnifiedTopology: true });
  
  try {
    await client.connect();
    console.log('Conectado a MongoDB');
    
    const db = client.db(name);
    const collection = db.collection('delivery_zones');
    
    // Limpiar colección existente
    // await collection.deleteMany({});
    // console.log('Colección delivery_zones limpiada');
    
    // Insertar zonas de delivery
    // const zones = [
    //   {
    //     zone_name: "Zona 1",
    //     zone_number: 1,
    //     price: 15.00,
    //     delivery_type: "local",
    //     description: "Zona céntrica de Lima - Delivery rápido",
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   {
    //     zone_name: "Zona 2", 
    //     zone_number: 2,
    //     price: 20.00,
    //     delivery_type: "local",
    //     description: "Zona intermedia de Lima",
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   {
    //     zone_name: "Zona 3",
    //     zone_number: 3, 
    //     price: 25.00,
    //     delivery_type: "local",
    //     description: "Zona alejada de Lima",
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   }
    // ];
    
    // const result = await collection.insertMany(zones);
    // console.log(`${result.insertedCount} zonas de delivery insertadas`);
    
    // Crear índices
    await collection.createIndex({ zone_number: 1 });
    await collection.createIndex({ active: 1 });
    console.log('Índices creados para delivery_zones');
    
  } catch (error) {
    console.error('Error inicializando delivery_zones:', error);
  } finally {
    await client.close();
  }
}

initDeliveryZones(); 