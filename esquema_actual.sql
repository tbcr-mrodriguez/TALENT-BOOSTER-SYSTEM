CREATE TABLE candidates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            archivo TEXT UNIQUE,
            nombre TEXT,
            telefono TEXT,
            email TEXT,
            ubicacion TEXT,
            profesion TEXT,
            universidad TEXT,
            grado_academico TEXT,
            anio_graduacion TEXT,
            perfil_profesional TEXT,
            anos_experiencia TEXT,
            sector_principal TEXT,
            pretension_salarial TEXT,
            disponibilidad TEXT,
            score INTEGER,
            criterio_ai TEXT,
            fecha_analisis TIMESTAMP,
            raw_data TEXT
        );
CREATE TABLE sqlite_sequence(name,seq);
CREATE TABLE habilidades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            candidate_id INTEGER,
            habilidad TEXT,
            tipo TEXT,
            FOREIGN KEY (candidate_id) REFERENCES candidates (id) ON DELETE CASCADE
        );
CREATE TABLE industrias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            candidate_id INTEGER,
            industria TEXT,
            FOREIGN KEY (candidate_id) REFERENCES candidates (id) ON DELETE CASCADE
        );
CREATE TABLE roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            candidate_id INTEGER,
            rol TEXT,
            FOREIGN KEY (candidate_id) REFERENCES candidates (id) ON DELETE CASCADE
        );
CREATE INDEX idx_candidates_sector ON candidates(sector_principal);
CREATE INDEX idx_candidates_score ON candidates(score);
CREATE INDEX idx_habilidades ON habilidades(habilidad, tipo);
CREATE TABLE plantillas_entrevista (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT,
            puesto TEXT,
            tipo TEXT DEFAULT 'generica',
            fecha_creacion TIMESTAMP,
            activa BOOLEAN DEFAULT 1
        );
CREATE TABLE banco_preguntas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plantilla_id INTEGER,
            pregunta TEXT,
            categoria TEXT,
            orden INTEGER,
            tiempo_maximo INTEGER DEFAULT 120,
            FOREIGN KEY (plantilla_id) REFERENCES plantillas_entrevista (id) ON DELETE CASCADE
        );
CREATE TABLE entrevistas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            candidato_id INTEGER NOT NULL,
            plantilla_id INTEGER,
            token_acceso TEXT UNIQUE,
            fecha_inicio TIMESTAMP,
            fecha_fin TIMESTAMP,
            estado TEXT DEFAULT 'pendiente',
            transcripcion_completa TEXT,
            analisis_ia TEXT,
            puntuacion_global REAL,
            enlace_compartido TEXT,
            FOREIGN KEY (candidato_id) REFERENCES candidates (id),
            FOREIGN KEY (plantilla_id) REFERENCES plantillas_entrevista (id)
        );
CREATE TABLE respuestas_entrevista (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entrevista_id INTEGER,
            pregunta_id INTEGER,
            pregunta_texto TEXT,
            respuesta_texto TEXT,
            respuesta_video_path TEXT,
            tiempo_respuesta INTEGER,
            analisis_pregunta TEXT,
            puntuacion_pregunta REAL,
            FOREIGN KEY (entrevista_id) REFERENCES entrevistas (id),
            FOREIGN KEY (pregunta_id) REFERENCES banco_preguntas (id)
        );
