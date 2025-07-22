// Elementos del DOM
const productsContainer = document.getElementById('productsContainer');
const productModal = document.getElementById('productModal');
const modalProductContent = document.getElementById('modalProductContent');
const cartModal = document.getElementById('cartModal');
const cartItems = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const cartButton = document.getElementById('cartButton');
const closeProductModal = document.getElementById('closeProductModal');
const closeCartModal = document.getElementById('closeCartModal');
const checkoutButton = document.getElementById('checkoutButton');
const continueShopping = document.getElementById('continueShopping');
const categoryButtons = document.querySelectorAll('.category-btn');

// Variables globales
let productos = [];
let carrito = [];
let currentCategory = 'todos';

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    cargarCarrito();
    actualizarCarrito();
    
    // Event listeners
    cartButton.addEventListener('click', abrirCarrito);
    closeProductModal.addEventListener('click', cerrarModalProducto);
    closeCartModal.addEventListener('click', cerrarModalCarrito);
    checkoutButton.addEventListener('click', finalizarCompra);
    continueShopping.addEventListener('click', cerrarModalCarrito);
    
    // Filtrado por categoría
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remover clase activa de todos los botones
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            // Agregar clase activa al botón seleccionado
            button.classList.add('active');
            // Filtrar productos por categoría
            currentCategory = button.dataset.category;
            renderizarProductos();
        });
    });
    
    // Cerrar modales al hacer clic fuera del contenido
    window.addEventListener('click', (e) => {
        if (e.target === productModal) cerrarModalProducto();
        if (e.target === cartModal) cerrarModalCarrito();
    });
});

// Cargar productos desde el JSON
function cargarProductos() {
    fetch('productos.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar los productos');
            }
            return response.json();
        })
        .then(data => {
            productos = data;
            renderizarProductos();
        })
        .catch(error => {
            console.error('Error:', error);
            productsContainer.innerHTML = `
                <div class="error">
                    <h3>Error al cargar los productos</h3>
                    <p>${error.message}</p>
                    <button onclick="location.reload()">Reintentar</button>
                </div>
            `;
        });
}

// Renderizar productos en la página
function renderizarProductos() {
    if (!productos || productos.length === 0) {
        productsContainer.innerHTML = '<div class="empty">No hay productos disponibles</div>';
        return;
    }
    
    // Filtrar por categoría
    const productosFiltrados = currentCategory === 'todos' 
        ? productos 
        : productos.filter(p => p.categoria === currentCategory);
    
    if (productosFiltrados.length === 0) {
        productsContainer.innerHTML = `
            <div class="empty">
                <h3>No se encontraron productos en esta categoría</h3>
                <button class="btn btn-outline" data-category="todos" onclick="document.querySelector('.category-btn[data-category=\\'todos\\']').click()">
                    Ver todos los productos
                </button>
            </div>
        `;
        return;
    }
    
    // Generar HTML de productos
    productsContainer.innerHTML = '';
    productosFiltrados.forEach(producto => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${producto.imagen}" alt="${producto.nombre}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${producto.nombre}</h3>
                <div class="product-price">$${producto.precio.toFixed(2)}</div>
                <p class="product-description">${producto.descripcion}</p>
                <div class="product-actions">
                    <button class="btn-details" onclick="abrirProducto(${producto.id})">Ver Detalles</button>
                </div>
            </div>
        `;
        productsContainer.appendChild(productCard);
    });
}

// Abrir modal de producto
function abrirProducto(id) {
    const producto = productos.find(p => p.id === id);
    
    if (producto) {
        modalProductContent.innerHTML = `
            <img src="${producto.imagen}" alt="${producto.nombre}" class="modal-image">
            <h2 class="modal-title">${producto.nombre}</h2>
            <div class="modal-price">$${producto.precio.toFixed(2)}</div>
            <p class="modal-description">${producto.descripcion}</p>
            
            <div class="quantity-control">
                <button class="quantity-btn" onclick="cambiarCantidad(-1)">-</button>
                <input type="number" id="productQuantity" class="quantity-input" value="1" min="1">
                <button class="quantity-btn" onclick="cambiarCantidad(1)">+</button>
            </div>
            
            <button class="btn-add-to-cart" onclick="agregarAlCarrito(${producto.id})">
                <i class="fas fa-shopping-cart"></i> Agregar al Carrito
            </button>
        `;
        
        productModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// Cambiar cantidad en el modal de producto
function cambiarCantidad(delta) {
    const input = document.getElementById('productQuantity');
    let value = parseInt(input.value) || 1;
    value += delta;
    
    if (value < 1) value = 1;
    input.value = value;
}

// Cerrar modal de producto
function cerrarModalProducto() {
    productModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Abrir modal de carrito
function abrirCarrito() {
    cargarCarritoItems();
    cartModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Cerrar modal de carrito
function cerrarModalCarrito() {
    cartModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Agregar producto al carrito
function agregarAlCarrito(id) {
    const input = document.getElementById('productQuantity');
    const cantidad = parseInt(input.value) || 1;
    
    const producto = productos.find(p => p.id === id);
    if (!producto) return;
    
    const itemIndex = carrito.findIndex(item => item.id === id);
    
    if (itemIndex !== -1) {
        carrito[itemIndex].cantidad += cantidad;
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagen,
            cantidad: cantidad
        });
    }
    
    guardarCarrito();
    actualizarCarrito();
    cerrarModalProducto();
    
    mostrarNotificacion(`Se agregaron ${cantidad} unidad(es) de "${producto.nombre}" al carrito.`);
}

// Cargar items del carrito
function cargarCarritoItems() {
    cartItems.innerHTML = '';
    
    if (carrito.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">Tu carrito está vacío</div>';
        cartTotal.textContent = 'Total: $0.00';
        return;
    }
    
    carrito.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.imagen}" alt="${item.nombre}" class="cart-item-image">
            <div class="cart-item-info">
                <h3 class="cart-item-title">${item.nombre}</h3>
                <div class="cart-item-price">$${(item.precio * item.cantidad).toFixed(2)}</div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="actualizarCantidadCarrito(${item.id}, -1)">-</button>
                    <span>${item.cantidad}</span>
                    <button class="quantity-btn" onclick="actualizarCantidadCarrito(${item.id}, 1)">+</button>
                </div>
                <div class="cart-item-actions">
                    <button class="cart-item-delete" onclick="eliminarDelCarrito(${item.id})">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });
    
    // Actualizar total
    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    cartTotal.textContent = `Total: $${total.toFixed(2)}`;
}

// Actualizar cantidad en el carrito
function actualizarCantidadCarrito(id, delta) {
    const itemIndex = carrito.findIndex(item => item.id === id);
    
    if (itemIndex !== -1) {
        carrito[itemIndex].cantidad += delta;
        
        if (carrito[itemIndex].cantidad < 1) {
            carrito.splice(itemIndex, 1);
        }
        
        guardarCarrito();
        actualizarCarrito();
        cargarCarritoItems();
    }
}

// Eliminar producto del carrito
function eliminarDelCarrito(id) {
    carrito = carrito.filter(item => item.id !== id);
    guardarCarrito();
    actualizarCarrito();
    cargarCarritoItems();
}

// Finalizar compra
function finalizarCompra() {
    if (carrito.length === 0) {
        alert('Tu carrito está vacío');
        return;
    }
    
    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    alert(`¡Compra realizada con éxito!\nTotal: $${total.toFixed(2)}\nGracias por tu compra.`);
    
    carrito = [];
    guardarCarrito();
    actualizarCarrito();
    cargarCarritoItems();
    cerrarModalCarrito();
}

// Actualizar contador de carrito
function actualizarCarrito() {
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    cartCount.textContent = totalItems;
}

// Guardar carrito en localStorage
function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

// Cargar carrito desde localStorage
function cargarCarrito() {
    const carritoGuardado = localStorage.getItem('carrito');
    if (carritoGuardado) {
        try {
            carrito = JSON.parse(carritoGuardado);
        } catch (e) {
            console.error('Error al parsear el carrito:', e);
            carrito = [];
        }
    }
}

// Mostrar notificación
function mostrarNotificacion(mensaje) {
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion';
    notificacion.textContent = mensaje;
    
    // Estilo para la notificación
    notificacion.style.position = 'fixed';
    notificacion.style.bottom = '20px';
    notificacion.style.right = '20px';
    notificacion.style.backgroundColor = '#4CAF50';
    notificacion.style.color = 'white';
    notificacion.style.padding = '15px 25px';
    notificacion.style.borderRadius = '4px';
    notificacion.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    notificacion.style.zIndex = '10000';
    notificacion.style.opacity = '0';
    notificacion.style.transition = 'opacity 0.3s';
    
    // Agregar al documento
    document.body.appendChild(notificacion);
    
    // Mostrar
    setTimeout(() => {
        notificacion.style.opacity = '1';
    }, 10);
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        notificacion.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notificacion);
        }, 300);
    }, 3000);
}