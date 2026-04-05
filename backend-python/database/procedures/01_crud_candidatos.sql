-- =====================================================
-- PROCEDIMIENTOS CRUD PARA CANDIDATOS
-- =====================================================

-- 1. CREAR CANDIDATO
CREATE OR REPLACE FUNCTION crear_candidato(
    p_archivo TEXT,
    p_raw_data JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_candidate_id INTEGER;
    v_nombre TEXT;
    v_profesion TEXT;
    v_universidad TEXT;
    v_sector TEXT;
    v_anos_experiencia TEXT;
    v_score INTEGER;
    v_criterio TEXT;
BEGIN
    -- Extraer datos del JSON
    v_nombre := p_raw_data->'datos_crudos'->>'nombre';
    v_profesion := p_raw_data->'datos_crudos'->>'profesion_escrita';
    v_universidad := p_raw_data->'datos_crudos'->>'universidad';
    v_sector := p_raw_data->'interpretacion'->>'sector_deducido';
    v_anos_experiencia := p_raw_data->'interpretacion'->>'anos_experiencia_deducidos';
    v_score := (p_raw_data->>'score')::INTEGER;
    v_criterio := p_raw_data->>'criterio_ai';
    
    -- Insertar candidato
    INSERT INTO candidates (
        archivo, nombre, telefono, email, ubicacion,
        profesion, universidad, grado_academico, anio_graduacion,
        perfil_profesional, anos_experiencia, sector_principal,
        pretension_salarial, disponibilidad, score, criterio_ai,
        raw_data
    ) VALUES (
        p_archivo,
        v_nombre,
        p_raw_data->'datos_crudos'->>'telefono',
        p_raw_data->'datos_crudos'->>'email',
        p_raw_data->'datos_crudos'->>'ubicacion',
        v_profesion,
        v_universidad,
        p_raw_data->'datos_crudos'->>'grado_academico',
        p_raw_data->'datos_crudos'->>'anio_graduacion',
        p_raw_data->'datos_crudos'->>'perfil_textual',
        v_anos_experiencia,
        v_sector,
        p_raw_data->'datos_crudos'->>'pretension_salarial',
        p_raw_data->'datos_crudos'->>'disponibilidad',
        v_score,
        v_criterio,
        p_raw_data
    )
    RETURNING id INTO v_candidate_id;
    
    -- Insertar habilidades clave
    IF p_raw_data->'interpretacion'->'habilidades_clave' IS NOT NULL THEN
        INSERT INTO habilidades (candidate_id, habilidad, tipo)
        SELECT v_candidate_id, value, 'habilidad_clave'
        FROM jsonb_array_elements_text(p_raw_data->'interpretacion'->'habilidades_clave');
    END IF;
    
    -- Insertar fortalezas
    IF p_raw_data->'interpretacion'->'fortalezas' IS NOT NULL THEN
        INSERT INTO habilidades (candidate_id, habilidad, tipo)
        SELECT v_candidate_id, value, 'fortaleza'
        FROM jsonb_array_elements_text(p_raw_data->'interpretacion'->'fortalezas');
    END IF;
    
    -- Insertar industria principal
    IF p_raw_data->'interpretacion'->>'industria_principal' IS NOT NULL THEN
        INSERT INTO industrias (candidate_id, industria)
        VALUES (v_candidate_id, p_raw_data->'interpretacion'->>'industria_principal');
    END IF;
    
    -- Insertar industrias secundarias
    IF p_raw_data->'interpretacion'->'industrias_secundarias' IS NOT NULL THEN
        INSERT INTO industrias (candidate_id, industria)
        SELECT v_candidate_id, value
        FROM jsonb_array_elements_text(p_raw_data->'interpretacion'->'industrias_secundarias');
    END IF;
    
    RETURN v_candidate_id;
END;
$$;

-- 2. OBTENER CANDIDATO COMPLETO
CREATE OR REPLACE FUNCTION obtener_candidato(p_id INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_resultado JSONB;
BEGIN
    SELECT jsonb_build_object(
        'candidato', to_jsonb(c),
        'habilidades', COALESCE((
            SELECT jsonb_agg(to_jsonb(h))
            FROM habilidades h
            WHERE h.candidate_id = p_id
        ), '[]'::jsonb),
        'industrias', COALESCE((
            SELECT jsonb_agg(i.industria)
            FROM industrias i
            WHERE i.candidate_id = p_id
        ), '[]'::jsonb),
        'roles', COALESCE((
            SELECT jsonb_agg(r.rol)
            FROM roles r
            WHERE r.candidate_id = p_id
        ), '[]'::jsonb),
        'tiene_embedding', EXISTS(
            SELECT 1 FROM candidate_embeddings ce
            WHERE ce.candidate_id = p_id
        )
    ) INTO v_resultado
    FROM candidates c
    WHERE c.id = p_id;
    
    RETURN v_resultado;
END;
$$;

-- 3. OBTENER TODOS LOS CANDIDATOS
CREATE OR REPLACE FUNCTION obtener_todos_candidatos()
RETURNS SETOF JSONB
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT to_jsonb(c) FROM candidates c ORDER BY fecha_analisis DESC;
END;
$$;

-- 4. ACTUALIZAR CANDIDATO
CREATE OR REPLACE FUNCTION actualizar_candidato(
    p_id INTEGER,
    p_raw_data JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_nombre TEXT;
    v_profesion TEXT;
    v_universidad TEXT;
    v_sector TEXT;
    v_anos_experiencia TEXT;
    v_score INTEGER;
    v_criterio TEXT;
BEGIN
    -- Extraer datos del JSON
    v_nombre := p_raw_data->'datos_crudos'->>'nombre';
    v_profesion := p_raw_data->'datos_crudos'->>'profesion_escrita';
    v_universidad := p_raw_data->'datos_crudos'->>'universidad';
    v_sector := p_raw_data->'interpretacion'->>'sector_deducido';
    v_anos_experiencia := p_raw_data->'interpretacion'->>'anos_experiencia_deducidos';
    v_score := (p_raw_data->>'score')::INTEGER;
    v_criterio := p_raw_data->>'criterio_ai';
    
    -- Actualizar candidato
    UPDATE candidates SET
        nombre = v_nombre,
        telefono = p_raw_data->'datos_crudos'->>'telefono',
        email = p_raw_data->'datos_crudos'->>'email',
        ubicacion = p_raw_data->'datos_crudos'->>'ubicacion',
        profesion = v_profesion,
        universidad = v_universidad,
        grado_academico = p_raw_data->'datos_crudos'->>'grado_academico',
        anio_graduacion = p_raw_data->'datos_crudos'->>'anio_graduacion',
        perfil_profesional = p_raw_data->'datos_crudos'->>'perfil_textual',
        anos_experiencia = v_anos_experiencia,
        sector_principal = v_sector,
        pretension_salarial = p_raw_data->'datos_crudos'->>'pretension_salarial',
        disponibilidad = p_raw_data->'datos_crudos'->>'disponibilidad',
        score = v_score,
        criterio_ai = v_criterio,
        raw_data = p_raw_data,
        fecha_analisis = CURRENT_TIMESTAMP
    WHERE id = p_id;
    
    -- Eliminar relaciones antiguas
    DELETE FROM habilidades WHERE candidate_id = p_id;
    DELETE FROM industrias WHERE candidate_id = p_id;
    DELETE FROM roles WHERE candidate_id = p_id;
    
    -- Reinsertar habilidades clave
    IF p_raw_data->'interpretacion'->'habilidades_clave' IS NOT NULL THEN
        INSERT INTO habilidades (candidate_id, habilidad, tipo)
        SELECT p_id, value, 'habilidad_clave'
        FROM jsonb_array_elements_text(p_raw_data->'interpretacion'->'habilidades_clave');
    END IF;
    
    -- Reinsertar fortalezas
    IF p_raw_data->'interpretacion'->'fortalezas' IS NOT NULL THEN
        INSERT INTO habilidades (candidate_id, habilidad, tipo)
        SELECT p_id, value, 'fortaleza'
        FROM jsonb_array_elements_text(p_raw_data->'interpretacion'->'fortalezas');
    END IF;
    
    -- Reinsertar industrias
    IF p_raw_data->'interpretacion'->>'industria_principal' IS NOT NULL THEN
        INSERT INTO industrias (candidate_id, industria)
        VALUES (p_id, p_raw_data->'interpretacion'->>'industria_principal');
    END IF;
    
    IF p_raw_data->'interpretacion'->'industrias_secundarias' IS NOT NULL THEN
        INSERT INTO industrias (candidate_id, industria)
        SELECT p_id, value
        FROM jsonb_array_elements_text(p_raw_data->'interpretacion'->'industrias_secundarias');
    END IF;
    
    RETURN FOUND;
END;
$$;
