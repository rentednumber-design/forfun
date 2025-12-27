import { NextRequest, NextResponse } from "next/server";
import { promptEngine } from "@/app/lib/gemini";

export async function POST(req: NextRequest) {
    try {
        const { userInput, conversationHistory, model } = await req.json();

        if (!userInput) {
            return NextResponse.json(
                { error: "User input is required" },
                { status: 400 }
            );
        }

        const output = await promptEngine(userInput, conversationHistory || [], model || "gemini-2.5-flash-lite");

        // CASE 1: Model returns JSON (Final Prompt)
        // Check if it looks like JSON (starts with { or contains ```json)
        if (output.trim().startsWith("{") || output.includes("```json")) {
            try {
                // Clean up the output - more robust regex to handle various markdown code block formats
                let cleanedOutput = output.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();

                // Fallback: if regex didn't strip it (e.g. no code blocks but just text), just try parsing
                // If it starts with {, it might be raw JSON
                if (cleanedOutput.startsWith("{") && cleanedOutput.endsWith("}")) {
                    // already clean
                } else if (output.includes("{")) {
                    // Try to extract JSON object if it's embedded in text
                    const match = output.match(/\{[\s\S]*\}/);
                    if (match) {
                        cleanedOutput = match[0];
                    }
                }

                // Fix potential double quote issues (e.g. ""Style" -> "Style")
                cleanedOutput = cleanedOutput.replace(/""([^"]+)":/g, '"$1":');

                const promptJSON = JSON.parse(cleanedOutput);
                return NextResponse.json({
                    status: "complete",
                    prompt: promptJSON
                });
            } catch (e) {
                console.error("Failed to parse JSON output:", output);
                return NextResponse.json({
                    status: "error",
                    error: "Invalid JSON received from model"
                }, { status: 500 });
            }
        }

        // CASE 2: Model is ready (No JSON provided, but signaled ready)
        if (output === "[READY]") {
            return NextResponse.json({
                status: "ready",
                message: "Model is ready to generate prompt"
            });
        }

        // CASE 3: Model asks a clarification question
        return NextResponse.json({
            status: "question",
            question: output
        });

    } catch (error) {
        console.error("Error in prompt engine:", error);
        return NextResponse.json(
            { error: "Failed to process request" },
            { status: 500 }
        );
    }
}
