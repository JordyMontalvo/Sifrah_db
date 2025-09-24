require('dotenv').config();
const db = require('./db');
const { User, Tree } = db;

// Función para calcular y establecer total_points para un usuario
async function calcAndSetTotalPoints(userId) {
  try {
    // 1. Obtener el nodo del árbol
    const node = await Tree.findOne({ id: userId });
    if (!node) {
      console.log(`Nodo no encontrado para userId: ${userId}`);
      return;
    }

    // 2. Obtener el usuario
    const user = await User.findOne({ id: userId });
    if (!user) {
      console.log(`Usuario no encontrado para userId: ${userId}`);
      return;
    }

    // 3. Calcular el total de los hijos
    let childrenTotal = 0;
    if (node.childs && node.childs.length > 0) {
      const childUsers = await User.find({ id: { $in: node.childs } });
      childrenTotal = childUsers.reduce((acc, c) => acc + (c.total_points || 0), 0);
    }

    // 4. Calcular el total_points propio (incluyendo afiliaciones)
    const total_points = (Number(user.points) || 0) + (Number(user.affiliation_points) || 0) + childrenTotal;

    // 5. Guardar el total_points en el usuario
    await User.updateOne({ id: userId }, { total_points });

    console.log(`Usuario ${userId}: puntos=${user.points || 0}, afiliación=${user.affiliation_points || 0}, hijos=${childrenTotal}, total=${total_points}`);

    // 6. Propagar hacia arriba si tiene padre
    if (node.parent) {
      await calcAndSetTotalPoints(node.parent);
    }
  } catch (error) {
    console.error(`Error procesando usuario ${userId}:`, error);
  }
}

// Función principal
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