// Script para probar el flujo de total_points
const db = require('./db');
const { User, Tree, Activation, Affiliation } = db;

async function testFlow() {
  try {
    console.log('=== PRUEBA DEL FLUJO DE TOTAL_POINTS ===\n');

    // 1. Verificar usuarios existentes
    console.log('1. Verificando usuarios existentes...');
    const users = await User.find({});
    console.log(`   - Total usuarios: ${users.length}`);
    
    // Mostrar algunos usuarios con sus puntos
    const sampleUsers = users.slice(0, 5);
    for (const user of sampleUsers) {
      console.log(`   - Usuario ${user.id}: points=${user.points || 0}, affiliation_points=${user.affiliation_points || 0}, total_points=${user.total_points || 0}`);
    }

    // 2. Verificar estructura del árbol
    console.log('\n2. Verificando estructura del árbol...');
    const treeNodes = await Tree.find({});
    console.log(`   - Total nodos en el árbol: ${treeNodes.length}`);
    
    // Mostrar algunos nodos del árbol
    const sampleNodes = treeNodes.slice(0, 5);
    for (const node of sampleNodes) {
      console.log(`   - Nodo ${node.id}: parent=${node.parent || 'raíz'}, hijos=${node.childs ? node.childs.length : 0}`);
    }

    // 3. Verificar activaciones recientes
    console.log('\n3. Verificando activaciones recientes...');
    const activations = await Activation.find({ status: 'approved' });
    console.log(`   - Total activaciones aprobadas: ${activations.length}`);
    
    if (activations.length > 0) {
      const recentActivation = activations[activations.length - 1];
      console.log(`   - Última activación: userId=${recentActivation.userId}, points=${recentActivation.points}, status=${recentActivation.status}`);
    }

    // 4. Verificar afiliaciones recientes
    console.log('\n4. Verificando afiliaciones recientes...');
    const affiliations = await Affiliation.find({ status: 'approved' });
    console.log(`   - Total afiliaciones aprobadas: ${affiliations.length}`);
    
    if (affiliations.length > 0) {
      const recentAffiliation = affiliations[affiliations.length - 1];
      console.log(`   - Última afiliación: userId=${recentAffiliation.userId}, plan=${recentAffiliation.plan?.id || 'N/A'}, status=${recentAffiliation.status}`);
    }

    // 5. Verificar que total_points se esté calculando correctamente
    console.log('\n5. Verificando cálculo de total_points...');
    const usersWithTotalPoints = await User.find({ total_points: { $exists: true, $gt: 0 } });
    console.log(`   - Usuarios con total_points > 0: ${usersWithTotalPoints.length}`);
    
    if (usersWithTotalPoints.length > 0) {
      const userWithPoints = usersWithTotalPoints[0];
      console.log(`   - Ejemplo usuario: ${userWithPoints.id}`);
      console.log(`     * points: ${userWithPoints.points || 0}`);
      console.log(`     * affiliation_points: ${userWithPoints.affiliation_points || 0}`);
      console.log(`     * total_points: ${userWithPoints.total_points || 0}`);
      
      // Verificar si tiene hijos
      const node = await Tree.findOne({ id: userWithPoints.id });
      if (node && node.childs && node.childs.length > 0) {
        console.log(`     * hijos en el árbol: ${node.childs.length}`);
        
        // Calcular manualmente el total esperado
        const childUsers = await User.find({ id: { $in: node.childs } });
        const childrenTotal = childUsers.reduce((acc, c) => acc + (c.total_points || 0), 0);
        const expectedTotal = (userWithPoints.points || 0) + (userWithPoints.affiliation_points || 0) + childrenTotal;
        
        console.log(`     * total esperado: ${expectedTotal}`);
        console.log(`     * ¿Coincide?: ${expectedTotal === userWithPoints.total_points ? 'SÍ' : 'NO'}`);
      }
    }

    console.log('\n=== PRUEBA COMPLETADA ===');
    
  } catch (error) {
    console.error('Error en la prueba:', error);
  }
}

// Ejecutar la prueba
testFlow().then(() => {
  console.log('Script de prueba terminado');
  process.exit(0);
}).catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
}); 