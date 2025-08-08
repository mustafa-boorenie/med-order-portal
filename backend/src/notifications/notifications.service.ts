import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsService } from './sms.service';
import * as nodemailer from 'nodemailer';

interface SendPaymentLinkDto {
  orderId: string;
  checkoutUrl: string;
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  totalCents: number;
  method: 'email' | 'sms';
}

@Injectable()
export class NotificationsService {
  constructor(
    private configService: ConfigService,
    private smsService: SmsService,
  ) {}

  async sendPaymentLink(dto: SendPaymentLinkDto): Promise<void> {
    const { method, checkoutUrl, patientName, totalCents } = dto;
    const amount = (totalCents / 100).toFixed(2);

    if (method === 'sms') {
      console.log(`💬 Preparing SMS for ${dto.patientPhone}`);
      await this.sendSMS(dto.patientPhone!, 
        `Hi ${patientName}, your medical order total is $${amount}. ` +
        `Complete payment here: ${checkoutUrl}`
      );
      console.log(`✅ SMS notification completed`);
    } else {
      await this.sendEmail({
        to: dto.patientEmail,
        subject: 'Complete Your Medical Order Payment',
        html: this.getPaymentEmailTemplate({
          patientName,
          amount,
          checkoutUrl,
          orderId: dto.orderId,
        }),
      });
    }
  }

  private async sendSMS(phoneNumber: string, message: string): Promise<void> {
    const result = await this.smsService.sendSms(phoneNumber, message);
    
    if (!result.success) {
      console.error(`Failed to send SMS: ${result.error}`);
      // Don't throw error to prevent order flow from failing
      // In production, you might want to queue for retry
    }
  }

  private async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = parseInt(this.configService.get<string>('SMTP_PORT') || '587', 10);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const from = this.configService.get<string>('EMAIL_FROM') || user;
    const sendgridApi =
      this.configService.get<string>('SMTP_API') || this.configService.get<string>('SENDGRID_API_KEY');

    // Prefer SMTP_HOST credentials if provided; fallback to SendGrid SMTP via API key
    let transporter: nodemailer.Transporter;

    if (host && user && (pass || sendgridApi)) {
      const authPass = pass || sendgridApi!; // allow using API key as password for SendGrid SMTP
      const isSecure = port === 465; // true for port 465, false for other ports
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: isSecure,
        auth: { user, pass: authPass },
      });
      console.log(`📨 SMTP configured for host ${host}:${port} (secure=${isSecure})`);
    } else if (sendgridApi) {
      // Fallback: SendGrid API via nodemailer's sendgrid transport (using SMTP relay)
      transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: { user: 'apikey', pass: sendgridApi },
      });
      console.log('📨 Using SendGrid SMTP via API key');
    } else {
      console.warn('⚠️  No SMTP configuration found. Email will not be sent.');
      console.warn('     Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and EMAIL_FROM');
      return;
    }

    try {
      const info = await transporter.sendMail({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
      });
      console.log(`✅ Email sent to ${params.to}. MessageId: ${info.messageId}`);
    } catch (error: any) {
      console.error('❌ Failed to send email:', error.message);
      // Do not throw to avoid breaking user flow; consider retry/queue in production
    }
  }

  private getPaymentEmailTemplate(data: {
    patientName: string;
    amount: string;
    checkoutUrl: string;
    orderId: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; }
          .button { display: inline-block; padding: 12px 24px; background-color: #007bff; 
                    color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #dee2e6; 
                    font-size: 14px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Medical Order Payment</h1>
          </div>
          
          <p>Dear ${data.patientName},</p>
          
          <p>Your medical order is ready for payment. The total amount is <strong>$${data.amount}</strong>.</p>
          
          <p>Please click the button below to complete your secure payment:</p>
          
          <center>
            <a href="${data.checkoutUrl}" class="button">Complete Payment</a>
          </center>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${data.checkoutUrl}</p>
          
          <p><strong>Order ID:</strong> ${data.orderId}</p>
          
          <p>This payment link will expire in 24 hours. If you have any questions, 
             please contact your healthcare provider.</p>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>Your payment information is secured by Stripe. We never store your credit card details.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendPaymentConfirmation(data: {
    orderId: string;
    patientName: string;
    patientEmail: string;
    totalCents: number;
    items: Array<{
      name: string;
      quantity: number;
      priceCents: number;
    }>;
  }): Promise<void> {
    const amount = (data.totalCents / 100).toFixed(2);

    await this.sendEmail({
      to: data.patientEmail,
      subject: 'Payment Confirmation - Medical Order',
      html: this.getPaymentConfirmationTemplate({
        patientName: data.patientName,
        orderId: data.orderId,
        amount,
        items: data.items,
      }),
    });

    console.log(`📧 Payment confirmation sent to ${data.patientEmail} for order ${data.orderId}`);
  }

  private getPaymentConfirmationTemplate(data: {
    patientName: string;
    orderId: string;
    amount: string;
    items: Array<{
      name: string;
      quantity: number;
      priceCents: number;
    }>;
  }): string {
    const itemsHtml = data.items.map(item => 
      `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #dee2e6; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #dee2e6; text-align: right;">$${((item.priceCents * item.quantity) / 100).toFixed(2)}</td>
      </tr>`
    ).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
          .success-icon { font-size: 48px; margin-bottom: 10px; }
          .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .order-table th { background-color: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6; }
          .total-row { background-color: #f8f9fa; font-weight: bold; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #dee2e6; 
                    font-size: 14px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">✅</div>
            <h1>Payment Confirmed!</h1>
          </div>
          
          <p>Dear ${data.patientName},</p>
          
          <p>Thank you for your payment! Your medical order has been successfully processed.</p>
          
          <p><strong>Order ID:</strong> ${data.orderId}</p>
          <p><strong>Total Paid:</strong> $${data.amount}</p>
          
          <h3>Order Items:</h3>
          <table class="order-table">
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Quantity</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr class="total-row">
                <td colspan="2" style="padding: 12px; text-align: right;"><strong>Total:</strong></td>
                <td style="padding: 12px; text-align: right;"><strong>$${data.amount}</strong></td>
              </tr>
            </tbody>
          </table>
          
          <p>Your order is now being processed and you will receive updates on its status.</p>
          
          <div class="footer">
            <p>Thank you for choosing our medical services!</p>
            <p>If you have any questions, please contact your healthcare provider.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}