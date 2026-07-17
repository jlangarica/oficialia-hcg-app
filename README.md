<div align="center">

<!-- ═══════════════════════════════════════════════════════════════ -->
<!--                    HEADER / BRANDING                           -->
<!-- ═══════════════════════════════════════════════════════════════ -->

<img src="https://img.shields.io/badge/Oficialía_Digital-v2.0.0-0A0A0A?style=for-the-badge&labelColor=0A0A0A&color=3B82F6" alt="Version" />
<img src="https://img.shields.io/badge/Status-Producción-22C55E?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Im0xMiAyIDMuMDkgNi4yNkwyMiA5LjI3bC01IDQuODcgMS4xOCA2Ljg4TDEyIDE3LjdsLTYuMTggMy4yNUw3IDE0LjE0IDIgOS4yN2w2LjkxLTEuMDFMMTIgMnoiLz48L3N2Zz4=" alt="Status" />
<img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
<img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
<img src="https://img.shields.io/badge/ES_Modules-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="ES Modules" />
<img src="https://img.shields.io/badge/License-Privado-red?style=for-the-badge" alt="License" />

<br/>
<br/>

# 🏛️ Oficialía Digital

### Sistema de Digitalización Documental Institucional

Una plataforma de código moderno para la **captura, procesamiento, validación y archivo** de documentos oficiales mediante escaneo físico inteligente, edición interactiva de páginas y extracción automatizada de metadatos.

<br/>

<img src="https://img.shields.io/badge/⚡_WebSocket_Real--Time-0A0A0A?style=flat-square&color=8B5CF6" />
<img src="https://img.shields.io/badge/🔒_Anti--XSS-0A0A0A?style=flat-square&color=EF4444" />
<img src="https://img.shields.io/badge/🎨_Glass_Morphism_UI-0A0A0A?style=flat-square&color=06B6D4" />
<img src="https://img.shields.io/badge/📱_Responsive-0A0A0A?style=flat-square&color=F59E0B" />
<img src="https://img.shields.io/badge/♿_A11y-0A0A0A?style=flat-square&color=22C55E" />
<img src="https://img.shields.io/badge/🌙_Dark_Mode-0A0A0A?style=flat-square&color=6366F1" />

</div>

<br/>

---

## 📋 Índice

- [Visión General](#-visión-general)
- [Flujo del Wizard](#-flujo-del-wizard)
- [Arquitectura](#-arquitectura)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Protocolo WebSocket](#-protocolo-websocket)
- [Características del Frontend](#-características-del-frontend)
- [Seguridad](#-seguridad)
- [Comandos Disponibles](#-comandos-disponibles)
- [Variables de Entorno](#-variables-de-entorno)
- [Roadmap](#-roadmap)

---

## 🎯 Visión General

**Oficialía Digital** es un sistema integral de digitalización diseñado para instituciones gubernamentales que automatiza el ciclo completo de documentos oficiales:

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│              │    │              │    │              │    │              │    │              │
│  📸 CAPTURA  │───▶│ 👁️ PREVIEW   │───▶│  🤖 IA       │───▶│ ✅ VALIDATE  │───▶│ 🎉 SUCCESS   │
│              │    │              │    │              │    │              │    │              │
│ Escaneo HW  │    │ Drag & Drop  │    │ Extracción   │    │ Revisión de  │    │ Archivo      │
│ Carga PDF   │    │ Rotación     │    │ Metadatos    │    │ Metadatos    │    │ Indexación   │
│              │    │ Eliminación  │    │ Clasificación│    │ Firma        │    │ Notificación │
│              │    │              │    │              │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

> Del escáner físico al repositorio institucional en un flujo continuo, validado y sin fricción.

---

## 🔄 Flujo del Wizard

El sistema guía al operador mediante un **wizard de 5 pasos** con transiciones animadas:

| Paso | Vista | Descripción |
|:----:|-------|-------------|
| **1** | 📸 **Captura** | Digitalización física mediante NAPS2 o carga de PDF existente. Opciones de duplex y resolución (150–600 DPI). |
| **2** | 👁️ **Preview** | Editor interactivo con drag & drop para reordenar, rotar (°90) o eliminar páginas antes del procesamiento. |
| **3** | 🤖 **Extracción IA** | Clasificación automática del documento, extracción de metadatos y validación de firmas. |
| **4** | ✅ **Validación** | Revisión humana de campos extraídos: clasificación, folio, remitente, fecha y asunto. Indicadores de confianza. |
| **5** | 🎉 **Confirmación** | Registro exitoso con folio asignado, subida a Google Drive, notificación por email y asiento en Libro de Gobierno Digital. |

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        NAVEGADOR (Frontend)                             │
│                                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Capture  │  │ Preview  │  │    AI    │  │ Validate │  │ Success  │ │
│  │  Module  │  │  Module  │  │  Module  │  │  Module  │  │  Module  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┘ │
│       │              │              │              │                     │
│  ┌────┴──────────────┴──────────────┴──────────────┴─────────────────┐ │
│  │                    State Manager (AppState)                       │ │
│  │         Custom Events Bus  ·  ws-bridge  ·  helpers              │ │
│  └───────────────────────────────┬───────────────────────────────────┘ │
│                                  │ WebSocket                           │
└──────────────────────────────────┼─────────────────────────────────────┘
                                   │
                         ┌─────────▼──────────┐
                         │   ws://localhost    │
                         │      :8000          │
                         │   (ScanBridge WS)   │
                         └─────────┬──────────┘
                                   │
┌──────────────────────────────────┼─────────────────────────────────────┐
│                        SERVIDOR (Backend)                               │
│                                  │                                      │
│  ┌───────────────────────────────▼────────────────────────────────────┐│
│  │               ScanBridgeHandler (WebSocket)                        ││
│  │         Validación Pydantic  ·  Orquestación de servicios         ││
│  └────────┬─────────────────────────────────────────────┬─────────────┘│
│           │                                             │              │
│  ┌────────▼─────────┐                        ┌──────────▼───────────┐ │
│  │  ScannerService   │                        │   PDFProcessor       │ │
│  │                   │                        │                      │ │
│  │  NAPS2 CLI        │                        │  PyMuPDF (fitz)      │ │
│  │  - Escaneo HW     │                        │  - Thumbnails        │ │
│  │  - Detección USB  │                        │  - Reordenamiento    │ │
│  │  - Duplex/Res     │                        │  - Rotación          │ │
│  │  - Timeouts       │                        │  - Carga base64      │ │
│  └──────────────────┘                        └──────────────────────┘ │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  Settings (config.py)  ·  Models (dataclass)  ·  Exceptions     │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                   │
                         ┌─────────▼──────────┐
                         │   NAPS2 Console     │
                         │  (Hardware Scanner) │
                         │   naps2.console     │
                         └────────────────────┘
```

---

## 💻 Stack Tecnológico

<table>
<tr>
<td align="center"><strong>Backend</strong></td>
<td align="center"><strong>Frontend</strong></td>
<td align="center"><strong>Infraestructura</strong></td>
</tr>
<tr>
<td>

| Componente | Tecnología |
|---|---|
| Framework | **FastAPI** ≥ 0.100 |
| Server | **Uvicorn** (ASGI) |
| PDF Engine | **PyMuPDF** (fitz) |
| Validación | **Pydantic v2** |
| Scanner CLI | **NAPS2 Console** |
| Concurrencia | **asyncio** |

</td>
<td>

| Componente | Tecnología |
|---|---|
| Bundler | **Vite 6** |
| Module System | **ES Modules** |
| CSS Processor | **PostCSS + Autoprefixer** |
| Iconos | **Material Symbols** |
| Fuentes | **Plus Jakarta Sans** |
| Single File | **vite-plugin-singlefile** |

</td>
<td>

| Componente | Tecnología |
|---|---|
| Protocolo | **WebSocket (WS)** |
| Serialización | **JSON** |
| Variables | **ENV (SCANBRIDGE\_)** |
| Plataforma | **Linux / Fedora** |
| Modo | **Offline-first** |
| Bundle | **SPA Monolítico** |

</td>
</tr>
</table>

---

## 📁 Estructura del Proyecto

```
jlangarica-oficialia-hcg-app/
│
├── 📦 package.json                    # Dependencias y scripts del frontend
├── ⚙️ postcss.config.js               # Configuración PostCSS
├── ⚙️ vite.config.js                  # Configuración del bundler
│
├── 🐍 backend/                        # ── SERVIDOR PYTHON ──────────────
│   ├── 📋 requirements.txt            #    Dependencias pip
│   └── 📁 app/
│       ├── 🚀 main.py                 #    Punto de entrada FastAPI
│       ├── ⚙️ config.py               #    Settings inmutables + ENV
│       ├── 🚨 exceptions.py           #    Excepciones de dominio
│       ├── 📊 models.py               #    Dataclasses (ScanResult, PageThumbnail...)
│       ├── 📝 schemas.py              #    Esquemas Pydantic (comandos WS)
│       ├── 📁 handlers/
│       │   └── 🔌 websocket.py        #    Orquestador de comandos WS
│       └── 📁 services/
│           ├── 🖨️ scanner.py          #    Interacción con NAPS2 CLI
│           └── 📄 pdf_processor.py    #    Thumbnails, ediciones, carga
│
└── 🌐 src/                            # ── FRONTEND ─────────────────────
    ├── 🏠 index.html                  #    Shell SPA
    ├── 📁 components/                 #    HTML parciales (injection)
    │   ├── Ambient.html               #      Fondo animado (orbs)
    │   ├── MainHeader.html            #      Stepper + badges de estado
    │   ├── Sidebar.html               #      Navegación lateral
    │   ├── StepCapture.html           #      Paso 1: Escaneo / carga
    │   ├── StepPreview.html           #      Paso 2: Editor interactivo
    │   ├── StepAIExtraction.html      #      Paso 3: Procesamiento IA
    │   ├── StepValidate.html          #      Paso 4: Validación de campos
    │   ├── StepSuccess.html           #      Paso 5: Confirmación
    │   └── ToastContainer.html        #      Contenedor de notificaciones
    ├── 📁 scripts/                    #    Módulos ES (lógica)
    │   ├── main.js                    #      Entry point + orchestración
    │   ├── state.js                   #      Estado global de la app
    │   ├── ws-bridge.js               #      WebSocket + reconexión exp.
    │   ├── wizard.js                  #      Navegación + transiciones
    │   ├── capture-actions.js         #      Acciones de escaneo/carga
    │   ├── capture-ui.js              #      UI de estado de conexión
    │   ├── preview-grid.js            #      Grid de miniaturas + DnD
    │   ├── preview-actions.js         #      Rotar/eliminar/reordenar
    │   ├── preview-confirm.js         #      Confirmación de estructura
    │   ├── toast.js                   #      Sistema de notificaciones
    │   ├── theme.js                   #      Toggle claro/oscuro
    │   ├── helpers.js                 #      $, escapeHTML, constantes
    │   ├── progress-zoom.js           #      Ring SVG + zoom PDF
    │   └── reveal.js                  #      Animaciones stagger
    └── 📁 styles/                     #    Hojas de estilo CSS
        ├── tokens.css                 #      Variables CSS (design tokens)
        ├── base.css                   #      Reset + tipografía base
        ├── ambient.css                #      Orbs + film grain
        ├── app-window.css             #      Layout principal
        ├── sidebar.css                #      Sidebar + nav items
        ├── main-header.css            #      Header + stepper
        ├── glass-card.css             #      Wizard viewport + glass
        ├── step-capture.css           #      Estilos del paso 1
        ├── step-preview.css           #      Estilos del paso 2
        ├── step-ai.css                #      Estilos del paso 3
        ├── step-validate.css          #      Estilos del paso 4
        ├── step-success.css           #      Estilos del paso 5
        ├── scan-progress-ring.css     #      Anillo de progreso SVG
        ├── page-controls.css          #      Controles overlay de páginas
        ├── toast.css                  #      Notificaciones toast
        ├── stagger.css                #      Animaciones reveal
        ├── responsive.css             #      Media queries
        └── accessibility.css          #      reduced-motion + focus
```

---

## 🚀 Instalación

### Prerrequisitos

| Requisito | Versión mínima | Verificación |
|---|---|---|
| **Python** | ≥ 3.10 | `python3 --version` |
| **Node.js** | ≥ 18.x | `node --version` |
| **NAPS2** | ≥ 7.x | `naps2.console --version` |
| **pip** | ≥ 23.x | `pip --version` |

### Backend

```bash
# 1. Clonar el repositorio
git clone https://github.com/jlangarica/oficialia-hcg-app.git
cd oficialia-hcg-app

# 2. Crear entorno virtual
python3 -m venv .venv
source .venv/bin/activate

# 3. Instalar dependencias
pip install -r backend/requirements.txt

# 4. Iniciar el servidor
cd backend
python -m app.main
```

> 🟢 El servidor WebSocket estará disponible en `ws://127.0.0.1:8000`

### Frontend

```bash
# 1. Instalar dependencias Node
npm install

# 2. Modo desarrollo (hot reload)
npm run dev

# 3. Build de producción
npm run build

# 4. Build como archivo único (SPA monolítico)
npm run build -- --mode singlefile

# 5. Vista previa del build
npm run preview
```

---

## ⚙️ Configuración

### Variables de Entorno

Todas las configuraciones se gestionan mediante variables de entorno con el prefijo `SCANBRIDGE_`:

| Variable | Default | Descripción |
|---|---|---|
| `SCANBRIDGE_RAW_PDF_PATH` | `/tmp/raw_scan.pdf` | Ruta temporal del PDF escaneado |
| `SCANBRIDGE_PROCESSED_PDF_PATH` | `/tmp/oficialia_final_processed.pdf` | Ruta del PDF procesado final |
| `SCANBRIDGE_SCANNER_PROFILE` | `Oficialia_Estandar` | Perfil de escáner NAPS2 |
| `SCANBRIDGE_DEFAULT_RESOLUTION` | `300` | DPI por defecto para escaneo |
| `SCANBRIDGE_THUMBNAIL_DPI` | `72` | DPI para generación de miniaturas |
| `SCANBRIDGE_HOST` | `127.0.0.1` | Host del servidor WebSocket |
| `SCANBRIDGE_PORT` | `8000` | Puerto del servidor WebSocket |
| `SCANBRIDGE_SCAN_TIMEOUT` | `300` | Timeout de escaneo en segundos |

### Ejemplo de configuración en contenedor

```bash
export SCANBRIDGE_HOST=0.0.0.0
export SCANBRIDGE_PORT=9000
export SCANBRIDGE_DEFAULT_RESOLUTION=600
export SCANBRIDGE_SCAN_TIMEOUT=600
```

---

## 🔌 Protocolo WebSocket

El frontend y backend se comunican mediante un canal WebSocket bidireccional con mensajes JSON.

### Comandos (Frontend → Backend)

```jsonc
// Escaneo físico
{
  "command": "START_SCAN",
  "duplex": true,
  "resolution": 300
}

// Aplicar ediciones (reordenamiento + rotación)
{
  "command": "APPLY_EDITS",
  "operations": [
    { "source_index": 0, "rotation": 0 },
    { "source_index": 2, "rotation": 90 },
    { "source_index": 1, "rotation": 0 }
  ]
}

// Carga de PDF local (sin escáner)
{
  "command": "LOAD_LOCAL_PDF",
  "base64_data": "data:application/pdf;base64,JVBERi0x..."
}
```

### Eventos (Backend → Frontend)

| Evento | Payload | Descripción |
|---|---|---|
| `HARDWARE_STATUS` | `{ online, model }` | Estado del escáner físico |
| `SCAN_STARTED` | — | Escaneo iniciado |
| `scan_status` | `{ progress, message }` | Progreso del escaneo (0–100) |
| `SCAN_COMPLETED` | `{ output_path }` | PDF generado en disco |
| `THUMBNAILS_READY` | `{ pages[] }` | Miniaturas listas (base64) |
| `EDITS_APPLIED` | `{ output_path }` | PDF procesado guardado |
| `SCAN_ERROR` | `{ message }` | Error en el proceso |

### Diagrama de secuencia

```
 Frontend                   Backend                  NAPS2
    │                         │                       │
    │── START_SCAN ──────────▶│                       │
    │                         │── naps2.console ─────▶│
    │◀── SCAN_STARTED ───────│                       │
    │◀── scan_status (15%) ──│                       │
    │                         │◀── stdout/stderr ─────│
    │◀── scan_status (70%) ──│                       │
    │◀── SCAN_COMPLETED ─────│                       │
    │                         │── PyMuPDF render      │
    │◀── THUMBNAILS_READY ───│                       │
    │                         │                       │
    │   [Usuario edita páginas]                       │
    │                         │                       │
    │── APPLY_EDITS ─────────▶│                       │
    │                         │── PyMuPDF edit        │
    │◀── EDITS_APPLIED ──────│                       │
    │                         │                       │
```

---

## ✨ Características del Frontend

### 🎨 Sistema Visual

- **Glass Morphism** con `backdrop-filter: blur()` multicapa
- **Orbs animados** GPU-composited (`will-change`, `translate3d`)
- **Film grain overlay** con SVG fractal noise
- **Stagger reveal** con delays progresivos para entrada de elementos
- **Transiciones atómicas** en el wizard (fade-out → swap → fade-in con lock)

### 🌗 Temas

```css
/* Design tokens centralizados */
:root {
  --bg-body:      #f5f5f7;
  --text-1:       #1d1d1f;
  --glass-border:  rgba(255,255,255,0.18);
  /* ... */
}

[data-theme="dark"] {
  --bg-body:      #0a0a0a;
  --text-1:       #f5f5f7;
  --glass-border:  rgba(255,255,255,0.08);
  /* ... */
}
```

### 🔒 Anti-XSS

```javascript
// Sanitización obligatoria antes de innerHTML
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, (tag) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    "'": '&#39;', '"': '&quot;'
  }[tag]));
}

// Los toasts usan textContent (intrínsecamente seguro)
msgSpan.textContent = message;
```

### ♿ Accesibilidad

- `aria-label` en todos los botones de acción
- `role="progressbar"` con `aria-valuenow` dinámico
- `aria-invalid` y `aria-describedby` para campos con warnings
- `focus-visible` con outline de alto contraste
- `prefers-reduced-motion` respeta configuración del OS
- Navegación por teclado: `←` `→` para wizard, `Ctrl+B` para sidebar

### 🔄 Reconexión WebSocket

```javascript
// Backoff exponencial con jitter
const delay = Math.min(
  1000 * Math.pow(2, attempts),  // exponencial
  15000                           // máximo 15s
) + jitter;                       // anti-thundering herd
```

### 📐 Rendimiento

| Técnica | Aplicación |
|---|---|
| `DocumentFragment` | Inserción masiva de miniaturas (1 reflow) |
| Event delegation | 6 listeners en el padre sustituyen 6×N individuales |
| `contain: layout style` | Aislamiento de reflow en componentes |
| `will-change: transform` | Composición GPU para orbs y transiciones |
| Pre-computed constants | Circunferencia del ring SVG calculada una vez |
| GC-friendly cleanup | `base64 = null` antes de `splice` para liberar strings pesados |

---

## 🛡️ Seguridad

| Vector | Mitigación |
|---|---|
| **XSS (innerHTML)** | `escapeHTML()` en todos los datos dinámicos |
| **XSS (textos)** | `textContent` para mensajes de usuario |
| **Inyección de comandos** | Validación Pydantic con discriminadores `Literal` |
| **Path traversal** | Rutas definidas por ENV, no por input del usuario |
| **Timeout de hardware** | `asyncio.wait_for` con kill seguro del proceso |
| **Reconexión segura** | Teardown completo del socket anterior antes de reconectar |

---

## 📜 Comandos Disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con hot reload |
| `npm run build` | Build optimizado de producción |
| `npm run preview` | Vista previa del build de producción |
| `python -m app.main` | Iniciar servidor backend |

---

## 🗺️ Roadmap

- [ ] Autenticación de WebSocket (token compartido)
- [ ] Validación de magic bytes en carga de PDF
- [ ] Implementación completa del Step 3 (progreso IA)
- [ ] Persistencia de estado entre sesiones
- [ ] Exportación de metadatos en formato CSV/XML
- [ ] Integración con Google Drive API
- [ ] Notificaciones por correo electrónico
- [ ] Soporte para múltiples escáneres simultáneos
- [ ] Panel de administración de documentos archivados
- [ ] Pruebas unitarias y de integración

---

<br/>

<div align="center">

**Hecho con rigor institucional**

<img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" />
<img src="https://img.shields.io/badge/PyMuPDF-EC1C24?style=flat-square" />
<img src="https://img.shields.io/badge/Pydantic-E92063?style=flat-square&logo=pydantic&logoColor=white" />
<img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" />
<img src="https://img.shields.io/badge/NAPS2-2D2D2D?style=flat-square" />
<img src="https://img.shields.io/badge/Material_Symbols-4285F4?style=flat-square&logo=google&logoColor=white" />

<br/>

<sub>Oficialía Digital v2.0.0 · H. Congreso de Guanajuato · 2026</sub>

</div>