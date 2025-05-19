import { Module } from "@nestjs/common";
import { EmailServiceResend } from "./email.service";


@Module({
    providers:[EmailServiceResend],
    exports:[EmailServiceResend]
})
export class EmailModuleResend {}