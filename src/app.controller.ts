import { Controller, Post, Body, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello()
  }

  @Get('health')
  async healthCheck(): Promise<object> {
    try {
      // Verificar que las variables de entorno críticas estén presentes
      const requiredEnvVars = [
        'POSTGRES_USER_GLOBAL',
        'POSTGRES_GLOBAL_DB_HOST',
        'REDIS_HOST'
      ];
      
      const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
      
      if (missingEnvVars.length > 0) {
        return {
          status: 'error',
          message: `Missing environment variables: ${missingEnvVars.join(', ')}`,
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: process.env.NODE_ENV || 'development',
          subdomain: process.env.SUBDOMAIN || 'unknown'
        };
      }

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        subdomain: process.env.SUBDOMAIN || 'unknown',
        database: {
          host: process.env.POSTGRES_GLOBAL_DB_HOST,
          port: process.env.POSTGRES_GLOBAL_DB_PORT
        },
        redis: {
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT
        }
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        subdomain: process.env.SUBDOMAIN || 'unknown'
      };
    }
  }

}
