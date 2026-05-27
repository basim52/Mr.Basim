import React, { useState, useEffect } from 'react';
import { StudentStats, StudentLevel } from '../types';
import { 
  Sparkles, 
  Calendar, 
  Target, 
  Award, 
  CheckCircle, 
  RefreshCw, 
  Zap, 
  Clock, 
  BookOpen, 
  Compass, 
  AlertCircle,
  Printer,
  ShieldCheck,
  ChevronDown,
  X,
  BadgeAlert,
  GraduationCap
} from 'lucide-react';

interface DevelopmentPlansProps {
  stats: StudentStats;
  onSetTab: (tabId: 'dashboard' | 'lessons' | 'exercises' | 'tests' | 'chat') => void;
}

interface PlanTask {
  taskNameAr: string;
  estimatedMinutes: number;
  completed?: boolean;
}

interface PlanWeek {
  weekNumber: number;
  titleAr: string;
  focusTasks: PlanTask[];
  tipsAr: string;
}

interface DevelopmentPlan {
  titleAr: string;
  descriptionAr: string;
  estimatedWeeks: number;
  dailyCommitmentMinutes: number;
  weeks: PlanWeek[];
  generalAdviceAr: string;
}

export default function DevelopmentPlans({ stats, onSetTab }: DevelopmentPlansProps) {
  const [goalInput, setGoalInput] = useState('');
  const [weeksCount, setWeeksCount] = useState<number>(2);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<DevelopmentPlan | null>(null);
  const [checkedTasks, setCheckedTasks] = useState<{ [key: string]: boolean }>({});
  const [activeWeekTab, setActiveWeekTab] = useState<number>(1);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // Determine weakest skill to formulate custom advice
  const getWeakestSkill = () => {
    const list = [
      { key: 'grammar', name: 'قواعد اللغة' },
      { key: 'vocabulary', name: 'المفردات والسياق' },
      { key: 'speaking', name: 'المخارج والنطق' },
      { key: 'listening', name: 'فهم الاستماع السريع' }
    ];
    // sort ascending to find the lowest percentage score
    list.sort((a, b) => stats.skills[a.key as 'grammar' | 'vocabulary' | 'speaking' | 'listening'] - stats.skills[b.key as 'grammar' | 'vocabulary' | 'speaking' | 'listening']);
    return list[0].name;
  };

  // Generate study plan
  const fetchStudyPlan = async (customGoal?: string, duration?: number) => {
    setLoading(true);
    const targetWeeks = duration || weeksCount;
    const targetGoal = customGoal || goalInput || getDefaultGoalByLevel(stats.level);
    const weakest = getWeakestSkill();

    try {
      const response = await fetch('/api/tutor/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goal: targetGoal,
          level: stats.level,
          weakestSkill: weakest,
          weeksCount: targetWeeks
        }),
      });
      const data = await response.json();
      if (data.error && data.fallback) {
        setPlan(data.fallback);
      } else {
        setPlan(data);
      }
      
      // Reset checklist state & reset active tab to first week
      setCheckedTasks({});
      setActiveWeekTab(1);
    } catch (err) {
      console.error("Failed to load development plan:", err);
    } finally {
      setLoading(false);
    }
  };

  // Default target goals for standard levels
  const getDefaultGoalByLevel = (lvl: StudentLevel) => {
    if (lvl === 'Beginner') return 'تأسيس مهارات التحدث اليومية وفهم القواعد بدون معوقات';
    if (lvl === 'Intermediate') return 'تطوير مخزون الكلمات وطلاقة النقاش الدبلوماسي والوظيفي';
    return 'احتراف النطق السريع واجتياز مقابلات العمل الأكاديمية بنجاح';
  };

  useEffect(() => {
    // Auto load default plan for the active level on start
    fetchStudyPlan(undefined, weeksCount);
  }, [stats.level, weeksCount]);

  // Toggle checklist item
  const handleToggleTask = (weekIndex: number, taskIndex: number) => {
    const key = `${weekIndex}_${taskIndex}`;
    setCheckedTasks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Calculate completion percentage
  const getCompletionRates = () => {
    if (!plan) return 0;
    let totalTasks = 0;
    let completedTasks = 0;
    plan.weeks.forEach((w, wIdx) => {
      w.focusTasks.forEach((t, tIdx) => {
        totalTasks++;
        if (checkedTasks[`${wIdx}_${tIdx}`]) {
          completedTasks++;
        }
      });
    });
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  const progress = getCompletionRates();
  const isPlanFullyCompleted = progress === 100;

  // Day-of-the-week recommendation table for professional outlook
  const weekdayCurriculum = [
    { day: "السبت", focus: "الاستماع الموجه ومصطلحات الشرح", desc: "ادرس شروحات الأستاذ باسم الصوتية ودوّن الكلمات الصعبة." },
    { day: "الأحد", focus: "الكتابة الديناميكية وتصحيح التراكيب", desc: "صغ 3 جمل حول طموحاتك بالقسم الحواري واكتشف التعديلات." },
    { day: "الإثنين", focus: "تحدي الميكروفون المباشر", desc: "افتح تمارين النطق الصوتي وانطق العبارات المخصصة 3 مرات." },
    { day: "الثلاثاء", focus: "المحادثة الصوتية التلقائية الحرة", desc: "أرسل مقاطع صوتية للأستاذ باسم بالدردشة لتسليط الضوء على لكنتك." },
    { day: "الأربعاء", focus: "القواعد المعقدة وأزمنة الصياغة", desc: "حل تمارين الجمل الموازية أو أزمنة الربط لضبط القواعد." },
    { day: "الخميس", focus: "الاختبار التقييمي الأسبوعي والـ XP", desc: "خض اختباراً لرفع رصيدك وتثبيت ما حفظته من مفردات." },
    { day: "الجمعة", focus: "الاسترخاء الصوتي والمراجعة الحرة", desc: "استمع لنقاش سريع بالخلفية بدون ضغوط، لتأهيل خطوتك القادمة." }
  ];

  return (
    <div className="space-y-6 text-right animate-fade-in pb-16">
      
      {/* Introduction Banner Card */}
      <div className="bg-gradient-to-l from-sky-950 via-sky-900 to-sky-850 text-white border-4 border-sky-700 rounded-[40px] p-6 sm:p-8 space-y-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 translate-x-[-15px] translate-y-[-10px] opacity-10 font-sans font-black text-8xl text-sky-100 select-none">
          PRO-PLAN
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-black">
              <Sparkles className="w-3.5 h-3.5" />
              منهج التطوير الاحترافي الشامل
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center justify-end gap-2 leading-tight">
              خرائط التطوير اللغوي وخطط المسار المهني 🎯
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-sky-200 leading-relaxed max-w-3xl">
              يوفر لك الأستاذ باسم خطط دراسة مكثفة تلائم أهدافك الوظيفية والأكاديمية. يمكنك هنا تحديد المدة الزمنية الأنسب واستخراج شهادة الكفاءة بعد إكمال المهام بنسبة 100%.
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-sky-850 border border-sky-700 text-sky-100 px-4 py-2 rounded-2xl text-xs font-black self-end">
              <Target className="w-4 h-4 text-orange-400" />
              نقطة الضعف الحالية: {getWeakestSkill()}
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 text-white px-4 py-2 rounded-2xl text-xs font-semibold self-end">
              المستوى النشط: <strong className="text-orange-400 capitalize">{stats.level}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Main content and Side widget controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main plan visualization view */}
        <div className="lg:col-span-2 space-y-6">
          
          {loading ? (
            <div className="bg-white border-4 border-sky-200 rounded-[40px] p-16 flex flex-col items-center justify-center text-center space-y-4 min-h-[420px] shadow-xl">
              <div className="w-14 h-14 border-4 border-sky-100 border-t-orange-500 rounded-full animate-spin" />
              <h4 className="font-black text-sky-950 text-base">جاري صياغة وتركيب منهجك اللغوي الاحترافي...</h4>
              <p className="text-xs font-bold text-sky-600 max-w-sm leading-relaxed">
                يقوم الأستاذ باسم حالياً بجدولة مهام مخصصة لمستواك ({stats.level}) لتذليل الصعاب في ({getWeakestSkill()}) بهندسة بيداغوجية متكاملة تضمن لك التفوق.
              </p>
            </div>
          ) : plan ? (
            <div className="bg-white border-4 border-sky-200 rounded-[40px] p-6 sm:p-8 space-y-6 shadow-xl relative">
              
              {/* Plan Title and basic stats */}
              <div className="border-b-4 border-sky-50 pb-5 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black bg-orange-500 text-white px-3 py-1 rounded-full font-mono uppercase">
                      مسار {stats.level} ⭐
                    </span>
                    <span className="text-xs font-black bg-sky-100 text-sky-800 px-3 py-1 rounded-full">
                      المدة: {plan.estimatedWeeks} أسابيع
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-black text-sky-700">
                    <Clock className="w-4 h-4 text-orange-400" />
                    <span>عبء العمل: {plan.dailyCommitmentMinutes} دقيقة يومياً</span>
                  </div>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-sky-950 leading-snug">
                  {plan.titleAr}
                </h3>
                
                <div className="bg-sky-50 border border-sky-100 p-4 rounded-3xl relative">
                  <div className="absolute top-2 left-3 transform scale-90 opacity-25">💬</div>
                  <p className="text-xs sm:text-sm font-bold text-sky-850 leading-relaxed">
                    <strong className="text-sky-950 block mb-1 text-sm">💡 تعقيب المعلم باسم:</strong> 
                    {plan.descriptionAr}
                  </p>
                </div>
              </div>

              {/* Progress & Graduation Reward Gateway */}
              <div className="bg-gradient-to-r from-orange-50/50 via-sky-50/60 to-white p-5 rounded-3xl border-2 border-sky-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center text-xs font-black text-sky-950 flex-wrap gap-2">
                  <span className="text-orange-600 bg-orange-100 px-3 py-1 rounded-full font-sans text-xs">
                    معدل الإنجاز الحالي: {progress}%
                  </span>
                  <span className="flex items-center gap-1.5 font-black text-sky-900">
                    <Zap className="w-4 h-4 text-orange-500" />
                    مقياس التخرج وحصاد الكفاءة المهنية
                  </span>
                </div>
                
                <div className="w-full bg-sky-100 h-4 rounded-full overflow-hidden border border-sky-200">
                  <div 
                    className="bg-gradient-to-l from-orange-500 to-amber-500 h-full rounded-full transition-all duration-300 shadow-inner"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {isPlanFullyCompleted ? (
                  <div className="bg-green-500 text-white p-4 rounded-2xl border-2 border-green-600 flex flex-col sm:flex-row items-center justify-between gap-4 animate-bounce mt-2 shadow-[0_4px_12px_rgba(34,197,94,0.3)]">
                    <div className="text-right space-y-1">
                      <h4 className="font-black text-sm flex items-center justify-end gap-1">
                        تهانينا الحارة! لقد أنجزت الخطة بنسبة 100% 🎉
                      </h4>
                      <p className="text-[11px] font-bold text-green-100">
                        أنت متميز وتستحق شهادة الكفاءة الصادرة وممهورة بتوقيع الأستاذ باسم. اعرضها الآن.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCertificateModal(true)}
                      className="bg-white hover:bg-slate-100 text-green-700 px-5 py-2.5 rounded-xl font-black text-xs transition shadow-md shrink-0 cursor-pointer flex items-center gap-1.5"
                    >
                      <Award className="w-4 h-4 text-amber-500 animate-pulse" />
                      عرض شهادة التميز 📜
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[11px] font-bold text-sky-650 justify-end">
                    <AlertCircle className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span>قم بمؤامرة المهام الدراسية وتجاوزها بالكامل لتوليد شهادة كفاءة مهنية مصدقة.</span>
                  </div>
                )}
              </div>

              {/* Dynamic Week Tabs */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                  <h4 className="font-black text-sky-950 text-sm">أضواء المنهج وجدول المهام الأسبوعية:</h4>
                  <span className="text-xs text-sky-400 font-bold">باقي المهام: {plan.weeks.map((w, wIdx) => w.focusTasks.filter((t, tIdx) => !checkedTasks[`${wIdx}_${tIdx}`]).length).reduce((a, b) => a + b, 0)}</span>
                </div>

                {/* Week selectors */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-start flex-row-reverse">
                  {plan.weeks.map((w, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveWeekTab(w.weekNumber)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                        activeWeekTab === w.weekNumber
                          ? 'bg-sky-900 text-white shadow-md'
                          : 'bg-sky-50 text-sky-800 hover:bg-sky-100 hover:text-sky-950'
                      }`}
                    >
                      الأسبوع {w.weekNumber}
                    </button>
                  ))}
                </div>

                {/* Active Week Container Content */}
                {plan.weeks.map((w, wIdx) => {
                  if (w.weekNumber !== activeWeekTab) return null;
                  return (
                    <div key={wIdx} className="border-3 border-sky-100 rounded-3xl p-5 bg-white space-y-4 animate-fade-in">
                      
                      <div className="flex items-center justify-between flex-wrap gap-2 border-b-2 border-sky-50 pb-2">
                        <span className="text-[10px] font-black bg-orange-100 text-orange-850 px-3 py-1 rounded-full">
                          تركيز الأسبوع {w.weekNumber}
                        </span>
                        <h4 className="font-black text-sky-950 text-sm sm:text-base">
                          {w.titleAr}
                        </h4>
                      </div>

                      {/* Focus tasks inside chosen week */}
                      <div className="space-y-3">
                        {w.focusTasks.map((t, tIdx) => {
                          const isChecked = checkedTasks[`${wIdx}_${tIdx}`];
                          return (
                            <div 
                              key={tIdx} 
                              onClick={() => handleToggleTask(wIdx, tIdx)}
                              className={`p-4 rounded-2xl border-2 transition duration-150 flex items-center justify-between gap-3 cursor-pointer select-none ${
                                isChecked 
                                  ? 'bg-green-50/50 border-green-300 text-green-950' 
                                  : 'bg-white border-sky-50 hover:border-sky-200 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isChecked ? (
                                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                                ) : (
                                  <div className="w-5 h-5 border-2 border-sky-200 rounded-full shrink-0 bg-white" />
                                )}
                                <span className={`text-xs sm:text-sm font-semibold ${isChecked ? 'line-through text-sky-400' : 'text-sky-950'}`}>
                                  {t.taskNameAr}
                                </span>
                              </div>
                              <span className="text-[10px] font-black font-mono text-sky-400 bg-sky-50 px-2.5 py-1 rounded-lg shrink-0">
                                ⏱️ {t.estimatedMinutes} دقيقة
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Weekly Pedagogical Tip */}
                      <div className="bg-orange-500/5 p-4 rounded-2xl border border-orange-500/20 text-xs text-justify leading-relaxed font-bold text-orange-950">
                        🎓 <strong className="text-orange-950 font-extrabold">نصيحة الأسبوع من باسم:</strong> {w.tipsAr}
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Day-by-Day Core Curriculum Recommendation Table (The Professional Touch) */}
              <div className="border-t-4 border-sky-50 pt-5 space-y-3">
                <h4 className="font-black text-sky-950 text-sm flex items-center justify-end gap-1.5">
                  خريطة الممارسة اليومية المقترحة 📅
                  <Calendar className="w-4 h-4 text-sky-500" />
                </h4>
                <p className="text-[11px] font-bold text-sky-600 leading-normal">
                  للحصول على توازن بيداغوجي ذكي، ينصح الأستاذ باسم بتوزيع تركيزك على النحو التالي طوال الأسبوع:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                  {weekdayCurriculum.map((item, idx) => (
                    <div key={idx} className="bg-sky-50/40 hover:bg-sky-50 border border-sky-100 p-3.5 rounded-2xl flex gap-3 text-right">
                      <div className="bg-sky-900 text-white font-mono px-2.5 py-1 rounded-xl text-center flex flex-col justify-center items-center h-fit shrink-0">
                        <span className="text-[10px] leading-none opacity-80">يوم</span>
                        <span className="text-xs font-black">{item.day}</span>
                      </div>
                      <div className="space-y-0.5">
                        <h5 className="text-xs font-black text-sky-950">{item.focus}</h5>
                        <p className="text-[10px] text-sky-700 leading-snug font-semibold">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conclusion advice from founder */}
              <div className="bg-sky-950 text-white p-6 rounded-3xl space-y-2 border-4 border-sky-700">
                <h4 className="font-extrabold text-white text-xs sm:text-sm flex items-center justify-end gap-1.5">
                  توجيهات باسم وخاتمة المنهج:
                  <Award className="w-4.5 h-4.5 text-orange-400" />
                </h4>
                <p className="text-xs font-semibold text-sky-100 leading-relaxed text-justify">
                  {plan.generalAdviceAr}
                </p>
              </div>

            </div>
          ) : null}

        </div>

        {/* Sidebar: Dynamic Controller & Premium customization triggers */}
        <div className="space-y-6">
          
          {/* Timeline and Plan Duration Controller */}
          <div className="bg-white border-4 border-sky-200 rounded-[30px] p-5 space-y-4 shadow-md text-right relative overflow-hidden">
            <span className="absolute top-2 left-2 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
            </span>
            
            <h3 className="font-black text-sky-950 text-xs flex items-center justify-end gap-1.5">
              تحديد مدة وثقـــل البرنامـــج ⏱️
            </h3>
            <p className="text-[11px] font-semibold text-sky-700 leading-relaxed">
              اختر المدى الزمني المناسب لالتزامك. البرامج الأطول تحتوي على مهام تخصصية متتالية وأهداف تمكين مهني شاملة.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[
                { count: 2, label: "أسبوعين", sub: "خط السريع" },
                { count: 4, label: "4 أسابيع", sub: "متوسط المدى" },
                { count: 8, label: "8 أسابيع", sub: "برنامج مهني" }
              ].map((t) => (
                <button
                  key={t.count}
                  type="button"
                  onClick={() => {
                    setWeeksCount(t.count);
                    fetchStudyPlan(goalInput, t.count);
                  }}
                  disabled={loading}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center ${
                    weeksCount === t.count
                      ? 'bg-sky-900 text-white border-sky-900 shadow-sm'
                      : 'bg-sky-50 text-sky-850 hover:bg-sky-100 border-sky-100'
                  }`}
                >
                  <span className="text-xs font-black font-mono">{t.label}</span>
                  <span className="text-[9px] font-bold opacity-80">{t.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Custom Goal formulation widget */}
          <div className="bg-white border-4 border-sky-200 rounded-[30px] p-5 space-y-4 shadow-md text-right">
            <h3 className="font-black text-sky-950 text-xs flex items-center justify-end gap-1.5">
              تفصيل منهــج ذكي بالذكــاء الاصطناعي 🚀
              <Sparkles className="w-4 h-4 text-orange-400" />
            </h3>
            <p className="text-[11px] font-semibold text-sky-700 leading-relaxed">
              اكتب هدفك اللغوي الدقيق (استعداد لعرض عمل، مبيعات، تسويق، أو كتابة أكاديمية) وسيفصل الأستاذ باسم المهام لك فوراً.
            </p>

            <div className="space-y-3">
              <input 
                type="text"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="مثال: اجتياز مقابلة عمل كمهندس برمجيات..."
                className="w-full bg-sky-50 border-2 border-sky-100 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-orange-400 font-mono text-right"
              />
              <button
                type="button"
                onClick={() => fetchStudyPlan(goalInput)}
                disabled={!goalInput.trim() || loading}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black transition shadow-[0_4px_0_rgb(194,65,12)] active:translate-y-1 active:shadow-none cursor-pointer disabled:opacity-40"
              >
                تحديث وتوليد خطة مهنية ⚡
              </button>
            </div>
          </div>

          {/* Preset Custom Career Goals & High-End Path Templates */}
          <div className="bg-white border-4 border-sky-200 rounded-[30px] p-5 space-y-3 shadow-md text-right">
            <h4 className="font-black text-sky-950 text-xs border-b border-sky-50 pb-1">نماذج النخبة للغايات المهنية</h4>
            
            <div className="space-y-2">
              {[
                { 
                  label: "💻 الإنجليزية التقنية ومقابلات المطورين", 
                  goal: "إتقان مصطلحات تكنولوجيا المعلومات، وتفسير خوارزميات العمل، والإجابة عن الأسئلة الصعبة بالمقابلات التقنية للهندسة والبرمجة بثقة تامة" 
                },
                { 
                  label: "📈 تقديم العروض (Pitching) والتفاوض", 
                  goal: "قيادة الاجتماعات التنفيذية وعرض حلول الشركات الكبرى وجذب التمويل الاستثماري بلكنة قيادية بليغة" 
                },
                { 
                  label: "🏅 الاستعداد لامتحاني TOEFL / IELTS", 
                  goal: "تفادي الأخطاء البنيوية بالكتابة الأكاديمية وصياغة الحجج المنطقية واجتياز اختبار المحادثة بتقدير شاهق" 
                },
                { 
                  label: "🗣️ الطلاقة الحرة وإيقاع أهل اللغة الأصلية", 
                  goal: "ترسيخ مخزون المفردات والتنغيم اللفظي والتفكير المباشر للتعبير دون فترات توقف أو ترجمة فكرية طويلة" 
                }
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setGoalInput(p.goal);
                    fetchStudyPlan(p.goal);
                  }}
                  disabled={loading}
                  className="w-full text-right p-3 rounded-2xl bg-sky-50 hover:bg-orange-100 hover:text-orange-950 transition block text-xs font-bold text-sky-850 cursor-pointer border border-sky-50"
                >
                  <div className="font-extrabold text-sky-950 text-xs mb-1">{p.label}</div>
                  <div className="text-[10px] text-sky-600 line-clamp-2 leading-relaxed">{p.goal}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick links to active tools */}
          <div className="bg-sky-50 border-3 border-sky-100 rounded-[30px] p-5 space-y-3 text-right">
            <h3 className="font-black text-sky-900 text-xs">سجل الملاحة والتواصل السريع</h3>
            <p className="text-[10px] text-sky-600 font-semibold leading-relaxed">
              انطلق لتبويبات نظام المحادثة والصوت لتنفيذ مهام أسبوعك وجمع نقاط الـ XP لتأهيل الشهادة:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onSetTab('lessons')}
                className="p-2.5 text-center bg-white text-sky-900 border border-sky-200 rounded-xl font-black text-[11px] hover:bg-orange-50 cursor-pointer"
              >
                المقاطع الصوتية 📚
              </button>
              <button
                type="button"
                onClick={() => onSetTab('exercises')}
                className="p-2.5 text-center bg-white text-sky-900 border border-sky-200 rounded-xl font-black text-[11px] hover:bg-orange-50 cursor-pointer"
              >
                المايك واللفظ 🎤
              </button>
              <button
                type="button"
                onClick={() => onSetTab('tests')}
                className="p-2.5 text-center bg-white text-sky-900 border border-sky-200 rounded-xl font-black text-[11px] hover:bg-orange-50 cursor-pointer"
              >
                منصة التقييم 🏆
              </button>
              <button
                type="button"
                onClick={() => onSetTab('chat')}
                className="p-2.5 text-center bg-white text-sky-900 border border-sky-200 rounded-xl font-black text-[11px] hover:bg-orange-50 cursor-pointer"
              >
                غرفة المحادثة 💬
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Graduation Excellence Certificate Modal View overlay */}
      {showCertificateModal && plan && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-amber-50/95 max-w-2xl w-full rounded-[30px] border-8 border-amber-300 p-6 sm:p-10 shadow-2xl relative text-right space-y-6 my-auto max-h-[90vh] overflow-y-auto">
            
            {/* Close button */}
            <button 
              type="button"
              onClick={() => setShowCertificateModal(false)}
              className="absolute top-4 left-4 bg-amber-900 hover:bg-amber-950 text-white rounded-full p-2.5 transition shrink-0 cursor-pointer focus:outline-hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Print Instruction hint overlay banner */}
            <div className="print:hidden text-center bg-sky-900 text-white text-xs py-2 px-4 rounded-xl font-bold flex items-center justify-center gap-2">
              <Printer className="w-4 h-4 text-orange-400" />
              <span>لحفظ الشهادة في جهازك، انقر على زر "طباعة الشهادة" واختر "Save as PDF"</span>
            </div>

            {/* Royal Cert inner framing */}
            <div id="verified-english-proficiency-certificate" className="border-4 border-amber-900/20 p-6 sm:p-10 space-y-8 bg-cream bg-center bg-no-repeat relative overflow-hidden rounded-[20px] bg-amber-50 shadow-inner">
              
              {/* Gold watermark icon */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 select-none pointer-events-none">
                <GraduationCap className="w-96 h-96 text-amber-905" />
              </div>

              {/* Header Certificate branding */}
              <div className="text-center space-y-2 relative z-10 border-b-2 border-amber-900/15 pb-4">
                <div className="inline-flex justify-center items-center p-2.5 bg-amber-900 text-amber-200 rounded-full mb-1">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="font-serif font-black text-amber-950 text-lg sm:text-2xl tracking-widest leading-none">
                  شهادة إجازة وإثبات كفاءة صوتية لغوية
                </h2>
                <p className="text-[10px] font-bold tracking-widest uppercase text-amber-800 font-mono">
                  ENGLISH VOICE TUTOR • FOUNDER MR. BASIM
                </p>
              </div>

              {/* Core Cert justification text */}
              <div className="text-center space-y-6 relative z-10">
                <p className="text-xs sm:text-sm font-bold text-amber-900">
                  تشهد كلية ومنصة المعلم الذكي التفاعلية بأن المستكشف المجتهد:
                </p>

                <h1 className="text-xl sm:text-3xl font-serif font-extrabold text-amber-950 border-b-2 border-amber-950/25 max-w-xs mx-auto pb-1 mt-2">
                  باسم مـستـكـشف اللـغـة التلقائي
                </h1>

                <p className="text-xs sm:text-sm font-bold text-amber-900 leading-relaxed max-w-md mx-auto">
                  قد اجتاز بنجاح منقطع النظير وبتقييم مبهر كافة الأطروحات اللفظية والدروس التكوينية لبرنامج التطوير المخصص تحت مسمى:
                </p>

                <div className="p-3 bg-white/70 rounded-xl border border-amber-905/30 max-w-md mx-auto">
                  <p className="text-xs sm:text-sm font-extrabold text-amber-950 italic">
                    " {plan.titleAr} "
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto text-xs py-2">
                  <div className="bg-amber-900/5 p-2 rounded-xl border border-amber-900/10 text-center">
                    <span className="block text-[10px] text-amber-700 font-bold">مستوى الطلاقة المحرز</span>
                    <strong className="text-sm font-black text-amber-950 capitalize">{stats.level}</strong>
                  </div>
                  <div className="bg-amber-900/5 p-2 rounded-xl border border-amber-900/10 text-center">
                    <span className="block text-[10px] text-amber-700 font-bold">مدة التكوين الكلي</span>
                    <strong className="text-sm font-black text-amber-950">{plan.estimatedWeeks} أسابيع</strong>
                  </div>
                </div>
              </div>

              {/* Cert footer signatures */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-amber-900/15 relative z-10">
                <div className="text-center space-y-1">
                  <span className="block text-[10px] text-amber-700 font-bold">توقيع المعلم والممتحن الرئيسي</span>
                  <div className="h-8 flex items-center justify-center font-serif text-sky-900 italic font-black text-xs">
                    Mr. Basim T. _/
                  </div>
                  <span className="block text-[9px] text-amber-900 font-black">الأستاذ باسم (كبير المدربين)</span>
                </div>
                <div className="text-center space-y-1">
                  <span className="block text-[10px] text-amber-700 font-bold">تاريخ الاعتماد اللغوي</span>
                  <div className="h-8 flex items-center justify-center font-mono text-amber-950 font-black text-xs">
                    {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  <span className="block text-[8px] font-mono text-amber-800 font-semibold tracking-wider">ID: KH-EProf-2026-{(1000 + stats.xp % 9000)}</span>
                </div>
              </div>

            </div>

            {/* Print trigger and instructions */}
            <div className="flex items-center justify-center gap-3 print:hidden">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="bg-amber-900 hover:bg-amber-950 text-white px-6 py-3 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Printer className="w-4 h-4 text-orange-400" />
                <span>طباعة الشهادة الرسمية</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCertificateModal(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-5 py-3 rounded-xl text-xs font-black transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
