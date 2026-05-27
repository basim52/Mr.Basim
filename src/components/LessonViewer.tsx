import React, { useState, useEffect } from 'react';
import { Lesson, LessonContent, StudentLevel, StudentStats } from '../types';
import { VoiceTutor } from './VoiceSynthesisHelper';
import { BookOpen, Sparkles, Volume2, HelpCircle, ArrowRight, Play, Square, CheckCircle } from 'lucide-react';

interface LessonViewerProps {
  level: StudentLevel;
  stats: StudentStats;
  onSelectExercises: (lessonTitle: string, category: string) => void;
  onMarkLessonCompleted: (lessonId: string) => void;
}

// Preset lesson catalog
const STATIC_LESSONS: Lesson[] = [
  // Beginner
  { id: 'beg_1', titleEn: 'Introductions & Greetings', titleAr: 'التعارف والتحيات الشائعة', category: 'conversation', difficulty: 'Beginner', descriptionAr: 'تعلم كيف تبدأ محادثة مع الآخرين، وتقدم نفسك بذكاء.' },
  { id: 'beg_2', titleEn: 'Daily Routines Vocabulary', titleAr: 'مفردات الروتين واليوميات', category: 'vocabulary', difficulty: 'Beginner', descriptionAr: 'حفظ وفهم الكلمات والعبارات التي تصف نشاطاتك اليومية المتكررة.' },
  { id: 'beg_3', titleEn: 'The Simple Present Tense', titleAr: 'زمن المضارع البسيط وصياغته', category: 'grammar', difficulty: 'Beginner', descriptionAr: 'القاعدة الأساسية للحديث عن الحقائق، العادات، والمواعيد الصارمة.' },
  { id: 'beg_4', titleEn: 'Pronouncing Critical Vowel Sounds', titleAr: 'مخارج الحروف الصوتية الأساسية', category: 'pronunciation', difficulty: 'Beginner', descriptionAr: 'التفريق الدقيق بين نطق الأحرف القريبة في اللفظ لمنع اللبس.' },

  // Intermediate
  { id: 'int_1', titleEn: 'Talking About the Past Simple', titleAr: 'الحديث عن الماضي وصيغه', category: 'grammar', difficulty: 'Intermediate', descriptionAr: 'صياغة الأفعال الشاذة والمنتظمة للحديث عن تجارب سابقة منتهية.' },
  { id: 'int_2', titleEn: 'Ordering Food at a Restaurant', titleAr: 'طلب الطعام في المطعم', category: 'conversation', difficulty: 'Intermediate', descriptionAr: 'مصطلحات تفاعلية للتعامل مع النادل والحديث عن التفضيلات والدفع.' },
  { id: 'int_3', titleEn: 'Making Business Appointments', titleAr: 'تنسيق المواعيد والاجتماعات للمهنيين', category: 'conversation', difficulty: 'Intermediate', descriptionAr: 'تعابير بالغة التهذيب للجدولة الزمنية، الطرح، والتعديل.' },
  { id: 'int_4', titleEn: 'Phrasal Verbs in Daily Life', titleAr: 'الأفعال المركبة وشائعة الاستخدام', category: 'vocabulary', difficulty: 'Intermediate', descriptionAr: 'كلمات تتغير معانيها عند إضافة حروف الجر (مثل turn up, give in).' },

  // Advanced
  { id: 'adv_1', titleEn: 'How to Ace a Job Interview', titleAr: 'النجاح في المقابلة الوظيفية بالإنجليزية', category: 'conversation', difficulty: 'Advanced', descriptionAr: 'الإجابة بذكاء على الأسئلة الدقيقة ومناقشة الراتب والمهارات بثقة.' },
  { id: 'adv_2', titleEn: 'Idiomatic Expressions and Slangs', titleAr: 'التعبيرات الاصطلاحية والأمثال العامية', category: 'vocabulary', difficulty: 'Advanced', descriptionAr: 'الحديث كالمتحدثين الأصليين باستعمال مجازات ملهمة (مثل Break a leg).' },
  { id: 'adv_3', titleEn: 'Complex Conditional Clauses', titleAr: 'جمل الشرط المركبة والمعقدة', category: 'grammar', difficulty: 'Advanced', descriptionAr: 'التفريق بين النوع الثاني والثالث للحديث عن التمنيات والمستحيلات الندمية.' },
  { id: 'adv_4', titleEn: 'Word Stress and Tone Intonation', titleAr: 'نبرة الصوت والضغط على الكلمات', category: 'pronunciation', difficulty: 'Advanced', descriptionAr: 'مفاتيح النطق التعبيري للتأثير والإقناع وتقليل اللكنة العربية.' }
];

export default function LessonViewer({ level, stats, onSelectExercises, onMarkLessonCompleted }: LessonViewerProps) {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [lessonContent, setLessonContent] = useState<LessonContent | null>(null);
  const [speakingWord, setSpeakingWord] = useState<string | null>(null);
  const [isClassSpeaking, setIsClassSpeaking] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [generatingCustom, setGeneratingCustom] = useState(false);

  // Filter lessons based on user's active level
  const filteredLessons = STATIC_LESSONS.filter(l => l.difficulty === level);

  useEffect(() => {
    // Reset selection if level changes
    setSelectedLesson(null);
    setLessonContent(null);
    VoiceTutor.stop();
    setIsClassSpeaking(false);
    setCustomTopic('');
  }, [level]);

  const handleGenerateCustomLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopic.trim() || generatingCustom) return;
    
    setGeneratingCustom(true);
    const customId = 'custom_' + Date.now();
    
    const fakeLesson: Lesson = {
      id: customId,
      titleEn: customTopic.trim(),
      titleAr: 'درس مخصص: ' + customTopic.trim(),
      category: 'conversation',
      difficulty: level,
      descriptionAr: `درس تفاعلي تم إنشاؤه فورياً حول: ${customTopic.trim()}`
    };

    setSelectedLesson(fakeLesson);
    setLoading(true);
    setLessonContent(null);
    VoiceTutor.stop();
    setIsClassSpeaking(false);
    
    try {
      const response = await fetch('/api/tutor/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: 'conversation',
          topic: customTopic.trim(),
          difficulty: level,
        }),
      });

      const data = await response.json();
      if (data.error && data.fallback) {
        setLessonContent(data.fallback);
      } else {
        setLessonContent(data);
      }
      
      onMarkLessonCompleted(customId);
      setCustomTopic('');
    } catch (err) {
      console.error("Error creating custom lesson:", err);
    } finally {
      setLoading(false);
      setGeneratingCustom(false);
    }
  };

  const loadLesson = async (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setLoading(true);
    setLessonContent(null);
    VoiceTutor.stop();
    setIsClassSpeaking(false);

    try {
      const response = await fetch('/api/tutor/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: lesson.category,
          topic: lesson.titleEn,
          difficulty: lesson.difficulty,
        }),
      });

      const data = await response.json();
      if (data.error && data.fallback) {
        setLessonContent(data.fallback);
      } else {
        setLessonContent(data);
      }
      
      // Mark this lesson as viewed/taken in student logs
      onMarkLessonCompleted(lesson.id);
    } catch (err) {
      console.error("Error fetching lesson:", err);
    } finally {
      setLoading(false);
    }
  };

  const playVocabularySound = (word: string) => {
    setSpeakingWord(word);
    VoiceTutor.speak(word, 'en', () => {
      setSpeakingWord(null);
    });
  };

  const playSentenceSound = (text: string) => {
    VoiceTutor.speak(text, 'en');
  };

  // Speaks out the whole explanation / key takeaway logic step-by-step
  const playWholeLessonOral = () => {
    if (!lessonContent) return;
    setIsClassSpeaking(true);

    const speakChain = [
      { text: `دعنا نبدأ درس اليوم: ${lessonContent.titleAr}.`, lang: 'ar' as const },
      { text: lessonContent.explanationAr, lang: 'ar' as const },
      { text: "لنستمع إلى المفردات الأساسية ونكررها معاً.", lang: 'ar' as const },
      ...lessonContent.vocabulary.flatMap((v) => [
        { text: `الكلمة هي: ${v.word}. وتعني: ${v.translationAr}.`, lang: 'ar' as const },
        { text: v.word, lang: 'en' as const },
        { text: `مثال: ${v.exampleSentence}`, lang: 'en' as const }
      ]),
      { text: `وأخيراً، نصيحة المعلم للنطق: ${lessonContent.pronunciationTipsAr}`, lang: 'ar' as const },
      { text: "انتهى الشرح المباشر للدرس الافتراضي. يمكنك الآن الانتقال لحل التمارين التفاعلية.", lang: 'ar' as const }
    ];

    let currentIndex = 0;
    const speakNext = () => {
      if (currentIndex >= speakChain.length) {
        setIsClassSpeaking(false);
        return;
      }
      const item = speakChain[currentIndex];
      currentIndex++;
      VoiceTutor.speak(item.text, item.lang, speakNext);
    };

    speakNext();
  };

  const stopOralClass = () => {
    VoiceTutor.stop();
    setIsClassSpeaking(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-right animate-fade-in items-start">
      
      {/* 1. Sidebar Lesson Selection Column */}
      <div className="md:col-span-1 space-y-4">
        <h3 className="font-black text-sky-900 text-sm tracking-wider uppercase pr-1">دروس مستواك الحالي:</h3>
        
        <div className="space-y-3">
          {filteredLessons.map((lesson) => {
            const isCompleted = stats.lessonsTaken.includes(lesson.id);
            const isSelected = selectedLesson?.id === lesson.id;

            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => loadLesson(lesson)}
                className={`w-full text-right p-5 rounded-3xl border-4 transition-all duration-150 text-xs relative cursor-pointer ${
                  isSelected 
                    ? 'bg-orange-500 border-orange-400 text-white shadow-md' 
                    : 'bg-white hover:border-sky-400 border-sky-100 text-sky-950'
                }`}
              >
                {isCompleted && (
                  <span className={`absolute top-2.5 left-2.5 px-2 py-0.5 text-[9px] rounded-full font-black ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-green-100 text-green-700 border border-green-200'
                  }`}>
                    تم الاستماع ✓
                  </span>
                )}
                <div className="font-extrabold text-[13px] md:text-sm">{lesson.titleAr}</div>
                <div className={`mt-0.5 text-[10px] font-mono tracking-wide truncate ${isSelected ? 'text-white/80' : 'text-sky-400'}`}>
                  {lesson.titleEn}
                </div>
                <p className={`mt-2 text-[11px] leading-relaxed ${isSelected ? 'text-white/95 font-medium' : 'text-sky-700'}`}>
                  {lesson.descriptionAr}
                </p>
              </button>
            );
          })}
        </div>

        {/* Custom topic maker form */}
        <div className="bg-sky-50 border-3 border-sky-100 p-4 rounded-3xl space-y-3 mt-4 text-right">
          <div className="text-[10px] font-black text-sky-900 flex items-center justify-end gap-1 uppercase">
            موضوع مخصص بالذهن؟ 💡
          </div>
          <span className="text-[9px] text-sky-600 font-bold block leading-relaxed">
            اكتب أي موضوع تريده (مثال: بالمطار، التحدث مع طبيب) لتوليد درس تفاعلي وصوتي خاص بك فوراً:
          </span>
          <form onSubmit={handleGenerateCustomLesson} className="space-y-2">
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="مثال: Airport Check-in"
              className="w-full bg-white text-sky-950 border-2 border-sky-200 text-xs py-2 px-3 rounded-xl focus:outline-hidden text-right font-semibold"
            />
            <button
              type="submit"
              disabled={generatingCustom || !customTopic.trim()}
              className="w-full text-center text-[10px] font-black bg-orange-500 hover:bg-orange-600 disabled:bg-sky-200 text-white p-2.5 rounded-xl transition cursor-pointer"
            >
              {generatingCustom ? 'توليد جاري صوتاً ونصاً...' : 'توليد درس خاص ذكي! ✨'}
            </button>
          </form>
        </div>
      </div>

      {/* 2. Main Lesson Content Presentation Area */}
      <div className="md:col-span-3 space-y-6">
        {!selectedLesson ? (
          <div className="bg-white border-4 border-sky-200 rounded-[40px] p-10 flex flex-col items-center justify-center text-center space-y-5 min-h-[420px] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 rounded-full bg-yellow-100/50 blur-2xl pointer-events-none" />
            <div className="p-4 bg-sky-100 rounded-full text-sky-600 border-4 border-sky-50 shadow-inner">
              <BookOpen className="w-10 h-10" />
            </div>
            <h3 className="font-black text-sky-900 text-xl">اختر درساً للابتداء 📚</h3>
            <p className="text-sm font-semibold text-sky-700 max-w-sm">
              حدد أي شرح دراسي متاح في القائمة الجانبية. سأقوم بتوليد الشرح الأكاديمي المناسب وبث النطق الصوتي الفوري له.
            </p>
          </div>
        ) : loading ? (
          <div className="bg-white border-4 border-sky-200 rounded-[40px] p-16 flex flex-col items-center justify-center text-center space-y-5 min-h-[420px] shadow-xl relative overflow-hidden">
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orange-100/50 rounded-full blur-2xl pointer-events-none" />
            <div className="relative">
              <div className="w-16 h-16 border-4 border-sky-100 border-t-orange-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-orange-400 animate-pulse" />
              </div>
            </div>
            <h4 className="font-black text-sky-900">يقوم الأستاذ باسم بكتابة شرح الدرس المفصل...</h4>
            <p className="text-xs font-bold text-sky-500 max-w-xs">
              لحظات بسيطة، نولد لك الشرح والكلمات والترجمات بمساعدة الذكاء الاصطناعي التفاعلي المتميز.
            </p>
          </div>
        ) : lessonContent ? (
          <div className="space-y-6 bg-white border-4 border-sky-200 rounded-[40px] p-6 sm:p-8 hover:shadow-lg transition shadow-xl relative overflow-hidden">
            
            {/* Header with quick voice playback toolbar */}
            <div className="border-b-4 border-sky-50 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-white bg-yellow-400 border border-yellow-500 px-3 py-1 rounded-full uppercase tracking-widest inline-block select-none">
                  {selectedLesson.category.toUpperCase()}
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-sky-900">{lessonContent.titleAr}</h1>
                <p className="text-xs sm:text-sm font-black text-sky-400 uppercase tracking-widest font-mono text-left" style={{ direction: 'ltr' }}>
                  {lessonContent.titleEn}
                </p>
              </div>

              {/* Dynamic Audio Controls */}
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                {isClassSpeaking && (
                  <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 p-2 px-3 rounded-2xl select-none">
                    <span className="text-[9px] font-black text-orange-850 uppercase">الأستاذ باسم يتحدث...</span>
                    <div className="flex items-end gap-1 h-3.5 w-10 justify-center">
                      <span className="w-0.5 bg-orange-500 rounded-full h-3 animate-pulse" />
                      <span className="w-0.5 bg-orange-500 rounded-full h-1.5 animate-bounce" />
                      <span className="w-0.5 bg-orange-500 rounded-full h-4 animate-pulse" />
                      <span className="w-0.5 bg-orange-500 rounded-full h-2 animate-bounce" />
                      <span className="w-0.5 bg-orange-500 rounded-full h-3 animate-pulse" />
                    </div>
                  </div>
                )}
                
                {isClassSpeaking ? (
                  <button
                    type="button"
                    onClick={stopOralClass}
                    className="flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-black bg-red-500 hover:bg-red-600 text-white transition shadow-[0_4px_0_rgb(153,27,27)] active:translate-y-1 active:shadow-none cursor-pointer"
                  >
                    <Square className="w-4 h-4 fill-current text-white" />
                    إيقاف الشرح الصوتي ⏹
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={playWholeLessonOral}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black bg-orange-500 hover:bg-orange-600 text-white transition shadow-[0_4px_0_rgb(194,65,12)] active:translate-y-1 active:shadow-none cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 text-white" />
                    شغّل الشرح الصوتي للدرس 🔊
                  </button>
                )}
              </div>
            </div>

            {/* Arabic Detailed Teacher explanation */}
            <div className="space-y-3 bg-sky-50 border-4 border-sky-200/50 p-6 rounded-3xl relative">
              <h3 className="font-black text-sky-900 flex items-center justify-end gap-1.5 text-sm">
                شرح المعلم باسم للدرس (Teacher Explanation)
                <Sparkles className="w-4 h-4 text-orange-400" />
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-sky-950 leading-relaxed whitespace-pre-line text-justify">
                {lessonContent.explanationAr}
              </p>
            </div>

            {/* Key Takeaways */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-sky-900 text-sm">خلاصة القواعد الهامة (Key Takeaways):</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {lessonContent.keyTakeaways.map((takeaway, index) => (
                  <div key={index} className="bg-sky-50/50 border-3 border-sky-100 p-5 rounded-3xl flex flex-col justify-between space-y-4">
                    <span className="bg-orange-400 text-white font-black text-xs w-6 h-6 rounded-full flex items-center justify-center shadow-md shrink-0">
                      {index + 1}
                    </span>
                    <p className="text-xs font-bold text-sky-950 leading-relaxed text-right">
                      {takeaway}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Vocabulary Terms (Each term has a direct speaker voice synthesis button) */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-sky-900 text-sm">المفردات والمصطلحات المكتسبة (Vocabulary Practice):</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {lessonContent.vocabulary.map((vocab, index) => (
                  <div key={index} className="border-4 border-sky-100 bg-white hover:border-sky-300 p-4 rounded-3xl transition relative space-y-3 flex flex-col justify-between shadow-xs">
                    <div className="flex items-start justify-between">
                      <button
                        type="button"
                        onClick={() => playVocabularySound(vocab.word)}
                        className={`p-2.5 rounded-xl transition duration-150 cursor-pointer ${
                          speakingWord === vocab.word 
                            ? 'bg-orange-500 text-white animate-pulse' 
                            : 'bg-sky-100 text-sky-700 hover:bg-orange-100 hover:text-orange-950'
                        }`}
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <div className="text-right">
                        <span className="font-black text-sm text-sky-900 select-all font-mono block">
                          {vocab.word}
                        </span>
                        <span className="text-[10px] text-sky-400 font-bold bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                          {vocab.pronunciationHint}
                        </span>
                      </div>
                    </div>

                    <div className="bg-sky-50 p-4 rounded-2xl border-2 border-dashed border-sky-200 space-y-1.5">
                      <span className="text-xs font-extrabold text-orange-950 block text-right">
                        {vocab.translationAr}
                      </span>
                      <p className="text-[11px] font-bold text-sky-850 text-left font-mono italic" style={{ direction: 'ltr' }}>
                        "{vocab.exampleSentence}"
                      </p>
                      <p className="text-[10px] text-sky-450 font-bold block text-right">
                        ({vocab.exampleTranslationAr})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dual Language Interactive dialogue (if preset) */}
            {lessonContent.dialogue && lessonContent.dialogue.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-extrabold text-sky-900 text-sm">محادثة تفاعلية للممارسة سماعياً (Interactive Practice Dialogue):</h3>
                <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider">انقر فوق أي جملة حوارية لسماع طريقة نطقها من المتحدثين المذكورين.</p>
                <div className="border-4 border-sky-100 bg-white rounded-3xl overflow-hidden divide-y-2 divide-sky-50">
                  {lessonContent.dialogue.map((dial, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => playSentenceSound(dial.text)}
                      className="p-4 hover:bg-sky-50/50 transition cursor-pointer flex items-center justify-between gap-4 text-right"
                    >
                      <button type="button" className="p-1.5 px-3 rounded-xl bg-sky-100 hover:bg-orange-100 text-[10px] font-black text-sky-700 hover:text-orange-950 flex items-center gap-1 shrink-0">
                        <Play className="w-2.5 h-2.5 fill-current" />
                        استمع للنطق
                      </button>
                      <div className="flex-1">
                        <span className="text-xs font-black text-orange-500 font-mono inline-block bg-orange-50 px-2.5 py-0.5 rounded-full">
                          {dial.speaker}
                        </span>
                        <p className="font-mono text-xs font-bold text-sky-950 text-left my-1" style={{ direction: 'ltr' }}>
                          {dial.text}
                        </p>
                        <p className="text-[11px] font-semibold text-sky-700">
                          {dial.translationAr}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pronunciation tips section */}
            <div className="space-y-2 border-t-4 border-sky-50 pt-5">
              <h3 className="font-extrabold text-sky-900 text-sm">نصيحة المعلم للتحدث والنطق السليم 🗣:</h3>
              <p className="text-xs sm:text-sm font-semibold text-orange-950 bg-orange-50 p-5 rounded-3xl border-2 border-orange-200 leading-relaxed text-justify">
                {lessonContent.pronunciationTipsAr}
              </p>
            </div>

            {/* Launch exercises banner */}
            <div className="bg-gradient-to-r from-sky-900 to-sky-950 text-white border-4 border-sky-300 rounded-[30px] p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 relative shadow-lg">
              <div className="space-y-1 text-center sm:text-right">
                <h4 className="font-black text-sm sm:text-base">جاهز لاختبار مهاراتك في هذا الدرس؟ 🚀</h4>
                <p className="text-xs font-medium text-sky-200">لقد أكملت استماع الشرح بنجاح، دعنا نوجه لك تمارين ومحاكاة النطق الآن.</p>
              </div>
              <button
                type="button"
                onClick={() => onSelectExercises(selectedLesson.titleEn, selectedLesson.category)}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black bg-orange-500 hover:bg-orange-600 text-white transition shadow-[0_4px_0_rgb(194,65,12)] active:translate-y-1 active:shadow-none cursor-pointer shrink-0"
              >
                انتقل لحل تمارين الدرس
                <ArrowRight className="w-4 h-4 text-white rotate-180" />
              </button>
            </div>

          </div>
        ) : null}
      </div>

    </div>
  );
}
