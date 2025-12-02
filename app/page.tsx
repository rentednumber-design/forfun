"use client";
import { useState } from "react";
import InputForm from "./components/input-form";
import ChatInterface from "./components/chat-interface";

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
    <main
      className="bg-[url('https://marketplace.canva.com/EAFIU5uOojA/1/0/1600w/canva-pastel-illustration-scenery-cartoon-desktop-wallpaper-l04fmn2_Sgw.jpg')]
                 bg-cover bg-center min-h-screen flex flex-col justify-center items-center p-6"
    >
      {!showChat ? (
        <>
          <h1 className="text-5xl font-sans font-bold text-black mb-8 tracking-tight">
            Your AI prompt engineer
          </h1>
          <div className="w-full max-w-2xl">
            <InputForm onSend={handleInitialSubmit} />
          </div>
        </>
      ) : (
        <div className="w-full max-w-5xl">
          <button
            onClick={handleReset}
            className="mb-4 px-6 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-black rounded-md transition-colors font-medium text-sm"
          >
            ← Start Over
          </button>
          {initialPrompt && <ChatInterface initialPrompt={initialPrompt} model={selectedModel} />}
        </div>
      )}
    </main>
  );
}
