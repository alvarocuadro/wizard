# REQUIREMENTS_ANALYSIS.md
## SKILL #1 â€” Wellio HRIS Wizard

---

## 1. RESUMEN EJECUTIVO

**App:** HRIS Wizard  
**Stack:** React 19 + Material-UI v5 + TypeScript (strict) + Vite  
**Estado:** Context API (session-only, sin localStorage)  
**Parsing de archivos:** SheetJS (`xlsx`) â€” igual que el prototipo  
**PropÃ³sito:** Wizard de 5 pasos para configuraciÃ³n inicial de HRIS. Produce un JSON estructurado de equipos, roles y miembros compatible con el Organigrama (AF_Org.md).

---

## 2. ESTRUCTURA DEL WIZARD (5 PASOS)

```
Paso 1: Miembros    â†’ carga y mapeo de Excel/CSV, validaciÃ³n fila a fila
Paso 2: Roles       â†’ detecciÃ³n y validaciÃ³n de roles desde el archivo
Paso 3: Equipos     â†’ detecciÃ³n, jerarquÃ­a, validaciÃ³n de Ã¡rbol
Paso 4: Puestos     â†’ asociaciones miembro â†” rol â†” equipo
Paso 5: LÃ­deres     â†’ asignaciÃ³n de lÃ­der por equipo con liderazgo propio
```

---

## 3. PASO 1 â€” MIEMBROS

### 3.1 Funcionalidades

| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| P1-01 | Subida de archivo `.xlsx`, `.xls`, `.csv` | ALTA |
| P1-02 | Parsing con SheetJS (`cellDates: true`, `raw: true`) | ALTA |
| P1-03 | DetecciÃ³n de primera fila no vacÃ­a como encabezados | ALTA |
| P1-04 | DetecciÃ³n automÃ¡tica de columnas por alias (scoring) | ALTA |
| P1-05 | Grilla de mapeo de 20 campos (5 obligatorios, 15 opcionales) | ALTA |
| P1-06 | Filtro de columnas por texto en la grilla de mapeo | MEDIA |
| P1-07 | BotÃ³n "Redetectar" para resetear mapeo | MEDIA |
| P1-08 | Preview: chips por campo mapeado (primeras 8 filas) | ALTA |
| P1-09 | Preview: tabla con primeras 8 columnas y 8 filas | ALTA |
| P1-10 | Badge de progreso "X/20 campos asignados" | ALTA |
| P1-11 | ValidaciÃ³n de todas las filas contra reglas de negocio | ALTA |
| P1-12 | Editor de filas con errores (correcciÃ³n manual o marcar "omitir") | ALTA |
| P1-13 | Resumen de validaciÃ³n (total, vÃ¡lidas, con errores, omitidas) | ALTA |
| P1-14 | Descarga CSV de filas vÃ¡lidas | MEDIA |
| P1-15 | Descarga CSV de filas con errores | MEDIA |
| P1-16 | ExportaciÃ³n JSON del mapeo completo | BAJA |
| P1-17 | Mapeo especial para `workMode`: alias por valor ("Presencial"/"HÃ­brido"/"Remoto") | ALTA |

### 3.2 Campos definidos

#### Obligatorios
| key | label | tipo | maxLength | validaciÃ³n extra |
|-----|-------|------|-----------|-----------------|
| `firstName` | Nombre | text | 40 | sin emojis, sin espacios en blanco only |
| `lastName` | Apellido | text | 40 | sin emojis, sin espacios en blanco only |
| `employeeId` | Legajo | text | 15 | â€” |
| `hireDate` | Fecha de ingreso | date | â€” | formato DD/MM/AAAA |
| `workEmail` | Email laboral | email | â€” | regex `[^\s@]+@[^\s@]+\.[^\s@]+` |

#### Opcionales
| key | label | tipo | maxLength |
|-----|-------|------|-----------|
| `address` | Domicilio | text | 200 |
| `city` | Localidad / Ciudad | text | 60 |
| `state` | Provincia / Estado | text | 60 |
| `postalCode` | CÃ³digo postal | text | 15 |
| `country` | PaÃ­s | text | 60 |
| `personalEmail` | Email personal | email | â€” |
| `documentNumber` | NÃºmero de documento | text | 30 |
| `taxId` | Identificador tributario | text | 60 |
| `birthDate` | Fecha de nacimiento | date | â€” |
| `nationality` | Nacionalidad | text | 60 |
| `gender` | GÃ©nero | text | 25 |
| `location` | UbicaciÃ³n | text | 100 |
| `workday` | Jornada laboral | text | 100 |
| `workSchedule` | Horario de trabajo | text | 100 |
| `workMode` | Modalidad de trabajo | enum | â€” | Presencial / HÃ­brido / Remoto |

### 3.3 NormalizaciÃ³n automÃ¡tica de fechas

El sistema debe detectar y convertir estos formatos a `DD/MM/AAAA`:

| Formato origen | Ejemplo |
|---------------|---------|
| Excel serial | `46039` |
| `YYYY-MM-DD` | `2026-01-15` |
| `DD-MM-YYYY` | `15-01-2026` |
| `DD.MM.YYYY` | `15.01.2026` |
| `DD/MM/YY` | `15/01/26` |
| JS Date object | â€” |
| `Date.parse`-able | `January 15, 2026` |

### 3.4 Reglas de validaciÃ³n por tipo

| Tipo | Regla |
|------|-------|
| required | no vacÃ­o, no solo espacios |
| text (name) | sin emojis (`/\p{Emoji}/u`), sin solo espacios |
| maxLength | `value.length > maxLength` â†’ error |
| email | regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` |
| date | debe quedar en `DD/MM/AAAA` y ser fecha vÃ¡lida |
| enum (workMode) | debe ser exactamente `Presencial`, `HÃ­brido` o `Remoto` |

### 3.5 Reglas UX/UI aplicables

- Badge de progreso actualizado en tiempo real al cambiar mapeos
- Loader (Skeleton) mientras se procesa el archivo
- Grilla de mapeo: badge por campo (OK verde / Requerido rojo / Opcional gris)
- Columna mapeada no puede asignarse a dos campos distintos (opciÃ³n deshabilitada en otros selects)
- Chips de preview con datos reales de las primeras 8 filas
- Editor de filas con errores: contador de caracteres en campos con maxLength
- Botones "Descargar" con loader hasta completar

---

## 4. PASO 2 â€” ROLES

### 4.1 Funcionalidades

| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| P2-01 | Elegir fuente: mismo archivo del Paso 1 o archivo diferente | ALTA |
| P2-02 | Si archivo diferente: subida y parsing igual que Paso 1 | ALTA |
| P2-03 | SelecciÃ³n de columna de roles (con detecciÃ³n automÃ¡tica) | ALTA |
| P2-04 | Badge de estado del mapeo (Mapeado / Requerido) | ALTA |
| P2-05 | Listado de roles Ãºnicos detectados, ordenados alfabÃ©ticamente | ALTA |
| P2-06 | Por rol: ediciÃ³n de nombre (max 40 chars) | ALTA |
| P2-07 | Por rol: checkbox "Tiene gente a cargo" | ALTA |
| P2-08 | ValidaciÃ³n en tiempo real al cambiar nombre | ALTA |
| P2-09 | Resumen de validaciÃ³n (total, con errores, vÃ¡lidos) | ALTA |

### 4.2 DetecciÃ³n automÃ¡tica de columna

Alias: `rol`, `role`, `puesto`, `cargo`, `funcion`, `funciÃ³n`, `job title`, `position`

Scoring:
- Coincidencia exacta (normalizada): +120
- Contiene alias: +80

### 4.3 Reglas de negocio

- Nombre de rol: obligatorio, mÃ¡ximo 40 caracteres
- Los roles se deduplicarÃ¡n por valor normalizado (sin acentos, lowercase)
- Se preservan los datos editados si el usuario cambia de columna

### 4.4 Reglas UX/UI aplicables

- Items de la lista ordenados alfabÃ©ticamente
- Contador de caracteres visible: "X/40 caracteres"
- Error inline al superar 40 chars
- Skeleton loader mientras se procesa
- Estado vacÃ­o si no hay columna seleccionada

---

## 5. PASO 3 â€” EQUIPOS

### 5.1 Funcionalidades

| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| P3-01 | Elegir fuente: mismo archivo o diferente | ALTA |
| P3-02 | Si diferente: subida y parsing | ALTA |
| P3-03 | SelecciÃ³n de columna de equipos (con detecciÃ³n automÃ¡tica) | ALTA |
| P3-04 | Listado de equipos Ãºnicos ordenados alfabÃ©ticamente | ALTA |
| P3-05 | Por equipo: ediciÃ³n de nombre (max 40 chars) | ALTA |
| P3-06 | Por equipo: radio "Equipo principal" (exactamente 1) | ALTA |
| P3-07 | Por equipo: select "Modo de liderazgo" (Propio / Hereda) | ALTA |
| P3-08 | Por equipo (no principal): checkboxes de equipos padre (multi-select) | ALTA |
| P3-09 | ValidaciÃ³n de loop jerÃ¡rquico (DFS) | ALTA |
| P3-10 | ValidaciÃ³n: exactamente 1 equipo principal | ALTA |
| P3-11 | Preview de Ã¡rbol jerÃ¡rquico en texto | ALTA |
| P3-12 | Resumen de validaciÃ³n | ALTA |

### 5.2 DetecciÃ³n automÃ¡tica de columna

Alias: `equipo`, `team`, `area`, `Ã¡rea`, `sector`, `departamento`, `department`

### 5.3 Reglas de negocio

| Regla | Detalle |
|-------|---------|
| Nombre | Obligatorio, mÃ¡x 40 chars |
| Equipo principal | Exactamente 1 marcado como principal |
| Equipo principal | No tiene equipo padre (se ignoran padres si es principal) |
| Padres | Un equipo puede tener mÃºltiples equipos padre |
| Sin loops | DetecciÃ³n de ciclos con DFS antes de guardar |
| Sin auto-referencia | Un equipo no puede ser padre de sÃ­ mismo |
| Liderazgo | `own` (lÃ­der propio) o `inherit` (hereda del/los superior/es) |

### 5.4 Preview de Ã¡rbol

RepresentaciÃ³n ASCII del Ã¡rbol jerÃ¡rquico, actualizado en tiempo real:
```
CompanyRoot
  - Operaciones
    - Proyecto Alpha
    - Proyecto Beta
  - RRHH
```

### 5.5 Reglas UX/UI aplicables

- Equipos ordenados alfabÃ©ticamente en el listado y en los checkboxes de padres
- Contador de caracteres "X/40"
- ValidaciÃ³n en tiempo real al editar nombre o cambiar jerarquÃ­a
- Error visual si hay loop o mÃºltiples principales
- Preview de Ã¡rbol actualizado on-change
- Los padres del equipo principal no se muestran (no aplica)

---

## 6. PASO 4 â€” PUESTOS (ASOCIACIONES)

### 6.1 Funcionalidades

| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| P4-01 | Elegir fuente: mismo archivo o diferente | ALTA |
| P4-02 | Mapeo de 3 columnas: Miembro, Rol, Equipo | ALTA |
| P4-03 | DetecciÃ³n automÃ¡tica de las 3 columnas | ALTA |
| P4-04 | Badges de estado por columna (Mapeado / Opcional) | ALTA |
| P4-05 | Listado de asociaciones construidas | ALTA |
| P4-06 | Por asociaciÃ³n: campo Miembro (text + datalist de Paso 1) | ALTA |
| P4-07 | Por asociaciÃ³n: select Rol (del catÃ¡logo del Paso 2) | ALTA |
| P4-08 | Por asociaciÃ³n: select Equipo (del catÃ¡logo del Paso 3) | ALTA |
| P4-09 | Si mismo archivo: reconstruir Nombre Apellido completo desde columnas Paso 1 | ALTA |
| P4-10 | ValidaciÃ³n cruzada: rol debe existir en catÃ¡logo Paso 2 | ALTA |
| P4-11 | ValidaciÃ³n cruzada: equipo debe existir en catÃ¡logo Paso 3 | ALTA |
| P4-12 | Resumen de validaciÃ³n | ALTA |

### 6.2 LÃ³gica de reconstrucciÃ³n de nombre (mismo archivo)

Si la fuente es el mismo archivo:
1. Si columna `member` mapeada = columna `firstName` del Paso 1 â†’ completar con `firstName + " " + lastName`
2. Si columna `member` mapeada = columna `lastName` del Paso 1 â†’ completar con `firstName + " " + lastName`
3. Por posiciÃ³n de fila: buscar nombre completo en Paso 1 (fila N â†’ mismo Ã­ndice)

### 6.3 Selects de Rol y Equipo

- Ordenados alfabÃ©ticamente
- Solo muestran valores del catÃ¡logo validado en Pasos 2 y 3
- Si el valor original no coincide â†’ error inline

### 6.4 Reglas UX/UI aplicables

- Selects con orden alfabÃ©tico
- Datalist de miembros (autocompletado)
- ValidaciÃ³n en tiempo real al cambiar cualquier campo
- Error inline por asociaciÃ³n con cruces invÃ¡lidos

---

## 7. PASO 5 â€” LÃDERES

### 7.1 Funcionalidades

| ID | Funcionalidad | Prioridad |
|----|--------------|-----------|
| P5-01 | Mostrar solo equipos con `leadershipMode === "own"` del Paso 3 | ALTA |
| P5-02 | Por equipo: select de "Rol lÃ­der" (de las asignaciones del equipo en Paso 4) | ALTA |
| P5-03 | Por equipo: select de "Persona lÃ­der" (filtrada por rol lÃ­der seleccionado) | ALTA |
| P5-04 | Si no hay rol seleccionado: persona lÃ­der muestra todos los candidatos del equipo | ALTA |
| P5-05 | ValidaciÃ³n: combinaciÃ³n rol + persona debe existir en asignaciones del equipo | ALTA |
| P5-06 | Resumen de validaciÃ³n | ALTA |
| P5-07 | BotÃ³n "Finalizar y ver JSON" â†’ modal con JSON final | ALTA |

### 7.2 Reglas de negocio

| Regla | Detalle |
|-------|---------|
| Rol lÃ­der | Obligatorio |
| Persona lÃ­der | Obligatoria |
| CombinaciÃ³n | Debe existir como par `{role, member}` en Paso 4 |
| Cascada | Al cambiar rol, si la persona seleccionada no tiene ese rol â†’ limpiar persona |
| Filtro de personas | Solo personas asignadas al equipo con el rol seleccionado |

### 7.3 Reglas UX/UI aplicables

- Selects ordenados alfabÃ©ticamente
- ValidaciÃ³n cruzada en tiempo real
- Error inline por equipo con configuraciÃ³n invÃ¡lida
- Modal con JSON formateado y botÃ³n "Copiar al portapapeles"

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
- `role.isLeader` â† `isTeamLead`
- `member.firstName/lastName` â† `MemberRef.name/lastName`
- Estructura jerÃ¡rquica de equipos â† `childrenTeams` / `parentsTeamsId`
- Los IDs de roles serÃ¡n los nombres (normalizaciÃ³n como slugs opcionales)

---

## 9. NAVEGACIÃ“N DEL WIZARD

### 9.1 Stepper

- Pills de navegaciÃ³n: `Paso 1: Miembros`, `Paso 2: Roles`, etc.
- Estados: `active` (actual), `done` (completado), `default`
- NavegaciÃ³n bidireccional: botones "Volver" y "Continuar"

### 9.2 TransiciÃ³n de pasos

| TransiciÃ³n | Comportamiento |
|-----------|---------------|
| Paso 1 â†’ Paso 2 | Populate de datos del Paso 1 si misma fuente |
| Paso 2 â†’ Paso 3 | Populate de datos del Paso 1 si misma fuente |
| Paso 3 â†’ Paso 4 | Populate de datos del Paso 1 si misma fuente |
| Paso 4 â†’ Paso 5 | Filtra equipos con `leadershipMode === "own"` |
| Paso 5 â†’ Modal JSON | Construye JSON final |
| Volver | Mantiene estado del paso anterior |

### 9.3 Reglas de bloqueo de navegaciÃ³n (DECISIÃ“N CONFIRMADA)

| TransiciÃ³n | CondiciÃ³n de bloqueo |
|-----------|---------------------|
| Paso 1 â†’ 2 | Campos obligatorios sin mapear (firstName, lastName, employeeId, hireDate, workEmail) |
| Paso 2 â†’ 3 | No hay columna seleccionada, O algÃºn rol tiene errores de validaciÃ³n |
| Paso 3 â†’ 4 | No hay columna seleccionada, O hay loop jerÃ¡rquico, O no existe exactamente 1 equipo principal |
| Paso 4 â†’ 5 | Sin bloqueo (columnas opcionales) |
| Paso 5 â†’ JSON | Alguna asignaciÃ³n de lÃ­der es invÃ¡lida |

### 9.4 Reglas de sesion

- Estado persistido en Context API mientras la sesion este activa
- Sin localStorage (PoC session-only)
- Al recargar la pagina, el wizard inicia desde el Paso 1 vacio

### 9.5 Navegacion consolidada

- Navegar con el breadcrumb no reinicia los datos ya cargados en cada paso
- El usuario puede volver hacia atras libremente a cualquier paso previo
- El usuario puede avanzar desde el breadcrumb solo hasta el ultimo paso habilitado
- Un paso queda habilitado cuando el paso anterior cumple sus reglas de validacion
- Los pasos futuros no habilitados se muestran desactivados visualmente
- `highestAvailableStep` define el mayor paso navegable en cada momento
- Si Paso 1 es valido, se habilita Paso 2
- Si Paso 2 es valido, se habilita Paso 3
- Si Paso 3 es valido, se habilita Paso 4
- Paso 4 no bloquea el acceso al Paso 5
- Solo un cambio de fuente o un reset explicito puede limpiar pasos dependientes

---

## 10. COMPONENTES IDENTIFICADOS

### Componentes genÃ©ricos (reutilizables)

| Componente | Skill | Responsabilidad |
|-----------|-------|----------------|
| `DataTable` | #5 | Tabla con bÃºsqueda/filtros/ordenamiento |
| `CrudModal` | #6 | Modal genÃ©rico con loader |
| `ConfirmDeleteModal` | #6 | Modal de confirmaciÃ³n de eliminaciÃ³n |
| `DatePickerES` | #7 | DatePicker localizado DD/MM/AAAA |
| `SelectAlphabetic` | #8 | Select con items ordenados A-Z |
| `AutocompleteAlphabetic` | #8 | Autocomplete con items A-Z |
| `FileUploadZone` | â€” | Zona de drag & drop + input file |
| `ColumnMappingCard` | â€” | Card de mapeo de columna con select |
| `ValidationSummary` | â€” | Banner de resumen de validaciÃ³n |
| `JsonPreviewModal` | â€” | Modal con JSON formateado |

### Componentes de features

| Componente | Paso | Responsabilidad |
|-----------|------|----------------|
| `Step1Miembros` | 1 | OrquestaciÃ³n completa del Paso 1 |
| `FieldMappingGrid` | 1 | Grilla de 20 cards de mapeo |
| `DataPreviewPanel` | 1 | Panel derecho con preview y tabla |
| `RowEditorSection` | 1 | Editor de filas con errores |
| `Step2Roles` | 2 | OrquestaciÃ³n del Paso 2 |
| `SourceFileChoice` | 2,3,4 | Selector "Mismo archivo / Otro archivo" |
| `RoleListItem` | 2 | Fila editable de rol |
| `Step3Equipos` | 3 | OrquestaciÃ³n del Paso 3 |
| `TeamListItem` | 3 | Fila editable de equipo con jerarquÃ­a |
| `TeamTreePreview` | 3 | Preview del Ã¡rbol ASCII |
| `Step4Puestos` | 4 | OrquestaciÃ³n del Paso 4 |
| `AssignmentListItem` | 4 | Fila editable de asociaciÃ³n |
| `Step5Lideres` | 5 | OrquestaciÃ³n del Paso 5 |
| `LeaderAssignmentItem` | 5 | Fila de asignaciÃ³n de lÃ­der por equipo |

### Context y Hooks

| Nombre | Responsabilidad |
|--------|----------------|
| `WizardContext` | Estado global del wizard (todos los pasos) |
| `useWizardStep` | Acceso y mutaciÃ³n del paso actual |
| `useFileParser` | Parsing de Excel/CSV con SheetJS |
| `useColumnDetection` | Scoring y detecciÃ³n de columnas |
| `useRowValidation` | ValidaciÃ³n de filas contra FIELDS |
| `useRolesCatalog` | Estado y validaciÃ³n del catÃ¡logo de roles |
| `useTeamsCatalog` | Estado, jerarquÃ­a y validaciÃ³n de equipos |
| `useAssignmentsCatalog` | Estado y validaciÃ³n de asociaciones |
| `useLeadersCatalog` | Estado y validaciÃ³n de lÃ­deres |
| `useDataTable` | LÃ³gica de tabla (bÃºsqueda, filtros, sort) |

---

## 11. REGLAS UX/UI â€” APLICACIÃ“N POR COMPONENTE

### Tablas (aplica si se usa DataTable en el futuro â€” Paso 1 preview usa tabla simple)

> **Nota:** El prototipo HTML usa una tabla HTML simple para el preview (no MRT). Los listados de roles, equipos, asociaciones son listas de cards, no tablas. Se recomienda mantener este enfoque para los pasos 2-5 (cards editables) y reservar `DataTable` (Material React Table) para posibles vistas de resumen o expansiÃ³n futura.

Si se usa tabla (Material React Table):
- `filterFn: 'includesString'` en todas las columnas (excepto Acciones)
- `globalFilterFn: 'includesString'` (no fuzzy)
- Ordenamiento numÃ©rico correcto (2 < 10)
- Ordenamiento de fechas DD/MM/AAAA correcto
- Columna Acciones: `enableColumnFilter: false`, `enableSorting: false`

### Selectores

- Items alfabÃ©ticos en: lista de roles (Paso 2), checkboxes de padres (Paso 3), selects de Paso 4, selects de Paso 5
- ExcepciÃ³n: no se reordena el listado de filas/errores del editor (mantiene orden original del archivo)

### Validaciones y feedback

- Contador de caracteres en: nombre de rol (max 40), nombre de equipo (max 40), campos de Step 1 con maxLength
- Errores inline en tiempo real (no solo al hacer submit)
- Botones de acciÃ³n con loader mientras procesan

### DatePickers

- No hay DatePickers nativos en el prototipo (las fechas vienen del Excel)
- Si se aÃ±ade ediciÃ³n manual de fechas en el row editor â†’ usar `DatePickerES` con placeholder `DD/MM/AAAA`

### Modales

- Modal JSON final: precarga con JSON generado, botÃ³n "Copiar"
- Modal de error: si el archivo no puede parsearse

---

## 12. REGLAS DE NEGOCIO CRÃTICAS

### RN-01: DeduplicaciÃ³n de roles
Los roles se deduplicarÃ¡n por valor normalizado (sin acentos, lowercase, sin espacios extra). El nombre mostrado preserva el original del primer valor encontrado.

### RN-02: DeduplicaciÃ³n de equipos
Igual que roles. El `id` interno del equipo se genera con la funciÃ³n `normalize()`.

### RN-03: DetecciÃ³n de loop jerÃ¡rquico
Algoritmo DFS sobre el grafo de padres. Si detecta un ciclo â†’ error en todos los equipos del ciclo. NingÃºn equipo puede ser su propio padre.

### RN-04: Exactamente un equipo principal
Debe existir exactamente 1 equipo marcado como `isMain`. El equipo principal no tiene padres.

### RN-05: Liderazgo propio vs heredado
- `own`: aparece en Paso 5 para asignar lÃ­der
- `inherit`: no aparece en Paso 5 (hereda lÃ­der del equipo superior)

### RN-06: ValidaciÃ³n cruzada de asociaciones
- Rol en Paso 4 debe existir en catÃ¡logo del Paso 2 (comparaciÃ³n normalizada)
- Equipo en Paso 4 debe existir en catÃ¡logo del Paso 3 (comparaciÃ³n normalizada)

### RN-07: Filtro de candidatos en Paso 5
Al seleccionar un rol lÃ­der, la lista de personas se filtra a solo quienes tienen ese rol asignado en ese equipo (Paso 4). Al cambiar el rol, si la persona seleccionada no estÃ¡ en el nuevo filtro, se limpia la selecciÃ³n.

### RN-08: Mapeo workMode
El usuario puede configurar alias locales para Presencial/HÃ­brido/Remoto. Si un valor del Excel no coincide con los alias configurados ni con los valores canÃ³nicos â†’ error en esa fila.

### RN-09: Columna no duplicada en mapeo
Cada columna del Excel puede mapearse a un solo campo FIELD. Los selects de campos ya usados deshabilitan esa opciÃ³n en los demÃ¡s selects.

### RN-10: Omitir fila
Las filas marcadas como "omitidas" NO se incluyen en `processedRows` ni en el JSON final de miembros, pero sÃ­ en la descarga de errores.

---

## 13. PREGUNTAS PARA ACLARACIÃ“N

> Las siguientes preguntas surgen del anÃ¡lisis del prototipo vs. los requerimientos del sistema final.

### Q1 â€” Paso 4: Â¿El miembro es opcional por columna o por fila?
El prototipo marca las 3 columnas de Paso 4 como "Opcional". Sin embargo, valida que `member`, `role` y `team` sean obligatorios **por fila**. Â¿Confirmamos que las columnas son opcionales (si no hay archivo estructurado) pero los campos son obligatorios cuando sÃ­ hay datos?

**ImplicaciÃ³n:** Si el usuario no mapea ninguna columna en Paso 4, el sistema no puede inferir asociaciones y las `roles` del JSON final quedarÃ¡n vacÃ­as.

### Q2 â€” Paso 1: Â¿El row editor muestra todas las filas o solo las invÃ¡lidas?
El prototipo muestra filas invÃ¡lidas por defecto; si no hay filas invÃ¡lidas, muestra las primeras 10. Â¿Mantenemos este comportamiento?

**ImplicaciÃ³n UX:** Si todas las filas son vÃ¡lidas, el editor muestra igualmente las primeras 10 para que el usuario pueda revisarlas.

### Q3 â€” Â¿Se puede retroceder al Paso 1 desde el Paso 2 y cambiar la fuente de datos?
Si el usuario vuelve al Paso 1 y sube otro archivo, Â¿los catÃ¡logos de Pasos 2-5 se resetean? 

**RecomendaciÃ³n:** Resetear catÃ¡logos dependientes al cambiar el archivo del Paso 1 para evitar inconsistencias.

### Q4 â€” Paso 3: Â¿QuÃ© pasa si no hay equipo principal marcado al avanzar al Paso 4?
El prototipo no bloquea la navegaciÃ³n entre pasos. Â¿Debe el wizard bloquear avanzar si hay errores de validaciÃ³n crÃ­ticos (loop jerÃ¡rquico, sin equipo principal)?

**âœ… DECISIÃ“N (de Q1):** BLOQUEAR. Ver tabla de reglas de bloqueo en secciÃ³n 9.3.

### Q5 â€” JSON final: Â¿Incluye los datos de miembros de Paso 1?
El prototipo tiene dos outputs separados:
- JSON de mapeo del Paso 1 (todos los campos de empleados)
- JSON final del wizard (estructura equipos â†’ roles â†’ miembros simplificados)

Â¿El JSON final debe incluir tambiÃ©n el array de empleados con sus 20 campos, o solo la estructura organizacional?

**âœ… DECISIÃ“N:** Solo la estructura organizacional (equipos â†’ roles â†’ miembros simplificados). Sin los 20 campos del Paso 1.

### Q6 â€” Paso 2: Â¿Los roles detectados deben sincronizarse si el usuario cambia la columna despuÃ©s de editar nombres?
El prototipo re-detecta el catÃ¡logo al cambiar la columna pero intenta preservar ediciones previas por `id` normalizado. Â¿Mantenemos este comportamiento?

---

## 14. CASOS DE USO CRÃTICOS

### CU-01: Archivo con fechas en mÃºltiples formatos mezclados
- Fila 1: `hireDate = "15/01/2026"` â†’ vÃ¡lida, sin cambio
- Fila 2: `hireDate = "2026-01-15"` â†’ normalizada a `15/01/2026`, marcada como cambiada
- Fila 3: `hireDate = 46039` (serial Excel) â†’ normalizada a `15/01/2026`
- Resultado: las 3 filas son vÃ¡lidas, fila 2 y 3 marcadas con "normalizaciÃ³n automÃ¡tica"

### CU-02: Todos los pasos usan el mismo archivo
- Upload Ãºnico en Paso 1
- Pasos 2, 3, 4: seleccionan "Mismo archivo" â†’ se reusan `headers` y `rows` del Paso 1
- Los catÃ¡logos se construyen desde ese mismo archivo sin reparsear

### CU-03: Equipo con loop jerÃ¡rquico
- Equipo A tiene padre B, B tiene padre A
- DFS detecta el ciclo
- Ambos equipos muestran error "JerarquÃ­a: se detectÃ³ un loop entre equipos"
- El Ã¡rbol preview no puede renderizarse â†’ muestra "ConfiguraciÃ³n invÃ¡lida"

### CU-04: Rol lÃ­der con un solo candidato en el equipo
- En Paso 5, al seleccionar el rol, la lista de personas muestra solo 1 opciÃ³n
- Se sugiere seleccionarla automÃ¡ticamente (comportamiento opcional / QA)

### CU-05: workMode con alias locales configurados
- Usuario selecciona columna "Esquema laboral"
- Configura: "Home Office" â†’ Remoto, "Mixto" â†’ HÃ­brido, "Oficina" â†’ Presencial
- Al validar: "Home Office" normaliza a "Remoto", etc.

### CU-06: Archivo con 500+ filas y 30+ columnas
- El scoring de detecciÃ³n debe ser eficiente (no cuadrÃ¡tico)
- El row editor no debe renderizar todo el DOM de una vez â†’ virtualizaciÃ³n o paginaciÃ³n

---

## 15. RESTRICCIONES TÃ‰CNICAS

| RestricciÃ³n | Detalle |
|------------|---------|
| React 19 | No usar APIs deprecadas de React 18 ni de versiones anteriores |
| MUI v5 | Usar `@mui/material` + `@mui/x-date-pickers` para DatePicker |
| TypeScript strict | `"strict": true`, sin `any` explÃ­cito, sin `@ts-ignore` |
| SheetJS | `xlsx` (ya en prototipo) â€” parsear con `{ type: "array", cellDates: true, raw: true }` |
| Session-only | Sin `localStorage`, sin `sessionStorage`, solo React state/context |
| Sin backend | Todo client-side |
| Material React Table | Para DataTable genÃ©rico (si se usa) |
| Sin i18n lib | Los textos estÃ¡n en castellano hardcodeados (PoC) |

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

## 17. CHECKLIST DE VALIDACIÃ“N â€” SKILL #1

- [x] Todas las funcionalidades del prototipo HTML estÃ¡n documentadas
- [x] Reglas de negocio identificadas y numeradas (RN-01 a RN-10)
- [x] Reglas UX/UI aplicadas por componente
- [x] Design tokens referenciados (ver prompt principal)
- [x] Casos de uso crÃ­ticos documentados
- [x] Preguntas de aclaraciÃ³n formuladas
- [x] Restricciones tÃ©cnicas listadas
- [x] Dependencias identificadas
- [x] Compatibilidad con AF_Org.md verificada en JSON de salida
- [x] TypeScript interfaces preliminares definidas en JSON de salida

---

*Documento producido por SKILL #1 ANALYSIS â€” en espera de aprobaciÃ³n para continuar con SKILL #2 ARCHITECTURE.*

---

## 18. CAMBIOS REQUERIDOS â€” ITERACIÃ“N 2 (2026-04-30)

### 18.1 CR-01 â€” Columnas exclusivas en el mapeo de campos

**Solicitud:** Los campos del Excel ya asignados a un campo FIELD deben quedar deshabilitados en todos los demÃ¡s selects. Para reasignarlos hay que liberar el mapeo que los ocupa.

**AnÃ¡lisis de impacto:**
- Ya estaba previsto en RN-09 y en Reglas UX/UI (secciÃ³n 3.5, Ã­tem "Columna mapeada no puede asignarse a dos campos distintos") pero no fue implementado en `Step1Panel.tsx`.
- Afecta **exclusivamente** `src/components/steps/Step1Panel.tsx`.
- ImplementaciÃ³n: calcular `usedColumns = new Set(Object.values(mapping).filter(v => v !== NONE_VALUE))`. En cada `<Select>` del grid, los `<MenuItem>` cuyo `value` estÃ© en `usedColumns` Y no sea el valor actual del campo â†’ `disabled`.
- NingÃºn hook ni tipo cambia.

**Reglas de negocio actualizadas:**

> **RN-09 (revisado):** Cada columna del Excel puede mapearse a un solo campo FIELD. En el grid de mapeo, las opciones de columna ya usadas aparecen deshabilitadas en los selectores de los demÃ¡s campos. El usuario debe primero limpiar el mapeo que ocupa la columna para poder asignarla a otro campo.

**Criterios de aceptaciÃ³n:**
- [ ] Si "Apellido" usa la columna "Apellido", esa opciÃ³n aparece `disabled` (y visualmente grisada) en todos los otros selects.
- [ ] La opciÃ³n NO estÃ¡ deshabilitada en el select del campo que ya la tiene asignada (puede reasignarse a NONE desde su propio selector).
- [ ] Al cambiar un select a NONE_VALUE, la columna vuelve a estar disponible en los demÃ¡s.

---

### 18.2 CR-02 â€” Alias de Modalidad de trabajo: selects en lugar de text inputs

**Solicitud:** Cuando "Modalidad de trabajo" estÃ¡ mapeada, el mapeo de alias (Presencial / HÃ­brido / Remoto) debe presentarse como selects cuyos Ã­tems son los **valores Ãºnicos reales** de esa columna en el archivo, no campos de texto libre.

**AnÃ¡lisis de impacto:**
- Ya estaba previsto en P1-17, RN-08 y CU-05. La implementaciÃ³n actual usa `<TextField>` (texto libre). El nuevo requerimiento cambia la UX: el usuario elige, dentro de los valores que realmente aparecen en su archivo, cuÃ¡l corresponde a cada valor canÃ³nico.
- Afecta **exclusivamente** `src/components/steps/Step1Panel.tsx`.
- NingÃºn hook ni tipo cambia: `WorkModeValueMap` ya almacena `{ Presencial: string, HÃ­brido: string, Remoto: string }` y la validaciÃ³n en `useRowValidation` compara `workModeValueMap[canonical] === cellValue`, lo que sigue funcionando.

**LÃ³gica de implementaciÃ³n:**
1. Obtener el Ã­ndice de la columna mapeada: `const wmColIndex = source.headers.indexOf(mapping['workMode'])`.
2. Extraer valores Ãºnicos no vacÃ­os de esa columna: `const uniqueWmValues = [...new Set(source.rows.map(r => String(r[wmColIndex] ?? '')).filter(Boolean))].sort(...)`.
3. Reemplazar los `<TextField>` actuales por `<Select>` con `<MenuItem value="">â€” Sin mapear â€”</MenuItem>` + un `<MenuItem>` por cada valor Ãºnico.
4. Permitir la opciÃ³n vacÃ­a para dejar un valor canÃ³nico sin alias (filas con ese valor resultarÃ¡n invÃ¡lidas si no coinciden con ningÃºn alias).

**Criterios de aceptaciÃ³n:**
- [ ] Al mapear la columna Modalidad, el panel de alias muestra selects con los valores Ãºnicos del archivo.
- [ ] Si el archivo tiene "Home Office", "Mixto", "Oficina" â†’ esos valores aparecen como opciones en cada select.
- [ ] El mismo valor puede asignarse a dos canÃ³nicos (edge case vÃ¡lido, no bloquear).
- [ ] Al cambiar la columna mapeada, los selects se recalculan con los nuevos valores Ãºnicos.
- [ ] El valor guardado en `WorkModeValueMap` es el string tal como aparece en el archivo (sin normalizar).

---

### 18.3 CR-03 â€” Panel "Vista previa" de campos mapeados

**Solicitud:** Mostrar un panel de vista previa que, por cada campo obligatorio (y opcionalmente los opcionales mapeados), muestre el nombre del campo, la columna asignada y chips con los primeros valores reales del archivo â€” para validar rÃ¡pidamente que el mapeo es correcto.

**AnÃ¡lisis de impacto:**
- Parcialmente previsto en P1-08 (chips) y P1-09 (tabla). No fue implementado.
- Afecta **exclusivamente** `src/components/steps/Step1Panel.tsx` (nueva secciÃ³n de UI).
- No requiere cambios en hooks ni tipos.

**EspecificaciÃ³n de UI (basada en el screenshot):**

```
â”Œâ”€ Vista previa â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Primeras filas del archivo para validar rÃ¡pidamente si el â”‚
â”‚ mapeo propuesto es correcto.                              â”‚
â”‚                                                           â”‚
â”‚  Nombre                              [Nombre]             â”‚
â”‚  [Valentina] [Facundo] [Franco] [Romina] [Clara] ...      â”‚
â”‚                                                           â”‚
â”‚  Apellido                            [Apellido]           â”‚
â”‚  [Flores] [Quiroga] [Brizuela] [MartÃ­nez] ...             â”‚
â”‚                                                           â”‚
â”‚  Legajo                              [Sin asignar]        â”‚
â”‚  TodavÃ­a no hay una columna elegida.                      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Reglas de renderizado:**
- Mostrar todos los **campos obligatorios** (REQUIRED_FIELDS) siempre, mÃ¡s los opcionales que estÃ©n mapeados.
- Por campo: nombre del campo a la izquierda (bold) + columna asignada a la derecha (caption, color `text.secondary`; "Sin asignar" si NONE_VALUE).
- Si mapeado: chips con los valores de las primeras 8 filas de esa columna (valores vacÃ­os omitidos).
- Si no mapeado: texto "TodavÃ­a no hay una columna elegida." en caption gris.
- El panel se muestra SIEMPRE que haya un archivo cargado (debajo del grid de mapeo, antes de los alias de workMode).
- ActualizaciÃ³n en tiempo real al cambiar cualquier select del grid.

**Criterios de aceptaciÃ³n:**
- [ ] Panel visible en cuanto hay archivo cargado.
- [ ] Los 5 campos obligatorios siempre aparecen en el panel.
- [ ] Los campos opcionales mapeados tambiÃ©n aparecen.
- [ ] Los chips muestran valores reales (no headers).
- [ ] Campo no mapeado â†’ texto gris, sin chips.
- [ ] ActualizaciÃ³n inmediata al cambiar un mapeo.

---

### 18.4 CR-02 (revisado) â€” Alias de Modalidad: ubicaciÃ³n inline

**RevisiÃ³n post-implementaciÃ³n:** el acordeÃ³n separado de aliases quedaba colapsado y el usuario no lo descubrÃ­a. La secciÃ³n de alias se moviÃ³ al **interior del acordeÃ³n "Mapeo de campos"**, debajo del grid, visible de forma inmediata al seleccionar la columna de Modalidad (con o sin auto-detecciÃ³n).

**Regla de negocio aÃ±adida:**
> Los selects de alias de Modalidad de trabajo se muestran inline dentro del accordion de mapeo, sin requerir interacciÃ³n adicional del usuario para descubrirlos.

---

### 18.5 CR-04 â€” Feedback de correcciÃ³n inline en filas con errores

**Solicitud:** Al editar un campo dentro de una fila con error, el mensaje de error debe desaparecer y reemplazarse por un texto verde que indique que el campo fue corregido. El borde de la card tambiÃ©n debe reflejar el estado.

**AnÃ¡lisis de impacto:**
- El reducer `S1_UPDATE_ROW` actualiza `result.normalized` pero no `result.errors` (que solo cambian al re-validar con el botÃ³n "Re-validar datos").
- SoluciÃ³n: en cada render de `InvalidRowCard`, ejecutar `validateSingle(result.normalized)` â€” la misma funciÃ³n de validaciÃ³n del hook `useRowValidation` â€” para obtener los errores **actuales** y comparar contra los errores **originales** (`result.errors`).
- Afecta `src/components/steps/Step1Panel.tsx` (componente `InvalidRowCard`).
- No cambia ningÃºn hook, reducer ni tipo.

**Reglas de UI:**
- Por cada error original `e` en `result.errors`:
  - Si `e` ya **no estÃ¡** en los errores actuales â†’ `âœ“ Campo: corregido` en `success.main`.
  - Si `e` **sigue presente** â†’ `â€¢ error` en `error.main`.
- Borde de la card: `warning.light` si hay errores pendientes, `success.light` si todos estÃ¡n resueltos.
- NÃºmero de fila: `warning.dark` â†’ `success.dark` cuando todos estÃ¡n resueltos.
- El botÃ³n "Siguiente" **no se desbloquea** hasta hacer "Re-validar datos" (ver CR-05).

---

### 18.6 CR-05 â€” Bloqueo de navegaciÃ³n por filas con errores en Paso 1

**Solicitud:** Si hay filas con error que no estÃ¡n omitidas, el botÃ³n "Siguiente" debe estar deshabilitado.

**AnÃ¡lisis de impacto:**
- `useWizardNavigation` ya bloquea Paso 1 si hay campos obligatorios sin mapear.
- Se aÃ±ade un segundo bloqueo: `step1.validationResults.filter(r => !r.valid && !r.omitted).length > 0`.
- `r.valid` solo se actualiza al ejecutar `runValidation` (carga de archivo o botÃ³n "Re-validar datos"). El feedback verde de CR-04 es visual inmediato; el desbloqueo definitivo requiere re-validar.
- Afecta exclusivamente `src/hooks/useWizardNavigation.ts`.

**Mensaje de bloqueo:** `"Hay N fila/s con errores sin resolver. CorregÃ­las, omitilas o re-validÃ¡ antes de continuar."`

**Reglas de negocio:**
> **RN-11:** En el Paso 1, la navegaciÃ³n al Paso 2 queda bloqueada si existe al menos una `ValidationResult` con `valid = false` y `omitted = false`. El usuario debe corregir los errores y re-validar, o marcar las filas como omitidas.

**Criterios de aceptaciÃ³n:**
- [ ] Con filas invÃ¡lidas no omitidas â†’ botÃ³n Siguiente deshabilitado y mensaje de bloqueo visible.
- [ ] Al hacer "Re-validar datos" y no quedar filas invÃ¡lidas â†’ botÃ³n se habilita.
- [ ] Al omitir todas las filas invÃ¡lidas â†’ botÃ³n se habilita.
- [ ] Si no se cargÃ³ archivo â†’ el bloqueo anterior (campos obligatorios sin mapear) ya actÃºa.

---

### 18.7 Resumen de archivos afectados â€” IteraciÃ³n 2 completa

| Archivo | CRs |
|---------|-----|
| `src/components/steps/Step1Panel.tsx` | CR-01, CR-02, CR-03, CR-04 |
| `src/hooks/useWizardNavigation.ts` | CR-05 |

### 18.8 Estado de implementaciÃ³n

| CR | Estado |
|----|--------|
| CR-01 Columnas exclusivas | âœ… Implementado |
| CR-02 Alias workMode como selects inline | âœ… Implementado |
| CR-03 Panel Vista previa | âœ… Implementado |
| CR-04 Feedback inline verde/rojo | âœ… Implementado |
| CR-05 Bloqueo navegaciÃ³n por filas con errores | âœ… Implementado |

---

## 19. CAMBIOS REQUERIDOS - ITERACION 3 (2026-04-30)

### 19.1 CR-06 - Autocompletado de lider cuando el rol tiene un unico candidato

**Solicitud:** En el Paso 5, si el rol marcado como lider para un equipo tiene una sola persona asignada en la relacion Rol / Equipo, autocompletar esa persona como lider.

**Analisis de impacto:**
- Afecta `src/components/steps/Step5Panel.tsx` y `src/hooks/useLeadersCatalog.ts`.
- Al cambiar el `Rol lider`, se calculan los candidatos del equipo para ese rol.
- Si el set de candidatos filtrados tiene longitud 1, el sistema debe asignar automaticamente esa persona como lider, sin requerir seleccion manual.

**Reglas de negocio anadidas:**

> **RN-12:** En el Paso 5, si el `Rol lider` seleccionado para un equipo tiene exactamente un miembro candidato en las asignaciones validas del Paso 4, el sistema debe autocompletar esa persona como lider.

**Criterios de aceptacion:**
- [ ] Si el rol seleccionado tiene 1 sola persona asignada en ese equipo -> se autocompleta la persona.
- [ ] El estado queda marcado como valido sin interaccion adicional del usuario.
- [ ] Si luego cambia el rol y el nuevo rol tiene varios candidatos -> ya no se autocompleta y se requiere definicion explicita.

---

### 19.2 CR-07 - Seleccion de alcance del liderazgo cuando hay multiples candidatos

**Solicitud:** En el Paso 5, si el `Rol lider` de un equipo tiene mas de una persona asignada, permitir elegir si lideran:
- uno o mas miembros especificos del rol
- o todos los miembros de ese rol en ese equipo

**Analisis de impacto:**
- Afecta `src/components/steps/Step5Panel.tsx`, `src/hooks/useLeadersCatalog.ts`, `src/hooks/useFinalJsonBuilder.ts` y `src/utils/types.ts`.
- El modelo de datos del Paso 5 deja de representar un solo `leaderPerson` y pasa a representar:
  - `leaderSelectionMode`: `'specific' | 'all'`
  - `leaderPersons`: `string[]`
- La validacion deja de exigir una sola persona y pasa a exigir:
  - al menos una persona en modo `specific`
  - todas las personas filtradas por el rol en modo `all`

**Reglas de negocio anadidas:**

> **RN-13:** Si el `Rol lider` tiene mas de una persona candidata, el usuario puede elegir entre `Miembros especificos` y `Todos los miembros del rol`.

> **RN-14:** En modo `Miembros especificos`, el usuario puede seleccionar una o varias personas, siempre que cada una exista como par `{role, member}` en las asignaciones validas del equipo.

> **RN-15:** En modo `Todos los miembros del rol`, el sistema debe considerar como lideres a todas las personas asignadas a ese rol dentro del equipo seleccionado.

**Criterios de aceptacion:**
- [ ] Con varios candidatos, aparece un selector de alcance de liderazgo.
- [ ] En modo `Miembros especificos`, se permite seleccion multiple.
- [ ] En modo `Todos los miembros del rol`, no hace falta elegir personas manualmente.
- [ ] Al cambiar el rol, solo se conservan las personas que siguen siendo validas para el nuevo filtro.

---

### 19.3 CR-08 - Serializacion del JSON final para liderazgo parcial

**Solicitud:** El JSON final debe reflejar correctamente cuando solo algunos miembros de un rol son lideres, sin marcar erroneamente como lider a todo el rol.

**Analisis de impacto:**
- Afecta `src/hooks/useFinalJsonBuilder.ts`.
- El modelo previo marcaba `isTeamLead` a nivel de `RoleGroup`, por lo que si un rol era lider se marcaba completo.
- Con liderazgo parcial, cuando un mismo rol tiene miembros lideres y no lideres dentro del mismo equipo, el builder debe separar el output en dos grupos.

**Reglas de negocio anadidas:**

> **RN-16:** Si un rol de un equipo tiene varios miembros y solo una parte de ellos fue seleccionada como lider, el JSON final debe generar dos `RoleGroup` para ese mismo `roleTypeId`: uno con `isTeamLead = true` para los miembros lideres, y otro con `isTeamLead = false` para los miembros restantes.

> **RN-17:** Si el usuario selecciona `Todos los miembros del rol`, el JSON final puede generar un unico `RoleGroup` con `isTeamLead = true` para ese rol dentro del equipo.

**Criterios de aceptacion:**
- [ ] Si un rol tiene 3 miembros y 1 fue elegido como lider -> el JSON separa 1 miembro en un grupo lider y 2 en un grupo no lider.
- [ ] Si un rol tiene 3 miembros y se elige `Todos` -> el JSON genera un unico grupo con los 3 miembros marcados como lideres.
- [ ] Si el rol lider no existia previamente en el agrupamiento esperado -> el builder crea igualmente el grupo correspondiente.

---

### 19.4 Resumen de archivos afectados - Iteracion 3

| Archivo | CRs |
|---------|-----|
| `src/components/steps/Step5Panel.tsx` | CR-06, CR-07 |
| `src/hooks/useLeadersCatalog.ts` | CR-06, CR-07 |
| `src/hooks/useFinalJsonBuilder.ts` | CR-08 |
| `src/utils/types.ts` | CR-07 |

### 19.5 Estado de implementacion

| CR | Estado |
|----|--------|
| CR-06 Autocompletado de lider por candidato unico | Implementado |
| CR-07 Seleccion de uno, varios o todos los miembros del rol | Implementado |
| CR-08 JSON final con liderazgo parcial correcto | Implementado |

---

## 20. CAMBIOS REQUERIDOS - ITERACION 4 (2026-04-30)

### 20.1 CR-09 - Navegacion por breadcrumb con persistencia de datos

**Solicitud:** Permitir que el usuario se mueva entre pasos desde el breadcrumb sin perder la informacion ya cargada.

**Analisis de impacto:**
- Afecta `src/hooks/useWizardNavigation.ts`, `src/components/wizard/StepperPills.tsx` y `src/App.tsx`.
- El estado de cada paso ya vive en `Context API`, por lo que no debe resetearse al navegar entre pasos.
- El breadcrumb deja de depender solo de `currentStep` y pasa a depender del ultimo paso habilitado.

**Reglas de negocio anadidas:**

> **RN-18:** La navegacion entre pasos desde el breadcrumb no debe limpiar ni reinicializar los datos ya cargados, siempre que no exista un cambio explicito de fuente o un reset dependiente.

> **RN-19:** El usuario puede navegar hacia atras libremente a cualquier paso previo.

> **RN-20:** El usuario puede navegar hacia adelante solo hasta el ultimo paso habilitado, entendido como el ultimo paso cuyo anterior ya fue completado segun sus reglas de validacion.

**Criterios de aceptacion:**
- [ ] Si el usuario completa un paso y avanza, puede volver atras desde el breadcrumb sin perder datos.
- [ ] Si vuelve a un paso anterior y luego reingresa a uno ya habilitado, los datos previamente cargados siguen presentes.
- [ ] No se puede saltar a un paso futuro que aun no haya quedado habilitado por la finalizacion del anterior.

---

### 20.2 CR-10 - Habilitacion progresiva del breadcrumb

**Solicitud:** El breadcrumb debe reflejar que pasos estan disponibles para navegar y cuales siguen bloqueados.

**Analisis de impacto:**
- Afecta `src/hooks/useWizardNavigation.ts` y `src/components/wizard/StepperPills.tsx`.
- Se incorpora el concepto de `highestAvailableStep` para determinar hasta donde puede navegar el usuario.
- Un paso queda clickable si `step <= highestAvailableStep`.

**Reglas de negocio anadidas:**

> **RN-21:** El breadcrumb debe habilitar todos los pasos hasta `highestAvailableStep`, inclusive, y deshabilitar los pasos posteriores.

> **RN-22:** `highestAvailableStep` se calcula en funcion del cumplimiento secuencial de las reglas de bloqueo de los pasos 1, 2 y 3; el paso 4 no bloquea el acceso al 5.

**Criterios de aceptacion:**
- [ ] Los pasos previos y el paso actual pueden seleccionarse desde el breadcrumb.
- [ ] Los pasos futuros bloqueados aparecen visualmente deshabilitados.
- [ ] Si un paso deja de cumplir sus validaciones, no debe habilitar pasos adicionales nuevos hasta corregirse.

---

### 20.3 Resumen de archivos afectados - Iteracion 4

| Archivo | CRs |
|---------|-----|
| `src/hooks/useWizardNavigation.ts` | CR-09, CR-10 |
| `src/components/wizard/StepperPills.tsx` | CR-09, CR-10 |
| `src/App.tsx` | CR-09 |

### 20.4 Estado de implementacion

| CR | Estado |
|----|--------|
| CR-09 Navegacion por breadcrumb con persistencia | Implementado |
| CR-10 Habilitacion progresiva del breadcrumb | Implementado |
