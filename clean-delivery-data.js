// Script para limpiar datos de prueba/basura de delivery_districts
const { MongoClient } = require('mongodb');

async function cleanDeliveryData() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/sifrah');
  
  try {
    await client.connect();
    console.log('🔗 Conectado a MongoDB');
    
    const db = client.db();
    const collection = db.collection('delivery_districts');
    
    // Buscar y eliminar datos de prueba/basura
    const deleteResult = await collection.deleteMany({
      $or: [
        { district_name: { $regex: /^(test|dasdas|asdasd|xxx)/i } },
        { department: { $regex: /^(test|dasdas|asdasd|xxx)/i } },
        { province: { $regex: /^(test|dasdas|asdasd|xxx)/i } },
        { district_name: { $in: ['', null] } },
        { department: { $in: ['', null] } },
        { province: { $in: ['', null] } }
      ]
    });
    
    console.log(`🗑️  Eliminados ${deleteResult.deletedCount} registros de prueba/basura`);
    
    // Mostrar departamentos únicos restantes
    const departments = await collection.distinct('department', { active: true });
    console.log('📍 Departamentos válidos restantes:', departments);
    
    // Mostrar conteo por departamento
    const counts = await collection.aggregate([
      { $match: { active: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    console.log('📊 Conteo por departamento:');
    counts.forEach(item => {
      console.log(`   ${item._id}: ${item.count} distritos`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('✅ Conexión cerrada');
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  cleanDeliveryData();
}

module.exports = { cleanDeliveryData }; 