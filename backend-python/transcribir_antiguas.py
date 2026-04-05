#!/usr/bin/env python3
import os
import sys
import psycopg2
import psycopg2.extras
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv('.env.development')

DATABASE_URL = os.environ.get('DATABASE_URL')
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
VIDEO_UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads", "entrevistas_video")

openai_client = OpenAI(api_key=OPENAI_API_KEY)

def transcribir_video(filepath):
    try:
        with open(filepath, "rb") as audio_file:
            transcript = openai_client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )
        return transcript
    except Exception as e:
        print(f"Error: {e}")
        return None

def main():
    entrevista_id = int(sys.argv[1]) if len(sys.argv) > 1 else 44
    print(f"🔍 Procesando entrevista {entrevista_id}...")
    
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    cursor.execute("""
        SELECT id, respuesta_video_path, respuesta_texto
        FROM respuestas_entrevista_v2
        WHERE entrevista_id = %s 
        AND (respuesta_texto IS NULL OR respuesta_texto = '' OR respuesta_texto = 'Grabación de video')
    """, (entrevista_id,))
    
    respuestas = cursor.fetchall()
    
    for r in respuestas:
        video_path = r['respuesta_video_path']
        if video_path:
            full_path = os.path.join(VIDEO_UPLOAD_FOLDER, video_path)
            if os.path.exists(full_path):
                print(f"🎙️ Transcribiendo: {video_path}")
                transcripcion = transcribir_video(full_path)
                if transcripcion:
                    cursor.execute("""
                        UPDATE respuestas_entrevista_v2
                        SET respuesta_texto = %s, fecha_transcripcion = CURRENT_TIMESTAMP
                        WHERE id = %s
                    """, (transcripcion, r['id']))
                    print(f"✅ Transcripción guardada")
                else:
                    print(f"⚠️ No se pudo transcribir")
            else:
                print(f"❌ Video no encontrado: {full_path}")
    
    conn.commit()
    conn.close()
    print("✅ Proceso completado")

if __name__ == "__main__":
    main()
