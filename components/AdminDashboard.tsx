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
  
  // State for Preview - Storing the ID directly
  const [previewIntentId, setPreviewIntentId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('payment_intents');
    if (saved) setIntents(JSON.parse(saved));
  }, []);

  const saveIntents = (newIntents: PaymentIntent[]) => {
    setIntents(newIntents);
    localStorage.setItem('payment_intents', JSON.stringify(newIntents));
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

  const handleOpenPreview = (id: string) => {
    setPreviewIntentId(id);
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
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight"><span className="text-emerald-600">7D-bappe</span></h1>
          <p className="text-slate-500">by stafff - Gerenciamento de links</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
          >
            <i className="fa-solid fa-sign-out-alt"></i> Sair
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <button 
            onClick={() => setActiveTab('create')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'create' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
            <i className="fa-solid fa-plus-circle"></i> Novo Link
          </button>
          <button 
            onClick={() => setActiveTab('list')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'list' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
            <i className="fa-solid fa-list-ul"></i> Links Gerados
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
          >
            <i className="fa-solid fa-cog"></i> Configurações
          </button>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {activeTab === 'create' && (
            <div className="p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Criar Novo Link de Pagamento</h2>
              {!settings.apiKey && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <i className="fa-solid fa-triangle-exclamation text-amber-400"></i>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-amber-700">
                        Você ainda não configurou sua API Key. Vá em <strong>Configurações</strong> para começar.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <form onSubmit={handleGenerateLink} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Valor do Pagamento (R$)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="10"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-semibold"
                      placeholder="0,00"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Mínimo R$ 10,00</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Descrição (Opcional)</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ex: Produto XYZ ou Serviço de Consultoria"
                  />
                </div>
                <button
                  disabled={!settings.apiKey}
                  type="submit"
                  className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${!settings.apiKey ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-[1.01]'}`}
                >
                  Gerar Link de Checkout
                </button>
              </form>
            </div>
          )}

          {activeTab === 'list' && (
            <div className="p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Histórico de Links</h2>
              {intents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-slate-200 text-6xl mb-4">
                    <i className="fa-solid fa-link-slash"></i>
                  </div>
                  <p className="text-slate-500">Nenhum link gerado ainda.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-sm uppercase">
                        <th className="pb-4 font-medium">Data</th>
                        <th className="pb-4 font-medium">Descrição</th>
                        <th className="pb-4 font-medium text-right">Valor</th>
                        <th className="pb-4 font-medium text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {intents.map((intent) => (
                        <tr key={intent.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 text-sm text-slate-500">{new Date(intent.createdAt).toLocaleDateString()}</td>
                          <td className="py-4">
                            <p className="font-semibold text-slate-700">{intent.description}</p>
                            <p className="text-xs text-slate-400 truncate max-w-[150px]">{intent.id}</p>
                          </td>
                          <td className="py-4 text-right font-bold text-emerald-600">
                            R$ {intent.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4">
                            <div className="flex justify-center gap-2">
                              {/* Open/Test Button */}
                              <button 
                                onClick={() => handleOpenPreview(intent.id)}
                                className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-medium transition-all flex items-center gap-1"
                                title="Testar Checkout"
                              >
                                <i className="fa-solid fa-mobile-screen"></i>
                                <span className="hidden sm:inline">Testar</span>
                              </button>

                              {/* Copy Button */}
                              <button 
                                onClick={() => handleCopyLink(intent.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${copySuccess === intent.id ? 'bg-green-100 text-green-700' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                                title="Copiar Link"
                              >
                                <i className={`fa-solid ${copySuccess === intent.id ? 'fa-check' : 'fa-copy'}`}></i>
                                <span className="hidden sm:inline">{copySuccess === intent.id ? 'Copiado' : 'Copiar'}</span>
                              </button>

                              {/* Delete Button */}
                              <button 
                                onClick={() => deleteIntent(intent.id)}
                                className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium transition-all"
                                title="Excluir"
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Chave de API (Production)</label>
                  <input
                    type="password"
                    value={settings.apiKey}
                    onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                    placeholder="pk_..."
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Insira a chave de produção fornecida pelo seu gateway.
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Senha do Painel Admin</label>
                  <input
                    type="text"
                    value={settings.adminPassword}
                    onChange={(e) => setSettings({ ...settings, adminPassword: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Alterar senha..."
                  />
                </div>
                <div className="bg-blue-50 rounded-xl p-4 flex gap-3 text-blue-700 text-sm">
                  <i className="fa-solid fa-info-circle mt-0.5"></i>
                  <p>As configurações são salvas automaticamente no seu navegador.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Component Preview Modal (Replaces Iframe) */}
      {previewIntentId && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-[400px] h-[85vh] bg-black rounded-[3rem] shadow-2xl border-4 border-slate-800 flex flex-col overflow-hidden">
            {/* Phone Header simulation */}
            <div className="h-8 bg-slate-900 w-full flex items-center justify-center">
              <div className="w-20 h-4 bg-black rounded-b-xl"></div>
            </div>
            
            {/* Header with Close Button */}
            <div className="bg-slate-800 px-4 py-2 flex justify-between items-center text-white shrink-0">
               <span className="text-xs font-mono text-slate-400">Simulador Mobile</span>
               <button 
                 onClick={() => setPreviewIntentId(null)} 
                 className="w-6 h-6 rounded-full bg-slate-700 hover:bg-red-500 flex items-center justify-center transition-colors"
               >
                 <i className="fa-solid fa-times text-xs"></i>
               </button>
            </div>

            {/* Component Content (Direct Render) */}
            <div className="flex-1 bg-slate-50 relative overflow-y-auto custom-scrollbar">
              <CheckoutPage settings={settings} previewIntentId={previewIntentId} />
            </div>

            {/* Phone Bottom simulation */}
            <div className="h-4 bg-slate-900 w-full flex items-center justify-center shrink-0">
               <div className="w-1/3 h-1 bg-slate-700 rounded-full"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
