"use client";
import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Copy, Check, Loader2 } from "lucide-react";

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
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ initialPrompt, model }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversationHistory, setConversationHistory] = useState<ConversationItem[]>([]);
    const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
    const [finalPrompt, setFinalPrompt] = useState<string>("");
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingText, setLoadingText] = useState("Thinking...");
    const [currentQuestion, setCurrentQuestion] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);



    const generateFinalPrompt = async (history: ConversationItem[], currentMsgs: Message[]) => {
        setLoading(true);
        setLoadingText("Generating final prompt...");
        try {
            const response = await fetch("/api/generate-prompt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userInput: initialPrompt,
                    conversationHistory: history,
                    model: model,
                }),
            });

            const data = await response.json();
            const generatedPrompt = data.prompt;
            setFinalPrompt(generatedPrompt);

            setMessages([
                ...currentMsgs,
                {
                    role: "assistant",
                    content: `Perfect! Based on your answers, here's your optimized prompt:\n\n---\n\n${generatedPrompt}\n\n---\n\nThis prompt is now ready to use with any AI model!`,
                },
            ]);
        } catch (error) {
            console.error("Error generating prompt:", error);
            setMessages([
                ...currentMsgs,
                {
                    role: "assistant",
                    content: "Sorry, there was an error generating the prompt. Please try again.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Start the conversation by asking the first question
        askFirstQuestion();
    }, [initialPrompt]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const askFirstQuestion = async () => {
        setLoading(true);
        setLoadingText("Thinking...");
        try {
            const response = await fetch("/api/ask-question", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userInput: initialPrompt,
                    conversationHistory: [],
                    questionNumber: 1,
                    model: model,
                }),
            });

            const data = await response.json();
            const question = data.question;

            if (question === "[READY]") {
                await generateFinalPrompt([], []);
            } else {
                setCurrentQuestion(question);
                setMessages([
                    {
                        role: "assistant",
                        content: `Great! I'll help you craft the perfect prompt for: "${initialPrompt}"\n\nLet me ask you a few questions to optimize it.\n\n${question}`,
                    },
                ]);
            }
        } catch (error) {
            console.error("Error asking question:", error);
            setMessages([
                {
                    role: "assistant",
                    content: "Sorry, there was an error. Please try again.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = async (answer: string) => {
        // Add user message
        const newMessages = [...messages, { role: "user" as const, content: answer }];
        setMessages(newMessages);

        // Update conversation history
        const newHistory = [
            ...conversationHistory,
            { question: currentQuestion, answer },
        ];
        setConversationHistory(newHistory);

        setLoading(true);
        setLoadingText("Thinking...");
        try {
            const response = await fetch("/api/ask-question", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userInput: initialPrompt,
                    conversationHistory: newHistory,
                    questionNumber: currentQuestionNumber + 1,
                    model: model,
                }),
            });

            const data = await response.json();
            const questionOrReady = data.question;

            if (questionOrReady === "[READY]") {
                await generateFinalPrompt(newHistory, newMessages);
            } else {
                setCurrentQuestion(questionOrReady);
                setMessages([...newMessages, { role: "assistant", content: questionOrReady }]);
                setCurrentQuestionNumber(currentQuestionNumber + 1);
            }
        } catch (error) {
            console.error("Error asking question:", error);
            setMessages([
                ...newMessages,
                {
                    role: "assistant",
                    content: "Sorry, there was an error. Please try again.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(finalPrompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-[#0f1115] rounded-2xl border border-white/5 shadow-lg p-8 min-h-[600px] flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">AI Prompt Engineer</h2>
                <div className="ml-auto text-sm text-gray-500 font-mono">
                    Question {currentQuestionNumber}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto mb-6 space-y-4">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[80%] p-4 rounded-lg text-sm ${msg.role === "user"
                                ? "bg-[#1a1d26] text-white border border-white/5"
                                : "bg-transparent border border-white/10 text-gray-200"
                                }`}
                        >
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            {msg.role === "assistant" && finalPrompt && idx === messages.length - 1 && (
                                <button
                                    onClick={copyToClipboard}
                                    className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-[#1a1d26] border border-white/10 text-gray-300 rounded-md hover:bg-[#252833] transition-colors text-xs font-medium"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4 text-green-400" />
                                            <span className="text-green-400">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            <span>Copy Prompt</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-[#1a1d26] border border-white/5 text-gray-400 p-4 rounded-lg flex items-center gap-2 text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{loadingText}</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Only show if not finished and not loading */}
            {!finalPrompt && !loading && (
                <QuickAnswerInput onSubmit={handleAnswer} />
            )}
        </div>
    );
};

interface QuickAnswerInputProps {
    onSubmit: (answer: string) => void;
}

const QuickAnswerInput: React.FC<QuickAnswerInputProps> = ({ onSubmit }) => {
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
                placeholder="Type your answer..."
                className="w-full px-4 py-3 pr-24 bg-[#1a1d26] border border-white/10 rounded-lg focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-white placeholder-gray-500 text-sm"
                autoFocus
            />
            <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-white text-black rounded-md hover:bg-gray-200 transition-all font-medium text-sm"
            >
                Send
            </button>
        </form>
    );
};

export default ChatInterface;
