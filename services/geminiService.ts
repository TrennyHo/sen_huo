
import { GoogleGenAI } from "@google/generative-ai";
import { Transaction } from "../types.ts";

/**
 * Service to interact with Gemini AI for financial insights.
 * Instance is created per call to ensure it uses the most current API key environment.
 */
export const getFinancialInsights = async (transactions: Transaction[]): Promise<string> => {
  if (transactions.length === 0) return "加入一些交易記錄來獲得 AI 理財建議！";

  // Always create a new instance right before making an API call to ensure it uses the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    // The .text property directly returns the string output from the response.
    return response.text || "目前無法生成建議。";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "生成建議時出錯，請稍後再試。";
  }
};
