"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Volume2, VolumeX, X, Mic, Send, ThumbsUp, ThumbsDown, Keyboard } from "lucide-react";
import { matchAdvisorQuery } from "@/lib/advisorDatabase";
import { logEvent } from "@/lib/auditLogger";

interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
}

interface VoiceAvatarOverlayProps {
  onClose: () => void;
}

export default function VoiceAvatarOverlay({ onClose }: VoiceAvatarOverlayProps) {
  const [currentMessage, setCurrentMessage] = useState<Message>({ id: 1, text: "Hello! I am your AI Wealth Advisor. How can I assist you with your finances today?", sender: "ai" });
  const [avatarInput, setAvatarInput] = useState("");
  const [avatarIsTyping, setAvatarIsTyping] = useState(false);
  const [avatarMuted, setAvatarMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [ratedMessages, setRatedMessages] = useState<Record<number, "up" | "down">>({});

  // Stop speech when overlay unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakResponse = (text: string) => {
    if (avatarMuted || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendAvatarMessage = (text: string) => {
    if (!text.trim()) return;
    
    setCurrentMessage({ id: Date.now(), text, sender: "user" });
    setAvatarInput("");
    setShowKeyboard(false);
    setAvatarIsTyping(true);
    setIsSpeaking(false);

    setTimeout(() => {
      // Mock history for advisor DB
      const result = matchAdvisorQuery(text, "en-IN", [{ text, sender: "user" }]);
      
      setCurrentMessage({ id: Date.now() + 1, text: result.answer, sender: "ai" });
      setAvatarIsTyping(false);
      speakResponse(result.answer);
    }, 1500);
  };

  const handleRateMessage = (id: number, type: "up" | "down") => {
    setRatedMessages((prev) => ({ ...prev, [id]: type }));
    logEvent(
      "client_user",
      "client",
      "AI_FEEDBACK",
      `User rated response as ${type === "up" ? "helpful" : "unhelpful"}`
    );
  };

  const handleMicSimulate = () => {
    if (isListening) return;
    setIsListening(true);
    setIsSpeaking(false);
    setCurrentMessage({ id: Date.now(), text: "Listening...", sender: "user" });

    setTimeout(() => {
      setIsListening(false);
      handleSendAvatarMessage("Analyze my monthly budget spending");
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-background/90 backdrop-blur-xl" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full h-full md:max-w-md md:h-[85vh] bg-slate-900 md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dynamic Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[50%] bg-primary/20 rounded-full blur-[100px] mix-blend-screen" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-accent/20 rounded-full blur-[100px] mix-blend-screen" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 relative z-10">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="font-bold text-sm text-white tracking-wide">IDBI Assistant</h3>
              <p className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" /> 
                Live Session
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
                setAvatarMuted(!avatarMuted);
                setIsSpeaking(false);
              }}
              className={`w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 backdrop-blur border border-white/10 transition-colors ${!avatarMuted ? "text-primary" : "text-white/40"}`}
            >
              {!avatarMuted ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button
              onClick={() => {
                if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
                setIsSpeaking(false);
                onClose();
              }}
              className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 backdrop-blur border border-white/10 rounded-full transition-colors text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Central Avatar Visual (Video Call Style) */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
          <div className={`relative w-48 h-48 md:w-56 md:h-56 rounded-full p-1 bg-gradient-to-tr from-primary to-accent transition-all duration-700 ${
            isSpeaking ? "scale-[1.02] shadow-[0_0_60px_rgba(13,148,136,0.4)]" : "shadow-[0_0_30px_rgba(13,148,136,0.1)]"
          }`}>
            {isListening && (
              <span className="absolute inset-[-20px] rounded-full border border-primary/30 animate-ping" style={{ animationDuration: '2s' }} />
            )}
            
            <div className="w-full h-full bg-slate-900 rounded-full overflow-hidden flex items-center justify-center relative">
              <img
                src="/images/avatar.png"
                alt="AI Agent Avatar"
                className={`w-full h-full object-cover scale-110 transition-transform duration-500 ${isSpeaking ? "scale-125" : ""}`}
              />
              {isSpeaking && (
                <div className="absolute inset-0 bg-primary/10 mix-blend-overlay animate-pulse" />
              )}
            </div>
          </div>

          {/* AI Voice Visualizer */}
          <div className="h-12 flex items-center justify-center gap-1.5 mt-8 mb-4">
            {isSpeaking ? (
              [1, 2, 3, 4, 5, 6, 7, 8, 9].map((bar) => {
                const heights = ['h-3', 'h-6', 'h-10', 'h-5', 'h-8', 'h-4', 'h-9', 'h-3', 'h-5'];
                return (
                  <div
                    key={bar}
                    className="w-1.5 bg-primary rounded-full animate-pulse"
                    style={{
                      height: heights[bar - 1],
                      animationDelay: `${bar * 50}ms`,
                      animationDuration: '400ms'
                    }}
                  />
                );
              })
            ) : (
              <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="w-1/3 h-full bg-primary/50 mx-auto rounded-full" />
              </div>
            )}
          </div>

          {/* Dialogue Text */}
          <div className="text-center w-full max-w-sm px-4">
            <p className="text-[10px] text-primary uppercase tracking-widest font-extrabold mb-3">
              {isListening ? "Listening..." : isSpeaking ? "Speaking" : avatarIsTyping ? "Thinking..." : "AI Advisor"}
            </p>
            <motion.p 
              key={currentMessage.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-lg md:text-xl font-medium leading-relaxed ${currentMessage.sender === 'user' ? 'text-white/60 italic' : 'text-white'}`}
            >
              "{currentMessage.text}"
            </motion.p>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 relative z-10 flex flex-col items-center gap-6 pb-8 md:pb-6">
          <div className="flex justify-center gap-8 w-full items-center">
            <button 
              onClick={() => setShowKeyboard(!showKeyboard)}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Keyboard className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleMicSimulate}
              disabled={isListening || isSpeaking}
              className={`w-20 h-20 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                isListening
                  ? "bg-rose-500 border-rose-400 text-white shadow-[0_0_30px_rgba(244,63,94,0.6)] scale-110"
                  : "bg-primary border-primary/50 text-white hover:bg-primary/90 hover:scale-105 shadow-[0_0_20px_rgba(13,148,136,0.4)]"
              }`}
            >
              <Mic className={`w-8 h-8 ${isListening ? "animate-pulse" : ""}`} />
            </button>

            <div className="w-12 h-12 flex items-center justify-center">
               {/* Spacer for centering mic */}
            </div>
          </div>

          {/* Conditional Keyboard Input */}
          <AnimatePresence>
            {showKeyboard && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="w-full relative flex items-center"
              >
                <input
                  type="text"
                  value={avatarInput}
                  onChange={(e) => setAvatarInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendAvatarMessage(avatarInput)}
                  placeholder="Type your question..."
                  className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-full py-4 pl-6 pr-14 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-white placeholder:text-white/40 font-medium shadow-inner"
                />
                <button
                  onClick={() => handleSendAvatarMessage(avatarInput)}
                  disabled={!avatarInput.trim()}
                  className="absolute right-2 top-2 bottom-2 w-10 bg-primary rounded-full flex items-center justify-center text-white disabled:opacity-50 hover:bg-primary/90 transition-colors"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
