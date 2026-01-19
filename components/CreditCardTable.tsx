
import React from 'react';
import { CreditCard } from '../types.ts';
import { Trash2, Calendar, ArrowRightLeft, Clock } from 'lucide-react';

interface CreditCardTableProps {
  cards: CreditCard[];
  onDelete: (id: string) => void;
}

export const CreditCardTable: React.FC<CreditCardTableProps> = ({ cards, onDelete }) => {
  const today = new Date().getDate();

  const getDaysUntil = (targetDay: number) => {
    if (targetDay >= today) return targetDay - today;
    return (30 - today) + targetDay;
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/10 text-indigo-200 text-[10px] uppercase tracking-widest font-black">
            <th className="px-6 py-4">卡片名稱</th>
            <th className="px-6 py-4">結帳日 (Closing)</th>
            <th className="px-6 py-4">繳款日 (Due)</th>
            <th className="px-6 py-4">週期狀態</th>
            <th className="px-6 py-4 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {cards.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-indigo-300/50 italic text-sm">
                尚未建立信用卡資料，請於下方新增。
              </td>
            </tr>
          ) : (
            cards.map((card) => {
              const daysToClosing = getDaysUntil(card.closingDay);
              const daysToPayment = getDaysUntil(card.paymentDay);

              return (
                <tr key={card.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-8 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                      <span className="font-bold text-white">{card.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-indigo-100">
                      <Calendar className="w-3 h-3 text-indigo-400" />
                      <span className="text-sm font-mono">每月 {card.closingDay} 日</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-rose-300">
                      <Clock className="w-3 h-3 text-rose-400" />
                      <span className="text-sm font-mono font-bold">每月 {card.paymentDay} 日</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[9px] font-black uppercase">
                        <span className="text-indigo-300">結帳倒數 {daysToClosing} 天</span>
                        <span className="text-rose-300">繳款倒數 {daysToPayment} 天</span>
                      </div>
                      <div className="h-1.5 w-32 bg-white/10 rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-indigo-500" 
                          style={{ width: `${Math.max(5, 100 - (daysToClosing * 3.3))}%` }}
                        ></div>
                        <div 
                          className="h-full bg-rose-500" 
                          style={{ width: `${Math.max(5, 100 - (daysToPayment * 3.3))}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onDelete(card.id)}
                      className="p-2 text-white/20 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
