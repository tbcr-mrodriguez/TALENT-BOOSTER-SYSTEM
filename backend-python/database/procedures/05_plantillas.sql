-- =====================================================
-- PROCEDIMIENTOS PARA PLANTILLAS DE ENTREVISTA
-- =====================================================

-- 1. OBTENER TODAS LAS PLANTILLAS
CREATE OR REPLACE FUNCTION obtener_plantillas()
RETURNS TABLE(
    id INTEGER,
    nombre TEXT,
    puesto TEXT,
    tipo TEXT,
    fecha_creacion TIMESTAMP,
    activa BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.nombre, p.puesto, p.tipo, p.fecha_creacion, p.activa
    FROM plantillas_entrevista p
    ORDER BY p.fecha_creacion DESC;
END;
$$;

-- 2. CREAR PLANTILLA CON PREGUNTAS
CREATE OR REPLACE FUNCTION crear_plantilla(
    p_nombre TEXT,
    p_puesto TEXT,
    p_tipo TEXT,
    p_preguntas JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_plantilla_id INTEGER;
    v_pregunta JSONB;
BEGIN
    -- Insertar plantilla
    INSERT INTO plantillas_entrevista (nombre, puesto, tipo, fecha_creacion)
    VALUES (p_nombre, p_puesto, p_tipo, CURRENT_TIMESTAMP)
    RETURNING id INTO v_plantilla_id;
    
    -- Insertar preguntas
    FOR v_pregunta IN SELECT * FROM jsonb_array_elements(p_preguntas)
    LOOP
        INSERT INTO banco_preguntas (plantilla_id, pregunta, categoria, orden, tiempo_maximo)
        VALUES (
            v_plantilla_id,
            v_pregunta->>'pregunta',
            v_pregunta->>'categoria',
            (v_pregunta->>'orden')::INTEGER,
            COALESCE((v_pregunta->>'tiempo_maximo')::INTEGER, 120)
        );
    END LOOP;
    
    RETURN v_plantilla_id;
END;
$$;

-- 3. OBTENER PLANTILLA CON PREGUNTAS
CREATE OR REPLACE FUNCTION obtener_plantilla(p_id INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_resultado JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', p.id,
        'nombre', p.nombre,
        'puesto', p.puesto,
        'tipo', p.tipo,
        'fecha_creacion', p.fecha_creacion,
        'preguntas', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', bp.id,
                'pregunta', bp.pregunta,
                'categoria', bp.categoria,
                'orden', bp.orden,
                'tiempo_maximo', bp.tiempo_maximo
            ))
            FROM banco_preguntas bp
            WHERE bp.plantilla_id = p.id
            ORDER BY bp.orden
        ), '[]'::jsonb)
    ) INTO v_resultado
    FROM plantillas_entrevista p
    WHERE p.id = p_id;
    
    RETURN v_resultado;
END;
$$;
