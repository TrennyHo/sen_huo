
import React, { useMemo } from 'react';
import { BudgetItem, Transaction, TransactionType, CreditCardDebt, CreditCard, PaymentMethod, RecurringExpense } from '../types.ts';
import { 
  Trash2, ArrowUpCircle, 
  AlertCircle, CheckCircle2, CalendarClock, CreditCard as CardIcon, Target, Repeat
} from 'lucide-react';

interface BudgetPlannerProps {
  items: BudgetItem[];
  transactions: Transaction[];
  cardDebts: CreditCardDebt[];
  creditCards: CreditCard[];
  recurringExpenses: RecurringExpense[];
  onDelete: (id: string) => void;
  onDeleteRecurring: (id: string) => void;
}

export const BudgetPlanner: React.FC<BudgetPlannerProps> = ({ 
  items, transactions, cardDebts, creditCards, recurringExpenses, onDelete, onDeleteRecurring 
}) => {
  const monthActuals = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const trans = transactions.filter(t => t.date.startsWith(currentMonth));
    const inc = trans.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
    const exp = trans.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
    return { income: inc, expense: exp };
  }, [transactions]);

  const unpaidCreditCardsTotal = useMemo(() => {
    return transactions.filter(t => t.paymentMethod === PaymentMethod.CREDIT_CARD && t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
  }, [transactions]);

  const weeklyForecast = useMemo(() => {
    const today = new Date();
    const weeks = [];
    for (let i = 0; i < 8; i++) {
      const start = new Date(today); start.setDate(today.getDate() + (i * 7));
      const end = new Date(start); end.setDate(start.getDate() + 6);
      const weekItems: any[] = [];
      let total = 0;

      // 1. 預計項目 (現金支付直接計入當週，信用卡支付計入卡費週期)
      items.filter(it => it.type === TransactionType.EXPENSE).forEach(it => {
        if (it.paymentMethod === PaymentMethod.CASH) {
          const d = new Date(it.date);
          if (d >= start && d <= end) { weekItems.push({ label: it.description, amount: it.amount, type: 'planned' }); total += it.amount; }
        }
      });

      // 2. 分期債務
      cardDebts.forEach(dbt => {
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          if (d.getDate() === dbt.paymentDay) { weekItems.push({ label: `${dbt.cardName} (分期)`, amount: dbt.monthlyAmount, type: 'debt' }); total += dbt.monthlyAmount; }
        }
      });

      // 3. 固定支出 (如果是現金則映射到日期，信用卡則映射到繳款日)
      recurringExpenses.forEach(rec => {
        if (rec.paymentMethod === PaymentMethod.CASH) {
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            if (d.getDate() === rec.dayOfMonth) { weekItems.push({ label: `${rec.description} (固定)`, amount: rec.amount, type: 'recurring' }); total += rec.amount; }
          }
        } else {
          // 信用卡固定支出：找對應卡片的繳款日
          const card = creditCards.find(c => c.id === rec.creditCardId);
          if (card) {
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
              if (d.getDate() === card.paymentDay) { weekItems.push({ label: `${rec.description} (卡繳提醒)`, amount: rec.amount, type: 'credit_card' }); total += rec.amount; }
            }
          }
        }
      });

      // 4. 信用卡費 (現有帳單)
      creditCards.forEach(c => {
        const amt = transactions.filter(t => t.creditCardId === c.id && t.paymentMethod === PaymentMethod.CREDIT_CARD).reduce((s, t) => s + t.amount, 0);
        if (amt > 0) {
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            if (d.getDate() === c.paymentDay) { weekItems.push({ label: `${c.name} (卡費)`, amount: amt, type: 'credit_card' }); total += amt; }
          }
        }
      });

      weeks.push({ num: i + 1, range: `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`, items: weekItems, total });
    }
    return weeks;
  }, [items, cardDebts, creditCards, transactions, recurringExpenses]);

  const stats = useMemo(() => {
    const plannedInc = items.filter(i => i.type === TransactionType.INCOME).reduce((s, i) => s + i.amount, 0);
    const plannedExp = items.filter(i => i.type === TransactionType.EXPENSE).reduce((s, i) => s + i.amount, 0);
    const recurringTotal = recurringExpenses.reduce((s, r) => s + r.amount, 0);
    const pendingDebt = cardDebts.filter(d => !d.isPaidThisMonth).reduce((s, d) => s + d.monthlyAmount, 0);

    const totalExp = monthActuals.expense + plannedExp + recurringTotal + pendingDebt + unpaidCreditCardsTotal;
    const totalInc = monthActuals.income + plannedInc;
    return { totalInc, totalExp, remaining: totalInc - totalExp - (totalInc * 0.1) };
  }, [items, monthActuals, cardDebts, unpaidCreditCardsTotal, recurringExpenses]);

  const isBalanced = stats.remaining >= 0;

  return (
    <div className="space-y-8">
      <div className={`p-8 rounded-[2.5rem] border transition-all shadow-xl ${isBalanced ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className={`text-xl font-black ${isBalanced ? 'text-emerald-900' : 'text-rose-900'}`}>預算導航</h3>
            <p className="text-sm mt-1 text-slate-500">{isBalanced ? '您的資金足以支付未來固定與預計支出。' : '警告：支出超過預期，請檢視固定支出。'}</p>
          </div>
          <div className={`p-4 rounded-2xl ${isBalanced ? 'bg-emerald-200/40 text-emerald-700' : 'bg-rose-200/40 text-rose-700'}`}>
            {isBalanced ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white/70 p-4 rounded-2xl border border-white">
            <p className="text-[10px] text-slate-500 uppercase font-black">預計總收入</p>
            <p className="text-lg font-black">${stats.totalInc.toLocaleString()}</p>
          </div>
          <div className="bg-white/70 p-4 rounded-2xl border border-white">
            <p className="text-[10px] text-slate-500 uppercase font-black">預計總負擔</p>
            <p className="text-lg font-black text-rose-600">${stats.totalExp.toLocaleString()}</p>
          </div>
          <div className={`p-4 rounded-2xl ${isBalanced ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
            <p className="text-[10px] uppercase font-black opacity-80">安全結餘</p>
            <p className="text-lg font-black">${stats.remaining.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-black text-slate-800 flex items-center gap-2"><CalendarClock className="w-5 h-5 text-indigo-600" /> 未來 8 週現金流壓力預測</h4>
        <p className="text-[10px] text-slate-400 -mt-2 ml-7">※ 信用卡支付將顯示在卡片繳款日當週</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {weeklyForecast.map(w => (
            <div key={w.num} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col transition-all hover:border-indigo-200">
              <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-50 flex justify-between items-center">
                <div><span className="text-[10px] font-black uppercase text-slate-400">Week {w.num}</span><p className="text-xs font-bold text-slate-700">{w.range}</p></div>
                <p className="text-lg font-black text-indigo-600">${w.total.toLocaleString()}</p>
              </div>
              <div className="p-4 space-y-2">
                {w.items.length === 0 ? <p className="text-center py-4 text-[10px] text-slate-300 italic">無重大支出項目</p> : 
                  w.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded-xl border border-white">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${it.type === 'recurring' ? 'bg-emerald-400' : it.type === 'debt' ? 'bg-rose-400' : 'bg-indigo-400'}`}></span>
                        <span className="text-[10px] font-bold text-slate-600">{it.label}</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-800">${it.amount.toLocaleString()}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2"><Repeat className="w-4 h-4 text-indigo-500" /> 固定支出項目</h4>
          </div>
          <div className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto custom-scrollbar">
            {recurringExpenses.length === 0 ? <div className="p-10 text-center text-xs text-slate-400 italic">尚未設定固定支出項目</div> :
              recurringExpenses.map(r => (
                <div key={r.id} className="p-3 flex justify-between items-center hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    {r.paymentMethod === PaymentMethod.CASH ? <Wallet className="w-3 h-3 text-emerald-500" /> : <CardIcon className="w-3 h-3 text-indigo-500" />}
                    <div>
                      <p className="text-xs font-bold text-slate-700">{r.description}</p>
                      <p className="text-[9px] text-slate-400">每月 {r.dayOfMonth} 日支付 • {r.paymentMethod === PaymentMethod.CASH ? '現金' : '信用卡'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-800">${r.amount.toLocaleString()}</span>
                    <button onClick={() => onDeleteRecurring(r.id)} className="p-1.5 text-slate-200 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2"><Target className="w-4 h-4 text-amber-500" /> 單次預計項目</h4>
          </div>
          <div className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto custom-scrollbar">
            {items.length === 0 ? <div className="p-10 text-center text-xs text-slate-400 italic">無單次計劃項目</div> :
              items.map(it => (
                <div key={it.id} className="p-3 flex justify-between items-center hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    {it.paymentMethod === PaymentMethod.CASH ? <Wallet className="w-3 h-3 text-emerald-500" /> : <CardIcon className="w-3 h-3 text-indigo-500" />}
                    <div><p className="text-xs font-bold text-slate-700">{it.description}</p><p className="text-[9px] text-slate-400">{it.date}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-black ${it.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-slate-800'}`}>{it.type === TransactionType.INCOME ? '+' : '-'}${it.amount.toLocaleString()}</span>
                    <button onClick={() => onDelete(it.id)} className="p-1.5 text-slate-200 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
};

// Internal icons needed for the list display
const Wallet = ({ className }: { className: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>
);
