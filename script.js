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
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const searchResults = document.getElementById('searchResults');
const promoPopup = document.getElementById('promoPopup');
const closePopup = document.getElementById('closePopup');

// Variables globales
let productos = [];
let carrito = [];
let currentCategory = 'todos';
let isMinimized = false;

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
    // Event listeners para búsqueda
searchButton.addEventListener('click', buscarProductos);
searchInput.addEventListener('keyup', function(e) {
    if (e.key === 'Enter') {
        buscarProductos();
    } else {
        buscarEnTiempoReal();
    }
});

// Mostrar popup y overlay inmediatamente al cargar la página
window.addEventListener('load', () => {
    promoPopup.style.display = 'block';
    promoOverlay.style.display = 'block';
});

// Función para cerrar o minimizar
function handleClosePopup() {
    if (!isMinimized) {
        // Minimizar popup a la esquina
        promoPopup.classList.add('minimized');
        promoOverlay.style.display = 'none'; 
        isMinimized = true;
    } else {
        // Cerrar totalmente
        promoPopup.style.display = 'none';
    }
}

// Cerrar con botón
closePopup.addEventListener('click', handleClosePopup);

// Cerrar si se hace clic en el overlay
promoOverlay.addEventListener('click', handleClosePopup);
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
                disponible: producto.disponible !== undefined ? producto.disponible : true,
                descuento: producto.descuento !== undefined ? producto.descuento : 0,
                disclaimer: producto.disclaimer || ""
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
        const tieneDescuento = producto.descuento && producto.descuento > 0;
        const precioOriginal = producto.precio;
        const precioDescuento = tieneDescuento ? 
            (precioOriginal * (100 - producto.descuento) / 100).toFixed(2) : 
            precioOriginal.toFixed(2);
            
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-card-front">
                ${tieneDescuento ? `<div class="product-discount">-${producto.descuento}%</div>` : ''}
                <img src="${producto.imagen}" alt="${producto.nombre}" class="product-image">
                <div class="product-name">${producto.nombre}</div>
            </div>
            <div class="product-card-back">
                <div class="product-name">${producto.nombre}</div>
                <div class="product-price">
                    ${tieneDescuento ? `<span class="original-price">$${precioOriginal.toFixed(2)}</span>` : ''}
                    <span class="${tieneDescuento ? 'discounted-price' : ''}">$${precioDescuento}</span>
                </div>
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
        // Calcular precio con descuento si aplica
        const tieneDescuento = producto.descuento && producto.descuento > 0;
        const precioOriginal = producto.precio;
        const precioDescuento = tieneDescuento ? 
            (precioOriginal * (100 - producto.descuento) / 100).toFixed(2) : 
            precioOriginal.toFixed(2);
            
        // Obtener productos promocionados (solo los disponibles)
        const productosPromocionados = productos.filter(p => 
            producto.promocionados.includes(p.id) && p.disponible
        );
        
        // Función para formatear texto con saltos de línea y negritas
        function formatearTexto(texto) {
            if (!texto) return '';
            
            // Convertir **...** a negritas (en lugar de \s...\s)
            let textoFormateado = texto.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            
            // Convertir \n a párrafos
            return textoFormateado.split('\n').map(parrafo => 
                parrafo.trim() ? `<p>${parrafo}</p>` : ''
            ).join('');
        }
        
        modalProductContent.innerHTML = `
            <img src="${producto.imagen}" alt="${producto.nombre}" class="modal-image">
            
            <div class="modal-title-container">
                <h2 class="modal-title">${producto.nombre}</h2>
                <span class="product-code">Notificación Sanitaria: ${producto.codigo || producto.id}</span>
            </div>
            
            <div class="modal-price-container">
                <div class="modal-price">
                    ${tieneDescuento ? `<span class="original-price">$${precioOriginal.toFixed(2)}</span>` : ''}
                    <span class="${tieneDescuento ? 'discounted-price' : ''}">$${precioDescuento}</span>
                </div>
                ${producto.logo ? `<img src="${producto.logo}" alt="Logo ${producto.nombre}" class="modal-logo">` : ''}
            </div>
            
            <div class="description-tabs">
                <div class="description-tab active" data-tab="descripcion">Descripción</div>
                <div class="description-tab" data-tab="funcion">Para qué funciona</div>
                <div class="description-tab" data-tab="otros">Otros detalles</div>
            </div>
            
            <div class="description-content active" id="descripcion">
                ${formatearTexto(producto.descripcion)}
            </div>
            
            <div class="description-content" id="funcion">
                ${formatearTexto(producto.descripciones.principal)}
            </div>
            
            <div class="description-content" id="otros">
                ${formatearTexto(producto.descripciones.otros)}
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
            
            ${producto.disclaimer ? `<div class="product-disclaimer">${formatearTexto(producto.disclaimer)}</div>` : ''}
            
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
    
    // Calcular precio con descuento si aplica
    const tieneDescuento = producto.descuento && producto.descuento > 0;
    const precioFinal = tieneDescuento ? 
        (producto.precio * (100 - producto.descuento) / 100) : 
        producto.precio;
    
    const itemIndex = carrito.findIndex(item => item.id === id);
    
    if (itemIndex !== -1) {
        carrito[itemIndex].cantidad += cantidad;
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: precioFinal, // Guardar el precio con descuento aplicado
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

// En la función finalizarCompra, reemplaza con este código:
function finalizarCompra() {
    if (carrito.length === 0) {
        mostrarNotificacion('Tu carrito está vacío');
        return;
    }
    
    // Crear objeto con timestamp para verificar frescura de los datos
    const carritoConTimestamp = {
        items: carrito,
        timestamp: new Date().getTime(),
        origin: window.location.origin,
        // Agregar checksum para verificación de integridad
        checksum: calcularChecksum(carrito)
    };
    
    // Almacenar en múltiples lugares para mayor seguridad
    try {
        localStorage.setItem('carritoCheckout', JSON.stringify(carritoConTimestamp));
        console.log('Carrito guardado en localStorage');
    } catch (e) {
        console.error('Error con localStorage:', e);
    }
    
    try {
        sessionStorage.setItem('carritoCheckout', JSON.stringify(carritoConTimestamp));
        console.log('Carrito guardado en sessionStorage');
    } catch (e) {
        console.error('Error con sessionStorage:', e);
    }
    
    // Usar cookies como respaldo
    try {
        const carritoString = JSON.stringify(carritoConTimestamp);
        document.cookie = `carritoCheckout=${encodeURIComponent(carritoString)}; max-age=300; path=/; samesite=lax`;
        console.log('Carrito guardado en cookies');
    } catch (e) {
        console.error('Error con cookies:', e);
    }
    
    // Redirigir con parámetros URL como último recurso
    try {
        const carritoParam = encodeURIComponent(JSON.stringify(carritoConTimestamp));
        if (carritoParam.length < 2000) { // Límite seguro para URLs
            window.location.href = `checkout.html?carrito=${carritoParam}`;
        } else {
            window.location.href = 'checkout.html';
        }
    } catch (e) {
        console.error('Error al generar URL:', e);
        window.location.href = 'checkout.html';
    }
}

// Función para calcular checksum de verificación
function calcularChecksum(carrito) {
    let checksum = 0;
    carrito.forEach(item => {
        checksum += item.id * item.cantidad + item.precio;
    });
    return checksum % 1000; // Simplificado para demostración
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

// Cargar promociones para el carrusel
function cargarPromociones() {
    fetch('promociones.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar las promociones');
            }
            return response.json();
        })
        .then(promociones => {
            inicializarCarrusel(promociones);
        })
        .catch(error => {
            console.error('Error:', error);
            // Si hay error, mostrar hero por defecto
            document.querySelector('.hero').innerHTML = `
                <div class="container">
                    <div class="hero-content">
                        <h2>Nuevas Ofertas Especiales</h2>
                        <p>Hasta 50% de descuento en productos seleccionados</p>
                        <a href="#" class="btn">Ver Ofertas</a>
                    </div>
                </div>
            `;
        });
}

// Inicializar carrusel con las promociones
function inicializarCarrusel(promociones) {
    const heroSection = document.querySelector('.hero');
    let carruselHTML = `
        <div class="hero-carousel">
            <div class="carousel-nav">
                <div class="carousel-prev"><i class="fas fa-chevron-left"></i></div>
                <div class="carousel-next"><i class="fas fa-chevron-right"></i></div>
            </div>
            <div class="carousel-controls"></div>
    `;
    
    // Generar slides
    promociones.forEach((promo, index) => {
        const slideClass = index === 0 ? 'carousel-slide active' : 'carousel-slide';
        const fondoClass = promo.fondo === 'gradiente' ? 'gradiente' : 'solido';
        
        carruselHTML += `
            <div class="${slideClass} ${fondoClass}" data-id="${promo.id}">
                <div class="carousel-content">
                    <div class="carousel-text ${promo.textoAlineacion}" style="color: ${promo.colorTexto}">
                        <h2>${promo.titulo}</h2>
                        <p>${promo.descripcion}</p>
                        <a href="${promo.botonUrl}" class="carousel-btn">${promo.botonTexto}</a>
                    </div>
                    <div class="carousel-image ${promo.imagenAlineacion}">
                        <img src="${promo.imagen}" alt="${promo.titulo}" class="floating">
                    </div>
                </div>
            </div>
        `;
    });
    
    carruselHTML += `</div>`;
    heroSection.innerHTML = carruselHTML;
    
    // Generar dots de control
    const controlsContainer = document.querySelector('.carousel-controls');
    promociones.forEach((_, index) => {
        const dotClass = index === 0 ? 'carousel-dot active' : 'carousel-dot';
        controlsContainer.innerHTML += `<div class="${dotClass}" data-slide="${index}"></div>`;
    });
    
    // Inicializar funcionalidad del carrusel
    inicializarControlesCarrusel(promociones.length);
}

// Inicializar controles del carrusel
function inicializarControlesCarrusel(totalSlides) {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');
    let currentSlide = 0;
    let autoPlayInterval;
    
    // Función para mostrar slide específico
    function showSlide(index) {
        // Ocultar todos los slides
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        // Mostrar slide seleccionado
        slides[index].classList.add('active');
        dots[index].classList.add('active');
        
        currentSlide = index;
    }
    
    // Función para siguiente slide
    function nextSlide() {
        let nextIndex = (currentSlide + 1) % totalSlides;
        showSlide(nextIndex);
    }
    
    // Función para slide anterior
    function prevSlide() {
        let prevIndex = (currentSlide - 1 + totalSlides) % totalSlides;
        showSlide(prevIndex);
    }
    
    // Event listeners para controles
    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);
    
    // Event listeners para dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
            resetAutoPlay();
        });
    });
    
    // Autoplay
    function startAutoPlay() {
        autoPlayInterval = setInterval(nextSlide, 5000);
    }
    
    function resetAutoPlay() {
        clearInterval(autoPlayInterval);
        startAutoPlay();
    }
    
    // Iniciar autoplay
    startAutoPlay();
    
    // Pausar autoplay al hacer hover en el carrusel
    const carousel = document.querySelector('.hero-carousel');
    carousel.addEventListener('mouseenter', () => {
        clearInterval(autoPlayInterval);
    });
    
    carousel.addEventListener('mouseleave', () => {
        startAutoPlay();
    });
}

// En la inicialización, agregar la carga de promociones
document.addEventListener('DOMContentLoaded', () => {
    cargarPromociones(); // Añadir esta línea
    cargarProductos();
    cargarCarrito();
    actualizarCarrito();
    // ... resto del código de inicialización
});

// Animación de conteo para las estadísticas
function animateValue(id, start, end, duration, options = {}) {
    const element = document.getElementById(id);
    if (!element) return;
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        // Calcular valor actual
        let currentValue;
        if (options.isPercentage) {
            currentValue = Math.floor(progress * (end - start) + start);
            element.innerHTML = currentValue + "%";
        } else if (options.isFraction) {
            currentValue = Math.floor(progress * (end - start) + start);
            element.innerHTML = currentValue + "/10";
        } else {
            currentValue = Math.floor(progress * (end - start) + start);
            
            // Formatear número con separador de miles y signo +
            if (currentValue >= 1000) {
                element.innerHTML = "+" + currentValue.toLocaleString();
            } else {
                element.innerHTML = "+" + currentValue;
            }
        }
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Iniciar animaciones cuando la sección es visible
function initStatsAnimation() {
    const statsSection = document.querySelector('.stats-section');
    if (!statsSection) return;
    
    const rect = statsSection.getBoundingClientRect();
    const isVisible = (rect.top <= window.innerHeight * 0.8) && (rect.bottom >= 0);
    
    if (isVisible) {
        // +1,500 clientes felices
        animateValue("stat1", 0, 1500, 2000);
        
        // 95% de entregas
        animateValue("stat2", 0, 95, 2000, {isPercentage: true});
        
        // 98% de consultas atendidas
        animateValue("stat3", 0, 98, 2000, {isPercentage: true});
        
        // 10/10 pedidos incluyen regalos
        animateValue("stat4", 0, 10, 2000, {isFraction: true});
        
        // 70% de clientes vuelven
        animateValue("stat5", 0, 70, 2000, {isPercentage: true});
        
        window.removeEventListener('scroll', initStatsAnimation);
    }
}

// Iniciar cuando la página carga
document.addEventListener('DOMContentLoaded', function() {
    // Iniciar la animación de estadísticas si ya son visibles
    initStatsAnimation();
    
    // O escuchar al scroll si no son visibles aún
    window.addEventListener('scroll', initStatsAnimation);
});

// Funcionalidad para el modal de login
document.addEventListener('DOMContentLoaded', function() {
    const userButton = document.getElementById('userButton');
    const loginModal = document.getElementById('loginModal');
    const closeLoginModal = document.getElementById('closeLoginModal');
    const googleLogin = document.getElementById('googleLogin');
    const switchToRegister = document.getElementById('switchToRegister');
    
    if (userButton && loginModal) {
        userButton.addEventListener('click', function() {
            loginModal.style.display = 'flex';
        });
        
        closeLoginModal.addEventListener('click', function() {
            loginModal.style.display = 'none';
        });
        
        // Cerrar modal al hacer clic fuera del contenido
        loginModal.addEventListener('click', function(e) {
            if (e.target === loginModal) {
                loginModal.style.display = 'none';
            }
        });
    }
    
    if (googleLogin) {
        googleLogin.addEventListener('click', function() {
            // Aquí se integraría con Firebase Auth o el servicio de autenticación de Google
            alert('Iniciando sesión con Google...');
            // Redirección temporal simulada
            setTimeout(function() {
                window.location.href = 'profile.html';
            }, 1000);
        });
    }
    
    if (switchToRegister) {
        switchToRegister.addEventListener('click', function(e) {
            e.preventDefault();
            // Aquí se cambiaría a la vista de registro
            alert('Funcionalidad de registro próximamente');
        });
    }
});
// Función de búsqueda en tiempo real
function buscarEnTiempoReal() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm.length < 2) {
        searchResults.style.display = 'none';
        return;
    }
    
    const resultados = productos.filter(producto => 
        producto.nombre.toLowerCase().includes(searchTerm) || 
        producto.descripcion.toLowerCase().includes(searchTerm)
    );
    
    mostrarResultadosBusqueda(resultados);
}

// logo
// Función de búsqueda al hacer clic
function buscarProductos() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        currentCategory = 'todos';
        renderizarProductos();
        searchResults.style.display = 'none';
        return;
    }
    
    const productosFiltrados = productos.filter(producto => 
        (producto.nombre.toLowerCase().includes(searchTerm) || 
         producto.descripcion.toLowerCase().includes(searchTerm)) && 
        producto.disponible
    );
    
    if (productosFiltrados.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item">No se encontraron productos</div>';
        searchResults.style.display = 'block';
        return;
    }
    
    // Mostrar resultados en la página principal
    productsContainer.innerHTML = '';
    productosFiltrados.forEach(producto => {
        const tieneDescuento = producto.descuento && producto.descuento > 0;
        const precioOriginal = producto.precio;
        const precioDescuento = tieneDescuento ? 
            (precioOriginal * (100 - producto.descuento) / 100).toFixed(2) : 
            precioOriginal.toFixed(2);
            
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-card-front">
                ${tieneDescuento ? `<div class="product-discount">-${producto.descuento}%</div>` : ''}
                <img src="${producto.imagen}" alt="${producto.nombre}" class="product-image">
                <div class="product-name">${producto.nombre}</div>
            </div>
            <div class="product-card-back">
                <div class="product-name">${producto.nombre}</div>
                <div class="product-price">
                    ${tieneDescuento ? `<span class="original-price">$${precioOriginal.toFixed(2)}</span>` : ''}
                    <span class="${tieneDescuento ? 'discounted-price' : ''}">$${precioDescuento}</span>
                </div>
                <div class="product-short-description">${producto.descripcion.substring(0, 100)}...</div>
            </div>
        `;
        
        productCard.addEventListener('mouseenter', () => {
            productCard.classList.add('flipped');
        });
        
        productCard.addEventListener('mouseleave', () => {
            productCard.classList.remove('flipped');
        });
        
        productCard.addEventListener('click', () => {
            abrirProducto(producto.id);
        });
        
        productsContainer.appendChild(productCard);
    });
    
    searchResults.style.display = 'none';
    searchInput.value = '';
}

// Mostrar resultados de búsqueda en el dropdown
function mostrarResultadosBusqueda(resultados) {
    if (resultados.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item">No se encontraron productos</div>';
        searchResults.style.display = 'block';
        return;
    }
    
    searchResults.innerHTML = '';
    resultados.forEach(producto => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        resultItem.textContent = producto.nombre;
        resultItem.addEventListener('click', () => {
            abrirProducto(producto.id);
            searchResults.style.display = 'none';
            searchInput.value = '';
        });
        searchResults.appendChild(resultItem);
    });
    
    searchResults.style.display = 'block';
}

// Cerrar resultados de búsqueda al hacer clic fuera
document.addEventListener('click', function(e) {
    if (!searchContainer.contains(e.target)) {
        searchResults.style.display = 'none';
    }
});

// Función para desplazamiento suave a secciones
function scrollToSection(sectionId) {
    const element = document.querySelector("." + sectionId) || document.getElementById(sectionId);
    if (element) {
        const header = document.querySelector('header');
        const headerHeight = header ? header.offsetHeight : 0;
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerHeight - 20;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

// Añadir event listeners cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    const sectionLinks = document.querySelectorAll('a[data-section]');
    sectionLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            let sectionId = this.getAttribute('data-section');

            // Ajustes personalizados de redirección
            if (sectionId === "biofx") sectionId = "why-choose-us";
            if (["amigo", "estudiantes", "packs"].includes(sectionId)) sectionId = "featured-products";
            if (sectionId === "Estadísticas") sectionId = "stats-section";
            if (sectionId === "Testimonios") sectionId = "testimonials-section";

            scrollToSection(sectionId);
        });
    });

    // Enlaces de WhatsApp
    const whatsappLinks = document.querySelectorAll('.whatsapp-link');
    whatsappLinks.forEach(link => {
        link.addEventListener('click', function() {
            console.log('Redirigiendo a WhatsApp');
        });
    });
});
