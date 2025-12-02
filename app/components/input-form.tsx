"use client";
import { ArrowUp, ChevronDown } from "lucide-react";
import React, { useState } from "react";

interface MessageInputProps {
    onSend: (message: string, model: string) => void;
    placeholder?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
    onSend,
    placeholder = "Describe your prompt... We'll make it happen!"
}) => {
    const [message, setMessage] = useState("");
    const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash-lite");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const models = [
        { label: "Basic", value: "gemini-2.5-flash-lite", description: "Faster and cheaper. Good for simple tasks." },
        { label: "Medium", value: "gemini-2.5-flash", description: "Average. Good for most tasks." },
        { label: "Expert", value: "gemini-2.5-pro", description: "Best. Good for complex tasks." },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            onSend(message, selectedModel);
            setMessage("");
        }
    };

    return (
        <div className="w-full flex justify-center mt-10">
            {/* Smaller centered container */}
            <div className="w-full max-w-2xl">
                <form
                    onSubmit={handleSubmit}
                    className="relative bg-white rounded-lg p-4 border border-gray-200 shadow-sm transition-shadow focus-within:shadow-md"
                >
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={placeholder}
                        className="w-full h-28 resize-none bg-transparent outline-none text-gray-900 placeholder-gray-500 text-sm mb-8"
                    />

                    {/* Model Dropdown */}
                    <div className="absolute bottom-4 left-4">
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md text-xs font-medium text-gray-700 transition-colors"
                            >
                                <span>{models.find(m => m.value === selectedModel)?.label}</span>
                                <ChevronDown className="w-3 h-3 text-gray-500" />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10">
                                    {models.map((model) => (
                                        <button
                                            key={model.value}
                                            type="button"
                                            onClick={() => {
                                                setSelectedModel(model.value);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-50 transition-colors flex flex-col gap-0.5 ${selectedModel === model.value ? "bg-gray-50" : ""
                                                }`}
                                        >
                                            <span className="font-medium text-gray-900">{model.label}</span>
                                            <span className="text-gray-500 text-[10px]">{model.value}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Send Button */}
                    <button
                        type="submit"
                        className="absolute bottom-4 right-4 bg-black hover:bg-gray-800 text-white w-8 h-8 rounded-md flex items-center justify-center transition-colors"
                    >
                        <ArrowUp className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default MessageInput;
