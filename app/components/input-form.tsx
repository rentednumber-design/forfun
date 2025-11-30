"use client";
import { ArrowUp } from "lucide-react";
import React, { useState } from "react";

interface MessageInputProps {
    onSend: (message: string) => void;
    placeholder?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
    onSend,
    placeholder = "Describe what you want the AI to do... (e.g., 'Write a blog post about climate change')"
}) => {
    const [message, setMessage] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            onSend(message);
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
                        className="w-full h-28 resize-none bg-transparent outline-none text-gray-900 placeholder-gray-500 text-sm"
                    />

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
