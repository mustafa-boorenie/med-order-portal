import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';
import type { MessageListInstanceCreateOptions } from 'twilio/lib/rest/api/v2010/account/message';

@Injectable()
export class SmsService {
  private twilioClient: twilio.Twilio | null = null;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const phoneNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');
    
    console.log('🔧 Twilio Configuration Check:');
    console.log(`   Account SID: ${accountSid ? accountSid.substring(0, 10) + '...' : 'Not found'}`);
    console.log(`   Auth Token: ${authToken ? '***configured***' : 'Not found'}`);
    console.log(`   Phone Number: ${phoneNumber || 'Not found'}`);
    
    if (accountSid && authToken) {
      this.twilioClient = twilio(accountSid, authToken);
      console.log('✅ Twilio SMS service initialized successfully');
    } else {
      console.warn('⚠️  Twilio credentials not configured - SMS will be simulated');
      console.warn('   Please ensure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are in your .env file');
    }
  }

  async sendSms(to: string, body: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');
    const messagingServiceSid = this.configService.get<string>('TWILIO_MESSAGING_SERVICE_SID');
    const statusWebhook = this.configService.get<string>('TWILIO_STATUS_WEBHOOK_URL');
    
    // Format phone number if needed (ensure it starts with +1 for US numbers)
    const formattedTo = this.formatPhoneNumber(to);
    
    console.log('📱 SMS Service Called');
    console.log(`   Raw To: ${to}`);
    console.log(`   Formatted To: ${formattedTo}`);
    console.log(`   From: ${fromNumber || 'Not configured'}`);
    console.log(`   Twilio Client: ${this.twilioClient ? 'Configured' : 'Not configured'}`);
    
    if (!this.twilioClient || (!fromNumber && !messagingServiceSid)) {
      // Simulate SMS sending in development
      console.log('📱 [SIMULATED SMS - Twilio not configured]');
      console.log(`   To: ${formattedTo}`);
      console.log(`   Message: ${body}`);
      console.log('   Status: Would be sent in production with Twilio');
      return { 
        success: true, 
        messageId: 'simulated_' + Date.now() 
      };
    }

    try {
      console.log(`📤 Attempting to send real SMS via Twilio...`);
      const createParams: MessageListInstanceCreateOptions = {
        body,
        to: formattedTo,
      } as any;
      if (messagingServiceSid) {
        (createParams as any).messagingServiceSid = messagingServiceSid;
      } else if (fromNumber) {
        (createParams as any).from = fromNumber;
      }
      if (statusWebhook) {
        (createParams as any).statusCallback = statusWebhook;
      }

      const message = await this.twilioClient.messages.create(createParams as any);

      console.log(`✅ SMS sent successfully!`);
      console.log(`   To: ${formattedTo}`);
      console.log(`   Message SID: ${message.sid}`);
      console.log(`   Status: ${message.status}`);
      console.log(`   Price: ${message.price} ${message.priceUnit}`);
      
      return { 
        success: true, 
        messageId: message.sid 
      };
    } catch (error: any) {
      console.error('❌ Failed to send SMS via Twilio:', error.message);
      console.error(`   Error Code: ${error.code}`);
      console.error(`   More Info: ${error.moreInfo}`);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If it's a 10-digit US number, add +1
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    
    // If it's already 11 digits starting with 1, add +
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    // If it already has the right format, return as is
    if (phone.startsWith('+')) {
      return phone;
    }
    
    // Default: assume it needs +1
    return `+1${cleaned}`;
  }
}