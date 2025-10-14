import { Brain } from "lucide-react";
import { useState, useEffect } from "react";

interface CoachOrbProps {
  onOpen: () => void;
}

export default function CoachOrb({ onOpen }: CoachOrbProps) {
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        onOpen();
      }
    };

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [onOpen]);

  return (
    <button
      onClick={onOpen}
      className="fixed bottom-8 right-8 w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-teal to-accent-teal-alt shadow-[0_8px_32px_rgba(18,175,203,0.4)] hover:shadow-[0_12px_48px_rgba(18,175,203,0.5)] hover:scale-110 active:scale-95 transition-all z-30 flex items-center justify-center group"
      style={{
        animation: "glow-pulse 2s ease-in-out infinite",
      }}
      aria-label="Open AI Coach (⌘/)"
    >
      <Brain className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
