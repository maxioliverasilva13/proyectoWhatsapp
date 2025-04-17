import { Client } from 'pg';

export async function DemonDeleteOldsThreads() {
    const env = process.env.SUBDOMAIN;
    const isDev = process.env.ENV === 'dev';
  
    const host = isDev ? (env === "app" ? process.env.POSTGRES_GLOBAL_DB_HOST : `${env}-db`) : `${process.env.POSTGRES_GLOBAL_DB_HOST}`;

    const client = new Client({
        host: host,
        port: Number(process.env.POSTGRES_GLOBAL_DB_PORT || 5432),
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB,
        ssl: {
            rejectUnauthorized: false,
          },
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
