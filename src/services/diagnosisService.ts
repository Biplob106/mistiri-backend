import { AiKnowledge, IAiKnowledge } from "../models/AiKnowledge";

// diagnosis-এর ফলাফল যেমন দেখতে হবে — controller/frontend-এ ব্যবহার হবে
export interface DiagnosisResult {
  title: string;
  category: string;
  possibleCauses: string[];
  solution: string;
  estimatedCost: string;
}

// rule-based diagnosis: user-এর লেখা text-এর সাথে knowledge base-এর
// keyword মিলিয়ে সবচেয়ে ভালো ম্যাচ খুঁজে বের করে। কোনো paid AI নয়।
export const diagnose = async (
  text: string
): Promise<DiagnosisResult | null> => {
  // পুরো text ছোট হাতের করে নিই, যাতে case মিলুক (keyword-ও lowercase-এ রাখা)
  const haystack = text.toLowerCase();

  const entries = await AiKnowledge.find();

  let best: IAiKnowledge | null = null;
  let bestScore = 0;

  // প্রতিটা entry-র জন্য দেখি ওর কয়টা keyword user-এর লেখায় আছে —
  // যত বেশি keyword মেলে, ম্যাচ তত শক্তিশালী
  for (const entry of entries) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (keyword && haystack.includes(keyword.toLowerCase())) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  // একটাও keyword না মিললে (score 0) কিছু ফেরত দিই না
  if (!best || bestScore === 0) {
    return null;
  }

  return {
    title: best.title,
    category: best.category,
    possibleCauses: best.possibleCauses,
    solution: best.solution,
    estimatedCost: best.estimatedCost,
  };
};
