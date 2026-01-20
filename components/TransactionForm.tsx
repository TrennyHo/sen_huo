
import React, { useState, useEffect } from 'react';
import { TransactionType, Category, Transaction, PaymentMethod, CreditCard } from '../types.ts';
import { PlusCircle, CreditCard as CardIcon, Wallet } from 'lucide-react';

interface TransactionFormProps {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  creditCards: CreditCard[];
  incomeCategories: string[];
  expenseCategories: string[];
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onAdd, creditCards, incomeCategories, expenseCategories }) => {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [creditCardId, setCreditCardId] = useState<string>('');
  const [category, setCategory] = useState<Category>(expenseCategories[0]);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (type === TransactionType.INCOME) {
      setCategory(incomeCategories[0] || '其他');
      setPaymentMethod(PaymentMethod.CASH);
    } else {
      setCategory(expenseCategories[0] || '其他');
    }
  }, [type, incomeCategories, expenseCategories]);

  useEffect(() => {
    if (creditCards.length > 0 && !creditCardId) {
      setCreditCardId(creditCards[0].id);
    }
  }, [creditCards]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    onAdd({
      amount: parseFloat(amount),
      type,
      category,
      note,
      date,
      paymentMethod,
      creditCardId: paymentMethod === PaymentMethod.CREDIT_CARD ? creditCardId : undefined
    });

    setAmount('');
    setNote('');
  };

  const currentCategories = type === TransactionType.INCOME ? incomeCategories : expenseCategories;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <PlusCircle className="w-5 h-5 text-indigo-500" />
        新增記錄
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">交易類型</label>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setType(TransactionType.EXPENSE)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === TransactionType.EXPENSE ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
              >支出</button>
              <button
                type="button"
                onClick={() => setType(TransactionType.INCOME)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === TransactionType.INCOME ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
              >收入</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">付款方式</label>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                disabled={type === TransactionType.INCOME}
                onClick={() => setPaymentMethod(PaymentMethod.CASH)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-1 ${paymentMethod === PaymentMethod.CASH ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'} ${type === TransactionType.INCOME ? 'opacity-50' : ''}`}
              ><Wallet className="w-3 h-3"/> 現金</button>
              <button
                type="button"
                disabled={type === TransactionType.INCOME || creditCards.length === 0}
                onClick={() => setPaymentMethod(PaymentMethod.CREDIT_CARD)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-1 ${paymentMethod === PaymentMethod.CREDIT_CARD ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'} ${type === TransactionType.INCOME || creditCards.length === 0 ? 'opacity-50' : ''}`}
              ><CardIcon className="w-3 h-3"/> 信用卡</button>
            </div>
          </div>
        </div>

        {paymentMethod === PaymentMethod.CREDIT_CARD && type === TransactionType.EXPENSE && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="block text-sm font-medium text-slate-600 mb-1">選擇信用卡</label>
            <select
              value={creditCardId}
              onChange={(e) => setCreditCardId(e.target.value)}
              className="w-full bg-indigo-50 border border-indigo-100 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-700"
            >
              {creditCards.map(card => (
                <option key={card.id} value={card.id}>{card.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">日期</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">金額</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none font-bold" required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">類別</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none">
            {currentCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">備註</label>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="備註..." className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none" />
        </div>

        <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
          確認新增記錄
        </button>
      </form>
    </div>
  );
};
