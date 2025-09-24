require('dotenv').config()

const prod = ['-p', '--p', '--prod']
const args = process.argv.slice(2)

const URL  = prod.includes(args[0]) ? process.env.DB_URL_PROD  : process.env.DB_URL_DEV
const name = prod.includes(args[0]) ? process.env.DB_NAME_PROD : process.env.DB_NAME_DEV

const { MongoClient } = require('mongodb');

// const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sifrah';

async function initDeliveryAgencies() {
  const client = new MongoClient(URL, { useUnifiedTopology: true });
  
  try {
    await client.connect();
    console.log('Conectado a MongoDB');
    
    const db = client.db(name);
    const collection = db.collection('delivery_agencies');
    
    // Limpiar colección existente
    // await collection.deleteMany({});
    // console.log('Colección delivery_agencies limpiada');
    
    // Insertar agencias de transporte
    // const agencies = [
    //   {
    //     agency_name: "Shalom",
    //     agency_code: "shalom",
    //     coverage_areas: ["cusco", "arequipa", "puno", "apurimac"],
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   {
    //     agency_name: "Marvisur",
    //     agency_code: "marvisur",
    //     coverage_areas: ["arequipa", "moquegua", "tacna", "cusco"],
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   {
    //     agency_name: "Olva Courier",
    //     agency_code: "olva",
    //     coverage_areas: ["nacional"],
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   {
    //     agency_name: "Serpost",
    //     agency_code: "serpost",
    //     coverage_areas: ["nacional"],
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   {
    //     agency_name: "DHL Express",
    //     agency_code: "dhl",
    //     coverage_areas: ["nacional"],
    //     active: false, // Inactiva por defecto
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   {
    //     agency_name: "FedEx",
    //     agency_code: "fedex",
    //     coverage_areas: ["nacional"],
    //     active: false, // Inactiva por defecto
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   {
    //     agency_name: "Cruz del Sur",
    //     agency_code: "cruz-del-sur",
    //     coverage_areas: ["piura", "la-libertad", "lambayeque", "cajamarca"],
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   {
    //     agency_name: "Línea",
    //     agency_code: "linea",
    //     coverage_areas: ["junin", "huancavelica", "ayacucho", "huanuco"],
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   {
    //     agency_name: "Tepsa",
    //     agency_code: "tepsa",
    //     coverage_areas: ["ica", "arequipa", "cusco"],
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   {
    //     agency_name: "Movil Tours",
    //     agency_code: "movil-tours",
    //     coverage_areas: ["la-libertad", "ancash", "cajamarca"],
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   }
    // ];
    
    // const result = await collection.insertMany(agencies);
    // console.log(`${result.insertedCount} agencias de transporte insertadas`);
    
    // Crear índices
    await collection.createIndex({ agency_code: 1 });
    await collection.createIndex({ coverage_areas: 1 });
    await collection.createIndex({ active: 1 });
    await collection.createIndex({ agency_name: "text" }); // Para búsquedas de texto
    console.log('Índices creados para delivery_agencies');
    
  } catch (error) {
    console.error('Error inicializando delivery_agencies:', error);
  } finally {
    await client.close();
  }
}

initDeliveryAgencies(); 