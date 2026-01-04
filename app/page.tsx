"use client";
import { useState, useEffect, JSX } from "react";
import InputForm from "./components/input-form";
import ChatInterface from "./components/chat-interface";
import { Globe, Image as ImageIcon, Video } from "lucide-react";

type Recommendation = {
  title: string;
  description: string;
  icon: JSX.Element;
  prompt: string;
};

export default function Home() {
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);
  const [initialImage, setInitialImage] = useState<string | undefined>(undefined);
  const [selectedModel, setSelectedModel] = useState<string>("gemini-2.5-flash-lite");
  const [showChat, setShowChat] = useState(false);
  const [dayName, setDayName] = useState("");

  useEffect(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    setDayName(days[new Date().getDay()]);
  }, []);

  const recommendations: Recommendation[] = [
    {
      title: "Research Summary",
      description: "Get a concise summary with highlights and sources.",
      icon: <Globe className="w-6 h-6" />,
      prompt: "Summarize the latest research on renewable energy breakthroughs with key highlights.",
    },
    {
      title: "Image Insight",
      description: "Analyze an image to extract details and context.",
      icon: <ImageIcon className="w-6 h-6" />,
      prompt: "Analyze the attached image and describe key elements and potential use-cases.",
    },
    {
      title: "Video Notes",
      description: "Extract action items and insights from a video transcript.",
      icon: <Video className="w-6 h-6" />,
      prompt: "Generate concise notes and action items from this video’s transcript.",
    },
  ];

  // Accepts optional image from InputForm
  const handleInitialSubmit = (prompt: string, model: string, image?: string) => {
    setInitialPrompt(prompt);
    setInitialImage(image);
    setSelectedModel(model);
    setShowChat(true);
  };

  const handleReset = () => {
    setInitialPrompt(null);
    setInitialImage(undefined);
    setShowChat(false);
  };

  return (
    <main className="min-h-screen flex flex-col relative bg-background text-foreground">
      {!showChat ? (
        <div className="flex-1 flex flex-col items-center pt-32 px-6">
          <div className="flex items-center gap-3 mb-12 text-center">
            <h1 className="greeting-text text-5xl font-serif tracking-tight">
              {dayName} session <br />
              <span className="opacity-60 text-3xl italic">Create Something Valuable</span>
            </h1>
          </div>

          <div className="w-full max-w-4xl mb-16">
            <InputForm onSend={handleInitialSubmit} />
          </div>

          {/* Large Row Recommendations */}
          <div className="w-full max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendations.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleInitialSubmit(item.prompt, selectedModel)}
                  className="flex flex-col items-start gap-4 p-8 rounded-[24px] bg-surface-2/40 border border-border hover:bg-surface-2 hover:border-primary/30 transition-all text-left group min-h-[220px]"
                >
                  <div className="p-4 rounded-2xl bg-background border border-border text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all duration-300">
                    {item.icon}
                  </div>
                  <div className="mt-2">
                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="fixed inset-0 z-50 w-full h-full bg-background">
          {/* Render chat even if only an image is provided */}
          <ChatInterface
            initialPrompt={initialPrompt ?? ""}
            initialImage={initialImage}
            model={selectedModel}
            onBack={handleReset}
          />
        </div>
      )}
    </main>
  );
}