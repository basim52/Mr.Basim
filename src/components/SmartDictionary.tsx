import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Volume2, Search, X, Loader, Sparkles, AlertCircle } from 'lucide-react';
import { VoiceTutor } from './VoiceSynthesisHelper';

interface DictionaryResult {
  word: string;
  translationAr: string;
  definitionEn: string;
  pronunciationHint: string;
  exampleSentence: string;
  exampleTranslationAr: string;
}

export default function SmartDictionary() {
  // Selection states
  const [candidateWord, setCandidateWord] = useState<string>('');
  const [floatingMenuPos, setFloatingMenuPos] = useState<{ top: number; left: number } | null>(null);

  // Modal search details state
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [errorError, setErrorError] = useState<string | null>(null);

  // Audio status
  const [isSpeaking, setIsSpeaking] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleTextSelection = (e: MouseEvent | TouchEvent) => {
      // Small timeout to allow browser selection object to populate fully
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection) return;

        const text = selection.toString().trim();
        
        // Basic English word filter (no Arabic, length between 2 and 40, basic characters only)
        const isEnglishBasic = /^[a-zA-Z\s.,'?!-]+$/.test(text);

        if (text && text.length >= 2 && text.length <= 40 && isEnglishBasic) {
          try {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            if (rect.width > 0 && rect.height > 0) {
              setFloatingMenuPos({
                top: rect.top + window.scrollY - 36, // float above
                left: rect.left + window.scrollX + rect.width / 2,
              });
              setCandidateWord(text);
            }
          } catch (err) {
            // silent selection errors
          }
        } else {
          // Check if we clicked outside the floating menu to dismiss it
          if (floatingMenuPos) {
            const target = e.target as HTMLElement;
            if (!target.closest('#dictionary-floating-launcher')) {
              setFloatingMenuPos(null);
            }
          }
        }
      }, 50);
    };

    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('touchend', handleTextSelection);

    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('touchend', handleTextSelection);
    };
  }, [floatingMenuPos]);

  // Performs dictionary lookup from backend
  const handleLookup = async (wordToSearch: string) => {
    if (!wordToSearch.trim()) return;

    setLoading(true);
    setErrorError(null);
    setSearchQuery(wordToSearch);
    setIsOpen(true);
    setFloatingMenuPos(null);

    try {
      const response = await fetch('/api/tutor/dictionary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word: wordToSearch }),
      });

      if (!response.ok) {
        throw new Error('فشل استيراد تعريف الكلمة من مخدم القاموس');
      }

      const data = await response.json();
      if (data.error && data.fallback) {
        setResult(data.fallback);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      console.error('Dictionary Lookup Error:', err);
      setErrorError('لم نتمكن من الوصول للمفردة حالياً. تأكد من اتصالك واستقرار خادمك.');
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (text: string) => {
    setIsSpeaking(true);
    VoiceTutor.speak(text, 'en', () => {
      setIsSpeaking(false);
    });
  };

  const handleManualSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLookup(searchQuery);
  };

  const clearSelection = () => {
    window.getSelection()?.removeAllRanges();
  };

  return (
    <>
      {/* 1. Floating Launcher Badge above selected English word */}
      <AnimatePresence>
        {floatingMenuPos && (
          <motion.div
            id="dictionary-floating-launcher"
            initial={{ opacity: 0, scale: 0.8, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              position: 'absolute',
              top: floatingMenuPos.top,
              left: floatingMenuPos.left,
              transform: 'translateX(-50%)',
              zIndex: 9999,
            }}
            className="flex items-center"
          >
            <button
              type="button"
              onClick={() => {
                handleLookup(candidateWord);
                clearSelection();
              }}
              className="bg-sky-950 text-white font-black text-[11px] py-1.5 px-3.5 rounded-full border-2 border-orange-400 flex items-center gap-1.5 shadow-xl hover:bg-orange-500 hover:text-white transition duration-200 cursor-pointer select-none whitespace-nowrap outline-none"
            >
              <BookOpen className="w-3.5 h-3.5 text-orange-400" />
              <span>ترجم كـ "{candidateWord.length > 12 ? candidateWord.substring(0, 10) + '...' : candidateWord}" 📘</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Global floating menu trigger for manual lookups (lower right corner) */}
      <div className="fixed bottom-6 left-6 z-50">
        <button
          type="button"
          onClick={() => {
            setSearchQuery('');
            setResult(null);
            setErrorError(null);
            setIsOpen(true);
          }}
          className="w-14 h-14 bg-gradient-to-tr from-sky-900 to-sky-950 font-black rounded-full border-4 border-sky-200 text-white flex items-center justify-center shadow-2xl hover:scale-115 active:scale-95 transition-all duration-200 cursor-pointer relative group"
          title="معجم الأستاذ باسم الذكي"
        >
          <BookOpen className="w-6 h-6 text-orange-400 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 text-[8px] font-extrabold text-white items-center justify-center">?</span>
          </span>
        </button>
      </div>

      {/* 3. Dictionary lookup details Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-950/40 backdrop-blur-xs select-none">
            {/* Modal card wrapper */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white border-4 border-sky-200 rounded-[35px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col text-right relative shadow-sky-950/20"
              style={{ direction: 'rtl' }}
            >
              {/* Header */}
              <div className="bg-sky-50 border-b-4 border-sky-100 p-5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-sky-100 text-sky-700 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sky-900 text-base">📘 قاموس التراجم المصاحب للأستاذ باسم</h3>
                </div>
              </div>

              {/* Manual search input form nested inside */}
              <div className="p-4 bg-sky-50/50 border-b-2 border-sky-100">
                <form onSubmit={handleManualSearchSubmit} className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-600 font-extrabold text-white text-xs px-4 py-2.5 rounded-2xl transition cursor-pointer flex items-center gap-1 shrink-0 shadow-[0_3px_0_rgb(194,65,12)] active:translate-y-0.5 active:shadow-none"
                  >
                    <Search className="w-3.5 h-3.5" />
                    ابحث
                  </button>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="اكتب كلمة إنجليزية يدوياً للبحث... (مثال: Outstanding)"
                    className="flex-1 bg-white border-2 border-sky-100 rounded-2xl px-4 py-2.5 text-xs font-bold text-left text-sky-950 focus:outline-hidden focus:ring-2 focus:ring-orange-400 font-mono"
                    style={{ direction: 'ltr', textAlign: 'left' }}
                  />
                </form>
              </div>

              {/* Body Content Viewport */}
              <div className="p-6 overflow-y-auto max-h-[380px] space-y-5">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader className="w-10 h-10 text-orange-500 animate-spin" />
                    <p className="text-xs font-black text-sky-900">يتم توليد الترجمة والتشريح اللغوي الفوري للكلمة...</p>
                    <span className="text-[10px] text-sky-405">يقوم المعلم بالرجوع للذكاء الاصطناعي لترسيخ دلالات التعبير.</span>
                  </div>
                ) : errorError ? (
                  <div className="bg-red-50 border-2 border-red-200 p-5 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-black text-red-900 text-xs sm:text-sm">حدث خطأ</h4>
                      <p className="text-[11px] sm:text-xs text-red-700 leading-relaxed mt-1">{errorError}</p>
                    </div>
                  </div>
                ) : result ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Head word & Speak synthesis */}
                    <div className="flex items-center justify-between bg-sky-50 p-4 rounded-2xl border-2 border-sky-100">
                      <button
                        type="button"
                        onClick={() => handleSpeak(result.word)}
                        className={`p-2.5 rounded-xl transition cursor-pointer ${
                          isSpeaking
                            ? 'bg-orange-500 text-white animate-pulse'
                            : 'bg-white text-sky-700 border border-sky-200 hover:bg-orange-50 hover:text-orange-950'
                        }`}
                        title="استمع للفظ"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <div className="text-right">
                        <span className="font-extrabold text-base text-sky-950 block select-all font-mono">
                          {result.word}
                        </span>
                        <span className="text-[10px] font-black text-orange-800 bg-orange-100/75 border border-orange-200 px-2.5 py-0.5 rounded-full inline-block mt-1 font-mono">
                          النطق اللفظي التقريبي: {result.pronunciationHint}
                        </span>
                      </div>
                    </div>

                    {/* Arabic word translate */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-sky-400 tracking-wider">الترجمة الفورية الدقيقة 💡</span>
                      <p className="bg-orange-50 text-orange-950 font-black text-base p-4 rounded-2xl border-2 border-orange-200 text-center shadow-xs">
                        {result.translationAr}
                      </p>
                    </div>

                    {/* Definition in English */}
                    <div className="space-y-1.5 p-4 py-3 bg-sky-50/40 rounded-2xl border-2 border-sky-100 text-left">
                      <div className="text-[10px] font-black text-sky-400 tracking-wider text-right uppercase">
                        تعريف الكلمة (English Definition)
                      </div>
                      <p className="text-xs font-semibold text-sky-950 leading-relaxed font-mono mt-1">
                        {result.definitionEn}
                      </p>
                    </div>

                    {/* Visual Sentence Example Card */}
                    <div className="bg-sky-50/35 border-2 border-dashed border-sky-200 p-4 rounded-3xl space-y-2.5">
                      <span className="text-[10px] font-black text-orange-900 flex items-center justify-end gap-1 uppercase">
                        مثال للاستخدام العملي بالجمل 🚀
                      </span>
                      <p className="text-xs font-black text-sky-950 block text-left font-mono italic pl-2 border-l-3 border-orange-400" style={{ direction: 'ltr' }}>
                        "{result.exampleSentence}"
                      </p>
                      <p className="text-[11px] font-bold text-sky-700 block text-right">
                        ({result.exampleTranslationAr})
                      </p>
                    </div>

                    <div className="text-center pt-2">
                      <span className="text-[9px] font-bold text-sky-450 flex items-center justify-center gap-1">
                        <Sparkles className="w-3 h-3 text-orange-400 animate-pulse" />
                        نصيحة: انقر نقراً مزدوجاً أو حدد أي كلمة بداخل المحادثة لترجمتها فوراً وسماع لفظها!
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                    <BookOpen className="w-12 h-12 text-sky-200" />
                    <p className="text-xs font-black text-sky-900">اضغط مطولاً على أي كلمة إنجليزية تثير فضولك بكافة الدروس</p>
                    <p className="text-[10px] text-sky-455 max-w-xs leading-relaxed">
                      أو ببساطة اكتب الكلمة المطلوبة في شريط البحث بالأعلى لتلقي ترجمتها الفورية وتعريفها ومثالاً صوتياً غنياً عنها!
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
