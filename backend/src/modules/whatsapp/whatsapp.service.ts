import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface WhatsAppMessage {
  to: string;        // phone with country code
  template?: string; // template name
  language?: string;
  components?: any[];
  freeText?: string; // for session messages
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly apiUrl: string;
  private readonly token: string;
  private readonly phoneNumberId: string;

  constructor(private config: ConfigService) {
    this.token = config.get('WHATSAPP_API_TOKEN') || '';
    this.phoneNumberId = config.get('WHATSAPP_PHONE_NUMBER_ID') || '';
    this.apiUrl = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
  }

  // ── Send Template Message ─────────────────────────────────
  async sendTemplate(phone: string, templateName: string, language: string, components: any[]) {
    const payload = {
      messaging_product: 'whatsapp',
      to: this.formatPhone(phone),
      type: 'template',
      template: { name: templateName, language: { code: language }, components },
    };

    return this.sendMessage(payload);
  }

  // ── Send Text Message ─────────────────────────────────────
  async sendText(phone: string, text: string) {
    const payload = {
      messaging_product: 'whatsapp',
      to: this.formatPhone(phone),
      type: 'text',
      text: { body: text },
    };

    return this.sendMessage(payload);
  }

  // ── Renewal Reminder (7 days) ─────────────────────────────
  async sendRenewalReminder7Days(phone: string, memberName: string, expiryDate: string, planName: string) {
    const message = `🏋️ *Namaste ${memberName}!*\n\nAapki gym membership *${planName}* agle *7 dinon mein* expire hone wali hai.\n\n📅 Expiry Date: *${expiryDate}*\n\nAbhi renew karein aur apni fitness journey jaari rakhein! 💪\n\n👉 Renewal ke liye gym reception par aayein ya WhatsApp karein.\n\n_619 Fitness Studio_`;
    return this.sendText(phone, message);
  }

  // ── Renewal Reminder (3 days) ─────────────────────────────
  async sendRenewalReminder3Days(phone: string, memberName: string, expiryDate: string) {
    const message = `⚠️ *${memberName} ji, sirf 3 din baaki hain!*\n\nAapki membership *${expiryDate}* ko expire ho rahi hai.\n\nAbhi renew karein aur training continue karein! 🔥\n\nReception par contact karein ya is number par reply karein.\n\n_619 Fitness Studio_`;
    return this.sendText(phone, message);
  }

  // ── Renewal Reminder (expiry day) ────────────────────────
  async sendRenewalReminderToday(phone: string, memberName: string) {
    const message = `🚨 *${memberName} ji — AAJ Last Day!*\n\nAapki membership AAJ expire ho rahi hai.\n\nAbhi renew karein — ek din bhi miss mat karein! 💪\n\nSidha reception par aayein.\n\n_619 Fitness Studio_`;
    return this.sendText(phone, message);
  }

  // ── Post-Expiry Follow Up (3 days after) ─────────────────
  async sendPostExpiry3Days(phone: string, memberName: string) {
    const message = `😢 *${memberName} ji, hum aapko miss kar rahe hain!*\n\nAapki membership 3 din pehle expire ho gayi.\n\nWapas aayein! Abhi renew karein aur special offer paayein. 🎁\n\nReply karein ya 619 Fitness Studio visit karein.\n\n_Fitness ki raah mein hum saath hain!_ 💪`;
    return this.sendText(phone, message);
  }

  // ── Post-Expiry Follow Up (7 days after) ─────────────────
  async sendPostExpiry7Days(phone: string, memberName: string) {
    const message = `💔 *${memberName} ji — Fitness Family aapka intezaar kar rahi hai!*\n\nAapki membership expire hue 7 din ho gaye.\n\nEk baar zaroor aayein — special comeback offer ke liye aaj hi contact karein! 🎯\n\n_619 Fitness Studio_`;
    return this.sendText(phone, message);
  }

  // ── Welcome Message ───────────────────────────────────────
  async sendWelcome(phone: string, memberName: string, memberId: string, planName: string, expiryDate: string) {
    const message = `🎉 *${memberName} ji, 619 Fitness Studio mein aapka swagat hai!*\n\n✅ Member ID: *${memberId}*\n🏋️ Plan: *${planName}*\n📅 Valid Till: *${expiryDate}*\n\nAapki fitness journey shuru ho rahi hai! 💪\n\nKoi bhi help ke liye hamen WhatsApp karein.\n\n_Stay Strong, Stay Fit!_ 🔥`;
    return this.sendText(phone, message);
  }

  // ── Absent Alert ──────────────────────────────────────────
  async sendAbsentAlert(phone: string, memberName: string, absentDays: number) {
    const message = `😟 *${memberName} ji!*\n\nHumne notice kiya ki aap pichle *${absentDays} din* se gym nahi aaye.\n\nKya sab theek hai? 🤔\n\nAapki fitness goals aapka intezaar kar rahi hain! Aaj aayein! 💪\n\n_619 Fitness Studio aapke liye hamesha ready hai!_`;
    return this.sendText(phone, message);
  }

  // ── Birthday Message ──────────────────────────────────────
  async sendBirthdayWish(phone: string, memberName: string) {
    const message = `🎂 *Happy Birthday ${memberName} ji!* 🎉\n\n619 Fitness Studio ki taraf se aapko bahut bahut badhaai!\n\nAaj ka din aapke liye khaas hai — ek FREE PT session hamare taraf se gift! 🎁\n\nAj aayein aur apna birthday celebrate karein! 💪🎈\n\n_Keep Growing, Keep Glowing!_`;
    return this.sendText(phone, message);
  }

  // ── Payment Receipt ───────────────────────────────────────
  async sendPaymentReceipt(phone: string, memberName: string, amount: number, receiptNo: string, planName: string) {
    const message = `✅ *Payment Received!*\n\nNamaste *${memberName}* ji,\n\nAapka payment successfully receive ho gaya.\n\n💰 Amount: *₹${amount}*\n🧾 Receipt No: *${receiptNo}*\n🏋️ Plan: *${planName}*\n\nThank you for choosing 619 Fitness Studio! 💪\n\n_Stay Fit, Stay Strong!_`;
    return this.sendText(phone, message);
  }

  // ── Promotional Broadcast ─────────────────────────────────
  async sendPromotion(phone: string, memberName: string, offerText: string) {
    const message = `🔥 *Special Offer — Sirf Aapke Liye!*\n\nNamaste ${memberName} ji,\n\n${offerText}\n\nAaj hi avail karein! ⏰ Limited Time Offer!\n\n_619 Fitness Studio_`;
    return this.sendText(phone, message);
  }

  // ── PT Session Reminder ───────────────────────────────────
  async sendPTReminder(phone: string, memberName: string, trainerName: string, sessionTime: string) {
    const message = `⏰ *PT Session Reminder!*\n\nNamaste *${memberName}* ji,\n\nAapka Personal Training session *aaj ${sessionTime}* ko scheduled hai.\n\n🏋️ Trainer: *${trainerName}*\n\nSamay par aayein! Apna gym bag taiyaar rakhein. 💪\n\n_619 Fitness Studio_`;
    return this.sendText(phone, message);
  }

  // ── Bulk Broadcast ────────────────────────────────────────
  async sendBulkMessage(phones: string[], message: string, delay: number = 1000) {
    const results = [];
    for (const phone of phones) {
      try {
        const result = await this.sendText(phone, message);
        results.push({ phone, success: true, result });
        // Rate limit: 1 msg per second
        await new Promise((r) => setTimeout(r, delay));
      } catch (error) {
        results.push({ phone, success: false, error: error.message });
      }
    }
    return results;
  }

  // ── Core Send ─────────────────────────────────────────────
  private async sendMessage(payload: any) {
    if (!this.token || !this.phoneNumberId) {
      this.logger.warn('WhatsApp not configured. Skipping message.');
      return { status: 'skipped', reason: 'not_configured' };
    }

    try {
      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      this.logger.log(`WhatsApp sent to ${payload.to}`);
      return response.data;
    } catch (error) {
      this.logger.error(`WhatsApp error: ${error.response?.data?.error?.message || error.message}`);
      throw error;
    }
  }

  // ── Format Phone ──────────────────────────────────────────
  private formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('91') && cleaned.length === 12) return cleaned;
    if (cleaned.length === 10) return `91${cleaned}`;
    return cleaned;
  }
}
