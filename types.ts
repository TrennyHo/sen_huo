
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD'
}

export type Category = 
  | '蝦皮收入' | '租金收入' | '銷售收入' | '薪資' | '投資' 
  | '進貨成本' | '稅務成本' | '工資' | '餐飲' | '交通' | '娛樂' | '購物' | '水電費' | '居住' | '醫療健康' | '債務'
  | '其他';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: Category;
  note: string;
  date: string;
  paymentMethod: PaymentMethod;
  creditCardId?: string;
}

export interface CreditCard {
  id: string;
  name: string;
  closingDay: number;
  paymentDay: number;
  color: string;
}

export interface CreditCardDebt {
  id: string;
  cardName: string;
  totalDebt: number;
  remainingAmount: number;
  installmentTotal: number;
  installmentCurrent: number;
  monthlyAmount: number;
  paymentDay: number;
  isPaidThisMonth: boolean;
}

export interface BudgetItem {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
  paymentMethod: PaymentMethod;
  creditCardId?: string;
}

export interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  dayOfMonth: number; // 1-31
  category: Category;
  paymentMethod: PaymentMethod;
  creditCardId?: string;
}

export interface Payable {
  id: string;
  amount: number;
  description: string;
  dueDate: string;
  isPaid: boolean;
}
