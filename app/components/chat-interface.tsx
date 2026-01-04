"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, Copy, Check, Loader2, ArrowLeft, Plus, X } from "lucide-react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

interface Message {
  role: "user" | "assistant";
  content: string;
  image?: string; // Support for displaying images in chat
}

interface ConversationItem {
  question: string;
  answer: string;
}

interface ChatInterfaceProps {
  initialPrompt: string;
  initialImage?: string; // image from Home
  model: string;
  onBack: () => void;
}

// Basic JSON syntax highlight
function syntaxHighlight(json: string): string {
  json = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let style = "";
      if (/^"/.test(match)) {
        style = /:$/.test(match) ? "text-foreground font-semibold" : "text-primary";
      } else if (/true|false/.test(match)) {
        style = "text-success";
      } else if (/null/.test(match)) {
        style = "text-muted-foreground opacity-50";
      } else {
        style = "text-amber-700";
      }
      return `<span class="${style}">${match}</span>`;
    }
  );
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  initialPrompt,
  initialImage,
  model,
  onBack,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ConversationItem[]>([]);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [finalPrompt, setFinalPrompt] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Thinking...");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialRequestMade = useRef(false);
  const lastPromptRef = useRef<string>("");

  const processPrompt = useCallback(
    async (history: ConversationItem[], currentMsgs: Message[], imageToSend?: string) => {
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
            image: imageToSend, // send image to API
          }),
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        if (data.status === "complete") {
          const isRefinement = !!finalPrompt;
          setFinalPrompt(JSON.stringify(data.prompt, null, 2));
          setMessages([
            ...currentMsgs,
            {
              role: "assistant",
              content: isRefinement
                ? "I've updated the prompt based on your feedback."
                : "Perfect! I've generated your optimized prompt.",
            },
          ]);
        } else if (data.status === "question") {
          setCurrentQuestion(data.question);
          setMessages([...currentMsgs, { role: "assistant", content: data.question }]);
          if (history.length > 0 && !finalPrompt) setCurrentQuestionNumber((prev) => prev + 1);
        }
      } catch (error: any) {
        setMessages([...currentMsgs, { role: "assistant", content: "Error: " + error.message }]);
      } finally {
        setLoading(false);
      }
    },
    [initialPrompt, model, finalPrompt]
  );

  // Kick off the first request when the initial prompt or image changes
  useEffect(() => {
    if (initialPrompt === lastPromptRef.current) return;
    setMessages([]);
    setConversationHistory([]);
    setCurrentQuestionNumber(1);
    setFinalPrompt("");
    initialRequestMade.current = false;
    lastPromptRef.current = initialPrompt;

    // Start chat even if only an image is provided
    if (!initialRequestMade.current && (initialPrompt.trim() || initialImage)) {
      initialRequestMade.current = true;
      processPrompt([], [], initialImage);
    }
  }, [initialPrompt, initialImage, processPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAnswer = async (answer: string, image?: string) => {
    if (loading) return;
    const newMessages = [...messages, { role: "user" as const, content: answer, image }];
    setMessages(newMessages);

    const lastQuestion = finalPrompt ? "Refinement request" : currentQuestion;
    const newHistory = [...conversationHistory, { question: lastQuestion, answer }];
    setConversationHistory(newHistory);

    await processPrompt(newHistory, newMessages, image);
  };

  return (
    <div className="w-full h-full bg-background overflow-hidden flex flex-col">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={finalPrompt ? 50 : 100} minSize={30}>
          <div className="h-full flex flex-col p-8 bg-background">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
              <button
                onClick={onBack}
                className="p-2 -ml-2 hover:bg-surface-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-serif text-foreground">AI Prompt Engineer</h2>
              {!finalPrompt && (
                <div className="ml-auto text-xs text-muted-foreground uppercase tracking-widest font-medium">
                  Step {currentQuestionNumber}
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto mb-6 space-y-6 pr-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl text-base leading-relaxed ${
                      msg.role === "user"
                        ? "bg-foreground text-background"
                        : "bg-surface-2 text-foreground border border-border"
                    }`}
                  >
                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="User upload"
                        className="max-w-full max-h-60 rounded-lg mb-3 object-contain bg-black/5"
                      />
                    )}
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{loadingText}</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {!finalPrompt && (
              <div className="mt-auto">
                <QuickAnswerInput
                  onSubmit={(ans, img) => handleAnswer(ans, img)}
                  placeholder="Type your answer or upload an image…"
                />
              </div>
            )}
          </div>
        </ResizablePanel>

        {finalPrompt && (
          <>
            <ResizableHandle />
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full flex flex-col p-8 gap-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">Optimized Prompt</h3>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(finalPrompt);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                    className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-md border border-border hover:bg-surface-2 transition-colors text-sm"
                  >
                    {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? "Copied!" : "Copy Prompt"}</span>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto bg-background rounded-xl border border-border p-2">
                  <pre
                    className="text-sm font-mono whitespace-pre-wrap p-4"
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

const QuickAnswerInput: React.FC<{
  onSubmit: (ans: string, img?: string) => void;
  placeholder: string;
}> = ({ onSubmit, placeholder }) => {
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() || image) {
      onSubmit(input, image || undefined);
      setInput("");
      setImage(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {image && (
        <div className="relative inline-block">
          <img src={image} className="h-20 w-20 object-cover rounded-lg border border-border" />
          <button
            onClick={() => setImage(null)}
            className="absolute -top-2 -right-2 bg-foreground text-background rounded-full p-1"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="relative">
        <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-primary transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-24 py-4 bg-surface-1 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-foreground placeholder-muted-foreground/50 text-base"
          autoFocus
        />
        <button
          type="submit"
          disabled={!input.trim() && !image}
          className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90 transition-all font-medium text-sm disabled:opacity-30"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;