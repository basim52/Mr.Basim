import React, { useState } from 'react';
import { StudentStats, StudentLevel } from '../types';
import { Award, Zap, BookOpen, Clock, Brain, User, ArrowLeftRight, TrendingUp, Sparkles, Flame, Trophy, Timer, Users, ChevronUp } from 'lucide-react';

interface DashboardProps {
  stats: StudentStats;
  onChangeLevel: (level: StudentLevel) => void;
  onResetStats: () => void;
}

export default function Dashboard({ stats, onChangeLevel, onResetStats }: DashboardProps) {
  const [trackingTab, setTrackingTab] = useState<'summary' | 'exercises' | 'tests'>('summary');
  const [sideTab, setSideTab] = useState<'profile' | 'leaderboard'>('profile');

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChangeLevel(e.target.value as StudentLevel);
  };

  const leaderboardData = [
    { name: 'سارة العلي 🥇', xp: 1250, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sara', isUser: false },
    { name: 'أحمد الشمري 🥈', xp: 950, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Ahmad', isUser: false },
    { name: 'منى العمري 🥉', xp: 680, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Mona', isUser: false },
    { name: 'أنت (البطل باسم) 🌟', xp: stats.xp, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=UserXP', isUser: true },
    { name: 'خالد منصور', xp: 140, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=KhaledCls', isUser: false },
    { name: 'سعاد رامي', xp: 80, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Suad', isUser: false },
  ].sort((a, b) => b.xp - a.xp);

  // Calculate some fun insights
  const lessonsCount = stats.lessonsTaken.length;
  const testsCount = Object.keys(stats.testScores).length;
  const avgTestScore = testsCount > 0 
    ? Math.round(Object.values(stats.testScores).reduce((a, b) => a + b, 0) / testsCount) 
    : 0;

  // Level translated terms
  const levelTranslations = {
    Beginner: 'مبتدئ (Beginner)',
    Intermediate: 'متوسط (Intermediate)',
    Advanced: 'متقدم (Advanced)',
  };

  return (
    <div id="student-dashboard" className="space-y-8 animate-fade-in text-right">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden bg-white border-4 border-sky-200 rounded-[40px] p-6 sm:p-8 shadow-xl">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-yellow-100/60 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-orange-100/60 blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-6 flex-1 text-center md:text-right">
            {/* Cute Professor Pip visual integration */}
            <div className="w-28 h-28 bg-sky-100 rounded-full p-1.5 border-4 border-sky-200 shadow-inner shrink-0 overflow-hidden relative">
              <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Teacher" alt="AI Tutor" className="w-full h-full scale-105" />
            </div>

            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-orange-100 text-orange-700 border-2 border-orange-200">
                <Zap className="w-3.5 h-3.5 fill-current" />
                أنت مستعد للتعلم اليوم!
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-sky-900 font-sans tracking-tight">
                مرحباً بك في كلاس مستشارك الإنجليزي الذكي! 👋
              </h1>
              <p className="text-sky-700 max-w-xl text-sm font-semibold leading-relaxed">
                أنا الأستاذ باسم، معلمك الشخصي لممارسة اللغة الإنجليزية بالصوت والتلقين. سأشرح لك القواعد، وأعطيك تمارين التحدث، وأصحّح أخطاءك فوراً لتبني طلاقة واثقة.
              </p>
            </div>
          </div>

          {/* Level Switchbox in Hero */}
          <div className="bg-sky-50 p-5 rounded-3xl border-4 border-sky-200 flex flex-col gap-2 min-w-[230px] shadow-sm relative z-10">
            <label className="text-xs font-black text-sky-800 block text-right">
              تغيير مستوى التدريس الحالي:
            </label>
            <div className="relative">
              <select
                id="difficulty-selector"
                value={stats.level}
                onChange={handleLevelChange}
                className="w-full bg-white text-sky-950 border-3 border-sky-200 text-xs font-black py-2.5 px-3 pr-8 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-orange-400 cursor-pointer appearance-none text-right font-sans shadow-xs"
              >
                <option value="Beginner">مستوى مبتدئ (Beginner)</option>
                <option value="Intermediate">مستوى متوسط (Intermediate)</option>
                <option value="Advanced">مستوى متقدم (Advanced)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2 text-sky-700">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[10px] text-sky-600 font-bold text-center mt-1">
              الدروس والاختبارات تتكيف تلقائياً مع هذا الاختيار.
            </div>
          </div>
        </div>
      </div>

      {/* Numerical Stats Bento Grid - Chunky Vibrant borders */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        <div className="bg-white rounded-3xl border-4 border-yellow-250 p-5 flex flex-col items-center justify-between text-center shadow-md hover:translate-y-[-2px] transition duration-200">
          <span className="text-3xl">⚡</span>
          <div className="text-xl font-black text-sky-900 mt-2">{stats.xp} XP</div>
          <span className="text-[10px] font-black text-sky-400 uppercase mt-1">XP Points</span>
          <p className="text-[11px] font-bold text-sky-700 mt-1">النقاط الكلية</p>
        </div>

        <div className="bg-white rounded-3xl border-4 border-green-250 p-5 flex flex-col items-center justify-between text-center shadow-md hover:translate-y-[-2px] transition duration-200">
          <span className="text-3xl">📚</span>
          <div className="text-xl font-black text-sky-900 mt-2">{lessonsCount} درساً</div>
          <span className="text-[10px] font-black text-sky-400 uppercase mt-1">Lessons Done</span>
          <p className="text-[11px] font-bold text-sky-700 mt-1">شروحات مستوعبة</p>
        </div>

        <div className="bg-white rounded-3xl border-4 border-pink-250 p-5 flex flex-col items-center justify-between text-center shadow-md hover:translate-y-[-2px] transition duration-200">
          <span className="text-3xl">🏆</span>
          <div className="text-xl font-black text-sky-900 mt-2">{testsCount} اختباراً</div>
          <span className="text-[10px] font-black text-sky-400 uppercase mt-1">Tests Passed</span>
          <p className="text-[11px] font-bold text-sky-700 mt-1">الامتحانات المنجزة</p>
        </div>

        <div className="bg-white rounded-3xl border-4 border-sky-250 p-5 flex flex-col items-center justify-between text-center shadow-md hover:translate-y-[-2px] transition duration-200">
          <span className="text-3xl">🎯</span>
          <div className="text-xl font-black text-sky-900 mt-2">{avgTestScore}%</div>
          <span className="text-[10px] font-black text-sky-400 uppercase mt-1">Accuracy</span>
          <p className="text-[11px] font-bold text-sky-700 mt-1">متوسط علاماتك</p>
        </div>

        <div className="bg-white rounded-3xl border-4 border-orange-200 p-5 flex flex-col items-center justify-between text-center shadow-md hover:translate-y-[-2px] transition duration-200">
          <span className="text-3xl animate-pulse">🔥</span>
          <div className="text-xl font-black text-orange-600 mt-2 font-mono">{stats.streak || 1} أيام</div>
          <span className="text-[10px] font-black text-orange-400 uppercase mt-1">Daily Streak</span>
          <p className="text-[11px] font-bold text-orange-700 mt-1">جذوة حماسك المتواصل</p>
        </div>

        <div className="bg-white rounded-3xl border-4 border-indigo-200 p-5 flex flex-col items-center justify-between text-center shadow-md hover:translate-y-[-2px] transition duration-200">
          <span className="text-3xl">⏱️</span>
          <div className="text-xl font-black text-indigo-600 mt-2 font-mono">{stats.totalStudyMinutes || 3} دقيقة</div>
          <span className="text-[10px] font-black text-indigo-400 uppercase mt-1">Study Time</span>
          <p className="text-[11px] font-bold text-indigo-700 mt-1">الزمن الإجمالي الفعلي</p>
        </div>

      </div>

      {/* Main Stats Layout: Skill progress & level details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Progress bars of academic skills */}
        <div className="md:col-span-2 bg-white border-4 border-sky-200 rounded-[40px] p-6 sm:p-8 text-right space-y-6 shadow-xl relative overflow-hidden">
          <div>
            <h2 className="text-xl font-black text-sky-900">مخطط مستواك في مهارات اللغة الأربعة 🎯</h2>
            <p className="text-xs font-black text-sky-400 uppercase tracking-widest mt-1">Skill accuracy & proficiency level tracker</p>
          </div>

          <div className="space-y-5">
            {/* Grammar */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-sky-900 bg-sky-100 px-2 py-0.5 rounded-md font-mono">{stats.skills.grammar}%</span>
                <span className="font-bold text-sky-800">قواعد التحدث والكتابة (Grammar)</span>
              </div>
              <div className="w-full bg-sky-100 p-1 h-6 border-2 border-sky-200 rounded-full overflow-hidden">
                <div 
                  className="bg-orange-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${stats.skills.grammar}%` }}
                />
              </div>
            </div>

            {/* Vocabulary */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-sky-900 bg-sky-100 px-2 py-0.5 rounded-md font-mono">{stats.skills.vocabulary}%</span>
                <span className="font-bold text-sky-800">حفظ المفردات والمصطلحات (Vocabulary)</span>
              </div>
              <div className="w-full bg-sky-100 p-1 h-6 border-2 border-sky-200 rounded-full overflow-hidden">
                <div 
                  className="bg-yellow-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${stats.skills.vocabulary}%` }}
                />
              </div>
            </div>

            {/* Speaking */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-sky-900 bg-sky-100 px-2 py-0.5 rounded-md font-mono">{stats.skills.speaking}%</span>
                <span className="font-bold text-sky-800">مخارج الحروف ونطق الكلمات وصوتك (Speaking)</span>
              </div>
              <div className="w-full bg-sky-100 p-1 h-6 border-2 border-sky-200 rounded-full overflow-hidden">
                <div 
                  className="bg-sky-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${stats.skills.speaking}%` }}
                />
              </div>
            </div>

            {/* Listening */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-sky-900 bg-sky-100 px-2 py-0.5 rounded-md font-mono">{stats.skills.listening}%</span>
                <span className="font-bold text-sky-800">الاستماع وفهم الكلام السريع (Listening)</span>
              </div>
              <div className="w-full bg-sky-100 p-1 h-6 border-2 border-sky-200 rounded-full overflow-hidden">
                <div 
                  className="bg-green-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${stats.skills.listening}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-3xl border-2 border-orange-200 text-xs font-semibold text-orange-950 leading-relaxed">
            💡 <strong>كيف تحسن تقييمك؟</strong> احضر الدروس بانتظام لتكسب نقاط Vocabulary وسجل إجاباتك بالمايك لتنمية تقييم الـ Speaking واجتاز الامتحانات لتحصل على درجات Grammar فائدة ومتقدمة.
          </div>
        </div>

        {/* Side Panel: Profile card & Reset */}
        <div className="bg-white rounded-[40px] border-4 border-sky-200 p-5 sm:p-6 shadow-xl text-right flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            
            {/* Toggle tabs for inside sidepanel */}
            <div className="flex bg-sky-50 p-1 rounded-2xl border-2 border-sky-100 gap-1">
              <button
                type="button"
                onClick={() => setSideTab('profile')}
                className={`flex-1 text-center py-2 text-xs font-black rounded-xl transition ${
                  sideTab === 'profile' ? 'bg-orange-500 text-white' : 'text-sky-700 hover:text-sky-900 hover:bg-sky-100/50'
                } cursor-pointer`}
              >
                أهدافي الدراسية 🎯
              </button>
              <button
                type="button"
                onClick={() => setSideTab('leaderboard')}
                className={`flex-1 text-center py-2 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 ${
                  sideTab === 'leaderboard' ? 'bg-orange-500 text-white' : 'text-sky-700 hover:text-sky-900 hover:bg-sky-100/50'
                } cursor-pointer`}
              >
                المتصدرون 🏆
              </button>
            </div>

            {sideTab === 'profile' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-end gap-3 bg-sky-50 p-3 rounded-2xl border-2 border-sky-100">
                  <div className="text-right">
                    <h3 className="font-extrabold text-sky-900 text-xs">الملف التعليمي للطالب</h3>
                    <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest">{stats.level} Level Goals</span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white border-3 border-sky-200 overflow-hidden shadow-xs flex items-center justify-center text-sky-700">
                    <User className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-sky-400 tracking-wider uppercase">أهداف مستواك الحالي:</h4>
                  
                  {stats.level === 'Beginner' && (
                    <ul className="text-xs text-sky-800 font-bold space-y-2 list-none">
                      <li className="flex items-center gap-1.5 justify-end"><span>بناء الجمل البسيطة بشكل صحيح.</span> <span className="text-orange-500">⭐</span></li>
                      <li className="flex items-center gap-1.5 justify-end"><span>حفظ الكلمات اليومية والمحاورات.</span> <span className="text-orange-500">⭐</span></li>
                      <li className="flex items-center gap-1.5 justify-end"><span>التعرف على نطق الكلمات الشائعة.</span> <span className="text-orange-500">⭐</span></li>
                    </ul>
                  )}

                  {stats.level === 'Intermediate' && (
                    <ul className="text-xs text-sky-800 font-bold space-y-2 list-none">
                      <li className="flex items-center gap-1.5 justify-end"><span>ممارسة محادثات السفر والتجارة.</span> <span className="text-orange-500">⭐</span></li>
                      <li className="flex items-center gap-1.5 justify-end"><span>تصريف الأفعال وتفريق الأزمنة.</span> <span className="text-orange-500">⭐</span></li>
                      <li className="flex items-center gap-1.5 justify-end"><span>تنغيم النطق وربط الكلمات بانتظام.</span> <span className="text-orange-500">⭐</span></li>
                    </ul>
                  )}

                  {stats.level === 'Advanced' && (
                    <ul className="text-xs text-sky-800 font-bold space-y-2 list-none">
                      <li className="flex items-center gap-1.5 justify-end"><span>فهم العامية وصيغ الأعمال المتقدمة.</span> <span className="text-orange-500">⭐</span></li>
                      <li className="flex items-center gap-1.5 justify-end"><span>نقاش مواضيع معقدة في القواعد.</span> <span className="text-orange-500">⭐</span></li>
                      <li className="flex items-center gap-1.5 justify-end"><span>تقليل اللكنة والتلقين السريع للغة.</span> <span className="text-orange-500">⭐</span></li>
                    </ul>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-right">
                  <h3 className="font-extrabold text-sky-900 text-xs">ترتيب طلاب دفعة باسم الأكاديمية</h3>
                  <span className="text-[9px] text-sky-400 font-bold">يزداد ترتيبك تلقائياً عند كسب XP!</span>
                </div>

                <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                  {leaderboardData.map((student, idx) => (
                    <div 
                      key={student.name}
                      className={`flex items-center justify-between p-2 rounded-xl border-2 text-xs transition duration-150 ${
                        student.isUser 
                          ? 'bg-orange-50 border-orange-300 text-orange-950 font-black animate-pulse' 
                          : 'bg-sky-50/50 border-sky-100 text-sky-900'
                      }`}
                    >
                      <span className="font-mono text-xs font-bold text-sky-655">{student.xp} XP</span>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[11px]">{student.name}</span>
                        <div className="w-7 h-7 rounded-full bg-white border border-sky-200 overflow-hidden shrink-0">
                          <img src={student.avatar} alt={student.name} className="w-full h-full" />
                        </div>
                        <span className="font-mono text-[10px] text-sky-400 font-bold ml-1">#{idx + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onResetStats}
            className="w-full text-center text-[10px] font-black text-red-500 hover:text-red-700 hover:bg-red-50 p-2.5 rounded-2xl border-2 border-dashed border-red-200 transition duration-150 cursor-pointer mt-2"
          >
            إعادة تعيين مستواي الدراسي والدرجات بالكامل 🔄
          </button>
        </div>
      </div>

      {/* Dynamic Progress Tracking & Performance Analytics Section */}
      <div id="progress-tracking" className="bg-white border-4 border-sky-200 rounded-[40px] p-6 sm:p-8 shadow-xl space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b-4 border-sky-50 pb-5">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-150 text-sky-800 border border-sky-250">
              <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
              نظام تتبع الأداء والتقارير الأكاديمية الذكية
            </span>
            <h2 className="text-xl font-black text-sky-900">تقرير تطور طلاقة الطالب وإنجازاته 📊</h2>
            <p className="text-xs font-bold text-sky-400 uppercase tracking-widest font-mono text-left" style={{ direction: 'ltr' }}>
              Comprehensive Progress & Strength Analysis
            </p>
          </div>
          
          {/* Tabs inside tracking system to browse records */}
          <div className="flex bg-sky-50 p-1.5 rounded-2xl border-2 border-sky-100 self-start">
            <button
              type="button"
              onClick={() => setTrackingTab('summary')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                trackingTab === 'summary' ? 'bg-orange-500 text-white shadow-xs' : 'text-sky-755 hover:text-sky-955'
              }`}
            >
              تقرير وتحليلات الأستاذ
            </button>
            <button
              type="button"
              onClick={() => setTrackingTab('exercises')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                trackingTab === 'exercises' ? 'bg-orange-500 text-white shadow-xs' : 'text-sky-755 hover:text-sky-955'
              }`}
            >
              سجل درجات التمارين ({stats.exerciseRecords?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setTrackingTab('tests')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                trackingTab === 'tests' ? 'bg-orange-500 text-white shadow-xs' : 'text-sky-755 hover:text-sky-955'
              }`}
            >
              سجل تقييم الاختبارات ({stats.testRecords?.length || 0})
            </button>
          </div>
        </div>

        {/* SUMMARY TAB */}
        {trackingTab === 'summary' && (() => {
          // Find highest and lowest skills for strengths & areas for improvement
          const skillsList = [
            { key: 'grammar', name: 'قواعد التحدث والكتابة (Grammar)', value: stats.skills.grammar, desc: 'تفهم صياغة الأفعال، وتراكيب الجمل، والأزمنة المركبة بوضوح.' },
            { key: 'vocabulary', name: 'حفظ المفردات والمصطلحات (Vocabulary)', value: stats.skills.vocabulary, desc: 'تستحضر المصطلحات والكلمات المعبرة وتوظفها بسياقاتها الصحيحة.' },
            { key: 'speaking', name: 'مخارج الحروف ونطق الكلمات (Speaking)', value: stats.skills.speaking, desc: 'تتميز بنطق صحيح، وتنغيم لغوي سليم يسهل فهمه على المستمع.' },
            { key: 'listening', name: 'الاستماع وفهم الكلام السريع (Listening)', value: stats.skills.listening, desc: 'تستوعب اللكنات المختلفة والتراكيب اللغوية المنطوقة بسرعة.' }
          ];

          const sortedSkills = [...skillsList].sort((a, b) => b.value - a.value);
          const strongestSkill = sortedSkills[0];
          const weakestSkill = sortedSkills[sortedSkills.length - 1];

          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Strength Card */}
                <div className="bg-green-50/70 border-4 border-green-250 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">🏆</span>
                    <span className="text-xs font-black text-green-700 bg-green-100 px-3 py-1 rounded-full uppercase border border-green-200">
                      قوة مهارات الطالب (Primary Strength)
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-sky-950">
                      {strongestSkill.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-green-600 font-mono">
                        {strongestSkill.value}%
                      </span>
                      <span className="text-xs text-sky-400 font-bold">مهارة الطلاقة الحالية</span>
                    </div>
                  </div>
                  <p className="text-xs font-semibold leading-relaxed text-sky-750">
                    {strongestSkill.desc} تقديرك ممتاز ومستواك واعد في هذا التخصص. ينصح باستعمال هذه المهارة كجسر لتطوير المهارات الأخرى والمداومة عليها بانتظام.
                  </p>
                </div>

                {/* Area for Improvement Card */}
                <div className="bg-orange-50/70 border-4 border-orange-250 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">💡</span>
                    <span className="text-xs font-black text-orange-700 bg-orange-100 px-3 py-1 rounded-full uppercase border border-orange-200">
                      مجال التحسين اللغوي (Opportunities for growth)
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-sky-950">
                      {weakestSkill.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-orange-600 font-mono">
                        {weakestSkill.value}%
                      </span>
                      <span className="text-xs text-sky-400 font-bold">بحاجة إلى تطوير وتدريب</span>
                    </div>
                  </div>
                  <p className="text-xs font-semibold leading-relaxed text-sky-750">
                    {weakestSkill.key === 'grammar' && 'ينصح بحل المزيد من الاختبارات الشاملة المخصصة للقواعد وتصريف الأفعال وتوليد تحديات قواعد جديدة.'}
                    {weakestSkill.key === 'vocabulary' && 'ينصح بالمرور بانتظام على علامة التبويب "شرح الدروس الصوتي" واستيعاب التعبيرات والمصطلحات الموضحة.'}
                    {weakestSkill.key === 'speaking' && 'ينصح بتشغيل وضع التمارين وممارسة نطق الجمل والكلمات باستعمال زر المايك للتلقين اللفظي المباشر.'}
                    {weakestSkill.key === 'listening' && 'ينصح بتشغيل التسجيلات الصوتية لشرح الأستاذ باسم والمحادثات المرفقة وتطوير طلاقة الفهم المتتالي.'}
                  </p>
                </div>

              </div>

              {/* General Performance Summary */}
              <div className="bg-sky-50 p-5 rounded-3xl border-2 border-sky-150 relative space-y-3 text-right">
                <h3 className="font-extrabold text-sky-900 flex items-center justify-end gap-2 text-xs">
                  كشف مستمر لأداء الطالب اللغوي العام:
                  <Sparkles className="w-4 h-4 text-orange-400" />
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-sky-955 leading-relaxed text-justify">
                  أهلاً بك يا بطل! بناءً على مراجعة أدائك الدراسي المسجل، تنامت نقاط مهاراتك الإجمالية لتبلغ <strong>{stats.xp} XP</strong> مما يمنحك رصيد حضور أكاديمي واعد. لقد أتممت حتى اللحظة الاستماع لـ <strong>{stats.lessonsTaken.length}</strong> درساً معقداً، وقمت بمحاولة إنجاز تمارين لغوية ومحادثات ومقاييس نطق متتالية بقسم الميكروفون.
                </p>
              </div>
            </div>
          );
        })()}

        {/* EXERCISES LOG TAB */}
        {trackingTab === 'exercises' && (
          <div className="space-y-4">
            {!stats.exerciseRecords || stats.exerciseRecords.length === 0 ? (
              <div className="text-center py-12 space-y-3 bg-sky-50/50 rounded-3xl border-2 border-dashed border-sky-150">
                <span className="text-3xl block">📝</span>
                <h4 className="font-extrabold text-sky-900 text-sm">لا توجد سجلات تمارين تفاعلية مسجلة بعد.</h4>
                <p className="text-xs text-sky-450">انتقل لعلامة التبويب "شرح الدروس الصوتي" وافتح درسك وسجل إجابتك بالمايك أو كيبوردك بالتمارين لتظهر درجاتك هنا!</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-3xl border-2 border-sky-100 max-h-[350px] overflow-y-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead className="bg-sky-50 text-sky-900 sticky top-0 font-extrabold">
                    <tr className="border-b border-sky-100">
                      <th className="p-4 text-right">اسم الدرس اللغوي</th>
                      <th className="p-4 text-right">التمرين (Question)</th>
                      <th className="p-4 text-right">جوابك المتلقى (Your Answer)</th>
                      <th className="p-4 text-center">حالة النتيجة</th>
                      <th className="p-4 text-left whitespace-nowrap">الوقت والDateTime</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sky-100 bg-white font-semibold text-sky-950">
                    {stats.exerciseRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-sky-50/40 transition duration-150">
                        <td className="p-4 font-black whitespace-nowrap">{rec.lessonTitle}</td>
                        <td className="p-4 font-mono text-left max-w-xs truncate" style={{ direction: 'ltr' }}>{rec.question}</td>
                        <td className="p-4 font-mono text-left max-w-xs truncate text-orange-600" style={{ direction: 'ltr' }}>{rec.userAnswer}</td>
                        <td className="p-4 text-center">
                          {rec.correct ? (
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full border border-green-200 text-[10px]">
                              صحيح ✓ (+25 XP)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-full border border-red-200 text-[10px]">
                              غير صحيح ✗
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-sky-400 whitespace-nowrap" style={{ direction: 'ltr', textAlign: 'left' }}>{rec.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TESTS LOG TAB */}
        {trackingTab === 'tests' && (
          <div className="space-y-4">
            {!stats.testRecords || stats.testRecords.length === 0 ? (
              <div className="text-center py-12 space-y-3 bg-sky-50/50 rounded-3xl border-2 border-dashed border-sky-150">
                <span className="text-3xl block">📋</span>
                <h4 className="font-extrabold text-sky-900 text-sm">لا توجد سجلات اختبارات مهارية مسجلة بعد.</h4>
                <p className="text-xs text-sky-450">توجه الآن لعلامة التبويب "منصة الاختبارات 🏆" واجتاز اختبار مستواك لتأهيل كشف نتائج التقييم!</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-3xl border-2 border-sky-100 max-h-[350px] overflow-y-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead className="bg-sky-50 text-sky-900 sticky top-0 font-extrabold">
                    <tr className="border-b border-sky-100">
                      <th className="p-4">نوع الاختبار المتخصص</th>
                      <th className="p-4 text-center">الدرجة المئوية (Score)</th>
                      <th className="p-4 text-center">التقييم المستمر</th>
                      <th className="p-4 whitespace-nowrap">الوقت والتاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sky-100 bg-white font-semibold text-sky-950">
                    {stats.testRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-sky-50/40 transition duration-150">
                        <td className="p-4 font-black">اختبار {rec.category === 'Grammar' ? 'قواعد اللغة (Grammar)' : rec.category === 'Vocabulary' ? 'المفردات والسياق (Vocabulary)' : 'الاستماع وفهم الكلام (Listening)'}</td>
                        <td className="p-4 text-center font-mono font-black text-sky-900 text-sm">{rec.score}%</td>
                        <td className="p-4 text-center">
                          {rec.score >= 80 ? (
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 font-bold px-2.5 py-1 rounded-full border border-green-200">
                              اجتياز ممتاز 🎖️
                            </span>
                          ) : rec.score >= 50 ? (
                            <span className="inline-flex items-center gap-1 bg-yellow-105 text-yellow-805 font-bold px-2.5 py-1 rounded-full border border-yellow-200">
                              مستوى جيد 👍
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-red-105 text-red-655 font-bold px-2.5 py-1 rounded-full border border-red-200">
                              تتطلب مراجعة وعودة ⚠️
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-sky-400 whitespace-nowrap" style={{ direction: 'ltr', textAlign: 'left' }}>{rec.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
