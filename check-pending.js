// Script para verificar activaciones y afiliaciones pendientes
const db = require('./db');
const { User, Tree, Activation, Affiliation } = db;

async function checkPending() {
  try {
    console.log('=== VERIFICANDO ACTIVACIONES Y AFILIACIONES PENDIENTES ===\n');

    // 1. Verificar activaciones pendientes
    console.log('1. Activaciones pendientes:');
    const pendingActivations = await Activation.find({ status: 'pending' });
    console.log(`   - Total activaciones pendientes: ${pendingActivations.length}`);
    
    if (pendingActivations.length > 0) {
      for (const activation of pendingActivations.slice(0, 3)) {
        const user = await User.findOne({ id: activation.userId });
        console.log(`   - ID: ${activation.id}, Usuario: ${user?.name || 'N/A'} ${user?.lastName || ''}, Puntos: ${activation.points}, Fecha: ${activation.date}`);
      }
    }

    // 2. Verificar afiliaciones pendientes
    console.log('\n2. Afiliaciones pendientes:');
    const pendingAffiliations = await Affiliation.find({ status: 'pending' });
    console.log(`   - Total afiliaciones pendientes: ${pendingAffiliations.length}`);
    
    if (pendingAffiliations.length > 0) {
      for (const affiliation of pendingAffiliations.slice(0, 3)) {
        const user = await User.findOne({ id: affiliation.userId });
        console.log(`   - ID: ${affiliation.id}, Usuario: ${user?.name || 'N/A'} ${user?.lastName || ''}, Plan: ${affiliation.plan?.id || 'N/A'}, Fecha: ${affiliation.date}`);
      }
    }

    // 3. Verificar usuarios recientemente aprobados
    console.log('\n3. Usuarios recientemente aprobados (últimas 24 horas):');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentActivations = await Activation.find({ 
      status: 'approved', 
      date: { $gte: yesterday } 
    });
    console.log(`   - Activaciones aprobadas en las últimas 24h: ${recentActivations.length}`);
    
    const recentAffiliations = await Affiliation.find({ 
      status: 'approved', 
      date: { $gte: yesterday } 
    });
    console.log(`   - Afiliaciones aprobadas en las últimas 24h: ${recentAffiliations.length}`);

    // 4. Verificar si hay inconsistencias en total_points
    console.log('\n4. Verificando inconsistencias en total_points...');
    const usersWithInconsistencies = [];
    
    const allUsers = await User.find({});
    for (const user of allUsers.slice(0, 50)) { // Solo verificar los primeros 50 para no sobrecargar
      if (user.total_points !== undefined) {
        const node = await Tree.findOne({ id: user.id });
        if (node) {
          let childrenTotal = 0;
          if (node.childs && node.childs.length > 0) {
            const childUsers = await User.find({ id: { $in: node.childs } });
            childrenTotal = childUsers.reduce((acc, c) => acc + (c.total_points || 0), 0);
          }
          
          const expectedTotal = (user.points || 0) + (user.affiliation_points || 0) + childrenTotal;
          
          if (Math.abs(user.total_points - expectedTotal) > 1) { // Permitir pequeñas diferencias por redondeo
            usersWithInconsistencies.push({
              userId: user.id,
              current: user.total_points,
              expected: expectedTotal,
              difference: user.total_points - expectedTotal
            });
          }
        }
      }
    }
    
    console.log(`   - Usuarios con inconsistencias encontrados: ${usersWithInconsistencies.length}`);
    if (usersWithInconsistencies.length > 0) {
      for (const inconsistency of usersWithInconsistencies.slice(0, 5)) {
        console.log(`     * Usuario ${inconsistency.userId}: actual=${inconsistency.current}, esperado=${inconsistency.expected}, diferencia=${inconsistency.difference}`);
      }
    }

    console.log('\n=== VERIFICACIÓN COMPLETADA ===');
    
  } catch (error) {
    console.error('Error en la verificación:', error);
  }
}

// Ejecutar la verificación
checkPending().then(() => {
  console.log('Script de verificación terminado');
  process.exit(0);
}).catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
}); 