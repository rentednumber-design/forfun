"use client";
import { ArrowUp, ChevronDown, Check, Plus, X } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

interface MessageInputProps {
  // Include optional image base64 string
  onSend: (message: string, model: string, image?: string) => void;
  placeholder?: string;
}

const models = [
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    description: "Most capable for complex work",
    isPremium: true,
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    description: "Best for everyday tasks",
    isPremium: false,
  },
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash-Lite",
    description: "Fastest for quick answers",
    isPremium: false,
  },
];

const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  placeholder = "How can I help you today?",
}) => {
  const [message, setMessage] = useState("");
  const [selectedModel, setSelectedModel] = useState(models[1]); // default to Flash
  const [isModelOpen, setIsModelOpen] = useState(false);

  // Image states
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || imagePreview) {
      onSend(message, selectedModel.id, imagePreview || undefined);
      setMessage("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-3xl">
        <form
          onSubmit={handleSubmit}
          className="relative bg-surface-1 rounded-2xl p-4 border border-border shadow-sm focus-within:ring-1 focus-within:ring-primary/20 transition-all"
        >
          {/* Image Preview Area */}
          {imagePreview && (
            <div className="relative inline-block mb-4 group">
              <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-border">
                <img
                  src={imagePreview}
                  alt="Upload preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-foreground text-background rounded-full p-1 shadow-md hover:scale-110 transition-transform"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={placeholder}
            className="w-full h-14 resize-none bg-transparent outline-none text-foreground placeholder-muted-foreground/60 text-lg mb-2"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              {/* Plus Button to trigger upload */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsModelOpen(!isModelOpen)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-surface-2 transition-colors text-sm text-muted-foreground"
                >
                  <span>{selectedModel.name.split(" ").pop()}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 opacity-50 transition-transform ${
                      isModelOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isModelOpen && (
                  <div className="absolute bottom-full right-0 mb-2 w-72 bg-surface-1 border border-border rounded-2xl shadow-2xl overflow-hidden z-50 p-1">
                    {models.map((model) => (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => {
                          setSelectedModel(model);
                          setIsModelOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex flex-col relative group ${
                          selectedModel.id === model.id ? "bg-surface-2/50" : "hover:bg-surface-2"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-0.5">
                          <span
                            className={`font-medium ${
                              selectedModel.id === model.id
                                ? "text-foreground"
                                : "text-muted-foreground group-hover:text-foreground"
                            }`}
                          >
                            {model.name}
                          </span>
                          <div className="flex items-center gap-2">
                            {model.isPremium && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-blue-200 text-blue-600 bg-blue-50">
                                Upgrade
                              </span>
                            )}
                            {selectedModel.id === model.id && (
                              <Check className="w-4 h-4 text-blue-500" strokeWidth={3} />
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground/70 leading-tight">
                          {model.description}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!message.trim() && !imagePreview}
                className={`p-2 rounded-lg transition-all ${
                  message.trim() || imagePreview
                    ? "bg-primary text-primary-foreground shadow-sm hover:opacity-90"
                    : "bg-primary/20 text-primary-foreground/40 cursor-not-allowed"
                }`}
              >
                <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MessageInput;