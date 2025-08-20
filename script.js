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
            // Asegurar que todos los productos tengan el campo disponible
            productos = data.map(producto => ({
                ...producto,
                disponible: producto.disponible !== undefined ? producto.disponible : true
            }));
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

// Renderizar productos en la página con efecto flip
function renderizarProductos() {
    if (!productos || productos.length === 0) {
        productsContainer.innerHTML = '<div class="empty">No hay productos disponibles</div>';
        return;
    }
    
    // Filtrar por categoría y disponibilidad
    const productosFiltrados = currentCategory === 'todos' 
        ? productos.filter(p => p.disponible) 
        : productos.filter(p => p.categoria === currentCategory && p.disponible);
    
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
    
    // Generar HTML de productos con efecto flip
    productsContainer.innerHTML = '';
    productosFiltrados.forEach(producto => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-card-front">
                <img src="${producto.imagen}" alt="${producto.nombre}" class="product-image">
                <div class="product-name">${producto.nombre}</div>
            </div>
            <div class="product-card-back">
                <div class="product-name">${producto.nombre}</div>
                <div class="product-price">$${producto.precio.toFixed(2)}</div>
                <div class="product-short-description">${producto.descripcion.substring(0, 100)}...</div>
            </div>
        `;
        
        // Evento para voltear la tarjeta
        productCard.addEventListener('mouseenter', () => {
            productCard.classList.add('flipped');
        });
        
        productCard.addEventListener('mouseleave', () => {
            productCard.classList.remove('flipped');
        });
        
        // Evento para abrir el modal
        productCard.addEventListener('click', (e) => {
            if (!e.target.classList.contains('btn-details')) {
                abrirProducto(producto.id);
            }
        });
        
        productsContainer.appendChild(productCard);
    });
}

// Abrir modal de producto con nueva vista
function abrirProducto(id) {
    const producto = productos.find(p => p.id === id);
    
    if (producto) {
        // Obtener productos promocionados (solo los disponibles)
        const productosPromocionados = productos.filter(p => 
            producto.promocionados.includes(p.id) && p.disponible
        );
        
        modalProductContent.innerHTML = `
            <img src="${producto.imagen}" alt="${producto.nombre}" class="modal-image">
            
            <div class="modal-title-container">
                <h2 class="modal-title">${producto.nombre}</h2>
                <span class="product-code">Código: ${producto.codigo || producto.id}</span>
            </div>
            
            <div class="modal-price-container">
                <div class="modal-price">$${producto.precio.toFixed(2)}</div>
                ${producto.logo ? `<img src="${producto.logo}" alt="Logo ${producto.nombre}" class="modal-logo">` : ''}
            </div>
            
            <div class="description-tabs">
                <div class="description-tab active" data-tab="descripcion">Descripción</div>
                <div class="description-tab" data-tab="funcion">Para qué funciona</div>
                <div class="description-tab" data-tab="otros">Otros detalles</div>
            </div>
            
            <div class="description-content active" id="descripcion">
                <p>${producto.descripcion}</p>
            </div>
            
            <div class="description-content" id="funcion">
                <p>${producto.descripciones.principal}</p>
            </div>
            
            <div class="description-content" id="otros">
                ${producto.descripciones.otros.split('\n').map(p => `<p>${p}</p>`).join('')}
            </div>
            
            <div class="product-actions">
                <div class="quantity-control">
                    <button class="quantity-btn" onclick="cambiarCantidad(-1)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <input type="number" id="productQuantity" class="quantity-input" value="1" min="1">
                    <button class="quantity-btn" onclick="cambiarCantidad(1)">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                
                <button class="btn btn-primary btn-add-to-cart" onclick="agregarAlCarrito(${producto.id})">
                    <i class="fas fa-shopping-cart"></i> Agregar al Carrito
                </button>
            </div>
            
            ${productosPromocionados.length > 0 ? `
            <div class="related-products">
                <h3>También te podría gustar</h3>
                <div class="related-grid">
                    ${productosPromocionados.map(p => `
                        <div class="related-product" onclick="abrirProducto(${p.id})">
                            <img src="${p.imagen}" alt="${p.nombre}">
                            <div class="related-product-overlay">
                                <span>Ver detalles</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
        `;
        
        // Agregar funcionalidad a las pestañas
        const tabs = modalProductContent.querySelectorAll('.description-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remover clase activa de todas las pestañas
                tabs.forEach(t => t.classList.remove('active'));
                // Ocultar todos los contenidos
                document.querySelectorAll('.description-content').forEach(c => c.classList.remove('active'));
                
                // Activar la pestaña clickeada
                tab.classList.add('active');
                const tabId = tab.dataset.tab;
                document.getElementById(tabId).classList.add('active');
            });
        });
        
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

// Finalizar compra - Redirigir al checkout
function finalizarCompra() {
    if (carrito.length === 0) {
        mostrarNotificacion('Tu carrito está vacío');
        return;
    }
    
    // Guardar el carrito actual para el checkout
    localStorage.setItem('carritoCheckout', JSON.stringify(carrito));
    
    // Redirigir a la página de checkout
    window.location.href = 'checkout.html';
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
// Animación de aparición para la sección "Por qué elegirnos"
function initWhyChooseUsAnimation() {
    const whySection = document.querySelector('.why-choose-us');
    const benefits = document.querySelectorAll('.benefit');
    
    if (!whySection) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                whySection.classList.add('animated');
                
                // Animar beneficios uno por uno
                benefits.forEach((benefit, index) => {
                    setTimeout(() => {
                        benefit.classList.add('animated');
                    }, index * 200);
                });
            }
        });
    }, { threshold: 0.3 });
    
    observer.observe(whySection);
}

// Llamar a la función después de cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    initWhyChooseUsAnimation();
    // ... el resto de tu código de inicialización
});
// Función para cargar testimonios creativos
function cargarTestimoniosCreativos() {
    fetch('testimonios.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar los testimonios');
            }
            return response.json();
        })
        .then(data => {
            renderizarTestimoniosCreativos(data);
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('testimonialsCreative').innerHTML = `
                <div class="error">
                    <p>Error al cargar los testimonios: ${error.message}</p>
                </div>
            `;
        });
}

// Función para renderizar testimonios creativos
function renderizarTestimoniosCreativos(testimonios) {
    const container = document.getElementById('testimonialsCreative');
    container.innerHTML = '';
    
    testimonios.forEach(testimonio => {
        const card = document.createElement('div');
        card.className = 'testimonial-creative-card';
        card.innerHTML = `
            <div class="testimonial-image-wrapper">
                <img src="${testimonio.imagen}" alt="${testimonio.nombre}" class="testimonial-image">
                <div class="testimonial-overlay">
                    <h3 class="testimonial-name-preview">${testimonio.nombre}</h3>
                </div>
            </div>
            <div class="testimonial-expanded-content">
                <div class="testimonial-header">
                    <div class="testimonial-customer-info">
                        <h3>${testimonio.nombre}</h3>
                        <div class="testimonial-rating">${'★'.repeat(testimonio.valoracion)}${'☆'.repeat(5 - testimonio.valoracion)}</div>
                    </div>
                </div>
                <p class="testimonial-text">${testimonio.testimonio}</p>
            </div>
            <button class="testimonial-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Evento para expandir el testimonio
        card.addEventListener('click', (e) => {
            if (!card.classList.contains('active') && 
                !e.target.classList.contains('testimonial-close') && 
                !e.target.classList.contains('fa-times')) {
                expandirTestimonioCreativo(card);
            }
        });
        
        // Evento para cerrar el testimonio
        const closeBtn = card.querySelector('.testimonial-close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            cerrarTestimonioCreativo(card);
        });
        
        container.appendChild(card);
    });
}

// Función para expandir testimonio creativo
function expandirTestimonioCreativo(card) {
    // Cerrar cualquier testimonio abierto
    document.querySelectorAll('.testimonial-creative-card.active').forEach(activeCard => {
        if (activeCard !== card) {
            cerrarTestimonioCreativo(activeCard);
        }
    });
    
    // Añadir clase de desenfoque al contenedor
    document.getElementById('testimonialsCreative').classList.add('blur-active');
    
    // Expandir la tarjeta seleccionada
    card.classList.add('active');
    
    // Scroll suave hasta la tarjeta
    setTimeout(() => {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
}

// Función para cerrar testimonio creativo
function cerrarTestimonioCreativo(card) {
    card.classList.remove('active');
    
    // Remover clase de desenfoque si no hay tarjetas activas
    setTimeout(() => {
        const activeCards = document.querySelectorAll('.testimonial-creative-card.active');
        if (activeCards.length === 0) {
            document.getElementById('testimonialsCreative').classList.remove('blur-active');
        }
    }, 300);
}

// Inicializar testimonios creativos
document.addEventListener('DOMContentLoaded', () => {
    cargarTestimoniosCreativos();
    
    // Cerrar testimonio al hacer clic fuera de él
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.testimonial-creative-card.active') && 
            !e.target.closest('.testimonial-close')) {
            document.querySelectorAll('.testimonial-creative-card.active').forEach(card => {
                cerrarTestimonioCreativo(card);
            });
        }
    });
});