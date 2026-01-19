
import React, { useState } from 'react';
import { CreditCardDebt } from '../types.ts';
import { CreditCard, DollarSign } from 'lucide-react';

interface CreditCardFormProps {
  onAdd: (debt: Omit<CreditCardDebt, 'id' | 'isPaidThisMonth'>) => void;
}

export const CreditCardForm: React.FC<CreditCardFormProps> = ({ onAdd }) => {
  const [cardName, setCardName] = useState('');
  const [totalDebt, setTotalDebt] = useState('');
  const [installmentTotal, setInstallmentTotal] = useState('12');
  const [installmentCurrent, setInstallmentCurrent] = useState('0');
  const [paymentDay, setPaymentDay] = useState('15');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(totalDebt);
    const iTotal = parseInt(installmentTotal);
    const iCurrent = parseInt(installmentCurrent);
    if (!cardName || isNaN(total)) return;

    const monthly = total / iTotal;
    const remaining = total - (monthly * iCurrent);

    onAdd({
      cardName,
      totalDebt: total,
      remainingAmount: remaining,
      installmentTotal: iTotal,
      installmentCurrent: iCurrent,
      monthlyAmount: Math.round(monthly),
      paymentDay: parseInt(paymentDay)
    });
    setCardName('');
    setTotalDebt('');
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-indigo-600" /> 新增債務
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">債務名稱 (如：中信卡、房貸、欠小明)</label>
          <input
            type="text"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            placeholder="請輸入債務項目..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            required
          />
        </div>
        <div className="relative">
          <label className="block text-xs font-medium text-slate-500 mb-1">總債務金額</label>
          <div className="relative">
            <input
              type="number"
              value={totalDebt}
              onChange={(e) => setTotalDebt(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 pl-10 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
            <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-9" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">總期數</label>
            <input type="number" placeholder="總期數" value={installmentTotal} onChange={(e) => setInstallmentTotal(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">已繳期數</label>
            <input type="number" placeholder="已繳" value={installmentCurrent} onChange={(e) => setInstallmentCurrent(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">繳款日</label>
            <input type="number" placeholder="日期" value={paymentDay} onChange={(e) => setPaymentDay(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs" />
          </div>
        </div>
        <button type="submit" className="w-full bg-slate-800 text-white font-semibold py-3 rounded-xl hover:bg-slate-900 shadow-lg transition-all">
          建立債務計劃
        </button>
      </form>
    </div>
  );
};
