#!/usr/bin/env python3
import sys
import os
import json
import psycopg2
import psycopg2.extras
from openai import OpenAI

# Configuración - poner al inicio como variables globales
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://localhost:5432/talent_pipeline')
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

# Si no está en variables de entorno, usar valores por defecto
if not DATABASE_URL or DATABASE_URL == 'postgresql://localhost:5432/talent_pipeline':
    # Intentar conectar a PostgreSQL local (ajusta según tu configuración)
    DATABASE_URL = 'postgresql://talent_user:Talent123!@localhost:5432/talent_pipeline'

print(f"🔧 Usando DATABASE_URL: {DATABASE_URL[:50]}...")

openai_client = OpenAI(api_key=OPENAI_API_KEY)

def get_db_connection():
    url = DATABASE_URL
    if url.startswith('postgres://'):
        url = url.replace('postgres://', 'postgresql://', 1)
    return psycopg2.connect(url)

def safe_json_parse(text):
    import re
    start = text.find("{")
    end = text.rfind("}") + 1
    if start == -1 or end == 0:
        raise ValueError("No se encontró JSON válido")
    return json.loads(text[start:end])

def analizar_entrevista(entrevista_id):
    print(f"📊 Analizando entrevista {entrevista_id}...")
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    cursor.execute("CALL obtener_reporte_completo_entrevista(%s, %s)", (entrevista_id, None))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        print("❌ No se encontraron datos")
        return False
    
    resultado_json = None
    for key, value in row.items():
        resultado_json = value
        break
    
    if not resultado_json:
        print("❌ No se encontró JSON")
        return False
    
    datos = json.loads(resultado_json)
    
    entrevista = datos.get('entrevista', {})
    candidato_data = entrevista.get('candidato_data', {})
    plantilla = datos.get('plantilla', {})
    preguntas_config = datos.get('preguntas_configuracion', [])
    respuestas = datos.get('respuestas', [])
    
    interpretacion = candidato_data.get('interpretacion', {})
    datos_crudos = candidato_data.get('datos_crudos', {})
    
    prompt = f"""
Eres un Headhunter Senior. Evalúa este candidato para el puesto de Desarrollador Full Stack .NET.

## CANDIDATO
Nombre: {datos_crudos.get('nombre', 'N/A')}
Profesión: {datos_crudos.get('profesion_escrita', 'N/A')}
Seniority: {interpretacion.get('seniority', 'N/A')}
Experiencia: {interpretacion.get('anos_experiencia_deducidos', 'N/A')}
Habilidades: {', '.join(interpretacion.get('habilidades_clave', [])[:10])}
Empresas: {', '.join(datos_crudos.get('empresas', [])[:5])}

## SOBRE EL PUESTO
Objetivo de la entrevista: {plantilla.get('objetivo', 'N/A')[:400]}

## RESPUESTAS
{chr(10).join([f"Pregunta {i+1}: {conf.get('pregunta', 'N/A')[:100]}... (Tiempo: {respuestas[i].get('tiempo', 0) if i < len(respuestas) else 0} segundos)" for i, conf in enumerate(preguntas_config)]) if preguntas_config else 'No hay preguntas'}

## INSTRUCCIONES
Evalúa al candidato basado en su CV (15+ años experiencia, Senior, empresas como Gorilla Logic, Oceans Code Expert) y su desempeño en entrevista.

Devuelve JSON con:
{{
  "resumen_ejecutivo": "Evaluación detallada de 2-3 párrafos",
  "score_global": 0-100,
  "cumple_requisitos_tecnicos": true/false,
  "cumple_requisitos_experiencia": true/false,
  "cumple_ajuste_cultural": true/false,
  "fortalezas_generales": ["fortaleza1", "fortaleza2", "fortaleza3"],
  "areas_mejora": ["area1", "area2", "area3"],
  "recomendacion_final": "contratar/avanzar/no_recomendable",
  "argumento_recomendacion": "explicación detallada",
  "insight_headhunter": "análisis honesto"
}}
"""
    
    print("📡 Llamando a ChatGPT...")
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=2000
    )
    
    analisis = safe_json_parse(response.choices[0].message.content)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    score = analisis.get('score_global', 0)
    cursor.execute("""
        UPDATE entrevistas 
        SET analisis_ia = %s, puntuacion_global = %s, estado = 'analizada'
        WHERE id = %s
    """, (json.dumps(analisis, ensure_ascii=False), score, entrevista_id))
    conn.commit()
    conn.close()
    
    print(f"✅ Análisis guardado con score: {score}")
    print(f"📝 Resumen: {analisis.get('resumen_ejecutivo', 'N/A')[:200]}...")
    return True

if __name__ == "__main__":
    entrevista_id = 44
    print(f"🔍 Procesando entrevista {entrevista_id}...")
    resultado = analizar_entrevista(entrevista_id)
    print("✅ Completado" if resultado else "❌ Falló")
