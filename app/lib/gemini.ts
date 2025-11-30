import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generatePrompt(userInput: string, conversationHistory: { question: string; answer: string }[]) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

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

export async function askQuestion(userInput: string, conversationHistory: { question: string; answer: string }[], questionNumber: number) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const context = conversationHistory
        .map((item) => `Q: ${item.question}\nA: ${item.answer}`)
        .join("\n\n");

    const systemPrompt = `You are an expert AI prompt engineer helping a user optimize their prompt. 

User's initial request: "${userInput}"

${context ? `Previous conversation:\n${context}\n\n` : ""}

This is question ${questionNumber} of 5. Ask ONE specific, relevant question that will help you understand what the user needs to create the perfect prompt. 

The questions should cover aspects like:
- Goal and desired outcome
- Target audience
- Tone and style
- Constraints and requirements
- Context and background

Ask a natural, conversational question. Return ONLY the question text, nothing else.`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    return response.text();
}
