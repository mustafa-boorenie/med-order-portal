export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'DOCTOR' | 'PATIENT';
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  priceCents: number;
  quantity: number;
  expirationDate?: string;
  parLevel: number;
  createdAt: string;
}

export interface Order {
  id: string;
  patientName: string;
  patientEmail: string;
  doctorId?: string;
  totalCents: number;
  status: 'PENDING' | 'PAID' | 'FULFILLED' | 'CANCELLED';
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  product?: Product;
}

export interface Payment {
  id: string;
  orderId: string;
  stripePaymentIntentId: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
  amountCents: number;
  createdAt: string;
}

export interface PharmacyLog {
  id: string;
  orderId: string;
  requestPayload: Record<string, any>;
  responsePayload: Record<string, any>;
  status: string;
  timestamp: string;
}

export interface CheckoutToken {
  token: string;
  orderId: string;
  expiresAt: string;
}

export interface AnalyticsData {
  ordersPerDay: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  lowStockItems: Array<{
    id: string;
    name: string;
    quantity: number;
    parLevel: number;
  }>;
  totalRevenue: number;
  totalOrders: number;
}