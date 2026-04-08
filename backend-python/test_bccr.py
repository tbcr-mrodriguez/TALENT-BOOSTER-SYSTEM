from sentence_transformers import SentenceTransformer
import psycopg2
import psycopg2.extras

modelo = SentenceTransformer('all-MiniLM-L6-v2')

conn = psycopg2.connect(
    host='localhost',
    port=5432,
    database='talent_pipeline',
    user='talent_user',
    password='Talent123!'
)

# Reemplaza [ID] con el ID del candidato que trabaja en el BCCR (del paso 1)
BCCR_CANDIDATE_ID = 31  # ← CAMBIA ESTO POR EL ID REAL

query = 'dame alguien que haya trabajado en el banco central de Costa Rica'
query_embedding = modelo.encode(query).tolist()

cursor = conn.cursor()

# 1. Ver la similitud del candidato específico
cursor.execute('''
    SELECT c.id, c.nombre, 1 - (ce.embedding <=> %s::vector) as similitud
    FROM candidate_embeddings ce
    JOIN candidates c ON ce.candidate_id = c.id
    WHERE c.id = %s
''', (query_embedding, BCCR_CANDIDATE_ID))

row = cursor.fetchone()
if row:
    print(f"🔍 Candidato BCCR (ID: {row[0]} - {row[1]})")
    print(f"   Similitud con la pregunta: {row[2]:.4f} ({row[2]*100:.1f}%)")
else:
    print(f"❌ No se encontró embedding para el candidato ID {BCCR_CANDIDATE_ID}")

# 2. Ver el texto que se usó para el embedding del candidato
cursor.execute('''
    SELECT LEFT(texto_completo, 1500) as texto
    FROM candidate_embeddings
    WHERE candidate_id = %s
''', (BCCR_CANDIDATE_ID,))

row = cursor.fetchone()
if row:
    print("\n📝 TEXTO DEL EMBEDDING (primeros 1500 caracteres):")
    print("-" * 60)
    print(row[0])
    print("-" * 60)
    
    # Verificar si contiene "Banco Central"
    if "Banco Central" in row[0] or "BCCR" in row[0]:
        print("✅ El texto SÍ contiene 'Banco Central' o 'BCCR'")
    else:
        print("❌ El texto NO contiene 'Banco Central' ni 'BCCR'")

# 3. Ver los top 20 candidatos por similitud
cursor.execute('''
    SELECT c.id, c.nombre, 1 - (ce.embedding <=> %s::vector) as similitud
    FROM candidate_embeddings ce
    JOIN candidates c ON ce.candidate_id = c.id
    ORDER BY ce.embedding <=> %s::vector
    LIMIT 20
''', (query_embedding, query_embedding))

print("\n📊 TOP 20 CANDIDATOS POR SIMILITUD:")
print("-" * 60)
for i, row in enumerate(cursor.fetchall()):
    marca = " ← BCCR" if row[0] == BCCR_CANDIDATE_ID else ""
    print(f"{i+1:2}. ID: {row[0]}, Nombre: {row[1][:30]}, Similitud: {row[2]:.4f}{marca}")

cursor.close()
conn.close()
