require('dotenv').config()

const prod = ['-p', '--p', '--prod']
const args = process.argv.slice(2)

const URL  = prod.includes(args[0]) ? process.env.DB_URL_PROD  : process.env.DB_URL_DEV
const name = prod.includes(args[0]) ? process.env.DB_NAME_PROD : process.env.DB_NAME_DEV

const { MongoClient } = require('mongodb');

const uri = URL;
const dbName = name;

// Distritos principales del Perú organizados por departamento y provincia
const peruDistricts = [
  // LIMA
  { department: 'lima', province: 'lima', district_name: 'Cercado de Lima', delivery_type: 'local', active: true },
  { department: 'lima', province: 'lima', district_name: 'Miraflores', delivery_type: 'local', active: true },
  { department: 'lima', province: 'lima', district_name: 'San Isidro', delivery_type: 'local', active: true },
  { department: 'lima', province: 'lima', district_name: 'Surco', delivery_type: 'local', active: true },
  { department: 'lima', province: 'lima', district_name: 'La Molina', delivery_type: 'local', active: true },
  { department: 'lima', province: 'lima', district_name: 'San Borja', delivery_type: 'local', active: true },
  { department: 'lima', province: 'lima', district_name: 'Barranco', delivery_type: 'local', active: true },
  { department: 'lima', province: 'lima', district_name: 'Chorrillos', delivery_type: 'local', active: true },
  { department: 'lima', province: 'lima', district_name: 'Jesús María', delivery_type: 'local', active: true },
  { department: 'lima', province: 'lima', district_name: 'Lince', delivery_type: 'local', active: true },
  { department: 'lima', province: 'lima', district_name: 'Magdalena del Mar', delivery_type: 'local', active: true },
  { department: 'lima', province: 'lima', district_name: 'Pueblo Libre', delivery_type: 'local', active: true },
  { department: 'lima', province: 'lima', district_name: 'San Miguel', delivery_type: 'local', active: true },
  { department: 'lima', province: 'lima', district_name: 'Breña', delivery_type: 'local', active: true },
  { department: 'lima', province: 'lima', district_name: 'La Victoria', delivery_type: 'local', active: true },
  { department: 'lima', province: 'lima', district_name: 'Rímac', delivery_type: 'local', active: true },
  { department: 'lima', province: 'lima', district_name: 'San Martín de Porres', delivery_type: 'local', active: true },
  { department: 'lima', province: 'lima', district_name: 'Independencia', delivery_type: 'local', active: true },
  { department: 'lima', province: 'lima', district_name: 'Los Olivos', delivery_type: 'local', active: true },
  { department: 'lima', province: 'lima', district_name: 'Comas', delivery_type: 'local', active: true },
  { department: 'lima', province: 'lima', district_name: 'San Juan de Lurigancho', delivery_type: 'local', active: true },
  { department: 'lima', province: 'lima', district_name: 'El Agustino', delivery_type: 'local', active: true },
  { department: 'lima', province: 'lima', district_name: 'Santa Anita', delivery_type: 'local', active: true },
  { department: 'lima', province: 'lima', district_name: 'Ate', delivery_type: 'local', active: true },
  { department: 'lima', province: 'lima', district_name: 'Chaclacayo', delivery_type: 'local', active: true },
  { department: 'lima', province: 'lima', district_name: 'Villa María del Triunfo', delivery_type: 'local', active: true },
  { department: 'lima', province: 'lima', district_name: 'San Juan de Miraflores', delivery_type: 'local', active: true },
  { department: 'lima', province: 'lima', district_name: 'Villa El Salvador', delivery_type: 'local', active: true },

  // LIMA - CALLAO
  { department: 'lima', province: 'callao', district_name: 'Callao', delivery_type: 'local', active: true },
  { department: 'lima', province: 'callao', district_name: 'Bellavista', delivery_type: 'local', active: true },
  { department: 'lima', province: 'callao', district_name: 'Carmen de la Legua Reynoso', delivery_type: 'local', active: true },
  { department: 'lima', province: 'callao', district_name: 'La Perla', delivery_type: 'local', active: true },
  { department: 'lima', province: 'callao', district_name: 'La Punta', delivery_type: 'local', active: true },
  { department: 'lima', province: 'callao', district_name: 'Ventanilla', delivery_type: 'local', active: true },

  // AREQUIPA
  { department: 'arequipa', province: 'arequipa', district_name: 'Arequipa', delivery_type: 'agency', active: true },
  { department: 'arequipa', province: 'arequipa', district_name: 'Alto Selva Alegre', delivery_type: 'agency', active: true },
  { department: 'arequipa', province: 'arequipa', district_name: 'Cayma', delivery_type: 'agency', active: true },
  { department: 'arequipa', province: 'arequipa', district_name: 'Cerro Colorado', delivery_type: 'agency', active: true },
  { department: 'arequipa', province: 'arequipa', district_name: 'Characato', delivery_type: 'agency', active: true },
  { department: 'arequipa', province: 'arequipa', district_name: 'Chiguata', delivery_type: 'agency', active: true },
  { department: 'arequipa', province: 'arequipa', district_name: 'Jacobo Hunter', delivery_type: 'agency', active: true },
  { department: 'arequipa', province: 'arequipa', district_name: 'José Luis Bustamante y Rivero', delivery_type: 'agency', active: true },
  { department: 'arequipa', province: 'arequipa', district_name: 'Mariano Melgar', delivery_type: 'agency', active: true },
  { department: 'arequipa', province: 'arequipa', district_name: 'Miraflores', delivery_type: 'agency', active: true },
  { department: 'arequipa', province: 'arequipa', district_name: 'Mollebaya', delivery_type: 'agency', active: true },
  { department: 'arequipa', province: 'arequipa', district_name: 'Paucarpata', delivery_type: 'agency', active: true },
  { department: 'arequipa', province: 'arequipa', district_name: 'Pocsi', delivery_type: 'agency', active: true },
  { department: 'arequipa', province: 'arequipa', district_name: 'Polobaya', delivery_type: 'agency', active: true },
  { department: 'arequipa', province: 'arequipa', district_name: 'Quequeña', delivery_type: 'agency', active: true },
  { department: 'arequipa', province: 'arequipa', district_name: 'Sabandia', delivery_type: 'agency', active: true },
  { department: 'arequipa', province: 'arequipa', district_name: 'Sachaca', delivery_type: 'agency', active: true },
  { department: 'arequipa', province: 'arequipa', district_name: 'San Juan de Siguas', delivery_type: 'agency', active: true },
  { department: 'arequipa', province: 'arequipa', district_name: 'San Juan de Tarucani', delivery_type: 'agency', active: true },
  { department: 'arequipa', province: 'arequipa', district_name: 'Santa Isabel de Siguas', delivery_type: 'agency', active: true },
  { department: 'arequipa', province: 'arequipa', district_name: 'Santa Rita de Siguas', delivery_type: 'agency', active: true },
  { department: 'arequipa', province: 'arequipa', district_name: 'Socabaya', delivery_type: 'agency', active: true },
  { department: 'arequipa', province: 'arequipa', district_name: 'Tiabaya', delivery_type: 'agency', active: true },
  { department: 'arequipa', province: 'arequipa', district_name: 'Uchumayo', delivery_type: 'agency', active: true },
  { department: 'arequipa', province: 'arequipa', district_name: 'Vitor', delivery_type: 'agency', active: true },
  { department: 'arequipa', province: 'arequipa', district_name: 'Yanahuara', delivery_type: 'agency', active: true },
  { department: 'arequipa', province: 'arequipa', district_name: 'Yarabamba', delivery_type: 'agency', active: true },
  { department: 'arequipa', province: 'arequipa', district_name: 'Yura', delivery_type: 'agency', active: true },

  // CUSCO
  { department: 'cusco', province: 'cusco', district_name: 'Cusco', delivery_type: 'agency', active: true },
  { department: 'cusco', province: 'cusco', district_name: 'Ccorca', delivery_type: 'agency', active: true },
  { department: 'cusco', province: 'cusco', district_name: 'Poroy', delivery_type: 'agency', active: true },
  { department: 'cusco', province: 'cusco', district_name: 'San Jerónimo', delivery_type: 'agency', active: true },
  { department: 'cusco', province: 'cusco', district_name: 'San Sebastián', delivery_type: 'agency', active: true },
  { department: 'cusco', province: 'cusco', district_name: 'Santiago', delivery_type: 'agency', active: true },
  { department: 'cusco', province: 'cusco', district_name: 'Saylla', delivery_type: 'agency', active: true },
  { department: 'cusco', province: 'cusco', district_name: 'Wanchaq', delivery_type: 'agency', active: true },

  // LA LIBERTAD
  { department: 'la libertad', province: 'trujillo', district_name: 'Trujillo', delivery_type: 'agency', active: true },
  { department: 'la libertad', province: 'trujillo', district_name: 'El Porvenir', delivery_type: 'agency', active: true },
  { department: 'la libertad', province: 'trujillo', district_name: 'Florencia de Mora', delivery_type: 'agency', active: true },
  { department: 'la libertad', province: 'trujillo', district_name: 'Huanchaco', delivery_type: 'agency', active: true },
  { department: 'la libertad', province: 'trujillo', district_name: 'La Esperanza', delivery_type: 'agency', active: true },
  { department: 'la libertad', province: 'trujillo', district_name: 'Laredo', delivery_type: 'agency', active: true },
  { department: 'la libertad', province: 'trujillo', district_name: 'Moche', delivery_type: 'agency', active: true },
  { department: 'la libertad', province: 'trujillo', district_name: 'Poroto', delivery_type: 'agency', active: true },
  { department: 'la libertad', province: 'trujillo', district_name: 'Salaverry', delivery_type: 'agency', active: true },
  { department: 'la libertad', province: 'trujillo', district_name: 'Simbal', delivery_type: 'agency', active: true },
  { department: 'la libertad', province: 'trujillo', district_name: 'Víctor Larco Herrera', delivery_type: 'agency', active: true },

  // PIURA
  { department: 'piura', province: 'piura', district_name: 'Piura', delivery_type: 'agency', active: true },
  { department: 'piura', province: 'piura', district_name: 'Castilla', delivery_type: 'agency', active: true },
  { department: 'piura', province: 'piura', district_name: 'Catacaos', delivery_type: 'agency', active: true },
  { department: 'piura', province: 'piura', district_name: 'Cura Mori', delivery_type: 'agency', active: true },
  { department: 'piura', province: 'piura', district_name: 'El Tallán', delivery_type: 'agency', active: true },
  { department: 'piura', province: 'piura', district_name: 'La Arena', delivery_type: 'agency', active: true },
  { department: 'piura', province: 'piura', district_name: 'La Unión', delivery_type: 'agency', active: true },
  { department: 'piura', province: 'piura', district_name: 'Las Lomas', delivery_type: 'agency', active: true },
  { department: 'piura', province: 'piura', district_name: 'Tambo Grande', delivery_type: 'agency', active: true },

  // LAMBAYEQUE
  { department: 'lambayeque', province: 'chiclayo', district_name: 'Chiclayo', delivery_type: 'agency', active: true },
  { department: 'lambayeque', province: 'chiclayo', district_name: 'Chongoyape', delivery_type: 'agency', active: true },
  { department: 'lambayeque', province: 'chiclayo', district_name: 'Eten', delivery_type: 'agency', active: true },
  { department: 'lambayeque', province: 'chiclayo', district_name: 'Eten Puerto', delivery_type: 'agency', active: true },
  { department: 'lambayeque', province: 'chiclayo', district_name: 'José Leonardo Ortiz', delivery_type: 'agency', active: true },
  { department: 'lambayeque', province: 'chiclayo', district_name: 'La Victoria', delivery_type: 'agency', active: true },
  { department: 'lambayeque', province: 'chiclayo', district_name: 'Lagunas', delivery_type: 'agency', active: true },
  { department: 'lambayeque', province: 'chiclayo', district_name: 'Monsefu', delivery_type: 'agency', active: true },
  { department: 'lambayeque', province: 'chiclayo', district_name: 'Nueva Arica', delivery_type: 'agency', active: true },
  { department: 'lambayeque', province: 'chiclayo', district_name: 'Oyotún', delivery_type: 'agency', active: true },
  { department: 'lambayeque', province: 'chiclayo', district_name: 'Patapo', delivery_type: 'agency', active: true },
  { department: 'lambayeque', province: 'chiclayo', district_name: 'Picsi', delivery_type: 'agency', active: true },
  { department: 'lambayeque', province: 'chiclayo', district_name: 'Pimentel', delivery_type: 'agency', active: true },
  { department: 'lambayeque', province: 'chiclayo', district_name: 'Reque', delivery_type: 'agency', active: true },
  { department: 'lambayeque', province: 'chiclayo', district_name: 'Santa Rosa', delivery_type: 'agency', active: true },
  { department: 'lambayeque', province: 'chiclayo', district_name: 'Saña', delivery_type: 'agency', active: true },
  { department: 'lambayeque', province: 'chiclayo', district_name: 'Tumán', delivery_type: 'agency', active: true },

  // CAJAMARCA
  { department: 'cajamarca', province: 'cajamarca', district_name: 'Cajamarca', delivery_type: 'agency', active: true },
  { department: 'cajamarca', province: 'cajamarca', district_name: 'Asunción', delivery_type: 'agency', active: true },
  { department: 'cajamarca', province: 'cajamarca', district_name: 'Chetilla', delivery_type: 'agency', active: true },
  { department: 'cajamarca', province: 'cajamarca', district_name: 'Cospan', delivery_type: 'agency', active: true },
  { department: 'cajamarca', province: 'cajamarca', district_name: 'Encañada', delivery_type: 'agency', active: true },
  { department: 'cajamarca', province: 'cajamarca', district_name: 'Jesús', delivery_type: 'agency', active: true },
  { department: 'cajamarca', province: 'cajamarca', district_name: 'Llacanora', delivery_type: 'agency', active: true },
  { department: 'cajamarca', province: 'cajamarca', district_name: 'Los Baños del Inca', delivery_type: 'agency', active: true },
  { department: 'cajamarca', province: 'cajamarca', district_name: 'Magdalena', delivery_type: 'agency', active: true },
  { department: 'cajamarca', province: 'cajamarca', district_name: 'Matara', delivery_type: 'agency', active: true },
  { department: 'cajamarca', province: 'cajamarca', district_name: 'Namora', delivery_type: 'agency', active: true },
  { department: 'cajamarca', province: 'cajamarca', district_name: 'San Juan', delivery_type: 'agency', active: true },

  // JUNÍN
  { department: 'junin', province: 'huancayo', district_name: 'Huancayo', delivery_type: 'agency', active: true },
  { department: 'junin', province: 'huancayo', district_name: 'Chilca', delivery_type: 'agency', active: true },
  { department: 'junin', province: 'huancayo', district_name: 'Chongos Alto', delivery_type: 'agency', active: true },
  { department: 'junin', province: 'huancayo', district_name: 'Chupaca', delivery_type: 'agency', active: true },
  { department: 'junin', province: 'huancayo', district_name: 'Colca', delivery_type: 'agency', active: true },
  { department: 'junin', province: 'huancayo', district_name: 'Cullhuas', delivery_type: 'agency', active: true },
  { department: 'junin', province: 'huancayo', district_name: 'El Tambo', delivery_type: 'agency', active: true },
  { department: 'junin', province: 'huancayo', district_name: 'Huacrapuquio', delivery_type: 'agency', active: true },
  { department: 'junin', province: 'huancayo', district_name: 'Hualhuas', delivery_type: 'agency', active: true },
  { department: 'junin', province: 'huancayo', district_name: 'Huancan', delivery_type: 'agency', active: true },
  { department: 'junin', province: 'huancayo', district_name: 'Huasicancha', delivery_type: 'agency', active: true },
  { department: 'junin', province: 'huancayo', district_name: 'Huayucachi', delivery_type: 'agency', active: true },
  { department: 'junin', province: 'huancayo', district_name: 'Ingenio', delivery_type: 'agency', active: true },
  { department: 'junin', province: 'huancayo', district_name: 'Pariahuanca', delivery_type: 'agency', active: true },
  { department: 'junin', province: 'huancayo', district_name: 'Pilcomayo', delivery_type: 'agency', active: true },
  { department: 'junin', province: 'huancayo', district_name: 'Pucará', delivery_type: 'agency', active: true },
  { department: 'junin', province: 'huancayo', district_name: 'Quichuay', delivery_type: 'agency', active: true },
  { department: 'junin', province: 'huancayo', district_name: 'Quilcas', delivery_type: 'agency', active: true },
  { department: 'junin', province: 'huancayo', district_name: 'San Agustín', delivery_type: 'agency', active: true },
  { department: 'junin', province: 'huancayo', district_name: 'San Jerónimo de Tunán', delivery_type: 'agency', active: true },
  { department: 'junin', province: 'huancayo', district_name: 'Saño', delivery_type: 'agency', active: true },
  { department: 'junin', province: 'huancayo', district_name: 'Sapallanga', delivery_type: 'agency', active: true },
  { department: 'junin', province: 'huancayo', district_name: 'Sicaya', delivery_type: 'agency', active: true },
  { department: 'junin', province: 'huancayo', district_name: 'Santo Domingo de Acobamba', delivery_type: 'agency', active: true },
  { department: 'junin', province: 'huancayo', district_name: 'Viques', delivery_type: 'agency', active: true },

  // ANCASH
  { department: 'ancash', province: 'huanuco', district_name: 'Huaraz', delivery_type: 'agency', active: true },
  { department: 'ancash', province: 'huanuco', district_name: 'Cajacay', delivery_type: 'agency', active: true },
  { department: 'ancash', province: 'huanuco', district_name: 'Carhuaz', delivery_type: 'agency', active: true },
  { department: 'ancash', province: 'huanuco', district_name: 'Carlos Fermín Fitzcarrald', delivery_type: 'agency', active: true },
  { department: 'ancash', province: 'huanuco', district_name: 'Casma', delivery_type: 'agency', active: true },
  { department: 'ancash', province: 'huanuco', district_name: 'Chimbote', delivery_type: 'agency', active: true },
  { department: 'ancash', province: 'huanuco', district_name: 'Coishco', delivery_type: 'agency', active: true },
  { department: 'ancash', province: 'huanuco', district_name: 'Huaraz', delivery_type: 'agency', active: true },
  { department: 'ancash', province: 'huanuco', district_name: 'Independencia', delivery_type: 'agency', active: true },
  { department: 'ancash', province: 'huanuco', district_name: 'Nuevo Chimbote', delivery_type: 'agency', active: true },
  { department: 'ancash', province: 'huanuco', district_name: 'Santa', delivery_type: 'agency', active: true },
  { department: 'ancash', province: 'huanuco', district_name: 'Yungay', delivery_type: 'agency', active: true },

  // HUÁNUCO
  { department: 'huanuco', province: 'huanuco', district_name: 'Huánuco', delivery_type: 'agency', active: true },
  { department: 'huanuco', province: 'huanuco', district_name: 'Amarilis', delivery_type: 'agency', active: true },
  { department: 'huanuco', province: 'huanuco', district_name: 'Chinchao', delivery_type: 'agency', active: true },
  { department: 'huanuco', province: 'huanuco', district_name: 'Churubamba', delivery_type: 'agency', active: true },
  { department: 'huanuco', province: 'huanuco', district_name: 'Margos', delivery_type: 'agency', active: true },
  { department: 'huanuco', province: 'huanuco', district_name: 'Quisqui', delivery_type: 'agency', active: true },
  { department: 'huanuco', province: 'huanuco', district_name: 'San Francisco de Cayran', delivery_type: 'agency', active: true },
  { department: 'huanuco', province: 'huanuco', district_name: 'San Pedro de Chaulán', delivery_type: 'agency', active: true },
  { department: 'huanuco', province: 'huanuco', district_name: 'Santa María del Valle', delivery_type: 'agency', active: true },
  { department: 'huanuco', province: 'huanuco', district_name: 'Yarumayo', delivery_type: 'agency', active: true },

  // ICA
  { department: 'ica', province: 'ica', district_name: 'Ica', delivery_type: 'agency', active: true },
  { department: 'ica', province: 'ica', district_name: 'La Tinguiña', delivery_type: 'agency', active: true },
  { department: 'ica', province: 'ica', district_name: 'Los Aquijes', delivery_type: 'agency', active: true },
  { department: 'ica', province: 'ica', district_name: 'Ocucaje', delivery_type: 'agency', active: true },
  { department: 'ica', province: 'ica', district_name: 'Pachacutec', delivery_type: 'agency', active: true },
  { department: 'ica', province: 'ica', district_name: 'Parcona', delivery_type: 'agency', active: true },
  { department: 'ica', province: 'ica', district_name: 'Pueblo Nuevo', delivery_type: 'agency', active: true },
  { department: 'ica', province: 'ica', district_name: 'Salas', delivery_type: 'agency', active: true },
  { department: 'ica', province: 'ica', district_name: 'San José de Los Molinos', delivery_type: 'agency', active: true },
  { department: 'ica', province: 'ica', district_name: 'San Juan Bautista', delivery_type: 'agency', active: true },
  { department: 'ica', province: 'ica', district_name: 'Santiago', delivery_type: 'agency', active: true },
  { department: 'ica', province: 'ica', district_name: 'Subtanjalla', delivery_type: 'agency', active: true },
  { department: 'ica', province: 'ica', district_name: 'Tate', delivery_type: 'agency', active: true },
  { department: 'ica', province: 'ica', district_name: 'Yauca del Rosario', delivery_type: 'agency', active: true },

  // TACNA
  { department: 'tacna', province: 'tacna', district_name: 'Tacna', delivery_type: 'agency', active: true },
  { department: 'tacna', province: 'tacna', district_name: 'Alto de la Alianza', delivery_type: 'agency', active: true },
  { department: 'tacna', province: 'tacna', district_name: 'Calana', delivery_type: 'agency', active: true },
  { department: 'tacna', province: 'tacna', district_name: 'Ciudad Nueva', delivery_type: 'agency', active: true },
  { department: 'tacna', province: 'tacna', district_name: 'Inclan', delivery_type: 'agency', active: true },
  { department: 'tacna', province: 'tacna', district_name: 'Pachía', delivery_type: 'agency', active: true },
  { department: 'tacna', province: 'tacna', district_name: 'Palca', delivery_type: 'agency', active: true },
  { department: 'tacna', province: 'tacna', district_name: 'Pocollay', delivery_type: 'agency', active: true },
  { department: 'tacna', province: 'tacna', district_name: 'Sama', delivery_type: 'agency', active: true },
  { department: 'tacna', province: 'tacna', district_name: 'Coronel Gregorio Albarracín Lanchipa', delivery_type: 'agency', active: true },

  // MOQUEGUA
  { department: 'moquegua', province: 'moquegua', district_name: 'Moquegua', delivery_type: 'agency', active: true },
  { department: 'moquegua', province: 'moquegua', district_name: 'Carumas', delivery_type: 'agency', active: true },
  { department: 'moquegua', province: 'moquegua', district_name: 'Cuchumbaya', delivery_type: 'agency', active: true },
  { department: 'moquegua', province: 'moquegua', district_name: 'Samegua', delivery_type: 'agency', active: true },
  { department: 'moquegua', province: 'moquegua', district_name: 'San Cristóbal', delivery_type: 'agency', active: true },
  { department: 'moquegua', province: 'moquegua', district_name: 'Torata', delivery_type: 'agency', active: true },

  // PUNO
  { department: 'puno', province: 'puno', district_name: 'Puno', delivery_type: 'agency', active: true },
  { department: 'puno', province: 'puno', district_name: 'Acora', delivery_type: 'agency', active: true },
  { department: 'puno', province: 'puno', district_name: 'Amantani', delivery_type: 'agency', active: true },
  { department: 'puno', province: 'puno', district_name: 'Atuncolla', delivery_type: 'agency', active: true },
  { department: 'puno', province: 'puno', district_name: 'Capachica', delivery_type: 'agency', active: true },
  { department: 'puno', province: 'puno', district_name: 'Chucuito', delivery_type: 'agency', active: true },
  { department: 'puno', province: 'puno', district_name: 'Coata', delivery_type: 'agency', active: true },
  { department: 'puno', province: 'puno', district_name: 'Huata', delivery_type: 'agency', active: true },
  { department: 'puno', province: 'puno', district_name: 'Mañazo', delivery_type: 'agency', active: true },
  { department: 'puno', province: 'puno', district_name: 'Paucarcolla', delivery_type: 'agency', active: true },
  { department: 'puno', province: 'puno', district_name: 'Pichacani', delivery_type: 'agency', active: true },
  { department: 'puno', province: 'puno', district_name: 'Platería', delivery_type: 'agency', active: true },
  { department: 'puno', province: 'puno', district_name: 'San Antonio', delivery_type: 'agency', active: true },
  { department: 'puno', province: 'puno', district_name: 'Tiquillaca', delivery_type: 'agency', active: true },
  { department: 'puno', province: 'puno', district_name: 'Vilque', delivery_type: 'agency', active: true },

  // AYACUCHO
  { department: 'ayacucho', province: 'huamanga', district_name: 'Ayacucho', delivery_type: 'agency', active: true },
  { department: 'ayacucho', province: 'huamanga', district_name: 'Acos Vinchos', delivery_type: 'agency', active: true },
  { department: 'ayacucho', province: 'huamanga', district_name: 'Carmen Alto', delivery_type: 'agency', active: true },
  { department: 'ayacucho', province: 'huamanga', district_name: 'Chiara', delivery_type: 'agency', active: true },
  { department: 'ayacucho', province: 'huamanga', district_name: 'Ocros', delivery_type: 'agency', active: true },
  { department: 'ayacucho', province: 'huamanga', district_name: 'Pacaycasa', delivery_type: 'agency', active: true },
  { department: 'ayacucho', province: 'huamanga', district_name: 'Quinua', delivery_type: 'agency', active: true },
  { department: 'ayacucho', province: 'huamanga', district_name: 'San José de Ticllas', delivery_type: 'agency', active: true },
  { department: 'ayacucho', province: 'huamanga', district_name: 'San Juan Bautista', delivery_type: 'agency', active: true },
  { department: 'ayacucho', province: 'huamanga', district_name: 'Santiago de Pischa', delivery_type: 'agency', active: true },
  { department: 'ayacucho', province: 'huamanga', district_name: 'Socos', delivery_type: 'agency', active: true },
  { department: 'ayacucho', province: 'huamanga', district_name: 'Tambillo', delivery_type: 'agency', active: true },
  { department: 'ayacucho', province: 'huamanga', district_name: 'Vinchos', delivery_type: 'agency', active: true },

  // APURÍMAC
  { department: 'apurimac', province: 'abancay', district_name: 'Abancay', delivery_type: 'agency', active: true },
  { department: 'apurimac', province: 'abancay', district_name: 'Chacoche', delivery_type: 'agency', active: true },
  { department: 'apurimac', province: 'abancay', district_name: 'Circa', delivery_type: 'agency', active: true },
  { department: 'apurimac', province: 'abancay', district_name: 'Curahuasi', delivery_type: 'agency', active: true },
  { department: 'apurimac', province: 'abancay', district_name: 'Huanipaca', delivery_type: 'agency', active: true },
  { department: 'apurimac', province: 'abancay', district_name: 'Lambrama', delivery_type: 'agency', active: true },
  { department: 'apurimac', province: 'abancay', district_name: 'Pichirhua', delivery_type: 'agency', active: true },
  { department: 'apurimac', province: 'abancay', district_name: 'San Pedro de Cachora', delivery_type: 'agency', active: true },
  { department: 'apurimac', province: 'abancay', district_name: 'Tamburco', delivery_type: 'agency', active: true },

  // MADRE DE DIOS
  { department: 'madre de dios', province: 'tambopata', district_name: 'Tambopata', delivery_type: 'agency', active: true },
  { department: 'madre de dios', province: 'tambopata', district_name: 'Inambari', delivery_type: 'agency', active: true },
  { department: 'madre de dios', province: 'tambopata', district_name: 'Las Piedras', delivery_type: 'agency', active: true },
  { department: 'madre de dios', province: 'tambopata', district_name: 'Laberinto', delivery_type: 'agency', active: true },

  // UCAYALI
  { department: 'ucayali', province: 'coronel portillo', district_name: 'Callería', delivery_type: 'agency', active: true },
  { department: 'ucayali', province: 'coronel portillo', district_name: 'Campoverde', delivery_type: 'agency', active: true },
  { department: 'ucayali', province: 'coronel portillo', district_name: 'Iparía', delivery_type: 'agency', active: true },
  { department: 'ucayali', province: 'coronel portillo', district_name: 'Manantay', delivery_type: 'agency', active: true },
  { department: 'ucayali', province: 'coronel portillo', district_name: 'Nueva Requena', delivery_type: 'agency', active: true },
  { department: 'ucayali', province: 'coronel portillo', district_name: 'Yarinacocha', delivery_type: 'agency', active: true },

  // LORETO
  { department: 'loreto', province: 'maynas', district_name: 'Iquitos', delivery_type: 'agency', active: true },
  { department: 'loreto', province: 'maynas', district_name: 'Alto Nanay', delivery_type: 'agency', active: true },
  { department: 'loreto', province: 'maynas', district_name: 'Fernando Lores', delivery_type: 'agency', active: true },
  { department: 'loreto', province: 'maynas', district_name: 'Indiana', delivery_type: 'agency', active: true },
  { department: 'loreto', province: 'maynas', district_name: 'Las Amazonas', delivery_type: 'agency', active: true },
  { department: 'loreto', province: 'maynas', district_name: 'Mazan', delivery_type: 'agency', active: true },
  { department: 'loreto', province: 'maynas', district_name: 'Napo', delivery_type: 'agency', active: true },
  { department: 'loreto', province: 'maynas', district_name: 'Punchana', delivery_type: 'agency', active: true },
  { department: 'loreto', province: 'maynas', district_name: 'Torres Causana', delivery_type: 'agency', active: true },

  // SAN MARTÍN
  { department: 'san martin', province: 'moyobamba', district_name: 'Moyobamba', delivery_type: 'agency', active: true },
  { department: 'san martin', province: 'moyobamba', district_name: 'Calzada', delivery_type: 'agency', active: true },
  { department: 'san martin', province: 'moyobamba', district_name: 'Habana', delivery_type: 'agency', active: true },
  { department: 'san martin', province: 'moyobamba', district_name: 'Jepelacio', delivery_type: 'agency', active: true },
  { department: 'san martin', province: 'moyobamba', district_name: 'Soritor', delivery_type: 'agency', active: true },
  { department: 'san martin', province: 'moyobamba', district_name: 'Yantalo', delivery_type: 'agency', active: true },

  // TUMBES
  { department: 'tumbes', province: 'tumbes', district_name: 'Tumbes', delivery_type: 'agency', active: true },
  { department: 'tumbes', province: 'tumbes', district_name: 'Corrales', delivery_type: 'agency', active: true },
  { department: 'tumbes', province: 'tumbes', district_name: 'La Cruz', delivery_type: 'agency', active: true },
  { department: 'tumbes', province: 'tumbes', district_name: 'Pampas de Hospital', delivery_type: 'agency', active: true },
  { department: 'tumbes', province: 'tumbes', district_name: 'San Jacinto', delivery_type: 'agency', active: true },
  { department: 'tumbes', province: 'tumbes', district_name: 'San Juan de la Virgen', delivery_type: 'agency', active: true },
  { department: 'tumbes', province: 'tumbes', district_name: 'Zorritos', delivery_type: 'agency', active: true },

  // PASCO
  { department: 'pasco', province: 'cerro de pasco', district_name: 'Cerro de Pasco', delivery_type: 'agency', active: true },
  { department: 'pasco', province: 'cerro de pasco', district_name: 'Chaupimarca', delivery_type: 'agency', active: true },
  { department: 'pasco', province: 'cerro de pasco', district_name: 'Huachón', delivery_type: 'agency', active: true },
  { department: 'pasco', province: 'cerro de pasco', district_name: 'Huariaca', delivery_type: 'agency', active: true },
  { department: 'pasco', province: 'cerro de pasco', district_name: 'Huayllay', delivery_type: 'agency', active: true },
  { department: 'pasco', province: 'cerro de pasco', district_name: 'Ninacaca', delivery_type: 'agency', active: true },
  { department: 'pasco', province: 'cerro de pasco', district_name: 'Pallanchacra', delivery_type: 'agency', active: true },
  { department: 'pasco', province: 'cerro de pasco', district_name: 'Paucartambo', delivery_type: 'agency', active: true },
  { department: 'pasco', province: 'cerro de pasco', district_name: 'San Francisco de Asís de Yarusyacán', delivery_type: 'agency', active: true },
  { department: 'pasco', province: 'cerro de pasco', district_name: 'Simon Bolívar', delivery_type: 'agency', active: true },
  { department: 'pasco', province: 'cerro de pasco', district_name: 'Ticlacayán', delivery_type: 'agency', active: true },
  { department: 'pasco', province: 'cerro de pasco', district_name: 'Tinyahuarco', delivery_type: 'agency', active: true },
  { department: 'pasco', province: 'cerro de pasco', district_name: 'Vicco', delivery_type: 'agency', active: true },
  { department: 'pasco', province: 'cerro de pasco', district_name: 'Yanacancha', delivery_type: 'agency', active: true }
];

async function insertPeruDistricts() {
  const client = new MongoClient(URL, { useUnifiedTopology: true });
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db(name);
    const collection = db.collection('delivery_districts');
    
    // Limpiar datos existentes (opcional)
    // await collection.deleteMany({});
    // console.log('🗑️ Datos existentes eliminados');
    
    // Agregar timestamps y zone_id por defecto
    const districtsWithMetadata = peruDistricts.map(district => ({
      ...district,
      zone_id: null, // Se asignará manualmente desde el admin
      created_at: new Date(),
      updated_at: new Date()
    }));
    
    // Insertar distritos
    const result = await collection.insertMany(districtsWithMetadata);
    console.log(`✅ ${result.insertedCount} distritos insertados exitosamente`);
    
    // Mostrar estadísticas
    const stats = await collection.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    console.log('\n📊 Distritos por departamento:');
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} distritos`);
    });
    
  } catch (error) {
    console.error('❌ Error insertando distritos:', error);
  } finally {
    await client.close();
    console.log('🔌 Conexión cerrada');
  }
}

// Ejecutar el script
insertPeruDistricts(); 