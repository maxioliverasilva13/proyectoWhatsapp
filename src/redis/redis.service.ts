// src/redis/redis.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  async pushToList(key: string, value: string): Promise<void> {
    await this.redis.lpush(key, value);
  }

  async popAllFromList(key: string): Promise<string[]> {
    const messages = await this.redis.lrange(key, 0, -1);
    await this.redis.del(key);
    return messages.reverse();
  }

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      password: process.env.REDIS_PASSWORD || '',
    });
  }

  async increment(key: string, expireSeconds: number): Promise<number> {
    const value = await this.redis.incr(key);
    if (value === 1) {
      await this.redis.expire(key, expireSeconds);
    }
    return value;
  }

  async get(key: string): Promise<number> {
    const val = await this.redis.get(key);
    return parseInt(val) || 0;
  }

  async set(key: string, value: any, expireSeconds?: number) {
    if (expireSeconds) {
      await this.redis.set(key, value, 'EX', expireSeconds);
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string) {
    await this.redis.del(key);
  }

  async handleIncomingMessageWithBuffering(params: {
    chatId: string;
    message: string;
    delayMs: number;
    maxTokens: number;
    numberSender: string;
    empresaType: string;
    empresaId: string;
    senderName: string;
    timeZone: string;
    process: (fullMessage: string) => Promise<void>;
  }): Promise<void> {
    const { chatId, message, delayMs, maxTokens, process } = params;

    const key = `msg-buffer:${chatId}`;
    await this.redis.rpush(key, message);
    await this.redis.expire(key, 60);

    // Si ya hay un timeout, cancelarlo
    const existingTimeout = this.timeouts.get(chatId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Programar nuevo timeout
    const timeout = setTimeout(async () => {
      this.timeouts.delete(chatId); // limpiar referencia en memoria

      const messages = await this.redis.lrange(key, 0, -1);
      await this.redis.del(key);

      const fullMessage = messages.join(' ').trim();

      const { encode } = await import('gpt-3-encoder');
      const tokens = encode(fullMessage);
      if (tokens.length > maxTokens) {
        await process('[ERROR]:too-long');
        return;
      }

      await process(fullMessage);
    }, delayMs);

    this.timeouts.set(chatId, timeout);
  }

  onModuleDestroy() {
    this.redis.quit();
  }
}
