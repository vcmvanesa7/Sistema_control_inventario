// Prefijos por categoría
const PREFIX = {
    "Instrumentos de Viento": "IV",
    "Instrumentos de Percusión": "IP",
    "Instrumentos de Cuerda": "IC",
    "Instrumentos Eléctricos": "IE"
};

// Productos iniciales o desde localStorage
let productos = JSON.parse(localStorage.getItem("productos")) || {
    producto1: {
        id: "IV001",
        nombre: "Saxofón Alto",
        categoria: "Instrumentos de Viento",
        precio: 350000,
        cantidad: 5,
        fecha: "2025-06-01",
        estado: "Nuevo",
        descripcion: "Saxofón de latón profesional.",
        imagen: "https://tse3.mm.bing.net/th/id/OIP.Zhd27gKoPSQ1a1FE1JO2igAAAA?rs=1&pid=ImgDetMain"
    },
    producto2: {
        id: "IP001",
        nombre: "Tambor Africano",
        categoria: "Instrumentos de Percusión",
        precio: 120000,
        cantidad: 8,
        fecha: "2025-05-20",
        estado: "Nuevo",
        descripcion: "Tambor manual de madera y piel auténtica.",
        imagen: "https://thumbs.dreamstime.com/b/tambor-africano-25975560.jpg"
    },
    producto3: {
        id: "IC001",
        nombre: "Violín Clásico",
        categoria: "Instrumentos de Cuerda",
        precio: 450000,
        cantidad: 3,
        fecha: "2025-04-15",
        estado: "Usado",
        descripcion: "Violín con acabado barnizado, estado bueno.",
        imagen: "https://thumbs.dreamstime.com/z/violin-2742015.jpg?w=768"
    }
};

// Guarda productos en localStorage
function guardarProductos() {
    localStorage.setItem("productos", JSON.stringify(productos));
}

// Obtener elementos DOM (pueden no existir en todas las páginas)
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

// Genera ID único según categoría
function generarID(categoria) {
    const pref = PREFIX[categoria] || "";
    const usados = Object.values(productos)
        .map(p => p.id)
        .filter(id => id.startsWith(pref))
        .map(id => parseInt(id.slice(pref.length), 10));
    const siguiente = (usados.length ? Math.max(...usados) : 0) + 1;
    return `${pref}${String(siguiente).padStart(3, "0")}`;
}

// Auto‑genera ID al cambiar categoría (si existe el select)
if (selectCat && inputId) {
    selectCat.addEventListener("change", () => {
        inputId.value = generarID(selectCat.value);
    });
}

// Muestra alerta de éxito (si existe)
function showSuccess() {
    if (!alertSucc) return;
    alertSucc.style.display = "block";
    setTimeout(() => {
        alertSucc.style.display = "none";
    }, 2000);
}

// Renderiza últimos productos (si existe su lista)
function renderUltimos() {
    if (!ultimosList) return;
    ultimosList.innerHTML = "";
    const ultimos = Object.values(productos).slice(-7).reverse();
    ultimos.forEach(p => {
        const li = document.createElement("li");
        li.textContent = `${p.id} - ${p.nombre} (${p.categoria}) - $${p.precio.toLocaleString()} x${p.cantidad} - ${p.fecha} - ${p.estado}`;
        li.classList.add("fade-in");
        ultimosList.appendChild(li);
    });
}

// Renderiza catálogo (si existe su contenedor)
function renderCatalogo() {
    if (!productList || !totalPriceP) return;
    productList.innerHTML = "";
    let total = 0;
    const filtro = filtroCatalogo?.value || "";

    Object.values(productos).forEach(p => {
        if (filtro && p.categoria !== filtro) return;
        total += p.precio * p.cantidad;

        const card = document.createElement("div");
        card.className = "product-card";
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

// Renderiza lista de edición (si existe su lista)
function renderEditar() {
    if (!editarLista) return;
    editarLista.innerHTML = "";

    const textFilter = filtroEditar?.value.toLowerCase() || "";
    const catFilter = filtroCategoriaEdit?.value || "";

    let total = 0;

    Object.entries(productos).forEach(([key, p]) => {
        const matchText = !textFilter || p.id.toLowerCase().includes(textFilter) || p.nombre.toLowerCase().includes(textFilter);
        const matchCat = !catFilter || p.categoria === catFilter;

        if (matchText && matchCat) {
            total += p.precio * p.cantidad;

            const li = document.createElement("li");
            li.innerHTML = `
        <strong>${p.nombre}</strong> (${p.id}) - ${p.categoria}<br>
        Cantidad: ${p.cantidad} | Precio: $${p.precio.toLocaleString()}<br>
        <button onclick="modificarCantidad('${key}', 1)">+1</button>
        <button onclick="modificarCantidad('${key}', -1)">-1</button>
        <button onclick="editarProductoDesdeOtraPagina('${key}')">Editar</button>
        <button onclick="eliminarProducto('${key}')">Eliminar</button>
      `;
            editarLista.appendChild(li);
        }
    });

    const totalInventario = document.getElementById("total-inventario");
    if (totalInventario) {
        totalInventario.textContent = `Total del Inventario: $${total.toLocaleString()}`;
    }
}

// Sumar/restar unidades
function modificarCantidad(key, delta) {
    productos[key].cantidad = Math.max(0, productos[key].cantidad + delta);
    guardarProductos();
    renderCatalogo();
    renderEditar();
}

// Eliminar producto
function eliminarProducto(key) {
    delete productos[key];
    guardarProductos();
    renderCatalogo();
    renderEditar();
    renderUltimos();
}

// Manejo del formulario (si existe)
if (form) {
    form.addEventListener("submit", e => {
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
            id = generarID(categoria);
            inputId.value = id;
        }

        if (!nombre || !categoria || !id || !(precio > 0) || !(cantidad >= 0) || !fecha || !imagen) {
            alert("Por favor completa todos los campos correctamente.");
            return;
        }

        const editKey = form.dataset.editKey;
        if (editKey) {
            productos[editKey] = { id, nombre, categoria, precio, cantidad, fecha, estado, descripcion, imagen };
            delete form.dataset.editKey;
            form.querySelector("#btn-add").textContent = "Agregar";
        } else {
            const newKey = "producto" + (Object.keys(productos).length + 1);
            productos[newKey] = { id, nombre, categoria, precio, cantidad, fecha, estado, descripcion, imagen };
            showSuccess();
        }

        guardarProductos();
        renderUltimos();
        renderCatalogo();
        renderEditar();
        form.reset();
        inputId.value = "";
        selectCat.value = "";
        form.classList.remove("modo-edicion");
    });
}

// Función para editar desde otra página
function editarProductoDesdeOtraPagina(key) {
    localStorage.setItem("productoParaEditar", key);
    window.location.href = "index.html";
}

// Si se llega desde otra página con un producto para editar
if (form && localStorage.getItem("productoParaEditar")) {
    const key = localStorage.getItem("productoParaEditar");
    const p = productos[key];

    if (p) {
        document.getElementById("idProducto").value = p.id;
        document.getElementById("nombre").value = p.nombre;
        document.getElementById("categoria").value = p.categoria;
        document.getElementById("precio").value = p.precio;
        document.getElementById("cantidad").value = p.cantidad;
        document.getElementById("fecha").value = p.fecha;
        document.querySelector(`input[name="estado"][value="${p.estado}"]`).checked = true;
        document.getElementById("descripcion").value = p.descripcion;
        document.getElementById("imagenURL").value = p.imagen;

        form.dataset.editKey = key;
        document.getElementById("btn-add").textContent = "Actualizar";
        form.classList.add("modo-edicion");
    }

    localStorage.removeItem("productoParaEditar");
}

// Listeners para filtros
if (filtroCatalogo) filtroCatalogo.addEventListener("change", renderCatalogo);
if (filtroEditar) filtroEditar.addEventListener("input", renderEditar);
if (filtroCategoriaEdit) filtroCategoriaEdit.addEventListener("change", renderEditar);

// Inicialización segura
guardarProductos();
renderUltimos();
renderCatalogo();
renderEditar();
