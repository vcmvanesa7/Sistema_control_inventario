/**
 * script.js
 * Control de Inventario Tienda Musical
 *
 * Flujo general:
 * 1. obtenerProductos() — GET /productos
 * 2. renderCatalogo(), renderUltimos(), renderEditar() — muestran datos
 * 3. guardarProducto() — POST o PUT según creación o edición
 * 4. eliminarProducto() — DELETE /productos/:id
 * 5. modificarCantidad() — ajuste de cantidad y PUT
 * 6. mostrar alertas de éxito o error
 * 7. Exposición de funciones globales y renderizado inicial
 */

// Prefijos según categoría para los IDs
const PREFIX = {
    "Instrumentos de Viento": "IV",
    "Instrumentos de Percusión": "IP",
    "Instrumentos de Cuerda": "IC",
    "Instrumentos Eléctricos": "IE"
};

const API_URL = "http://localhost:3000/productos";

// Referencia a elementos del DOM
const form = document.getElementById("inventory-form");
const selectCat = document.getElementById("categoria");
const inputId = document.getElementById("idProducto");
const alertSucc = document.getElementById("alert-success");
const productList = document.getElementById("product-list");
const totalPriceP = document.getElementById("total-price");
const ultimosList = document.getElementById("lista-ultimos");
const filtroCatalogo = document.getElementById("filtro-catalogo");
const filtroEditar = document.getElementById("filtro-editar");
const filtroCategoriaEdit = document.getElementById("filtro-categoria-editar");
const editarLista = document.getElementById("editar-lista");

// Validación de campo precio: se asegura que el usuario solo pueda ingresar números enteros (sin puntos, comas ni letras)
const inputPrecio = document.getElementById("precio");
if (inputPrecio) {
    inputPrecio.addEventListener("input", () => {
        // Reemplaza todo lo que no sea un número entero
        inputPrecio.value = inputPrecio.value.replace(/[^\d]/g, "");
    });
}

/**
 * Función utilitaria que detecta la página actual
 * y renderiza solo lo necesario según sea:
 * - index.html → muestra últimos productos
 * - catálogo.html → muestra el catálogo completo
 * - actualizar.html → muestra lista editable
 */
function renderizarSoloLoNecesario() {
    const pagina = window.location.pathname;
    if (pagina.includes("index")) {
        renderUltimos();
    } else if (pagina.includes("catálogo")) {
        renderCatalogo();
    } else if (pagina.includes("actualizar")) {
        renderEditar();
    }
}

// Se obtienen todos los productos del servidor con una petición GET
async function obtenerProductos() {
    try {
        const res = await fetch(API_URL);
        const data = await res.json();

        // Mostrar en consola los productos solo para fines de desarrollo
        console.log("📦 Productos actuales (carga inicial):", data);

        return data;
    } catch (error) {
        console.error("🚨 Error al obtener productos:", error);
        return []; // Retorna un arreglo vacío si hay error para evitar que la app se rompa
    }
}


// Se envía los datos al servidor con POST para crear o PUT para actualizar
async function guardarProducto(producto, editKey = null) {
    const options = {
        method: editKey ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(producto)
    };
    const url = editKey ? `${API_URL}/${editKey}` : API_URL;
    await fetch(url, options);
    console.log(editKey ? "✏️ Producto actualizado:" : "🆕 Producto agregado:", producto);
}


// Se elimina un producto mediante DELETE y vuelve a renderizar lo necesario
async function eliminarProducto(id) {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    console.log("🗑️ Producto eliminado con ID:", id);
    renderEditar;
}

/**
 * Se modifica la cantidad de un producto específico (sumando o restando) 
 * sin volver a renderizar toda la lista.
 * 
 * Actualiza solo el <li> correspondiente del DOM para evitar recargas visuales innecesarias
 * y aplica una animación suave con la clase 'cantidad-actualizada' para mejorar la experiencia del usuario.
 * 
 * Además, recalcula y actualiza el total del inventario sin reconstruir la lista completa.
 * 
 * Ventajas:
 * - Mejora el rendimiento (no se vuelve a renderizar toda la lista).
 * - Elimina el efecto de "doble brinco" o parpadeo.
 * - Agrega una experiencia visual más fluida y profesional.
 */

async function modificarCantidad(id, delta) {
    const productos = await obtenerProductos();
    const p = productos.find(item => item.id === id);
    if (!p) return;
    p.cantidad = Math.max(0, p.cantidad + delta);
    console.log(`🔄 Cantidad actualizada para ${id}: ${p.cantidad} (${delta > 0 ? "+1" : "-1"})`);
    await guardarProducto(p, p.id);

    // Encuentra el <li> correspondiente
    const liList = editarLista.querySelectorAll("li");
    liList.forEach(li => {
        if (li.innerHTML.includes(p.id)) {
            li.innerHTML = `
                <strong>${p.nombre}</strong> (${p.id}) - ${p.categoria}<br>
                Cantidad: ${p.cantidad} | Precio: $${p.precio.toLocaleString()}<br>
                <button onclick="modificarCantidad('${p.id}', 1)">+1</button>
                <button onclick="modificarCantidad('${p.id}', -1)">-1</button>
                <button onclick="editarProductoDesdeOtraPagina('${p.id}')">Editar</button>
                <button onclick="eliminarProducto('${p.id}')">Eliminar</button>
            `;
            li.classList.add("cantidad-actualizada");
            setTimeout(() => li.classList.remove("cantidad-actualizada"), 500);
        }
    });

    // Recalcular solo el total general
    const total = productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
    const totalInventario = document.getElementById("total-inventario");
    if (totalInventario) {
        totalInventario.textContent = `Total del Inventario: $${total.toLocaleString()}`;
        console.log("📊 Total actualizado del inventario:", total);
    }
}


/**
 * Se Genera el siguiente ID para una categoría dada.
 * Busca todos los IDs existentes que empiecen por el prefijo,
 * extrae el número, halla el máximo y suma 1.
 * Ejemplo: con IV001 e IV002 devuelve IV003.
 */
async function generarID(categoria) {
    const pref = PREFIX[categoria] || "";
    const productos = await obtenerProductos();
    const usados = productos
        .filter(item => item.id.startsWith(pref))
        .map(item => parseInt(item.id.slice(pref.length), 10));
    const siguiente = (usados.length ? Math.max(...usados) : 0) + 1;
    return `${pref}${String(siguiente).padStart(3, "0")}`;
}

// Se muestra una alerta breve de éxito
function showSuccess() {
    if (!alertSucc) return;
    alertSucc.style.display = "block";
    setTimeout(() => {
        alertSucc.style.display = "none";
    }, 2000);
}

// Se renderiza los últimos siete productos en orden inverso
async function renderUltimos() {
    if (!ultimosList) return;
    const productos = await obtenerProductos();
    ultimosList.innerHTML = "";
    const ultimos = productos.slice(-7).reverse();
    ultimos.forEach(p => {
        const li = document.createElement("li");
        li.textContent = `${p.id} - ${p.nombre} (${p.categoria}) - $${p.precio.toLocaleString()} x${p.cantidad} - ${p.fecha} - ${p.estado}`;
        li.classList.add("fade-in");
        ultimosList.appendChild(li);
    });
}

// Se renderiza el catálogo completo y aplica el filtro de categoría
async function renderCatalogo() {
    if (!productList || !totalPriceP) return;
    const productos = await obtenerProductos();
    productList.innerHTML = "";
    let total = 0;
    const filtro = filtroCatalogo?.value || "";

    productos.forEach(p => {
        if (filtro && p.categoria !== filtro) return;
        total += p.precio * p.cantidad;
        const card = document.createElement("div");
        card.className = "product-card fade-in-smooth";
        card.innerHTML = `
      <div class="product-card-inner">
        <div class="product-card-front">
          <img src="${p.imagen}" alt="${p.nombre}" class="thumb">
          <strong>${p.nombre}</strong>
        </div>
        <div class="product-card-back">
          <p>${p.id}</p>
          <p>${p.categoria}</p>
          <p>$${p.precio.toLocaleString()} x${p.cantidad}</p>
          <p>${p.fecha}</p>
          <p>${p.estado}</p>
        </div>
      </div>
    `;
        productList.appendChild(card);
    });

    totalPriceP.textContent = `Total: $${total.toLocaleString()}`;
}

// Se renderiza la lista de edición con filtros y acciones
async function renderEditar() {
    if (!editarLista) return;
    const productos = await obtenerProductos();
    editarLista.innerHTML = "";
    const textFilter = filtroEditar?.value.toLowerCase() || "";
    const catFilter = filtroCategoriaEdit?.value || "";
    let total = 0;

    productos.forEach(p => {
        const matchText = !textFilter || p.id.toLowerCase().includes(textFilter) || p.nombre.toLowerCase().includes(textFilter);
        const matchCat = !catFilter || p.categoria === catFilter;
        if (matchText && matchCat) {
            total += p.precio * p.cantidad;
            const li = document.createElement("li");
            li.innerHTML = `
        <strong>${p.nombre}</strong> (${p.id}) - ${p.categoria}<br>
        Cantidad: ${p.cantidad} | Precio: $${p.precio.toLocaleString()}<br>
        <button onclick="modificarCantidad('${p.id}', 1)">+1</button>
        <button onclick="modificarCantidad('${p.id}', -1)">-1</button>
        <button onclick="editarProductoDesdeOtraPagina('${p.id}')">Editar</button>
        <button onclick="eliminarProducto('${p.id}')">Eliminar</button>
      `;
            editarLista.appendChild(li);
        }
    });

    const totalInventario = document.getElementById("total-inventario");
    if (totalInventario) {
        totalInventario.textContent = `Total del Inventario: $${total.toLocaleString()}`;
    }
}

// Se Asigna el evento para autogenerar ID al cambiar categoría
if (selectCat && inputId) {
    selectCat.addEventListener("change", async () => {
        inputId.value = await generarID(selectCat.value);
    });
}

/* Manejo del evento de envío del formulario principal.
Si el formulario está en modo edición, actualiza el producto existente.
Si no, crea uno nuevo. Valida todos los campos antes de enviarlo.
Al finalizar, actualiza toda la interfaz para reflejar los cambios.*/

if (form) {
    form.addEventListener("submit", async e => {
        e.preventDefault();
        const nombre = form.querySelector("#nombre").value.trim();
        const categoria = selectCat.value;
        let id = inputId.value;
        const precio = parseFloat(form.querySelector("#precio").value);
        const cantidad = parseInt(form.querySelector("#cantidad").value, 10);
        const fecha = form.querySelector("#fecha").value;
        const estado = form.querySelector('input[name="estado"]:checked').value;
        const descripcion = form.querySelector("#descripcion").value.trim();
        const imagen = form.querySelector("#imagenURL").value.trim();

        if (!id && categoria) {
            id = await generarID(categoria);
            inputId.value = id;
        }

        if (!nombre || !categoria || !id || !(precio > 0) || !(cantidad >= 0) || !fecha || !imagen) {
            alert("Por favor completa todos los campos correctamente.");
            return;
        }

        const producto = { id, nombre, categoria, precio, cantidad, fecha, estado, descripcion, imagen };
        const editKey = form.dataset.editKey;

        if (editKey) {
            // Actualiza el producto existente
            await guardarProducto(producto, editKey);
        } else {
            // Crea un nuevo producto
            await guardarProducto(producto);
        }

        showSuccess();
        form.reset();
        inputId.value = "";
        selectCat.value = "";
        delete form.dataset.editKey;
        form.classList.remove("modo-edicion");
        document.getElementById("btn-add").textContent = "Agregar";

        // Render según la página
        renderizarSoloLoNecesario()

    });
}

// Se guarda en localStorage la clave de edición y redirige
function editarProductoDesdeOtraPagina(id) {
    localStorage.setItem("productoParaEditar", id);
    console.log("➡️ Producto enviado a formulario para edición:", id);
    window.location.href = "index.html";
}

// Se carga los datos en el formulario si proviene de editar
window.addEventListener("DOMContentLoaded", async () => {
    const id = localStorage.getItem("productoParaEditar");
    if (form && id) {
        const productos = await obtenerProductos();
        const p = productos.find(item => item.id === id);
        if (p) {
            form.querySelector("#idProducto").value = p.id;
            form.querySelector("#nombre").value = p.nombre;
            form.querySelector("#categoria").value = p.categoria;
            form.querySelector("#precio").value = p.precio;
            form.querySelector("#cantidad").value = p.cantidad;
            form.querySelector("#fecha").value = p.fecha;
            form.querySelector(`input[name="estado"][value="${p.estado}"]`).checked = true;
            form.querySelector("#descripcion").value = p.descripcion;
            form.querySelector("#imagenURL").value = p.imagen;
            form.dataset.editKey = p.id;
            form.classList.add("modo-edicion");
            document.getElementById("btn-add").textContent = "Actualizar";
        }
        localStorage.removeItem("productoParaEditar");
    }
    renderizarTodo();
});

// Se asigna los filtros para catálogo y edición
if (filtroCatalogo) filtroCatalogo.addEventListener("change", renderCatalogo);
if (filtroEditar) filtroEditar.addEventListener("input", renderEditar);
if (filtroCategoriaEdit) filtroCategoriaEdit.addEventListener("change", renderEditar);


/*Inicialización de la app:
 *  - Expone funciones globales para botones onclick
 *  - Lanza renderizado inicial*/

window.modificarCantidad = modificarCantidad;
window.eliminarProducto = eliminarProducto;
window.editarProductoDesdeOtraPagina = editarProductoDesdeOtraPagina;

function renderizarTodo() {
    renderUltimos();
    renderCatalogo();
    renderEditar();
}

/*
🔎 DEBUG / DESARROLLO
-----------------------
Esto permite ver en consola todos los productos del servidor
cuando se carga el proyecto. Úsalo solo durante pruebas.

Descomenta para usar:
----------------------
*/
// fetch("http://localhost:3000/productos")
//     .then(res => res.json())
//     .then(data => console.log("Productos actuales (carga inicial):", data));
