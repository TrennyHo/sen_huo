// 1. Firebase 核心引入 (靈魂)
import { auth, db, googleProvider } from './services/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth"; 
import { collection, addDoc, query, where, onSnapshot, orderBy } from "firebase/firestore";

import React, { useState, useEffect } from 'react';
// ... (保留您原本所有的 import 路徑)
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
import { Wallet2, BarChart3, CreditCard as CardIcon, PieChart, Target, Plus, Settings, X, Calendar, Repeat, Wallet, Printer, ShieldCheck, Trash2, Landmark, ShieldAlert, Tags, Undo2, TrendingUp, TrendingDown, LogOut } from 'lucide-react';

// ... (保留 STORAGE_KEY 等常量定義)

const App: React.FC = () => {
  // --- 狀態管理 ---
  const [user, setUser] = useState<any>(null); // 管理何總裁的登入身分
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  // ... (保留其他 cardDebts, budgetItems 等 useState)
  
  // --- 核心：雲端同步邏輯 ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // 🚀 登入成功後，從 Firebase 讀取屬於當前用戶的數據 (方案二：數據隔離)
        const q = query(
          collection(db, "transactions"), 
          where("ownerId", "==", currentUser.uid)
        );
        const unsubscribeData = onSnapshot(q, (snapshot) => {
          const cloudData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Transaction[];
          setTransactions(cloudData);
        });
        return () => unsubscribeData();
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // --- 霸道總裁的登入/登出動作 ---
  const handleLogin = () => signInWithPopup(auth, googleProvider);
  const handleLogout = () => signOut(auth);

  // --- 修改後的存檔動作 (同步推送到 Firebase) ---
  const handleAddTransaction = async (newT: Omit<Transaction, 'id'>) => {
    if (!user) return;
    const transactionData = {
      ...newT,
      ownerId: user.uid, // 標記這筆是誰的
      createdAt: new Date().toISOString()
    };
    try {
      await addDoc(collection(db, "transactions"), transactionData);
    } catch (e) {
      console.error("雲端寫入失敗:", e);
    }
  };

  // --- 介面判斷：未登入則顯示帥氣登入頁面 ---
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

  // --- 以下開始為原本的 UI 內容，只需在 Header 補上登出按鈕 ---
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 no-print">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-1 sm:gap-2">
          {/* ... (原本的 Logo 區塊) */}
          <div className="flex items-center gap-2">
            <span className="hidden md:inline text-xs font-bold text-slate-400">總裁：{user.displayName}</span>
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-500 transition-all"><LogOut className="w-5 h-5"/></button>
          </div>
          {/* ... (原本的 Nav 區塊) */}
        </div>
      </header>

      {/* ... (其餘 Main 與 Footer 內容維持不變) */}
    </div>
  );
};

export default App;
