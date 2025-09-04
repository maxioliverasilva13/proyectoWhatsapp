export class CreateEmailDto {
  from: string;
  to: string;
  subject: string;
  message: string;
  isHtml?: boolean;
}