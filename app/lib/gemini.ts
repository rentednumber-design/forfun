import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables");
}

const genAI = new GoogleGenerativeAI(apiKey);

type HistoryItem = {
    question: string;
    answer: string;
};

export async function promptEngine(
    userInput: string,
    conversationHistory: HistoryItem[],
    modelName: string
) {
    const model = genAI.getGenerativeModel({ model: modelName });

    // Determine Tier based on modelName
    let tier: "small" | "medium" | "big" = "medium";
    if (modelName.includes("lite")) tier = "small";
    else if (modelName.includes("pro")) tier = "big";

    const tierInstructions = {
        small: "Generate a concise but effective prompt. Keep descriptions brief but clear. Focus on the essentials.",
        medium: "Generate a detailed and well-structured prompt. Provide good context and clear constraints. Balanced length.",
        big: "Generate an extremely comprehensive, exhaustive, and robust prompt. Leave absolutely no room for error. Use deep context, complex constraints, and multi-step objectives."
    }[tier];

    // HARD LIMIT history to avoid token bloat
    const trimmedHistory = conversationHistory.slice(-3);

    const context = trimmedHistory.length
        ? trimmedHistory
            .map((item) => `Q: ${item.question}\nA: ${item.answer}`)
            .join("\n\n")
        : "None";

    const systemPrompt = `
You are an elite AI Prompt Engineer. Your goal is to craft the most detailed, comprehensive, and robust prompts possible with full description.
The final prompt you generate must be "Full Context" - meaning it should leave no ambiguity for the target LLM.

Your Process:
1.  **Analyze**: Deeply understand the user's request.
2.  **Clarify**: If the request is vague, simple, or lacks specific details (like tone, audience, format, constraints), you MUST ask a clarification question.
    *   **CRITICAL**: Do NOT guess user intent. If a detail seems important but is missing, you MUST ask.
    *   Questions should be **short, direct, and high-impact**.
    *   Ask only ONE question at a time.
    *   Do not be afraid to ask up to 3-4 questions if necessary to get the full picture.
3.  **Generate**: Once you have sufficient information, generate the final JSON.
4.  **Refine**: If the user provides feedback or asks for changes AFTER you have generated a JSON prompt, you MUST update the prompt accordingly and output the NEW JSON.

Final Output Requirements (JSON):
*   **Role**: Define a specific, expert persona.
*   **Objective**: A detailed, step-by-step description of the task.
*   **Context**: Include ALL relevant background info, user preferences, and conversation details.
*   **Constraints**: strict rules, formatting requirements, and "do nots".
*   **Style**: Define the exact tone, voice, and writing style (e.g., "Professional but approachable", "Technical and precise").

Rules:
-   Output MUST be either a single plain-text question OR a valid JSON object.
-   Do NOT output markdown code blocks for the JSON (just the raw JSON string if possible, but if you do, the parser handles it).
-   **TIER REQUIREMENT**: You are currently in the **${tier.toUpperCase()}** tier. ${tierInstructions}
-   If refining, maintain the same JSON structure but improve the content based on user feedback.

Final prompt JSON format:
{
  "Role": "...",
  "Objective": "...",
  "Context": "...",
  "Constraints": "...",
  "Style": "..."
}

User request:
"${userInput}"

Conversation history:
${context}
`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    return response.text().trim();
}
