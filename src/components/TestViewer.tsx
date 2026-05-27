import React, { useState, useEffect } from 'react';
import { Test, TestQuestion, StudentLevel, StudentStats } from '../types';
import { HelpCircle, Award, Sparkles, CheckCircle, AlertTriangle, Play, RefreshCw, Layers, Clock } from 'lucide-react';

interface TestViewerProps {
  level: StudentLevel;
  stats: StudentStats;
  onSetTestScore: (testId: string, percentage: number, skillType: 'grammar' | 'vocabulary' | 'speaking' | 'listening') => void;
}

const SKILL_CATEGORIES = [
  { key: 'grammar', titleAr: 'اختبار قواعد اللغة (Grammar)', descAr: 'يقيم مهارات الصرف والنحو والترابط الزمني للمستويات المختلفة.' },
  { key: 'vocabulary', titleAr: 'اختبار المفردات والسياق (Vocabulary)', descAr: 'يقيم ثراء مخزونك اللغوي، والتهجئة، والمعاني الشاذة.' },
  { key: 'conversation', titleAr: 'اختبار محاكاة المحادثات (Conversation)', descAr: 'يقيم فهمك للاستجابات السليمة والتهذيب في مواقف الحياة اليومية.' }
];

export default function TestViewer({ level, stats, onSetTestScore }: TestViewerProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [test, setTest] = useState<Test | null>(null);
  
  // Quiz active state
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: string }>({});
  const [isTestSubmitted, setIsTestSubmitted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    let timerId: any;
    if (test && !isTestSubmitted) {
      timerId = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [test, isTestSubmitted]);

  const formatTime = (secs: number) => {
    const mm = Math.floor(secs / 60).toString().padStart(2, '0');
    const ss = (secs % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const startTest = async (category: string) => {
    setActiveCategory(category);
    setLoading(true);
    setTest(null);
    setCurrentQuestionIdx(0);
    setSelectedAnswers({});
    setIsTestSubmitted(false);
    setSecondsElapsed(0);

    try {
      const response = await fetch('/api/tutor/generate-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          difficulty: level,
        }),
      });

      const data = await response.json();
      if (data.error && data.fallback) {
        setTest(data.fallback);
      } else {
        setTest(data);
      }
    } catch (err) {
      console.error("Diagnostic test load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, choiceLetter: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: choiceLetter
    }));
  };

  const handleNext = () => {
    if (test && currentQuestionIdx < test.questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(currentQuestionIdx - 1);
    }
  };

  const submitTest = () => {
    if (!test) return;

    let correctCount = 0;
    test.questions.forEach((q) => {
      const parsedCorrect = q.correctAnswer.trim().toUpperCase();
      const parsedUser = (selectedAnswers[q.id] || '').trim().toUpperCase();
      
      // Match letters 'A', 'B', 'C', 'D' or whole string options
      if (parsedUser === parsedCorrect || (parsedUser && parsedCorrect.startsWith(parsedUser))) {
        correctCount++;
      }
    });

    const percentage = Math.round((correctCount / test.questions.length) * 100);
    setFinalScore(percentage);
    setIsTestSubmitted(true);

    // Map test category to student score skill target
    const skillTarget = activeCategory === 'grammar' ? 'grammar' : activeCategory === 'vocabulary' ? 'vocabulary' : 'listening';
    
    // Trigger callback to update localStorage and main states
    onSetTestScore(test.id, percentage, skillTarget);
  };

  const handleBackToCatalog = () => {
    setActiveCategory(null);
    setTest(null);
    setIsTestSubmitted(false);
  };

  return (
    <div className="space-y-6 text-right animate-fade-in">
      
      {/* Category selector if no test in progress */}
      {!activeCategory ? (
        <div className="space-y-6">
          <div className="bg-white border-4 border-sky-200 rounded-[40px] p-6 sm:p-8 text-right space-y-2 shadow-xl">
            <h2 className="text-xl sm:text-2xl font-black text-sky-900">اختبارات مهارة التحدث والقواعد والتقييم 📊</h2>
            <p className="text-sm font-semibold text-sky-750">
              قم باجتياز الاختبار المكون من 5 أسئلة في أي تخصص تود أن يقيمك المعلم باسم فيه. ستحصل على تقييم شامل ومستمر.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SKILL_CATEGORIES.map((cat) => {
              const testId = `test_${cat.key}_${level.toLowerCase()}`;
              const previousScore = stats.testScores[testId];

              return (
                <div key={cat.key} className="bg-white border-4 border-sky-100 rounded-3xl p-6 hover:border-orange-400 transition-all duration-150 flex flex-col justify-between space-y-6 shadow-md hover:translate-y-[-2px]">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      {previousScore !== undefined ? (
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
                          previousScore >= 80 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : 'bg-yellow-105 text-yellow-805 border border-yellow-200'
                        }`}>
                          الدرجة السابقة: {previousScore}%
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold bg-sky-50 text-sky-400 px-3 py-1 rounded-full border border-sky-100">
                          لم يُختبر بعد
                        </span>
                      )}
                      <Layers className="w-5 h-5 text-orange-500" />
                    </div>

                    <h3 className="font-extrabold text-sky-950 text-sm sm:text-base">{cat.titleAr}</h3>
                    <p className="text-xs font-semibold text-sky-700 leading-relaxed">
                      {cat.descAr}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => startTest(cat.key)}
                    className="w-full text-center px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-xs font-black transition shadow-[0_4px_0_rgb(194,65,12)] active:translate-y-1 active:shadow-none cursor-pointer"
                  >
                    بدء الاختبار الآن ➔
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : loading ? (
        <div className="bg-white border-4 border-sky-200 rounded-[40px] p-16 flex flex-col items-center justify-center text-center space-y-4 min-h-[420px] shadow-xl relative overflow-hidden">
          <div className="w-12 h-12 border-4 border-sky-100 border-t-orange-400 rounded-full animate-spin" />
          <h4 className="font-black text-sky-900">جاري صياغة الأسئلة واختلافات الاختيارات للاختبار...</h4>
          <p className="text-xs font-bold text-sky-450 max-w-xs">
            يتم تجهيز 5 أسئلة اختيارية معقدة لتقييم مستواك الفعلي بمستوى {level}.
          </p>
        </div>
      ) : test ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Question Wizard Box */}
          <div className="lg:col-span-2 bg-white border-4 border-sky-200 rounded-[40px] p-6 md:p-8 space-y-6 shadow-xl overflow-hidden relative">
            
            {/* Steps & Score info */}
            <div className="flex items-center justify-between border-b-2 border-sky-50 pb-4">
              <span className="text-xs font-black text-sky-500 font-mono tracking-wider uppercase flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                الوقت: <strong className="text-sky-900 font-mono font-black">{formatTime(secondsElapsed)}</strong>
              </span>
              <span className="text-xs font-black text-sky-400 font-mono tracking-wider uppercase">
                صعوبة التقييم: <strong className="text-orange-500">{level}</strong>
              </span>
              <span className="text-xs font-black text-sky-900">
                السؤال {currentQuestionIdx + 1} من {test.questions.length}
              </span>
            </div>

            {/* Render Active Question */}
            {(() => {
              const q: TestQuestion = test.questions[currentQuestionIdx];
              const alphabet = ['A', 'B', 'C', 'D'];

              return (
                <div className="space-y-6">
                  <div className="space-y-2">
                    {q.questionAr && (
                      <span className="text-xs font-bold text-sky-400 block">
                        ({q.questionAr})
                      </span>
                    )}
                    <h2 className="text-lg md:text-xl font-black text-sky-950 leading-snug font-mono text-left" style={{ direction: 'ltr' }}>
                      {q.question}
                    </h2>
                  </div>

                  {/* Choice option cards */}
                  <div className="grid grid-cols-1 gap-3.5">
                    {q.options.map((option, oIdx) => {
                      const choiceLetter = alphabet[oIdx];
                      const isSelected = selectedAnswers[q.id] === choiceLetter;
                      const showResultStatus = isTestSubmitted;
                      const isOptionCorrect = choiceLetter === q.correctAnswer;

                      let cardStyle = 'border-sky-100 bg-white text-sky-950 hover:bg-sky-50';
                      if (isSelected) {
                        cardStyle = 'bg-orange-500 border-orange-400 text-white shadow-md ring-4 ring-orange-100';
                      }

                      if (showResultStatus) {
                        if (isOptionCorrect) {
                          cardStyle = 'bg-green-500 border-green-400 text-white shadow-md';
                        } else if (isSelected) {
                          cardStyle = 'bg-red-500 border-red-400 text-white shadow-md';
                        } else {
                          cardStyle = 'opacity-40 border-sky-100 bg-sky-50 text-sky-400 cursor-not-allowed';
                        }
                      }

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          disabled={isTestSubmitted}
                          onClick={() => handleSelectOption(q.id, choiceLetter)}
                          className={`w-full text-left p-5 rounded-3xl border-4 transition font-mono text-xs font-bold flex justify-between items-center gap-4 cursor-pointer ${cardStyle}`}
                          style={{ direction: 'ltr' }}
                        >
                          <span className="font-semibold flex-1 text-right">{option}</span>
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs font-sans ${isSelected ? 'bg-white text-orange-950' : 'bg-sky-100 text-sky-600'}`}>
                            {choiceLetter}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Teacher correction explanations per question after test submission */}
                  {isTestSubmitted && (
                    <div className="bg-sky-50 p-5 border-4 border-sky-150 rounded-3xl space-y-1.5 animate-scale-up">
                      <div className="text-xs font-black text-sky-900 flex items-center justify-end gap-1">
                        توضيح الإجابة الصحيحة ({q.correctAnswer}):
                        <Sparkles className="w-4 h-4 text-orange-400" />
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-sky-950 leading-relaxed text-justify">
                        {q.explanationAr}
                      </p>
                    </div>
                  )}

                </div>
              );
            })()}

            {/* Back & Next Navigation controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between border-t-4 border-sky-50 pt-5 gap-4">
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentQuestionIdx === 0}
                  className="px-5 py-3 rounded-2xl text-xs font-black border-4 border-sky-100 bg-white text-sky-950 hover:border-sky-300 disabled:opacity-40 transition-all cursor-pointer shadow-xs"
                >
                  السابق ➔
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={currentQuestionIdx === test.questions.length - 1}
                  className="px-5 py-3 rounded-2xl text-xs font-black border-4 border-sky-100 bg-white text-sky-950 hover:border-sky-300 disabled:opacity-40 transition-all cursor-pointer shadow-xs"
                >
                  التالي 
                </button>
              </div>

              {!isTestSubmitted ? (
                <button
                  type="button"
                  onClick={submitTest}
                  disabled={Object.keys(selectedAnswers).length < test.questions.length}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-black bg-orange-500 hover:bg-orange-600 text-white transition shadow-[0_4px_0_rgb(194,65,12)] active:translate-y-1 active:shadow-none cursor-pointer disabled:opacity-40"
                >
                  إنهاء وتصحيح الاختبار بالكامل ✓
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleBackToCatalog}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-black bg-orange-500 hover:bg-orange-600 text-white transition shadow-[0_4px_0_rgb(194,65,12)] active:translate-y-1 active:shadow-none cursor-pointer"
                >
                  الخروج والعودة لكتالوج الاختبارات ➔
                </button>
              )}

            </div>

          </div>

          {/* Test Status Scorecard side widget */}
          <div className="space-y-4">
            
            {/* Selected Answers summary */}
            <div className="bg-white border-4 border-sky-200 rounded-[30px] p-5 text-right space-y-4 shadow-md">
              <h3 className="font-extrabold text-sky-900 text-xs">ملخص أجوبتك بالورقة</h3>
              
              <div className="space-y-2">
                {test.questions.map((q, idx) => {
                  const userAnsSet = selectedAnswers[q.id];
                  const qNum = idx + 1;
                  return (
                    <div key={q.id} className="flex items-center justify-between text-xs bg-sky-50 p-3 rounded-xl border border-sky-100 font-bold">
                      <span className="font-mono font-black text-orange-500">
                        {userAnsSet ? `الاختيار: ${userAnsSet}` : "لم يتم الاختيار"}
                      </span>
                      <span className="font-extrabold text-sky-850">السؤال {qNum}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Test submission results card */}
            {isTestSubmitted && (
              <div className={`p-6 rounded-[30px] border-4 text-right space-y-4 animate-scale-up shadow-md ${
                finalScore >= 80 
                  ? 'bg-green-50/90 border-green-200 text-green-950' 
                  : finalScore >= 50 
                  ? 'bg-yellow-50/90 border-yellow-250 text-yellow-950' 
                  : 'bg-red-50/90 border-red-200 text-red-955'
              }`}>
                <div className="flex items-center justify-end gap-2 pr-1">
                  <h3 className="font-black text-sky-900 text-sm">كشف الدرجة الأكاديمي للطالب</h3>
                  <Award className="w-5 h-5 text-orange-500" />
                </div>

                <div className="text-center py-4 bg-white/70 border-2 border-sky-100 rounded-3xl space-y-1 shadow-xs">
                  <span className="text-[10px] text-sky-400 block font-black uppercase tracking-widest">المجموع النهائي</span>
                  <div className="text-4xl font-black text-sky-950 font-sans">{finalScore}%</div>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider inline-block ${
                    finalScore >= 80 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {finalScore >= 80 ? "اجتياز ممتاز! أحسنت" : "مستوى جيد، تحتاج للتحسن"}
                  </span>
                </div>

                <p className="text-xs font-semibold text-sky-950 leading-relaxed text-justify">
                  {finalScore === 100 && "رائع! علامة كاملة. فهمك الدقيق للـ Grammar والمفردات ممتاز جداً."}
                  {finalScore >= 80 && finalScore < 100 && "لقد وضعت قدماً صلبة في الطلاقة، انتبه للأخطاء الطفيفة للتصحيحات الموضحة في الأسئلة."}
                  {finalScore >= 50 && finalScore < 80 && "مستوى متوسط وواعد، تحتاج لمراجعة قواعد الكلمات وحفظ تعبيرات التلقين الإضافية."}
                  {finalScore < 50 && "العلامة منخفضة، يوصى بالعودة للاستماع لشروحات المعلم والتدريب عبر التمارين الحوارية بانتظام."}
                </p>

                {finalScore >= 80 && (
                  <div className="text-[10px] text-green-800 font-extrabold bg-green-500/10 p-3 rounded-2xl border-2 border-green-500/20">
                    كسبت +100 من نقاط الخبرة والـ Grammar لتطوير ملفك! 🎉
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      ) : null}

    </div>
  );
}
