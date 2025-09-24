require('dotenv').config()

const prod = ['-p', '--p', '--prod']
const args = process.argv.slice(2)

const URL  = prod.includes(args[0]) ? process.env.DB_URL_PROD  : process.env.DB_URL_DEV
const name = prod.includes(args[0]) ? process.env.DB_NAME_PROD : process.env.DB_NAME_DEV

const { MongoClient } = require('mongodb');

// const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sifrah';

async function initDeliveryDistricts() {
  const client = new MongoClient(URL, { useUnifiedTopology: true });
  
  try {
    await client.connect();
    console.log('Conectado a MongoDB');
    
    const db = client.db(name);
    const collection = db.collection('delivery_districts');
    const zonesCollection = db.collection('delivery_zones');
    
    // Obtener IDs de las zonas
    // const zones = await zonesCollection.find({}).toArray();
    // const zone1Id = zones.find(z => z.zone_number === 1)?._id;
    // const zone2Id = zones.find(z => z.zone_number === 2)?._id;
    // const zone3Id = zones.find(z => z.zone_number === 3)?._id;
    
    // Limpiar colección existente
    // await collection.deleteMany({});
    // console.log('Colección delivery_districts limpiada');
    
    // Insertar distritos con sus zonas asignadas
    // const districts = [
    //   // Zona 1 - Céntrica (S/ 15.00)
    //   {
    //     district_name: "Cercado de Lima",
    //     department: "lima",
    //     province: "lima",
    //     zone_id: zone1Id,
    //     zone_number: 1,
    //     delivery_type: "local",
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   {
    //     district_name: "Breña",
    //     department: "lima", 
    //     province: "lima",
    //     zone_id: zone1Id,
    //     zone_number: 1,
    //     delivery_type: "local",
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   {
    //     district_name: "La Victoria",
    //     department: "lima",
    //     province: "lima", 
    //     zone_id: zone1Id,
    //     zone_number: 1,
    //     delivery_type: "local",
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   {
    //     district_name: "Rímac",
    //     department: "lima",
    //     province: "lima",
    //     zone_id: zone1Id,
    //     zone_number: 1,
    //     delivery_type: "local", 
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   
    //   // Zona 2 - Intermedia (S/ 20.00)
    //   {
    //     district_name: "Jesús María",
    //     department: "lima",
    //     province: "lima",
    //     zone_id: zone2Id,
    //     zone_number: 2,
    //     delivery_type: "local",
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   {
    //     district_name: "La Molina",
    //     department: "lima",
    //     province: "lima",
    //     zone_id: zone2Id,
    //     zone_number: 2,
    //     delivery_type: "local",
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   {
    //     district_name: "Lince",
    //     department: "lima",
    //     province: "lima",
    //     zone_id: zone2Id,
    //     zone_number: 2,
    //     delivery_type: "local",
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   {
    //     district_name: "Magdalena del Mar",
    //     department: "lima",
    //     province: "lima",
    //     zone_id: zone2Id,
    //     zone_number: 2,
    //     delivery_type: "local",
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   {
    //     district_name: "Miraflores",
    //     department: "lima",
    //     province: "lima",
    //     zone_id: zone2Id,
    //     zone_number: 2,
    //     delivery_type: "local",
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   {
    //     district_name: "Pueblo Libre",
    //     department: "lima",
    //     province: "lima",
    //     zone_id: zone2Id,
    //     zone_number: 2,
    //     delivery_type: "local",
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   {
    //     district_name: "San Borja",
    //     department: "lima",
    //     province: "lima",
    //     zone_id: zone2Id,
    //     zone_number: 2,
    //     delivery_type: "local",
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   {
    //     district_name: "San Isidro",
    //     department: "lima",
    //     province: "lima",
    //     zone_id: zone2Id,
    //     zone_number: 2,
    //     delivery_type: "local",
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   {
    //     district_name: "Surco", 
    //     department: "lima",
    //     province: "lima",
    //     zone_id: zone2Id,
    //     zone_number: 2,
    //     delivery_type: "local",
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   
    //   // Zona 3 - Alejada (S/ 25.00)
    //   {
    //     district_name: "Villa El Salvador",
    //     department: "lima",
    //     province: "lima",
    //     zone_id: zone3Id,
    //     zone_number: 3,
    //     delivery_type: "local",
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   {
    //     district_name: "Ate",
    //     department: "lima",
    //     province: "lima",
    //     zone_id: zone3Id,
    //     zone_number: 3,
    //     delivery_type: "local",
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   {
    //     district_name: "Barranco",
    //     department: "lima",
    //     province: "lima",
    //     zone_id: zone3Id,
    //     zone_number: 3,
    //     delivery_type: "local",
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   {
    //     district_name: "Chorrillos",
    //     department: "lima",
    //     province: "lima",
    //     zone_id: zone3Id,
    //     zone_number: 3,
    //     delivery_type: "local",
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   {
    //     district_name: "Los Olivos",
    //     department: "lima",
    //     province: "lima",
    //     zone_id: zone3Id,
    //     zone_number: 3,
    //     delivery_type: "local",
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   {
    //     district_name: "San Juan de Lurigancho",
    //     department: "lima",
    //     province: "lima",
    //     zone_id: zone3Id,
    //     zone_number: 3,
    //     delivery_type: "local",
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   {
    //     district_name: "San Martín de Porres",
    //     department: "lima",
    //     province: "lima",
    //     zone_id: zone3Id,
    //     zone_number: 3,
    //     delivery_type: "local",
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   },
    //   {
    //     district_name: "Villa María del Triunfo",
    //     department: "lima",
    //     province: "lima",
    //     zone_id: zone3Id,
    //     zone_number: 3,
    //     delivery_type: "local",
    //     active: true,
    //     created_at: new Date(),
    //     updated_at: new Date()
    //   }
    // ];
    
    // const result = await collection.insertMany(districts);
    // console.log(`${result.insertedCount} distritos insertados`);
    
    // Crear índices
    await collection.createIndex({ district_name: 1 });
    await collection.createIndex({ zone_id: 1 });
    await collection.createIndex({ zone_number: 1 });
    await collection.createIndex({ department: 1, province: 1 });
    await collection.createIndex({ active: 1 });
    console.log('Índices creados para delivery_districts');
    
  } catch (error) {
    console.error('Error inicializando delivery_districts:', error);
  } finally {
    await client.close();
  }
}

initDeliveryDistricts(); 