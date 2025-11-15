import { Mic, Sparkles, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { AudioRecorder, blobToBase64 } from "@/utils/audioRecorder";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AIChatCenter() {
  const [chatMode, setChatMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to use the AI chat.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`;
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          messages: [...messages, userMessage]
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: "Rate limit exceeded",
            description: "Please try again in a moment.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        if (response.status === 402) {
          toast({
            title: "Payment required",
            description: "Please add credits to continue.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        throw new Error("Failed to get AI response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      if (!reader) throw new Error("No response body");

      console.log("Starting stream read...");
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      let textBuffer = "";
      let streamDone = false;
      let chunkCount = 0;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) {
          console.log("Stream complete. Total chunks:", chunkCount);
          break;
        }

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            console.log("Received [DONE] signal");
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              chunkCount++;
              assistantMessage += content;
              console.log("Chunk", chunkCount, ":", content);
              setMessages((prev) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage?.role === "assistant") {
                  lastMessage.content = assistantMessage;
                }
                return newMessages;
              });
            }
          } catch (parseError) {
            console.error("Parse error:", parseError, "Line:", line);
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
      
      console.log("Final assistant message:", assistantMessage);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: "Failed to get response from AI coach.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendWithMessage = (message: string) => {
    setChatMode(true);
    setTimeout(() => sendMessage(message), 100);
  };

  const handleBackToPreview = () => {
    setChatMode(false);
    setMessages([]);
    setInput("");
  };

  const handleVoiceRecord = async () => {
    if (isRecording) {
      // Stop recording
      try {
        setIsRecording(false);
        const audioBlob = await audioRecorderRef.current?.stop();
        
        if (!audioBlob) {
          throw new Error('No audio recorded');
        }

        toast({
          title: "Processing audio...",
          description: "Converting speech to text",
        });

        // Convert to base64
        const base64Audio = await blobToBase64(audioBlob);

        // Send to edge function
        const { data, error } = await supabase.functions.invoke('voice-to-text', {
          body: { audio: base64Audio }
        });

        if (error) throw error;

        if (data?.text) {
          setInput(data.text);
        }

      } catch (error) {
        console.error('Error processing audio:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to process audio",
          variant: "destructive",
        });
      }
    } else {
      // Start recording
      try {
        setChatMode(true);
        setIsRecording(true);
        audioRecorderRef.current = new AudioRecorder();
        await audioRecorderRef.current.start();
        
        toast({
          title: "Recording started",
          description: "Speak now...",
        });
      } catch (error) {
        console.error('Error starting recording:', error);
        setIsRecording(false);
        toast({
          title: "Error",
          description: "Failed to access microphone",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="rounded-[32px] bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl border border-[#12AFCB]/20 p-4 sm:p-8 shadow-[0_4px_12px_rgba(18,175,203,0.15)] hover:shadow-[0_8px_24px_rgba(18,175,203,0.2)] transition-all duration-300 animate-fade-in flex flex-col h-full">
      {/* AI Icon */}
      <div className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#12AFCB] to-[#19D0E4] flex items-center justify-center shadow-[0_4px_12px_rgba(18,175,203,0.3)]">
          <Sparkles className="w-6 h-6 text-white animate-pulse" />
        </div>
        <div className="flex-1">
          <h3 className="font-rounded text-2xl font-bold text-[#0E1012]">Eywa AI</h3>
          <p className="text-sm text-[#5A6B7F]">Your health companion</p>
        </div>
        {chatMode && (
          <button 
            onClick={handleBackToPreview}
            className="w-10 h-10 rounded-xl bg-white/60 hover:bg-white/80 flex items-center justify-center transition-all duration-200"
          >
            <X className="w-5 h-5 text-[#5A6B7F]" />
          </button>
        )}
      </div>

      {!chatMode ? (
        <>
          {/* Scrollable content area - fills remaining space */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* AI Message */}
            <div className="mb-8 space-y-4">
            <div className="relative rounded-2xl bg-gradient-to-br from-[#E8FAFD] to-[#C8FAFF] p-4 sm:p-8 border border-[#12AFCB]/10 shadow-md hover:shadow-lg transition-shadow duration-300 animate-fade-in">
              {/* New insight badge */}
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#12AFCB]/10 text-xs font-medium text-[#12AFCB]">
                  <Sparkles className="w-3 h-3" />
                  New insight
                </span>
              </div>
              
              {/* Eywa avatar and message */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-[#333333]">Eywa AI</span>
                    <span className="text-xs text-[#5A6B7F]">Just now</span>
                  </div>
                  <p className="text-base sm:text-lg leading-relaxed text-[#333333] font-medium">
                    Today I see your stress level decreased and your sleep improved by 9%. Would you like me to show detailed progress?
                  </p>
                </div>
              </div>
            </div>
            
            {/* Action Button - aligned right */}
            <div className="flex justify-end">
              <Button 
                onClick={() => handleSendWithMessage("Show me detailed progress on my stress level and sleep improvements")}
                className="rounded-2xl bg-[#12AFCB] hover:bg-[#19D0E4] text-white px-8 py-6 text-base font-semibold shadow-[0_4px_12px_rgba(18,175,203,0.3)] hover:shadow-[0_8px_20px_rgba(18,175,203,0.4)] hover:scale-[1.02] transition-all duration-200"
              >
                Yes, show me
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3 flex-shrink-0">
            <p className="text-xs text-[#5A6B7F] font-medium uppercase tracking-wide">Quick Actions</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in" style={{ animationDelay: '150ms' }}>
              <button 
                onClick={() => handleSendWithMessage("Show me my overall health progress and trends")}
                className="rounded-xl bg-white/60 hover:bg-white/80 border border-[#12AFCB]/10 p-4 text-sm text-[#0E1012] font-medium hover:scale-105 hover:shadow-lg transition-all duration-200"
              >
                📊 View Progress
              </button>
              <button 
                onClick={() => handleSendWithMessage("Give me a detailed sleep analysis and recommendations")}
                className="rounded-xl bg-white/60 hover:bg-white/80 border border-[#12AFCB]/10 p-4 text-sm text-[#0E1012] font-medium hover:scale-105 hover:shadow-lg transition-all duration-200"
              >
                💤 Sleep Analysis
              </button>
              <button 
                onClick={() => handleSendWithMessage("What nutrition tips do you have for me based on my health data?")}
                className="rounded-xl bg-white/60 hover:bg-white/80 border border-[#12AFCB]/10 p-4 text-sm text-[#0E1012] font-medium hover:scale-105 hover:shadow-lg transition-all duration-200"
              >
                🍎 Nutrition Tips
              </button>
              <button 
                onClick={() => handleSendWithMessage("Give me personalized stress relief techniques and recommendations")}
                className="rounded-xl bg-white/60 hover:bg-white/80 border border-[#12AFCB]/10 p-4 text-sm text-[#0E1012] font-medium hover:scale-105 hover:shadow-lg transition-all duration-200"
              >
                🧘 Stress Relief
              </button>
            </div>
          </div>
          </div>

          {/* Chat Input at Very Bottom */}
          <div className="mt-auto pt-6 flex-shrink-0">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim()) {
                      setChatMode(true);
                      setTimeout(() => sendMessage(), 100);
                    }
                  }
                }}
                placeholder={isRecording ? "Listening..." : "Ask me anything..."}
                disabled={isRecording}
                className="flex-1 px-4 py-3 rounded-xl border border-[#12AFCB]/20 bg-white/60 focus:bg-white focus:border-[#12AFCB] focus:outline-none focus:ring-2 focus:ring-[#12AFCB]/20 text-sm transition-all duration-200 disabled:opacity-50"
              />
              <button 
                onClick={() => {
                  if (input.trim()) {
                    setChatMode(true);
                    setTimeout(() => sendMessage(), 100);
                  }
                }}
                disabled={!input.trim() || isRecording}
                className={`flex items-center justify-center w-[52px] h-[44px] rounded-xl bg-[#12AFCB] hover:bg-[#19D0E4] text-white font-medium text-sm disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-[0_4px_12px_rgba(18,175,203,0.3)]`}
              >
                <Send className="w-4 h-4" />
              </button>
              <button
                onClick={handleVoiceRecord}
                className={`flex items-center justify-center w-[52px] h-[44px] rounded-xl ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-[#12AFCB] hover:bg-[#19D0E4]'
                } text-white font-medium text-sm transition-all duration-200 hover:scale-105 shadow-[0_4px_12px_rgba(18,175,203,0.3)]`}
              >
                <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse' : ''}`} />
              </button>
            </div>

            {/* Activity Indicator below input */}
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#5A6B7F]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Based on your last 14 days</span>
              <span className="text-[#12AFCB]/40">•</span>
              <span>Analyzed 3 minutes ago</span>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Chat Mode */}
          <div className="flex-1 mb-4 overflow-y-auto space-y-4 min-h-0">
            {messages.map((msg, idx) => (
              <div key={idx} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
                <div className={`inline-block rounded-2xl p-4 max-w-[80%] ${
                  msg.role === 'user' 
                    ? 'bg-[#12AFCB] text-white' 
                    : 'bg-gradient-to-br from-[#E8FAFD] to-[#C8FAFF] text-[#333333]'
                }`}>
                  <p className="text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="text-center">
                <div className="inline-block rounded-2xl bg-gradient-to-br from-[#E8FAFD] to-[#C8FAFF] px-6 py-3">
                  <p className="text-[#5A6B7F] text-sm">Thinking...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area at very bottom */}
          <div className="pt-4 border-t border-[#12AFCB]/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim() && !isLoading) {
                      sendMessage();
                    }
                  }
                }}
                placeholder={isRecording ? "Listening..." : "Type your message..."}
                disabled={isRecording || isLoading}
                className="flex-1 px-4 py-3 rounded-xl border border-[#12AFCB]/20 bg-white/60 focus:bg-white focus:border-[#12AFCB] focus:outline-none focus:ring-2 focus:ring-[#12AFCB]/20 text-sm transition-all duration-200 disabled:opacity-50"
              />
              <button 
                onClick={() => sendMessage()}
                disabled={isLoading || !input.trim() || isRecording}
                className="flex items-center justify-center w-[52px] h-[44px] rounded-xl bg-[#12AFCB] hover:bg-[#19D0E4] text-white font-medium text-sm disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-[0_4px_12px_rgba(18,175,203,0.3)]"
              >
                <Send className="w-4 h-4" />
              </button>
              <button
                onClick={handleVoiceRecord}
                className={`flex items-center justify-center w-[52px] h-[44px] rounded-xl ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-[#12AFCB] hover:bg-[#19D0E4]'
                } text-white font-medium text-sm transition-all duration-200 hover:scale-105 shadow-[0_4px_12px_rgba(18,175,203,0.3)]`}
              >
                <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse' : ''}`} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
