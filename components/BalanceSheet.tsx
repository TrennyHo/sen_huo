
import React, { useMemo } from 'react';
import { Transaction, TransactionType, CreditCardDebt, CreditCard, PaymentMethod, RecurringExpense } from '../types.ts';
import { AlertCircle, Calendar, Landmark, CreditCard as CardIcon, Clock, Repeat } from 'lucide-react';

interface BalanceSheetProps {
  transactions: Transaction[];
  cardDebts: CreditCardDebt[];
  creditCards: CreditCard[];
  recurringExpenses: RecurringExpense[];
  onPayDebt: (id: string) => void;
}

export const BalanceSheet: React.FC<BalanceSheetProps> = ({ 
  transactions, 
  cardDebts,
  creditCards,
  recurringExpenses,
  onPayDebt
}) => {
  const cashAssets = useMemo(() => {
    return transactions.reduce((acc, curr) => {
      if (curr.type === TransactionType.INCOME) return acc + curr.amount;
      if (curr.paymentMethod === PaymentMethod.CASH) return acc - curr.amount;
      return acc;
    }, 0);
  }, [transactions]);

  const totalCardUnpaid = useMemo(() => {
    return transactions
      .filter(t => t.paymentMethod === PaymentMethod.CREDIT_CARD && t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // 本週提醒：包含信用卡費與固定支出
  const weeklyReminders = useMemo(() => {
    const today = new Date();
    const todayDay = today.getDate();
    const reminders: any[] = [];

    // 1. 信用卡提醒
    creditCards.forEach(card => {
      const cardAmt = transactions
        .filter(t => t.creditCardId === card.id && t.paymentMethod === PaymentMethod.CREDIT_CARD)
        .reduce((sum, t) => sum + t.amount, 0);

      const isPaymentWeek = (card.paymentDay >= todayDay && card.paymentDay <= todayDay + 7) ||
                           (todayDay > 24 && card.paymentDay <= (todayDay + 7) % 31);
      
      if (isPaymentWeek && cardAmt > 0) {
        reminders.push({ id: card.id, label: card.name, amount: cardAmt, day: card.paymentDay, type: 'card' });
      }
    });

    // 2. 固定支出提醒
    recurringExpenses.forEach(rec => {
      const isDueSoon = (rec.dayOfMonth >= todayDay && rec.dayOfMonth <= todayDay + 7) ||
                        (todayDay > 24 && rec.dayOfMonth <= (todayDay + 7) % 31);
      if (isDueSoon) {
        reminders.push({ id: rec.id, label: rec.description, amount: rec.amount, day: rec.dayOfMonth, type: 'recurring' });
      }
    });

    return reminders.sort((a, b) => a.day - b.day);
  }, [creditCards, transactions, recurringExpenses]);

  const totalUpcoming = weeklyReminders.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-slate-900 to-indigo-900 p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Landmark className="w-24 h-24" /></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest">真實可用淨資產</p>
                <h3 className="text-3xl font-black mt-1">${(cashAssets - totalCardUnpaid).toLocaleString()}</h3>
              </div>
              <div className="bg-white/10 p-3 rounded-2xl text-indigo-400"><Landmark className="w-6 h-6" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                <p className="text-[10px] text-indigo-200 uppercase tracking-wider mb-1">目前現金/存款</p>
                <p className="text-xl font-black text-emerald-400">${cashAssets.toLocaleString()}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                <p className="text-[10px] text-indigo-200 uppercase tracking-wider mb-1">信用卡未出帳</p>
                <p className="text-xl font-black text-rose-400">-${totalCardUnpaid.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-800 font-black">
                <Clock className="w-5 h-5 text-indigo-600" />
                <span>本週待付項目</span>
              </div>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full">共 ${totalUpcoming.toLocaleString()}</span>
            </div>
            <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar">
              {weeklyReminders.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-400 text-xs italic">本週暫無待付款項</p>
                </div>
              ) : (
                weeklyReminders.map(r => (
                  <div key={`${r.type}-${r.id}`} className="flex justify-between items-center bg-indigo-50/30 p-3 rounded-xl border border-indigo-50">
                    <div className="flex items-center gap-3">
                      {r.type === 'card' ? <CardIcon className="w-3 h-3 text-indigo-500" /> : <Repeat className="w-3 h-3 text-emerald-500" />}
                      <div>
                        <p className="text-xs font-bold text-slate-800">{r.label}</p>
                        <p className="text-[9px] text-slate-400 font-medium">每月 {r.day} 日</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-rose-600">-${r.amount.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-2">
            <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
            <p className="text-[9px] text-amber-700">自動追蹤：系統已包含您設定的固定支出與卡費。</p>
          </div>
        </div>
      </div>
    </div>
  );
};
