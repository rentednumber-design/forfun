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
    <main className="min-h-screen flex flex-col p-6 relative">
      {!showChat ? (
        <>
          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-5xl mx-auto">
            {/* Greeting */}
            <h1 className="text-4xl md:text-5xl font-medium text-center text-white mb-12 leading-tight tracking-tight">
              {new Date().getHours() < 12 ? "Good Morning" : new Date().getHours() < 18 ? "Good Afternoon" : "Good Evening"}<br />
              Can I help you with anything ?
            </h1>

            {/* Input */}
            <div className="w-full mb-16">
              <InputForm onSend={handleInitialSubmit} />
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
              {[
                {
                  title: "Website Creation",
                  description: "Create a website for your needs"
                },
                {
                  title: "Image Generation",
                  description: "Generate images from text"
                },
                {
                  title: "Video Generation",
                  description: "Create videos from text prompts"
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  onClick={() => handleInitialSubmit(feature.title, selectedModel)}
                  className="bg-[#0f1115] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors group cursor-pointer"
                >
                  <h3 className="text-white font-medium mb-2 group-hover:text-blue-400 transition-colors">{feature.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="w-full max-w-5xl mx-auto h-full flex flex-col">
          <header className="flex justify-between items-center w-full mb-6">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-[#1a1d26] rounded-lg text-gray-300 hover:bg-[#252833] transition-colors text-sm"
            >
              ← Back
            </button>
          </header>
          {initialPrompt && <ChatInterface initialPrompt={initialPrompt} model={selectedModel} />}
        </div>
      )}
    </main>
  );
}
