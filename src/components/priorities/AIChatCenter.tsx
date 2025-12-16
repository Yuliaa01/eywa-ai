import { Mic, Sparkles, X, Send, Paperclip, Image as ImageIcon, Camera, TrendingUp, Moon, Apple, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { AudioRecorder, blobToBase64 } from "@/utils/audioRecorder";
import { supabase } from "@/integrations/supabase/client";
import eywaAvatar from "@/assets/eywa-avatar.png";
interface Message {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}
export function AIChatCenter() {
  const [chatMode, setChatMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [dailyInsight, setDailyInsight] = useState<string>("");
  const [insightLoading, setInsightLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  useEffect(() => {
    const loadUserDataAndInsight = async () => {
      try {
        setInsightLoading(true);
        const {
          data: {
            session
          }
        } = await supabase.auth.getSession();
        if (!session) return;

        // Load user profile for name
        const {
          data: profile
        } = await supabase.from('user_profiles').select('first_name').eq('user_id', session.user.id).maybeSingle();
        if (profile?.first_name) {
          setUserName(profile.first_name);
        }
        const {
          data,
          error
        } = await supabase.functions.invoke('generate-daily-insight', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        if (error) throw error;
        if (data?.insight?.summary) {
          setDailyInsight(data.insight.summary);
        }
      } catch (error) {
        console.error('Error loading daily insight:', error);
        setDailyInsight("Your new insight suggests adjusting your Omega-3 intake for long-term cognitive health. How would you like to proceed?");
      } finally {
        setInsightLoading(false);
      }
    };
    loadUserDataAndInsight();
  }, []);

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        setNotificationsEnabled(permission === 'granted');
      });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  // Subscribe to new insights via Realtime
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const channel = supabase.channel('ai-insights-changes').on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ai_insights',
        filter: `user_id=eq.${user.id}`
      }, payload => {
        console.log('New insight received:', payload);
        const newInsight = payload.new;

        // Update the daily insight
        if (newInsight.kind === 'education' && newInsight.summary) {
          setDailyInsight(newInsight.summary);

          // Show toast notification
          toast({
            title: "✨ New Daily Insight Ready!",
            description: newInsight.summary.substring(0, 100) + "...",
            duration: 5000
          });

          // Show browser notification if enabled
          if (notificationsEnabled) {
            new Notification("EYWA AI - New Insight", {
              body: newInsight.summary.substring(0, 100) + "...",
              icon: "/favicon.ico",
              badge: "/favicon.ico"
            });
          }
        }
      }).subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    };
    setupRealtimeSubscription();
  }, [notificationsEnabled]);
  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend && !selectedImage || isLoading) return;

    // Prepare message content
    let messageContent: string | any[] = textToSend;

    // If there's an image, format as multimodal content
    if (selectedImage && imagePreview) {
      messageContent = [{
        type: "text",
        text: textToSend || "Please analyze this image."
      }, {
        type: "image_url",
        image_url: {
          url: imagePreview
        }
      }];
    }
    const userMessage: Message = {
      role: "user",
      content: typeof messageContent === 'string' ? messageContent : textToSend,
      imageUrl: imagePreview || undefined
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsLoading(true);
    try {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to use the AI chat.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`;
      // Prepare the actual message to send (with multimodal content if image exists)
      const messageToSend = {
        role: "user",
        content: messageContent
      };
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          messages: [...messages, messageToSend]
        })
      });
      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: "Rate limit exceeded",
            description: "Please try again in a moment.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
        if (response.status === 402) {
          toast({
            title: "Payment required",
            description: "Please add credits to continue.",
            variant: "destructive"
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
      setMessages(prev => [...prev, {
        role: "assistant",
        content: ""
      }]);
      let textBuffer = "";
      let streamDone = false;
      let chunkCount = 0;
      while (!streamDone) {
        const {
          done,
          value
        } = await reader.read();
        if (done) {
          console.log("Stream complete. Total chunks:", chunkCount);
          break;
        }
        textBuffer += decoder.decode(value, {
          stream: true
        });
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
              setMessages(prev => {
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
        variant: "destructive"
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
    setSelectedImage(null);
    setImagePreview(null);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive"
      });
    }
  };
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
          description: "Converting speech to text"
        });

        // Convert to base64
        const base64Audio = await blobToBase64(audioBlob);

        // Send to edge function
        const {
          data,
          error
        } = await supabase.functions.invoke('voice-to-text', {
          body: {
            audio: base64Audio
          }
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
          variant: "destructive"
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
          description: "Speak now..."
        });
      } catch (error) {
        console.error('Error starting recording:', error);
        setIsRecording(false);
        toast({
          title: "Error",
          description: "Failed to access microphone",
          variant: "destructive"
        });
      }
    }
  };
  return <div className="rounded-[32px] bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl border border-[#12AFCB]/20 p-4 sm:p-8 animate-fade-in flex flex-col h-full">
      {/* AI Icon */}
      <div className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#12AFCB] to-[#19D0E4] flex items-center justify-center shadow-[0_4px_12px_rgba(18,175,203,0.3)]">
          <Sparkles className="w-6 h-6 text-white animate-pulse" />
        </div>
        <div className="flex-1">
          <h3 className="font-rounded text-2xl font-bold text-[#0E1012]">EYWA AI</h3>
          <p className="text-sm text-[#5A6B7F]">Your health companion</p>
        </div>
        {chatMode && <button onClick={handleBackToPreview} className="w-10 h-10 rounded-xl bg-white/60 hover:bg-white/80 flex items-center justify-center transition-all duration-200">
            <X className="w-5 h-5 text-[#5A6B7F]" />
          </button>}
      </div>

      {!chatMode ? <>
          {/* Scrollable content area - fills remaining space */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* AI Message */}
            <div className="mb-8 space-y-4">
            <div className="relative rounded-2xl bg-gradient-to-br from-[#E8FAFD] to-[#C8FAFF] p-4 sm:p-8 border border-[#12AFCB]/10 shadow-md hover:shadow-lg transition-shadow duration-300 animate-fade-in">
              {/* New insight badge with prominent glow */}
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#12AFCB]/20 text-xs font-semibold text-[#12AFCB] shadow-[0_0_20px_rgba(18,175,203,0.4)] animate-glow-pulse">
                  <Sparkles className="w-3 h-3" />
                  New insight
                </span>
              </div>
              
              {/* Eywa avatar and message */}
              <div className="flex gap-4 mt-3 items-start">
                {/* AI Avatar */}
                <div className="flex-shrink-0 relative">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#12AFCB]/30 shadow-[0_0_30px_rgba(18,175,203,0.3)] animate-glow-pulse">
                    <img src={eywaAvatar} alt="EYWA AI" className="w-full h-full object-cover" />
                  </div>
                  {/* Glow effect around avatar */}
                  <div className="absolute inset-0 rounded-full bg-gradient-radial from-[#12AFCB]/20 to-transparent animate-pulse" />
                </div>
                
                {/* Message content */}
                <div className="flex-1 relative">
                  {insightLoading ? <div className="space-y-2">
                      <div className="h-4 bg-[#12AFCB]/10 rounded animate-pulse w-full"></div>
                      <div className="h-4 bg-[#12AFCB]/10 rounded animate-pulse w-3/4"></div>
                    </div> : <p className="text-base sm:text-lg leading-relaxed text-[#333333] font-medium pb-6">
                      {dailyInsight}
                    </p>}
                  <span className="absolute -bottom-1 right-0 text-xs text-[#5A6B7F]/50">Just now</span>
                </div>
              </div>
            </div>
            
            {/* Action Button - aligned right */}
            <div className="flex justify-end">
              <Button onClick={() => handleSendWithMessage("Show me detailed progress on my stress level and sleep improvements")} className="rounded-2xl bg-[#12AFCB] hover:bg-[#19D0E4] text-white px-8 py-6 text-base font-semibold shadow-[0_4px_12px_rgba(18,175,203,0.3)] hover:shadow-[0_8px_20px_rgba(18,175,203,0.4)] hover:scale-[1.02] transition-all duration-200">
                Yes, show me
              </Button>
            </div>
          </div>
          </div>

          {/* Quick Actions + Input - Fixed at bottom */}
          <div className="mt-auto pt-4 flex-shrink-0 space-y-3">
            {/* Quick Actions */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {[
                { icon: TrendingUp, title: "Progress", color: "#22C55E", message: "Show me my overall health progress and trends" },
                { icon: Moon, title: "Sleep", color: "#8B5CF6", message: "Give me a detailed sleep analysis and recommendations" },
                { icon: Apple, title: "Nutrition", color: "#F59E0B", message: "What nutrition tips do you have for me based on my health data?" },
                { icon: Heart, title: "Stress", color: "#EC4899", message: "Give me personalized stress relief techniques and recommendations" }
              ].map((action) => (
                <button 
                  key={action.title}
                  onClick={() => handleSendWithMessage(action.message)} 
                  className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-[#12AFCB]/10 hover:border-[#12AFCB]/30 hover:shadow-[0_4px_20px_rgba(18,175,203,0.15)] hover:scale-[1.02] transition-all duration-200"
                >
                  <div 
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${action.color}15` }}
                  >
                    <action.icon className="w-3.5 h-3.5" style={{ color: action.color }} />
                  </div>
                  <span className="text-xs font-semibold text-[#0E1012]">{action.title}</span>
                </button>
              ))}
            </div>

            {/* Image Preview */}
            {imagePreview && <div className="relative inline-block">
                <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg border-2 border-[#12AFCB]/20" />
                <button onClick={handleRemoveImage} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>}
            
            {/* Input Row */}
            <div className="flex items-center gap-3">
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" capture className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} disabled={isRecording} className="flex items-center justify-center w-[44px] h-[44px] rounded-xl bg-white/60 hover:bg-white/80 border border-[#12AFCB]/20 text-[#12AFCB] disabled:opacity-50 transition-all duration-200 hover:scale-105" title="Take photo or choose from gallery">
                <Camera className="w-4 h-4" />
              </button>
              <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (input.trim() || selectedImage) {
                setChatMode(true);
                setTimeout(() => sendMessage(), 100);
              }
            }
          }} placeholder={isRecording ? "Listening..." : "Ask me anything..."} disabled={isRecording} className="flex-1 px-4 py-3 rounded-xl border border-[#12AFCB]/20 bg-white/60 focus:bg-white focus:border-[#12AFCB] focus:outline-none focus:ring-2 focus:ring-[#12AFCB]/20 text-sm transition-all duration-200 disabled:opacity-50" />
              <button onClick={() => {
            if (input.trim() || selectedImage) {
              setChatMode(true);
              setTimeout(() => sendMessage(), 100);
            }
          }} disabled={!input.trim() && !selectedImage || isRecording} className={`flex items-center justify-center w-[52px] h-[44px] rounded-xl bg-[#12AFCB] hover:bg-[#19D0E4] text-white font-medium text-sm disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-[0_4px_12px_rgba(18,175,203,0.3)]`}>
                <Send className="w-4 h-4" />
              </button>
              <button onClick={handleVoiceRecord} className={`flex items-center justify-center w-[52px] h-[44px] rounded-xl ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-[#12AFCB] hover:bg-[#19D0E4]'} text-white font-medium text-sm transition-all duration-200 hover:scale-105 shadow-[0_4px_12px_rgba(18,175,203,0.3)]`}>
                <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse' : ''}`} />
              </button>
            </div>

            {/* Activity Indicator */}
            <div className="flex items-center justify-center gap-2 text-xs text-[#5A6B7F]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Based on your last 14 days</span>
              <span className="text-[#12AFCB]/40">•</span>
              <span>Analyzed 3 minutes ago</span>
            </div>
          </div>
        </> : <>
          {/* Chat Mode */}
          <div className="flex-1 mb-4 overflow-y-auto space-y-4 min-h-0">
            {messages.map((msg, idx) => <div key={idx} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
                {msg.imageUrl && (
                  <img 
                    src={msg.imageUrl} 
                    alt="Attached" 
                    className="inline-block max-w-[80%] h-auto rounded-2xl mb-2"
                  />
                )}
                {msg.content && msg.content !== "Please analyze this image." && (
                  <div className={`inline-block rounded-2xl overflow-hidden max-w-[80%] ${msg.role === 'user' ? 'bg-[#12AFCB] text-white' : 'bg-gradient-to-br from-[#E8FAFD] to-[#C8FAFF] text-[#333333]'}`}>
                    <p className="text-base leading-relaxed whitespace-pre-wrap p-4">{msg.content}</p>
                  </div>
                )}
              </div>)}
            {isLoading && <div className="text-center">
                <div className="inline-block rounded-2xl bg-gradient-to-br from-[#E8FAFD] to-[#C8FAFF] px-6 py-3">
                  <p className="text-[#5A6B7F] text-sm">Thinking...</p>
                </div>
              </div>}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area at very bottom */}
          <div className="pt-4 border-t border-[#12AFCB]/10 flex-shrink-0">
            {/* Image Preview */}
            {imagePreview && <div className="mb-3 relative inline-block">
                <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg border-2 border-[#12AFCB]/20" />
                <button onClick={handleRemoveImage} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>}
            <div className="flex items-center gap-3">
              <button onClick={() => fileInputRef.current?.click()} disabled={isRecording || isLoading} className="flex items-center justify-center w-[44px] h-[44px] rounded-xl bg-white/60 hover:bg-white/80 border border-[#12AFCB]/20 text-[#12AFCB] disabled:opacity-50 transition-all duration-200 hover:scale-105" title="Take photo or choose from gallery">
                <Camera className="w-4 h-4" />
              </button>
              <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if ((input.trim() || selectedImage) && !isLoading) {
                sendMessage();
              }
            }
          }} placeholder={isRecording ? "Listening..." : "Type your message..."} disabled={isRecording || isLoading} className="flex-1 px-4 py-3 rounded-xl border border-[#12AFCB]/20 bg-white/60 focus:bg-white focus:border-[#12AFCB] focus:outline-none focus:ring-2 focus:ring-[#12AFCB]/20 text-sm transition-all duration-200 disabled:opacity-50" />
              <button onClick={() => sendMessage()} disabled={isLoading || !input.trim() && !selectedImage || isRecording} className="flex items-center justify-center w-[52px] h-[44px] rounded-xl bg-[#12AFCB] hover:bg-[#19D0E4] text-white font-medium text-sm disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-[0_4px_12px_rgba(18,175,203,0.3)]">
                <Send className="w-4 h-4" />
              </button>
              <button onClick={handleVoiceRecord} className={`flex items-center justify-center w-[52px] h-[44px] rounded-xl ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-[#12AFCB] hover:bg-[#19D0E4]'} text-white font-medium text-sm transition-all duration-200 hover:scale-105 shadow-[0_4px_12px_rgba(18,175,203,0.3)]`}>
                <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse' : ''}`} />
              </button>
            </div>
          </div>
        </>}
    </div>;
}