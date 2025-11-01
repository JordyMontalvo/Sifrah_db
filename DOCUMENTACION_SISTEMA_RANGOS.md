# 📊 Sistema de Rangos MLM - Sifrah

## 🎯 Descripción General

El sistema de rangos MLM de Sifrah ha sido completamente actualizado con una nueva estructura de 11 niveles, implementando validaciones de reconsumo, líneas activas, y límites de puntos por línea (PML/PML-R).

## 📋 Tabla de Rangos

| NIVEL | RANGO | PUNTOS TOTALES | LÍNEAS ACTIVAS | PML | PML-R | RECONSUMO |
|-------|-------|---------------|----------------|-----|-------|-----------|
| 0 | ACTIVO | 1 | 0 | 0 | 0 | 120 |
| 1 | BRONCE | 600 | 2 | 360 | 300 | 120 |
| 2 | PLATA | 1,500 | 3 | 675 | 500 | 160 |
| 3 | ORO | 3,300 | 3 | 1,320 | 1,100 | 160 |
| 4 | RUBÍ | 8,000 | 4 | 2,400 | 2,000 | 160 |
| 5 | ESMERALDA | 18,000 | 4 | 5,400 | 4,500 | 160 |
| 6 | DIAMANTE | 38,000 | 4 | 10,260 | 9,500 | 160 |
| 7 | DOBLE DIAMANTE | 80,000 | 5 | 19,200 | 16,000 | 160 |
| 8 | TRIPLE DIAMANTE | 125,000 | 5 | 27,500 | 25,000 | 160 |
| 9 | DIAMANTE IMPERIAL | 225,000 | 6 | 45,000 | 37,500 | 160 |
| 10 | EMBAJADOR SIFRAH | 400,000 | 6 | 80,000 | 66,666.7 | 160 |

## 🔧 Componentes del Sistema

### 1. Validaciones Requeridas

#### ✅ Reconsumo Activo
- **ACTIVO/BRONCE**: Mínimo 120 puntos personales
- **Rangos superiores**: Mínimo 160 puntos personales
- Si no cumple reconsumo → No califica rango

#### ✅ Líneas Activas
- Número mínimo de líneas directas que cumplen reconsumo
- Cada línea debe tener el reconsumo mínimo según el rango objetivo
- Si no cumple líneas activas → No califica rango

#### ✅ Puntos Válidos (PML/PML-R)
- **PML**: Límite en la línea más grande
- **PML-R**: Límite en la suma de líneas restantes
- **Puntos personales**: Se suman a la línea más pequeña

### 2. Lógica de Cálculo

```javascript
// 1. Verificar reconsumo del usuario
if (user.reconsumo < reconsumo_required) return 'ACTIVO'

// 2. Verificar líneas activas
if (activeLines < minimum_frontals) return 'ACTIVO'

// 3. Calcular puntos válidos
let validPoints = 0

// Línea mayor (limitada por PML)
validPoints += Math.min(largestLine, maximum_large_leg)

// Líneas restantes (limitadas por PML-R)
validPoints += Math.min(remainingLines, maximum_others_leg)

// Puntos personales (siempre se suman)
validPoints += user.points

// 4. Verificar si cumple requisitos
if (validPoints >= threshold_points) return rank
```

## 💰 Sistema de Pagos

| RANGO | VALOR DEL BONO |
|-------|------------------|
| BRONCE | $60 |
| PLATA | $300 |
| ORO | $600 |
| RUBÍ | $1,200 |
| ESMERALDA | $2,500 |
| DIAMANTE | $5,000 |
| DOBLE DIAMANTE | $10,000 |
| TRIPLE DIAMANTE | $20,000 |
| DIAMANTE IMPERIAL | $40,000 |
| EMBAJADOR SIFRAH | $80,000 |

## 🚀 Funciones Implementadas

### `checkReconsumo(node, reconsumo_required)`
Verifica si el usuario cumple con el reconsumo mínimo requerido.

### `getActiveLines(node, reconsumo_required)`
Cuenta el número de líneas directas que cumplen reconsumo.

### `calc_rank(node)`
Calcula el rango del usuario aplicando todas las validaciones:
- Reconsumo personal
- Líneas activas
- Puntos válidos con PML/PML-R

## 📊 Logs del Sistema

El sistema genera logs detallados que incluyen:
- Puntos totales del usuario
- Reconsumo personal
- Rango asignado
- Número de líneas activas
- Bonos residuales
- Bonos por excedente
- Bonos por alcance de rango

## 🔄 Flujo de Ejecución

1. **Carga de datos**: Usuarios y árbol de la red
2. **Enriquecimiento**: Agregar campos necesarios
3. **Cálculo de puntos**: Totales por usuario
4. **Asignación de rangos**: Aplicar nueva lógica
5. **Cálculo de bonos**: Residuales, excedente, alcance
6. **Generación de logs**: Información detallada
7. **Actualización BD**: Guardar resultados

## ⚙️ Configuración Técnica

### Archivos Modificados
- `db/closed.js`: Sistema principal de cálculo
- Nuevas funciones de validación
- Estructura de rangos actualizada
- Sistema de logs mejorado

### Campos de Base de Datos
- `points`: Puntos personales (usado como reconsumo)
- `reconsumo`: Campo agregado para validación
- `rank`: Rango asignado al usuario
- `pays`: Estructura de pagos por rango

## 🧪 Pruebas Realizadas

### Caso de Prueba: Usuario BRONCE
```
- Puntos personales: 150 (✅ cumple reconsumo 120+)
- Líneas activas: 2 (✅ cumple mínimo 2)
- Puntos totales: 650 (✅ cumple mínimo 600)
- Cálculo PML/PML-R: 650 puntos válidos
- Resultado: ✅ Califica para BRONCE
```

## 📈 Beneficios del Nuevo Sistema

1. **Mayor precisión**: Validaciones estrictas de reconsumo
2. **Control de líneas**: Verificación de líneas activas
3. **Límites justos**: PML/PML-R evita concentración excesiva
4. **Transparencia**: Logs detallados para auditoría
5. **Escalabilidad**: 11 niveles de crecimiento
6. **Motivación**: Bonos progresivos por rango

## 🔧 Mantenimiento

### Para agregar nuevos rangos:
1. Actualizar array `ranks` con nuevos valores
2. Agregar entrada en array `pays`
3. Probar con datos de ejemplo
4. Verificar logs de ejecución

### Para modificar requisitos:
1. Actualizar valores en `ranks`
2. Ajustar funciones de validación
3. Probar casos límite
4. Documentar cambios

---

**Fecha de implementación**: 24 de Octubre, 2025  
**Versión**: 2.0  
**Estado**: ✅ Implementado y probado
