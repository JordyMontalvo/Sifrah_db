const db = require('./db');
const { User } = db; // Asegúrate de que el modelo User esté correctamente exportado desde tu archivo db.js

// Función para cambiar el plan del usuario
async function changeUserPlan(dni, newPlanId) {
  try {
    console.log('Buscando usuario con DNI:', dni);
    const user = await User.findOne({ dni: dni }); // Cambia la búsqueda a DNI
    console.log('Usuario encontrado:', user);

    if (!user) {
      console.log('Usuario no encontrado');
      return;
    }

    // Cambiar el plan
    user.plan = newPlanId; // Cambia el plan al nuevo ID
    await user.save(); // Guardar los cambios

    console.log(`El plan del usuario con DNI ${dni} ha sido cambiado a ${newPlanId}`);
  } catch (error) {
    console.error('Error al cambiar el plan del usuario:', error);
  }
}

// Llamar a la función con el DNI del usuario y el nuevo ID del plan
const dni = '0918691965'; // DNI del usuario
const newPlanId = 'master'; // ID del nuevo plan
changeUserPlan(dni, newPlanId);