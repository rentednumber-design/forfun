import { NextRequest, NextResponse } from "next/server";
import { askQuestion } from "@/app/lib/gemini";

export async function POST(req: NextRequest) {
    try {
        const { userInput, conversationHistory, questionNumber, model } = await req.json();

        const question = await askQuestion(userInput, conversationHistory, questionNumber, model);

        return NextResponse.json({ question });
    } catch (error) {
        console.error("Error asking question:", error);
        return NextResponse.json(
            { error: "Failed to generate question" },
            { status: 500 }
        );
    }
}
