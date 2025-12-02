import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generatePrompt(userInput: string, conversationHistory: { question: string; answer: string }[], modelName: string) {
    const model = genAI.getGenerativeModel({ model: modelName });

    const context = conversationHistory
        .map((item) => `Q: ${item.question}\nA: ${item.answer}`)
        .join("\n\n");

    const systemPrompt = `You are an expert AI prompt engineer. Your job is to help users create the most effective prompts for AI models.

Based on the user's initial request and their answers to clarifying questions, generate an optimized, well-structured prompt that will get the best results from an AI model.

The optimized prompt should:
- Be clear and specific
- Include relevant context
- Specify the desired tone and style
- Include any constraints or requirements
- Be structured in a way that guides the AI effectively

User's initial request: "${userInput}"

Conversation history:
${context}

Now generate the final optimized prompt. Return ONLY the optimized prompt text, nothing else. Do not include any explanations or meta-commentary.`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    return response.text();
}

export async function askQuestion(userInput: string, conversationHistory: { question: string; answer: string }[], questionNumber: number, modelName: string) {
    const model = genAI.getGenerativeModel({ model: modelName });

    const context = conversationHistory
        .map((item) => `Q: ${item.question}\nA: ${item.answer}`)
        .join("\n\n");

    const systemPrompt = `You are an expert AI prompt engineer helping a user optimize their prompt. 

User's initial request: "${userInput}"

${context ? `Previous conversation:\n${context}\n\n` : ""}

You have asked ${questionNumber - 1} questions so far.

Your goal is to gather just enough information to create a perfect prompt. Focus ONLY on the user's goal and the fastest way to achieve it.

CRITICAL INSTRUCTIONS:
1. Ask a MAXIMUM of 3 questions in total.
2. If you have already asked 2 or 3 questions, you MUST return: [READY]
3. If the user's request is simple and clear, return: [READY] immediately.
4. Only ask questions that are absolutely necessary to understand the core goal.

If you need more information (and haven't reached the limit), ask ONE specific, relevant question.
Return ONLY the question text or [READY], nothing else.`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    return response.text().trim();
}
