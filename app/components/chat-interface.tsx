"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, Copy, Check, Loader2, ArrowLeft } from "lucide-react";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface ConversationItem {
    question: string;
    answer: string;
}

interface ChatInterfaceProps {
    initialPrompt: string;
    model: string;
    onBack: () => void;
}

function syntaxHighlight(json: string): string {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        (match) => {
            let style = '';

            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    // JSON Keys – make them stand out softly but elegantly
                    style = 'text-cyan-300';        // Soft cyan, close to your #00ff9d but calmer
                } else {
                    // String Values – warm green for great readability
                    style = 'text-emerald-400';
                }
            } else if (/true|false/.test(match)) {
                // Booleans – subtle blue
                style = 'text-sky-400';
            } else if (/null/.test(match)) {
                // null – muted purple-gray
                style = 'text-zinc-500';
            } else {
                // Numbers – vibrant but not overwhelming
                style = 'text-amber-400';
            }

            return `<span class="${style}">${match}</span>`;
        }
    );
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ initialPrompt, model, onBack }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversationHistory, setConversationHistory] = useState<ConversationItem[]>([]);
    const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
    const [finalPrompt, setFinalPrompt] = useState<string>("");
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState("Thinking...");
    const [currentQuestion, setCurrentQuestion] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Track if initial request has been made to prevent duplicates
    const initialRequestMade = useRef(false);
    // Track the current prompt to detect actual changes
    const lastPromptRef = useRef<string>("");

    // Memoize processPrompt to prevent unnecessary re-creations
    const processPrompt = useCallback(async (history: ConversationItem[], currentMsgs: Message[]) => {
        setLoading(true);
        setLoadingText("Thinking...");

        try {
            const response = await fetch("/api/prompt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userInput: initialPrompt,
                    conversationHistory: history,
                    model: model,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.status === "complete") {
                const isRefinement = !!finalPrompt;
                setFinalPrompt(JSON.stringify(data.prompt, null, 2));
                setMessages([
                    ...currentMsgs,
                    {
                        role: "assistant",
                        content: isRefinement
                            ? "I've updated the prompt based on your feedback. You can see the changes in the panel."
                            : "Perfect! I've generated your optimized prompt. You can view it in the panel to the right.",
                    },
                ]);
            } else if (data.status === "question") {
                setCurrentQuestion(data.question);
                setMessages([
                    ...currentMsgs,
                    {
                        role: "assistant",
                        content: data.question,
                    },
                ]);
                if (history.length > 0 && !finalPrompt) {
                    setCurrentQuestionNumber(prev => prev + 1);
                }
            } else if (data.error) {
                throw new Error(data.error);
            } else {
                console.error("Unexpected status:", data.status);
                setMessages([
                    ...currentMsgs,
                    {
                        role: "assistant",
                        content: "Something went wrong. Please try again.",
                    },
                ]);
            }
        } catch (error: any) {
            console.error("Error processing prompt:", error);
            const errorMessage = error.message?.includes("Rate limit")
                ? "Rate limit exceeded. Please wait a moment before trying again."
                : error.message?.includes("quota")
                    ? "API quota exceeded. Please try again later."
                    : "Sorry, there was an error. Please try again.";

            setMessages([
                ...currentMsgs,
                {
                    role: "assistant",
                    content: errorMessage,
                },
            ]);
        } finally {
            setLoading(false);
        }
    }, [initialPrompt, model, finalPrompt]);

    // Handle initial prompt and reset
    useEffect(() => {
        // Only run if the prompt actually changed
        if (initialPrompt === lastPromptRef.current) {
            return;
        }

        // Reset all state
        setMessages([]);
        setConversationHistory([]);
        setCurrentQuestionNumber(1);
        setFinalPrompt("");
        setCurrentQuestion("");
        initialRequestMade.current = false;
        lastPromptRef.current = initialPrompt;

        // Make initial API call
        if (!initialRequestMade.current && initialPrompt.trim()) {
            initialRequestMade.current = true;
            processPrompt([], []);
        }
    }, [initialPrompt, processPrompt]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleAnswer = async (answer: string) => {
        if (loading) return;

        // Add user message
        const newMessages = [...messages, { role: "user" as const, content: answer }];
        setMessages(newMessages);

        // Update conversation history
        const lastQuestion = finalPrompt ? "Refinement request" : currentQuestion;
        const newHistory = [
            ...conversationHistory,
            { question: lastQuestion, answer },
        ];
        setConversationHistory(newHistory);

        await processPrompt(newHistory, newMessages);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(finalPrompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full h-full bg-background overflow-hidden flex flex-col">
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={finalPrompt ? 50 : 100} minSize={30}>
                    <div className="h-full flex flex-col p-8">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                            <button
                                onClick={onBack}
                                className="p-2 -ml-2 hover:bg-white/5 rounded-lg transition-colors text-muted-foreground hover:text-white"
                                title="Go Back"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <Sparkles className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-semibold text-white">AI Prompt Engineer</h2>
                            {!finalPrompt && (
                                <div className="ml-auto text-sm text-muted-foreground font-mono">
                                    Question {currentQuestionNumber}
                                </div>
                            )}
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto mb-6 space-y-4 pr-4">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[80%] p-4 rounded-lg text-sm ${msg.role === "user"
                                            ? "bg-surface-2 text-white border border-white/5"
                                            : "bg-transparent border border-white/10 text-foreground"
                                            }`}
                                    >
                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-surface-2 border border-white/5 text-muted-foreground p-4 rounded-lg flex items-center gap-2 text-sm">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>{loadingText}</span>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        {!loading && (
                            <QuickAnswerInput
                                onSubmit={handleAnswer}
                                placeholder={finalPrompt ? "Refine your prompt (e.g., 'add more detail')..." : "Type your answer..."}
                            />
                        )}
                    </div>
                </ResizablePanel>

                {finalPrompt && (
                    <>
                        <ResizableHandle withHandle />
                        <ResizablePanel defaultSize={50} minSize={30}>
                            <div className="h-full flex flex-col bg-surface-1/50 p-6 border-l border-white/5">
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                                    <h3 className="text-lg font-medium text-white">Optimized Prompt</h3>
                                    <button
                                        onClick={copyToClipboard}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-surface-2 border border-white/10 text-muted-foreground rounded-md hover:bg-surface-3 transition-colors text-xs font-medium"
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="w-4 h-4 text-success" />
                                                <span className="text-success">Copied!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" />
                                                <span>Copy Prompt</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto bg-background rounded-lg border border-white/10 p-4">
                                    <pre
                                        className="text-sm font-mono whitespace-pre-wrap p-4 overflow-x-auto"
                                        dangerouslySetInnerHTML={{ __html: syntaxHighlight(finalPrompt) }}
                                    />
                                </div>
                            </div>
                        </ResizablePanel>
                    </>
                )}
            </ResizablePanelGroup>
        </div>
    );
};

interface QuickAnswerInputProps {
    onSubmit: (answer: string) => void;
    placeholder?: string;
}

const QuickAnswerInput: React.FC<QuickAnswerInputProps> = ({ onSubmit, placeholder = "Type your answer..." }) => {
    const [input, setInput] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onSubmit(input);
            setInput("");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-3 pr-24 bg-surface-2 border border-white/10 rounded-lg focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-white placeholder-muted-foreground text-sm"
                autoFocus
            />
            <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-white text-black rounded-md hover:bg-gray-200 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Send
            </button>
        </form>
    );
};

export default ChatInterface;