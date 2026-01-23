import { GoogleGenerativeAI } from "@google/generative-ai";
import { Transaction } from "../types.ts";

// 從環境變數讀取 API Key
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || "");

export const getFinancialInsights = async (transactions: Transaction[]): Promise<string> => {
  if (transactions.length === 0) return "加入一些交易記錄來獲得 AI 理財建議！";

  // 使用最新版的模型調用方式
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const summaryData = transactions.map(t => ({
    type: t.type,
    category: t.category,
    amount: t.amount,
    note: t.note,
    date: t.date
  }));

  const prompt = `
    請分析以下財務交易記錄，並提供 3-4 條具體、正向且簡潔的理財建議。
    請使用繁體中文。

    交易記錄：
    ${JSON.stringify(summaryData)}
  `;

  try {
    // 修正原本報錯的 models.generateContent 語法
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "目前無法產生建議。";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "生成建議時出錯，請稍後再試。";
  }
};
