import React, { useState, useEffect } from 'react';
import { Exercise, StudentLevel, StudentStats } from '../types';
import { VoiceTutor } from './VoiceSynthesisHelper';
import { Award, CheckCircle, ShieldAlert, Sparkles, Volume2, Mic, MicOff, RefreshCw, ArrowLeft, ArrowRight, Lightbulb } from 'lucide-react';

interface ExerciseListProps {
  lessonTitle: string;
  category: string;
  level: StudentLevel;
  stats: StudentStats;
  onRecordExerciseResult: (
    lessonTitle: string,
    category: string,
    question: string,
    userAnswer: string,
    correct: boolean,
    amount: number,
    skillKey: 'grammar' | 'vocabulary' | 'speaking' | 'listening'
  ) => void;
  onBackToLessons: () => void;
}

export default function ExerciseList({ lessonTitle, category, level, stats, onRecordExerciseResult, onBackToLessons }: ExerciseListProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  
  // Scoring / correction evaluations
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    correct: boolean;
    feedbackAr: string;
    explanationAr: string;
  } | null>(null);

  // Microphone recording speech status
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  // Smart hints states
  const [hintUsed, setHintUsed] = useState(false);
  const [hintExplanation, setHintExplanation] = useState('');

  useEffect(() => {
    fetchExercises();
    return () => {
      // Cleanup any active mic or speakers on dismount
      VoiceTutor.stop();
      if (recognitionInstance) {
        recognitionInstance.abort();
      }
    };
  }, [lessonTitle]);

  const generateHint = () => {
    const exercise = exercises[currentIndex];
    if (!exercise) return;
    setHintUsed(true);
    
    const ans = exercise.correctAnswer;
    if (!ans) {
      setHintExplanation("تمرين التحدث: تطلب النطق بوضوح تام لمخارج الأحرف ليتناسب مع نموذج نطق المعلم باسم.");
      return;
    }
    
    // Obfuscate words in correct answer to provide an amazing hint safely
    const words = ans.split(' ');
    const maskedWords = words.map(w => {
      if (w.length <= 1) return w;
      const firstChar = w[0];
      const rest = w.slice(1).replace(/[a-zA-Z]/g, '_');
      return firstChar + rest;
    });
    
    const maskStr = maskedWords.join(' ');
    setHintExplanation(`تلميح الحروف الأولى: "${maskStr}" (تتكون من ${words.length} كلمات)`);
  };

  const fetchExercises = async () => {
    setLoading(true);
    setExercises([]);
    setCurrentIndex(0);
    setUserAnswer('');
    setEvaluationResult(null);
    setHintUsed(false);
    setHintExplanation('');

    try {
      const response = await fetch('/api/tutor/exercises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonTitle,
          category,
          difficulty: level,
        }),
      });

      const data = await response.json();
      if (data.error && data.fallback) {
        setExercises(data.fallback);
      } else {
        setExercises(data);
      }
    } catch (err) {
      console.error("Error loaded exercises:", err);
    } finally {
      setLoading(false);
    }
  };

  const currentExercise = exercises[currentIndex];

  const handleMultipleChoiceSelect = (option: string) => {
    setUserAnswer(option);
  };

  // Triggers the Web speech recognition to catch the student's voice & transcribe it in real-time
  const startRecordingVoice = () => {
    setMicError(null);
    setIsRecording(true);
    setUserAnswer('');

    const rec = VoiceTutor.startListening(
      (text) => {
        setUserAnswer(text);
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

  const stopRecordingVoice = () => {
    if (recognitionInstance) {
      recognitionInstance.stop();
    }
    setIsRecording(false);
  };

  const playTargetAudioPrompt = () => {
    if (currentExercise) {
      VoiceTutor.speak(currentExercise.question, 'en');
    }
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim()) return;

    setEvaluating(true);
    setEvaluationResult(null);

    try {
      const response = await fetch('/api/tutor/correct-exercise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: currentExercise.question,
          questionAr: currentExercise.questionAr,
          type: currentExercise.type,
          correctAnswer: currentExercise.correctAnswer,
          userAnswer,
        }),
      });

      const data = await response.json();
      
      const isCorrect = !!data.isCorrect;
      setEvaluationResult({
        correct: isCorrect,
        feedbackAr: data.feedbackAr,
        explanationAr: data.correctExplanationAr,
      });

      // IMMERSIVE VOICE PLAYBACK AWARDS
      if (isCorrect) {
        const positivePhrases = [
          "Outstanding! That is completely correct.",
          "Brilliant! Perfect grammar.",
          "Excellent answer! Keep soaring."
        ];
        const phrase = positivePhrases[Math.floor(Math.random() * positivePhrases.length)];
        VoiceTutor.speak(phrase, 'en');
      } else {
        const encouragePhrases = [
          "Good try! Practice makes perfect.",
          "Great effort! Keep polishing."
        ];
        const phrase = encouragePhrases[Math.floor(Math.random() * encouragePhrases.length)];
        VoiceTutor.speak(phrase, 'en');
      }

      // Map exercise type to corresponding progress bar category
      let skillTarget: 'grammar' | 'vocabulary' | 'speaking' | 'listening' = 'grammar';
      if (currentExercise.type === 'voice-pronounce') {
        skillTarget = 'speaking';
      } else if (category === 'vocabulary') {
        skillTarget = 'vocabulary';
      } else if (category === 'conversation') {
        skillTarget = 'listening';
      }

      // Record exercise result (updates XP/skills if correct, and saves to history always)
      onRecordExerciseResult(
        lessonTitle,
        category,
        currentExercise.question,
        userAnswer,
        isCorrect,
        25,
        skillTarget
      );

    } catch (err) {
      console.error("Answer submission failure:", err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    setUserAnswer('');
    setEvaluationResult(null);
    setHintUsed(false);
    setHintExplanation('');
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    setUserAnswer('');
    setEvaluationResult(null);
    setHintUsed(false);
    setHintExplanation('');
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="space-y-6 text-right animate-fade-in">
      
      {/* Header toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border-4 border-sky-200 rounded-3xl p-5 shadow-md">
        <div>
          <button
            type="button"
            onClick={onBackToLessons}
            className="text-xs text-orange-600 hover:text-orange-700 transition font-black flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 rotate-180" />
            العودة لكتالوج الدروس 📚
          </button>
          <h2 className="text-xl font-black text-sky-900 mt-1">القواعد والتمارين: {lessonTitle}</h2>
        </div>
        
        <button
          type="button"
          onClick={fetchExercises}
          className="text-xs font-black text-sky-700 hover:text-orange-600 transition flex items-center gap-1.5 bg-sky-50 px-4 py-2.5 rounded-2xl border-2 border-sky-100 cursor-pointer self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          توليد مجموعة تمارين جديدة 🔄
        </button>
      </div>

      {loading ? (
        <div className="bg-white border-4 border-sky-200 rounded-[40px] p-16 flex flex-col items-center justify-center text-center space-y-5 min-h-[420px] shadow-xl relative overflow-hidden">
          <div className="w-12 h-12 border-4 border-sky-100 border-t-orange-400 rounded-full animate-spin" />
          <h4 className="font-black text-sky-900">يقوم المعلم بنحت تحديات ملائمة لمستواك...</h4>
          <p className="text-xs font-bold text-sky-450 max-w-xs">
            يتم توليد 4 تمارين ذكية تشمل خيارات النطق الصوتي والترجمة وقواعد التراكيب.
          </p>
        </div>
      ) : exercises.length === 0 ? (
        <div className="bg-white border-4 border-sky-200 rounded-[40px] p-10 flex flex-col items-center justify-center text-center space-y-4 min-h-[320px] shadow-md">
          <h4 className="font-black text-sky-900">لم يتم العثور على تمارين مخصصة.</h4>
          <button onClick={fetchExercises} className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-black py-3 px-6 rounded-2xl shadow-sm transition">إعادة المحاولة</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Exercise Presentation Desk */}
          <div className="lg:col-span-2 bg-white border-4 border-sky-200 rounded-[40px] p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
            
            {/* Steps tracker bubble */}
            <div className="flex items-center justify-between border-b-2 border-sky-50 pb-4">
              <span className="text-xs font-black text-sky-400 uppercase tracking-widest font-mono">
                Exercise {currentIndex + 1} of {exercises.length}
              </span>
              <div className="flex gap-1.5">
                {exercises.map((_, idx) => (
                  <span 
                    key={idx} 
                    className={`h-2.5 rounded-full transition-all ${
                      idx === currentIndex 
                        ? 'w-8 bg-orange-400' 
                        : idx < currentIndex 
                        ? 'w-2.5 bg-green-400' 
                        : 'w-2.5 bg-sky-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Instruction Arabic Question Title */}
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 bg-yellow-400 border border-yellow-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider select-none">
                المطلوب منك (Instructions)
              </span>
              <h3 className="text-lg sm:text-2xl font-black text-sky-950 tracking-tight leading-normal">
                {currentExercise.questionAr}
              </h3>
            </div>

            {/* English Sentence Display card */}
            <div className="bg-sky-50 border-4 border-sky-150 p-6 md:p-8 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 relative shadow-inner">
              
              {/* Audio button for listening reference spelling */}
              <button
                type="button"
                onClick={playTargetAudioPrompt}
                className="absolute top-3 left-3 p-2.5 rounded-xl bg-white hover:bg-orange-100 hover:text-orange-950 text-orange-500 transition cursor-pointer border-2 border-sky-100 shadow-xs"
                title="الاستماع لنطق الجملة الصحيحة"
              >
                <Volume2 className="w-4 h-4" />
              </button>

              <h2 className="text-xl md:text-2xl font-black font-mono text-sky-950 tracking-wide select-all px-6">
                {currentExercise.question}
              </h2>
              
              {currentExercise.type === 'voice-pronounce' && (
                <span className="text-[10px] uppercase tracking-widest text-orange-700 bg-orange-100 border border-orange-200 px-3 py-1 rounded-full font-black animate-pulse">
                  تمرين نطق: اضغط على المايك تحت وتحدث بالجملة بالكامل 🗣
                </span>
              )}

              {/* Offline-First Smart hint controller */}
              <div className="w-full pt-1.5 border-t border-sky-150">
                {hintUsed ? (
                  <div className="bg-sky-100/80 p-2.5 px-4 rounded-xl text-[11px] font-black text-sky-900 border border-sky-250 select-none inline-block max-w-full">
                    💡 {hintExplanation}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={generateHint}
                    className="text-[10px] font-black text-sky-750 hover:text-orange-600 hover:scale-105 transition cursor-pointer select-none bg-white px-3 py-1.5 rounded-full border border-sky-200 shadow-xs inline-flex items-center gap-1"
                  >
                    💡 تحتاج مساعدة؟ اضغط للحصول على تلميح ذكي للحل
                  </button>
                )}
              </div>
            </div>

            {/* Interactive Inputs Desk depending on exercise type */}
            <div className="space-y-4 pt-2">
              
              {/* Type 1: Multiple Choice Options Rendering */}
              {currentExercise.type === 'multiple-choice' && currentExercise.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentExercise.options.map((option, idx) => {
                    const isSelected = userAnswer === option;
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={evaluationResult !== null}
                        onClick={() => handleMultipleChoiceSelect(option)}
                        className={`text-left p-5 rounded-3xl border-4 transition font-mono text-xs font-bold flex items-center justify-between gap-4 cursor-pointer ${
                          isSelected
                            ? 'bg-orange-500 border-orange-400 text-white shadow-md ring-4 ring-orange-100'
                            : 'bg-white hover:border-sky-300 border-sky-100 text-sky-950'
                        }`}
                        style={{ direction: 'ltr' }}
                      >
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black font-sans text-xs ${isSelected ? 'bg-white text-orange-900 border border-orange-200' : 'bg-sky-100 text-sky-600'}`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="font-black flex-1 text-right">{option}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Type 2: Written Text Input Translation */}
              {currentExercise.type === 'text-input' && (
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    disabled={evaluationResult !== null}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="اكتب الإجابة باللغة الإنجليزية هنا..."
                    className="w-full text-right p-5 rounded-3xl border-4 border-sky-100 bg-sky-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-400 text-sm font-black font-mono placeholder:font-sans placeholder:text-sky-400"
                    style={{ direction: 'ltr', textAlign: 'left' }}
                  />
                  <div className="text-[11px] font-semibold text-sky-450 text-right pr-2">
                    نصيحة: انتبه لعلامات الترقيم والأحرف الكبيرة والصغيرة (Capitalization).
                  </div>
                </div>
              )}

              {/* Type 3: Mic Speech-recognition Pronounce Input */}
              {currentExercise.type === 'voice-pronounce' && (
                <div className="flex flex-col items-center justify-center p-6 bg-sky-50 border-4 border-sky-100 rounded-3xl space-y-4">
                  
                  {isRecording ? (
                    <button
                      type="button"
                      onClick={stopRecordingVoice}
                      className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-xl flex items-center justify-center hover:scale-105 transition-all animate-pulse cursor-pointer relative"
                    >
                      <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
                      <MicOff className="w-8 h-8" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={evaluationResult !== null}
                      onClick={startRecordingVoice}
                      className="w-20 h-20 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-xl flex items-center justify-center hover:scale-105 transition-all shadow-[0_6px_0_rgb(194,65,12)] active:translate-y-1 active:shadow-none cursor-pointer disabled:opacity-50"
                    >
                      <Mic className="w-8 h-8" />
                    </button>
                  )}

                  <div className="text-center space-y-1 select-none">
                    <h4 className="font-extrabold text-xs text-sky-900">
                      {isRecording ? "المعلم يستمع لصوتك الآن... تحدث بوضوح" : "انقر على رمز المايك للتحدث وقراءة العبارة"}
                    </h4>
                    <p className="text-[10px] font-semibold text-sky-455">
                      سيتم تحويل صوتك المنطوق إلى نص تفاعلي بمساعدة المتصفِّح.
                    </p>
                  </div>

                  {/* Recognition transcript readout */}
                  {userAnswer && (
                    <div className="p-4 bg-white border-2 border-sky-100 rounded-2xl w-full text-center">
                      <span className="text-[10px] font-semibold text-sky-400 block mb-0.5">ما تم رصده من صوتك (Transcribed text):</span>
                      <p className="font-black font-mono text-green-700 text-sm italic">
                        "{userAnswer}"
                      </p>
                    </div>
                  )}

                  {micError && (
                    <div className="text-xs text-red-600 bg-red-50 p-2.5 px-4 border border-red-100 rounded-xl text-right font-semibold">
                      ⚠️ فشل المايك: {micError} (تأكد من إذن الوصول للميكروفون في المتصفح).
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Evaluation and Next Actions Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between border-t-4 border-sky-50 pt-5 gap-4">
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevQuestion}
                  disabled={currentIndex === 0}
                  className="p-3 rounded-2xl border-4 border-sky-100 bg-white hover:border-sky-300 text-sky-950 disabled:opacity-40 transition-all cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4 font-black" />
                </button>
                
                {currentIndex === exercises.length - 1 && evaluationResult ? (
                  <button
                    type="button"
                    onClick={onBackToLessons}
                    className="bg-green-500 hover:bg-green-600 text-white text-xs font-black px-5 py-3 rounded-2xl shadow-[0_4px_0_rgb(21,128,61)] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
                  >
                    أكملت جميع التمارين! عد للكتالوج 🎉
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    disabled={currentIndex === exercises.length - 1}
                    className="p-3 rounded-2xl border-4 border-sky-100 bg-white hover:border-sky-300 text-sky-950 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 font-black" />
                  </button>
                )}
              </div>

              {!evaluationResult ? (
                <button
                  type="button"
                  onClick={submitAnswer}
                  disabled={evaluating || !userAnswer.trim()}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-black bg-orange-500 hover:bg-orange-600 text-white transition shadow-[0_4px_0_rgb(194,65,12)] active:translate-y-1 active:shadow-none cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {evaluating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      جاري مراجعة إجابتك...
                    </>
                  ) : (
                    "تأكيد وتصحيح الإجابة ✓"
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-sky-400">تابع للسؤال التالي:</span>
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="bg-sky-100 hover:bg-sky-250 text-sky-950 text-xs font-black px-5 py-3 rounded-2xl cursor-pointer shadow-xs transition-all"
                  >
                    السماح بالتخطي ➔
                  </button>
                </div>
              )}

            </div>

          </div>

          {/* Side Teacher Feedback Panel */}
          <div className="space-y-4">
            
            {/* Display Tutor static guide */}
            <div className="bg-white border-4 border-sky-200 rounded-[30px] p-5 text-right space-y-3 shadow-md relative overflow-hidden">
              <div className="absolute top-0 left-0 -ml-10 -mt-10 w-24 h-24 bg-yellow-50 rounded-full blur-2xl pointer-events-none" />
              <h3 className="font-extrabold text-sky-900 text-xs flex items-center justify-end gap-1 select-none">
                مساعدة المعلم الذكية
                <Lightbulb className="w-4 h-4 text-yellow-500" />
              </h3>
              <p className="text-xs font-semibold text-sky-750 leading-relaxed text-justify">
                {currentExercise.helperHintAr}
              </p>
            </div>

            {/* AI Grading result box */}
            {evaluationResult && (
              <div className={`rounded-[30px] p-6 border-4 text-right space-y-4 animate-scale-up shadow-md ${
                evaluationResult.correct 
                  ? 'bg-green-50/90 border-green-200 text-green-950' 
                  : 'bg-red-50/90 border-red-200 text-red-950'
              }`}>
                
                <div className="flex items-center justify-end gap-2 text-sm font-black">
                  <span>{evaluationResult.feedbackAr}</span>
                  {evaluationResult.correct ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                  )}
                </div>

                {evaluationResult.correct && (
                  <div className="text-[10px] uppercase tracking-widest bg-green-500/10 p-2.5 rounded-xl border-2 border-green-500/20 font-black flex items-center justify-end gap-1 text-green-800">
                    كسبت +25 من نقاط المهارة والخبرة! 🏅
                  </div>
                )}

                <hr className={evaluationResult.correct ? "border-green-105 border-dashed" : "border-red-105 border-dashed"} />

                <div className="space-y-2">
                  <h4 className="text-xs font-black">تفاصيل وتعديلات المعلم (Tutor Corrections):</h4>
                  <p className="text-xs leading-relaxed text-sky-900 font-semibold text-justify">
                    {evaluationResult.explanationAr}
                  </p>
                </div>

                {/* Speak explanation option */}
                <button
                  type="button"
                  onClick={() => VoiceTutor.speak(evaluationResult.feedbackAr + ". " + evaluationResult.explanationAr, 'ar')}
                  className="w-full text-center text-[10px] font-black text-sky-450 hover:text-sky-700 pt-3 border-t border-dashed border-sky-200 block cursor-pointer transition-all"
                >
                  استمع للتوضيح اللغوي بصوت الأستاذ 🔊
                </button>

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
