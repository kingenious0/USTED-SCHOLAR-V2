"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Mic, MicOff, Paperclip, Expand, Zap, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
}

const QUICK_PROMPTS = [
  "Summarize the key concepts in bullet points",
  "What are the most likely exam questions?",
  "Explain this in the simplest way possible",
  "Give me a real-world example of this",
  "What are the definitions I must memorize?",
  "Compare and contrast the main ideas",
];

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function ChatInterface({ courseId, fileId }: { courseId: string, fileId: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      content: "Hello! I am the **Scholar Assistant**. I've loaded your course materials. How can I help you master this course today?",
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // --- 🎙️ Voice Input (Web Speech API) ---
  const toggleMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser doesn't support voice input. Try Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setInput(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  // --- Main Chat Handler ---
  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setShowQuickPrompts(false);

    const newMsgId = Date.now().toString();
    const newUserMsg: Message = { id: newMsgId, role: "user", content: text };

    const history = messages.filter(m => m.id !== "welcome").map(m => ({
      role: m.role,
      content: m.content
    }));

    setMessages(prev => [...prev, newUserMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, fileId })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch response");
      }

      if (!response.body) throw new Error("No response body stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const aiMsgId = (Date.now() + 1).toString();

      setMessages(prev => [...prev, { id: aiMsgId, role: "ai", content: "" }]);
      setIsLoading(false);

      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunkText = decoder.decode(value, { stream: true });
          setMessages(prev => prev.map(m =>
            m.id === aiMsgId ? { ...m, content: m.content + chunkText } : m
          ));
        }
      }
    } catch (error: any) {
      console.error(error);
      setIsLoading(false);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: `Oops! Something went wrong: ${error.message}`
      }]);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: "welcome",
      role: "ai",
      content: "Chat cleared. What would you like to explore next?",
    }]);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0A0A0A] text-gray-200 font-sans relative border-l border-white/5">

      {/* Premium Header */}
      <div className="h-[72px] px-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#0A0A0A]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF8C00] to-[#FF4500] flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">Scholar Assistant</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? "bg-[#FFCC22] animate-pulse" : "bg-[#00FF7F] animate-pulse"}`}></div>
              <span className={`text-[10px] uppercase tracking-widest font-semibold opacity-80 ${isLoading ? "text-[#FFCC22]" : "text-[#00FF7F]"}`}>
                {isLoading ? "Thinking..." : isListening ? "Listening..." : "Ready"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={clearChat} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-gray-500 hover:text-red-400 transition-colors" title="Clear chat">
            <Trash2 className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-gray-400 transition-colors">
            <Expand className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="flex flex-col gap-1 max-w-[85%] sm:max-w-[80%]">
              <div className={`px-5 py-3.5 text-[14px] leading-relaxed shadow-sm ${
                msg.role === "user"
                  ? "bg-[#112136] text-blue-50 rounded-2xl rounded-tr-sm border border-blue-900/30"
                  : "bg-[#1E1E1E] text-gray-200 rounded-2xl rounded-tl-sm border border-white/5"
              }`}>
                {msg.role === "user" ? (
                  <p>{msg.content}</p>
                ) : (
                  <div className="prose prose-sm prose-invert prose-p:my-1.5 prose-headings:my-2 prose-ul:my-1 prose-li:my-0 max-w-none prose-a:text-[#1E90FF]">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
              <span className={`text-[10px] text-gray-500 font-medium ${msg.role === "user" ? "text-right mr-1" : "ml-1"}`}>
                Just now
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex w-full justify-start">
            <div className="px-5 py-3.5 rounded-2xl rounded-tl-sm bg-[#1E1E1E] border border-white/5 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#1E90FF] animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-[#1E90FF] animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-[#1E90FF] animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Panel */}
      <AnimatePresence>
        {showQuickPrompts && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mx-4 mb-2 bg-[#151515] border border-white/10 rounded-2xl p-3 grid grid-cols-1 gap-1"
          >
            <div className="flex items-center justify-between px-2 pb-2 mb-1 border-b border-white/5">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Quick Prompts</span>
              <button onClick={() => setShowQuickPrompts(false)} className="text-gray-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>
            </div>
            {QUICK_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSend(p)}
                className="text-left text-sm px-3 py-2 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white transition-colors"
              >
                {p}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Input Area */}
      <div className="p-4 bg-[#0A0A0A]">
        <div className="relative flex flex-col bg-[#151515] rounded-2xl border border-white/10 focus-within:border-white/20 transition-colors shadow-inner">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
            placeholder="Ask and it shall be given unto thee..."
            className="w-full bg-transparent px-4 pt-4 pb-12 outline-none text-sm text-gray-200 placeholder-gray-500"
          />

          {/* Bottom Toolbar inside Input */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500 px-2">
              <button
                onClick={() => setShowQuickPrompts(p => !p)}
                className={`hover:text-gray-300 transition-colors ${showQuickPrompts ? "text-[#1E90FF]" : ""}`}
                title="Quick prompts"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <span className="text-[10px] ml-2 opacity-50 italic">This is a Beta Version, please verify facts and figures</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleMic}
                className={`p-2 rounded-lg transition-all ${isListening ? "text-red-400 bg-red-400/10 animate-pulse" : "text-gray-400 hover:text-white"}`}
                title={isListening ? "Stop listening" : "Voice input"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isLoading}
                className="p-2 bg-[#1E90FF] hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
