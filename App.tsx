
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, Category, CreditCardDebt, BudgetItem, CreditCard, PaymentMethod, RecurringExpense, InitialData, FixedAsset } from './types.ts';
import { TransactionForm } from './components/TransactionForm.tsx';
import { TransactionList } from './components/TransactionList.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { AIAdvisor } from './components/AIAdvisor.tsx';
import { BalanceSheet } from './components/BalanceSheet.tsx';
import { CreditCardManager } from './components/CreditCardManager.tsx';
import { CreditCardForm } from './components/CreditCardForm.tsx';
import { BudgetPlanner } from './components/BudgetPlanner.tsx';
import { CreditCardTable } from './components/CreditCardTable.tsx';
import { Wallet2, BarChart3, CreditCard as CardIcon, PieChart, Target, Plus, Settings, X, Calendar, Repeat, Wallet, Printer, ShieldCheck, Trash2, Landmark, ShieldAlert } from 'lucide-react';

const STORAGE_KEY = 'smart_ledger_data';
const DEBTS_KEY = 'smart_ledger_debts';
const BUDGET_KEY = 'smart_ledger_budget';
const CARDS_KEY = 'smart_ledger_cards';
const RECURRING_KEY = 'smart_ledger_recurring';
const INITIAL_KEY = 'smart_ledger_initial';

const safeParse = (key: string, fallback: any) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    console.error(`Error parsing ${key}:`, e);
    return fallback;
  }
};

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => safeParse(STORAGE_KEY, []));
  const [cardDebts, setCardDebts] = useState<CreditCardDebt[]>(() => safeParse(DEBTS_KEY, []));
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(() => safeParse(BUDGET_KEY, []));
  const [creditCards, setCreditCards] = useState<CreditCard[]>(() => safeParse(CARDS_KEY, []));
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>(() => safeParse(RECURRING_KEY, []));
  const [initialData, setInitialData] = useState<InitialData>(() => safeParse(INITIAL_KEY, { startingBalance: 0, initialLiabilities: 0, fixedAssets: [] }));

  const [activeTab, setActiveTab] = useState<'daily' | 'cards' | 'budget'>('daily');
  const [showCardSettings, setShowCardSettings] = useState(false);
  const [showInitialSetup, setShowInitialSetup] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(DEBTS_KEY, JSON.stringify(cardDebts));
  }, [cardDebts]);

  useEffect(() => {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(budgetItems));
  }, [budgetItems]);

  useEffect(() => {
    localStorage.setItem(CARDS_KEY, JSON.stringify(creditCards));
  }, [creditCards]);

  useEffect(() => {
    localStorage.setItem(RECURRING_KEY, JSON.stringify(recurringExpenses));
  }, [recurringExpenses]);

  useEffect(() => {
    localStorage.setItem(INITIAL_KEY, JSON.stringify(initialData));
  }, [initialData]);

  const handleAddTransaction = (newT: Omit<Transaction, 'id'>) => {
    setTransactions(prev => [{ ...newT, id: crypto.randomUUID() }, ...prev]);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleAddCard = (name: string, closingDay: number, paymentDay: number) => {
    setCreditCards(prev => [...prev, { id: crypto.randomUUID(), name, closingDay, paymentDay, color: '#4f46e5' }]);
  };

  const handleDeleteCard = (id: string) => {
    setCreditCards(prev => prev.filter(c => c.id !== id));
  };

  const handleAddCardDebt = (newD: Omit<CreditCardDebt, 'id' | 'isPaidThisMonth'>) => {
    setCardDebts(prev => [...prev, { ...newD, id: crypto.randomUUID(), isPaidThisMonth: false }]);
  };

  const handlePayCardInstallment = (id: string) => {
    setCardDebts(prev => prev.map(debt => {
      if (debt.id === id && !debt.isPaidThisMonth) {
        handleAddTransaction({
          amount: debt.monthlyAmount,
          type: TransactionType.EXPENSE,
          category: '債務' as Category,
          note: `債務還款: ${debt.cardName} (第 ${debt.installmentCurrent + 1} 期)`,
          date: new Date().toISOString().split('T')[0],
          paymentMethod: PaymentMethod.CASH
        });
        return {
          ...debt,
          installmentCurrent: debt.installmentCurrent + 1,
          remainingAmount: Math.max(0, debt.remainingAmount - debt.monthlyAmount),
          isPaidThisMonth: true
        };
      }
      return debt;
    }));
  };

  const handleDeleteCardDebt = (id: string) => {
    setCardDebts(prev => prev.filter(d => d.id !== id));
  };

  const handleAddBudgetItem = (item: Omit<BudgetItem, 'id'>) => {
    setBudgetItems(prev => [...prev, { ...item, id: crypto.randomUUID() }]);
  };

  const handleDeleteBudgetItem = (id: string) => {
    setBudgetItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAddRecurring = (item: Omit<RecurringExpense, 'id'>) => {
    setRecurringExpenses(prev => [...prev, { ...item, id: crypto.randomUUID() }]);
  };

  const handleDeleteRecurring = (id: string) => {
    setRecurringExpenses(prev => prev.filter(item => item.id !== id));
  };

  const handlePrint = () => {
    window.print();
  };

  const updateInitialBalance = (val: number) => {
    setInitialData(prev => ({ ...prev, startingBalance: val }));
  };

  const updateInitialLiabilities = (val: number) => {
    setInitialData(prev => ({ ...prev, initialLiabilities: val }));
  };

  const addFixedAsset = (name: string, value: number) => {
    setInitialData(prev => ({ 
      ...prev, 
      fixedAssets: [...prev.fixedAssets, { id: crypto.randomUUID(), name, value }] 
    }));
  };

  const removeFixedAsset = (id: string) => {
    setInitialData(prev => ({ 
      ...prev, 
      fixedAssets: prev.fixedAssets.filter(a => a.id !== id) 
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 no-print">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-md shadow-indigo-100">
              <Wallet2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-400">
              Smart Ledger
            </h1>
          </div>
          
          <nav className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setActiveTab('daily')} className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'daily' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><BarChart3 className="w-4 h-4" /> 收支</button>
            <button onClick={() => setActiveTab('budget')} className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'budget' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500'}`}><Target className="w-4 h-4" /> 計劃</button>
            <button onClick={() => setActiveTab('cards')} className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'cards' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}><CardIcon className="w-4 h-4" /> 債務</button>
          </nav>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowInitialSetup(true)}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all flex items-center gap-2 text-sm font-bold"
            >
              <Landmark className="w-5 h-5"/>
              <span className="hidden sm:inline">資產設定</span>
            </button>
            <button 
              onClick={() => setShowCardSettings(!showCardSettings)} 
              className={`p-2 rounded-lg transition-all flex items-center gap-2 text-sm font-bold ${showCardSettings ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
            >
              <Settings className="w-5 h-5"/>
              <span className="hidden sm:inline">卡片管理</span>
            </button>
            <button 
              onClick={handlePrint}
              className="p-2 bg-slate-900 text-white hover:bg-black rounded-lg transition-all flex items-center gap-2 text-sm font-bold shadow-lg"
            >
              <Printer className="w-5 h-5"/>
              <span className="hidden sm:inline">列印報表</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* 初始資產設定 Modal */}
        {showInitialSetup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 no-print">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative">
              <button onClick={() => setShowInitialSetup(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600"><X /></button>
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 mb-6">
                <ShieldCheck className="w-8 h-8 text-indigo-600" /> 設定財務起點
              </h2>
              
              <div className="space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">初始現金/存款</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={initialData.startingBalance} 
                        onChange={(e) => updateInitialBalance(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-lg font-black text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500" 
                      />
                      <Wallet className="absolute right-4 top-4 text-slate-300 w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">初始既有債務</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={initialData.initialLiabilities} 
                        onChange={(e) => updateInitialLiabilities(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-lg font-black text-rose-600 outline-none focus:ring-2 focus:ring-rose-500" 
                      />
                      <ShieldAlert className="absolute right-4 top-4 text-slate-300 w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">其他固定資產 (股票、房產、外幣)</label>
                  <div className="space-y-3 mb-4">
                    {initialData.fixedAssets.map(asset => (
                      <div key={asset.id} className="flex justify-between items-center bg-indigo-50/50 p-4 rounded-xl border border-indigo-50">
                        <span className="font-bold text-slate-700">{asset.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="font-black text-indigo-600">${asset.value.toLocaleString()}</span>
                          <button onClick={() => removeFixedAsset(asset.id)} className="text-slate-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <AssetAddForm onAdd={addFixedAsset} />
                </div>
              </div>
              
              <button 
                onClick={() => setShowInitialSetup(false)} 
                className="w-full mt-8 bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all"
              >
                完成設定並儲存
              </button>
            </div>
          </div>
        )}

        {showCardSettings && (
          <div className="mb-8 p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl animate-in zoom-in-95 duration-300 border border-indigo-500/30 no-print">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black flex items-center gap-3">
                  <CardIcon className="w-8 h-8 text-indigo-400"/> 
                  信用卡資產組合
                </h2>
                <p className="text-indigo-300/60 text-sm mt-1">目前已建立 {creditCards.length} 張卡片。系統將精確追蹤延後付款的資金流向。</p>
              </div>
              <button onClick={() => setShowCardSettings(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all text-white/50 hover:text-white">
                <X className="w-6 h-6"/>
              </button>
            </div>
            <div className="space-y-8">
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                <CreditCardTable cards={creditCards} onDelete={handleDeleteCard} />
              </div>
              <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                <h3 className="text-sm font-black uppercase tracking-widest text-indigo-300 mb-4">新增信用卡資料</h3>
                <CardAddForm onAdd={handleAddCard} />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-8 no-print">
            {activeTab === 'daily' && <TransactionForm onAdd={handleAddTransaction} creditCards={creditCards} />}
            {activeTab === 'cards' && <CreditCardForm onAdd={handleAddCardDebt} />}
            {activeTab === 'budget' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-amber-500" /> 新增預計收支</h2>
                  <BudgetItemForm onAdd={handleAddBudgetItem} creditCards={creditCards} />
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Repeat className="w-5 h-5 text-indigo-500" /> 設定固定支出 (每月)</h2>
                  <RecurringForm onAdd={handleAddRecurring} creditCards={creditCards} />
                </div>
              </div>
            )}
            <AIAdvisor transactions={transactions} />
          </div>

          <div className="lg:col-span-8 space-y-8 printable-content">
            <BalanceSheet 
              transactions={transactions} 
              cardDebts={cardDebts}
              creditCards={creditCards}
              recurringExpenses={recurringExpenses}
              initialData={initialData}
              onPayDebt={handlePayCardInstallment}
            />

            {activeTab === 'daily' && (
              <>
                <Dashboard transactions={transactions} />
                <TransactionList transactions={transactions} onDelete={handleDeleteTransaction} />
              </>
            )}

            {activeTab === 'budget' && (
              <BudgetPlanner 
                items={budgetItems} 
                transactions={transactions}
                cardDebts={cardDebts}
                creditCards={creditCards}
                recurringExpenses={recurringExpenses}
                onDelete={handleDeleteBudgetItem} 
                onDeleteRecurring={handleDeleteRecurring}
              />
            )}

            {activeTab === 'cards' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center justify-between no-print">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">分期與貸款債務</h3>
                    <p className="text-sm text-slate-500">追蹤大額房貸、車貸或信用卡分期。</p>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-2xl"><PieChart className="w-6 h-6 text-indigo-500" /></div>
                </div>
                <CreditCardManager debts={cardDebts} onPayInstallment={handlePayCardInstallment} onDeleteDebt={handleDeleteCardDebt} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const AssetAddForm: React.FC<{ onAdd: (n: string, v: number) => void }> = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [val, setVal] = useState('');
  const handleAdd = () => { if(name && val) { onAdd(name, parseFloat(val)); setName(''); setVal(''); } };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
      <input 
        placeholder="資產名稱" 
        value={name} onChange={e => setName(e.target.value)}
        className="sm:col-span-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none" 
      />
      <input 
        type="number" placeholder="目前價值" 
        value={val} onChange={e => setVal(e.target.value)}
        className="sm:col-span-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none" 
      />
      <button onClick={handleAdd} className="bg-indigo-600 text-white p-3 rounded-xl flex items-center justify-center hover:bg-indigo-700"><Plus /></button>
    </div>
  );
};

const RecurringForm: React.FC<{ onAdd: (item: Omit<RecurringExpense, 'id'>) => void, creditCards: CreditCard[] }> = ({ onAdd, creditCards }) => {
  const [desc, setDesc] = useState('');
  const [amt, setAmt] = useState('');
  const [day, setDay] = useState('1');
  const [pm, setPm] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [cardId, setCardId] = useState('');

  useEffect(() => {
    if (creditCards.length > 0 && !cardId) setCardId(creditCards[0].id);
  }, [creditCards]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amt) return;
    onAdd({ 
      description: desc, 
      amount: parseFloat(amt), 
      dayOfMonth: parseInt(day),
      paymentMethod: pm,
      creditCardId: pm === PaymentMethod.CREDIT_CARD ? cardId : undefined,
      category: desc.includes('房') ? '居住' : desc.includes('話') ? '水電費' : '其他'
    });
    setDesc(''); setAmt('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="項目 (如: 房租, 電信費)" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none" />
      <div className="grid grid-cols-2 gap-3">
        <input type="number" value={amt} onChange={e => setAmt(e.target.value)} placeholder="金額" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none" />
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2">
          <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">每月</span>
          <input type="number" min="1" max="31" value={day} onChange={e => setDay(e.target.value)} className="w-full bg-transparent p-2 text-sm outline-none font-bold" />
          <span className="text-[10px] text-slate-400 font-bold">日</span>
        </div>
      </div>
      
      <div>
        <label className="block text-[10px] text-slate-400 font-bold uppercase mb-2">支付方式</label>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button type="button" onClick={() => setPm(PaymentMethod.CASH)} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 ${pm === PaymentMethod.CASH ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><Wallet className="w-3 h-3"/> 現金</button>
          <button type="button" onClick={() => setPm(PaymentMethod.CREDIT_CARD)} disabled={creditCards.length === 0} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 ${pm === PaymentMethod.CREDIT_CARD ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'} ${creditCards.length === 0 ? 'opacity-50' : ''}`}><CardIcon className="w-3 h-3"/> 信用卡</button>
        </div>
      </div>

      {pm === PaymentMethod.CREDIT_CARD && (
        <select value={cardId} onChange={e => setCardId(e.target.value)} className="w-full bg-indigo-50 border border-indigo-100 rounded-lg p-2 text-xs font-bold text-indigo-700 outline-none">
          {creditCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}

      <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-md flex items-center justify-center gap-2">
        <Plus className="w-4 h-4"/> 儲存固定支出
      </button>
    </form>
  );
};

const BudgetItemForm: React.FC<{ onAdd: (item: Omit<BudgetItem, 'id'>) => void, creditCards: CreditCard[] }> = ({ onAdd, creditCards }) => {
  const [desc, setDesc] = useState('');
  const [amt, setAmt] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [pm, setPm] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [cardId, setCardId] = useState('');

  useEffect(() => {
    if (creditCards.length > 0 && !cardId) setCardId(creditCards[0].id);
  }, [creditCards]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amt || !date) return;
    onAdd({ 
      description: desc, 
      amount: parseFloat(amt), 
      type, 
      date,
      paymentMethod: pm,
      creditCardId: pm === PaymentMethod.CREDIT_CARD ? cardId : undefined
    });
    setDesc(''); setAmt('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="項目名稱" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none" />
      <div className="grid grid-cols-2 gap-3">
        <input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="金額" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none" />
        <select value={type} onChange={(e) => setType(e.target.value as TransactionType)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none">
          <option value={TransactionType.INCOME}>預計收入</option>
          <option value={TransactionType.EXPENSE}>預計支出</option>
        </select>
      </div>
      
      {type === TransactionType.EXPENSE && (
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button type="button" onClick={() => setPm(PaymentMethod.CASH)} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 ${pm === PaymentMethod.CASH ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><Wallet className="w-3 h-3"/> 現金</button>
          <button type="button" onClick={() => setPm(PaymentMethod.CREDIT_CARD)} disabled={creditCards.length === 0} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 ${pm === PaymentMethod.CREDIT_CARD ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'} ${creditCards.length === 0 ? 'opacity-50' : ''}`}><CardIcon className="w-3 h-3"/> 信用卡</button>
        </div>
      )}

      {pm === PaymentMethod.CREDIT_CARD && type === TransactionType.EXPENSE && (
        <select value={cardId} onChange={e => setCardId(e.target.value)} className="w-full bg-indigo-50 border border-indigo-100 rounded-lg p-2 text-xs font-bold text-indigo-700 outline-none">
          {creditCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}

      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none" />
      <button type="submit" className="w-full bg-amber-500 text-white font-bold py-2.5 rounded-xl hover:bg-amber-600 transition-all shadow-md flex items-center justify-center gap-2">
        <Plus className="w-4 h-4"/> 加入計劃表
      </button>
    </form>
  );
};

const CardAddForm: React.FC<{ onAdd: (n: string, c: number, p: number) => void }> = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [closing, setClosing] = useState('10');
  const [payment, setPayment] = useState('25');
  const handleAdd = () => { if(name) { onAdd(name, parseInt(closing), parseInt(payment)); setName(''); } };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
      <div className="md:col-span-2">
        <label className="block text-[10px] text-indigo-300 font-black uppercase mb-2">卡片或銀行名稱</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="例如：台新 FlyGo" className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="block text-[10px] text-indigo-300 font-black uppercase mb-2">每月結帳日</label>
        <input type="number" value={closing} onChange={e => setClosing(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-sm text-white" />
      </div>
      <div>
        <label className="block text-[10px] text-indigo-300 font-black uppercase mb-2">每月繳款日</label>
        <input type="number" value={payment} onChange={e => setPayment(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-sm text-white" />
      </div>
      <button onClick={handleAdd} className="md:col-span-4 w-full bg-indigo-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2"><Plus className="w-5 h-5"/> 將卡片加入清單</button>
    </div>
  );
};

export default App;
