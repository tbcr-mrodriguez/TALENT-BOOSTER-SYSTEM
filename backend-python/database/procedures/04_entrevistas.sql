-- =====================================================
-- PROCEDIMIENTOS PARA ENTREVISTAS
-- =====================================================

-- 1. PROGRAMAR ENTREVISTA
CREATE OR REPLACE FUNCTION programar_entrevista(
    p_candidato_id INTEGER,
    p_plantilla_id INTEGER,
    p_token_acceso TEXT,
    p_enlace_compartido TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_entrevista_id INTEGER;
BEGIN
    INSERT INTO entrevistas (
        candidato_id, plantilla_id, token_acceso, 
        fecha_inicio, estado, enlace_compartido
    ) VALUES (
        p_candidato_id, p_plantilla_id, p_token_acceso,
        CURRENT_TIMESTAMP, 'pendiente', p_enlace_compartido
    )
    RETURNING id INTO v_entrevista_id;
    
    RETURN v_entrevista_id;
END;
$$;

-- 2. OBTENER ENTREVISTA POR TOKEN
CREATE OR REPLACE FUNCTION obtener_entrevista_por_token(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_resultado JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', e.id,
        'estado', e.estado,
        'fecha_inicio', e.fecha_inicio,
        'plantilla_id', e.plantilla_id,
        'candidato_nombre', c.nombre,
        'candidato_id', c.id,
        'preguntas', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', bp.id,
                'pregunta', bp.pregunta,
                'categoria', bp.categoria,
                'tiempo_maximo', bp.tiempo_maximo
            ))
            FROM banco_preguntas bp
            WHERE bp.plantilla_id = e.plantilla_id
            ORDER BY bp.orden
        ), '[]'::jsonb)
    ) INTO v_resultado
    FROM entrevistas e
    JOIN candidates c ON e.candidato_id = c.id
    WHERE e.token_acceso = p_token;
    
    RETURN v_resultado;
END;
$$;

-- 3. INICIAR ENTREVISTA (cambiar estado a en_progreso)
CREATE OR REPLACE FUNCTION iniciar_entrevista(p_entrevista_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE entrevistas 
    SET estado = 'en_progreso'
    WHERE id = p_entrevista_id AND estado = 'pendiente';
    
    RETURN FOUND;
END;
$$;

-- 4. GUARDAR RESPUESTA DE ENTREVISTA
CREATE OR REPLACE FUNCTION guardar_respuesta_entrevista(
    p_entrevista_id INTEGER,
    p_pregunta_id INTEGER,
    p_pregunta_texto TEXT,
    p_respuesta_texto TEXT,
    p_respuesta_video_path TEXT,
    p_tiempo_respuesta INTEGER,
    p_analisis_pregunta JSONB DEFAULT NULL,
    p_puntuacion_pregunta REAL DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_respuesta_id INTEGER;
BEGIN
    INSERT INTO respuestas_entrevista (
        entrevista_id, pregunta_id, pregunta_texto, respuesta_texto,
        respuesta_video_path, tiempo_respuesta, analisis_pregunta, puntuacion_pregunta
    ) VALUES (
        p_entrevista_id, p_pregunta_id, p_pregunta_texto, p_respuesta_texto,
        p_respuesta_video_path, p_tiempo_respuesta, p_analisis_pregunta, p_puntuacion_pregunta
    )
    RETURNING id INTO v_respuesta_id;
    
    RETURN v_respuesta_id;
END;
$$;

-- 5. FINALIZAR ENTREVISTA
CREATE OR REPLACE FUNCTION finalizar_entrevista(
    p_entrevista_id INTEGER,
    p_transcripcion_completa TEXT DEFAULT NULL,
    p_analisis_ia JSONB DEFAULT NULL,
    p_puntuacion_global REAL DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE entrevistas 
    SET estado = 'completada',
        fecha_fin = CURRENT_TIMESTAMP,
        transcripcion_completa = COALESCE(p_transcripcion_completa, transcripcion_completa),
        analisis_ia = COALESCE(p_analisis_ia, analisis_ia),
        puntuacion_global = COALESCE(p_puntuacion_global, puntuacion_global)
    WHERE id = p_entrevista_id;
    
    RETURN FOUND;
END;
$$;

-- 6. OBTENER ENTREVISTAS POR CANDIDATO
CREATE OR REPLACE FUNCTION obtener_entrevistas_por_candidato(p_candidato_id INTEGER)
RETURNS TABLE(
    id INTEGER,
    fecha_inicio TIMESTAMP,
    fecha_fin TIMESTAMP,
    estado TEXT,
    puntuacion_global REAL,
    plantilla TEXT,
    puesto TEXT,
    enlace TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.fecha_inicio,
        e.fecha_fin,
        e.estado,
        e.puntuacion_global,
        p.nombre as plantilla,
        p.puesto,
        e.enlace_compartido as enlace
    FROM entrevistas e
    JOIN plantillas_entrevista p ON e.plantilla_id = p.id
    WHERE e.candidato_id = p_candidato_id
    ORDER BY e.fecha_inicio DESC;
END;
$$;
