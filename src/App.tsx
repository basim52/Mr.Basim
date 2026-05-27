/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StudentLevel, StudentStats } from './types';
import Dashboard from './components/Dashboard';
import LessonViewer from './components/LessonViewer';
import ExerciseList from './components/ExerciseList';
import TestViewer from './components/TestViewer';
import Chatroom from './components/Chatroom';
import DevelopmentPlans from './components/DevelopmentPlans';
import SmartDictionary from './components/SmartDictionary';
import { 
  GraduationCap, 
  BookOpen, 
  Flame, 
  Trophy, 
  MessageSquare, 
  BrainCircuit, 
  UserCheck, 
  Compass, 
  Info,
  Layers,
  Sparkles
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'english_tutor_voice_stats';

const DEFAULT_STATS: StudentStats = {
  level: 'Beginner',
  xp: 15, // start with a small welcome XP!
  lessonsTaken: [],
  testScores: {},
  skills: {
    grammar: 10,
    vocabulary: 15,
    speaking: 10,
    listening: 15,
  },
  streak: 1,
  lastStudyDate: new Date().toDateString(),
  totalStudyMinutes: 3
};

type TabId = 'dashboard' | 'lessons' | 'exercises' | 'tests' | 'chat' | 'plans';

export default function App() {
  const [stats, setStats] = useState<StudentStats>(DEFAULT_STATS);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  
  // Exercise routing from active lessons
  const [activeExerciseLesson, setActiveExerciseLesson] = useState<{
    title: string;
    category: string;
  } | null>(null);

  // Load stats from localStorage on start
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    let currentStats = DEFAULT_STATS;
    if (saved) {
      try {
        currentStats = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse local tutor stats:", e);
      }
    }
    
    // Streak calculations
    const today = new Date().toDateString();
    let updatedStreak = currentStats.streak || 1;
    let lastDate = currentStats.lastStudyDate || today;
    
    if (lastDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastDate === yesterday.toDateString()) {
        updatedStreak += 1;
      } else {
        updatedStreak = 1; // broken streak
      }
    }
    
    const initialStats = {
      ...currentStats,
      streak: updatedStreak,
      lastStudyDate: today,
      totalStudyMinutes: currentStats.totalStudyMinutes || 3
    };
    
    setStats(initialStats);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialStats));
  }, []);

  // Track study time dynamically (every 60 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => {
        const next = {
          ...prev,
          totalStudyMinutes: (prev.totalStudyMinutes || 0) + 1
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Save stats helper
  const saveStats = (newStats: StudentStats) => {
    setStats(newStats);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newStats));
  };

  const handleChangeLevel = (level: StudentLevel) => {
    saveStats({
      ...stats,
      level
    });
  };

  const handleResetStats = () => {
    if (confirm("هل أنت متأكد من إعادة ضبط مستواك وجميع درجاتك وبياناتك الدراسية السابقة؟")) {
      saveStats(DEFAULT_STATS);
      setActiveTab('dashboard');
      setActiveExerciseLesson(null);
    }
  };

  const handleMarkLessonCompleted = (lessonId: string) => {
    if (stats.lessonsTaken.includes(lessonId)) return;

    const updatedLessons = [...stats.lessonsTaken, lessonId];
    const newXp = stats.xp + 50; // +50 XP for listening to a lesson!
    
    // Increment general vocabulary/listening skills
    const updatedSkills = {
      ...stats.skills,
      vocabulary: Math.min(100, stats.skills.vocabulary + 5),
      listening: Math.min(100, stats.skills.listening + 3)
    };

    saveStats({
      ...stats,
      lessonsTaken: updatedLessons,
      xp: newXp,
      skills: updatedSkills
    });
  };

  const handleRecordExerciseResult = (
    lessonTitle: string,
    category: string,
    question: string,
    userAnswer: string,
    correct: boolean,
    amount: number,
    skillKey: 'grammar' | 'vocabulary' | 'speaking' | 'listening'
  ) => {
    // Add XP and increment specified skill if correct
    const newXp = stats.xp + (correct ? amount : 0);
    const currentSkillValue = stats.skills[skillKey];
    const updatedSkills = {
      ...stats.skills,
      [skillKey]: correct ? Math.min(100, currentSkillValue + 8) : currentSkillValue // +8% skill level increment per correct drill
    };

    const newRecord = {
      id: 'ex_rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      lessonTitle,
      category,
      question,
      userAnswer,
      correct,
      timestamp: new Date().toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    const existingRecords = stats.exerciseRecords || [];
    const updatedRecords = [newRecord, ...existingRecords];

    saveStats({
      ...stats,
      xp: newXp,
      skills: updatedSkills,
      exerciseRecords: updatedRecords
    });
  };

  const handleSetTestScore = (testId: string, percentage: number, skillType: 'grammar' | 'vocabulary' | 'speaking' | 'listening') => {
    const updatedScores = {
      ...stats.testScores,
      [testId]: percentage
    };

    // calculate XP reward (+10 XP per 10% scored. Meaning 100% gives +100 XP!)
    const xpReward = Math.round(percentage);
    const updatedXp = stats.xp + xpReward;

    // increment overall target skill on pass
    const targetSkillVal = stats.skills[skillType];
    const skillMultiplier = percentage >= 80 ? 15 : percentage >= 50 ? 5 : 0;
    
    const updatedSkills = {
      ...stats.skills,
      [skillType]: Math.min(100, targetSkillVal + skillMultiplier)
    };

    const newTestRecord = {
      id: 'test_rec_' + Date.now(),
      testId,
      category: skillType === 'grammar' ? 'Grammar' : skillType === 'vocabulary' ? 'Vocabulary' : skillType === 'speaking' ? 'Speaking' : 'Listening',
      score: percentage,
      timestamp: new Date().toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    const existingTestRecords = stats.testRecords || [];
    const updatedTestRecords = [newTestRecord, ...existingTestRecords];

    saveStats({
      ...stats,
      testScores: updatedScores,
      xp: updatedXp,
      skills: updatedSkills,
      testRecords: updatedTestRecords
    });
  };

  const handleLaunchExercisesForLesson = (lessonTitle: string, category: string) => {
    setActiveExerciseLesson({ title: lessonTitle, category });
    setActiveTab('exercises');
  };

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col font-sans select-text antialiased text-right" style={{ direction: 'rtl' }}>
      
      {/* 1. Main Application Header Desk */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b-4 border-sky-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Left: XP badges stats */}
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 border-2 border-orange-300 px-4 py-2 rounded-2xl flex items-center gap-2 text-orange-600 text-xs font-black">
              <Flame className="w-5 h-5 fill-current text-orange-500 animate-pulse" />
              <span>{stats.xp} XP</span>
            </div>
            
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">مستوى الطالب المفعّل</span>
              <span className="text-xs font-bold text-sky-800 font-sans">{stats.level}</span>
            </div>
          </div>

          {/* Right: Brand metadata title */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <h1 className="text-lg sm:text-2xl font-black text-sky-900 leading-tight">
                الأستاذ باسم English Buddy AI 🎙️
              </h1>
              <p className="text-[10px] sm:text-xs font-semibold text-sky-400 uppercase tracking-widest">
                معلمك الأكاديمي الصوتي الذكي بمؤثرات نابضة بالحياة
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-400 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 shrink-0">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
          </div>

        </div>
      </header>

      {/* 2. Main content container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Navigation tabs selector */}
        <div className="flex bg-white p-2 rounded-3xl border-4 border-sky-200 overflow-x-auto gap-2 shadow-md">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center justify-center gap-2 px-5 py-3 text-xs font-black rounded-2xl transition-all duration-150 shrink-0 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-orange-500 text-white shadow-[0_4px_0_rgb(194,65,12)] translate-y-[-2px]'
                : 'text-sky-700 hover:text-sky-900 hover:bg-sky-50'
            }`}
          >
            <Compass className="w-4 h-4" />
            لوحة التقييم والخبرة 🎯
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lessons')}
            className={`flex items-center justify-center gap-2 px-5 py-3 text-xs font-black rounded-2xl transition-all duration-150 shrink-0 cursor-pointer ${
              activeTab === 'lessons'
                ? 'bg-orange-500 text-white shadow-[0_4px_0_rgb(194,65,12)] translate-y-[-2px]'
                : 'text-sky-700 hover:text-sky-900 hover:bg-sky-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            شرح الدروس الصوتي 📚
          </button>

          <button
            type="button"
            onClick={() => {
              if (!activeExerciseLesson) {
                // If no specific lesson has been selected yet, use default placeholder
                setActiveExerciseLesson({
                  title: 'The Simple Present Tense',
                  category: 'grammar'
                });
              }
              setActiveTab('exercises');
            }}
            className={`flex items-center justify-center gap-2 px-5 py-3 text-xs font-black rounded-2xl transition-all duration-150 shrink-0 cursor-pointer ${
              activeTab === 'exercises'
                ? 'bg-orange-500 text-white shadow-[0_4px_0_rgb(194,65,12)] translate-y-[-2px]'
                : 'text-sky-700 hover:text-sky-900 hover:bg-sky-50'
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
            التمارين والميكروفون 🎤
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tests')}
            className={`flex items-center justify-center gap-2 px-5 py-3 text-xs font-black rounded-2xl transition-all duration-150 shrink-0 cursor-pointer ${
              activeTab === 'tests'
                ? 'bg-orange-500 text-white shadow-[0_4px_0_rgb(194,65,12)] translate-y-[-2px]'
                : 'text-sky-700 hover:text-sky-900 hover:bg-sky-50'
            }`}
          >
            <Trophy className="w-4 h-4" />
            منصة الاختبارات 🏆
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex items-center justify-center gap-2 px-5 py-3 text-xs font-black rounded-2xl transition-all duration-150 shrink-0 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-orange-500 text-white shadow-[0_4px_0_rgb(194,65,12)] translate-y-[-2px]'
                : 'text-sky-700 hover:text-sky-900 hover:bg-sky-50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            المحادثة الحرة والتصحيح 💬
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={`flex items-center justify-center gap-2 px-5 py-3 text-xs font-black rounded-2xl transition-all duration-150 shrink-0 cursor-pointer ${
              activeTab === 'plans'
                ? 'bg-orange-500 text-white shadow-[0_4px_0_rgb(194,65,12)] translate-y-[-2px]'
                : 'text-sky-700 hover:text-sky-900 hover:bg-sky-50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-orange-400" />
            خطط التطوير 🎯
          </button>
        </div>

        {/* 3. Render and Swap Active Views */}
        <div className="min-h-[450px]">
          {activeTab === 'dashboard' && (
            <Dashboard 
              stats={stats} 
              onChangeLevel={handleChangeLevel}
              onResetStats={handleResetStats}
            />
          )}

          {activeTab === 'lessons' && (
            <LessonViewer 
              level={stats.level} 
              stats={stats}
              onSelectExercises={handleLaunchExercisesForLesson}
              onMarkLessonCompleted={handleMarkLessonCompleted}
            />
          )}

          {activeTab === 'exercises' && activeExerciseLesson && (
            <ExerciseList 
              lessonTitle={activeExerciseLesson.title}
              category={activeExerciseLesson.category}
              level={stats.level}
              stats={stats}
              onRecordExerciseResult={handleRecordExerciseResult}
              onBackToLessons={() => setActiveTab('lessons')}
            />
          )}

          {activeTab === 'tests' && (
            <TestViewer 
              level={stats.level} 
              stats={stats}
              onSetTestScore={handleSetTestScore}
            />
          )}

          {activeTab === 'chat' && (
            <Chatroom 
              level={stats.level}
            />
          )}

          {activeTab === 'plans' && (
            <DevelopmentPlans 
              stats={stats}
              onSetTab={(tabId) => setActiveTab(tabId)}
            />
          )}
        </div>

      </main>

      {/* 4. Humble professional footer */}
      <footer className="bg-white border-t-4 border-sky-100 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs font-semibold text-sky-700 space-y-1">
          <p>أستاذ الإنجليزية الصوتي الذكي - مصمّم للطلاب والمتعلمين العرب لتبني مخارج حروف سليمة وقواعد دقيقة</p>
          <p className="font-mono text-sky-450 text-[10px]">© 2026 English Voice Tutor. Powered by Gemini AI with Vibrant Theme.</p>
        </div>
      </footer>

      {/* Floating Instant Translation Dictionary */}
      <SmartDictionary />

    </div>
  );
}
