import React, { useState, useEffect, useCallback } from 'react';
import { AdminSettings } from '../types';
import CheckoutPage from './CheckoutPage';

// Nova interface para os dados que virão do MongoDB
interface Pagamento {
  _id: string; // MongoDB usa _id
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  createdAt: string;
}

interface AdminDashboardProps {
  settings: AdminSettings;
  setSettings: React.Dispatch<React.SetStateAction<AdminSettings>>;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ settings, setSettings, onLogout }) => {
  // Estados para o formulário
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  
  // Estados para os dados do backend
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Estados da UI
  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'settings'>('list');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [previewIntentId, setPreviewIntentId] = useState<string | null>(null);

  // Função para buscar os dados do nosso backend (Netlify Function)
  const fetchPagamentos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/.netlify/functions/getPagamentos');
      if (!response.ok) {
        throw new Error('Falha ao buscar os dados.');
      }
      const data: Pagamento[] = await response.json();
      // Ordena do mais novo para o mais antigo
      setPagamentos(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      setError('Não foi possível carregar os pagamentos. Verifique sua conexão ou tente novamente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // useEffect para buscar os dados quando o componente carregar
  useEffect(() => {
    fetchPagamentos();
  }, [fetchPagamentos]);

  // Função para CRIAR um novo link de pagamento
  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val < 10) {
      alert('O valor mínimo é R$ 10.00');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/.netlify/functions/createPagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: val,
          description: description || 'Pagamento PIX',
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao criar o link de pagamento.');
      }
      
      // Limpa o formulário e atualiza a lista
      setAmount('');
      setDescription('');
      setActiveTab('list');
      await fetchPagamentos(); // Re-busca os dados para incluir o novo

    } catch (err) {
      alert('Ocorreu um erro ao criar o link.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Função para DELETAR um pagamento
  const deletePagamento = async (id: string) => {
    if (confirm('Deseja realmente excluir este link? A ação não pode ser desfeita.')) {
        try {
            const response = await fetch(`/.netlify/functions/deletePagamento`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });

            if (!response.ok) {
                throw new Error('Falha ao deletar o pagamento.');
            }
            
            // Remove o item da lista na UI para uma resposta instantânea
            setPagamentos(pagamentos.filter(p => p._id !== id));

        } catch (err) {
            alert('Ocorreu um erro ao deletar o link.');
            console.error(err);
        }
    }
  };


  const handleCopyLink = (id: string) => {
    const baseUrl = window.location.href.split('#')[0];
    const url = `${baseUrl}#/checkout/${id}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(id);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const statusStyles: { [key: string]: string } = {
        pending: 'bg-amber-100 text-amber-800',
        completed: 'bg-green-100 text-green-800',
        expired: 'bg-red-100 text-red-800',
        cancelled: 'bg-slate-100 text-slate-800',
    };
    const statusText: { [key: string]: string } = {
        pending: 'Pendente',
        completed: 'Pago',
        expired: 'Expirado',
        cancelled: 'Cancelado',
    };
    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || statusStyles.cancelled}`}>
            {statusText[status] || 'Desconhecido'}
        </span>
    );
  };


  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Painel Admin <span className="text-emerald-600">7D-bappe</span></h1>
          <p className="text-slate-500">by stafff - Gerenciamento de Vendas</p>
        </div>
        <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
          >
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">Valor (R$)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">R$</span>
                    <input type="number" step="0.01" min="10" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-semibold" placeholder="0,00" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Descrição (Opcional)</label>
                  <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Ex: Produto XYZ" />
                </div>
                <button disabled={isSubmitting} type="submit" className="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-[1.01] disabled:bg-slate-300 disabled:cursor-not-allowed">
                  {isSubmitting ? 'Gerando...' : 'Gerar Link de Checkout'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'list' && (
            <div className="p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6">Histórico de Links</h2>
              {isLoading ? (
                <p className="text-center py-12 text-slate-500">Carregando pagamentos...</p>
              ) : error ? (
                <p className="text-center py-12 text-red-500">{error}</p>
              ) : pagamentos.length === 0 ? (
                <div className="text-center py-12"><div className="text-slate-200 text-6xl mb-4"><i className="fa-solid fa-link-slash"></i></div><p className="text-slate-500">Nenhum link gerado ainda.</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-sm uppercase">
                        <th className="pb-4 font-medium">Data</th>
                        <th className="pb-4 font-medium">Descrição</th>
                        <th className="pb-4 font-medium text-center">Status</th>
                        <th className="pb-4 font-medium text-right">Valor</th>
                        <th className="pb-4 font-medium text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {pagamentos.map((pagamento) => (
                        <tr key={pagamento._id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 text-sm text-slate-500">{new Date(pagamento.createdAt).toLocaleDateString()}</td>
                          <td className="py-4"><p className="font-semibold text-slate-700">{pagamento.description}</p><p className="text-xs text-slate-400 truncate max-w-[150px]">{pagamento._id}</p></td>
                          <td className="py-4 text-center"><StatusBadge status={pagamento.status} /></td>
                          <td className="py-4 text-right font-bold text-emerald-600">R$ {pagamento.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="py-4">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => handleCopyLink(pagamento._id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${copySuccess === pagamento._id ? 'bg-green-100 text-green-700' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`} title="Copiar Link"><i className={`fa-solid ${copySuccess === pagamento._id ? 'fa-check' : 'fa-copy'}`}></i><span className="hidden sm:inline">{copySuccess === pagamento._id ? 'Copiado' : 'Copiar'}</span></button>
                              <button onClick={() => deletePagamento(pagamento._id)} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium transition-all" title="Excluir"><i className="fa-solid fa-trash"></i></button>
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
                 {/* Manter a lógica de salvar a API key no localStorage pode ser útil, 
                     mas o ideal é que ela seja usada apenas pelo backend. 
                     Para este exemplo, manteremos como está. */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Chave de API (Production)</label>
                  <input type="password" value={settings.apiKey} onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="pk_..." />
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Senha do Painel Admin</label>
                  <input type="text" value={settings.adminPassword} onChange={(e) => setSettings({ ...settings, adminPassword: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="Alterar senha..." />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

       {/* O Modal de Preview pode ser mantido, mas precisará de ajustes para buscar os dados do DB também, 
           o que pode ser mais complexo. Por simplicidade, foi removido desta versão. */}
    </div>
  );
};

export default AdminDashboard;
