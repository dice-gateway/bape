import React, { useState, useEffect } from 'react';
import { AdminSettings, PaymentIntent } from '../types';
import CheckoutPage from './CheckoutPage';

interface AdminDashboardProps {
  settings: AdminSettings;
  setSettings: React.Dispatch<React.SetStateAction<AdminSettings>>;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ settings, setSettings, onLogout }) => {
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [intents, setIntents] = useState<PaymentIntent[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'settings'>('create');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  
  const [previewIntentId, setPreviewIntentId] = useState<string | null>(null);

  // Volta a carregar os links salvos do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('payment_intents');
    if (saved) setIntents(JSON.parse(saved));
  }, []);

  // Salva os links no localStorage sempre que eles mudam
  const saveIntents = (newIntents: PaymentIntent[]) => {
    // Ordena do mais novo para o mais antigo antes de salvar
    const sortedIntents = newIntents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setIntents(sortedIntents);
    localStorage.setItem('payment_intents', JSON.stringify(sortedIntents));
  };

  const handleGenerateLink = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val < 10) {
      alert('O valor mínimo para PIX é R$ 10.00');
      return;
    }

    const newIntent: PaymentIntent = {
      id: Math.random().toString(36).substring(2, 15),
      amount: val,
      description: description || 'Pagamento PIX',
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    saveIntents([newIntent, ...intents]);
    setAmount('');
    setDescription('');
    setActiveTab('list');
  };

  const handleCopyLink = (id: string) => {
    const baseUrl = window.location.href.split('#')[0];
    const url = `${baseUrl}#/checkout/${id}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(id);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const deleteIntent = (id: string) => {
    if (confirm('Deseja realmente excluir este link?')) {
      saveIntents(intents.filter(i => i.id !== id));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Painel Admin <span className="text-emerald-600">7D-bappe</span></h1>
          <p className="text-slate-500">by stafff - Gerenciamento de links</p>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors">
            <i className="fa-solid fa-sign-out-alt"></i> Sair
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-2">
            <button onClick={() => setActiveTab('create')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'create' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100'}`}><i className="fa-solid fa-plus-circle"></i> Novo Link</button>
            <button onClick={() => setActiveTab('list')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'list' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100'}`}><i className="fa-solid fa-list-ul"></i> Links Gerados</button>
            <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100'}`}><i className="fa-solid fa-cog"></i> Configurações</button>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {activeTab === 'create' && (
             <div className="p-8">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Criar Novo Link de Pagamento</h2>
                <form onSubmit={handleGenerateLink} className="space-y-6">
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-2">Valor do Pagamento (R$)</label>
                     <input type="number" step="0.01" min="10" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="0,00" required />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-2">Descrição (Opcional)</label>
                     <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="Ex: Produto XYZ" />
                   </div>
                   <button type="submit" className="w-full py-4 rounded-xl font-bold text-lg bg-emerald-600 hover:bg-emerald-700 text-white">Gerar Link de Checkout</button>
                </form>
             </div>
          )}

          {activeTab === 'list' && (
            <div className="p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Histórico de Links</h2>
              {intents.length === 0 ? (
                <div className="text-center py-12"><p className="text-slate-500">Nenhum link gerado ainda.</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="border-b"><th className="pb-4">Data</th><th className="pb-4">Descrição</th><th className="pb-4 text-right">Valor</th><th className="pb-4 text-center">Ações</th></tr>
                     </thead>
                     <tbody>
                        {intents.map((intent) => (
                           <tr key={intent.id} className="hover:bg-slate-50">
                              <td className="py-4">{new Date(intent.createdAt).toLocaleDateString()}</td>
                              <td className="py-4">{intent.description}</td>
                              <td className="py-4 text-right font-bold">R$ {intent.amount.toFixed(2)}</td>
                              <td className="py-4">
                                <div className="flex justify-center gap-2">
                                  <button onClick={() => handleCopyLink(intent.id)} className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs">{copySuccess === intent.id ? 'Copiado!' : 'Copiar'}</button>
                                  <button onClick={() => deleteIntent(intent.id)} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs">Excluir</button>
                                </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Configurações da Conta</h2>
              <div className="space-y-6">
                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Alterar Senha do Painel Admin</label>
                  <input type="text" value={settings.adminPassword} onChange={(e) => setSettings({ ...settings, adminPassword: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="Alterar senha..." />
                   <p className="mt-2 text-xs text-slate-500">A senha é salva automaticamente no seu navegador.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
