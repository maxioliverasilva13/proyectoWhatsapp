import { Client } from 'pg';

export async function DemonDeleteOldsThreads() {
    console.log('xd1 aca');
    const env = process.env.SUBDOMAIN;
    const client = new Client({
        host: env === 'app' ? `${process.env.POSTGRES_GLOBAL_DB_HOST}` : `${process.env.SUBDOMAIN}-db`,
        port: env === 'app' ? Number(process.env.POSTGRES_GLOBAL_DB_PORT || 5432) : 5432,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB,
    });

    try {
        await client.connect();
        await client.query('DELETE FROM public."chatGptThreads" WHERE last_update <= NOW() - INTERVAL \'15 minute\';');

    } catch (error) {
        console.error('Error ejecutando la consulta:', error);
    } finally {
        await client.end(); 
    }
}
