"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Bot, Globe, User, Volume2, VolumeX, AlertCircle, Send, Mic, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { matchAdvisorQuery, ReasoningStep } from "@/lib/advisorDatabase";

interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
  isVoice?: boolean;
  reasoning?: ReasoningStep[];
  addons?: {
    type: "asset" | "budget" | "wealth" | "emi" | "tax";
    data: any;
  };
}

interface AdvisorTabProps {
  setActiveTab: (val: string) => void;
  selectedLang: string;
  setSelectedLang: (val: string) => void;
}

const indianLanguages = [
  { code: "en-IN", name: "English (IN)" },
  { code: "hi-IN", name: "Hindi (हिंदी)" },
  { code: "bn-IN", name: "Bengali (বাংলা)" },
  { code: "ta-IN", name: "Tamil (தமிழ்)" },
  { code: "te-IN", name: "Telugu (తెలుగు)" },
  { code: "mr-IN", name: "Marathi (मराठी)" },
  { code: "gu-IN", name: "Gujarati (ગુજરાती)" },
  { code: "kn-IN", name: "Kannada (ಕನ್ನಡ)" },
  { code: "ml-IN", name: "Malayalam (മലയാളം)" },
  { code: "pa-IN", name: "Punjabi (ਪੰਜਾਬी)" },
];

export default function AdvisorTab({ setActiveTab, selectedLang, setSelectedLang }: AdvisorTabProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hi Bibek! I'm your offline AI Wealth Advisor. I can practice around 500 daily-life personal finance questions in multiple Indian languages with detailed reasoning. Ask me anything!", sender: "ai" },
  ]);
  const [advisorInput, setAdvisorInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [micError, setMicError] = useState("");
  const [expandedMessageId, setExpandedMessageId] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const simulationRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, transcript]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (simulationRef.current) clearTimeout(simulationRef.current);
      // Stop any active speech on unmount
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakResponse = (text: string) => {
    if (isMuted || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLang;

    // Attempt to set a native local voice matching the lang
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(selectedLang.split("-")[0]));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = (text: string, isVoice = false) => {
    if (!text.trim()) return;
    
    // Add user message
    const userMsgId = Date.now();
    setMessages((prev) => [...prev, { id: userMsgId, text, sender: "user", isVoice }]);
    setAdvisorInput("");
    setTranscript("");
    setIsTyping(true);
    setMicError("");

    setTimeout(() => {
      // Offline matching with reasoning
      const result = matchAdvisorQuery(text, selectedLang);
      
      const newMsgId = Date.now() + 1;
      setMessages((prev) => [...prev, {
        id: newMsgId,
        text: result.answer,
        sender: "ai",
        reasoning: result.reasoning,
        addons: result.addons
      }]);
      setIsTyping(false);
      speakResponse(result.answer);
      
      // Auto-expand reasoning for the newest message if present
      if (result.reasoning && result.reasoning.length > 0) {
        setExpandedMessageId(newMsgId);
      }
    }, 800 + Math.random() * 500);
  };

  const simulateRecording = () => {
    setIsRecording(true);
    let mockText = "investing on which sector will be better for me";
    if (selectedLang === "hi-IN") mockText = "मुझे किस सेक्टर में निवेश करना चाहिए?";
    if (selectedLang === "mr-IN") mockText = "मी कोणत्या सेक्टर मध्ये गुंतवणूक करू?";
    setTranscript(`Simulated voice... ${mockText}`);
    simulationRef.current = setTimeout(() => {
      setIsRecording(false);
      handleSend(mockText, true);
    }, 2500);
  };

  const startRecording = () => {
    setMicError("");
    setTranscript("");
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError("Speech API unsupported. Using simulation mode...");
      simulateRecording();
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLang;
      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (e: any) => {
        let cur = "";
        for (let i = 0; i < e.results.length; i++) cur += e.results[i][0].transcript;
        setTranscript(cur);
      };
      recognition.onerror = (e: any) => {
        if (e.error === "network") {
          setMicError("Browser speech service unavailable. Falling back to simulation...");
          simulateRecording();
        } else if (e.error === "not-allowed") {
          setMicError("Mic access denied. Using simulation mode...");
          simulateRecording();
        } else if (e.error === "no-speech") {
          setMicError("No speech detected. Please try again.");
          setIsRecording(false);
        } else {
          setMicError(`Mic error (${e.error}). Using simulation mode...`);
          simulateRecording();
        }
      };
      recognition.onend = () => { if (!simulationRef.current) setIsRecording(false); };
      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setMicError("Failed to access mic. Using simulation mode...");
      simulateRecording();
    }
  };

  const stopRecording = () => {
    if (simulationRef.current) { clearTimeout(simulationRef.current); simulationRef.current = null; }
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch (e) {} }
    setIsRecording(false);
    let final = transcript.includes("Simulated voice...") ? transcript.replace("Simulated voice... ", "") : transcript;
    if (final.trim()) handleSend(final, true);
  };

  const toggleReasoning = (id: number) => {
    setExpandedMessageId(expandedMessageId === id ? null : id);
  };

  const suggestedPrompts = [
    "Where to invest?",
    "How to build emergency fund?",
    "Can I afford home loan EMI?",
    "ELSS tax saving 80C",
    "Is SGB safe gold investment?",
    "Security tips for bank scams"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] relative">
      {/* Header bar */}
      <div className="p-4 pb-2 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveTab("home")} className="p-2 bg-card rounded-full border border-border">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center border border-accent/30 relative shrink-0">
                <Bot className="w-6 h-6 text-accent" />
                <div className="absolute top-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-background" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Offline AI Advisor</h1>
                <p className="text-xs text-success">Secure Banking Advisor</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!isMuted && typeof window !== "undefined" && window.speechSynthesis) {
                  window.speechSynthesis.cancel();
                }
                setIsMuted(!isMuted);
              }}
              className={`p-2 bg-card rounded-full border border-border transition-colors ${!isMuted ? "text-primary border-primary/40" : "text-foreground/50"}`}
              title={isMuted ? "Unmute Voice output" : "Mute Voice output"}
            >
              {!isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <div className="flex items-center bg-secondary/50 rounded-full pl-2 pr-1 py-1 border border-border text-xs">
              <Globe className="w-3 h-3 text-foreground/50 mr-1 shrink-0" />
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="bg-transparent text-foreground/80 focus:outline-none cursor-pointer appearance-none outline-none max-w-[65px]"
              >
                {indianLanguages.map((l) => (
                  <option key={l.code} value={l.code} className="bg-card text-foreground">{l.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Messages layout */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-48">
        <div className="flex flex-col items-center justify-center py-4">
          <div className="w-20 h-20 relative mb-3">
            <div className={`absolute inset-0 bg-accent/20 rounded-full opacity-75 ${isRecording || isTyping ? "animate-ping" : ""}`} />
            <div className={`absolute inset-2 bg-accent/40 rounded-full ${isRecording || isTyping ? "animate-pulse" : ""}`} />
            <div className="absolute inset-3 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center shadow-lg shadow-accent/50 z-10">
              <Bot className="w-8 h-8 text-white" />
            </div>
          </div>
          <p className="text-foreground/60 text-xs">
            {isRecording ? "Listening to you..." : isTyping ? "Advisor is thinking..." : "End-to-End Encrypted"}
          </p>
        </div>

        <AnimatePresence>
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === "user" ? "bg-primary" : "bg-card border border-border"}`}>
                  {msg.sender === "user" ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-accent" />}
                </div>
                <div className={`p-3 rounded-2xl max-w-[80%] ${msg.sender === "user" ? "bg-primary text-white rounded-tr-sm" : "bg-secondary border border-border rounded-tl-sm text-foreground/90"}`}>
                  <div className="flex items-start gap-2">
                    {msg.isVoice && <Volume2 className="w-4 h-4 opacity-70 shrink-0 mt-0.5" />}
                    <p className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
                  </div>
                </div>
              </motion.div>

              {/* Show Reasoning toggle block for AI Responses */}
              {msg.sender === "ai" && msg.reasoning && (
                <div className="pl-11 pr-4">
                  <button
                    onClick={() => toggleReasoning(msg.id)}
                    className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-bold transition-all focus:outline-none"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{expandedMessageId === msg.id ? "Hide Advisor Reasoning" : "View Advisor Reasoning"}</span>
                    {expandedMessageId === msg.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <AnimatePresence>
                    {expandedMessageId === msg.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-2 bg-card border border-border/70 rounded-2xl p-3.5 space-y-3 shadow-inner"
                      >
                        <span className="text-[10px] text-primary/80 font-extrabold uppercase tracking-widest block">Reasoning Flow</span>
                        <div className="space-y-2">
                          {msg.reasoning.map((step, idx) => (
                            <div key={idx} className="border-l-2 border-primary/40 pl-2.5">
                              <h4 className="text-xs font-bold text-foreground/80">{step.title}</h4>
                              <p className="text-[11px] text-foreground/60 leading-relaxed mt-0.5">{step.detail}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-accent" />
            </div>
            <div className="bg-secondary border border-border p-3 rounded-2xl rounded-tl-sm flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce delay-75" />
              <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce delay-150" />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input container */}
      <div className="absolute bottom-16 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-border/50 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
        {!isRecording && messages.length === 1 && (
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none">
            {suggestedPrompts.map((p, i) => (
              <button key={i} onClick={() => handleSend(p)} className="whitespace-nowrap px-4 py-2 bg-card border border-border rounded-full text-xs hover:border-primary/50 transition-colors shrink-0">
                {p}
              </button>
            ))}
          </div>
        )}
        {micError && (
          <div className="mb-3 px-4 py-2 bg-warning/10 border border-warning/30 rounded-lg flex items-center gap-2 text-warning text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{micError}</p>
          </div>
        )}
        {isRecording ? (
          <div className="flex flex-col gap-3">
            <div className="bg-secondary/30 border border-border rounded-xl p-3 min-h-12 max-h-24 overflow-y-auto">
              <p className="text-sm text-foreground/80 italic">
                {transcript || `Speak now in ${indianLanguages.find((l) => l.code === selectedLang)?.name}...`}
              </p>
            </div>
            <div className="flex items-center justify-between bg-danger/10 border border-danger/30 rounded-full py-2 px-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-danger rounded-full animate-pulse" />
                <span className="text-foreground/70 text-sm font-medium">Recording...</span>
              </div>
              <button onClick={stopRecording} className="w-10 h-10 bg-danger rounded-full flex items-center justify-center text-white hover:bg-danger/90 transition-colors">
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              value={advisorInput}
              onChange={(e) => setAdvisorInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend(advisorInput)}
              placeholder="Ask or say something..."
              className="w-full bg-secondary/50 border border-border rounded-full py-3 pl-4 pr-24 focus:outline-none focus:border-primary/50 text-sm"
            />
            <div className="absolute right-1 top-1 flex gap-1">
              <button onClick={startRecording} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-card transition-colors group">
                <Mic className="w-5 h-5 text-foreground/60 group-hover:text-danger transition-colors" />
              </button>
              <button onClick={() => handleSend(advisorInput)} disabled={!advisorInput.trim()} className="w-10 h-10 bg-gradient-to-tr from-primary to-accent rounded-full flex items-center justify-center text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
