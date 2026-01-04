import { NextRequest, NextResponse } from "next/server";
import { promptEngine } from "@/app/lib/gemini";

export async function POST(req: NextRequest) {
    try {
        // Destructure 'image' from the incoming JSON body
        const { userInput, conversationHistory, model, image } = await req.json();

        // Check for userInput OR image (since a user might upload an image without text)
        if (!userInput && !image) {
            return NextResponse.json(
                { error: "Input or image is required" },
                { status: 400 }
            );
        }

        // Pass the image to the promptEngine
        const output = await promptEngine(
            userInput || "Analyze this image",
            conversationHistory || [],
            model || "gemini-2.5-flash-lite",
            image // The base64 data
        );

        // CASE 1: Model returns JSON (Final Prompt)
        if (output.trim().startsWith("{") || output.includes("```json")) {
            try {
                let cleanedOutput = output.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();

                if (!(cleanedOutput.startsWith("{") && cleanedOutput.endsWith("}"))) {
                    const match = output.match(/\{[\s\S]*\}/);
                    if (match) {
                        cleanedOutput = match[0];
                    }
                }

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

        // CASE 2: Model is ready (Signal for manual triggers)
        if (output === "[READY]") {
            return NextResponse.json({
                status: "ready",
                message: "Model is ready to generate prompt"
            });
        }

        // CASE 3: Model asks a clarification question (or general text response)
        return NextResponse.json({
            status: "question",
            question: output
        });

    } catch (error: any) {
        console.error("Error in prompt engine route:", error);

        // Specific handling for the 429 Quota error you saw earlier
        if (error.status === 429) {
            return NextResponse.json(
                { error: "API Quota exceeded. Please try again later." },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: "Failed to process request" },
            { status: 500 }
        );
    }
}