-- =====================================================
-- INICIALIZACIÓN DE BASE DE DATOS
-- =====================================================

-- Crear extensión vector si no existe
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- TABLA candidates
-- =====================================================
CREATE TABLE IF NOT EXISTS candidates (
    id SERIAL PRIMARY KEY,
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
    fecha_analisis TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    raw_data JSONB
);

-- =====================================================
-- TABLA habilidades
-- =====================================================
CREATE TABLE IF NOT EXISTS habilidades (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
    habilidad TEXT,
    tipo TEXT
);

-- =====================================================
-- TABLA industrias
-- =====================================================
CREATE TABLE IF NOT EXISTS industrias (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
    industria TEXT
);

-- =====================================================
-- TABLA roles
-- =====================================================
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
    rol TEXT
);

-- =====================================================
-- TABLA plantillas_entrevista
-- =====================================================
CREATE TABLE IF NOT EXISTS plantillas_entrevista (
    id SERIAL PRIMARY KEY,
    nombre TEXT,
    puesto TEXT,
    tipo TEXT DEFAULT 'generica',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activa BOOLEAN DEFAULT TRUE
);

-- =====================================================
-- TABLA banco_preguntas
-- =====================================================
CREATE TABLE IF NOT EXISTS banco_preguntas (
    id SERIAL PRIMARY KEY,
    plantilla_id INTEGER REFERENCES plantillas_entrevista(id) ON DELETE CASCADE,
    pregunta TEXT,
    categoria TEXT,
    orden INTEGER,
    tiempo_maximo INTEGER DEFAULT 120
);

-- =====================================================
-- TABLA entrevistas
-- =====================================================
CREATE TABLE IF NOT EXISTS entrevistas (
    id SERIAL PRIMARY KEY,
    candidato_id INTEGER NOT NULL REFERENCES candidates(id),
    plantilla_id INTEGER REFERENCES plantillas_entrevista(id),
    token_acceso TEXT UNIQUE,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP,
    estado TEXT DEFAULT 'pendiente',
    transcripcion_completa TEXT,
    analisis_ia JSONB,
    puntuacion_global REAL,
    enlace_compartido TEXT
);

-- =====================================================
-- TABLA respuestas_entrevista
-- =====================================================
CREATE TABLE IF NOT EXISTS respuestas_entrevista (
    id SERIAL PRIMARY KEY,
    entrevista_id INTEGER REFERENCES entrevistas(id) ON DELETE CASCADE,
    pregunta_id INTEGER REFERENCES banco_preguntas(id),
    pregunta_texto TEXT,
    respuesta_texto TEXT,
    respuesta_video_path TEXT,
    tiempo_respuesta INTEGER,
    analisis_pregunta JSONB,
    puntuacion_pregunta REAL
);

-- =====================================================
-- TABLA candidate_embeddings (para vectores)
-- =====================================================
CREATE TABLE IF NOT EXISTS candidate_embeddings (
    candidate_id INTEGER PRIMARY KEY REFERENCES candidates(id) ON DELETE CASCADE,
    embedding vector(384),
    texto_completo TEXT,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_candidates_sector ON candidates(sector_principal);
CREATE INDEX IF NOT EXISTS idx_candidates_score ON candidates(score);
CREATE INDEX IF NOT EXISTS idx_habilidades ON habilidades(habilidad, tipo);
CREATE INDEX IF NOT EXISTS idx_entrevistas_candidato ON entrevistas(candidato_id);
CREATE INDEX IF NOT EXISTS idx_entrevistas_estado ON entrevistas(estado);
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON candidate_embeddings USING ivfflat (embedding vector_cosine_ops);
