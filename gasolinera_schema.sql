-- ============================================================================
-- SGBG - Base de datos de la gasolinera (MySQL 8.0+)
-- Ejecutar completo en MySQL Workbench (icono del rayo).
-- ============================================================================
DROP DATABASE IF EXISTS gasolinera;
CREATE DATABASE gasolinera CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gasolinera;

-- ----------------------------------------------------------------------------
-- USUARIOS Y ROLES
-- ----------------------------------------------------------------------------
CREATE TABLE usuarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  usuario       VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,           -- hash bcrypt, nunca la contraseña en texto
  rol           ENUM('ADMIN','CAJERO','DESPACHADOR') NOT NULL,
  activo        BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- COMBUSTIBLES Y PRECIOS
-- ----------------------------------------------------------------------------
CREATE TABLE combustibles (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  codigo        VARCHAR(20)  NOT NULL UNIQUE,    -- SUPER, REGULAR, DIESEL
  nombre        VARCHAR(100) NOT NULL,
  precio_galon  DECIMAL(10,2) NOT NULL CHECK (precio_galon > 0)
);

CREATE TABLE precios_historial (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  combustible_id  INT NOT NULL,
  precio_anterior DECIMAL(10,2) NOT NULL,
  precio_nuevo    DECIMAL(10,2) NOT NULL,
  usuario_id      INT NULL,
  fecha           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (combustible_id) REFERENCES combustibles(id),
  FOREIGN KEY (usuario_id)     REFERENCES usuarios(id)
);

-- ----------------------------------------------------------------------------
-- TANQUES, BOMBAS Y RECEPCIONES DE COMBUSTIBLE
-- ----------------------------------------------------------------------------
CREATE TABLE tanques (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  combustible_id    INT NOT NULL,
  capacidad_galones DECIMAL(12,3) NOT NULL CHECK (capacidad_galones > 0),
  galones_actuales  DECIMAL(12,3) NOT NULL CHECK (galones_actuales >= 0),
  FOREIGN KEY (combustible_id) REFERENCES combustibles(id)
);

CREATE TABLE bombas (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  combustible_id  INT NOT NULL,
  estado          ENUM('INACTIVO','DESPACHANDO','PAUSADO') NOT NULL DEFAULT 'INACTIVO',
  FOREIGN KEY (combustible_id) REFERENCES combustibles(id)
);

CREATE TABLE recepciones_combustible (            -- reabastecimientos desde la cisterna
  id          INT AUTO_INCREMENT PRIMARY KEY,
  tanque_id   INT NOT NULL,
  galones     DECIMAL(12,3) NOT NULL CHECK (galones > 0),
  costo_total DECIMAL(12,2) NULL,                 -- opcional: para calcular ganancia real
  proveedor   VARCHAR(100) NULL,
  usuario_id  INT NULL,
  fecha       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tanque_id)  REFERENCES tanques(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ----------------------------------------------------------------------------
-- TURNOS
-- ----------------------------------------------------------------------------
CREATE TABLE turnos (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id        INT NOT NULL,
  efectivo_inicial  DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (efectivo_inicial >= 0),
  fecha_apertura    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_cierre      TIMESTAMP NULL,
  efectivo_esperado DECIMAL(12,2) NULL,
  efectivo_contado  DECIMAL(12,2) NULL,
  diferencia        DECIMAL(12,2) NULL,
  estado            ENUM('ABIERTO','CERRADO') NOT NULL DEFAULT 'ABIERTO',
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ----------------------------------------------------------------------------
-- DESPACHOS (tiques) Y FACTURAS
-- ----------------------------------------------------------------------------
CREATE TABLE despachos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  bomba_id        INT NOT NULL,
  combustible_id  INT NOT NULL,
  precio_galon    DECIMAL(10,2) NOT NULL,         -- precio vigente al momento del despacho
  monto_objetivo  DECIMAL(12,2) NOT NULL CHECK (monto_objetivo > 0),
  monto_total     DECIMAL(12,2) NOT NULL DEFAULT 0,
  galones         DECIMAL(12,3) NOT NULL DEFAULT 0,
  estado          ENUM('EN_CURSO','PAUSADO','COMPLETADO','FACTURADO') NOT NULL DEFAULT 'EN_CURSO',
  usuario_id      INT NULL,
  fecha           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bomba_id)       REFERENCES bombas(id),
  FOREIGN KEY (combustible_id) REFERENCES combustibles(id),
  FOREIGN KEY (usuario_id)     REFERENCES usuarios(id)
);

CREATE TABLE facturas (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  despacho_id     INT NOT NULL UNIQUE,            -- un despacho se factura una sola vez
  turno_id        INT NOT NULL,
  cliente_nombre  VARCHAR(150) NOT NULL DEFAULT 'Consumidor Final',
  nit             VARCHAR(20)  NOT NULL DEFAULT 'CF',
  metodo_pago     ENUM('EFECTIVO','TARJETA') NOT NULL,
  subtotal        DECIMAL(12,2) NOT NULL,
  iva             DECIMAL(12,2) NOT NULL,
  total           DECIMAL(12,2) NOT NULL,
  fecha           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (despacho_id) REFERENCES despachos(id),
  FOREIGN KEY (turno_id)    REFERENCES turnos(id)
);

-- ----------------------------------------------------------------------------
-- CONCILIACIÓN DE INVENTARIO E INCIDENCIAS
-- ----------------------------------------------------------------------------
CREATE TABLE conciliaciones (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  tanque_id        INT NOT NULL,
  galones_libro    DECIMAL(12,3) NOT NULL,
  galones_medidos  DECIMAL(12,3) NOT NULL,
  diferencia       DECIMAL(12,3) NOT NULL,
  porcentaje       DECIMAL(6,2)  NOT NULL,
  ajustado         BOOLEAN NOT NULL DEFAULT FALSE,
  usuario_id       INT NULL,
  fecha            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tanque_id)  REFERENCES tanques(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE incidencias (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  bomba_id          INT NOT NULL,
  descripcion       TEXT NOT NULL,
  estado            ENUM('PENDIENTE','RESUELTO') NOT NULL DEFAULT 'PENDIENTE',
  usuario_id        INT NULL,
  fecha_reporte     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_resolucion  TIMESTAMP NULL,
  FOREIGN KEY (bomba_id)   REFERENCES bombas(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Auditoría: quién hizo qué (cambios de precio, anulaciones, paros de emergencia)
CREATE TABLE bitacora (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT NULL,
  accion      VARCHAR(60)  NOT NULL,
  detalle     VARCHAR(255) NULL,
  fecha       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Índices para los reportes
CREATE INDEX idx_facturas_fecha  ON facturas(fecha);
CREATE INDEX idx_facturas_turno  ON facturas(turno_id);
CREATE INDEX idx_despachos_fecha ON despachos(fecha);

-- ----------------------------------------------------------------------------
-- VISTAS PARA REPORTES
-- ----------------------------------------------------------------------------
CREATE VIEW v_ventas_por_combustible AS
SELECT c.nombre AS combustible,
       COUNT(f.id)  AS transacciones,
       SUM(d.galones) AS galones,
       SUM(f.total)   AS total_vendido
FROM facturas f
JOIN despachos d    ON d.id = f.despacho_id
JOIN combustibles c ON c.id = d.combustible_id
GROUP BY c.id, c.nombre;

CREATE VIEW v_ventas_por_hora AS
SELECT HOUR(f.fecha) AS hora, COUNT(*) AS transacciones, SUM(f.total) AS total_vendido
FROM facturas f
GROUP BY HOUR(f.fecha)
ORDER BY hora;

CREATE VIEW v_resumen_turno AS
SELECT t.id AS turno_id, u.nombre AS cajero, t.efectivo_inicial,
       COALESCE(SUM(CASE WHEN f.metodo_pago = 'EFECTIVO' THEN f.total END), 0) AS ventas_efectivo,
       COALESCE(SUM(CASE WHEN f.metodo_pago = 'TARJETA'  THEN f.total END), 0) AS ventas_tarjeta,
       COUNT(f.id) AS transacciones
FROM turnos t
JOIN usuarios u ON u.id = t.usuario_id
LEFT JOIN facturas f ON f.turno_id = t.id
GROUP BY t.id, u.nombre, t.efectivo_inicial;

-- ----------------------------------------------------------------------------
-- DATOS INICIALES (los mismos del frontend)
-- ----------------------------------------------------------------------------
-- La contraseña real se guarda con bcrypt desde el backend; este valor es solo un marcador.
INSERT INTO usuarios (nombre, usuario, password_hash, rol) VALUES
  ('Administrador', 'admin',  'CAMBIAR_POR_HASH_BCRYPT', 'ADMIN'),
  ('Cajero Demo',   'cajero', 'CAMBIAR_POR_HASH_BCRYPT', 'CAJERO');

INSERT INTO combustibles (codigo, nombre, precio_galon) VALUES
  ('SUPER',   'Gasolina Súper (95 Octanos)',   38.50),
  ('REGULAR', 'Gasolina Regular (88 Octanos)', 37.00),
  ('DIESEL',  'Diésel Ultra Bajo en Azufre',   34.50);

INSERT INTO tanques (combustible_id, capacidad_galones, galones_actuales) VALUES
  (1, 3000, 2200),
  (2, 3000, 1100),
  (3, 4000, 3100);

INSERT INTO bombas (combustible_id, estado) VALUES
  (1, 'INACTIVO'), (2, 'INACTIVO'), (3, 'INACTIVO'), (1, 'INACTIVO');

-- Verificación rápida
SHOW TABLES;
SELECT * FROM combustibles;
