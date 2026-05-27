import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, StudentLevel } from '../types';
import { VoiceTutor } from './VoiceSynthesisHelper';
import { Send, Volume2, Mic, MicOff, MessageSquare, Trash2, ArrowRight, User, Sparkles, CheckCircle, Smartphone } from 'lucide-react';

interface ChatroomProps {
  level: StudentLevel;
}

export default function Chatroom({ level }: ChatroomProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  
  // Mic speech transcription states
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  // Active voice speaker tracking
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Inject first greeting from Basim on construct
    if (messages.length === 0) {
      greetStudent();
    }
  }, [level]);

  useEffect(() => {
    // Auto scroll conversations
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      // Cleanup dismount speak synthesis
      VoiceTutor.stop();
      if (recognitionInstance) {
        recognitionInstance.abort();
      }
    };
  }, []);

  const greetStudent = () => {
    const greeting = getLevelGreeting(level);
    setMessages([
      {
        id: 'greet_msg',
        sender: 'ai',
        text: greeting.en,
        translationAr: greeting.ar,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const getLevelGreeting = (lvl: StudentLevel) => {
    switch (lvl) {
      case 'Beginner':
        return {
          en: "Hello, my friend! I am Mr. Basim, your English tutor. Let's practice simple conversation. How are you today? Where are you from?",
          ar: "أهلاً بك يا صديقي! أنا الأستاذ باسم، معلمك للغة الإنجليزية. دعنا نمارس محادثة بسيطة معاً. كيف حالك اليوم؟ ومن أي بلد أنت؟"
        };
      case 'Intermediate':
        return {
          en: "Welcome back! I am excited to practice dialogue together. Let's talk about our hobbies, traveling, or professional plans. What do you like to do in your free time?",
          ar: "مرحباً بعودتك! أنا متحمس لممارسة المحادثة معاً اليوم. دعنا نتحدث عن الهوايات، السفر، أو تطلعاتك المهنية. ماذا تحب أن تفعل في وقت فراغك؟"
        };
      case 'Advanced':
        return {
          en: "Greetings. Let's delve into advanced daily dialogues and situational scenarios. Tell me, what do you think is the biggest challenge when communicating in business settings dynamically? Feel free to speak at length.",
          ar: "تحياتي لك. دعنا نتعمق في الحوارات اليومية والمواقف المهنية المتقدمة. أخبرني، ما هو التحدي الأكبر برأيك عند التواصل في بيئات العمل بشكل تفاعلي؟ تحدث بفيض كما تحب."
        };
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || inputText;
    if (!messageText.trim() || sending) return;

    // Add user message to display chat history
    const userMsgId = 'user_' + Date.now();
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputText('');
    setSending(true);

    try {
      const chatPayload = [...messages, newUserMsg];
      const response = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: chatPayload,
          userLevel: level,
        }),
      });

      const data = await response.json();

      const aiMsgId = 'ai_' + Date.now();
      const newAiMsg: ChatMessage = {
        id: aiMsgId,
        sender: 'ai',
        text: data.replyEn,
        translationAr: data.translationAr,
        correctionsAr: data.correctionsAr,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, newAiMsg]);

      // Automatically speak out English response from Tutor Basim for listening comprehension practice
      VoiceTutor.speak(data.replyEn, 'en', () => {
        setPlayingMessageId(null);
      });
      setPlayingMessageId(aiMsgId);

    } catch (err) {
      console.error("Chat conversation failure:", err);
    } finally {
      setSending(false);
    }
  };

  const playVoiceSynthesis = (msgId: string, text: string, lang: 'en' | 'ar') => {
    setPlayingMessageId(msgId);
    VoiceTutor.speak(text, lang, () => {
      setPlayingMessageId(null);
    });
  };

  const triggerMicListening = () => {
    setMicError(null);
    setIsRecording(true);
    setInputText('');

    const rec = VoiceTutor.startListening(
      (transscribed) => {
        setInputText(transscribed);
        // Automatically submit transcription for extra sleek flow if they finish speaking
        setIsRecording(false);
      },
      (err) => {
        setMicError(err);
        setIsRecording(false);
      },
      () => {
        setIsRecording(false);
      }
    );

    setRecognitionInstance(rec);
  };

  const stopMicListening = () => {
    if (recognitionInstance) {
      recognitionInstance.stop();
    }
    setIsRecording(false);
  };

  const clearChatHistory = () => {
    VoiceTutor.stop();
    greetStudent();
  };

  return (
    <div className="bg-white border-4 border-sky-200 rounded-[40px] overflow-hidden flex flex-col h-[550px] md:h-[600px] hover:shadow-md transition animate-fade-in text-right shadow-xl">
      
      {/* Top chatroom title header */}
      <div className="bg-sky-50 border-b-4 border-sky-100 p-4 px-5 flex items-center justify-between">
        
        {/* Reset history button */}
        <button
          type="button"
          onClick={clearChatHistory}
          className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 transition font-black flex items-center gap-1.5 bg-white p-2 px-3 border-2 border-red-100 rounded-2xl cursor-pointer"
          title="مسح المحادثة المباشرة"
        >
          <Trash2 className="w-4 h-4" />
          ابدأ محادثة جديدة 🔄
        </button>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <h3 className="font-extrabold text-sky-950 text-sm">مصل القراءة الصوتية والمحادثة الحرة</h3>
            <span className="text-[10px] text-orange-700 font-extrabold bg-orange-100 border border-orange-200 px-3 py-0.5 rounded-full inline-block mt-1">
              الحديث مع: الأستاذ باسم (مستوى {level})
            </span>
          </div>
          <div className="w-12 h-12 rounded-full bg-white border-3 border-sky-200 flex items-center justify-center text-sky-700 font-extrabold relative shadow-inner">
            <User className="w-6 h-6 text-sky-850" />
            <span className="absolute bottom-0 left-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          </div>
        </div>

      </div>

      {/* Messages dynamic viewport */}
      <div 
        ref={listRef}
        className="flex-1 p-5 overflow-y-auto space-y-5 bg-sky-50/20"
      >
        {messages.map((m) => {
          const isAi = m.sender === 'ai';
          const isPlaying = playingMessageId === m.id;

          return (
            <div 
              key={m.id} 
              className={`flex flex-col space-y-2 max-w-[85%] sm:max-w-[70%] ${
                isAi ? 'mr-auto items-end text-right ml-4' : 'ml-auto items-start text-left mr-4'
              }`}
            >
              <div className={`rounded-3xl p-4.5 shadow-sm relative border-3 ${
                isAi 
                  ? 'bg-white border-sky-100 rounded-tr-none text-sky-955' 
                  : 'bg-orange-500 border-orange-400 text-white rounded-tl-none font-semibold font-mono shadow-[0_4px_0_rgb(194,65,12)]'
              }`}
              style={{ direction: isAi ? 'rtl' : 'ltr' }}>
                
                {/* Voice synthesizers controls for English readouts */}
                {isAi && (
                  <button
                    type="button"
                    onClick={() => playVoiceSynthesis(m.id, m.text, 'en')}
                    className={`absolute top-3 left-3 p-2 rounded-xl transition cursor-pointer ${
                      isPlaying 
                        ? 'bg-orange-500 text-white animate-pulse' 
                        : 'bg-sky-100 text-sky-600 hover:bg-orange-100 hover:text-orange-950'
                    }`}
                    title="الاستماع لنطق الجملة بالإنجليزية"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <p className={`text-xs sm:text-sm leading-relaxed ${isAi ? 'text-left font-mono pl-8 block pt-2' : 'text-left block font-mono'}`}>
                  {m.text}
                </p>

                {isAi && m.translationAr && (
                  <div className="border-t-2 border-sky-50 mt-3 pt-2 text-right">
                    <p className="text-xs font-semibold text-sky-700">
                      {m.translationAr}
                    </p>
                  </div>
                )}
              </div>

              {/* Timestamp label */}
              <span className="text-[9px] font-bold text-sky-400 font-mono px-2">
                {m.timestamp}
              </span>

              {/* Tutor language advice / corrections callout box under user's response error assessment */}
              {isAi && m.correctionsAr && (
                <div className="bg-orange-50/90 border-r-4 border-orange-400 p-4.5 rounded-2xl text-right max-w-full space-y-1.5 mt-1.5 font-sans shadow-xs animate-scale-up">
                  <div className="text-[10px] font-black text-orange-900 flex items-center justify-end gap-1 uppercase tracking-widest">
                    ملاحظات الأستاذ اللغوية 💡
                  </div>
                  <p className="text-[11px] font-semibold text-sky-950 leading-relaxed text-justify">
                    {m.correctionsAr}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {sending && (
          <div className="flex md:max-w-xs justify-end mr-auto">
            <div className="bg-white border-4 border-sky-100 rounded-3xl p-4 flex items-center gap-3 shadow-xs">
              <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce delay-100" />
              <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce delay-200" />
              <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce delay-300" />
              <span className="text-[10px] font-black text-sky-700 uppercase">المعلم يكتب...</span>
            </div>
          </div>
        )}
      </div>

      {micError && (
        <div className="p-3 bg-red-50 border-t-3 border-red-100 text-xs text-red-600 text-center font-bold">
          ⚠️ فشل رصد الصوت: {micError} (يرجى التأكد من إعطاء إذن تشغيل الميكروفون بالمتصفح).
        </div>
      )}

      {/* Input keyboard/microphone bar */}
      <div className="p-4 bg-sky-50 border-t-4 border-sky-100 flex items-center gap-3 relative z-10">
        <button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || sending}
          className="p-3.5 font-bold rounded-2xl bg-orange-500 hover:bg-orange-600 text-white transition disabled:opacity-40 cursor-pointer shadow-[0_4px_0_rgb(194,65,12)] active:translate-y-1 active:shadow-none shrink-0"
        >
          <Send className="w-4 h-4 rotate-180" />
        </button>

        <input
          id="chat-user-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="اكتب ردك باللغة الإنجليزية هنا..."
          className="flex-1 bg-white border-3 border-sky-100 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-orange-400 font-mono"
          style={{ direction: 'ltr', textAlign: 'left' }}
        />

        {/* Real-time mic recording button inside chats */}
        {isRecording ? (
          <button
            type="button"
            onClick={stopMicListening}
            className="p-3.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white transition shrink-0 cursor-pointer animate-pulse relative"
          >
            <div className="absolute inset-0 rounded-2xl bg-red-500 animate-ping opacity-3 w-full h-full" />
            <MicOff className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={triggerMicListening}
            className="p-3.5 rounded-2xl bg-orange-400 hover:bg-orange-500 text-white transition shrink-0 shadow-[0_4px_0_rgb(194,120,12)] active:translate-y-1 active:shadow-none cursor-pointer"
            title="تحدث بالمايك باللغة الإنجليزية"
          >
            <Mic className="w-4 h-4" />
          </button>
        )}
      </div>

    </div>
  );
}
