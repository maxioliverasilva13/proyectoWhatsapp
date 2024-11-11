import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { DemonDeleteOldsThreads } from './utils/demonToThreads';

@Injectable()
export class AppService {
  private shouldExecuteInterval = false;

  async onModuleInit() {
    const subdomain = process.env.SUBDOMAIN;
    if (subdomain === "works") {
      this.shouldExecuteInterval = true;
    }
  }

  getHello(): string {
    return 'Hello World!';
  }

  @Interval(900000)
  handleInterval() {
    if (this.shouldExecuteInterval) {
      DemonDeleteOldsThreads()
    }
  }
}
