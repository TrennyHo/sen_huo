
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
import { Wallet2, BarChart3, CreditCard as CardIcon, PieChart, Target, Plus, Settings, X, Calendar, Repeat, Wallet, Printer, ShieldCheck, Trash2, Landmark, ShieldAlert, Tags, Undo2, TrendingUp, TrendingDown } from 'lucide-react';
// 加上這幾行
import { initializeApp } from "firebase/app";
import { getAuth, signInWithRedirect, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";

import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy } from "firebase/firestore";

// Firebase 配置（使用您之前在 Vercel 設定好的變數）
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
const STORAGE_KEY = 'smart_ledger_data';
const DEBTS_KEY = 'smart_ledger_debts';
const BUDGET_KEY = 'smart_ledger_budget';
const CARDS_KEY = 'smart_ledger_cards';
const RECURRING_KEY = 'smart_ledger_recurring';
const INITIAL_KEY = 'smart_ledger_initial';
const CAT_INC_KEY = 'smart_ledger_cat_inc';
const CAT_EXP_KEY = 'smart_ledger_cat_exp';

const DEFAULT_INC_CATS = ['薪資', '投資', '獎金', '蝦皮收入', '租金收入', '其他'];
const DEFAULT_EXP_CATS = ['餐飲', '交通', '購物', '居住', '水電費', '娛樂', '進貨成本', '工資', '醫療健康', '債務', '其他'];

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
  
  const [incomeCategories, setIncomeCategories] = useState<string[]>(() => safeParse(CAT_INC_KEY, DEFAULT_INC_CATS));
  const [expenseCategories, setExpenseCategories] = useState<string[]>(() => safeParse(CAT_EXP_KEY, DEFAULT_EXP_CATS));

  const [activeTab, setActiveTab] = useState<'daily' | 'cards' | 'budget'>('daily');
  const [showCardSettings, setShowCardSettings] = useState(false);
  const [showInitialSetup, setShowInitialSetup] = useState(false);
  const [showCategorySettings, setShowCategorySettings] = useState(false);
  const [user, setUser] = useState<any>(null); // 管理登入狀態

useEffect(() => {
  // 這裡的 onAuthStateChanged 現在有正確導入了！
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
    if (currentUser) {
      console.log("總裁好！身分驗證成功:", currentUser.uid);
      // 🚀 執行雲端數據抓取邏輯...
      const q = query(collection(db, "transactions"), where("ownerId", "==", currentUser.uid));
      onSnapshot(q, (snapshot) => {
        const cloudData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Transaction[];
        if (cloudData.length > 0) setTransactions(cloudData);
      });
    }
  });
  return () => unsubscribe(); // 卸載時取消監聽
}, []);

const handleLogin = () => {
  signInWithRedirect(auth, provider);
};

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem(DEBTS_KEY, JSON.stringify(cardDebts)); }, [cardDebts]);
  useEffect(() => { localStorage.setItem(BUDGET_KEY, JSON.stringify(budgetItems)); }, [budgetItems]);
  useEffect(() => { localStorage.setItem(CARDS_KEY, JSON.stringify(creditCards)); }, [creditCards]);
  useEffect(() => { localStorage.setItem(RECURRING_KEY, JSON.stringify(recurringExpenses)); }, [recurringExpenses]);
  useEffect(() => { localStorage.setItem(INITIAL_KEY, JSON.stringify(initialData)); }, [initialData]);
  useEffect(() => { localStorage.setItem(CAT_INC_KEY, JSON.stringify(incomeCategories)); }, [incomeCategories]);
  useEffect(() => { localStorage.setItem(CAT_EXP_KEY, JSON.stringify(expenseCategories)); }, [expenseCategories]);


const handleAddTransaction = async (newT: Omit<Transaction, 'id'>) => {
  if (!user) return;

  // 1. 強制格式轉換，確保所有數據都是「Firebase 喜歡的樣子」
  const safeData = {
    amount: Number(newT.amount) || 0, // 確保金額一定是數字
    type: String(newT.type),
    category: String(newT.category),
    note: String(newT.note || ""),   // 確保備註不會是 undefined
    date: String(newT.date),         // 確保日期是字串
    paymentMethod: String(newT.paymentMethod),
    creditCardId: newT.creditCardId ? String(newT.creditCardId) : null,
    ownerId: user.uid,
    createdAt: new Date().toISOString()
  };

  try {
    // 2. 寫入雲端
    const docRef = await addDoc(collection(db, "transactions"), safeData);
    console.log("數據成功存入保險箱，ID 為：", docRef.id);
  } catch (e) {
    console.error("這筆數據被保險箱拒絕了：", e);
    alert("數據格式可能有誤，請檢查金額與日期！");
  }
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
          category: '債務',
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

  const handlePrint = () => { window.print(); };

  const updateInitialBalance = (val: number) => { setInitialData(prev => ({ ...prev, startingBalance: val })); };
  const updateInitialLiabilities = (val: number) => { setInitialData(prev => ({ ...prev, initialLiabilities: val })); };

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

  const addCategory = (type: TransactionType, name: string) => {
    if (!name.trim()) return;
    if (type === TransactionType.INCOME) {
      if (!incomeCategories.includes(name)) setIncomeCategories([...incomeCategories, name]);
    } else {
      if (!expenseCategories.includes(name)) setExpenseCategories([...expenseCategories, name]);
    }
  };

  const removeCategory = (type: TransactionType, name: string) => {
    if (type === TransactionType.INCOME) {
      if (incomeCategories.length > 1) setIncomeCategories(incomeCategories.filter(c => c !== name));
    } else {
      if (expenseCategories.length > 1) setExpenseCategories(expenseCategories.filter(c => c !== name));
    }
  };

  const resetCategories = () => {
    setIncomeCategories(DEFAULT_INC_CATS);
    setExpenseCategories(DEFAULT_EXP_CATS);
  };

  if (!user) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full">
        <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Wallet2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">森活科技</h1>
        <p className="text-slate-500 mb-8 font-medium">請登入以存取您的私人帳簿</p>
        <button onClick={handleLogin} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2">
           使用 Google 帳號登入
        </button>
      </div>
    </div>
  );
}
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 no-print">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-1 sm:gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-indigo-600 p-1.5 rounded-lg shadow-md">
              <Wallet2 className="w-4 h-4 sm:w-5 h-5 text-white" />
            </div>
            <h1 className="text-base sm:text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-400 hidden xs:block">
              Smart Ledger
            </h1>
          </div>
          
          <nav className="flex bg-slate-100 p-1 rounded-xl shrink-0">
            <button onClick={() => setActiveTab('daily')} className={`px-2 sm:px-3 py-1.5 text-[10px] sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'daily' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><BarChart3 className="w-3.5 h-3.5 sm:w-4 h-4" /><span className="hidden sm:inline">收支</span></button>
            <button onClick={() => setActiveTab('budget')} className={`px-2 sm:px-3 py-1.5 text-[10px] sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'budget' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500'}`}><Target className="w-3.5 h-3.5 sm:w-4 h-4" /><span className="hidden sm:inline">計劃</span></button>
            <button onClick={() => setActiveTab('cards')} className={`px-2 sm:px-3 py-1.5 text-[10px] sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'cards' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}><CardIcon className="w-3.5 h-3.5 sm:w-4 h-4" /><span className="hidden sm:inline">債務</span></button>
          </nav>
          
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <button onClick={() => setShowCategorySettings(true)} className="p-1.5 sm:p-2 text-slate-400 hover:text-indigo-600 rounded-lg transition-all" title="類別"><Tags className="w-4 h-4 sm:w-5 h-5"/></button>
            <button onClick={() => setShowInitialSetup(true)} className="p-1.5 sm:p-2 text-slate-400 hover:text-indigo-600 rounded-lg transition-all" title="資產"><Landmark className="w-4 h-4 sm:w-5 h-5"/></button>
            <button onClick={() => setShowCardSettings(!showCardSettings)} className={`p-1.5 sm:p-2 rounded-lg transition-all ${showCardSettings ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-indigo-600'}`}><Settings className="w-4 h-4 sm:w-5 h-5"/></button>
            {/* 重新顯示並優化列印按鈕 */}
            <button onClick={handlePrint} className="p-1.5 sm:p-2 text-slate-400 hover:text-indigo-600 rounded-lg transition-all" title="列印報表"><Printer className="w-4 h-4 sm:w-5 h-5"/></button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-4 sm:py-8">
        {/* Modals remain the same... */}
        {showCategorySettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
            <div className="bg-white w-full max-w-2xl rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden">
              <button onClick={() => setShowCategorySettings(false)} className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600"><X /></button>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <Tags className="w-6 h-6 text-indigo-600" /> 類別管理
                  </h2>
                </div>
                <button onClick={resetCategories} className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1"><Undo2 className="w-3 h-3"/> 恢復預設</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                <div className="space-y-4">
                  <div className="bg-emerald-50 px-3 py-2 rounded-xl text-emerald-800 text-xs font-black">收入類別</div>
                  <CategoryAdder type={TransactionType.INCOME} onAdd={addCategory} />
                  <div className="grid grid-cols-2 gap-2">
                    {incomeCategories.map(cat => (
                      <div key={cat} className="flex justify-between items-center p-2 bg-slate-50 border border-slate-100 rounded-lg">
                        <span className="text-xs font-bold text-slate-700 truncate mr-1">{cat}</span>
                        <button onClick={() => removeCategory(TransactionType.INCOME, cat)} className={`text-slate-300 hover:text-rose-500 ${incomeCategories.length <= 1 ? 'hidden' : ''}`}><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-rose-50 px-3 py-2 rounded-xl text-rose-800 text-xs font-black">支出類別</div>
                  <CategoryAdder type={TransactionType.EXPENSE} onAdd={addCategory} />
                  <div className="grid grid-cols-2 gap-2">
                    {expenseCategories.map(cat => (
                      <div key={cat} className="flex justify-between items-center p-2 bg-slate-50 border border-slate-100 rounded-lg">
                        <span className="text-xs font-bold text-slate-700 truncate mr-1">{cat}</span>
                        <button onClick={() => removeCategory(TransactionType.EXPENSE, cat)} className={`text-slate-300 hover:text-rose-500 ${expenseCategories.length <= 1 ? 'hidden' : ''}`}><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => setShowCategorySettings(false)} className="w-full mt-6 bg-slate-900 text-white font-black py-3 rounded-xl">儲存設定</button>
            </div>
          </div>
        )}

        {showInitialSetup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
            <div className="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-8 shadow-2xl relative">
              <button onClick={() => setShowInitialSetup(false)} className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600"><X /></button>
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6">
                <ShieldCheck className="w-6 h-6 text-indigo-600" /> 財務起點
              </h2>
              <div className="space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase">初始現金/存款</label>
                    <input type="number" value={initialData.startingBalance} onChange={(e) => updateInitialBalance(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-lg font-black text-indigo-600 outline-none" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase">初始既有債務</label>
                    <input type="number" value={initialData.initialLiabilities} onChange={(e) => updateInitialLiabilities(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-lg font-black text-rose-600 outline-none" />
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-xs font-black text-slate-400 uppercase mb-3">其他固定資產</label>
                  <div className="space-y-2 mb-4">
                    {initialData.fixedAssets.map(asset => (
                      <div key={asset.id} className="flex justify-between items-center bg-indigo-50/50 p-3 rounded-xl">
                        <span className="font-bold text-slate-700 text-sm">{asset.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-indigo-600 text-sm">${asset.value.toLocaleString()}</span>
                          <button onClick={() => removeFixedAsset(asset.id)} className="text-slate-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <AssetAddForm onAdd={addFixedAsset} />
                </div>
              </div>
              <button onClick={() => setShowInitialSetup(false)} className="w-full mt-6 bg-indigo-600 text-white font-black py-3 rounded-xl">完成設定</button>
            </div>
          </div>
        )}

        {showCardSettings && (
          <div className="mb-6 p-5 bg-slate-900 rounded-3xl text-white shadow-xl no-print">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black flex items-center gap-2"><CardIcon className="w-5 h-5 text-indigo-400"/> 卡片管理</h2>
              <button onClick={() => setShowCardSettings(false)} className="text-white/50"><X className="w-5 h-5"/></button>
            </div>
            <div className="space-y-6">
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar"><CreditCardTable cards={creditCards} onDelete={handleDeleteCard} /></div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10"><CardAddForm onAdd={handleAddCard} /></div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          <div className="lg:col-span-4 space-y-6 sm:space-y-8 no-print order-2 lg:order-1">
            {activeTab === 'daily' && <TransactionForm onAdd={handleAddTransaction} creditCards={creditCards} incomeCategories={incomeCategories} expenseCategories={expenseCategories} />}
            {activeTab === 'cards' && <CreditCardForm onAdd={handleAddCardDebt} />}
            {activeTab === 'budget' && (
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100"><h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-amber-500" /> 新增預算</h2><BudgetItemForm onAdd={handleAddBudgetItem} creditCards={creditCards} /></div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100"><h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Repeat className="w-5 h-5 text-indigo-500" /> 固定支出</h2><RecurringForm onAdd={handleAddRecurring} creditCards={creditCards} expenseCategories={expenseCategories} /></div>
              </div>
            )}
            <AIAdvisor transactions={transactions} />
          </div>

          <div className="lg:col-span-8 space-y-6 sm:space-y-8 printable-content order-1 lg:order-2">
            <BalanceSheet transactions={transactions} cardDebts={cardDebts} creditCards={creditCards} recurringExpenses={recurringExpenses} initialData={initialData} onPayDebt={handlePayCardInstallment} />
            {activeTab === 'daily' && (<><Dashboard transactions={transactions} /><TransactionList transactions={transactions} onDelete={handleDeleteTransaction} /></>)}
            {activeTab === 'budget' && (<BudgetPlanner items={budgetItems} transactions={transactions} cardDebts={cardDebts} creditCards={creditCards} recurringExpenses={recurringExpenses} onDelete={handleDeleteBudgetItem} onDeleteRecurring={handleDeleteRecurring} />)}
            {activeTab === 'cards' && (<div className="space-y-6"><div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between no-print"><div><h3 className="text-lg font-semibold text-slate-800">債務詳情</h3></div><div className="bg-indigo-50 p-2 rounded-xl"><PieChart className="w-5 h-5 text-indigo-500" /></div></div><CreditCardManager debts={cardDebts} onPayInstallment={handlePayCardInstallment} onDeleteDebt={handleDeleteCardDebt} /></div>)}
          </div>
        </div>
      </main>
    </div>
  );
};

// ... Internal components CategoryAdder, AssetAddForm, etc. remain unchanged.
const CategoryAdder: React.FC<{ type: TransactionType, onAdd: (t: TransactionType, n: string) => void }> = ({ type, onAdd }) => {
  const [val, setVal] = useState('');
  return (
    <div className="flex gap-2">
      <input placeholder="新增名稱..." value={val} onChange={e => setVal(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none" />
      <button onClick={() => { if(val.trim()){ onAdd(type, val.trim()); setVal(''); } }} className="bg-indigo-600 text-white p-2 rounded-lg"><Plus className="w-4 h-4"/></button>
    </div>
  );
};

const AssetAddForm: React.FC<{ onAdd: (n: string, v: number) => void }> = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [val, setVal] = useState('');
  return (
    <div className="grid grid-cols-2 gap-2">
      <input placeholder="名稱" value={name} onChange={e => setName(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none" />
      <div className="flex gap-2">
        <input type="number" placeholder="價值" value={val} onChange={e => setVal(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none" />
        <button onClick={() => { if(name && val){ onAdd(name, parseFloat(val)); setName(''); setVal(''); } }} className="bg-indigo-600 text-white p-2 rounded-lg"><Plus className="w-4 h-4"/></button>
      </div>
    </div>
  );
};

const RecurringForm: React.FC<{ onAdd: (item: Omit<RecurringExpense, 'id'>) => void, creditCards: CreditCard[], expenseCategories: string[] }> = ({ onAdd, creditCards, expenseCategories }) => {
  const [desc, setDesc] = useState('');
  const [amt, setAmt] = useState('');
  const [day, setDay] = useState('1');
  const [pm, setPm] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [cardId, setCardId] = useState('');
  const [cat, setCat] = useState(expenseCategories[0]);
  useEffect(() => { if (creditCards.length > 0 && !cardId) setCardId(creditCards[0].id); }, [creditCards]);
  return (
    <form onSubmit={(e) => { e.preventDefault(); if(desc && amt){ onAdd({ description: desc, amount: parseFloat(amt), dayOfMonth: parseInt(day), paymentMethod: pm, creditCardId: pm === PaymentMethod.CREDIT_CARD ? cardId : undefined, category: cat }); setDesc(''); setAmt(''); } }} className="space-y-3">
      <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="項目名稱" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none" />
      <div className="grid grid-cols-2 gap-3">
        <input type="number" value={amt} onChange={e => setAmt(e.target.value)} placeholder="金額" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none" />
        <select value={cat} onChange={e => setCat(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none">{expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}</select>
      </div>
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2"><span className="text-[10px] text-slate-400 font-bold">每月</span><input type="number" min="1" max="31" value={day} onChange={e => setDay(e.target.value)} className="w-full bg-transparent p-2 text-xs outline-none font-bold" /><span className="text-[10px] text-slate-400 font-bold">日</span></div>
      <div className="flex bg-slate-100 p-1 rounded-lg">
        <button type="button" onClick={() => setPm(PaymentMethod.CASH)} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${pm === PaymentMethod.CASH ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>現金</button>
        <button type="button" onClick={() => setPm(PaymentMethod.CREDIT_CARD)} disabled={creditCards.length === 0} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${pm === PaymentMethod.CREDIT_CARD ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>信用卡</button>
      </div>
      {pm === PaymentMethod.CREDIT_CARD && (<select value={cardId} onChange={e => setCardId(e.target.value)} className="w-full bg-indigo-50 border border-indigo-100 rounded-lg p-2 text-xs font-bold text-indigo-700">{creditCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>)}
      <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl shadow-md">儲存固定項目</button>
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
  useEffect(() => { if (creditCards.length > 0 && !cardId) setCardId(creditCards[0].id); }, [creditCards]);
  return (
    <form onSubmit={(e) => { e.preventDefault(); if(desc && amt && date){ onAdd({ description: desc, amount: parseFloat(amt), type, date, paymentMethod: pm, creditCardId: pm === PaymentMethod.CREDIT_CARD ? cardId : undefined }); setDesc(''); setAmt(''); } }} className="space-y-3">
      <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="名稱" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none" />
      <div className="grid grid-cols-2 gap-3">
        <input type="number" value={amt} onChange={e => setAmt(e.target.value)} placeholder="金額" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none" />
        <select value={type} onChange={e => setType(e.target.value as TransactionType)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none"><option value={TransactionType.INCOME}>預計收入</option><option value={TransactionType.EXPENSE}>預計支出</option></select>
      </div>
      {type === TransactionType.EXPENSE && (
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button type="button" onClick={() => setPm(PaymentMethod.CASH)} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${pm === PaymentMethod.CASH ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>現金</button>
          <button type="button" onClick={() => setPm(PaymentMethod.CREDIT_CARD)} disabled={creditCards.length === 0} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${pm === PaymentMethod.CREDIT_CARD ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>信用卡</button>
        </div>
      )}
      {pm === PaymentMethod.CREDIT_CARD && type === TransactionType.EXPENSE && (<select value={cardId} onChange={e => setCardId(e.target.value)} className="w-full bg-indigo-50 border border-indigo-100 rounded-lg p-2 text-xs font-bold text-indigo-700">{creditCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>)}
      <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none" />
      <button type="submit" className="w-full bg-amber-500 text-white font-bold py-2.5 rounded-xl shadow-md">加入計劃</button>
    </form>
  );
};

const CardAddForm: React.FC<{ onAdd: (n: string, c: number, p: number) => void }> = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [closing, setClosing] = useState('10');
  const [payment, setPayment] = useState('25');
  return (
    <div className="space-y-4">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="卡片名稱" className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm text-white outline-none" />
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-[10px] text-indigo-300 font-black mb-1 block">結帳日</label><input type="number" value={closing} onChange={e => setClosing(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm text-white" /></div>
        <div><label className="text-[10px] text-indigo-300 font-black mb-1 block">繳款日</label><input type="number" value={payment} onChange={e => setPayment(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm text-white" /></div>
      </div>
      <button onClick={() => { if(name){ onAdd(name, parseInt(closing), parseInt(payment)); setName(''); } }} className="w-full bg-indigo-600 text-white font-black py-3 rounded-xl">新增卡片</button>
    </div>
  );
};

const WalletIcon = ({ className }: { className?: string }) => <Wallet className={className} />;
const TrendingUpIcon = ({ className }: { className?: string }) => <TrendingUp className={className} />;
const TrendingDownIcon = ({ className }: { className?: string }) => <TrendingDown className={className} />;

export default App;
