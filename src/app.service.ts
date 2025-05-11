import { Injectable } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { DemonDeleteOldsThreads } from "./utils/daemons/demonToThreads";
import { OpenOrClose } from "./utils/demonOpenOrClose";
import { SendRemainders } from "./utils/daemons/daemonSendReminders";
import { DeviceService } from "./device/device.service";

@Injectable()
export class AppService {
  private shouldExecuteInterval = false;
  private shouldExecuteIntervalDeleteThreads = false;
  private shouldExecuteIntervalRemainders = false;

  async onModuleInit() {
    const subdomain = process.env.SUBDOMAIN;
    
    if (subdomain === "app") {      
      this.shouldExecuteInterval = true;
    } else {
      this.shouldExecuteIntervalRemainders = true;
      this.shouldExecuteIntervalDeleteThreads = true;
    }
  }

  constructor(private readonly deviceService: DeviceService) {}

  getHello(): string {
    return "Hello World!";
  }

  // 1 hour
  @Interval(3600000)
  handleIntervalRemainders() {
    if (this.shouldExecuteIntervalRemainders) {
      SendRemainders(this.deviceService);
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
    if (this.shouldExecuteInterval) {
      OpenOrClose();
    }
  }
}
