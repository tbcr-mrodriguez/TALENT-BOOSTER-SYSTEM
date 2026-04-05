from app import modelo_embeddings, get_db_connection

# Generar un embedding real
texto = "prueba"
embedding_real = modelo_embeddings.encode(texto).tolist()
embedding_str = '[' + ','.join(str(x) for x in embedding_real) + ']'

conn = get_db_connection()
cursor = conn.cursor()

# Probar el procedimiento con un embedding real
cursor.execute("SELECT guardar_embedding(1, %s::vector, 'prueba')", (embedding_str,))
resultado = cursor.fetchone()
print(f"Resultado: {resultado}")

conn.commit()
conn.close()