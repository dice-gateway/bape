import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PaymentIntent, PixGoCreateResponse } from '../types';
import { createPixPayment, checkPaymentStatus } from '../services/pixgoService';

// Pega a chave de API das variáveis de ambiente.
// O Vite substitui esta linha pelo valor real durante o processo de build.
const apiKey = import.meta.env.VITE_PIXGO_API_KEY;

const CheckoutPage: React.FC = () => {
  const params = useParams<{ intentId: string }>();
  const navigate = useNavigate();
  const intentId = params.intentId;

  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PixGoCreateResponse | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [pollingActive, setPollingActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({ name: '', cpf: '', email: '', phone: '' });
  
  // Verifica se a chave de API foi configurada
  useEffect(() => {
    if (!apiKey) {
      setError('A chave de API para pagamentos não está configurada. Contate o administrador.');
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('payment_intents');
    if (saved) {
      const intents: PaymentIntent[] = JSON.parse(saved);
      const found = intents.find(i => i.id === intentId);
      if (found) {
        setIntent(found);
      } else {
        setError('Link de pagamento inválido ou expirado.');
      }
    }
  }, [intentId]);

  const pollStatus = useCallback(async () => {
    if (!paymentData || !apiKey) return;
    try {
      const statusRes = await checkPaymentStatus(apiKey, paymentData.data.payment_id);
      if (statusRes.success) {
        const currentStatus = statusRes.data.status;
        setPaymentStatus(currentStatus);
        if (currentStatus === 'completed' || currentStatus === 'expired' || currentStatus === 'cancelled') {
          setPollingActive(false);
        }
      }
    } catch (err) {
      console.error('Erro ao checar status:', err);
    }
  }, [paymentData]);

  useEffect(() => {
    let interval: any;
    if (pollingActive) {
      interval = setInterval(pollStatus, 5000);
    }
    return () => clearInterval(interval);
  }, [pollingActive, pollStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intent || !apiKey) return;

    setLoading(true);
    setError(null);

    try {
      const result = await createPixPayment(apiKey, {
        amount: intent.amount,
        description: intent.description,
        customer_name: formData.name,
        customer_cpf: formData.cpf.replace(/\D/g, ''),
        customer_email: formData.email,
        customer_phone: formData.phone,
        external_id: intent.id
      });

      if (result.success) {
        setPaymentData(result);
        setPaymentStatus('pending');
        setPollingActive(true);
      } else {
        setError(result.message || 'Ocorreu um erro ao gerar o PIX.');
      }
    } catch (err: any) {
      setError(err.message || 'Falha na conexão com o servidor de pagamento.');
    } finally {
      setLoading(false);
    }
  };

  if (error && !paymentData) {
     return <div className="p-8 text-center text-red-500">{error}</div>;
  }
  if (!intent) return <div className="p-8 text-center text-slate-500">Carregando checkout...</div>;

  if (paymentData) {
    return (
        <div className="p-8 text-center">
            {paymentStatus === 'completed' ? (
                <div>
                    <h2 className="text-2xl font-bold text-green-600">Pagamento Confirmado!</h2>
                </div>
            ) : (
                <div>
                    <h2 className="text-xl font-bold mb-4">Pague com PIX para finalizar</h2>
                    <p className="mb-2">Valor: R$ {intent.amount.toFixed(2)}</p>
                    <textarea readOnly value={paymentData.data.qr_code} className="w-full h-32 p-2 border rounded" />
                    <button onClick={() => navigator.clipboard.writeText(paymentData.data.qr_code)} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">Copiar Código</button>
                    <p className="mt-4 text-gray-500">Aguardando confirmação do pagamento...</p>
                </div>
            )}
        </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Checkout</h1>
        <div className="p-4 border rounded mb-4">
            <p>{intent.description}</p>
            <p className="font-bold text-lg">Valor: R$ {intent.amount.toFixed(2)}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Nome Completo" className="w-full p-2 border rounded" />
            <input type="text" required value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: e.target.value})} placeholder="CPF" className="w-full p-2 border rounded" />
            <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="E-mail" className="w-full p-2 border rounded" />
            <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="Telefone (Opcional)" className="w-full p-2 border rounded" />
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded disabled:opacity-50">
                {loading ? 'Processando...' : 'Pagar com Pix'}
            </button>
        </form>
    </div>
  );
};

export default CheckoutPage;
