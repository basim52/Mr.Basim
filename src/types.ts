export type StudentLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface ExerciseRecord {
  id: string;
  lessonTitle: string;
  category: string;
  question: string;
  userAnswer: string;
  correct: boolean;
  timestamp: string;
}

export interface TestRecord {
  id: string;
  testId: string;
  category: string;
  score: number;
  timestamp: string;
}

export interface StudentStats {
  level: StudentLevel;
  xp: number;
  lessonsTaken: string[]; // List of lesson IDs taken
  testScores: { [testId: string]: number }; // Score percentage by test ID
  skills: {
    grammar: number; // 0 to 100
    vocabulary: number; // 0 to 100
    speaking: number; // 0 to 100
    listening: number; // 0 to 100
  };
  exerciseRecords?: ExerciseRecord[];
  testRecords?: TestRecord[];
  streak?: number;
  lastStudyDate?: string;
  totalStudyMinutes?: number;
}

export interface Lesson {
  id: string;
  titleAr: string;
  titleEn: string;
  category: 'grammar' | 'vocabulary' | 'conversation' | 'pronunciation';
  difficulty: StudentLevel;
  descriptionAr: string;
}

export interface LessonContent {
  titleEn: string;
  titleAr: string;
  explanationAr: string; // Detailed grammar or concept explanation in Arabic
  keyTakeaways: string[]; // Important rules
  vocabulary: {
    word: string;
    translationAr: string;
    pronunciationHint: string; // pronunciation spelling
    exampleSentence: string;
    exampleTranslationAr: string;
  }[];
  dialogue?: {
    speaker: string;
    text: string;
    translationAr: string;
  }[];
  pronunciationTipsAr: string;
}

export interface Exercise {
  id: string;
  question: string;
  questionAr: string;
  type: 'multiple-choice' | 'text-input' | 'voice-pronounce';
  options?: string[]; // For multiple choice
  correctAnswer: string; // Target value
  helperHintAr?: string;
  userAnswer?: string;
  isCorrect?: boolean;
  feedbackAr?: string;
}

export interface TestQuestion {
  id: string;
  question: string;
  questionAr?: string;
  options: string[];
  correctAnswer: string; // E.g. "A", "B", "C", "D" or the string text
  explanationAr: string;
}

export interface Test {
  id: string;
  titleEn: string;
  titleAr: string;
  category: string;
  difficulty: StudentLevel;
  questions: TestQuestion[];
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  translationAr?: string; // Optional arabic translation
  isVoice?: boolean;
  correctionsAr?: string; // Optional grammar/spelling correction feedback
  timestamp: string;
}
