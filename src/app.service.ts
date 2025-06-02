import { Injectable } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { DemonDeleteOldsThreads } from "./utils/daemons/demonToThreads";
import { OpenOrClose } from "./utils/demonOpenOrClose";
import { SendRemainders } from "./utils/daemons/daemonSendReminders";
import { DeviceService } from "./device/device.service";
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class AppService {
  private shouldExecuteIntervalOpenOrClose = false;
  private shouldExecuteIntervalDeleteThreads = false;
  private shouldExecuteIntervalRemainders = false;

  async onModuleInit() {
    const subdomain = process.env.SUBDOMAIN;
    
    if (subdomain === "app") {      
    } else {
      this.shouldExecuteIntervalOpenOrClose = true;
      this.shouldExecuteIntervalRemainders = true;
      this.shouldExecuteIntervalDeleteThreads = true;
    }
  }

  constructor(private readonly deviceService: DeviceService,
    @InjectQueue(`GreenApiResponseMessagee-${process.env.SUBDOMAIN}`)
    private readonly messageQueue: Queue

  ) {}

  getHello(): string {
    return "Hello World!";
  }

  @Interval(900000)
  handleIntervalRemainders() {
    if (this.shouldExecuteIntervalRemainders) {
      SendRemainders(this.deviceService, this.messageQueue);
    }
  }

  @Interval(900000)
  handleIntervalDeleteThreads() {
    if (this.shouldExecuteIntervalDeleteThreads) {
      DemonDeleteOldsThreads();
    }
  }

  @Interval(300000)
  handleIntervalOpenOrClose() {
    if (this.shouldExecuteIntervalOpenOrClose) {
      OpenOrClose();
    }
  }
}
