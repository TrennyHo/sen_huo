
import React from 'react';
import { Transaction, TransactionType } from '../types.ts';
import { 
  Trash2, ShoppingBag, Utensils, Bus, Play, Wallet, Heart, Zap, Home, 
  DollarSign, HelpCircle, ShieldAlert, Store, Building2, Tag, 
  Truck, FileText, Users, Bookmark
} from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

const CategoryIcon = ({ category }: { category: string }) => {
  const props = { className: "w-4 h-4" };
  // 匹配已知關鍵字，若不符合則使用 Bookmark 作為通用圖示
  switch (category) {
    case '蝦皮收入': case '網拍': return <Store {...props} />;
    case '租金收入': case '租金': return <Building2 {...props} />;
    case '銷售收入': case '銷售': return <Tag {...props} />;
    case '薪資': case '薪水': return <DollarSign {...props} />;
    case '投資': case '股票': return <Wallet {...props} />;
    case '進貨成本': return <Truck {...props} />;
    case '稅務成本': return <FileText {...props} />;
    case '工資': return <Users {...props} />;
    case '餐飲': case '吃飯': return <Utensils {...props} />;
    case '交通': case '油錢': return <Bus {...props} />;
    case '娛樂': case '玩樂': return <Play {...props} />;
    case '購物': case '買東西': return <ShoppingBag {...props} />;
    case '水電費': case '電費': case '水費': return <Zap {...props} />;
    case '居住': case '房租': return <Home {...props} />;
    case '醫療健康': case '看病': return <Heart {...props} />;
    case '債務': case '還款': return <ShieldAlert {...props} />;
    default: return <Bookmark {...props} />;
  }
};

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800">最近記錄</h3>
      </div>
      <div className="overflow-y-auto max-h-[500px]">
        {transactions.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            尚無交易記錄
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {transactions.map((t) => (
              <li key={t.id} className="p-4 hover:bg-slate-50 transition-colors group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      t.type === TransactionType.INCOME 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'bg-rose-50 text-rose-600'
                    }`}>
                      <CategoryIcon category={t.category} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{t.note || t.category}</p>
                      <p className="text-xs text-slate-500">{t.date} • {t.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-bold ${
                      t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {t.type === TransactionType.INCOME ? '+' : '-'}${t.amount.toLocaleString()}
                    </span>
                    <button
                      onClick={() => onDelete(t.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
