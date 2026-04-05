-- =====================================================
-- PROCEDIMIENTOS PARA EMBEDDINGS
-- =====================================================

-- 1. GUARDAR EMBEDDING DE CANDIDATO
CREATE OR REPLACE FUNCTION guardar_embedding(
    p_candidate_id INTEGER,
    p_embedding vector(384),
    p_texto_completo TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO candidate_embeddings (candidate_id, embedding, texto_completo, fecha_actualizacion)
    VALUES (p_candidate_id, p_embedding, p_texto_completo, CURRENT_TIMESTAMP)
    ON CONFLICT (candidate_id) DO UPDATE SET
        embedding = EXCLUDED.embedding,
        texto_completo = COALESCE(EXCLUDED.texto_completo, candidate_embeddings.texto_completo),
        fecha_actualizacion = CURRENT_TIMESTAMP;
    
    RETURN FOUND;
END;
$$;

-- 2. ELIMINAR EMBEDDING DE CANDIDATO
CREATE OR REPLACE FUNCTION eliminar_embedding(p_candidate_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM candidate_embeddings WHERE candidate_id = p_candidate_id;
    RETURN FOUND;
END;
$$;

-- 3. VERIFICAR SI CANDIDATO TIENE EMBEDDING
CREATE OR REPLACE FUNCTION tiene_embedding(p_candidate_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM candidate_embeddings WHERE candidate_id = p_candidate_id);
END;
$$;

-- 4. OBTENER EMBEDDING DE CANDIDATO
CREATE OR REPLACE FUNCTION obtener_embedding(p_candidate_id INTEGER)
RETURNS vector(384)
LANGUAGE plpgsql
AS $$
DECLARE
    v_embedding vector(384);
BEGIN
    SELECT embedding INTO v_embedding
    FROM candidate_embeddings
    WHERE candidate_id = p_candidate_id;
    
    RETURN v_embedding;
END;
$$;
