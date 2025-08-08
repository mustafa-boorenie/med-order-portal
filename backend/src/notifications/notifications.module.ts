import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SmsService } from './sms.service';
import { NotificationsWebhooksController } from './notifications.webhooks.controller';

@Module({
  controllers: [NotificationsWebhooksController],
  providers: [NotificationsService, SmsService],
  exports: [NotificationsService, SmsService],
})
export class NotificationsModule {}