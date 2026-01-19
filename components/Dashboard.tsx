
import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType } from '../types.ts';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, Area, AreaChart
} from 'recharts';
import { Wallet, TrendingDown, TrendingUp, History, LayoutGrid, ArrowUpRight, ArrowDownRight, Columns } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
}

const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b'];

export const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const [historyMode, setHistoryMode] = useState<'combined' | 'income' | 'expense' | 'split'>('combined');

  const summary = useMemo(() => {
    return transactions.reduce((acc, curr) => {
      if (curr.type === TransactionType.INCOME) {
        acc.income += curr.amount;
      } else {
        acc.expense += curr.amount;
      }
      return acc;
    }, { income: 0, expense: 0 });
  }, [transactions]);

  const pieData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const categoryMap = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(categoryMap).map(name => ({
      name,
      value: categoryMap[name]
    }));
  }, [transactions]);

  const barData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return days.map(date => {
      const dayTransactions = transactions.filter(t => t.date === date);
      const income = dayTransactions.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
      const expense = dayTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
      return {
        date: date.split('-').slice(1).join('/'),
        income,
        expense
      };
    });
  }, [transactions]);

  const historyData = useMemo(() => {
    const months = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = d.toISOString().slice(0, 7);
      
      const monthTrans = transactions.filter(t => t.date.startsWith(monthStr));
      const income = monthTrans.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
      const expense = monthTrans.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
      
      months.push({
        name: `${d.getMonth() + 1}月`,
        income,
        expense,
        balance: income - expense
      });
    }
    return months;
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-slate-500 font-medium">總累計收支餘額</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">${(summary.income - summary.expense).toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-slate-500 font-medium">總收入記錄</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">${summary.income.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <TrendingDown className="w-5 h-5" />
            </div>
            <span className="text-slate-500 font-medium">總支出記錄</span>
          </div>
          <p className="text-2xl font-bold text-rose-600">${summary.expense.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 break-inside-avoid">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">支出類別分佈</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 break-inside-avoid">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">近 7 日收支走勢</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend verticalAlign="top" align="right" iconType="circle" />
                <Bar dataKey="income" name="收入" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="expense" name="支出" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 歷史趨勢：支援雙曲線獨立模式 */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden break-inside-avoid">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 no-print">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">過去 6 個月歷史趨勢</h3>
              <p className="text-xs text-slate-400 font-medium">視覺化追蹤財務長期變化與儲蓄效率</p>
            </div>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-2xl self-start md:self-center">
            <button 
              onClick={() => setHistoryMode('combined')}
              className={`px-3 py-2 text-[10px] font-black rounded-xl transition-all flex items-center gap-1.5 ${historyMode === 'combined' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500'}`}
            >
              <LayoutGrid className="w-3 h-3" /> 綜合
            </button>
            <button 
              onClick={() => setHistoryMode('split')}
              className={`px-3 py-2 text-[10px] font-black rounded-xl transition-all flex items-center gap-1.5 ${historyMode === 'split' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500'}`}
            >
              <Columns className="w-3 h-3" /> 獨立雙圖
            </button>
            <button 
              onClick={() => setHistoryMode('income')}
              className={`px-3 py-2 text-[10px] font-black rounded-xl transition-all flex items-center gap-1.5 ${historyMode === 'income' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-500'}`}
            >
              <TrendingUp className="w-3 h-3" /> 收入
            </button>
            <button 
              onClick={() => setHistoryMode('expense')}
              className={`px-3 py-2 text-[10px] font-black rounded-xl transition-all flex items-center gap-1.5 ${historyMode === 'expense' ? 'bg-white text-rose-600 shadow-md' : 'text-slate-500'}`}
            >
              <TrendingDown className="w-3 h-3" /> 支出
            </button>
          </div>
        </div>
        
        {historyMode === 'split' ? (
          <div className="space-y-4">
            <div className="h-[180px] w-full">
              <h4 className="text-[10px] font-black text-emerald-600 uppercase mb-2 ml-4">月收入波動曲線</h4>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" hide />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorInc)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="h-[180px] w-full pt-4 border-t border-slate-50">
              <h4 className="text-[10px] font-black text-rose-600 uppercase mb-2 ml-4">月支出波動曲線</h4>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {historyMode === 'combined' ? (
                <LineChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} tickFormatter={(val) => `$${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} />
                  <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', padding: '16px' }} />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                  <Line type="monotone" dataKey="income" name="月收入" stroke="#10b981" strokeWidth={5} dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="expense" name="月支出" stroke="#f43f5e" strokeWidth={5} dot={{ r: 5, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                </LineChart>
              ) : (
                <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={historyMode === 'income' ? '#10b981' : '#f43f5e'} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={historyMode === 'income' ? '#10b981' : '#f43f5e'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} tickFormatter={(val) => `$${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} />
                  <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', padding: '16px' }} />
                  <Area type="monotone" dataKey={historyMode === 'income' ? 'income' : 'expense'} name={historyMode === 'income' ? '月收入' : '月支出'} stroke={historyMode === 'income' ? '#10b981' : '#f43f5e'} strokeWidth={5} fillOpacity={1} fill="url(#colorVal)" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 no-print">
          {historyData.slice(-2).map((month, idx) => (
            <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{month.name} 儲蓄</p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-black text-slate-800">${month.balance.toLocaleString()}</p>
                {month.balance >= 0 ? <ArrowUpRight className="w-4 h-4 text-emerald-500" /> : <ArrowDownRight className="w-4 h-4 text-rose-500" />}
              </div>
            </div>
          ))}
          <div className="col-span-2 hidden md:block bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex items-center gap-4">
            <div className="bg-indigo-600 p-2 rounded-xl text-white"><LayoutGrid className="w-4 h-4" /></div>
            <div>
              <p className="text-xs font-bold text-indigo-900">提示：獨立分析模式有助於精確控制支出波動</p>
              <p className="text-[10px] text-indigo-600">利用雙圖模式觀察收支增長的斜率是否對等。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
