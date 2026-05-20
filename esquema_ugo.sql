-- ========================================================
-- U.G.O. QUANTUM OS - ESQUEMA RELACIONAL (MYSQL)
-- ========================================================
-- Este esquema replica la estructura de Firebase para
-- entornos relacionales tradicionales (PHP/MySQL).

CREATE TABLE profiles (
    id VARCHAR(36) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('cliente', 'prestador', 'admin') NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    rating DECIMAL(3,2) DEFAULT 5.00,
    bio_score DECIMAL(5,2) DEFAULT 5.00,
    latitud DECIMAL(10,8),
    longitud DECIMAL(11,8),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE servicios (
    id VARCHAR(36) PRIMARY KEY,
    cliente_id VARCHAR(36) NOT NULL,
    prestador_id VARCHAR(36),
    categoria VARCHAR(50) NOT NULL,
    descripcion TEXT,
    estado ENUM('buscando', 'asignado', 'en_camino', 'en_progreso', 'completado', 'disputa') DEFAULT 'buscando',
    precio_estimado DECIMAL(10,2),
    fecha_programada DATETIME,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES profiles(id),
    FOREIGN KEY (prestador_id) REFERENCES profiles(id)
);

CREATE TABLE contratos_escrow (
    id VARCHAR(36) PRIMARY KEY,
    servicio_id VARCHAR(36) NOT NULL UNIQUE,
    monto DECIMAL(10,2) NOT NULL,
    estado ENUM('asegurado', 'liberado', 'reembolsado', 'retenido') DEFAULT 'asegurado',
    token_verificacion VARCHAR(64) UNIQUE,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (servicio_id) REFERENCES servicios(id)
);

CREATE TABLE interacciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id VARCHAR(36) NOT NULL,
    hugo_intent VARCHAR(50),
    mensaje_usuario TEXT,
    respuesta_hugo TEXT,
    contexto_json JSON,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES profiles(id)
);
