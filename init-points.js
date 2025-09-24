// Script para inicializar el campo total_points en todos los usuarios/nodos del árbol
const db = require('./db');
const { User, Tree } = db;

async function calcAndSetTotalPoints(userId) {
  const node = await Tree.findOne({ id: userId });
  if (!node) return 0;

  const user = await User.findOne({ id: userId });
  if (!user) return 0;

  let childrenTotal = 0;
  if (node.childs && node.childs.length > 0) {
    for (const childId of node.childs) {
      childrenTotal += await calcAndSetTotalPoints(childId);
    }
  }

  const total_points = (user.points || 0) + (user.affiliation_points || 0) + childrenTotal;
  await User.updateOne({ id: userId }, { total_points });
  return total_points;
}

async function main() {
  try {
    console.log('Iniciando cálculo de total_points para todos los usuarios...');
    
    // 1. Encontrar todos los nodos raíz (sin padre)
    const rootNodes = await Tree.find({ parent: { $exists: false } });
    console.log(`Encontrados ${rootNodes.length} nodos raíz`);

    // 2. Procesar cada nodo raíz
    for (const rootNode of rootNodes) {
      console.log(`Procesando nodo raíz: ${rootNode.id}`);
      await calcAndSetTotalPoints(rootNode.id);
    }

    console.log('¡Cálculo de total_points completado!');
  } catch (error) {
    console.error('Error en main:', error);
  }
}

// Ejecutar el script
main().then(() => {
  console.log('Script terminado');
  process.exit(0);
}).catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});
