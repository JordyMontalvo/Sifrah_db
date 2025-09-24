const db = require("./db");
const bcrypt = require("bcrypt");

const { User } = db;

async function createAdmin() {
  const password = await bcrypt.hash("Admin2024!", 12); // Cambia la contraseña si lo deseas
  const admin = {
    id: "admin",
    dni: "ADMIN",
    name: "Administrador",
    email: "admin@sifrah.com",
    password,
    type: "admin",
    affiliated: true,
    activated: true,
    plan: "admin",
    date: new Date(),
  };
  await User.insert(admin);
  console.log("Usuario admin creado:", admin);
}

createAdmin();
