# ⚡ Sportacus Web - sistema de gestion deportiva 

**Sportacus** es una aplicación web moderna y responsiva diseñada para la gestión de academias y clubes deportivos. Utiliza una arquitectura liviana donde la interfaz se conecta directamente con **Google Sheets** (usado como base de datos) a través de **Google Apps Script**.

---

## 🚀 Funcionalidades Principales

- **Doble Perfil de Usuario:** Acceso diferenciado para Alumnos y Administradores.
- **Búsqueda Inteligente:** Permite encontrar alumnos por DNI o por Nombre/Apellido.
- **Métricas de Rendimiento:** Visualización de puntajes físicos (flexiones, abdominales, % grasa, masa magra).
- **Gestión de Pagos:** Consulta rápida de estados de cuenta y deudas.
- **Automatización de Cobranzas:** Botón directo para enviar recordatorios personalizados por **WhatsApp**.
- **Panel Administrativo:** Herramientas exclusivas para gestionar la lista de socios y visualizar deudores masivamente.

---

## 🛠️ Tecnologías

Este proyecto está construido sin necesidad de servidores complejos:
* **Frontend:** HTML5, CSS3 (Custom Properties & Flexbox/Grid) y JavaScript Vanilla (ES6+).
* **Backend / DB:** Google Apps Script (GAS) y Google Sheets API.

---

## 📂 Estructura del Código

- `index.html`: Contiene la estructura de las tres pantallas (Inicio, Login y Panel).
- `style.css`: Estética "Dark Mode" con efectos de luz neón y diseño adaptable a móviles.
- `script.js`: Lógica de navegación, autenticación de usuario y consumo de la API de Google.

---

## ⚙️ Configuración e Instalación

1. **Planilla de Google:** Debe contener las hojas de "Socios" y "Rendimiento" con los encabezados correctos.
2. **Apps Script:** - Copiar el código `.gs` en el editor de Google Sheets.
   - Implementar como **"Aplicación Web"**.
   - Dar permisos de acceso a "Cualquier persona" (Anyone).
3. **Vincular:** Copiar la URL generada por Google y pegarla en la constante `googleScriptURL` dentro de `script.js`.

---

## 🧑‍💻 Manual de Uso Rápido

### **Para el Alumno**
1. Seleccionar "Soy Alumno".
2. Ingresar DNI o Nombre.
3. Consultar resultados en pantalla.

### **Para el Administrador**
1. Seleccionar "Soy Administrador" (Credenciales por defecto: `admin` / `admin123`).
2. Usar el botón "Cargar Mensajes de Deudores" para ver la lista de cobranza.
3. Usar el icono de WhatsApp para enviar avisos de deuda.

---

## 📝 Notas de Versión
* **v1.0.0:** Lanzamiento inicial con integración de búsqueda dual y sistema de intereses automático.