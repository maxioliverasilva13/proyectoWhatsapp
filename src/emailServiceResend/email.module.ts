import { Module } from "@nestjs/common";
import { EmailServiceResend } from "./email.service";
import { EmailResendController } from "./email.controller";

@Module({
    controllers: [EmailResendController],
    providers: [EmailServiceResend],
    exports: [EmailServiceResend]
})
export class EmailModuleResend {}