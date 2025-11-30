import { NextRequest, NextResponse } from "next/server";
import { generatePrompt } from "@/app/lib/gemini";

export async function POST(req: NextRequest) {
    try {
        const { userInput, conversationHistory } = await req.json();

        const optimizedPrompt = await generatePrompt(userInput, conversationHistory);

        return NextResponse.json({ prompt: optimizedPrompt });
    } catch (error) {
        console.error("Error generating prompt:", error);
        return NextResponse.json(
            { error: "Failed to generate prompt" },
            { status: 500 }
        );
    }
}
