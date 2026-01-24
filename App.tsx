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

// 🚀 關鍵優化：統一由 firebase.ts 引入，並加入 Redirect 相關方法
import { auth, db, googleProvider } from "./services/firebase";
import { getRedirectResult, onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, query, where, onSnapshot } from "firebase/firestore";

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
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 解決手機端 403 錯誤
    getRedirectResult(auth).then((result) => {
      if (result) setUser(result.user);
    }).catch(err => console.error(err));

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const q = query(collection(db, "transactions"), where("ownerId", "==", currentUser.uid));
        onSnapshot(q, (snapshot) => {
          const cloudData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Transaction[];
          if (cloudData.length > 0) setTransactions(cloudData);
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = () => signInWithRedirect(auth, googleProvider);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem(DEBTS_KEY, JSON.stringify(cardDebts)); }, [cardDebts]);
  useEffect(() => { localStorage.setItem(BUDGET_KEY, JSON.stringify(budgetItems)); }, [budgetItems]);
  useEffect(() => { localStorage.setItem(CARDS_KEY, JSON.stringify(creditCards)); }, [creditCards]);
  useEffect(() => { localStorage.setItem(RECURRING_KEY, JSON.stringify(recurringExpenses)); }, [recurringExpenses]);
  useEffect(() => { localStorage.setItem(INITIAL_KEY, JSON.stringify(initialData)); }, [initialData]);
  useEffect(() => { localStorage.setItem(CAT_INC_KEY, JSON.stringify(incomeCategories)); }, [incomeCategories]);
  useEffect(() => { localStorage.setItem(CAT_EXP_KEY, JSON.stringify(expenseCategories)); }, [expenseCategories]);

  // 各種 Handler 函數 (handleAddTransaction, handleDeleteTransaction 等... 這裡保持您原本所有的邏輯)
  const handleAddTransaction = async (newT: Omit<Transaction, 'id'>) => {
    if (!user) return;
    const safeData = { ...newT, ownerId: user.uid, createdAt: new Date().toISOString() };
    await addDoc(collection(db, "transactions"), safeData);
  };
  const handleDeleteTransaction = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));
  const handleAddCard = (name: string, closingDay: number, paymentDay: number) => setCreditCards(prev => [...prev, { id: crypto.randomUUID(), name, closingDay, paymentDay, color: '#4f46e5' }]);
  const handleDeleteCard = (id: string) => setCreditCards(prev => prev.filter(c => c.id !== id));
  const handleAddCardDebt = (newD: Omit<CreditCardDebt, 'id' | 'isPaidThisMonth'>) => setCardDebts(prev => [...prev, { ...newD, id: crypto.randomUUID(), isPaidThisMonth: false }]);
  const handlePayCardInstallment = (id: string) => { /* 原本邏輯 */ };
  const handleDeleteCardDebt = (id: string) => setCardDebts(prev => prev.filter(d => d.id !== id));
  const handleAddBudgetItem = (item: Omit<BudgetItem, 'id'>) => setBudgetItems(prev => [...prev, { ...item, id: crypto.randomUUID() }]);
  const handleDeleteBudgetItem = (id: string) => setBudgetItems(prev => prev.filter(item => item.id !== id));
  const handleAddRecurring = (item: Omit<RecurringExpense, 'id'>) => setRecurringExpenses(prev => [...prev, { ...item, id: crypto.randomUUID() }]);
  const handleDeleteRecurring = (id: string) => setRecurringExpenses(prev => prev.filter(item => item.id !== id));
  const handlePrint = () => window.print();
  const updateInitialBalance = (val: number) => setInitialData(prev => ({ ...prev, startingBalance: val }));
  const updateInitialLiabilities = (val: number) => setInitialData(prev => ({ ...prev, initialLiabilities: val }));
  const addFixedAsset = (name: string, value: number) => setInitialData(prev => ({ ...prev, fixedAssets: [...prev.fixedAssets, { id: crypto.randomUUID(), name, value }] }));
  const removeFixedAsset = (id: string) => setInitialData(prev => ({ ...prev, fixedAssets: prev.fixedAssets.filter(a => a.id !== id) }));
  const addCategory = (type: TransactionType, name: string) => { /* 原本邏輯 */ };
  const removeCategory = (type: TransactionType, name: string) => { /* 原本邏輯 */ };
  const resetCategories = () => { setIncomeCategories(DEFAULT_INC_CATS); setExpenseCategories(DEFAULT_EXP_CATS); };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full">
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"><Wallet2 className="w-8 h-8 text-white" /></div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">森活科技</h1>
          <button onClick={handleLogin} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl">使用 Google 帳號登入</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 no-print">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2"><Wallet2 className="text-indigo-600" /> <h1 className="font-bold">Smart Ledger</h1></div>
          <nav className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setActiveTab('daily')} className={`px-4 py-2 rounded-lg ${activeTab === 'daily' ? 'bg-white shadow' : ''}`}>收支</button>
            <button onClick={() => setActiveTab('budget')} className={`px-4 py-2 rounded-lg ${activeTab === 'budget' ? 'bg-white shadow' : ''}`}>計劃</button>
            <button onClick={() => setActiveTab('cards')} className={`px-4 py-2 rounded-lg ${activeTab === 'cards' ? 'bg-white shadow' : ''}`}>債務</button>
          </nav>
          <div className="flex gap-2">
            <button onClick={() => setShowCategorySettings(true)}><Tags /></button>
            <button onClick={() => setShowInitialSetup(true)}><Landmark /></button>
            <button onClick={() => setShowCardSettings(true)}><Settings /></button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Modals 必須都在這裡 */}
        {showCategorySettings && <div className="...">... (類別管理內容) ...</div>}
        {showInitialSetup && <div className="...">... (資產設定內容) ...</div>}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-8">
            {activeTab === 'daily' && <TransactionForm onAdd={handleAddTransaction} creditCards={creditCards} incomeCategories={incomeCategories} expenseCategories={expenseCategories} />}
            {activeTab === 'cards' && <CreditCardForm onAdd={handleAddCardDebt} />}
            {activeTab === 'budget' && (
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-2xl shadow-sm"><BudgetItemForm onAdd={handleAddBudgetItem} creditCards={creditCards} /></div>
                <div className="bg-white p-5 rounded-2xl shadow-sm"><RecurringForm onAdd={handleAddRecurring} creditCards={creditCards} expenseCategories={expenseCategories} /></div>
              </div>
            )}
            <AIAdvisor transactions={transactions} />
          </div>

          <div className="lg:col-span-8 space-y-8">
            <BalanceSheet transactions={transactions} cardDebts={cardDebts} creditCards={creditCards} recurringExpenses={recurringExpenses} initialData={initialData} onPayDebt={handlePayCardInstallment} />
            {activeTab === 'daily' && (
              <>
                <Dashboard transactions={transactions} />
                <TransactionList transactions={transactions} onDelete={handleDeleteTransaction} />
              </>
            )}
            {activeTab === 'budget' && (
              <BudgetPlanner items={budgetItems} transactions={transactions} cardDebts={cardDebts} creditCards={creditCards} recurringExpenses={recurringExpenses} onDelete={handleDeleteBudgetItem} onDeleteRecurring={handleDeleteRecurring} />
            )}
            {activeTab === 'cards' && (
              <CreditCardManager debts={cardDebts} onPayInstallment={handlePayCardInstallment} onDeleteDebt={handleDeleteCardDebt} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// ... 以下請務必保留所有的內部組件 (CategoryAdder, AssetAddForm, RecurringForm, BudgetItemForm, CardAddForm)
export default App;
