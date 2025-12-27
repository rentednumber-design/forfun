"use client";
import { ArrowUp, ChevronDown } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

interface MessageInputProps {
    onSend: (message: string, model: string) => void;
    placeholder?: string;
}

const models = [
    { id: "gemini-2.5-flash-lite", name: "Fast" },
    { id: "gemini-2.5-flash", name: "Medium" },
    { id: "gemini-2.5-pro", name: "Expert" },
];

const MessageInput: React.FC<MessageInputProps> = ({
    onSend,
    placeholder = "Message AI Chat..."
}) => {
    const [message, setMessage] = useState("");
    const [selectedModel, setSelectedModel] = useState(models[0]);
    const [isModelOpen, setIsModelOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsModelOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            onSend(message, selectedModel.id);
            setMessage("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as any);
        }
    };

    return (
        <div className="w-full flex justify-center">
            <div className="w-full max-w-3xl">
                <form
                    onSubmit={handleSubmit}
                    className="relative bg-surface-1 rounded-2xl p-4 border border-white/10 shadow-xl focus-within:border-primary transition-all"
                >
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="w-full h-14 resize-none bg-transparent outline-none text-foreground placeholder-muted-foreground text-base mb-2"
                    />

                    <div className="flex justify-between items-center">
                        <div className="relative" ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={() => setIsModelOpen(!isModelOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors text-sm text-muted-foreground border border-white/5"
                            >
                                <span>{selectedModel.name}</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${isModelOpen ? "rotate-180" : ""}`} />
                            </button>

                            {isModelOpen && (
                                <div className="absolute bottom-full left-0 mb-2 w-48 bg-surface-1 border border-white/10 rounded-xl shadow-xl overflow-hidden z-10">
                                    {models.map((model) => (
                                        <button
                                            key={model.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedModel(model);
                                                setIsModelOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-surface-2 ${selectedModel.id === model.id ? "text-primary bg-surface-2/50" : "text-muted-foreground"
                                                }`}
                                        >
                                            {model.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={!message.trim()}
                            className={`p-2 rounded-full transition-all ${message.trim()
                                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                                : "bg-surface-2 text-muted-foreground/50 cursor-not-allowed"
                                }`}
                        >
                            <ArrowUp className="w-5 h-5" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MessageInput;
