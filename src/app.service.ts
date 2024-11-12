import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { DemonDeleteOldsThreads } from './utils/demonToThreads';
import { OpenOrClose } from './utils/demonOpenOrClose';

@Injectable()
export class AppService {
  private shouldExecuteInterval = false;

  async onModuleInit() {
    const subdomain = process.env.SUBDOMAIN;
    if (subdomain !== "app") {
      this.shouldExecuteInterval = true;
    }
  }

  getHello(): string {
    return 'Hello World!';
  }

  @Interval(900000)
  handleIntervalDeleteThreads() {
    if (this.shouldExecuteInterval) {
      DemonDeleteOldsThreads()
    }
  }

  @Interval(5000)
  handleIntervalOpenOrClose() {
    if (this.shouldExecuteInterval) {
      OpenOrClose()
    }
  }
}
