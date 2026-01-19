
import React, { useMemo } from 'react';
import { CreditCardDebt } from '../types.ts';
import { CreditCard, Calendar, CheckCircle2, Trash2, ChevronRight, PieChart, ShieldCheck, AlertTriangle } from 'lucide-react';

interface CreditCardManagerProps {
  debts: CreditCardDebt[];
  onPayInstallment: (id: string) => void;
  onDeleteDebt: (id: string) => void;
}

export const CreditCardManager: React.FC<CreditCardManagerProps> = ({ 
  debts, 
  onPayInstallment, 
  onDeleteDebt 
}) => {
  const stats = useMemo(() => {
    const totalRemaining = debts.reduce((sum, d) => sum + d.remainingAmount, 0);
    const monthlyTotal = debts.reduce((sum, d) => d.isPaidThisMonth ? sum : sum + d.monthlyAmount, 0);
    const paidCount = debts.filter(d => d.isPaidThisMonth).length;
    return { totalRemaining, monthlyTotal, paidCount };
  }, [debts]);

  const sortedDebts = useMemo(() => {
    return [...debts].sort((a, b) => a.paymentDay - b.paymentDay);
  }, [debts]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">總債務餘額</p>
          <p className="text-2xl font-bold text-slate-800">${stats.totalRemaining.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">本月尚待支付</p>
          <p className="text-2xl font-bold text-rose-500">${stats.monthlyTotal.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">本月進度</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-emerald-500">{stats.paidCount} / {debts.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedDebts.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100 text-slate-400">
            <p className="font-medium">尚未建立分期明細</p>
          </div>
        ) : (
          sortedDebts.map(debt => {
            const progress = (debt.installmentCurrent / debt.installmentTotal) * 100;
            const isCompleted = debt.installmentCurrent >= debt.installmentTotal;
            const remainingMonths = debt.installmentTotal - debt.installmentCurrent;

            return (
              <div key={debt.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group transition-all hover:ring-2 hover:ring-indigo-100">
                <div className="h-1.5 w-full bg-slate-50">
                  <div 
                    className={`h-full transition-all duration-1000 ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">{debt.cardName}</h4>
                        <p className="text-xs font-medium text-slate-400">每月 {debt.paymentDay} 日繳款</p>
                      </div>
                    </div>
                    <button onClick={() => onDeleteDebt(debt.id)} className="p-1.5 text-slate-200 hover:text-rose-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <p className="text-slate-400 text-[10px] uppercase">剩餘餘額</p>
                      <p className="font-bold">${debt.remainingAmount.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <p className="text-slate-400 text-[10px] uppercase">剩餘期數</p>
                      <p className="font-bold">{remainingMonths} / {debt.installmentTotal}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <span className="text-sm font-bold text-slate-600">${debt.monthlyAmount.toLocaleString()}</span>
                    <button
                      onClick={() => onPayInstallment(debt.id)}
                      disabled={debt.isPaidThisMonth || isCompleted}
                      className={`px-4 py-2 rounded-lg text-xs font-bold ${
                        debt.isPaidThisMonth ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-900 text-white'
                      }`}
                    >
                      {debt.isPaidThisMonth ? '本月已付' : isCompleted ? '已結清' : '支付確認'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
