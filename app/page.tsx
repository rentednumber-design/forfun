"use client";

import { useState } from "react";
import InputForm from "./components/input-form";
import ChatInterface from "./components/chat-interface";

import { ChevronDown, MoreHorizontal } from "lucide-react";

export default function Home() {
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("gemini-2.5-flash-lite");
  const [showChat, setShowChat] = useState(false);

  const handleInitialSubmit = (prompt: string, model: string) => {
    setInitialPrompt(prompt);
    setSelectedModel(model);
    setShowChat(true);
  };

  const handleReset = () => {
    setInitialPrompt(null);
    setShowChat(false);
  };

  return (
    <>
      <main className={`min-h-screen flex flex-col relative ${!showChat ? "p-6" : ""}`}>
        {!showChat ? (
          <>
            {/* Main Landing Screen */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-5xl mx-auto">
              {/* Greeting */}
              <h1 className="text-4xl md:text-5xl font-medium text-center text-white mb-12 leading-tight tracking-tight">
                {new Date().getHours() < 12
                  ? "Good Morning"
                  : new Date().getHours() < 18
                    ? "Good Afternoon"
                    : "Good Evening"}
                <br />
                Can I help you with anything?
              </h1>

              {/* Input Form */}
              <div className="w-full mb-16">
                <InputForm onSend={handleInitialSubmit} />
              </div>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                {[
                  {
                    title: "Website Creation",
                    description: "Create a website for your needs",
                  },
                  {
                    title: "Image Generation",
                    description: "Generate images from text",
                  },
                  {
                    title: "Video Generation",
                    description: "Create videos from text prompts",
                  },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="bg-surface-1 p-6 rounded-2xl border border-white/10 hover:border-primary transition-all group cursor-pointer hover:shadow-lg hover:shadow-primary/10"
                    onClick={() => handleInitialSubmit(feature.title, selectedModel)}
                  >
                    <h3 className="text-white font-medium mb-2 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Chat Interface - full screen overlay */
          <div className="fixed inset-0 z-50 w-full h-full bg-[#09090b]">
            {initialPrompt && (
              <ChatInterface
                initialPrompt={initialPrompt}
                model={selectedModel}
                onBack={handleReset}
              />
            )}
          </div>
        )}
      </main>
    </>
  );
}