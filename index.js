// ======== Gestión de Inventario ========

// Cargar inventario desde localStorage o iniciar vacío
let inventario = JSON.parse(localStorage.getItem('inventario')) || [];
let idCounter = inventario.length > 0 ? Math.max(...inventario.map(p => p.id)) + 1 : 1;

// Función para agregar un producto al inventario
document.getElementById('form-producto').addEventListener('submit', function (e) {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const cantidad = parseInt(document.getElementById('cantidad').value);

    if (!nombre || isNaN(cantidad) || cantidad < 0) {
        alert('Por favor, ingresa un nombre y una cantidad válidos.');
        return;
    }

    const productoExistente = inventario.find(item => item.nombre.toLowerCase() === nombre.toLowerCase());
    if (productoExistente) {
        alert('Ya existe un producto con el mismo nombre.');
        return;
    }

    const qrCode = `208ID${idCounter}${nombre.replace(/\s+/g, '')}`;
    inventario.push({ id: idCounter, nombre, cantidad, qrCode });
    idCounter++;

    localStorage.setItem('inventario', JSON.stringify(inventario));
    actualizarTabla();
    document.getElementById('nombre').value = '';
    document.getElementById('cantidad').value = '';
});

// Función para actualizar la tabla de inventario
function actualizarTabla(productos = inventario) {
    const tabla = document.getElementById('tabla-inventario');
    tabla.innerHTML = '';

    const productosOrdenados = [...productos].sort((a, b) => a.nombre.localeCompare(b.nombre));

    productosOrdenados.forEach((producto) => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${producto.nombre}</td>
            <td>${producto.cantidad}</td>
            <td>
                <div class="qr" id="qr-${producto.id}"></div>
                <p><strong>ID:</strong> ${producto.qrCode} <button onclick="copiarID('${producto.qrCode}')">Copiar ID</button></p>
                <div class="qr-controls">
                    <button onclick="descargarQR(${producto.id})">Descargar QR</button>
                    <br><br>
                    <button class="eliminar" onclick="eliminarProducto(${producto.id})">Eliminar Producto</button>
                </div>
            </td>
        `;
        tabla.appendChild(fila);

        const qrContainer = document.getElementById(`qr-${producto.id}`);
        QRCode.toDataURL(producto.qrCode, { width: 150 }, function (error, url) {
            if (!error) {
                qrContainer.innerHTML = `<img src="${url}" alt="QR Code" id="qr-img-${producto.id}">`;
            } else {
                qrContainer.innerHTML = 'Error al generar QR';
                console.error('Error generando QR:', error);
            }
        });
    });
}

function copiarID(id) {
    navigator.clipboard.writeText(id).then(() => {
        alert('ID copiado al portapapeles: ' + id);
    }).catch(err => {
        alert('Error al copiar el ID: ' + err);
    });
}

function actualizarInventario() {
    const qrCodeInput = document.getElementById('qr-input').value.trim();
    const movimientoTipo = document.getElementById('tipo-movimiento').value;
    const cantidadMovimiento = parseInt(document.getElementById('mov-cantidad').value);

    if (!qrCodeInput || isNaN(cantidadMovimiento) || cantidadMovimiento <= 0) {
        alert('Por favor, ingresa un código QR y una cantidad válidos.');
        return;
    }

    const producto = inventario.find(item => item.qrCode === qrCodeInput);
    if (!producto) {
        alert('Producto no encontrado.');
        return;
    }

    if (movimientoTipo === 'entrada') {
        producto.cantidad += cantidadMovimiento;
    } else if (movimientoTipo === 'salida') {
        if (producto.cantidad < cantidadMovimiento) {
            alert('No hay suficiente cantidad en inventario.');
            return;
        }
        producto.cantidad -= cantidadMovimiento;
    }

    localStorage.setItem('inventario', JSON.stringify(inventario));
    actualizarTabla();

    document.getElementById('qr-input').value = '';
    document.getElementById('mov-cantidad').value = '';
}

function buscarProducto() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const productosFiltrados = inventario.filter(producto => 
        producto.nombre.toLowerCase().includes(query) || 
        producto.qrCode.toLowerCase().includes(query)
    );
    actualizarTabla(productosFiltrados);
}

function descargarQR(id) {
    const producto = inventario.find(p => p.id === id);
    if (producto) {
        const qrImg = document.getElementById(`qr-img-${producto.id}`);
        if (qrImg) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const qrSize = 200;
            const padding = 20;
            const fontSize = 16;

            canvas.width = qrSize;
            canvas.height = qrSize + padding + fontSize * 2 + 10;

            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = qrImg.src;
            img.onload = function() {
                ctx.drawImage(img, 0, 0, qrSize, qrSize);
                ctx.font = `${fontSize}px Arial`;
                ctx.fillStyle = '#000';
                ctx.textAlign = 'center';

                ctx.fillText(`ID: ${producto.qrCode}`, qrSize / 2, qrSize + fontSize + 5);
                ctx.fillText(`Nombre: ${producto.nombre}`, qrSize / 2, qrSize + fontSize * 2 + 10);

                const finalImageURL = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = finalImageURL;
                a.download = `${producto.qrCode}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            };
            img.onerror = function() {
                alert('Error al cargar la imagen del QR.');
                console.error('Error al cargar la imagen del QR.');
            };
        } else {
            alert('El código QR aún no se ha generado.');
        }
    } else {
        alert('Producto no encontrado.');
    }
}

function eliminarProducto(id) {
    const index = inventario.findIndex(producto => producto.id === id);
    if (index !== -1) {
        if (confirm(`¿Estás seguro de que deseas eliminar el producto "${inventario[index].nombre}"?`)) {
            inventario.splice(index, 1);
            localStorage.setItem('inventario', JSON.stringify(inventario));
            actualizarTabla();
        }
    } else {
        alert('Producto no encontrado.');
    }
}

// ======== Gestión Financiera ========

let transacciones = JSON.parse(localStorage.getItem('financiero')) || [];
let idTransaccionCounter = transacciones.length > 0 ? Math.max(...transacciones.map(t => t.id)) + 1 : 1;

function agregarTransaccion() {
    const tipo = document.getElementById('tipo-transaccion').value;
    const descripcion = document.getElementById('descripcion').value.trim();
    const cantidad = parseFloat(document.getElementById('cantidad-financiera').value);

    if (!tipo || !descripcion || isNaN(cantidad) || cantidad <= 0) {
        alert('Por favor, completa todos los campos con valores válidos.');
        return;
    }

    const transaccion = {
        id: idTransaccionCounter,
        tipo: tipo,
        descripcion: descripcion,
        cantidad: cantidad
    };

    transacciones.push(transaccion);
    idTransaccionCounter++;

    localStorage.setItem('financiero', JSON.stringify(transacciones));
    actualizarTablaFinanciera();
    actualizarResumenFinanciero();

    document.getElementById('tipo-transaccion').selectedIndex = 0;
    document.getElementById('descripcion').value = '';
    document.getElementById('cantidad-financiera').value = '';
}

function actualizarTablaFinanciera() {
    const tablaFinanciera = document.getElementById('tabla-financiera');
    tablaFinanciera.innerHTML = '';

    const transaccionesOrdenadas = [...transacciones].sort((a, b) => b.id - a.id);

    transaccionesOrdenadas.forEach((transaccion) => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${transaccion.tipo.charAt(0).toUpperCase() + transaccion.tipo.slice(1)}</td>
            <td>${transaccion.descripcion}</td>
            <td>$${transaccion.cantidad.toFixed(2)}</td>
            <td>
                <button class="eliminar-financiero" onclick="eliminarTransaccion(${transaccion.id})">Eliminar</button>
            </td>
        `;
        tablaFinanciera.appendChild(fila);
    });
}

function eliminarTransaccion(id) {
    const index = transacciones.findIndex(transaccion => transaccion.id === id);
    if (index !== -1) {
        if (confirm(`¿Estás seguro de que deseas eliminar esta transacción?`)) {
            transacciones.splice(index, 1);
            localStorage.setItem('financiero', JSON.stringify(transacciones));
            actualizarTablaFinanciera();
            actualizarResumenFinanciero();
        }
    } else {
        alert('Transacción no encontrada.');
    }
}

function actualizarResumenFinanciero() {
    const totalIngresos = transacciones
        .filter(t => t.tipo === 'ingreso')
        .reduce((acc, curr) => acc + curr.cantidad, 0);

    const totalGastos = transacciones
        .filter(t => t.tipo === 'gasto')
        .reduce((acc, curr) => acc + curr.cantidad, 0);

    const balanceNeto = totalIngresos - totalGastos;

    document.getElementById('total-ingresos').innerText = totalIngresos.toFixed(2);
    document.getElementById('total-gastos').innerText = totalGastos.toFixed(2);
    document.getElementById('balance-neto').innerText = balanceNeto.toFixed(2);
}

// Inicializar la tabla financiera y el resumen al cargar la página
actualizarTablaFinanciera();
actualizarResumenFinanciero();

// ======== Funciones de Backup ========

function descargarBackup() {
    const backupData = {
        inventario: inventario,
        financiero: transacciones
    };
    const jsonContent = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'backup_gestion_inventario_hobbit.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function restaurarBackup(event) {
    const file = event.target.files[0];
    if (!file) {
        alert('No se seleccionó ningún archivo.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const backupData = JSON.parse(e.target.result);
            if (backupData && Array.isArray(backupData.inventario) && Array.isArray(backupData.financiero)) {
                const inventarioValido = backupData.inventario.every(item => 
                    typeof item.id === 'number' &&
                    typeof item.nombre === 'string' &&
                    typeof item.cantidad === 'number' &&
                    typeof item.qrCode === 'string'
                );

                const financieroValido = backupData.financiero.every(item => 
                    typeof item.id === 'number' &&
                    (item.tipo === 'ingreso' || item.tipo === 'gasto') &&
                    typeof item.descripcion === 'string' &&
                    typeof item.cantidad === 'number'
                );

                if (inventarioValido && financieroValido) {
                    inventario = backupData.inventario;
                    transacciones = backupData.financiero;
                    idCounter = inventario.length > 0 ? Math.max(...inventario.map(p => p.id)) + 1 : 1;
                    idTransaccionCounter = transacciones.length > 0 ? Math.max(...transacciones.map(t => t.id)) + 1 : 1;
                    localStorage.setItem('inventario', JSON.stringify(inventario));
                    localStorage.setItem('financiero', JSON.stringify(transacciones));
                    actualizarTabla();
                    actualizarTablaFinanciera();
                    actualizarResumenFinanciero();
                    alert('Backup restaurado exitosamente.');
                } else {
                    alert('El archivo no contiene un formato válido.');
                }
            } else {
                alert('El archivo no contiene un formato válido.');
            }
        } catch (error) {
            alert('Error al restaurar el backup: ' + error.message);
            console.error('Error al restaurar el backup:', error);
        }
    };
    reader.readAsText(file);
}

function descargarExcel() {
    if (inventario.length === 0 && transacciones.length === 0) {
        alert('No hay datos en el inventario ni en financiero para descargar.');
        return;
    }

    const wb = XLSX.utils.book_new();

    if (inventario.length > 0) {
        const datosInventario = inventario.map(({ id, ...rest }) => rest);
        const wsInventario = XLSX.utils.json_to_sheet(datosInventario);
        XLSX.utils.book_append_sheet(wb, wsInventario, 'Inventario');
    }

    if (transacciones.length > 0) {
        const datosFinanciero = transacciones.map(({ id, ...rest }) => rest);
        const wsFinanciero = XLSX.utils.json_to_sheet(datosFinanciero);
        XLSX.utils.book_append_sheet(wb, wsFinanciero, 'Financiero');
    }

    XLSX.writeFile(wb, 'Gestion_Inventario_Financiero.xlsx');
}

// Inicializar la tabla al cargar la página
actualizarTabla();

// ======== Funcionalidad de Escaneo de QR ========

let html5QrcodeScanner;

function iniciarEscaneo() {
    const qrReader = document.getElementById('qr-reader');
    qrReader.style.display = 'block';

    html5QrcodeScanner = new Html5Qrcode("qr-reader");

    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        document.getElementById('qr-input').value = decodedText;
        alert('Código QR escaneado exitosamente: ' + decodedText);

        html5QrcodeScanner.stop().then(ignore => {
            qrReader.style.display = 'none';
        }).catch(err => {
            console.error('Error al detener el escaneo QR:', err);
        });
    };

    const config = { fps: 10, qrbox: 250 };

    html5QrcodeScanner.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback
    ).catch(err => {
        console.error('Error al iniciar el escaneo QR:', err);
        alert('No se pudo iniciar el escaneo QR. Por favor, verifica los permisos de la cámara.');
        qrReader.style.display = 'none';
    });
}
