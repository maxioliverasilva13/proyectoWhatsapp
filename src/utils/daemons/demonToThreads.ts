import { Client } from 'pg';

export async function DemonDeleteOldsThreads() {
    const env = process.env.SUBDOMAIN;
    const client = new Client({
        host: process.env.POSTGRES_GLOBAL_DB_HOST,
        port: Number(process.env.POSTGRES_GLOBAL_DB_PORT || 5432),
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB,
    });

    try {
        await client.connect();
        await client.query('DELETE FROM public."chatGptThreads" WHERE last_update <= NOW() - INTERVAL \'15 minute\';');

    } catch (error) {
        console.error('Error ejecutando la consulta :', error);
    } finally {
        await client.end(); 
    }
}
