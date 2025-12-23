
export interface PixGoCustomer {
  customer_name?: string;
  customer_cpf?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  description: string;
  createdAt: string;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  pixgo_payment_id?: string;
}

export interface PixGoCreateRequest extends PixGoCustomer {
  amount: number;
  description?: string;
  external_id?: string;
  webhook_url?: string;
}

export interface PixGoCreateResponse {
  success: boolean;
  data: {
    payment_id: string;
    external_id: string;
    amount: number;
    status: string;
    qr_code: string;
    qr_image_url: string;
    expires_at: string;
    created_at: string;
  };
  error?: string;
  message?: string;
}

export interface PixGoStatusResponse {
  success: boolean;
  data: {
    payment_id: string;
    external_id: string;
    amount: number;
    status: 'pending' | 'completed' | 'expired' | 'cancelled' | 'refunded';
    customer_name?: string;
    customer_cpf?: string;
    created_at: string;
    updated_at: string;
  };
}

export interface AdminSettings {
  apiKey: string;
  adminPassword?: string;
}
