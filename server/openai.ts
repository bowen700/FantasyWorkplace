// Referenced from javascript_openai blueprint
import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getAICoachFeedback(
  kpiData: { name: string; value: number; unit?: string; trend?: string }[],
  userContext: { name: string; record: string }
): Promise<string> {
  try {
    const prompt = `You are an AI performance coach. Analyze the following KPI data for ${userContext.name} (current record: ${userContext.record}) and provide personalized, actionable advice to improve their performance.

KPIs:
${kpiData.map(kpi => `- ${kpi.name}: ${kpi.value}${kpi.unit || ""} ${kpi.trend || ""}`).join('\n')}

Provide motivating, specific feedback in 2-3 concise paragraphs that:
1. Highlights their strengths
2. Identifies one key area for improvement
3. Suggests 1-2 actionable steps they can take

Keep the tone encouraging and professional.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an encouraging AI performance coach helping employees improve their KPIs."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_completion_tokens: 500,
    });

    return response.choices[0].message.content || "Unable to generate feedback at this time.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate AI coaching feedback");
  }
}
