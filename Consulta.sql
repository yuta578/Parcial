
CREATE DATABASE IF NOT EXISTS universidad;
USE universidad;

CREATE TABLE IF NOT EXISTS estudiantes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    codigo      VARCHAR(20)  NOT NULL UNIQUE,
    programa    VARCHAR(100),
    semestre    INT,
    email       VARCHAR(150)
);

CREATE TABLE IF NOT EXISTS pagos (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    estudiante_id   INT NOT NULL,
    valor           DECIMAL(12,2) NOT NULL,
    fecha           DATE NOT NULL,
    concepto        VARCHAR(150),
    estado          ENUM('pendiente','pagado','vencido') DEFAULT 'pendiente',
    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id)
);

CREATE TABLE IF NOT EXISTS horarios (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    materia     VARCHAR(100) NOT NULL,
    docente     VARCHAR(100),
    aula        VARCHAR(30),
    dia         VARCHAR(15),
    hora_inicio TIME,
    hora_fin    TIME
);


DROP ROLE IF EXISTS 'coordinador_academico';
DROP ROLE IF EXISTS 'finanzas';
DROP ROLE IF EXISTS 'consultor_externo';

CREATE ROLE 'coordinador_academico';
CREATE ROLE 'finanzas';
CREATE ROLE 'consultor_externo';


GRANT SELECT, INSERT, UPDATE
    ON universidad.estudiantes
    TO 'coordinador_academico';

GRANT SELECT, INSERT, UPDATE, DELETE
    ON universidad.horarios
    TO 'coordinador_academico';

GRANT SELECT
    ON universidad.estudiantes
    TO 'finanzas';

GRANT SELECT, INSERT, UPDATE
    ON universidad.pagos
    TO 'finanzas';

GRANT SELECT
    ON universidad.estudiantes
    TO 'consultor_externo';

GRANT SELECT
    ON universidad.horarios
    TO 'consultor_externo';

DROP USER IF EXISTS 'coord1'@'localhost';
DROP USER IF EXISTS 'fin1'@'localhost';
DROP USER IF EXISTS 'consultor1'@'localhost';

CREATE USER 'coord1'@'localhost'       IDENTIFIED BY 'Coord@2024!';
CREATE USER 'fin1'@'localhost'         IDENTIFIED BY 'Fin@2024!';
CREATE USER 'consultor1'@'localhost'   IDENTIFIED BY 'Consult@2024!';


GRANT 'coordinador_academico' TO 'coord1'@'localhost';
GRANT 'finanzas'               TO 'fin1'@'localhost';
GRANT 'consultor_externo'      TO 'consultor1'@'localhost';


SET DEFAULT ROLE 'coordinador_academico' TO 'coord1'@'localhost';
SET DEFAULT ROLE 'finanzas'               TO 'fin1'@'localhost';
SET DEFAULT ROLE 'consultor_externo'      TO 'consultor1'@'localhost';


FLUSH PRIVILEGES;

SHOW GRANTS FOR 'coordinador_academico';
SHOW GRANTS FOR 'finanzas';
SHOW GRANTS FOR 'consultor_externo';

SHOW GRANTS FOR 'coord1'@'localhost';
SHOW GRANTS FOR 'fin1'@'localhost';
SHOW GRANTS FOR 'consultor1'@'localhost';


INSERT INTO estudiantes (nombre, codigo, programa, semestre, email) VALUES
    ('Ana Torres',    'EST001', 'Ingeniería de Sistemas', 4, 'ana@uni.edu'),
    ('Luis Pérez',    'EST002', 'Administración',         2, 'luis@uni.edu'),
    ('María Gómez',   'EST003', 'Medicina',               6, 'maria@uni.edu');

INSERT INTO pagos (estudiante_id, valor, fecha, concepto, estado) VALUES
    (1, 1500000.00, '2024-01-15', 'Matrícula semestre 1-2024', 'pagado'),
    (2, 1500000.00, '2024-01-20', 'Matrícula semestre 1-2024', 'pendiente'),
    (3, 1800000.00, '2024-01-18', 'Matrícula semestre 1-2024', 'pagado');

INSERT INTO horarios (materia, docente, aula, dia, hora_inicio, hora_fin) VALUES
    ('Bases de Datos',  'Dr. Ramírez', 'A-101', 'Lunes',    '08:00:00', '10:00:00'),
    ('Cálculo I',       'Dra. López',  'B-203', 'Martes',   '10:00:00', '12:00:00'),
    ('Inglés Técnico',  'Prof. Smith', 'C-105', 'Miércoles','14:00:00', '16:00:00');



DROP ROLE IF EXISTS 'coordinador_academico', 'finanzas', 'consultor_externo';
CREATE ROLE 'coordinador_academico';
CREATE ROLE 'finanzas';
CREATE ROLE 'consultor_externo';


GRANT SELECT, INSERT, UPDATE ON universidad.estudiantes TO 'coordinador_academico';
GRANT SELECT, INSERT, UPDATE, DELETE ON universidad.horarios TO 'coordinador_academico';


GRANT SELECT ON universidad.estudiantes TO 'finanzas';
GRANT SELECT, INSERT, UPDATE ON universidad.pagos TO 'finanzas';


GRANT SELECT ON universidad.estudiantes TO 'consultor_externo';
GRANT SELECT ON universidad.horarios    TO 'consultor_externo';


DROP USER IF EXISTS 'coord1'@'localhost', 'fin1'@'localhost', 'consultor1'@'localhost';
CREATE USER 'coord1'@'localhost'     IDENTIFIED BY 'Coord@2024!';
CREATE USER 'fin1'@'localhost'       IDENTIFIED BY 'Fin@2024!';
CREATE USER 'consultor1'@'localhost' IDENTIFIED BY 'Consult@2024!';

GRANT 'coordinador_academico' TO 'coord1'@'localhost';
GRANT 'finanzas'               TO 'fin1'@'localhost';
GRANT 'consultor_externo'      TO 'consultor1'@'localhost';

SET DEFAULT ROLE 'coordinador_academico' TO 'coord1'@'localhost';
SET DEFAULT ROLE 'finanzas'               TO 'fin1'@'localhost';
SET DEFAULT ROLE 'consultor_externo'      TO 'consultor1'@'localhost';

FLUSH PRIVILEGES;


SET @codigo_estudiante = 'EST001';
SET @consulta_vulnerable = CONCAT(
    "SELECT * FROM estudiantes WHERE codigo = '", @codigo_estudiante, "'"
);
SELECT @consulta_vulnerable AS consulta_generada;

SET @payload1 = "' OR '1'='1";
SET @consulta_payload1 = CONCAT(
    "SELECT * FROM estudiantes WHERE codigo = '", @payload1, "'"
);
SELECT @consulta_payload1 AS consulta_inyectada;

SET @payload2 = "' UNION SELECT 1,user(),password,4,5 FROM mysql.user-- -";
SET @consulta_payload2 = CONCAT(
    "SELECT * FROM estudiantes WHERE codigo = '", @payload2, "'"
);
SELECT @consulta_payload2 AS consulta_union_inyectada;

SET @payload3 = "'; DROP TABLE pagos; --";
SET @consulta_payload3 = CONCAT(
    "SELECT * FROM estudiantes WHERE codigo = '", @payload3, "'"
);
SELECT @consulta_payload3 AS consulta_destructiva;



SET @input_codigo = 'EST001';

PREPARE stmt FROM 'SELECT * FROM estudiantes WHERE codigo = ?';
EXECUTE stmt USING @input_codigo;
DEALLOCATE PREPARE stmt;

DROP PROCEDURE IF EXISTS sp_buscar_estudiante;

DELIMITER $$

CREATE PROCEDURE sp_buscar_estudiante(
    IN p_codigo VARCHAR(20)   
)
BEGIN

    SELECT
        id,
        nombre,
        codigo,
        programa,
        semestre,
        email
    FROM estudiantes
    WHERE codigo = p_codigo;
END$$

DELIMITER ;


CALL sp_buscar_estudiante('EST001');

CALL sp_buscar_estudiante("' OR '1'='1");
