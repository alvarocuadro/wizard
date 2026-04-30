# REQUIREMENTS_ANALYSIS.md
## SKILL #1 — Wellio HRIS Wizard

---

## 1. RESUMEN EJECUTIVO

**App:** HRIS Wizard  
**Stack:** React 19 + Material-UI v5 + TypeScript (strict) + Vite  
**Estado:** Context API (session-only, sin localStorage)  
**Parsing de archivos:** SheetJS (`xlsx`) — igual que el prototipo  
**Propósito:** Wizard de 5 pasos para configuración inicial de HRIS. Produce un JSON estructurado de equipos, roles y miembros compatible con el Organigrama (AF_Org.md).

---

## 2. ESTRUCTURA DEL WIZARD (5 PASOS)

```
Paso 1: Miembros    → carga y mapeo de Excel/CSV, validación fila a fila
Paso 2: Roles       → detección y validación de roles desde el archivo
Paso 3: Equipos     → detección, jerarquía, validación de árbol
Paso 4: Puestos     → asociaciones miembro ↔ rol ↔ equipo
Paso 5: Líderes     → asignación de líder por equipo con liderazgo propio
```

---

## 3. PASO 1 — MIEMBROS

### 3.1 Funcionalidades

| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| P1-01 | Subida de archivo `.xlsx`, `.xls`, `.csv` | ALTA |
| P1-02 | Parsing con SheetJS (`cellDates: true`, `raw: true`) | ALTA |
| P1-03 | Detección de primera fila no vacía como encabezados | ALTA |
| P1-04 | Detección automática de columnas por alias (scoring) | ALTA |
| P1-05 | Grilla de mapeo de 20 campos (5 obligatorios, 15 opcionales) | ALTA |
| P1-06 | Filtro de columnas por texto en la grilla de mapeo | MEDIA |
| P1-07 | Botón "Redetectar" para resetear mapeo | MEDIA |
| P1-08 | Preview: chips por campo mapeado (primeras 8 filas) | ALTA |
| P1-09 | Preview: tabla con primeras 8 columnas y 8 filas | ALTA |
| P1-10 | Badge de progreso "X/20 campos asignados" | ALTA |
| P1-11 | Validación de todas las filas contra reglas de negocio | ALTA |
| P1-12 | Editor de filas con errores (corrección manual o marcar "omitir") | ALTA |
| P1-13 | Resumen de validación (total, válidas, con errores, omitidas) | ALTA |
| P1-14 | Descarga CSV de filas válidas | MEDIA |
| P1-15 | Descarga CSV de filas con errores | MEDIA |
| P1-16 | Exportación JSON del mapeo completo | BAJA |
| P1-17 | Mapeo especial para `workMode`: alias por valor ("Presencial"/"Híbrido"/"Remoto") | ALTA |

### 3.2 Campos definidos

#### Obligatorios
| key | label | tipo | maxLength | validación extra |
|-----|-------|------|-----------|-----------------|
| `firstName` | Nombre | text | 40 | sin emojis, sin espacios en blanco only |
| `lastName` | Apellido | text | 40 | sin emojis, sin espacios en blanco only |
| `employeeId` | Legajo | text | 15 | — |
| `hireDate` | Fecha de ingreso | date | — | formato DD/MM/AAAA |
| `workEmail` | Email laboral | email | — | regex `[^\s@]+@[^\s@]+\.[^\s@]+` |

#### Opcionales
| key | label | tipo | maxLength |
|-----|-------|------|-----------|
| `address` | Domicilio | text | 200 |
| `city` | Localidad / Ciudad | text | 60 |
| `state` | Provincia / Estado | text | 60 |
| `postalCode` | Código postal | text | 15 |
| `country` | País | text | 60 |
| `personalEmail` | Email personal | email | — |
| `documentNumber` | Número de documento | text | 30 |
| `taxId` | Identificador tributario | text | 60 |
| `birthDate` | Fecha de nacimiento | date | — |
| `nationality` | Nacionalidad | text | 60 |
| `gender` | Género | text | 25 |
| `location` | Ubicación | text | 100 |
| `workday` | Jornada laboral | text | 100 |
| `workSchedule` | Horario de trabajo | text | 100 |
| `workMode` | Modalidad de trabajo | enum | — | Presencial / Híbrido / Remoto |

### 3.3 Normalización automática de fechas

El sistema debe detectar y convertir estos formatos a `DD/MM/AAAA`:

| Formato origen | Ejemplo |
|---------------|---------|
| Excel serial | `46039` |
| `YYYY-MM-DD` | `2026-01-15` |
| `DD-MM-YYYY` | `15-01-2026` |
| `DD.MM.YYYY` | `15.01.2026` |
| `DD/MM/YY` | `15/01/26` |
| JS Date object | — |
| `Date.parse`-able | `January 15, 2026` |

### 3.4 Reglas de validación por tipo

| Tipo | Regla |
|------|-------|
| required | no vacío, no solo espacios |
| text (name) | sin emojis (`/\p{Emoji}/u`), sin solo espacios |
| maxLength | `value.length > maxLength` → error |
| email | regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` |
| date | debe quedar en `DD/MM/AAAA` y ser fecha válida |
| enum (workMode) | debe ser exactamente `Presencial`, `Híbrido` o `Remoto` |

### 3.5 Reglas UX/UI aplicables

- Badge de progreso actualizado en tiempo real al cambiar mapeos
- Loader (Skeleton) mientras se procesa el archivo
- Grilla de mapeo: badge por campo (OK verde / Requerido rojo / Opcional gris)
- Columna mapeada no puede asignarse a dos campos distintos (opción deshabilitada en otros selects)
- Chips de preview con datos reales de las primeras 8 filas
- Editor de filas con errores: contador de caracteres en campos con maxLength
- Botones "Descargar" con loader hasta completar

---

## 4. PASO 2 — ROLES

### 4.1 Funcionalidades

| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| P2-01 | Elegir fuente: mismo archivo del Paso 1 o archivo diferente | ALTA |
| P2-02 | Si archivo diferente: subida y parsing igual que Paso 1 | ALTA |
| P2-03 | Selección de columna de roles (con detección automática) | ALTA |
| P2-04 | Badge de estado del mapeo (Mapeado / Requerido) | ALTA |
| P2-05 | Listado de roles únicos detectados, ordenados alfabéticamente | ALTA |
| P2-06 | Por rol: edición de nombre (max 40 chars) | ALTA |
| P2-07 | Por rol: checkbox "Tiene gente a cargo" | ALTA |
| P2-08 | Validación en tiempo real al cambiar nombre | ALTA |
| P2-09 | Resumen de validación (total, con errores, válidos) | ALTA |

### 4.2 Detección automática de columna

Alias: `rol`, `role`, `puesto`, `cargo`, `funcion`, `función`, `job title`, `position`

Scoring:
- Coincidencia exacta (normalizada): +120
- Contiene alias: +80

### 4.3 Reglas de negocio

- Nombre de rol: obligatorio, máximo 40 caracteres
- Los roles se deduplicarán por valor normalizado (sin acentos, lowercase)
- Se preservan los datos editados si el usuario cambia de columna

### 4.4 Reglas UX/UI aplicables

- Items de la lista ordenados alfabéticamente
- Contador de caracteres visible: "X/40 caracteres"
- Error inline al superar 40 chars
- Skeleton loader mientras se procesa
- Estado vacío si no hay columna seleccionada

---

## 5. PASO 3 — EQUIPOS

### 5.1 Funcionalidades

| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| P3-01 | Elegir fuente: mismo archivo o diferente | ALTA |
| P3-02 | Si diferente: subida y parsing | ALTA |
| P3-03 | Selección de columna de equipos (con detección automática) | ALTA |
| P3-04 | Listado de equipos únicos ordenados alfabéticamente | ALTA |
| P3-05 | Por equipo: edición de nombre (max 40 chars) | ALTA |
| P3-06 | Por equipo: radio "Equipo principal" (exactamente 1) | ALTA |
| P3-07 | Por equipo: select "Modo de liderazgo" (Propio / Hereda) | ALTA |
| P3-08 | Por equipo (no principal): checkboxes de equipos padre (multi-select) | ALTA |
| P3-09 | Validación de loop jerárquico (DFS) | ALTA |
| P3-10 | Validación: exactamente 1 equipo principal | ALTA |
| P3-11 | Preview de árbol jerárquico en texto | ALTA |
| P3-12 | Resumen de validación | ALTA |

### 5.2 Detección automática de columna

Alias: `equipo`, `team`, `area`, `área`, `sector`, `departamento`, `department`

### 5.3 Reglas de negocio

| Regla | Detalle |
|-------|---------|
| Nombre | Obligatorio, máx 40 chars |
| Equipo principal | Exactamente 1 marcado como principal |
| Equipo principal | No tiene equipo padre (se ignoran padres si es principal) |
| Padres | Un equipo puede tener múltiples equipos padre |
| Sin loops | Detección de ciclos con DFS antes de guardar |
| Sin auto-referencia | Un equipo no puede ser padre de sí mismo |
| Liderazgo | `own` (líder propio) o `inherit` (hereda del/los superior/es) |

### 5.4 Preview de árbol

Representación ASCII del árbol jerárquico, actualizado en tiempo real:
```
CompanyRoot
  - Operaciones
    - Proyecto Alpha
    - Proyecto Beta
  - RRHH
```

### 5.5 Reglas UX/UI aplicables

- Equipos ordenados alfabéticamente en el listado y en los checkboxes de padres
- Contador de caracteres "X/40"
- Validación en tiempo real al editar nombre o cambiar jerarquía
- Error visual si hay loop o múltiples principales
- Preview de árbol actualizado on-change
- Los padres del equipo principal no se muestran (no aplica)

---

## 6. PASO 4 — PUESTOS (ASOCIACIONES)

### 6.1 Funcionalidades

| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| P4-01 | Elegir fuente: mismo archivo o diferente | ALTA |
| P4-02 | Mapeo de 3 columnas: Miembro, Rol, Equipo | ALTA |
| P4-03 | Detección automática de las 3 columnas | ALTA |
| P4-04 | Badges de estado por columna (Mapeado / Opcional) | ALTA |
| P4-05 | Listado de asociaciones construidas | ALTA |
| P4-06 | Por asociación: campo Miembro (text + datalist de Paso 1) | ALTA |
| P4-07 | Por asociación: select Rol (del catálogo del Paso 2) | ALTA |
| P4-08 | Por asociación: select Equipo (del catálogo del Paso 3) | ALTA |
| P4-09 | Si mismo archivo: reconstruir Nombre Apellido completo desde columnas Paso 1 | ALTA |
| P4-10 | Validación cruzada: rol debe existir en catálogo Paso 2 | ALTA |
| P4-11 | Validación cruzada: equipo debe existir en catálogo Paso 3 | ALTA |
| P4-12 | Resumen de validación | ALTA |

### 6.2 Lógica de reconstrucción de nombre (mismo archivo)

Si la fuente es el mismo archivo:
1. Si columna `member` mapeada = columna `firstName` del Paso 1 → completar con `firstName + " " + lastName`
2. Si columna `member` mapeada = columna `lastName` del Paso 1 → completar con `firstName + " " + lastName`
3. Por posición de fila: buscar nombre completo en Paso 1 (fila N → mismo índice)

### 6.3 Selects de Rol y Equipo

- Ordenados alfabéticamente
- Solo muestran valores del catálogo validado en Pasos 2 y 3
- Si el valor original no coincide → error inline

### 6.4 Reglas UX/UI aplicables

- Selects con orden alfabético
- Datalist de miembros (autocompletado)
- Validación en tiempo real al cambiar cualquier campo
- Error inline por asociación con cruces inválidos

---

## 7. PASO 5 — LÍDERES

### 7.1 Funcionalidades

| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| P5-01 | Mostrar solo equipos con `leadershipMode === "own"` del Paso 3 | ALTA |
| P5-02 | Por equipo: select de "Rol líder" (de las asignaciones del equipo en Paso 4) | ALTA |
| P5-03 | Por equipo: select de "Persona líder" (filtrada por rol líder seleccionado) | ALTA |
| P5-04 | Si no hay rol seleccionado: persona líder muestra todos los candidatos del equipo | ALTA |
| P5-05 | Validación: combinación rol + persona debe existir en asignaciones del equipo | ALTA |
| P5-06 | Resumen de validación | ALTA |
| P5-07 | Botón "Finalizar y ver JSON" → modal con JSON final | ALTA |

### 7.2 Reglas de negocio

| Regla | Detalle |
|-------|---------|
| Rol líder | Obligatorio |
| Persona líder | Obligatoria |
| Combinación | Debe existir como par `{role, member}` en Paso 4 |
| Cascada | Al cambiar rol, si la persona seleccionada no tiene ese rol → limpiar persona |
| Filtro de personas | Solo personas asignadas al equipo con el rol seleccionado |

### 7.3 Reglas UX/UI aplicables

- Selects ordenados alfabéticamente
- Validación cruzada en tiempo real
- Error inline por equipo con configuración inválida
- Modal con JSON formateado y botón "Copiar al portapapeles"

---

## 8. JSON DE SALIDA

### 8.1 Estructura

```typescript
interface FinalOutput {
  teams: TeamOutput[];
}

interface TeamOutput {
  name: string;
  childrenTeams: string[];
  parentsTeamsId?: string[];
  roles: RoleGroup[];
}

interface RoleGroup {
  roleTypeId: string;
  members: MemberRef[];
  teamId: string;
  isTeamLead: boolean;
  minQty: number;
  maxQty: number;
  parentsRolesId: string[];
}

interface MemberRef {
  name: string;
  lastName: string;
}
```

### 8.2 Compatibilidad con AF_Org

El JSON producido debe ser compatible con el modelo de datos del Organigrama (AF_Org.md):
- `role.isLeader` ← `isTeamLead`
- `member.firstName/lastName` ← `MemberRef.name/lastName`
- Estructura jerárquica de equipos ← `childrenTeams` / `parentsTeamsId`
- Los IDs de roles serán los nombres (normalización como slugs opcionales)

---

## 9. NAVEGACIÓN DEL WIZARD

### 9.1 Stepper

- Pills de navegación: `Paso 1: Miembros`, `Paso 2: Roles`, etc.
- Estados: `active` (actual), `done` (completado), `default`
- Navegación bidireccional: botones "Volver" y "Continuar"

### 9.2 Transición de pasos

| Transición | Comportamiento |
|-----------|---------------|
| Paso 1 → Paso 2 | Populate de datos del Paso 1 si misma fuente |
| Paso 2 → Paso 3 | Populate de datos del Paso 1 si misma fuente |
| Paso 3 → Paso 4 | Populate de datos del Paso 1 si misma fuente |
| Paso 4 → Paso 5 | Filtra equipos con `leadershipMode === "own"` |
| Paso 5 → Modal JSON | Construye JSON final |
| Volver | Mantiene estado del paso anterior |

### 9.3 Reglas de bloqueo de navegación (DECISIÓN CONFIRMADA)

| Transición | Condición de bloqueo |
|-----------|---------------------|
| Paso 1 → 2 | Campos obligatorios sin mapear (firstName, lastName, employeeId, hireDate, workEmail) |
| Paso 2 → 3 | No hay columna seleccionada, O algún rol tiene errores de validación |
| Paso 3 → 4 | No hay columna seleccionada, O hay loop jerárquico, O no existe exactamente 1 equipo principal |
| Paso 4 → 5 | Sin bloqueo (columnas opcionales) |
| Paso 5 → JSON | Alguna asignación de líder es inválida |

### 9.4 Reglas de sesión

- Estado persistido en Context API mientras la sesión esté activa
- Sin localStorage (PoC session-only)
- Al recargar la página, el wizard inicia desde el Paso 1 vacío

---

## 10. COMPONENTES IDENTIFICADOS

### Componentes genéricos (reutilizables)

| Componente | Skill | Responsabilidad |
|-----------|-------|----------------|
| `DataTable` | #5 | Tabla con búsqueda/filtros/ordenamiento |
| `CrudModal` | #6 | Modal genérico con loader |
| `ConfirmDeleteModal` | #6 | Modal de confirmación de eliminación |
| `DatePickerES` | #7 | DatePicker localizado DD/MM/AAAA |
| `SelectAlphabetic` | #8 | Select con items ordenados A-Z |
| `AutocompleteAlphabetic` | #8 | Autocomplete con items A-Z |
| `FileUploadZone` | — | Zona de drag & drop + input file |
| `ColumnMappingCard` | — | Card de mapeo de columna con select |
| `ValidationSummary` | — | Banner de resumen de validación |
| `JsonPreviewModal` | — | Modal con JSON formateado |

### Componentes de features

| Componente | Paso | Responsabilidad |
|-----------|------|----------------|
| `Step1Miembros` | 1 | Orquestación completa del Paso 1 |
| `FieldMappingGrid` | 1 | Grilla de 20 cards de mapeo |
| `DataPreviewPanel` | 1 | Panel derecho con preview y tabla |
| `RowEditorSection` | 1 | Editor de filas con errores |
| `Step2Roles` | 2 | Orquestación del Paso 2 |
| `SourceFileChoice` | 2,3,4 | Selector "Mismo archivo / Otro archivo" |
| `RoleListItem` | 2 | Fila editable de rol |
| `Step3Equipos` | 3 | Orquestación del Paso 3 |
| `TeamListItem` | 3 | Fila editable de equipo con jerarquía |
| `TeamTreePreview` | 3 | Preview del árbol ASCII |
| `Step4Puestos` | 4 | Orquestación del Paso 4 |
| `AssignmentListItem` | 4 | Fila editable de asociación |
| `Step5Lideres` | 5 | Orquestación del Paso 5 |
| `LeaderAssignmentItem` | 5 | Fila de asignación de líder por equipo |

### Context y Hooks

| Nombre | Responsabilidad |
|--------|----------------|
| `WizardContext` | Estado global del wizard (todos los pasos) |
| `useWizardStep` | Acceso y mutación del paso actual |
| `useFileParser` | Parsing de Excel/CSV con SheetJS |
| `useColumnDetection` | Scoring y detección de columnas |
| `useRowValidation` | Validación de filas contra FIELDS |
| `useRolesCatalog` | Estado y validación del catálogo de roles |
| `useTeamsCatalog` | Estado, jerarquía y validación de equipos |
| `useAssignmentsCatalog` | Estado y validación de asociaciones |
| `useLeadersCatalog` | Estado y validación de líderes |
| `useDataTable` | Lógica de tabla (búsqueda, filtros, sort) |

---

## 11. REGLAS UX/UI — APLICACIÓN POR COMPONENTE

### Tablas (aplica si se usa DataTable en el futuro — Paso 1 preview usa tabla simple)

> **Nota:** El prototipo HTML usa una tabla HTML simple para el preview (no MRT). Los listados de roles, equipos, asociaciones son listas de cards, no tablas. Se recomienda mantener este enfoque para los pasos 2-5 (cards editables) y reservar `DataTable` (Material React Table) para posibles vistas de resumen o expansión futura.

Si se usa tabla (Material React Table):
- `filterFn: 'includesString'` en todas las columnas (excepto Acciones)
- `globalFilterFn: 'includesString'` (no fuzzy)
- Ordenamiento numérico correcto (2 < 10)
- Ordenamiento de fechas DD/MM/AAAA correcto
- Columna Acciones: `enableColumnFilter: false`, `enableSorting: false`

### Selectores

- Items alfabéticos en: lista de roles (Paso 2), checkboxes de padres (Paso 3), selects de Paso 4, selects de Paso 5
- Excepción: no se reordena el listado de filas/errores del editor (mantiene orden original del archivo)

### Validaciones y feedback

- Contador de caracteres en: nombre de rol (max 40), nombre de equipo (max 40), campos de Step 1 con maxLength
- Errores inline en tiempo real (no solo al hacer submit)
- Botones de acción con loader mientras procesan

### DatePickers

- No hay DatePickers nativos en el prototipo (las fechas vienen del Excel)
- Si se añade edición manual de fechas en el row editor → usar `DatePickerES` con placeholder `DD/MM/AAAA`

### Modales

- Modal JSON final: precarga con JSON generado, botón "Copiar"
- Modal de error: si el archivo no puede parsearse

---

## 12. REGLAS DE NEGOCIO CRÍTICAS

### RN-01: Deduplicación de roles
Los roles se deduplicarán por valor normalizado (sin acentos, lowercase, sin espacios extra). El nombre mostrado preserva el original del primer valor encontrado.

### RN-02: Deduplicación de equipos
Igual que roles. El `id` interno del equipo se genera con la función `normalize()`.

### RN-03: Detección de loop jerárquico
Algoritmo DFS sobre el grafo de padres. Si detecta un ciclo → error en todos los equipos del ciclo. Ningún equipo puede ser su propio padre.

### RN-04: Exactamente un equipo principal
Debe existir exactamente 1 equipo marcado como `isMain`. El equipo principal no tiene padres.

### RN-05: Liderazgo propio vs heredado
- `own`: aparece en Paso 5 para asignar líder
- `inherit`: no aparece en Paso 5 (hereda líder del equipo superior)

### RN-06: Validación cruzada de asociaciones
- Rol en Paso 4 debe existir en catálogo del Paso 2 (comparación normalizada)
- Equipo en Paso 4 debe existir en catálogo del Paso 3 (comparación normalizada)

### RN-07: Filtro de candidatos en Paso 5
Al seleccionar un rol líder, la lista de personas se filtra a solo quienes tienen ese rol asignado en ese equipo (Paso 4). Al cambiar el rol, si la persona seleccionada no está en el nuevo filtro, se limpia la selección.

### RN-08: Mapeo workMode
El usuario puede configurar alias locales para Presencial/Híbrido/Remoto. Si un valor del Excel no coincide con los alias configurados ni con los valores canónicos → error en esa fila.

### RN-09: Columna no duplicada en mapeo
Cada columna del Excel puede mapearse a un solo campo FIELD. Los selects de campos ya usados deshabilitan esa opción en los demás selects.

### RN-10: Omitir fila
Las filas marcadas como "omitidas" NO se incluyen en `processedRows` ni en el JSON final de miembros, pero sí en la descarga de errores.

---

## 13. PREGUNTAS PARA ACLARACIÓN

> Las siguientes preguntas surgen del análisis del prototipo vs. los requerimientos del sistema final.

### Q1 — Paso 4: ¿El miembro es opcional por columna o por fila?
El prototipo marca las 3 columnas de Paso 4 como "Opcional". Sin embargo, valida que `member`, `role` y `team` sean obligatorios **por fila**. ¿Confirmamos que las columnas son opcionales (si no hay archivo estructurado) pero los campos son obligatorios cuando sí hay datos?

**Implicación:** Si el usuario no mapea ninguna columna en Paso 4, el sistema no puede inferir asociaciones y las `roles` del JSON final quedarán vacías.

### Q2 — Paso 1: ¿El row editor muestra todas las filas o solo las inválidas?
El prototipo muestra filas inválidas por defecto; si no hay filas inválidas, muestra las primeras 10. ¿Mantenemos este comportamiento?

**Implicación UX:** Si todas las filas son válidas, el editor muestra igualmente las primeras 10 para que el usuario pueda revisarlas.

### Q3 — ¿Se puede retroceder al Paso 1 desde el Paso 2 y cambiar la fuente de datos?
Si el usuario vuelve al Paso 1 y sube otro archivo, ¿los catálogos de Pasos 2-5 se resetean? 

**Recomendación:** Resetear catálogos dependientes al cambiar el archivo del Paso 1 para evitar inconsistencias.

### Q4 — Paso 3: ¿Qué pasa si no hay equipo principal marcado al avanzar al Paso 4?
El prototipo no bloquea la navegación entre pasos. ¿Debe el wizard bloquear avanzar si hay errores de validación críticos (loop jerárquico, sin equipo principal)?

**✅ DECISIÓN (de Q1):** BLOQUEAR. Ver tabla de reglas de bloqueo en sección 9.3.

### Q5 — JSON final: ¿Incluye los datos de miembros de Paso 1?
El prototipo tiene dos outputs separados:
- JSON de mapeo del Paso 1 (todos los campos de empleados)
- JSON final del wizard (estructura equipos → roles → miembros simplificados)

¿El JSON final debe incluir también el array de empleados con sus 20 campos, o solo la estructura organizacional?

**✅ DECISIÓN:** Solo la estructura organizacional (equipos → roles → miembros simplificados). Sin los 20 campos del Paso 1.

### Q6 — Paso 2: ¿Los roles detectados deben sincronizarse si el usuario cambia la columna después de editar nombres?
El prototipo re-detecta el catálogo al cambiar la columna pero intenta preservar ediciones previas por `id` normalizado. ¿Mantenemos este comportamiento?

---

## 14. CASOS DE USO CRÍTICOS

### CU-01: Archivo con fechas en múltiples formatos mezclados
- Fila 1: `hireDate = "15/01/2026"` → válida, sin cambio
- Fila 2: `hireDate = "2026-01-15"` → normalizada a `15/01/2026`, marcada como cambiada
- Fila 3: `hireDate = 46039` (serial Excel) → normalizada a `15/01/2026`
- Resultado: las 3 filas son válidas, fila 2 y 3 marcadas con "normalización automática"

### CU-02: Todos los pasos usan el mismo archivo
- Upload único en Paso 1
- Pasos 2, 3, 4: seleccionan "Mismo archivo" → se reusan `headers` y `rows` del Paso 1
- Los catálogos se construyen desde ese mismo archivo sin reparsear

### CU-03: Equipo con loop jerárquico
- Equipo A tiene padre B, B tiene padre A
- DFS detecta el ciclo
- Ambos equipos muestran error "Jerarquía: se detectó un loop entre equipos"
- El árbol preview no puede renderizarse → muestra "Configuración inválida"

### CU-04: Rol líder con un solo candidato en el equipo
- En Paso 5, al seleccionar el rol, la lista de personas muestra solo 1 opción
- Se sugiere seleccionarla automáticamente (comportamiento opcional / QA)

### CU-05: workMode con alias locales configurados
- Usuario selecciona columna "Esquema laboral"
- Configura: "Home Office" → Remoto, "Mixto" → Híbrido, "Oficina" → Presencial
- Al validar: "Home Office" normaliza a "Remoto", etc.

### CU-06: Archivo con 500+ filas y 30+ columnas
- El scoring de detección debe ser eficiente (no cuadrático)
- El row editor no debe renderizar todo el DOM de una vez → virtualización o paginación

---

## 15. RESTRICCIONES TÉCNICAS

| Restricción | Detalle |
|------------|---------|
| React 19 | No usar APIs deprecadas de React 18 ni de versiones anteriores |
| MUI v5 | Usar `@mui/material` + `@mui/x-date-pickers` para DatePicker |
| TypeScript strict | `"strict": true`, sin `any` explícito, sin `@ts-ignore` |
| SheetJS | `xlsx` (ya en prototipo) — parsear con `{ type: "array", cellDates: true, raw: true }` |
| Session-only | Sin `localStorage`, sin `sessionStorage`, solo React state/context |
| Sin backend | Todo client-side |
| Material React Table | Para DataTable genérico (si se usa) |
| Sin i18n lib | Los textos están en castellano hardcodeados (PoC) |

---

## 16. DEPENDENCIAS A INSTALAR

```json
{
  "dependencies": {
    "@mui/material": "^5.x",
    "@mui/icons-material": "^5.x",
    "@mui/x-date-pickers": "^7.x",
    "@emotion/react": "^11.x",
    "@emotion/styled": "^11.x",
    "material-react-table": "^2.x",
    "xlsx": "^0.18.x",
    "dayjs": "^1.x"
  },
  "devDependencies": {
    "vitest": "^1.x",
    "@testing-library/react": "^15.x"
  }
}
```

> **Nota:** SheetJS CDN (`cdn.sheetjs.com`) usado en el prototipo debe reemplazarse por el paquete npm `xlsx`.

---

## 17. CHECKLIST DE VALIDACIÓN — SKILL #1

- [x] Todas las funcionalidades del prototipo HTML están documentadas
- [x] Reglas de negocio identificadas y numeradas (RN-01 a RN-10)
- [x] Reglas UX/UI aplicadas por componente
- [x] Design tokens referenciados (ver prompt principal)
- [x] Casos de uso críticos documentados
- [x] Preguntas de aclaración formuladas
- [x] Restricciones técnicas listadas
- [x] Dependencias identificadas
- [x] Compatibilidad con AF_Org.md verificada en JSON de salida
- [x] TypeScript interfaces preliminares definidas en JSON de salida

---

*Documento producido por SKILL #1 ANALYSIS — en espera de aprobación para continuar con SKILL #2 ARCHITECTURE.*

---

## 18. CAMBIOS REQUERIDOS — ITERACIÓN 2 (2026-04-30)

### 18.1 CR-01 — Columnas exclusivas en el mapeo de campos

**Solicitud:** Los campos del Excel ya asignados a un campo FIELD deben quedar deshabilitados en todos los demás selects. Para reasignarlos hay que liberar el mapeo que los ocupa.

**Análisis de impacto:**
- Ya estaba previsto en RN-09 y en Reglas UX/UI (sección 3.5, ítem "Columna mapeada no puede asignarse a dos campos distintos") pero no fue implementado en `Step1Panel.tsx`.
- Afecta **exclusivamente** `src/components/steps/Step1Panel.tsx`.
- Implementación: calcular `usedColumns = new Set(Object.values(mapping).filter(v => v !== NONE_VALUE))`. En cada `<Select>` del grid, los `<MenuItem>` cuyo `value` esté en `usedColumns` Y no sea el valor actual del campo → `disabled`.
- Ningún hook ni tipo cambia.

**Reglas de negocio actualizadas:**

> **RN-09 (revisado):** Cada columna del Excel puede mapearse a un solo campo FIELD. En el grid de mapeo, las opciones de columna ya usadas aparecen deshabilitadas en los selectores de los demás campos. El usuario debe primero limpiar el mapeo que ocupa la columna para poder asignarla a otro campo.

**Criterios de aceptación:**
- [ ] Si "Apellido" usa la columna "Apellido", esa opción aparece `disabled` (y visualmente grisada) en todos los otros selects.
- [ ] La opción NO está deshabilitada en el select del campo que ya la tiene asignada (puede reasignarse a NONE desde su propio selector).
- [ ] Al cambiar un select a NONE_VALUE, la columna vuelve a estar disponible en los demás.

---

### 18.2 CR-02 — Alias de Modalidad de trabajo: selects en lugar de text inputs

**Solicitud:** Cuando "Modalidad de trabajo" está mapeada, el mapeo de alias (Presencial / Híbrido / Remoto) debe presentarse como selects cuyos ítems son los **valores únicos reales** de esa columna en el archivo, no campos de texto libre.

**Análisis de impacto:**
- Ya estaba previsto en P1-17, RN-08 y CU-05. La implementación actual usa `<TextField>` (texto libre). El nuevo requerimiento cambia la UX: el usuario elige, dentro de los valores que realmente aparecen en su archivo, cuál corresponde a cada valor canónico.
- Afecta **exclusivamente** `src/components/steps/Step1Panel.tsx`.
- Ningún hook ni tipo cambia: `WorkModeValueMap` ya almacena `{ Presencial: string, Híbrido: string, Remoto: string }` y la validación en `useRowValidation` compara `workModeValueMap[canonical] === cellValue`, lo que sigue funcionando.

**Lógica de implementación:**
1. Obtener el índice de la columna mapeada: `const wmColIndex = source.headers.indexOf(mapping['workMode'])`.
2. Extraer valores únicos no vacíos de esa columna: `const uniqueWmValues = [...new Set(source.rows.map(r => String(r[wmColIndex] ?? '')).filter(Boolean))].sort(...)`.
3. Reemplazar los `<TextField>` actuales por `<Select>` con `<MenuItem value="">— Sin mapear —</MenuItem>` + un `<MenuItem>` por cada valor único.
4. Permitir la opción vacía para dejar un valor canónico sin alias (filas con ese valor resultarán inválidas si no coinciden con ningún alias).

**Criterios de aceptación:**
- [ ] Al mapear la columna Modalidad, el panel de alias muestra selects con los valores únicos del archivo.
- [ ] Si el archivo tiene "Home Office", "Mixto", "Oficina" → esos valores aparecen como opciones en cada select.
- [ ] El mismo valor puede asignarse a dos canónicos (edge case válido, no bloquear).
- [ ] Al cambiar la columna mapeada, los selects se recalculan con los nuevos valores únicos.
- [ ] El valor guardado en `WorkModeValueMap` es el string tal como aparece en el archivo (sin normalizar).

---

### 18.3 CR-03 — Panel "Vista previa" de campos mapeados

**Solicitud:** Mostrar un panel de vista previa que, por cada campo obligatorio (y opcionalmente los opcionales mapeados), muestre el nombre del campo, la columna asignada y chips con los primeros valores reales del archivo — para validar rápidamente que el mapeo es correcto.

**Análisis de impacto:**
- Parcialmente previsto en P1-08 (chips) y P1-09 (tabla). No fue implementado.
- Afecta **exclusivamente** `src/components/steps/Step1Panel.tsx` (nueva sección de UI).
- No requiere cambios en hooks ni tipos.

**Especificación de UI (basada en el screenshot):**

```
┌─ Vista previa ────────────────────────────────────────────┐
│ Primeras filas del archivo para validar rápidamente si el │
│ mapeo propuesto es correcto.                              │
│                                                           │
│  Nombre                              [Nombre]             │
│  [Valentina] [Facundo] [Franco] [Romina] [Clara] ...      │
│                                                           │
│  Apellido                            [Apellido]           │
│  [Flores] [Quiroga] [Brizuela] [Martínez] ...             │
│                                                           │
│  Legajo                              [Sin asignar]        │
│  Todavía no hay una columna elegida.                      │
└───────────────────────────────────────────────────────────┘
```

**Reglas de renderizado:**
- Mostrar todos los **campos obligatorios** (REQUIRED_FIELDS) siempre, más los opcionales que estén mapeados.
- Por campo: nombre del campo a la izquierda (bold) + columna asignada a la derecha (caption, color `text.secondary`; "Sin asignar" si NONE_VALUE).
- Si mapeado: chips con los valores de las primeras 8 filas de esa columna (valores vacíos omitidos).
- Si no mapeado: texto "Todavía no hay una columna elegida." en caption gris.
- El panel se muestra SIEMPRE que haya un archivo cargado (debajo del grid de mapeo, antes de los alias de workMode).
- Actualización en tiempo real al cambiar cualquier select del grid.

**Criterios de aceptación:**
- [ ] Panel visible en cuanto hay archivo cargado.
- [ ] Los 5 campos obligatorios siempre aparecen en el panel.
- [ ] Los campos opcionales mapeados también aparecen.
- [ ] Los chips muestran valores reales (no headers).
- [ ] Campo no mapeado → texto gris, sin chips.
- [ ] Actualización inmediata al cambiar un mapeo.

---

### 18.4 Resumen de archivos afectados

| Archivo | CRs que lo modifican |
|---------|---------------------|
| `src/components/steps/Step1Panel.tsx` | CR-01, CR-02, CR-03 |

No se requieren cambios en hooks, context, reducer, tipos ni tests de dominio existentes.

### 18.5 Orden de implementación recomendado

1. **CR-01** (columnas exclusivas) — cambio puntual en el render del grid, sin nueva UI.
2. **CR-03** (Vista previa) — nueva sección de UI, sin lógica de negocio nueva.
3. **CR-02** (alias como selects) — reemplaza TextFields por Selects, requiere derivar `uniqueWmValues`.
