
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD'
}

// 改為 string 類型以支援自定義
export type Category = string;

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

export interface FixedAsset {
  id: string;
  name: string;
  value: number;
}

export interface InitialData {
  startingBalance: number;
  initialLiabilities: number;
  fixedAssets: FixedAsset[];
}

export interface Payable {
  id: string;
  amount: number;
  description: string;
  dueDate: string;
  isPaid: boolean;
}
