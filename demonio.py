import time
import psycopg2
from psycopg2.extras import RealDictCursor
import os

print(os.getenv('SUBDOMAIN'))
DATABASE_CONFIG = {
    'dbname': 'db_works',
    'user': "works_user",
    'password': "works_pass",
    'host': os.getenv('SUBDOMAIN'),
    'port': '5432'
}

def procesar_cambios():
    try:
        conn = psycopg2.connect(**DATABASE_CONFIG)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute('DELETE FROM public."chatGptThreads" WHERE last_update <= NOW() - INTERVAL \'1 minute\';')
        
        conn.commit()

    except Exception as e:
        print(f"Error al procesar cambios: {e}")

if __name__ == "__main__":
    while True:
        time.sleep(60) 
        procesar_cambios()
