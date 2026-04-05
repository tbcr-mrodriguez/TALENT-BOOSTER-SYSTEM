-- =====================================================
-- PROCEDIMIENTOS DE BÚSQUEDA SEMÁNTICA
-- =====================================================

-- 1. BUSCAR POR SIMILITUD CON EMBEDDING
CREATE OR REPLACE FUNCTION buscar_por_similitud_con_embedding(
    p_embedding vector(384),
    p_limite INTEGER DEFAULT 20
)
RETURNS TABLE(
    candidate_id INTEGER,
    nombre TEXT,
    profesion TEXT,
    similitud REAL,
    raw_data JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id::INTEGER,
        c.nombre::TEXT,
        c.profesion::TEXT,
        (1 - (ce.embedding <=> p_embedding))::REAL as similitud,
        c.raw_data::JSONB
    FROM candidate_embeddings ce
    JOIN candidates c ON ce.candidate_id = c.id
    ORDER BY ce.embedding <=> p_embedding
    LIMIT p_limite;
END;
$$;-- =====================================================
-- PROCEDIMIENTOS DE BÚSQUEDA SEMÁNTICA
-- =====================================================

-- 1. BUSCAR POR SIMILITUD (recibe texto y devuelve candidatos ordenados)
CREATE OR REPLACE FUNCTION buscar_por_similitud(
    p_texto_busqueda TEXT,
    p_limite INTEGER DEFAULT 20
)
RETURNS TABLE(
    candidate_id INTEGER,
    nombre TEXT,
    profesion TEXT,
    similitud REAL,
    raw_data JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_embedding vector(384);
BEGIN
    -- NOTA: La generación del embedding se hace en Python
    -- Este procedimiento recibe el embedding ya generado
    -- Por ahora, devolvemos error si no se pasa embedding
    RAISE EXCEPTION 'Este procedimiento requiere un embedding. Usar buscar_por_similitud_con_embedding()';
END;
$$;

-- 2. BUSCAR POR SIMILITUD CON EMBEDDING (recibe el vector ya generado)
CREATE OR REPLACE FUNCTION buscar_por_similitud_con_embedding(
    p_embedding vector(384),
    p_limite INTEGER DEFAULT 20
)
RETURNS TABLE(
    candidate_id INTEGER,
    nombre TEXT,
    profesion TEXT,
    similitud REAL,
    raw_data JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.nombre,
        c.profesion,
        1 - (ce.embedding <=> p_embedding) as similitud,
        c.raw_data
    FROM candidate_embeddings ce
    JOIN candidates c ON ce.candidate_id = c.id
    ORDER BY ce.embedding <=> p_embedding
    LIMIT p_limite;
END;
$$;

-- 3. BUSCAR AVANZADO (con filtros + similitud)
CREATE OR REPLACE FUNCTION buscar_avanzado(
    p_embedding vector(384),
    p_sector TEXT DEFAULT NULL,
    p_score_min INTEGER DEFAULT NULL,
    p_ubicacion TEXT DEFAULT NULL,
    p_limite INTEGER DEFAULT 20
)
RETURNS TABLE(
    candidate_id INTEGER,
    nombre TEXT,
    profesion TEXT,
    sector TEXT,
    score INTEGER,
    ubicacion TEXT,
    similitud REAL,
    raw_data JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.nombre,
        c.profesion,
        c.sector_principal,
        c.score,
        c.ubicacion,
        1 - (ce.embedding <=> p_embedding) as similitud,
        c.raw_data
    FROM candidate_embeddings ce
    JOIN candidates c ON ce.candidate_id = c.id
    WHERE (p_sector IS NULL OR c.sector_principal = p_sector)
      AND (p_score_min IS NULL OR c.score >= p_score_min)
      AND (p_ubicacion IS NULL OR c.ubicacion ILIKE '%' || p_ubicacion || '%')
    ORDER BY ce.embedding <=> p_embedding
    LIMIT p_limite;
END;
$$;

