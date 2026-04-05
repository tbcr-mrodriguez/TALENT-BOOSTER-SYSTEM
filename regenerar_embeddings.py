#!/usr/bin/env python3
"""
Script para regenerar embeddings en PostgreSQL
Ejecutar solo después de migrar los datos de SQLite a PostgreSQL
"""

import psycopg2
import psycopg2.extras
from sentence_transformers import SentenceTransformer
import json

# Configuración de conexión a PostgreSQL
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'talent_pipeline',
    'user': 'talent_user',
    'password': 'Talent123!'
}

# Cargar el modelo de embeddings (el mismo que usabas antes)
print("📥 Cargando modelo de embeddings...")
modelo = SentenceTransformer('all-MiniLM-L6-v2')
print("✅ Modelo cargado")

def construir_texto_candidato(candidato):
    """
    Construye el texto completo del candidato para generar el embedding
    Esto debe ser IDÉNTICO a como lo hacías en tu código original
    """
    texto = ""
    
    # Datos crudos
    dc = candidato.get('datos_crudos', {})
    texto += f"NOMBRE: {dc.get('nombre', '')}\n"
    texto += f"PROFESIÓN: {dc.get('profesion_escrita', '')}\n"
    texto += f"UBICACIÓN: {dc.get('ubicacion', '')}\n"
    texto += f"UNIVERSIDAD: {dc.get('universidad', '')}\n"
    texto += f"EXPERIENCIA: {dc.get('experiencia_texto', '')}\n"
    texto += f"HABILIDADES: {', '.join(dc.get('habilidades_listadas', []))}\n"
    texto += f"HERRAMIENTAS: {', '.join(dc.get('herramientas_listadas', []))}\n"
    texto += f"IDIOMAS: {', '.join(dc.get('idiomas_listados', []))}\n"
    
    # Interpretación IA
    interp = candidato.get('interpretacion', {})
    texto += f"SECTOR DEDUCIDO: {interp.get('sector_deducido', '')}\n"
    texto += f"SENIORITY: {interp.get('seniority', '')}\n"
    texto += f"HABILIDADES CLAVE: {', '.join(interp.get('habilidades_clave', []))}\n"
    texto += f"PERFIL INTERPRETADO: {interp.get('perfil_interpretado', '')}\n"
    
    return texto

def main():
    print("🔌 Conectando a PostgreSQL...")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        print("✅ Conectado a PostgreSQL")
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return
    
    # Obtener todos los candidatos
    print("📋 Obteniendo candidatos...")
    cursor.execute("SELECT id, raw_data FROM candidates")
    candidatos = cursor.fetchall()
    print(f"✅ {len(candidatos)} candidatos encontrados")
    
    # Generar embeddings para cada uno
    for i, c in enumerate(candidatos):
        try:
            # Parsear raw_data a JSON
            raw_data = json.loads(c['raw_data'])
            
            # Construir texto
            texto = construir_texto_candidato(raw_data)
            
            # Generar embedding
            embedding = modelo.encode(texto)
            embedding_lista = embedding.tolist()
            
            # Guardar en PostgreSQL
            cursor.execute("""
                INSERT INTO candidate_embeddings (candidate_id, embedding, texto_completo)
                VALUES (%s, %s, %s)
                ON CONFLICT (candidate_id) DO UPDATE SET
                    embedding = EXCLUDED.embedding,
                    texto_completo = EXCLUDED.texto_completo,
                    fecha_actualizacion = CURRENT_TIMESTAMP
            """, (c['id'], embedding_lista, texto))
            
            print(f"  ✅ [{i+1}/{len(candidatos)}] Candidato ID {c['id']} procesado")
            
        except Exception as e:
            print(f"  ❌ Error con candidato ID {c['id']}: {e}")
    
    # Confirmar cambios
    conn.commit()
    conn.close()
    
    print("\n🎉 ¡Proceso completado!")
    print("Todos los embeddings fueron generados y guardados en PostgreSQL.")

if __name__ == "__main__":
    main()
