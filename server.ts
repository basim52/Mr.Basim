import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini client
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required to run the AI Tutor");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// Global toggle helper to check whether Gemini Key exists
const hasApiKey = () => !!process.env.GEMINI_API_KEY;

// 1. Health & Config endpoint
app.get("/api/config", (req, res) => {
  res.json({
    active: hasApiKey(),
    message: hasApiKey() ? "AI Live" : "Fallback Offline Mode (No API Key configured)"
  });
});

// Helper prompt generator to get stable JSON structure
async function generateJsonWithGemini(systemPrompt: string, userPrompt: string, outputSchema: any) {
  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: outputSchema,
        temperature: 0.7,
      }
    });

    const parsed = response.text;
    if (!parsed) {
      throw new Error("Empty response from AI model");
    }
    return JSON.parse(parsed.trim());
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
}

// ENDPOINT: Generate a highly detailed Lesson in Arabic
app.post("/api/tutor/explain", async (req, res) => {
  const { category, topic, difficulty } = req.body;
  
  if (!category || !topic || !difficulty) {
    return res.status(400).json({ error: "Missing category, topic, or difficulty" });
  }

  const systemPrompt = `You are Mr. Basim, an intelligent and enthusiastic English teacher with 15+ years of experience helping Arabic speakers master English. 
You explain concepts patiently, clearly, and contrast English grammar/patterns with equivalent Arabic structures so they can easily grasp them.
Your explanations are highly pedagogical, written in clear Arabic, with beautiful vocabulary, standard pronunciations spelled in Arabic letters and English syllables, and immersive dual-language examples.`;

  const userPrompt = `Create a complete comprehensive English lesson for level: ${difficulty}.
Category: ${category}
Topic: ${topic}
Make sure to explain detailed grammar and usage in Arabic, provide at least 4 practical vocabulary terms with their spellings/translated meanings, and insert an illustrative conversational dialogue (if conversational or pronunciation topic) or sentence examples.`;

  const lessonSchema = {
    type: Type.OBJECT,
    properties: {
      titleEn: { type: Type.STRING },
      titleAr: { type: Type.STRING },
      explanationAr: { type: Type.STRING, description: "Detailed concepts, rules, comparisons, and explanations in Arabic" },
      keyTakeaways: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "3 simple actionable grammar rules or bullet points"
      },
      vocabulary: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            translationAr: { type: Type.STRING },
            pronunciationHint: { type: Type.STRING, description: "Phonetic syllable guide or Arabic spelling of pronunciation" },
            exampleSentence: { type: Type.STRING },
            exampleTranslationAr: { type: Type.STRING }
          },
          required: ["word", "translationAr", "pronunciationHint", "exampleSentence", "exampleTranslationAr"]
        }
      },
      dialogue: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            speaker: { type: Type.STRING },
            text: { type: Type.STRING },
            translationAr: { type: Type.STRING }
          },
          required: ["speaker", "text", "translationAr"]
        }
      },
      pronunciationTipsAr: { type: Type.STRING, description: "Detailed advice on how to pronounce specific words or letters in this topic properly in Arabic" }
    },
    required: ["titleEn", "titleAr", "explanationAr", "keyTakeaways", "vocabulary", "pronunciationTipsAr"]
  };

  if (!hasApiKey()) {
    // Return custom fallback lesson data is API Key is not set
    return res.json(getFallbackLesson(category, topic, difficulty));
  }

  try {
    const data = await generateJsonWithGemini(systemPrompt, userPrompt, lessonSchema);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message, fallback: getFallbackLesson(category, topic, difficulty) });
  }
});

// ENDPOINT: Generate Exercises for a Lesson
app.post("/api/tutor/exercises", async (req, res) => {
  const { lessonTitle, category, difficulty } = req.body;

  const systemPrompt = `You are Mr. Basim, the Arabic-English Tutor. You generate exercises to test Arabic students on a specific English lesson.
You generate exactly 4 logical questions. The question text MUST be in English, but you must supply a supportive description or question instructions in Arabic so the student understands the drill.
Vary the exercises:
1 multiple-choice (grammar/vocab)
1 translation / text completion (Arabic to English or English to Arabic)
2 pronunciation/speaking practices (the student is prompted to speak a sentence aloud, focusing on pronunciation)`;

  const userPrompt = `Generate 4 educational exercises for level: ${difficulty}.
Lesson Name: ${lessonTitle}
Category: ${category}
Provide hints for each exercise to assist Arabic speaking students. Ensure type values are exactly one of: 'multiple-choice', 'text-input', 'voice-pronounce'.`;

  const exercisesSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        question: { type: Type.STRING, description: "The English question text or sentence to read aloud/translate/complete" },
        questionAr: { type: Type.STRING, description: "Brief Arabic instruction statement explaining what to do" },
        type: { type: Type.STRING, description: "Must be: multiple-choice, text-input, or voice-pronounce" },
        options: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Required ONLY if type is multiple-choice. Exactly 4 clear options"
        },
        correctAnswer: { type: Type.STRING, description: "Correct text or letter (like option string or spoken sentence)" },
        helperHintAr: { type: Type.STRING, description: "Direct hint explaining the rule briefly in Arabic" }
      },
      required: ["id", "question", "questionAr", "type", "correctAnswer", "helperHintAr"]
    }
  };

  if (!hasApiKey()) {
    return res.json(getFallbackExercises(lessonTitle, category, difficulty));
  }

  try {
    const data = await generateJsonWithGemini(systemPrompt, userPrompt, exercisesSchema);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message, fallback: getFallbackExercises(lessonTitle, category, difficulty) });
  }
});

// ENDPOINT: Evaluate User Answer with detailed Arabic feedback
app.post("/api/tutor/correct-exercise", async (req, res) => {
  const { question, questionAr, type, correctAnswer, userAnswer } = req.body;

  if (userAnswer === undefined || userAnswer === null) {
    return res.status(400).json({ error: "Missing userAnswer" });
  }

  // Double check basic matching for client ease before calling LLM
  let localCorrect = false;
  if (type === 'multiple-choice') {
    localCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
  }

  if (!hasApiKey()) {
    const isCorrect = localCorrect || userAnswer.toLowerCase().replaceAll(/[^a-zA-Z0-9]/g, "") === correctAnswer.toLowerCase().replaceAll(/[^a-zA-Z0-9]/g, "");
    return res.json({
      isCorrect,
      feedbackAr: isCorrect 
        ? "ممتاز! إجابتك صحيحة تماماً. استمر في هذا الأداء الرائع." 
        : `إجابة غير صحيحة بالكامل. الإجابة الصحيحة هي: "${correctAnswer}". انتبه للأخطاء الشائعة في النطق أو التهجئة.`,
      correctExplanationAr: "لا يتوفر اتصال بالذكاء الاصطناعي لتشريح الخطأ حالياً، تمت مراجعته محلياً بنجاح."
    });
  }

  const systemPrompt = `You are Mr. Basim. An expert English teacher correcting a student's answer.
Analyze the user's answer for an English exercise. Point out grammar errors, typos, spelling or phonetic mismatches (if voice input) and explain why gently in Arabic. Be encouraging! Always show deep pedagogical wisdom in Arabic.`;

  const userPrompt = `Exercise details:
- Question: "${question}"
- Type: "${type}"
- Correct Answer Expected: "${correctAnswer}"
- Student Answered: "${userAnswer}"

Analyze the student answered value. Decide if it is structurally / semantically correct or well-pronounced. Offer corrections and helpful tips in Arabic.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      isCorrect: { type: Type.BOOLEAN, description: "Whether the answer is logically of high accuracy" },
      feedbackAr: { type: Type.STRING, description: "Short motivational feedback in Arabic (e.g. أحسنت، ممتاز, or حاول مرة أخرى)" },
      correctExplanationAr: { type: Type.STRING, description: "Detailed friendly explanation in Arabic of why this is correct/wrong and what grammatical or spelling mistakes the student fell into" }
    },
    required: ["isCorrect", "feedbackAr", "correctExplanationAr"]
  };

  try {
    const data = await generateJsonWithGemini(systemPrompt, userPrompt, responseSchema);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({
      error: err.message,
      isCorrect: localCorrect,
      feedbackAr: "حدث خطأ أثناء تقييم الإجابة بفرع الذكاء الاصطناعي، تم تصحيحها محلياً.",
      correctExplanationAr: `الإجابة النموذجية هي: ${correctAnswer}`
    });
  }
});

// ENDPOINT: Generate English Test
app.post("/api/tutor/generate-test", async (req, res) => {
  const { category, difficulty } = req.body;

  const systemPrompt = `You are Mr. Basim. Generate an overall English assessment test for level: ${difficulty}.
The test consists of exactly 5 multiple choice questions on the subject: ${category}.
Provide varied questions assessing vocabulary, rules, syntax, and sentence correction. Each question needs logical choices A, B, C, D. Specify the correct letters 'A', 'B', 'C', or 'D'.`;

  const userPrompt = `Generate a 5-question multiple-choice test for level: ${difficulty} under category: ${category}.
Include translations of key English phrases in the explanations, and explain clearly in Arabic why the correct choice is correct and why other choices are wrong.`;

  const testSchema = {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      titleEn: { type: Type.STRING },
      titleAr: { type: Type.STRING },
      category: { type: Type.STRING },
      difficulty: { type: Type.STRING },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            questionAr: { type: Type.STRING, description: "Brief translation or Arabic context for the question if helpful" },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Four options, for instance: ['A) option 1', 'B) option 2', ...]"
            },
            correctAnswer: { type: Type.STRING, description: "Single character option name: A, B, C, or D" },
            explanationAr: { type: Type.STRING, description: "Detailed grammatical breakdown in Arabic" }
          },
          required: ["id", "question", "options", "correctAnswer", "explanationAr"]
        }
      }
    },
    required: ["id", "titleEn", "titleAr", "category", "difficulty", "questions"]
  };

  if (!hasApiKey()) {
    return res.json(getFallbackTest(category, difficulty));
  }

  try {
    const data = await generateJsonWithGemini(systemPrompt, userPrompt, testSchema);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message, fallback: getFallbackTest(category, difficulty) });
  }
});

// ENDPOINT: Conversational practice / Chat evaluation
app.post("/api/tutor/chat", async (req, res) => {
  const { messages, userLevel } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  const systemInstruction = `You are Mr. Basim, the friendly, patient English teacher. The student is practicing free verbal/written conversation with you.
Your student has an English level of: ${userLevel || 'Beginner'}.
You must adapt your speaking difficulty, sentence length, and vocabulary accordingly.
For each message, you will reply in English to keep the conversation going naturally, but also:
1. Provide a beautiful Arabic translation of your reply so they can verify if they understood correctly.
2. Review the student's *previous message* (if any) and check for ANY grammatical faults, wrong word usages, or spelling mistakes. If you spot them, formulate a gentle, highly coaching correction in Arabic. Explain the rule briefly so they learn.
3. If their sentence was flawless, congratulate them in Arabic!`;

  const chatSchema = {
    type: Type.OBJECT,
    properties: {
      replyEn: { type: Type.STRING, description: "Your conversational response in clear, level-appropriate English" },
      translationAr: { type: Type.STRING, description: "Translation of your reply into clear, natural Arabic" },
      correctionsAr: { type: Type.STRING, description: "Feedback on their previous English input: point out any errors politely, translate their wrong phrase, show correct version, and explain the rule in Arabic. If perfect, confirm: 'صياغتك ممتازة وخالية من الأخطاء!'" }
    },
    required: ["replyEn", "translationAr", "correctionsAr"]
  };

  if (!hasApiKey()) {
    // Return friendly local reply
    const lastUserMsg = messages[messages.length - 1]?.text || "";
    return res.json({
      replyEn: `That's very nice! I am glad to chat with you in English. Let's learn more about daily vocabulary. What did you eat for breakfast today?`,
      translationAr: "هذا لطيف جداً! أنا سعيد بالتحدث معك باللغة الإنجليزية. دعنا نتعلم المزيد عن المفردات اليومية. ماذا تناولت على الفطور اليوم؟",
      correctionsAr: lastUserMsg ? "صياغتك تبدو واضحة! (في الوضع التجريبي غير المتصل بالذكاء الاصطناعي، سنفترض دائمًا أن صياغتك رائعة للمحافظة على تشجيعك)." : ""
    });
  }

  try {
    // Format conversation history for Gemini
    const historyFormatted = messages.map((m: any) => `${m.sender === 'ai' ? 'Basim (Tutor)' : 'Student'}: ${m.text}`).join("\n");
    const userPrompt = `Conversation History:\n${historyFormatted}\n\nFormulate your next Basim responses matching the predefined schema.`;
    
    const data = await generateJsonWithGemini(systemInstruction, userPrompt, chatSchema);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({
      error: err.message,
      replyEn: "I hear you! Conversation practice is very important. Could you explain that once again or ask something else?",
      translationAr: "أنا أسمعك! ممارسة المحادثة مهمة جداً. هل يمكنك شرح ذلك مرة أخرى أو طرح سؤال مختلف؟",
      correctionsAr: "حدث خطأ بسيط في تحديث الاتصال بالمعلم الذكي."
    });
  }
});

// ENDPOINT: Generate Personalized Development / Study Plan
app.post("/api/tutor/generate-plan", async (req, res) => {
  const { goal, level, weakestSkill, weeksCount } = req.body;
  const actualWeeksCount = [2, 4, 8].includes(Number(weeksCount)) ? Number(weeksCount) : 2;

  if (!goal) {
    return res.status(400).json({ error: "Goal is required to formulate progress plan" });
  }

  const systemInstruction = `You are Mr. Basim, the expert, supportive English tutor. 
You are formulating a highly customized, structured ${actualWeeksCount}-week study and development plan (خطة تطوير دراسية) for an Arabic speaking student.
Their English level: ${level || 'Beginner'}.
Their identified weakest skill: ${weakestSkill || 'Grammar'}.
Their primary personal goal/objective: "${goal}".
You must write your entire output in a welcoming, encouraging, highly structured style in Arabic, except for English term examples where necessary.
Construct exactly ${actualWeeksCount} weeks. Every week should have exactly 2 or 3 highly specific, actionable focus tasks (focusTasks) with standard simulated estimated minutes.`;

  const planSchema = {
    type: Type.OBJECT,
    properties: {
      titleAr: { type: Type.STRING, description: "Direct, personal, and motivational title in Arabic, e.g., خطة باسم لتطوير المحادثة والتحضير لمقابلة عمل" },
      descriptionAr: { type: Type.STRING, description: "Motivational introduction addressing the student in Arabic and acknowledging their goal" },
      estimatedWeeks: { type: Type.INTEGER, description: `Exactly ${actualWeeksCount}` },
      dailyCommitmentMinutes: { type: Type.INTEGER },
      weeks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            weekNumber: { type: Type.INTEGER },
            titleAr: { type: Type.STRING, description: `Action theme of the week in Arabic` },
            focusTasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  taskNameAr: { type: Type.STRING, description: "Highly specific actionable task related to the application tabs, e.g., استمع لدرس المقابلة بالقسم الصوتي وانطق كلماتها" },
                  estimatedMinutes: { type: Type.INTEGER }
                },
                required: ["taskNameAr", "estimatedMinutes"]
              }
            },
            tipsAr: { type: Type.STRING, description: "Important pedagogical tip / advice in Arabic" }
          },
          required: ["weekNumber", "titleAr", "focusTasks", "tipsAr"]
        }
      },
      generalAdviceAr: { type: Type.STRING, description: "Warm, motivational concluding paragraph of advice in Arabic" }
    },
    required: ["titleAr", "descriptionAr", "estimatedWeeks", "dailyCommitmentMinutes", "weeks", "generalAdviceAr"]
  };

  if (!hasApiKey()) {
    return res.json(getFallbackPlan(goal, level, weakestSkill, actualWeeksCount));
  }

  try {
    const userPrompt = `Formulate a ${actualWeeksCount}-week study development plan for goal: "${goal}", level: "${level}", and weakest area: "${weakestSkill}". All properties in the response must be written in Arabic.`;
    const data = await generateJsonWithGemini(systemInstruction, userPrompt, planSchema);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message, fallback: getFallbackPlan(goal, level, weakestSkill, actualWeeksCount) });
  }
});


// ==========================================================
// FALLBACK DATA GENERATORS
// Used when GEMINI_API_KEY is not configured or fails
// ==========================================================

function getFallbackLesson(category: string, topic: string, difficulty: string) {
  return {
    titleEn: topic,
    titleAr: "شرح درس القواعد والعبارات الترحيبية",
    explanationAr: `مرحباً بك في درس مخصص لمهارة: ${category} بمستوى ${difficulty}. في هذا الدرس، سوف نلقي نظرة شاملة على كيفية استخدام الكلمات وصياغة الجمل بطريقة احترافية. 
عند التحدث باللغة الإنجليزية، يحتاج المتعلمون العرب للتخلص من التفكير باللغة العربية وترجمتها حرفياً. فمثلاً، صيغة الفعل تختلف بحسب الزمن والفاعل، والتعبير عن الرغبات يتم باستخدام أدوات الربط المناسبة.
تأكد من قراءة الكلمات بصوت مرتفع والتركيز على مخارج الحروف الشفوية لتبني لكنة سليمة.`,
    keyTakeaways: [
      "احرص على استخدام الفاعل والفاعل المساعد دائماً، على خلاف اللغة العربية التي تبدأ بالفعل مباشرة.",
      "الصفة في اللغة الإنجليزية تأتي قبل الموصوف دائماً (مثال: A red car وليس Car red).",
      "حروف الجر (in, on, at) تعتمد على النطاق الزمني والحدود الجغرافية بشكل دقيق."
    ],
    vocabulary: [
      {
        word: "Introduce",
        translationAr: "يُقدّم / يُعرّف",
        pronunciationHint: "إِنْ-تْرو-دْيوس [In-tro-duce]",
        exampleSentence: "Let me introduce myself to the class.",
        exampleTranslationAr: "اسمح لي أن أقدم نفسي للفصل الدراسي."
      },
      {
        word: "Accent",
        translationAr: "لهجة / لكنة النطق",
        pronunciationHint: "أَكْ-سِنْت [Ak-sent]",
        exampleSentence: "She speaks English with a beautiful accent.",
        exampleTranslationAr: "إنها تتحدث الإنجليزية بلكنة جميلة."
      },
      {
        word: "Grammar",
        translationAr: "قواعد اللغة",
        pronunciationHint: "غْرا-مَرْ [Gra-mar]",
        exampleSentence: "Understanding grammar helps you construct clear sentences.",
        exampleTranslationAr: "فهم القواعد يساعدك على بناء جمل واضحة."
      },
      {
        word: "Practice",
        translationAr: "يمارس / يتدرب",
        pronunciationHint: "بْراكْ-تِس [Prak-tis]",
        exampleSentence: "You must practice English speaking daily to improve.",
        exampleTranslationAr: "يجب عليك ممارسة التحدث بالإنجليزية يومياً للتحسن."
      }
    ],
    dialogue: [
      { speaker: "Basim", text: "Hello! My name is Basim. Nice to meet you.", translationAr: "أهلاً! اسمي باسم. سعيد بلقائك." },
      { speaker: "Student", text: "Nice to meet you too, teacher! I want to improve my speaking.", translationAr: "سعيد بلقائك أيضاً يا أستاذ! أود تحسين مهارة التحدث لدي." },
      { speaker: "Basim", text: "Excellent goal! Speak daily and don't be afraid to make mistakes.", translationAr: "هدف ممتاز! تحدّث يومياً ولا تخف من ارتكاب الأخطاء." }
    ],
    pronunciationTipsAr: "عند نطق الكلمات التي تحتوي على حرف P، احرص على إخراج دفعة هواء خفيفة من شفتيك لتمييزه عن حرف B الشائع في لغتنا العربية الصامتة."
  };
}

function getFallbackExercises(lessonTitle: string, category: string, difficulty: string) {
  return [
    {
      id: "ex_1",
      question: "She ____ to school every day on foot.",
      questionAr: "اختر الكلمة المناسبة لإكمال الفراغ (زمن المضارع البسيط):",
      type: "multiple-choice",
      options: ["go", "goes", "went", "going"],
      correctAnswer: "goes",
      helperHintAr: "الفاعل المفرد (She/He/It) يحتاج إضافة (s) أو (es) للفعل في صيغة المضارع البسيط."
    },
    {
      id: "ex_2",
      question: "ترجم الجملة التالية: 'أنا أتعلم اللغة الإنجليزية كل يوم'",
      questionAr: "اكتب الترجمة الصحيحة باللغة الإنجليزية في الفراغ:",
      type: "text-input",
      correctAnswer: "I learn English every day",
      helperHintAr: "ابدأ بالفاعل (I) ثم فعل التعلم (learn) ثم المفعول به والزمن."
    },
    {
      id: "ex_3",
      question: "Let me introduce myself.",
      questionAr: "انطق الجملة التالية بصوت واضح ولهجة صحيحة وسجل صوتك:",
      type: "voice-pronounce",
      correctAnswer: "Let me introduce myself.",
      helperHintAr: "ركز على دمج الحروف ونطق كلمة introduce كـ (إِنْ-تْرو-دْيوس) بطلاقة."
    },
    {
      id: "ex_4",
      question: "Practice makes perfect.",
      questionAr: "اقرأ هذه الحكمة الشائعة بصوت مرتفع للتدرب على مخارج الحروف الصائتة:",
      type: "voice-pronounce",
      correctAnswer: "Practice makes perfect.",
      helperHintAr: "هذه العبارة تعني 'التدريب يؤدي إلى الإتقان'."
    }
  ];
}

function getFallbackTest(category: string, difficulty: string) {
  return {
    id: "test_" + category + "_" + difficulty.toLowerCase(),
    titleEn: `${category.toUpperCase()} Assessment Test`,
    titleAr: `اختبار تقييم مستوى ${category === 'grammar' ? 'القواعد' : category === 'vocabulary' ? 'المفردات' : 'المحادثة'}`,
    category: category,
    difficulty: difficulty,
    questions: [
      {
        id: "q1",
        question: "If I ____ hard, I will pass the final English exam.",
        questionAr: "اختر الصيغة الصحيحة للشرط البسيط (First Conditional):",
        options: ["study", "will study", "studied", "studies"],
        correctAnswer: "study",
        explanationAr: "في جملة الشرط الأولى المبتدئة بـ If، يأتي الشرط في زمن المضارع البسيط (study) بينما تأتي جواب الشرط مع will."
      },
      {
        id: "q2",
        question: "We have been waiting for the bus ____ thirty minutes.",
        questionAr: "اختر حرف الجر الزمني الصحيح لتحديد المدة الزمنية المستغرقة:",
        options: ["since", "for", "at", "during"],
        correctAnswer: "for",
        explanationAr: "نستخدم 'for' للإشارة إلى طول المدة الزمنية المستغرقة (مثل 30 دقيقة)، بينما نستخدم since للإشارة إلى نقطة البداية."
      },
      {
        id: "q3",
        question: "Which word means: 'A physical state of being extremely tired'?",
        questionAr: "أي الكلمات الإنجليزية التالية تعني 'الحالة الجسدية للتعب الشديد والإنهاك'؟",
        options: ["Exhausted", "Excited", "Energized", "Excellent"],
        correctAnswer: "Exhausted",
        explanationAr: "كلمة Exhausted تعني منهك أو متعب للغاية، بينما Excited تعني متحمس، و Energized نشيط."
      },
      {
        id: "q4",
        question: "They ____ that famous English movie last week.",
        questionAr: "اختر الفعل الملائم للماضي البسيط المستدل عليه بكلمة 'last week':",
        options: ["watched", "watch", "had watched", "watching"],
        correctAnswer: "watched",
        explanationAr: "بما أن هناك دلالة زمنية ماضية صريحة 'last week' فإننا نستخدم الفعل في الماضي البسيط التصريف الثاني وهو 'watched'."
      },
      {
        id: "q5",
        question: "He is interested ____ learning English pronunciation.",
        questionAr: "ما هو حرف الجر الذي يأتي دائماً مصاحباً للصفة 'interested'؟",
        options: ["on", "in", "at", "with"],
        correctAnswer: "in",
        explanationAr: "الصفة 'interested' يتبعها حرف الجر 'in' دائماً لتعني (مهتم بـ)."
      }
    ]
  };
}

function getFallbackPlan(goal: string, level: string, weakestSkill: string, weeksCount: number = 2) {
  const normalizedLevel = level || "Beginner";
  const normalizedSkill = weakestSkill || "Grammar";

  // Detailed templates for up to 8 weeks per level
  const lessonsPool: { [key: string]: Array<{ titleAr: string; tipsAr: string; focusTasks: Array<{ taskNameAr: string; estimatedMinutes: number }> }> } = {
    Beginner: [
      {
        titleAr: "الأسبوع الأول: كسر الحاجز الصوتي والتأسيس اللفظي المباشر",
        tipsAr: "لا تقلق بشأن النبرة أو الأخطاء الهجائية البسيطة؛ الأهم حالياً هو بناء علاقة يومية مع النطق والحديث الشجاع.",
        focusTasks: [
          { taskNameAr: "استمع لدرس 'الروتين اليومي وبناء الجمل الترحيبية' بالقسم الصوتي", estimatedMinutes: 10 },
          { taskNameAr: "تكلم مع الأستاذ باسم في الدردشة بـ 3 جمل تفصيلية حول يومك", estimatedMinutes: 5 },
          { taskNameAr: "سجل نطق 3 عبارات أساسية in قسم التمارين والمايك", estimatedMinutes: 5 } // wait, let's keep original "في قسم"
        ]
      },
      {
        titleAr: "الأسبوع الثاني: بناء صياغة الجمل الإخبارية البسيطة والتقييم الأول",
        tipsAr: "الصفات تسبق الموصوف دائماً في الإنجليزية، مثل (a useful course) وليس (a course useful).",
        focusTasks: [
          { taskNameAr: "أتقن زمن المضارع البسيط والضمائر وحل التمارين التابعة له بالكامل", estimatedMinutes: 12 },
          { taskNameAr: "اجتاز اختبار القواعد الأساسية وحصد معدل اجتياز أكثر من 70%", estimatedMinutes: 10 }
        ]
      },
      {
        titleAr: "الأسبوع الثالث: أدوات الاستفهام والتساؤل الحواري التلقائي",
        tipsAr: "تذكر دائماً تغيير نبرة صوتك للأعلى قليلاً عند صياغة الأسئلة اللفظية لجعل الحوار تفاعلياً وطبيعياً.",
        focusTasks: [
          { taskNameAr: "استمع لدرس 'أدوات الاستفسار والأسئلة الشائعة في اللغة' بالقسم الصوتي", estimatedMinutes: 15 },
          { taskNameAr: "تبادل 4 أسئلة رد وإجابة مع الأستاذ باسم في المحادثة الحرة", estimatedMinutes: 8 }
        ]
      },
      {
        titleAr: "الأسبوع الرابع: توسيع دائرة مفردات العمل والبيئة والمأكولات اليومية",
        tipsAr: "التوجيه اللفظي المتواصل وتسمية الأشياء من حولك بالإنجليزية يرسخ الكلمات في عقلك الباطن.",
        focusTasks: [
          { taskNameAr: "حل بنك التمارين الخاص بـ 'المفردات اليومية وسياق المقاهي'", estimatedMinutes: 15 },
          { taskNameAr: "سجل نطق 5 مفردات جديدة بالمايك واحصد XP إضافي لتقوية مهارات مخارج الحروف", estimatedMinutes: 10 }
        ]
      },
      {
        titleAr: "الأسبوع الخامس: أزمنة التحدث البسيط (صيغ الماضي والمستقبل البسيط)",
        tipsAr: "استخدم الكلمات الدلالية مثل Yesterday و Tomorrow لمساعدة المستمع على تتبع خطك الزمني الحواري.",
        focusTasks: [
          { taskNameAr: "شاهد شرح الأستاذ باسم لـ 'زمن الماضي البسيط وصيغ الأفعال الشاذة'", estimatedMinutes: 12 },
          { taskNameAr: "قص قصة قصيرة جداً من 3 جمل عن أمسيتك الماضية لتبادل التصحيحات مع الأستاذ باسم", estimatedMinutes: 10 }
        ]
      },
      {
        titleAr: "الأسبوع السادس: الاستماع للأوصاف والنعوت وتحديد الكلمات المفتاحية",
        tipsAr: "الاستماع السلبي والتركيز على الكلمة الرئيسية بدلاً من ترجمة كل مفردة يرفع سرعة الاستدعاء التلقائي.",
        focusTasks: [
          { taskNameAr: "شغل التسجيل الصوتي لدرس 'الأوصاف الجسدية والمعنوية' وحل تدريب الاستماع", estimatedMinutes: 15 },
          { taskNameAr: "اختبر فهمك عبر ممارسة تمارين الربط اللغوي بالمايك صوتاً", estimatedMinutes: 10 }
        ]
      },
      {
        titleAr: "الأسبوع السابع: ضمائر الملكية وحروف الجر الشاملة (In, On, At)",
        tipsAr: "حروف الجر تعتمد على اتساع النطاق (In للعام والمدينة، On للشارع واليوم، At للساعة والموقع المحدد).",
        focusTasks: [
          { taskNameAr: "راجع بنية الشروحات التفصيلية لقواعد حروف الجر والاتجاهات بالقسم الصوتي", estimatedMinutes: 10 },
          { taskNameAr: "قم بصياغة فقرة تصف فيها موقع منزلك وعملك وعاود إرسالها مصححة بالدردشة", estimatedMinutes: 12 }
        ]
      },
      {
        titleAr: "الأسبوع الثامن: المراجعة التأسيسية الشاملة والتأهيل للمستوى المتوسط",
        tipsAr: "تهانينا! لقد تدرجت عبر 8 أسابيع كاملة. استمر بممارسة النطق 10 دقائق يومياً لتسييل ما تعلمته بطلاقة.",
        focusTasks: [
          { taskNameAr: "اجتاز اختبار تأهيل المستوى الشامل على منصة التقييمات واحصد أكثر من 85%", estimatedMinutes: 20 },
          { taskNameAr: "سجل رسالة صوتية ختامية طويلة بالمايك مهدياً إياها للمصحح التلقائي للأخطاء", estimatedMinutes: 10 }
        ]
      }
    ],
    Intermediate: [
      {
        titleAr: "الأسبوع الأول: سياق الجمل الظرفية وصياغة الحوار الطبيعي المترابط",
        tipsAr: "تجنب الترجمة العقلية المتتالية وحاول التحدث بالإنجليزية مباشرة عبر بناء تراكيب قصيرة وتلقائية.",
        focusTasks: [
          { taskNameAr: "استمع لشرح المستوى المتوسط بالقسم الصوتي حول 'أدوات الربط والظروف الزمانية'", estimatedMinutes: 12 },
          { taskNameAr: "اكتشف صياغة الحوار المتبادل بالدردشة الحرة مع المعلم باسم متحدثاً عن هواياتك", estimatedMinutes: 8 }
        ]
      },
      {
        titleAr: "الأسبوع الثاني: تركيبات الأزمنة التامة وعلامات الترقيم والتشديد اللفظي",
        tipsAr: "النطق الصحيح يعتمد على التشديد (Word Stress)؛ انتبه للمقطع المشدد بالكلمات الطويلة.",
        focusTasks: [
          { taskNameAr: "شاهد واقضِ 15 دقيقة في ممارسة زمن المضارع التام (Present Perfect) بالكامل", estimatedMinutes: 15 },
          { taskNameAr: "تحدَّ مهاراتك عبر محاولة إنهاء اختبار القواعد بتقدير جيد فما فوق لرفع نقاطك اللغوية", estimatedMinutes: 10 }
        ]
      },
      {
        titleAr: "الأسبوع الثالث: لغة المقابلات التفاعلية وعرض الخبرات المهنية الأساسية",
        tipsAr: "عبر عن إنجازاتك السابقة باستخدام أفعال قوية ذات أثر (Action Verbs) مثل Managed, Built, Solved.",
        focusTasks: [
          { taskNameAr: "استمع لدرس 'التقديم اللبق ومصطلحات السيرة الذاتية وعرض الملفات' صوتاً بتمعن", estimatedMinutes: 15 },
          { taskNameAr: "جرّب سيناريو مقابلة عمل تجريبي مع الأستاذ باسم وأرسل إجاباتك المهنية فوراً للتقييم", estimatedMinutes: 10 }
        ]
      },
      {
        titleAr: "الأسبوع الرابع: توظيف أدوات المقارنة وتراكيب الجمل الموازية",
        tipsAr: "استخدام صيغ التفضيل والمقارنة يثري حوارك ويعطيك أسلوباً يعكس نضجاً فكرياً وموضوعية.",
        focusTasks: [
          { taskNameAr: "حل تمرين 'المقارنات اللغوية العميقة وصيغ التفضيل الأكثر دقة' بقسم التطبيقات", estimatedMinutes: 12 },
          { taskNameAr: "تمرن على نطق فقرة المقارنة بالمايك مستمعاً للتحليلات الصوتية المرجعية", estimatedMinutes: 10 }
        ]
      },
      {
        titleAr: "الأسبوع الخامس: التخلص من الترجمة الفورية والحديث المتدفق السلس",
        tipsAr: "تقنية Shadowing (محاكاة المتحدث الأصلي صوتاً ونبرة بالملي ثانية) تحسّن إيقاع التعبير لديك فوراً.",
        focusTasks: [
          { taskNameAr: "استمع لخطاب حواري متوسط السرعة بالتبويب الصوتي وعاود محاكاته حرفياً بالمايك", estimatedMinutes: 15 },
          { taskNameAr: "اطرح موضوع نقاش فلسفي خفيف مع الأستاذ باسم بالدردشة واستوعب تنقيحه لفقراتك", estimatedMinutes: 10 }
        ]
      },
      {
        titleAr: "الأسبوع السادس: المفردات المهنية والسياقات العملية المتنوعة (Business Vocab)",
        tipsAr: "تبنى العبارات الشائعة مثل 'Call it a day' أو 'Touch base' لتكسب لغتك طابعاً حيوياً ومناسباً للعمل.",
        focusTasks: [
          { taskNameAr: "ادرّس معجم الاقتصاد والأعمال وحل تمارين المفردات المركبة المخصصة له", estimatedMinutes: 15 },
          { taskNameAr: "صغ طلباً إدارياً أو بريد عمل رسمي للأستاذ باسم لمناقشة تعديله الإملائي والنحوي", estimatedMinutes: 10 }
        ]
      },
      {
        titleAr: "الأسبوع السابع: المبني للمجهول (Passive Voice) ودواعي استخدامه الفني",
        tipsAr: "نستعمل المبني للمجهول للتركيز على النتيجة أو العمل نفسه عندما يكون الفاعل واثقاً أو ثانوياً علمياً.",
        focusTasks: [
          { taskNameAr: "راجع بنية المبني للمجهول وقارنها بالجمل النشطة بالقسم الصوتي المخصص للقواعد", estimatedMinutes: 12 },
          { taskNameAr: "حول 5 جمل تفاعلية لصيغة المجهول في تمارين المستوى المتوسط بالكامل", estimatedMinutes: 12 }
        ]
      },
      {
        titleAr: "الأسبوع الثامن: الاختبار الشامل وبوابة العبور للأداء اللغوي المتقدم الدبلوماسي",
        tipsAr: "رائع! لقد أتممت خطة الثمانية أسابيع بجدارة. صرت الآن تملك ترسانة قوية تمكنك من صياغة آراء متكاملة.",
        focusTasks: [
          { taskNameAr: "اجتاز اختبار التقييم المتوسط النهائي الشامل بمعدل أعلى من 80%", estimatedMinutes: 20 },
          { taskNameAr: "خض حواراً مفتوحاً مدته 10 دقائق مع المعلم باسم طارحاً رأيك بأهمية التكنولوجيا العالمية", estimatedMinutes: 10 }
        ]
      }
    ],
    Advanced: [
      {
        titleAr: "الأسبوع الأول: تراكيب التناغم اللفظي والاصطلاحات الأصيلة (Idioms)",
        tipsAr: "الاستعمال المتزن للتعبيرات الاصطلاحية يعطي لغتك بعداً طبيعياً وذكياً يعبر عن إدراك عميق للثقافة اللغوية.",
        focusTasks: [
          { taskNameAr: "استمع لدرس 'التعبيرات الاصطلاحية الأكثر تداولاً في الشركات العظمى' بالقسم الصوتي", estimatedMinutes: 15 },
          { taskNameAr: "استعمل اصطلاحين في مناقشة علمية موضوعية مع الأستاذ باسم بالدردشة التفاعلية", estimatedMinutes: 10 }
        ]
      },
      {
        titleAr: "الأسبوع الثاني: القواعد المعقدة والجمل الشرطية المركبة (Conditionals & Past Perfect)",
        tipsAr: "صيغة الشرط الثالثة (Third Conditional) تفيدك في إبراز الندم أو مراجعة السيناريوهات التاريخية الافتراضية.",
        focusTasks: [
          { taskNameAr: "راجع أزمنة الماضي التام وقواعد الشرط المعقدة وحل تدريبات تصحيح الأخطاء", estimatedMinutes: 15 },
          { taskNameAr: "اجتاز التحدي الخاص بالقواعد المتقدمة في منصة الاختبارات وحافظ على الـ Streak", estimatedMinutes: 8 }
        ]
      },
      {
        titleAr: "الأسبوع الثالث: فن الإقناع والتقديم وبسط الرأي المهني والدبلوماسي",
        tipsAr: "استخدم كلمات الانتقال مثل 'On the other hand', 'Furthermore', 'Consequently' لربط أطروحتك بسلاسة كاتب.",
        focusTasks: [
          { taskNameAr: "استمع لدرس 'مهارات التفاوض الإداري ومخاطبة الجمهور' صوتاً بتركيز عميق", estimatedMinutes: 12 },
          { taskNameAr: "سجل بريزنتيشن لفظي تجريبي مدته دقيقة كاملة بالمايك مقيماً مخارج نطق الكلمات والوقفات", estimatedMinutes: 15 }
        ]
      },
      {
        titleAr: "الأسبوع الرابع: استراتيجيات التحدث شبه الأصلية وتبني اللهجات والتنغيم الفائق",
        tipsAr: "انتبه للتنغيم الصاعد والهابط (Intonation Rules) الذي يوضح مشاعرك الحقيقية وتصميم موقفك الحواري الحاد.",
        focusTasks: [
          { taskNameAr: "قّم بتحدي النطق السريع لتعبيرات الدمج الصوتي الصعبة خلف الأستاذ ببنك التمارين", estimatedMinutes: 15 },
          { taskNameAr: "أجرِ حواراً ساخناً مع الأستاذ باسم مدافعاً ومفنداً آراء لغوية معقدة بدون تلكؤ", estimatedMinutes: 12 }
        ]
      },
      {
        titleAr: "الأسبوع الخامس: الإيجاز اللغوي وصياغة الخطاب السريع (Elevator Pitch)",
        tipsAr: "الاختزال والإيجاز مع إيصال المعنى الكامل يدل على احترافية واثقة وتمكن بلاغي فائق في بيئات الأعمال الحديثة.",
        focusTasks: [
          { taskNameAr: "ادرس شروحات التعبير المختزل السريع لتوليد عروض الترويج بالأعمال بالقسم الصوتي", estimatedMinutes: 15 },
          { taskNameAr: "لخص مقولة معقدة وقدمها للأستاذ باسم من خلال الدردشة صوتاً وكتابة لتعديلها فوراُ", estimatedMinutes: 10 }
        ]
      },
      {
        titleAr: "الأسبوع السادس: تجنب الهفوات النحوية الدقيقة والاشتقاقات اللغوية المتقدمة",
        tipsAr: "الانتقالات بين الأسماء والصفات والأفعال المشتقة تزيد من تعبيرك مرونة وتنوعاً هيكلياً مذهلاً.",
        focusTasks: [
          { taskNameAr: "راجع بنك صياغة المشتقات النحوية الصعبة وحل التمارين التقويمية المعقدة المرفقة", estimatedMinutes: 15 },
          { taskNameAr: "نافس في تحدي محاكاة النطق الدقيق للتعابير العلمية النادرة واحصد نقاط XP ممتازة", estimatedMinutes: 12 }
        ]
      },
      {
        titleAr: "الأسبوع السابع: لغة الشؤون القانونية والمذكرات الإدارية والمالية الشاملة",
        tipsAr: "المصطلحات الفنية المحددة مثل 'Liabilities', 'Contractual obligations', 'Due diligence' تمنح لغتك طابعاً متمكناً.",
        focusTasks: [
          { taskNameAr: "استكشف معجم القانون والمالية بالقسم الصوتي واستوعب مرادفات التعبيرات الرسمية", estimatedMinutes: 15 },
          { taskNameAr: "أرسل مسودة بروتوكول تعاون مكتوب للأستاذ باسم بالدردشة ليقوم بضبط صياغته الدقيقة لك", estimatedMinutes: 12 }
        ]
      },
      {
        titleAr: "الأسبوع الثامن: مشروع التخرج الاحترافي المتكامل وإثبات الكفاءة الفائقة والمشروع اللفظي",
        tipsAr: "لقد وصلت إلى قمة السلم اللغوي الأكاديمي! تستطيع الآن تقديم عروض ومناقشة أي موضوع بكل ثقة وسلاسة.",
        focusTasks: [
          { taskNameAr: "اجتاز اختبار تأهيل الطلاقة الصعب الشامل لتقدير الكفاءة بمعدل يتخطى 90%", estimatedMinutes: 20 },
          { taskNameAr: "سجل خطاباً صوتياً طويلاً مدته دقيقتان يستعرض استراتيجيات تحول مستقبلي لمشروعك المهني", estimatedMinutes: 15 }
        ]
      }
    ]
  };

  // Select source lessons pool based on student's level
  const chosenLessons = lessonsPool[normalizedLevel] || lessonsPool.Beginner;

  // slice the array to match weeksCount (2, 4, or 8)
  const slicedWeeks = chosenLessons.slice(0, weeksCount).map((lesson, idx) => ({
    weekNumber: idx + 1,
    titleAr: lesson.titleAr,
    tipsAr: lesson.tipsAr,
    focusTasks: lesson.focusTasks.map(t => ({ ...t }))
  }));

  const titlesByLevel: { [key: string]: string } = {
    Beginner: `خطة باسم الاحترافية للتأسيس اللغوي الشامل لغرض: ${goal}`,
    Intermediate: `خطة باسم لطلاقة التعبير والتمكن المهني لغرض: ${goal}`,
    Advanced: `خطة باسم الدبلوماسية للتمكن القيادي للأعمال لغرض: ${goal}`
  };

  const descriptionsByLevel: { [key: string]: string } = {
    Beginner: `أهلاً بك يا بطل! لقد حللت هدفك الطموح وهو "${goal}". بمستواك التأسيسي (المبتدئ) وعبر تركيزنا على دمج ثغرة الحوار وصقل (${normalizedSkill})، قمنا بصياغة خطة تمتد لـ ${weeksCount} أسابيع متتالية لضمان بناء ثقة لفظية صلبة تكسر بها مخاوف التحدث.`,
    Intermediate: `سعيد بوجودك معنا! تحقيق هدفك المتمثل بـ "${goal}" يتطلب ترقية جودة جملك وتوسيع معجمك. قمنا بإعداد خطة محترفة على مدار ${weeksCount} أسابيع لتذليل التردد وتسريع صياغتك للأفكار بموازنات لغوية ذكية تركز على تقوية (${normalizedSkill}).`,
    Advanced: `نرحب بك في النطاق النخبوي القيادي! لتحقيق المردود الاحترافي لهدفك وهو "${goal}" ومعالجة جزئية (${normalizedSkill})، صممنا مساراً استراتيجياً مكثفاً لـ ${weeksCount} أسابيع لصقل فصاحة نبرتك، وضمان إعطاء دلالة قاطعة على التميز الحواري السريع والطلاقة الشبيهة بأهل اللغة.`
  };

  const adviceByLevel: { [key: string]: string } = {
    Beginner: "التكرار اللفظي اليومي والمثابرة على الاستماع للشروحات هما المفتاح الذهبي لبلوغ الطلاقة. الأخطاء هي مجرد علامات تدل على أنك تحاول وتتعلم كالمحترفين!",
    Intermediate: "اجعل هدفك الدائم هو التفكير اللغوي المباشر دون المرور بالترجمة العقلية. طريقة التعلم القائمة على التحدي اليومي هي الطريقة المعتمدة لنقل لغتك للمستوى التالي.",
    Advanced: "أنت الآن تبسط رأيك كقائد متمكن. انتبه للتفاصيل الصوتية والوقفات الإلقائية الذكية (Intonation Pauses) التي تزيد من هيبة وجاذبية حضورك الشامي والمهني."
  };

  return {
    titleAr: titlesByLevel[normalizedLevel] || titlesByLevel.Beginner,
    descriptionAr: descriptionsByLevel[normalizedLevel] || descriptionsByLevel.Beginner,
    estimatedWeeks: weeksCount,
    dailyCommitmentMinutes: normalizedLevel === "Beginner" ? 20 : normalizedLevel === "Intermediate" ? 25 : 30,
    weeks: slicedWeeks,
    generalAdviceAr: adviceByLevel[normalizedLevel] || adviceByLevel.Beginner
  };
}


// Start express + vite setup
async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`English Voice Tutor Server running on port ${PORT}`);
  });
}

startServer();
