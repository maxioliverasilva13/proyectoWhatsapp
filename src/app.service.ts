import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { DemonDeleteOldsThreads } from './utils/daemons/demonToThreads';
import { OpenOrClose } from './utils/demonOpenOrClose';

@Injectable()
export class AppService {
  private shouldExecuteInterval = false;
  private shouldExecuteIntervalDeleteThreads = false;

  async onModuleInit() {
    const subdomain = process.env.SUBDOMAIN;
    if (subdomain === "app") {
      this.shouldExecuteInterval = true;
    } else {
      this.shouldExecuteIntervalDeleteThreads = true;
    }
  }

  getHello(): string {
    return 'Hello World!';
  }

  @Interval(900000)
  handleIntervalDeleteThreads() {
    if (this.shouldExecuteIntervalDeleteThreads) {
      DemonDeleteOldsThreads()
    }
  }

  @Interval(900000)
  handleIntervalOpenOrClose() {
    if (this.shouldExecuteInterval) {
      OpenOrClose()
    }
  }
}
