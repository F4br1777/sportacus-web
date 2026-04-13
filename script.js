// =====================================================
// SPORTACUS 
// Conecta la interfaz con Google Sheets via Apps Script que lo usamos como una "base de datos" 
// =====================================================



// URL del Apps Script publicado como Web App
const googleScriptURL = 'https://script.google.com/macros/s/AKfycbzOWUWObCDZRuaZaeLgxD53sqZImViq83OJzaXsZAWp-9hAla-nDWwLJi5E93uba5o/exec';

// URL de la hoja de cálculo (para el botón "Abrir Lista")
const googleSheetURL  = 'https://docs.google.com/spreadsheets/d/1nBoSNCcUf7JOeYI-Oj2DLNvchOrStHg8iYRWGQNmXfs/edit?gid=0#gid=0';

// contraseñas 
const USERS = {
    alumno: { user: "alumno", pass: "1234" },
    admin:  { user: "admin",  pass: "admin123" }
};


// =====================================================
// REFERENCIAS AL HTML - Elementos del DOM
// =====================================================

// Secciones principales (pantallas)
const roleSelectionSection = document.getElementById('role-selection-section');
const loginFormSection     = document.getElementById('login-form-section');
const mainPanelSection     = document.getElementById('main-panel-section');
const resultSection        = document.getElementById('result-section');
const adminTools           = document.getElementById('admin-tools');

// Botones de navegación
const btnRoleAlumno      = document.getElementById('btn-role-alumno');
const btnRoleAdmin       = document.getElementById('btn-role-admin');
const loginButton        = document.getElementById('login-button');
const searchButton       = document.getElementById('search-button');
const backToRoleButton   = document.getElementById('back-to-role-button');
const logoutButton       = document.getElementById('logout-button');
const openSheetButton    = document.getElementById('open-sheet-button');
const loadDeudoresButton = document.getElementById('load-deudores-button');

// Input de búsqueda
const dniInput = document.getElementById('dni-input');


// =====================================================
// ESTADO GLOBAL
// =====================================================

// Guarda el rol actual del usuario logueado ('alumno' o 'admin')
let currentUserRole = '';


// =====================================================
// NAVEGACIÓN - Manejo de pantallas
// =====================================================

// Oculta todas las pantallas y muestra solo la indicada
// También limpia los resultados anteriores al cambiar de pantalla
function showScreen(screenToShow) {
    roleSelectionSection.classList.add('hidden');
    loginFormSection.classList.add('hidden');
    mainPanelSection.classList.add('hidden');
    resultSection.innerHTML = '';
    screenToShow.classList.remove('hidden');
}

// Al elegir "Soy Alumno": guarda el rol y va al login
btnRoleAlumno.addEventListener('click', () => {
    currentUserRole = 'alumno';
    document.getElementById('main-panel-title').textContent = 'Consultar mi Estado';
    adminTools.classList.add('hidden'); // Aseguramos que no vea herramientas de admin
    showScreen(mainPanelSection); // Saltamos el login
});

// Al elegir "Soy Administrador": guarda el rol y va al login
btnRoleAdmin.addEventListener('click', () => {
    currentUserRole = 'admin';
    document.getElementById('login-title').textContent = 'Iniciar Sesión como Administrador';
    showScreen(loginFormSection);
});

// Botón "Volver" en el login: regresa a la selección de rol
backToRoleButton.addEventListener('click', () => showScreen(roleSelectionSection));

// Botón "Cerrar Sesión": resetea el rol y vuelve al inicio
logoutButton.addEventListener('click', () => {
    currentUserRole = '';
    showScreen(roleSelectionSection);
});


// =====================================================
// LOGIN - Validación de credenciales
// =====================================================

loginButton.addEventListener('click', () => {
    const username = document.getElementById('username-input').value;
    const password = document.getElementById('password-input').value;

    // Verificamos que el usuario y contraseña coincidan con el rol elegido
    if (currentUserRole && USERS[currentUserRole] &&
        USERS[currentUserRole].user === username &&
        USERS[currentUserRole].pass === password) {

        // Login exitoso como ADMIN
        if (currentUserRole === 'admin') {
            document.getElementById('main-panel-title').textContent = 'Panel de Administrador';
            adminTools.classList.remove('hidden');
            cargarDashboard(); // Cargamos las estadísticas automáticamente
        } 
        // Login exitoso como ALUMNO
        else {
            document.getElementById('main-panel-title').textContent = 'Buscar Alumno';
            adminTools.classList.add('hidden'); // El alumno no ve las herramientas de admin
        }

        showScreen(mainPanelSection);

        // Actualizamos el placeholder para indicar que se puede buscar por nombre también
        dniInput.placeholder = 'Buscar por DNI o Nombre...';

        // Limpiamos los campos del login por seguridad
        document.getElementById('username-input').value = '';
        document.getElementById('password-input').value = '';

    } else {
        // Login fallido: borde rojo en el campo contraseña como feedback visual
        const passInput = document.getElementById('password-input');
        passInput.style.borderColor = '#ff4d4d';
        setTimeout(() => passInput.style.borderColor = '', 1500); // Se restaura después de 1.5s
        alert("Usuario o contraseña incorrectos.");
    }
});

// Permitir hacer login presionando Enter en el campo contraseña
document.getElementById('password-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') loginButton.click();
});


// =====================================================
// ACCIONES DEL PANEL ADMIN
// =====================================================

// Abre la hoja de cálculo en una nueva pestaña
openSheetButton.addEventListener('click', () => window.open(googleSheetURL, '_blank'));

// Carga la lista de deudores al hacer clic
loadDeudoresButton.addEventListener('click', cargarDeudores);


// =====================================================
// BÚSQUEDA - Por DNI o por Nombre
// =====================================================

searchButton.addEventListener('click', () => {
    const q = dniInput.value.trim();

    if (!q) {
        mostrarMensaje("Por favor, ingresá un DNI o nombre.");
        return;
    }

    // Detectamos automáticamente si es una búsqueda numérica (DNI) o textual (nombre)
    // Limpiamos puntos, guiones y espacios antes de verificar
    const isNumeric = /^\d+$/.test(q.replace(/[.\-\s]/g, ''));

    if (isNumeric) {
        // Es un DNI: quitamos caracteres especiales y buscamos por DNI
        const dni = q.replace(/[.\-\s]/g, '');
        buscarPorDni(dni);
    } else {
        // Es un nombre: buscamos por texto
        buscarPorNombre(q);
    }
});

// También se puede buscar presionando Enter
dniInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') searchButton.click();
});


// =====================================================
// BUSCAR POR DNI - Consulta al Apps Script
// =====================================================

async function buscarPorDni(dni) {
    mostrarMensaje("Buscando...");
    try {
        // Pedimos los datos básicos del alumno (nombre, horario, estado de cuenta)
        const alumnoResponse = await fetch(`${googleScriptURL}?action=queryDni&dni=${dni}`);
        if (!alumnoResponse.ok) throw new Error('Error al conectar con el servidor.');
        const alumno = await alumnoResponse.json();

        // Si es admin y encontramos al alumno, también pedimos sus puntajes físicos
        let puntaje = null;
        if (currentUserRole === 'admin' && alumno.nombreCompleto) {
            const puntajeResponse = await fetch(`${googleScriptURL}?action=queryPuntaje&dni=${dni}`);
            if (puntajeResponse.ok) puntaje = await puntajeResponse.json();
        }

        resultSection.innerHTML = '';
        mostrarResultadoAlumno(alumno, puntaje);

    } catch (error) {
        mostrarMensaje(`Error: ${error.message}`);
    }
}


// =====================================================
// BUSCAR POR NOMBRE - Consulta al Apps Script
// =====================================================

async function buscarPorNombre(nombre) {
    mostrarMensaje("Buscando por nombre...");
    try {
        const res = await fetch(`${googleScriptURL}?action=queryNombre&nombre=${encodeURIComponent(nombre)}`);
        if (!res.ok) throw new Error('Error al conectar con el servidor.');
        const data = await res.json();

        resultSection.innerHTML = '';

        // Sin resultados
        if (!data || data.length === 0) {
            mostrarMensaje("No se encontraron alumnos con ese nombre.");
            return;
        }

        // Un solo resultado: lo mostramos directo sin título
        if (data.length === 1) {
            mostrarResultadoAlumno(data[0], null);
            return;
        }

        // Múltiples resultados: mostramos cuántos encontramos y listamos todos
        const titulo = document.createElement('p');
        titulo.className = 'message';
        titulo.textContent = `Se encontraron ${data.length} alumnos:`;
        resultSection.appendChild(titulo);

        data.forEach(alumno => mostrarResultadoAlumno(alumno, null));

    } catch (error) {
        mostrarMensaje(`Error: ${error.message}`);
    }
}


// =====================================================
// DASHBOARD - Estadísticas para el admin
// =====================================================

async function cargarDashboard() {
    // Si ya existe una card de dashboard, la eliminamos antes de crear una nueva
    let dash = document.getElementById('dashboard-card');
    if (dash) dash.remove();

    // Creamos la tarjeta de estadísticas con valores placeholder "..."
    dash = document.createElement('div');
    dash.id = 'dashboard-card';
    dash.className = 'card';
    dash.innerHTML = `
        <h2 style="text-align:left; font-size:16px; letter-spacing:2px; color:var(--text2); margin-bottom:16px;">
            ESTADÍSTICAS
        </h2>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <!-- Contador de deudores -->
            <div style="background:var(--bg2); border:1px solid var(--border); border-radius:8px; padding:14px; text-align:center;">
                <div style="font-size:28px; font-weight:bold; color:var(--neon); text-shadow:var(--neon-glow);" id="dash-deudores">...</div>
                <div style="font-size:11px; letter-spacing:2px; color:var(--text2); margin-top:4px;">DEUDORES</div>
            </div>
            <!-- Monto total de deuda -->
            <div style="background:var(--bg2); border:1px solid var(--border); border-radius:8px; padding:14px; text-align:center;">
                <div style="font-size:28px; font-weight:bold; color:#ff4d4d; text-shadow:0 0 10px rgba(255,77,77,0.3);" id="dash-monto">...</div>
                <div style="font-size:11px; letter-spacing:2px; color:var(--text2); margin-top:4px;">DEUDA TOTAL</div>
            </div>
        </div>
    `;

    // Insertamos el dashboard antes de las herramientas de admin
    adminTools.parentNode.insertBefore(dash, adminTools);

    // Consultamos los deudores para calcular las estadísticas
    try {
        const res = await fetch(`${googleScriptURL}?action=queryDeudores`);
        const deudores = await res.json();

        // Sumamos todas las deudas para obtener el total
        const total = deudores.reduce((acc, d) => acc + parseFloat(d.deuda || 0), 0);

        // Actualizamos los valores en pantalla
        document.getElementById('dash-deudores').textContent = deudores.length;
        document.getElementById('dash-monto').textContent = formatMonto(total);

    } catch(e) {
        // Si falla la consulta, mostramos guiones
        document.getElementById('dash-deudores').textContent = '—';
        document.getElementById('dash-monto').textContent = '—';
    }
}

// Formatea montos grandes de forma legible: 1200000 → $1.2M
function formatMonto(n) {
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000)    return '$' + (n / 1000).toFixed(0) + 'K';
    return '$' + n.toFixed(0);
}


// =====================================================
// MOSTRAR RESULTADO DE ALUMNO - Card con sus datos
// =====================================================

function mostrarResultadoAlumno(alumno, puntaje) {
    // Si no se encontró el alumno, mostramos mensaje
    if (!alumno || !alumno.nombreCompleto) {
        mostrarMensaje("No se encontró ningún alumno con el DNI ingresado.");
        return;
    }

    const esDeuda = alumno.estadoCuenta && alumno.estadoCuenta.includes('Deuda');

    // Tarjeta con datos básicos del alumno
    const alumnoCard = document.createElement('div');
    alumnoCard.className = 'card result-card';

    // Si tiene deuda, cambiamos el borde a rojo
    if (esDeuda) alumnoCard.style.borderLeftColor = '#ff4d4d';

    alumnoCard.innerHTML = `
        <h3>Datos del Alumno</h3>
        <p><strong>Nombre:</strong> ${alumno.nombreCompleto}</p>
        <p><strong>Horarios:</strong> ${alumno.horarios || 'N/A'}</p>
        <p style="color: ${esDeuda ? '#ff4d4d' : 'var(--neon)'}; font-weight: bold;">
            <strong>Estado de Cuenta:</strong> ${alumno.estadoCuenta}
        </p>
    `;
    resultSection.appendChild(alumnoCard);

    // Si es admin y hay datos de puntaje disponibles, mostramos la card de rendimiento
    if (currentUserRole === 'admin' && puntaje && !puntaje.error) {
        const comp = puntaje.composicion_calculada || { porcentajeGrasa: 0, masaMagra: 0, indiceCinturaAltura: 0 };

        const puntajeCard = document.createElement('div');
        puntajeCard.className = 'card score-card';
        puntajeCard.innerHTML = `
            <h3>Puntaje y Rendimiento</h3>
            <h4>Composición Corporal</h4>
            <p><strong>% Grasa Corporal:</strong> ${comp.porcentajeGrasa.toFixed(2)}%</p>
            <p><strong>Masa Magra:</strong> ${comp.masaMagra.toFixed(2)} kg</p>
            <p><strong>Índice Cintura/Altura:</strong> ${comp.indiceCinturaAltura.toFixed(3)}</p>
            <hr style="border:0; border-top:1px solid var(--border); margin:10px 0;">
            <h4>Pruebas Físicas</h4>
            <p><strong>Abdominales:</strong> ${puntaje.abdominales || '0'}</p>
            <p><strong>Flexiones:</strong> ${puntaje.flexiones || '0'}</p>
            <p><strong>Test de Wells:</strong> ${puntaje.wells || '0'}</p>
            <hr style="border:0; border-top:1px solid var(--border); margin:15px 0;">
            <p><strong>PUNTAJE FINAL:</strong>
                <span style="color:var(--neon); font-weight:bold; font-size:1.3em; text-shadow:var(--neon-glow);">
                    ${puntaje.puntaje_final || 'N/A'}
                </span>
            </p>
        `;
        resultSection.appendChild(puntajeCard);
    }
}


// =====================================================
// CARGAR DEUDORES - Lista completa con botón de WhatsApp
// =====================================================

async function cargarDeudores() {
    mostrarMensaje("Cargando lista de deudores...");
    try {
        const response = await fetch(`${googleScriptURL}?action=queryDeudores`);
        if (!response.ok) throw new Error('No se pudo cargar la lista.');
        const deudores = await response.json();

        resultSection.innerHTML = '';

        // Sin deudores: mensaje de éxito
        if (!deudores || deudores.length === 0) {
            mostrarMensaje("🎉 No hay deudores pendientes.");
            return;
        }

        // Título con la cantidad de deudores encontrados
        const title = document.createElement('h2');
        title.textContent = `Deudores (${deudores.length})`;
        resultSection.appendChild(title);

        // Creamos una card por cada deudor
        deudores.forEach(deudor => {
            const card = document.createElement('div');
            card.className = 'card deudor-card';
            card.innerHTML = `
                <div>
                    <p><strong>Nombre:</strong> ${deudor.nombre}</p>
                    <p style="font-size:0.9em; color:var(--text2);">${deudor.mensajeWhatsApp}</p>
                </div>
            `;

            // Botón que abre WhatsApp con el mensaje pre-cargado
            const sendButton = document.createElement('button');
            sendButton.textContent = '📱 Enviar WhatsApp';
            sendButton.onclick = () => {
                // Limpiamos el número: solo dígitos
                const telefono = (deudor.telefono || '').toString().replace(/[^0-9]/g, '');
                const mensaje  = encodeURIComponent(deudor.mensajeWhatsApp);

                if (telefono) {
                    window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
                } else {
                    alert('Este deudor no tiene número de teléfono registrado.');
                }
            };

            card.appendChild(sendButton);
            resultSection.appendChild(card);
        });

    } catch (error) {
        mostrarMensaje(`Error: ${error.message}`);
    }
}


// =====================================================
// UTILIDADES
// =====================================================

// Muestra un mensaje simple en la sección de resultados
function mostrarMensaje(texto) {
    resultSection.innerHTML = `<p class="message">${texto}</p>`;
}
