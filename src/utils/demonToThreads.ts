import { Client } from 'pg';

export async function DemonDeleteOldsThreads() {
    const client = new Client({
        host: process.env.SUBDOMAIN === 'app' ? `${process.env.POSTGRES_GLOBAL_DB_HOST}` : `${process.env.SUBDOMAIN}-db`,
        port: 5432,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB,
    });

    try {
        await client.connect();
        const res = await client.query('DELETE FROM public."chatGptThreads" WHERE last_update <= NOW() - INTERVAL \'15 minute\';');

        console.log(res.rows);  
    } catch (error) {
        console.error('Error ejecutando la consulta:', error);
    } finally {
        await client.end(); 
    }
}
