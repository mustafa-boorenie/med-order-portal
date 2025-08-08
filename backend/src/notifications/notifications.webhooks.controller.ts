import { Body, Controller, Headers, Post, Req } from '@nestjs/common';

@Controller('notifications/webhooks')
export class NotificationsWebhooksController {
  @Post('twilio-sms-status')
  async handleTwilioStatus(
    @Body() body: any,
    @Headers('x-twilio-signature') signature?: string,
    @Req() req?: any,
  ) {
    // In production, validate Twilio signature here
    console.log('📡 Twilio SMS Status Callback:', {
      messageSid: body.MessageSid,
      messageStatus: body.MessageStatus,
      to: body.To,
      from: body.From,
      errorCode: body.ErrorCode,
    });
    return { received: true };
  }
}

