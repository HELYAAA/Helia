// Shared utility functions for Supabase API calls
import { projectId, publicAnonKey } from './supabase-info';
import { Game, Payment, SiteSettings } from './types';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-245feaad`;

export const api = {
  // Catalog endpoints
  async getCatalog(): Promise<Game[]> {
    const response = await fetch(`${BASE_URL}/catalog`, {
      headers: { 'Authorization': `Bearer ${publicAnonKey}` }
    });
    const data = await response.json();
    return data.catalog || [];
  },

  async updateCatalog(catalog: Game[]): Promise<void> {
    await fetch(`${BASE_URL}/catalog`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ catalog }),
    });
  },

  // Payment endpoints
  async getPayments(): Promise<Payment[]> {
    const response = await fetch(`${BASE_URL}/payments`, {
      headers: { 'Authorization': `Bearer ${publicAnonKey}` }
    });
    const data = await response.json();
    return data.payments || [];
  },

  async updatePayments(payments: Payment[]): Promise<void> {
    await fetch(`${BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ payments }),
    });
  },

  // Settings endpoints
  async getSettings(): Promise<SiteSettings | null> {
    const response = await fetch(`${BASE_URL}/settings`, {
      headers: { 'Authorization': `Bearer ${publicAnonKey}` }
    });
    const data = await response.json();
    return data.settings || null;
  },

  async updateSettings(settings: SiteSettings): Promise<void> {
    await fetch(`${BASE_URL}/settings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ settings }),
    });
  },

  // Order endpoints
  async getOrders(): Promise<any[]> {
    const response = await fetch(`${BASE_URL}/orders`, {
      headers: { 'Authorization': `Bearer ${publicAnonKey}` }
    });
    const data = await response.json();
    return data.orders || [];
  },

  async createOrder(orderRecord: any): Promise<void> {
    await fetch(`${BASE_URL}/order`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderRecord),
    });
  },

  async updateOrderStatus(orderId: string, status: string, note?: string): Promise<void> {
    await fetch(`${BASE_URL}/order-status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId, status, note }),
    });
  },

  // Receipt upload
  async uploadReceipt(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/upload-receipt`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Upload failed');
    }

    return await response.json();
  }
};
