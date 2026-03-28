# Documentación Técnica Avanzada: Sifrah DB (The Business Engine)

<div style="background: linear-gradient(135deg, #4b5563 0%, #1f2937 100%); padding: 60px 40px; border-radius: 20px; color: white; text-align: center; margin-bottom: 50px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <h1 style="font-size: 3.5em; margin: 0; letter-spacing: 2px;">SIFRAH DB</h1>
  <h2 style="font-size: 1.5em; font-weight: 300; margin-top: 10px; opacity: 0.9;">NÚCLEO DE REGLAS Y GESTIÓN DE DATOS</h2>
  <div style="width: 100px; height: 4px; background: #fbbf24; margin: 30px auto;"></div>
  <p style="font-size: 1.2em;">Especificaciones del Motor MLM y Arquitectura de Datos</p>
  <p style="margin-top: 20px; font-size: 0.9em; opacity: 0.7;">Versión 1.0 | Marzo 2026</p>
</div>

## 1. Arquitectura de Datos (Data Architecture)

El repositorio `Sifrah_db` actúa como la capa de persistencia y el motor de procesamiento batch del ecosistema. Utiliza **MongoDB** como base de datos NoSQL, gestionada mediante un wrapper nativo (`db.js`) que optimiza las conexiones concurrentes.

### 1.1 Modelo de Datos (Colecciones Críticas)
*   **Users**: Perfiles de usuario, credenciales, balance virtual y estado de afiliación.
*   **Tree**: Estructura de red con punteros a hijos directos (`childs`) y jerarquías.
*   **Transactions**: Registro de auditoría para cada movimiento de E-Wallet.
*   **Plans**: Definición de paquetes de inicio (Básico, Pionero, Empresario, Profesional).
*   **Closeds**: Historial de cierres de periodo y comisiones consolidadas.

---

## 2. Motor de Cálculo de Rangos

La lógica reside en `rank-calculation.js` y sigue un algoritmo de evaluación ascendente basado en cuatro pilares:

### 2.1 Requisitos por Rango (Tabla de Rango)
| Rango | Puntos Totales | Líneas Activas | V.M.P (Tope Pierna) | Reconsumo Requerido |
| :--- | :---: | :---: | :---: | :---: |
| **BRONCE** | 500 | 2 | 300 | 160 |
| **ORO** | 3,500 | 3 | 1,350 | 160 |
| **DIAMANTE** | 45,000 | 4 | 12,000 | 160 |
| **EMBAJADOR** | 600,000 | 6 | 100,000 | 160 |

### 2.2 Algoritmo V.M.P (Volumen Máximo por Pierna)
Para evitar que un solo líder "suba" a todo su linaje sin esfuerzo propio, el sistema trunca el volumen de cada pierna directa al valor del V.M.P del rango objetivo. La suma de estas piernas truncadas, más los puntos personales (sumados a la pierna menor), determina la calificación final.

---

## 3. Sistema de Bonos Residuales (Residual Bonus)

Implementado en `residual-bonus-calculation.js`, este motor utiliza **Compresión Dinámica**.

### 3.1 Compresión Dinámica (Auto-Compression)
Si un usuario en la red no realiza su reconsumo (PR=0), el sistema lo omite en el conteo de niveles, permitiendo que sus descendientes activos "suban" una posición para el cálculo del bono, garantizando que el patrocinador siempre cobre el máximo beneficio sobre usuarios activos.

### 3.2 Regla del Tope (160 Points Cap)
*   **Rango 0 - 160 PR**: Se liquida el 100% del porcentaje asignado al nivel.
*   **Exceso > 160 PR**: Los puntos excedentes se liquidan al **60%** del porcentaje original, protegiendo la sostenibilidad financiera del plan de compensación.

---

## 4. Logística y Datos Maestros

El sistema centraliza la base de datos de envíos para Perú, incluyendo:
*   **Geolocalización**: Cobertura completa de distritos y zonas de entrega.
*   **Agencias de Despacho**: Catálogo de puntos de recojo y logística propia.
*   **Semillas de Producto**: Inicialización de SKUs, precios de socio y puntos de volumen.

---

## 5. Guía de Administración Técnica (Scripts)

El repositorio incluye herramientas para operaciones críticas de base de datos:

```javascript
// Ejecución de cálculo de rangos
node rank-calculation.js --prod

// Reseteo de sesiones activas (Mantenimiento)
node sessions-reset.js

// Inicialización de puntos de periodo
node init-points.js
```

### 5.1 Monitoreo y Auditoría
El sistema genera logs automáticos de red y cálculo de rangos (`network_logs_YYYY-MM-DD.txt`), permitiendo reconstruir la genealogía en cualquier punto del tiempo para resolver discrepancias en comisiones.

---

<footer style="margin-top: 100px; text-align: center; color: #4b5563; border-top: 1px solid #e5e7eb; padding-top: 30px;">
  <p><b>SIFRAH DB - Motor de Inteligencia de Negocio</b></p>
  <p>© 2026 Reservados todos los derechos. Propiedad intelectual de Sifrah.</p>
</footer>
