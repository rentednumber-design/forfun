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
    modelName: string,
    imageData?: string // Base64 string from the frontend
) {
    // Ensure we use a vision-capable model if an image is provided
    // Note: Gemini 1.5 Flash and Pro both support vision by default.
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
1.  **Analyze**: Deeply understand the user's request. If an image is provided, analyze its contents to extract style, layout, or data points.
2.  **Clarify**: If the request is vague or lacks details, you MUST ask a clarification question.
    * **CRITICAL**: Do NOT guess user intent. 
    * Ask only ONE question at a time.
3.  **Generate**: Once you have sufficient info, generate the final JSON.
4.  **Refine**: If the user provides feedback, update the prompt and output NEW JSON.

Final Output Requirements (JSON):
* **Role**: Define a specific, expert persona.
* **Objective**: A detailed, step-by-step description.
* **Context**: Include background info and conversation details.
* **Constraints**: Strict rules and "do nots".
* **Style**: Define exact tone and voice.

Rules:
-   Output MUST be either a single plain-text question OR a valid JSON object.
-   Do NOT output markdown code blocks (\`\`\`json). Output raw text.
-   **TIER REQUIREMENT**: You are currently in the **${tier.toUpperCase()}** tier. ${tierInstructions}

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

    // Prepare content parts for multimodal support
    const contentParts: any[] = [{ text: systemPrompt }];

    // If an image is provided, add it to the request parts
    if (imageData) {
        try {
            // Extract the base64 data and the mime type
            const mimeType = imageData.match(/data:(.*?);/)?.[1] || "image/jpeg";
            const base64Data = imageData.split(",")[1];

            contentParts.push({
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            });
        } catch (e) {
            console.error("Error processing image data in engine:", e);
        }
    }

    // Call Gemini with the array of parts (Text + Image if available)
    const result = await model.generateContent(contentParts);
    const response = await result.response;
    return response.text().trim();
}