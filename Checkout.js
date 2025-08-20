// Inicialización del checkout
document.addEventListener('DOMContentLoaded', function() {
    // Cargar el resumen del pedido
    cargarResumenPedido();
    
    // Configurar la subida de archivos
    configurarSubidaArchivos();
    
    // Configurar el envío del formulario
    document.getElementById('checkoutForm').addEventListener('submit', procesarCheckout);
    
    // Configurar botón de cancelar
    document.getElementById('cancelCheckout').addEventListener('click', function() {
        if (confirm('¿Estás seguro de que deseas cancelar tu compra?')) {
            window.location.href = 'index.html';
        }
    });
});

// Cargar resumen del pedido desde localStorage
function cargarResumenPedido() {
    const carrito = JSON.parse(localStorage.getItem('carritoCheckout')) || [];
    const summaryItems = document.getElementById('summaryItems');
    const subtotalElement = document.getElementById('subtotal');
    const totalElement = document.getElementById('total');
    
    if (carrito.length === 0) {
        summaryItems.innerHTML = '<p class="empty">No hay productos en tu carrito</p>';
        return;
    }
    
    // Calcular totales
    let subtotal = 0;
    let html = '';
    
    carrito.forEach(item => {
        const itemTotal = item.precio * item.cantidad;
        subtotal += itemTotal;
        
        html += `
            <div class="summary-item">
                <img src="${item.imagen}" alt="${item.nombre}">
                <div class="summary-item-info">
                    <div class="summary-item-name">${item.nombre}</div>
                    <div class="summary-item-details">
                        <span>${item.cantidad} x $${item.precio.toFixed(2)}</span>
                        <span>$${itemTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    summaryItems.innerHTML = html;
    
    // Calcular envío y total
    const shipping = 5.00;
    const total = subtotal + shipping;
    
    subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('shipping').textContent = `$${shipping.toFixed(2)}`;
    totalElement.textContent = `$${total.toFixed(2)}`;
}

// Configurar la subida de archivos
function configurarSubidaArchivos() {
    const fileInput = document.getElementById('recetaMedica');
    const preview = document.getElementById('uploadPreview');
    
    fileInput.addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="Vista previa de receta" style="max-width: 100%; max-height: 200px;">
                    <p>${fileInput.files[0].name}</p>
                `;
            }
            
            reader.readAsDataURL(this.files[0]);
        }
    });
    
    // Permitir arrastrar y soltar
    preview.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.style.borderColor = 'var(--accent)';
        this.style.backgroundColor = 'rgba(46, 177, 152, 0.1)';
    });
    
    preview.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.style.borderColor = '';
        this.style.backgroundColor = '';
    });
    
    preview.addEventListener('drop', function(e) {
        e.preventDefault();
        this.style.borderColor = '';
        this.style.backgroundColor = '';
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            fileInput.files = e.dataTransfer.files;
            const event = new Event('change');
            fileInput.dispatchEvent(event);
        }
    });
    
    // Hacer que el área de preview sea clickeable
    preview.addEventListener('click', function() {
        fileInput.click();
    });
}

// Procesar el checkout
function procesarCheckout(e) {
    e.preventDefault();
    
    // Validar formulario
    if (!validarFormulario()) {
        mostrarNotificacion('Por favor, completa todos los campos obligatorios', 'error');
        return;
    }
    
    // Mostrar loading
    const submitBtn = document.getElementById('submitCheckout');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    submitBtn.disabled = true;
    
    // Simular procesamiento (en una implementación real, aquí se conectaría con PlaceToPay)
    setTimeout(() => {
        // Guardar información del pedido
        const formData = new FormData(document.getElementById('checkoutForm'));
        const orderData = {
            customer: {
                nombres: formData.get('nombres'),
                apellidos: formData.get('apellidos'),
                tipoDocumento: formData.get('tipoDocumento'),
                numeroDocumento: formData.get('numeroDocumento'),
                email: formData.get('email'),
                telefono: formData.get('telefono'),
                whatsapp: formData.get('whatsapp')
            },
            shipping: {
                direccion: formData.get('direccion'),
                ciudad: formData.get('ciudad'),
                provincia: formData.get('provincia'),
                codigoPostal: formData.get('codigoPostal'),
                pais: formData.get('pais')
            },
            cart: JSON.parse(localStorage.getItem('carritoCheckout')),
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('orderData', JSON.stringify(orderData));
        
        // Aquí iría la integración con PlaceToPay
        // Por ahora, simulamos una redirección
        mostrarNotificacion('¡Pedido procesado con éxito! Redirigiendo a PlaceToPay...', 'success');
        
        // Limpiar carrito después de la compra
        setTimeout(() => {
            localStorage.removeItem('carrito');
            window.location.href = 'index.html'; // En una implementación real, redirigir a PlaceToPay
        }, 2000);
        
    }, 2000);
}

// Validar formulario
function validarFormulario() {
    const requiredFields = document.querySelectorAll('#checkoutForm [required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = 'var(--danger)';
            isValid = false;
            
            // Remover el estilo cuando el usuario comience a escribir
            field.addEventListener('input', function() {
                this.style.borderColor = '';
            });
        }
    });
    
    // Validar email
    const emailField = document.getElementById('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailField.value && !emailRegex.test(emailField.value)) {
        emailField.style.borderColor = 'var(--danger)';
        isValid = false;
        
        emailField.addEventListener('input', function() {
            if (emailRegex.test(this.value)) {
                this.style.borderColor = '';
            }
        });
    }
    
    return isValid;
}

// Mostrar notificación
function mostrarNotificacion(mensaje, tipo = 'success') {
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${tipo}`;
    notificacion.innerHTML = `
        <i class="fas ${tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${mensaje}</span>
    `;
    
    // Estilos para la notificación
    notificacion.style.position = 'fixed';
    notificacion.style.top = '20px';
    notificacion.style.right = '20px';
    notificacion.style.left = '20px';
    notificacion.style.maxWidth = '400px';
    notificacion.style.margin = '0 auto';
    notificacion.style.padding = '15px 20px';
    notificacion.style.borderRadius = '6px';
    notificacion.style.backgroundColor = tipo === 'success' ? 'var(--success)' : 'var(--danger)';
    notificacion.style.color = 'white';
    notificacion.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.15)';
    notificacion.style.zIndex = '10000';
    notificacion.style.display = 'flex';
    notificacion.style.alignItems = 'center';
    notificacion.style.gap = '10px';
    notificacion.style.opacity = '0';
    notificacion.style.transform = 'translateY(-20px)';
    notificacion.style.transition = 'all 0.3s ease';
    
    document.body.appendChild(notificacion);
    
    // Mostrar
    setTimeout(() => {
        notificacion.style.opacity = '1';
        notificacion.style.transform = 'translateY(0)';
    }, 10);
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        notificacion.style.opacity = '0';
        notificacion.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            document.body.removeChild(notificacion);
        }, 300);
    }, 3000);
}