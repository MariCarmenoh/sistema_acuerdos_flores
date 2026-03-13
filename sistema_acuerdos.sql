-- BASE DE DATOS: sistema_acuerdos 
-- Sistema de Acuerdos Municipales - Municipalidad de Flores, 2026

-- Creación  base de datos
CREATE DATABASE sistema_acuerdos
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_spanish_ci;

USE sistema_acuerdos;

-- TABLAS

-- Usuarios
CREATE TABLE usuarios (
    id_usuario      INT             AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(100)    NOT NULL,
    apellidos       VARCHAR(150)    NOT NULL,
    correo          VARCHAR(150)    UNIQUE NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL,
    rol             ENUM('Administrador','Usuario') NOT NULL,
    puesto          VARCHAR(100),
    activo          BOOLEAN         DEFAULT TRUE,
    fecha_creacion  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso   TIMESTAMP       NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- Actas
CREATE TABLE actas (
    numero_acta         VARCHAR(50)     PRIMARY KEY,
    tipo_sesion         ENUM('Ordinaria','Extraordinaria') NOT NULL,
    fecha_sesion        DATE            NOT NULL,
    ruta_pdf            VARCHAR(500)    NOT NULL,
    usuario_registro    INT             NOT NULL,
    fecha_registro      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    -- Soft delete
    eliminado           BOOLEAN         DEFAULT FALSE,
    fecha_eliminacion   TIMESTAMP       NULL,
    eliminado_por       INT             NULL,

    FOREIGN KEY (usuario_registro)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE,
    FOREIGN KEY (eliminado_por)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- Acuerdos
CREATE TABLE acuerdos (
    numero_acuerdo      VARCHAR(50)     PRIMARY KEY,
    asunto              TEXT            NOT NULL,
    fecha_acuerdo       DATE            NOT NULL,
    estado              ENUM('Pendiente','Cumplido','Vencido') DEFAULT 'Pendiente',
    plazo_dias          INT UNSIGNED    NULL,
    fecha_vencimiento   DATE            NULL,
    fecha_respuesta     DATE            NULL,
    numero_acta         VARCHAR(50)     NOT NULL,
    usuario_registro    INT             NOT NULL,
    fecha_registro      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    usuario_modificacion INT            NULL,
    fecha_modificacion  TIMESTAMP       NULL ON UPDATE CURRENT_TIMESTAMP,
    -- Soft delete
    eliminado           BOOLEAN         DEFAULT FALSE,
    fecha_eliminacion   TIMESTAMP       NULL,
    eliminado_por       INT             NULL,

    FOREIGN KEY (numero_acta)
        REFERENCES actas(numero_acta)
        ON UPDATE CASCADE,
    FOREIGN KEY (usuario_registro)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE,
    FOREIGN KEY (usuario_modificacion)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE,
    FOREIGN KEY (eliminado_por)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- Oficios
CREATE TABLE oficios (
    id_oficio        INT             AUTO_INCREMENT PRIMARY KEY,
    numero_acuerdo   VARCHAR(50)     NOT NULL,
    ruta_pdf         VARCHAR(500)    NOT NULL,
    nombre_archivo   VARCHAR(255)    NULL,
    fecha_registro   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    usuario_registro INT             NOT NULL,

    FOREIGN KEY (numero_acuerdo)
        REFERENCES acuerdos(numero_acuerdo)
        ON UPDATE CASCADE,
    FOREIGN KEY (usuario_registro)
        REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- Historial
CREATE TABLE historial_cambios (
    id_historial    INT             AUTO_INCREMENT PRIMARY KEY,
    tabla_afectada  VARCHAR(50)     NOT NULL,
    registro_id     VARCHAR(50)     NOT NULL,
    accion          ENUM('INSERT','UPDATE','DELETE') NOT NULL,
    usuario_id      INT             NULL,
    detalle         TEXT            NULL,
    fecha           TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

-- ÍNDICES

CREATE INDEX idx_estado              ON acuerdos(estado);
CREATE INDEX idx_fecha_acuerdo       ON acuerdos(fecha_acuerdo);
CREATE INDEX idx_fecha_vencimiento   ON acuerdos(fecha_vencimiento);
CREATE INDEX idx_numero_acta         ON acuerdos(numero_acta);
CREATE INDEX idx_eliminado_acuerdos  ON acuerdos(eliminado);
CREATE INDEX idx_tipo_sesion         ON actas(tipo_sesion);
CREATE INDEX idx_fecha_sesion        ON actas(fecha_sesion);
CREATE INDEX idx_eliminado_actas     ON actas(eliminado);

ALTER TABLE acuerdos ADD FULLTEXT idx_fulltext_asunto (asunto);

-- TRIGGERS

DELIMITER $$

CREATE TRIGGER acuerdos_before_insert
BEFORE INSERT ON acuerdos
FOR EACH ROW
BEGIN
    IF NEW.plazo_dias IS NOT NULL THEN
        SET NEW.fecha_vencimiento = DATE_ADD(NEW.fecha_acuerdo, INTERVAL NEW.plazo_dias DAY);
    END IF;
END$$

CREATE TRIGGER acuerdos_before_update
BEFORE UPDATE ON acuerdos
FOR EACH ROW
BEGIN
    IF NEW.plazo_dias IS NOT NULL THEN
        SET NEW.fecha_vencimiento = DATE_ADD(NEW.fecha_acuerdo, INTERVAL NEW.plazo_dias DAY);
    ELSE
        SET NEW.fecha_vencimiento = NULL;
    END IF;
END$$

CREATE TRIGGER acuerdos_after_insert
AFTER INSERT ON acuerdos
FOR EACH ROW
BEGIN
    INSERT INTO historial_cambios
        (tabla_afectada, registro_id, accion, usuario_id, detalle)
    VALUES
        ('acuerdos', NEW.numero_acuerdo, 'INSERT', @usuario_activo, 'Acuerdo creado');
END$$

CREATE TRIGGER acuerdos_after_update
AFTER UPDATE ON acuerdos
FOR EACH ROW
BEGIN
    DECLARE v_detalle TEXT DEFAULT '';

    IF OLD.eliminado = FALSE AND NEW.eliminado = TRUE THEN
        INSERT INTO historial_cambios (tabla_afectada, registro_id, accion, usuario_id, detalle)
        VALUES ('acuerdos', NEW.numero_acuerdo, 'DELETE', @usuario_activo, 'Acuerdo eliminado por el usuario');
    ELSE
        IF OLD.estado <> NEW.estado THEN
            SET v_detalle = CONCAT(v_detalle, 'estado: ', OLD.estado, ' → ', NEW.estado, ' | ');
        END IF;
        IF OLD.asunto <> NEW.asunto THEN
            SET v_detalle = CONCAT(v_detalle, 'asunto modificado | ');
        END IF;
        IF IFNULL(OLD.fecha_respuesta, '0') <> IFNULL(NEW.fecha_respuesta, '0') THEN
            SET v_detalle = CONCAT(v_detalle, 'fecha_respuesta actualizada | ');
        END IF;

        IF v_detalle <> '' THEN
            SET v_detalle = LEFT(v_detalle, CHAR_LENGTH(v_detalle) - 3);
        ELSE
            SET v_detalle = 'Sin cambios detectados';
        END IF;

        INSERT INTO historial_cambios (tabla_afectada, registro_id, accion, usuario_id, detalle)
        VALUES ('acuerdos', NEW.numero_acuerdo, 'UPDATE', @usuario_activo, v_detalle);
    END IF;
END$$

CREATE TRIGGER oficios_after_insert
AFTER INSERT ON oficios
FOR EACH ROW
BEGIN
    INSERT INTO historial_cambios (tabla_afectada, registro_id, accion, detalle, usuario_id)
    VALUES (
        'oficios', NEW.numero_acuerdo, 'INSERT',
        CONCAT('Oficio agregado: ', IFNULL(NEW.nombre_archivo, CONCAT('#', NEW.id_oficio))),
        @usuario_activo
    );
END$$

CREATE TRIGGER oficios_after_delete
AFTER DELETE ON oficios
FOR EACH ROW
BEGIN
    INSERT INTO historial_cambios (tabla_afectada, registro_id, accion, detalle, usuario_id)
    VALUES (
        'oficios', OLD.numero_acuerdo, 'DELETE',
        CONCAT('Oficio eliminado: ', IFNULL(OLD.nombre_archivo, CONCAT('#', OLD.id_oficio))),
        @usuario_activo
    );
END$$

DELIMITER ;

-- VISTAS  

CREATE VIEW vista_dashboard_estados AS
SELECT
    estado,
    COUNT(*)               AS total,
    MIN(fecha_vencimiento) AS proximo_vencimiento
FROM acuerdos
WHERE eliminado = FALSE
GROUP BY estado;


CREATE VIEW vista_acuerdos_semaforo AS
SELECT
    a.numero_acuerdo,
    a.asunto,
    a.fecha_acuerdo,
    a.estado,
    a.plazo_dias,
    a.fecha_vencimiento,
    a.fecha_respuesta,
    a.numero_acta,
    ac.tipo_sesion,
    ac.ruta_pdf,
    CASE
        WHEN a.estado = 'Vencido'                                       THEN 'ROJO'
        WHEN a.estado = 'Pendiente' AND a.fecha_vencimiento < CURDATE() THEN 'ROJO'
        WHEN a.estado = 'Pendiente'                                     THEN 'AMARILLO'
        WHEN a.estado = 'Cumplido'                                      THEN 'VERDE'
    END AS semaforo
FROM acuerdos a
JOIN actas ac ON a.numero_acta = ac.numero_acta
WHERE a.eliminado = FALSE
  AND ac.eliminado = FALSE;


CREATE VIEW vista_acuerdos_completos AS
SELECT
    a.numero_acuerdo,
    a.asunto,
    a.fecha_acuerdo,
    a.estado,
    a.plazo_dias,
    a.fecha_vencimiento,
    a.fecha_respuesta,
    a.numero_acta,
    ac.tipo_sesion,
    ac.fecha_sesion,
    ac.ruta_pdf,
    CONCAT(u.nombre, ' ', u.apellidos) AS registrado_por,
    a.fecha_registro
FROM acuerdos a
JOIN actas    ac ON a.numero_acta       = ac.numero_acta
JOIN usuarios u  ON a.usuario_registro = u.id_usuario
WHERE a.eliminado = FALSE
  AND ac.eliminado = FALSE;
  
  -- Creación Usuario Admin
  INSERT INTO usuarios (nombre, apellidos, correo, password_hash, rol, puesto)
VALUES (
   'Admin',
   'Sistemas',
   'admin@flores.go.cr',
   '$2a$12$RfMyzzLAjRoU5a1mKVFENer2JxOZmOhSaeymqrEXQhI4LFPlb/90C',   
   'Administrador',
   'Administrador TI'
);