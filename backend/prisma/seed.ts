/* eslint-disable no-console */
// Демо-seed: наполняет БД полным набором данных для показа всех фич.
//
// Запуск:  npm run seed   (или npx prisma db seed)
//
// ИДЕМПОТЕНТНОСТЬ: скрипт удаляет ТОЛЬКО свои данные (аккаунты *@skilleng.dev
// каскадом тянут курсы/уроки/вопросы/группы/ответы) + банк теста и темы,
// затем пересоздаёт всё заново. Чужие аккаунты не трогаются.
import "dotenv/config";
import { createHash } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import {
  CefrLevel,
  LearningGoal,
  Prisma,
  PrismaClient,
  QuestionType,
  Role,
  Skill,
  SnapshotLabel,
  Topic,
  TopicSkill,
  User,
} from "@prisma/client";
import * as bcrypt from "bcrypt";

import { LEVEL_DIFFICULTY_CENTER } from "../src/placement/placement.algorithm";
import { sm2Step } from "../src/vocabulary/srs.utils";
import { SeedQ, UNIT_QUESTIONS, questionsForUnits, UNIT_CONTENT, EXAM_SAFE_TYPES } from "./unit-bank";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const SEED_DOMAIN = "@skilleng.dev";
const PASSWORD = "Password123!";

const daysAgo = (n: number, hourOffset = 0): Date => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12 + hourOffset, 0, 0, 0);
  return d;
};

// Детерминированный "рандом" — одинаковый результат при каждом запуске
function det(seedStr: string): number {
  const h = createHash("sha256").update(seedStr).digest();
  return h.readUInt32BE(0) / 0xffffffff;
}

// ============================================================
// ============================================================
async function main() {
  console.log("Seeding SkillEng demo data…\n");

  // ---------- 0. Чистим прошлый seed ----------
  const old = await prisma.user.findMany({
    where: { email: { endsWith: SEED_DOMAIN } },
    select: { id: true },
  });
  if (old.length > 0) {
    await prisma.user.deleteMany({
      where: { email: { endsWith: SEED_DOMAIN } },
    });
    console.log(`✓ removed previous seed users (${old.length}, cascade)`);
  }
  await prisma.placementItem.deleteMany({});
  await prisma.topic.deleteMany({});

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // ---------- 1. Пользователи ----------
  const teacher = await prisma.user.create({
    data: {
      email: `teacher${SEED_DOMAIN}`,
      passwordHash,
      firstName: "Aigerim",
      lastName: "Teacher",
      role: Role.TEACHER,
      onboardingCompleted: true,
    },
  });

  const studentSpecs: {
    firstName: string;
    lastName: string;
    level: CefrLevel;
    goal: LearningGoal;
    accuracyTarget: number; // целевая доля правильных — для разнообразия heatmap
  }[] = [
    { firstName: "Dana", lastName: "Studentova", level: "B1", goal: "BUSINESS", accuracyTarget: 0.85 },
    { firstName: "Erlan", lastName: "Bekov", level: "A2", goal: "TRAVEL", accuracyTarget: 0.62 },
    { firstName: "Madina", lastName: "Serikova", level: "B2", goal: "EXAM_PREP", accuracyTarget: 0.91 },
    { firstName: "Timur", lastName: "Akhmetov", level: "B1", goal: "DAILY", accuracyTarget: 0.48 },
    { firstName: "Aliya", lastName: "Nurlanova", level: "A2", goal: "ACADEMIC", accuracyTarget: 0.73 },
    { firstName: "Sanzhar", lastName: "Omarov", level: "B1", goal: "BUSINESS", accuracyTarget: 0.33 },
  ];

  const students: User[] = [];
  for (const [i, s] of studentSpecs.entries()) {
    students.push(
      await prisma.user.create({
        data: {
          email: `${s.firstName.toLowerCase()}${SEED_DOMAIN}`,
          passwordHash,
          firstName: s.firstName,
          lastName: s.lastName,
          role: Role.STUDENT,
          level: s.level,
          goal: s.goal,
          nativeLanguage: ["ru", "kk", "ru", "kk", "ru", "kk"][i],
          interests: ["Movies", "Tech", "Travel"],
          onboardingCompleted: true,
          currentStreak: Math.floor(det(`streak${i}`) * 9),
          longestStreak: 10 + i,
          lastActiveDate: daysAgo(i % 3),
          createdAt: daysAgo(45),
        },
      }),
    );
  }
  console.log(`✓ users: 1 teacher + ${students.length} students`);

  // ---------- 2. Контейнеры курсов/уроков/вопросов ----------
  // Заполняются реальной программой English for IT (раздел 3b).
  // courseIdx: 0 = Semester 1, 1 = Semester 2
  const allQuestions: { id: string; lessonId: string; points: number; courseIdx: number }[] = [];
  const allLessons: { id: string; courseId: string; courseIdx: number }[] = [];
  const courses: { id: string }[] = [];

  // ---------- 3. Темы (Topic) ----------
  const topicSpecs: {
    title: string;
    skill: TopicSkill;
    level: CefrLevel;
    theory: string;
  }[] = [
    // ── GRAMMAR ────────────────────────────────────────────────
    { title: "Present Simple & daily routines", skill: "GRAMMAR", level: "A2", theory: "Use the Present Simple for habits, routines and facts.\n\n- Form: subject + base verb (+ **-s/-es** for he/she/it)\n- Negative: do/does + not + base verb\n- Question: Do/Does + subject + base verb?\n\n> I write code every day. She uses Python.\n\nTypical mistake: forgetting **-s** in the third person." },
    { title: "Articles: a / an / the", skill: "GRAMMAR", level: "A2", theory: "Articles tell the listener whether a noun is general or specific.\n\n- **a/an** — one, non-specific (a server, an error)\n- **the** — specific or already known (the database we use)\n- no article — general plurals/uncountables (engineers, software)\n\n> I opened a file, then saved the file to the repo." },
    { title: "Present Perfect vs Past Simple", skill: "GRAMMAR", level: "B1", theory: "Both talk about the past — the difference is the connection to now.\n\n- **Past Simple** — finished time: *I fixed the bug yesterday.*\n- **Present Perfect** — link to now / no exact time: *I have fixed the bug.*\n\nSignal words: yesterday/ago (past) vs already/yet/just/since/for (perfect)." },
    { title: "Conditionals 0–2", skill: "GRAMMAR", level: "B2", theory: "Conditionals describe how likely a situation is.\n\n- **Zero** — always true: *If you heat water, it boils.*\n- **First** — real/possible: *If the test fails, we will fix it.*\n- **Second** — unreal/hypothetical: *If I had more time, I would refactor.*\n\nNever use *will/would* in the if-clause." },
    { title: "Passive voice", skill: "GRAMMAR", level: "B2", theory: "Use the passive to focus on the action or result, not the doer.\n\n- Form: be (correct tense) + past participle\n- *Active:* Engineers developed TCP/IP. *Passive:* TCP/IP was developed by engineers.\n\nPreferred in technical and academic writing for objectivity." },

    // ── VOCABULARY ─────────────────────────────────────────────
    { title: "Travel survival phrases", skill: "VOCABULARY", level: "A2", theory: "Core phrases for getting around abroad.\n\n- Asking: *Where is…? How much is…? Could you help me?*\n- Directions: turn left/right, next to, opposite\n- Politeness: please, thank you, excuse me\n\nLearn them as fixed chunks, not word by word." },
    { title: "IT collocations: do / make / have / take", skill: "VOCABULARY", level: "B1", theory: "Some verbs go with specific nouns — learn them as pairs.\n\n- **make** a decision, make progress, make a mistake\n- **do** research, do a test, do your best\n- **have** a meeting, have access, have a problem\n- **take** notes, take a break, take action\n\nCommon error: *do a decision* → **make** a decision." },
    { title: "Phrasal verbs: work & office", skill: "VOCABULARY", level: "B1", theory: "Phrasal verbs are common in spoken/work English.\n\n- *set up* a server, *back up* data, *log in/out*\n- *carry out* tests, *roll out* a feature, *catch up* on email\n\nMeaning often differs from the separate words — note them in context." },
    { title: "Academic & technical word list", skill: "VOCABULARY", level: "B2", theory: "High-frequency words for reports, papers and documentation.\n\n- analyse, evaluate, implement, demonstrate, significant, approach\n- noun/verb pairs: analysis ↔ analyse, implementation ↔ implement\n\nPrefer precise academic verbs over vague ones (*do/get/thing*)." },

    // ── READING ────────────────────────────────────────────────
    { title: "Skimming and scanning", skill: "READING", level: "A2", theory: "Two fast reading techniques for finding information.\n\n- **Skim** — read quickly for the general idea (titles, first lines)\n- **Scan** — search for a specific detail (a number, a name)\n\nYou don't need every word to understand a text." },
    { title: "Reading technical documentation", skill: "READING", level: "B1", theory: "Docs (API references, READMEs) follow predictable patterns.\n\n- Use headings, code blocks and examples to navigate\n- Watch for signal words: *note, warning, deprecated, required*\n- Read examples first, then the explanation\n\nGuess unknown terms from context before reaching for a dictionary." },
    { title: "Critical reading & inference", skill: "READING", level: "B2", theory: "Going beyond the literal meaning of a text.\n\n- **Inference** — what the writer implies but doesn't state\n- Identify the author's purpose and opinion\n- Separate facts from claims and evaluate evidence\n\nAsk: *What is the writer trying to make me think?*" },

    // ── LISTENING ──────────────────────────────────────────────
    { title: "Understanding everyday English", skill: "LISTENING", level: "A2", theory: "Strategies for following everyday speech.\n\n- Listen for **key words**, not every word\n- Use context and the speaker's tone\n- It's normal to miss some words — focus on the message\n\nPredict what might be said before you listen." },
    { title: "Understanding fast speech", skill: "LISTENING", level: "B1", theory: "Native speakers connect and reduce sounds.\n\n- **Linking:** *an_error*, *pick_it_up*\n- **Reductions:** gonna (going to), wanna (want to), kinda\n- Stress falls on the important content words\n\nTrain with subtitles, then remove them." },
    { title: "Following technical talks & podcasts", skill: "LISTENING", level: "B2", theory: "Longer, content-heavy listening (talks, podcasts, standups).\n\n- Note the structure: intro → points → conclusion\n- Listen for discourse markers: *first, however, in other words, to sum up*\n- Take brief notes in keywords, not full sentences\n\nReplay difficult sections rather than stopping completely." },

    // ── SPEAKING ───────────────────────────────────────────────
    { title: "Small talk strategies", skill: "SPEAKING", level: "A2", theory: "Short, friendly conversation that builds rapport.\n\n- Safe topics: weekend, weather, work, studies\n- Show interest: *Oh really? That sounds great. What about you?*\n- Keep it balanced — ask questions back\n\nA few good phrases matter more than perfect grammar." },
    { title: "Describing your work & projects", skill: "SPEAKING", level: "B1", theory: "Talking clearly about what you do and have built.\n\n- Use sequencing: *first, then, after that, finally*\n- Present Simple for routines, Past Simple for finished projects\n- Useful frames: *I'm responsible for… I worked on… We used…*\n\nStructure beats vocabulary — keep it organised." },
    { title: "Presentations & handling Q&A", skill: "SPEAKING", level: "B2", theory: "Delivering a clear talk and responding to questions.\n\n- Signpost: *Today I'll cover… Let's move on to… To conclude…*\n- Handle questions: *That's a good question. Let me explain…*\n- If unsure: *I'm not certain, but I'd say…*\n\nPause and breathe — clarity over speed." },

    // ── WRITING ────────────────────────────────────────────────
    { title: "Writing short messages & emails", skill: "WRITING", level: "A2", theory: "Clear, simple written communication.\n\n- Greeting: *Hi/Hello [name],*\n- One main point per message\n- Closing: *Thanks, / Best, [your name]*\n\nKeep sentences short and polite." },
    { title: "Email structure and tone", skill: "WRITING", level: "B1", theory: "Professional emails follow a clear structure.\n\n- Subject → greeting → purpose → details → action → close\n- Tone: polite and direct (*Could you…? I'd appreciate it if…*)\n- One topic per email; use paragraphs\n\nRe-read before sending: clarity, grammar, tone." },
    { title: "Technical reports & abstracts", skill: "WRITING", level: "B2", theory: "Objective, structured writing for reports and papers.\n\n- Structure: background → problem → method → results → conclusion\n- Use the passive for objectivity (*The data was analysed…*)\n- Be precise and concise; avoid filler\n\nAn abstract summarises the whole report in 150–200 words." },

    // ── A1 (beginner) — covers every skill ─────────────────────
    { title: "Verb 'to be' & basic word order", skill: "GRAMMAR", level: "A1", theory: "The verb **to be** (am/is/are) and simple sentence order.\n\n- I **am** a student. She **is** an engineer. They **are** here.\n- Order: subject + verb + rest (*I write code.*)\n- Questions: Are you…? Is it…?\n\nMaster this before moving to other tenses." },
    { title: "Numbers, time & everyday objects", skill: "VOCABULARY", level: "A1", theory: "Core everyday vocabulary for beginners.\n\n- Numbers 0–100, days, months\n- Telling the time: *It's half past nine.*\n- Objects around you: laptop, phone, desk, keyboard\n\nLearn in small sets and review daily." },
    { title: "Reading signs, labels & short notes", skill: "READING", level: "A1", theory: "Getting meaning from very short texts.\n\n- Signs: *Open, Closed, Exit, Push/Pull*\n- Labels and simple instructions\n- Short messages and to-do notes\n\nFocus on key words and symbols, not full sentences." },
    { title: "Understanding simple instructions", skill: "LISTENING", level: "A1", theory: "Following short, clear spoken instructions.\n\n- Classroom/work commands: *open, click, type, save*\n- Numbers, times and directions\n- Ask to repeat: *Sorry, can you say that again?*\n\nListen for the action word." },
    { title: "Introducing yourself & basic questions", skill: "SPEAKING", level: "A1", theory: "Your first spoken English.\n\n- *My name is… I'm from… I study/work…*\n- Basic questions: *What's your name? Where are you from?*\n- Politeness: please, thank you, nice to meet you\n\nShort, clear sentences are enough." },
    { title: "Filling forms & writing short notes", skill: "WRITING", level: "A1", theory: "Writing the basics correctly.\n\n- Personal details: name, age, email, country\n- Short notes and simple messages\n- Capital letters and full stops\n\nKeep it short and accurate." },

    // ── C1 (advanced) — covers every skill ─────────────────────
    { title: "Inversion & emphatic structures", skill: "GRAMMAR", level: "C1", theory: "Advanced structures for emphasis and formality.\n\n- Inversion: *Never have I seen such clean code.*\n- Cleft sentences: *What matters is the result.*\n- Fronting for emphasis\n\nUse sparingly — they add weight, not clutter." },
    { title: "Collocations & academic phrasing", skill: "VOCABULARY", level: "C1", theory: "Precise, natural word combinations for advanced use.\n\n- *draw a conclusion, pose a risk, gain insight*\n- Academic verbs: *highlight, address, undermine, facilitate*\n- Register: formal vs neutral vs informal\n\nNatural collocation is what makes you sound fluent." },
    { title: "Reading research papers & long articles", skill: "READING", level: "C1", theory: "Handling dense, abstract texts efficiently.\n\n- Read the abstract and conclusion first\n- Track the argument across paragraphs\n- Distinguish the author's view from cited views\n\nSkim for structure, then read closely where it matters." },
    { title: "Following debates & lectures", skill: "LISTENING", level: "C1", theory: "Understanding extended, complex speech.\n\n- Follow argument and counter-argument\n- Catch attitude through stress and intonation\n- Note signposts: *on the contrary, that said, by and large*\n\nHold the main thread while details flow past." },
    { title: "Debating & defending an opinion", skill: "SPEAKING", level: "C1", theory: "Arguing a position clearly and persuasively.\n\n- State a claim, give reasons, address counter-points\n- Hedge and concede: *Admittedly… however…*\n- Stay coherent under questioning\n\nStructure and connectors carry the argument." },
    { title: "Argumentative essays & proposals", skill: "WRITING", level: "C1", theory: "Building a persuasive, well-organised text.\n\n- Thesis → arguments → counter-argument → conclusion\n- Cohesive devices: *furthermore, nevertheless, consequently*\n- Support every claim with evidence\n\nClarity of argument beats fancy vocabulary." },

    // ── C2 (mastery) — covers every skill ──────────────────────
    { title: "Nuanced modality & hedging", skill: "GRAMMAR", level: "C2", theory: "Expressing fine shades of certainty and stance.\n\n- Degrees: *may well, is bound to, would seem to*\n- Hedging for precision in academic writing\n- Subtle conditionals and mixed forms\n\nMastery is control of nuance, not complexity for its own sake." },
    { title: "Idioms, nuance & register", skill: "VOCABULARY", level: "C2", theory: "Near-native control of meaning and tone.\n\n- Idioms and figurative language used appropriately\n- Connotation: choosing the exact word (*apprehensive* vs *afraid*)\n- Shifting register to suit audience and purpose\n\nThe right word in the right place — effortlessly." },
    { title: "Reading between the lines", skill: "READING", level: "C2", theory: "Interpreting the most subtle written meaning.\n\n- Irony, tone and implied attitude\n- Cultural and rhetorical subtext\n- Evaluating bias and rhetorical strategy\n\nUnderstand not just what is said, but why and how." },
    { title: "Understanding nuance, irony & accents", skill: "LISTENING", level: "C2", theory: "Comprehending speech as a native would.\n\n- Humour, irony and understatement\n- A range of accents and rapid colloquial speech\n- Implied meaning and what is left unsaid\n\nFollow effortlessly, including the subtext." },
    { title: "Fluent, nuanced discussion", skill: "SPEAKING", level: "C2", theory: "Speaking with native-like fluency and subtlety.\n\n- Express fine distinctions precisely\n- Adapt tone and register instantly\n- Use idiom and humour naturally\n\nEffortless, accurate and appropriate in any setting." },
    { title: "Polished academic & professional writing", skill: "WRITING", level: "C2", theory: "Producing publication-quality text.\n\n- Sophisticated structure and flawless cohesion\n- Precise word choice and consistent register\n- Edit ruthlessly for concision and clarity\n\nWriting that reads as if written by an expert native." },
  ];

  const topics: Topic[] = [];
  for (const [ti, t] of topicSpecs.entries()) {
    topics.push(
      await prisma.topic.create({
        data: {
          title: t.title,
          skill: t.skill,
          level: t.level,
          order: ti,
          theoryContent: `## ${t.title}\n\n${t.theory}\n\nPractice it with the linked lessons below.`,
        },
      }),
    );
  }
  console.log(`✓ topics: ${topics.length}`);

  // ---------- 3b. Программа "English for IT": 2 семестра × 9 юнитов ----------
  // 18 юнитов из методички; после каждых 3 юнитов — CHECKPOINT,
  // в конце семестра — FINAL. Вопросы экзаменов учитель генерит через AI.
  const UNITS: { n: number; grammar: string; topic: string }[] = [
    { n: 1, grammar: "Present Simple; singular/plural nouns", topic: "Personal portfolio in the digital world" },
    { n: 2, grammar: "Prepositions of time; time expressions", topic: "Managing time in the digital age" },
    { n: 3, grammar: "Present Continuous; adjectives", topic: "Digital technologies are changing the world" },
    { n: 4, grammar: "There is/are; countable/uncountable", topic: "Computer hardware and systems" },
    { n: 5, grammar: "Prepositions of place; degrees of comparison", topic: "Digital navigation and tech comparisons" },
    { n: 6, grammar: "Past participle; past modals", topic: "IT milestones and computing history" },
    { n: 7, grammar: "Irregular verbs; sequencing verbs", topic: "Software development" },
    { n: 8, grammar: "Future Simple; suggestions and advice", topic: "The future of technology" },
    { n: 9, grammar: "Collocations with do/make/have/take/bring", topic: "Professional communication in IT" },
    { n: 10, grammar: "Past Simple; Past Continuous", topic: "Cybersecurity incidents" },
    { n: 11, grammar: "Descriptive adjectives; past tenses review", topic: "Evolution of computing devices" },
    { n: 12, grammar: "Quantity words; modal verbs", topic: "Big data management" },
    { n: 13, grammar: "Degrees of adjectives; idioms", topic: "Performance optimization" },
    { n: 14, grammar: "First conditional", topic: "Project planning and risk management" },
    { n: 15, grammar: "Present Perfect", topic: "Achievements in computer science" },
    { n: 16, grammar: "Second conditional", topic: "Innovation and hypothetical thinking" },
    { n: 17, grammar: "Compound nouns; adjective suffixes", topic: "Technical writing" },
    { n: 18, grammar: "Passive voice", topic: "Technology standards and research" },
  ];

  const semesters = [
    { slug: "english-for-it-semester-1", title: "English for IT — Semester 1", from: 1, to: 9 },
    { slug: "english-for-it-semester-2", title: "English for IT — Semester 2", from: 10, to: 18 },
  ];

  // Хелпер: SeedQ[] → данные ExamQuestion (с points и order)
  const toExamQuestions = (qs: SeedQ[]) =>
    qs
      // в экзамены берём только авто-проверяемые типы (без writing/speaking)
      .filter((q) => EXAM_SAFE_TYPES.has(q.type))
      .map((q, i) => ({
        type: q.type,
        prompt: q.prompt,
        payload: q.payload as unknown as Prisma.InputJsonValue,
        points: 10,
        order: i,
      }));

  let examCount = 0;
  let examQ = 0;
  let unitQ = 0;
  let attemptCount = 0;
  let firstSemCourseId: string | null = null;
  const checkpointExamIds: string[] = [];
  // ротация навыка по юнитам — чтобы аналитика покрывала все 4 вида речи
  const SKILL_ROT: Skill[] = [Skill.READING, Skill.LISTENING, Skill.SPEAKING, Skill.WRITING];

  for (const [semIdx, sem] of semesters.entries()) {
    const course = await prisma.course.create({
      data: {
        slug: sem.slug,
        title: sem.title,
        description: `${sem.title}. Skills-based English for Computer Engineering (B1–B2). Units ${sem.from}–${sem.to} from the official methodology.`,
        category: "EXAM_PREP",
        level: "B1",
        status: "PUBLISHED",
        publishedAt: daysAgo(50),
        ownerId: teacher.id,
        // Семестр 2 закрыт, пока не пройден Семестр 1
        ...(semIdx > 0 && firstSemCourseId
          ? { prerequisiteCourseId: firstSemCourseId }
          : {}),
      },
    });
    if (!firstSemCourseId) firstSemCourseId = course.id;
    courses.push({ id: course.id });

    const semUnits = UNITS.filter((u) => u.n >= sem.from && u.n <= sem.to);
    for (const [i, u] of semUnits.entries()) {
      const unitQs = UNIT_QUESTIONS[u.n] ?? [];
      const lesson = await prisma.lesson.create({
        data: {
          courseId: course.id,
          title: `Unit ${u.n}: ${u.topic}`,
          description: `Grammar: ${u.grammar}`,
          content:
            UNIT_CONTENT[u.n] ??
            `# Unit ${u.n}: ${u.topic}\n\n**Grammar focus:** ${u.grammar}\n\nSix skills in this unit: Listening, Reading, Speaking, Writing, Critical Thinking, Digital Tasks.\n\n> Work through every section — each skill matters.`,
          order: i,
          isPreview: i === 0,
          status: "PUBLISHED",
          publishedAt: daysAgo(49),
          durationSec: 2700,
          skillFocus: SKILL_ROT[(u.n - 1) % 4],
          // вопросы юнита (тренажёр грамматики)
          questions: {
            create: unitQs.map((q, qi) => ({
              type: q.type,
              prompt: q.prompt,
              payload: q.payload as unknown as Prisma.InputJsonValue,
              explanation: q.explanation ?? null,
              order: qi,
              points: 10,
            })),
          },
        },
        select: { id: true, questions: { select: { id: true } } },
      });
      allLessons.push({ id: lesson.id, courseId: course.id, courseIdx: semIdx });
      // Метка: видно, какой юнит наполнен из учебника, а какой ещё заглушка
      const enriched = Boolean(UNIT_CONTENT[u.n]);
      console.log(
        `  ${enriched ? "✓ FULL " : "· basic"}  Unit ${String(u.n).padStart(2, "0")}: ${u.topic} (${unitQs.length} tasks)`,
      );
      for (const q of lesson.questions) {
        allQuestions.push({ id: q.id, lessonId: lesson.id, points: 10, courseIdx: semIdx });
      }
      unitQ += unitQs.length;
    }

    // Контрольные после каждых 3 юнитов + финал семестра (с вопросами)
    let order = 0;
    for (let start = sem.from; start <= sem.to; start += 3) {
      const end = Math.min(start + 2, sem.to);
      const qs = questionsForUnits(start, end); // все вопросы 3 юнитов = 12
      const exam = await prisma.exam.create({
        data: {
          courseId: course.id,
          title: `Checkpoint: Units ${start}–${end}`,
          type: "CHECKPOINT",
          order: order++,
          unitsLabel: `Units ${start}-${end}`,
          passingScore: 60,
          questions: { create: toExamQuestions(qs) },
        },
      });
      checkpointExamIds.push(exam.id);
      examCount++;
      examQ += qs.length;
    }
    // Финал: по 2 вопроса из каждого юнита семестра (MC + FILL)
    const finalQs: SeedQ[] = [];
    for (let n = sem.from; n <= sem.to; n++) {
      finalQs.push(...(UNIT_QUESTIONS[n] ?? []).slice(0, 2));
    }
    await prisma.exam.create({
      data: {
        courseId: course.id,
        title: `Final exam — ${sem.title}`,
        type: "FINAL",
        order: order++,
        unitsLabel: `Units ${sem.from}-${sem.to}`,
        passingScore: 70,
        questions: { create: toExamQuestions(finalQs) },
      },
    });
    examCount++;
    examQ += finalQs.length;
  }

  // Привязываем темы (Topic) к реальным урокам English for IT
  const linkTopic = async (topicIdx: number, courseIdx: number) => {
    const lesson = allLessons.find((l) => l.courseIdx === courseIdx);
    if (lesson && topics[topicIdx]) {
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { topicId: topics[topicIdx].id },
      });
    }
  };
  await linkTopic(2, 0);  // Present Perfect vs Past Simple → Sem 1
  await linkTopic(19, 1); // Email structure and tone → Sem 2

  // Демо-попытки первой контрольной (запись на курсы — в разделе 6)
  if (checkpointExamIds.length > 0) {
    const demoScores = [90, 80, 70, 60, 50, 30];
    const firstCheckpoint = checkpointExamIds[0];
    const total =
      questionsForUnits(1, 3).filter((q) => EXAM_SAFE_TYPES.has(q.type)).length * 10;
    for (const [i, student] of students.entries()) {
      const score = demoScores[i] ?? 60;
      await prisma.examAttempt.create({
        data: {
          examId: firstCheckpoint,
          userId: student.id,
          status: "COMPLETED",
          score,
          totalPoints: total,
          earnedPoints: Math.round((score / 100) * total),
          passed: score >= 60,
          completedAt: daysAgo(14 - i),
        },
      });
      attemptCount++;
    }
  }

  console.log(
    `✓ English for IT: 2 courses, 18 unit lessons (${unitQ} questions), ${examCount} exams (${examQ} questions), ${attemptCount} demo attempts`,
  );
  const fullUnits = Object.keys(UNIT_CONTENT)
    .map(Number)
    .sort((a, b) => a - b);
  console.log(
    `  FULL textbook units: ${fullUnits.join(", ")} (${fullUnits.length}/18) — the rest use the basic stub`,
  );

  // ---------- 4. Банк адаптивного теста (ручной, без Gemini) ----------
  const bankTemplates: Record<CefrLevel, { prompt: string; options: string[]; correct: number }[]> = {
    A1: [
      { prompt: "I ___ a student.", options: ["am", "is", "are", "be"], correct: 0 },
      { prompt: "She ___ from Spain.", options: ["are", "is", "am", "be"], correct: 1 },
      { prompt: "___ you like coffee?", options: ["Does", "Is", "Do", "Are"], correct: 2 },
      { prompt: "This is ___ apple.", options: ["a", "an", "the", "—"], correct: 1 },
      { prompt: "We ___ TV every evening.", options: ["watch", "watches", "watching", "watched"], correct: 0 },
    ],
    A2: [
      { prompt: "I ___ to the cinema yesterday.", options: ["go", "goes", "went", "gone"], correct: 2 },
      { prompt: "She is ___ than her brother.", options: ["tall", "taller", "tallest", "more tall"], correct: 1 },
      { prompt: "There isn't ___ milk left.", options: ["some", "any", "no", "a"], correct: 1 },
      { prompt: "We ___ dinner when he called.", options: ["have", "had", "were having", "are having"], correct: 2 },
      { prompt: "You ___ smoke here. It's forbidden.", options: ["mustn't", "don't have to", "may", "should"], correct: 0 },
    ],
    B1: [
      { prompt: "I have lived here ___ 2019.", options: ["for", "since", "from", "during"], correct: 1 },
      { prompt: "If it rains, we ___ at home.", options: ["stay", "will stay", "stayed", "would stay"], correct: 1 },
      { prompt: "The report ___ by Friday.", options: ["will finish", "will be finished", "finishes", "is finishing"], correct: 1 },
      { prompt: "He asked me where ___.", options: ["do I live", "I lived", "did I live", "I am living"], correct: 1 },
      { prompt: "I'm used ___ early.", options: ["to get up", "to getting up", "get up", "getting up"], correct: 1 },
    ],
    B2: [
      { prompt: "By next year, she ___ here for a decade.", options: ["will work", "will have worked", "works", "has worked"], correct: 1 },
      { prompt: "___ he was tired, he kept working.", options: ["Despite", "Although", "However", "Because"], correct: 1 },
      { prompt: "I'd rather you ___ that again.", options: ["don't do", "didn't do", "won't do", "not do"], correct: 1 },
      { prompt: "The meeting was called ___ at the last minute.", options: ["off", "out", "down", "away"], correct: 0 },
      { prompt: "Hardly ___ when the phone rang.", options: ["I had arrived", "had I arrived", "I arrived", "did I arrived"], correct: 1 },
    ],
    C1: [
      { prompt: "It's high time we ___ this issue.", options: ["address", "addressed", "have addressed", "will address"], correct: 1 },
      { prompt: "___ the new policy, sales have soared.", options: ["Owing to", "Despite", "Albeit", "Notwithstanding that"], correct: 0 },
      { prompt: "She has a remarkable ___ for languages.", options: ["ability", "aptitude", "capacity", "skill"], correct: 1 },
      { prompt: "The proposal was met ___ fierce resistance.", options: ["by", "with", "under", "against"], correct: 1 },
      { prompt: "Not until the results came in ___ the scale of the win.", options: ["we realised", "did we realise", "we did realise", "realised we"], correct: 1 },
    ],
    C2: [
      { prompt: "His argument, ___ compelling, failed to convince the board.", options: ["albeit", "whereas", "notwithstanding", "however"], correct: 0 },
      { prompt: "The novel is a thinly ___ autobiography.", options: ["covered", "veiled", "masked", "hidden"], correct: 1 },
      { prompt: "She spoke with ___ that silenced the room.", options: ["such authority", "so authority", "such an authority", "so an authority"], correct: 0 },
      { prompt: "Far ___ resolving the issue, the memo inflamed it.", options: ["from", "of", "beyond", "off"], correct: 0 },
      { prompt: "The committee's findings ___ doubt on the official account.", options: ["throw", "cast", "put", "lay"], correct: 1 },
    ],
  };

  let bankCount = 0;
  for (const level of Object.keys(bankTemplates) as CefrLevel[]) {
    const items = bankTemplates[level];
    const center = LEVEL_DIFFICULTY_CENTER[level];
    for (const [i, item] of items.entries()) {
      await prisma.placementItem.create({
        data: {
          level,
          difficulty: Math.max(
            -3,
            Math.min(3, center + ((i / (items.length - 1)) * 2 - 1) * 0.4),
          ),
          type: QuestionType.MULTIPLE_CHOICE,
          prompt: item.prompt,
          payload: { options: item.options, correctIndex: item.correct },
        },
      });
      bankCount++;
    }
  }
  console.log(`✓ placement bank: ${bankCount} items (5 per level)`);

  // ---------- 5. Группы ----------
  const expGroup = await prisma.group.create({
    data: {
      ownerId: teacher.id,
      name: "English for IT — Group A",
      description: "Morning group, B1–B2 (Computer Engineering).",
      inviteCode: "GRPA01",
      memberships: {
        createMany: {
          data: students.slice(0, 4).map((s) => ({ userId: s.id })),
        },
      },
    },
  });
  await prisma.group.create({
    data: {
      ownerId: teacher.id,
      name: "English for IT — Group B",
      description: "Evening group, B1–B2 (Computer Engineering).",
      inviteCode: "GRPB02",
      memberships: {
        createMany: {
          data: students.slice(4).map((s) => ({ userId: s.id })),
        },
      },
    },
  });
  console.log("✓ groups: Group A (4 students) + Group B (2 students)");

  // ---------- 6. Enrollments, ответы, завершения уроков ----------
  // Ответы размазаны по последним 6 неделям → живая динамика в аналитике
  let totalAnswers = 0;
  for (const [si, student] of students.entries()) {
    const spec = studentSpecs[si];
    // все записаны на Semester 1; часть — также на Semester 2
    const enrolledIdx = [0, ...(det(`enroll-sem2-${si}`) < 0.6 ? [1] : [])].filter(
      (ci) => ci < courses.length,
    );

    for (const ci of enrolledIdx) {
      await prisma.courseEnrollment.create({
        data: {
          userId: student.id,
          courseId: courses[ci].id,
          enrolledAt: daysAgo(42),
        },
      });
    }

    let xp = 0;
    const answeredQuestions = allQuestions.filter(
      (q) =>
        enrolledIdx.includes(q.courseIdx) &&
        det(`answer${si}-${q.id}`) < 0.75,
    );

    for (const q of answeredQuestions) {
      const correct = det(`correct${si}-${q.id}`) < spec.accuracyTarget;
      const when = daysAgo(Math.floor(det(`when${si}-${q.id}`) * 40), si);
      await prisma.answerSubmission.create({
        data: {
          userId: student.id,
          questionId: q.id,
          answer: { selectedIndex: 0 },
          isCorrect: correct,
          pointsEarned: correct ? q.points : 0,
          attemptCount: correct ? 1 : 2,
          firstCorrectAt: correct ? when : null,
          submittedAt: when,
        },
      });
      if (correct) xp += q.points;
      totalAnswers++;
    }

    // завершённые уроки — ПОСЛЕДОВАТЕЛЬНО (префикс юнитов по порядку),
    // чтобы блокировка «проходи по порядку» была наглядной и согласованной.
    // Семестр 2 НЕ получает прохождений, пока Семестр 1 не пройден полностью
    // (демонстрация блокировки курса-предпосылки).
    let prevCourseFullyDone = true; // у первого курса предпосылки нет
    for (const ci of [...enrolledIdx].sort((a, b) => a - b)) {
      const courseLessons = allLessons.filter((l) => l.courseIdx === ci); // в порядке юнитов
      if (!prevCourseFullyDone) {
        prevCourseFullyDone = false;
        continue; // курс закрыт предпосылкой — без прохождений
      }
      const frac = Math.min(0.7, Math.max(0.2, spec.accuracyTarget));
      const doneCount = Math.max(
        1,
        Math.min(courseLessons.length - 1, Math.round(courseLessons.length * frac)),
      );
      for (let k = 0; k < doneCount; k++) {
        await prisma.lessonCompletion.create({
          data: {
            userId: student.id,
            lessonId: courseLessons[k].id,
            completedAt: daysAgo(Math.floor(det(`compl${si}-${k}-${ci}`) * 30)),
          },
        });
      }
      prevCourseFullyDone = doneCount >= courseLessons.length;
    }

    await prisma.user.update({
      where: { id: student.id },
      data: { totalXp: xp },
    });
  }
  console.log(`✓ enrollments + ${totalAnswers} answers + lesson completions`);

  // ---------- 7. Словарь + SRS-история (для Dana) ----------
  const dana = students[0];
  const words: [string, string, string | null][] = [
    ["deadline", "крайний срок", "We can't miss the deadline on Friday."],
    ["negotiate", "вести переговоры", "We negotiated a better price."],
    ["apprehensive", "встревоженный", "She was apprehensive about the exam."],
    ["schedule", "расписание", "My schedule is full this week."],
    ["accomplish", "достигать", "We accomplished all our goals."],
    ["briefly", "кратко", null],
    ["colleague", "коллега", "My colleague helped me with the report."],
    ["postpone", "откладывать", "The meeting was postponed till Monday."],
    ["roughly", "примерно", null],
    ["assume", "предполагать", "I assume the train is on time."],
    ["currently", "в настоящее время", null],
    ["entire", "целый, весь", "I spent the entire day reading."],
  ];

  for (const [wi, [term, translation, example]] of words.entries()) {
    // моделируем историю повторов через sm2Step — данные согласованы с алгоритмом
    let state = { repetitions: 0, easeFactor: 2.5, intervalDays: 0 };
    const reviews = Math.floor(det(`rev${wi}`) * 4); // 0-3 повтора
    const createdAt = daysAgo(35 - wi);
    let lastReviewedAt: Date | null = null;
    let dueAt = createdAt;

    const entry = await prisma.vocabularyEntry.create({
      data: {
        userId: dana.id,
        term,
        translation,
        example,
        partOfSpeech: wi % 3 === 0 ? "noun" : wi % 3 === 1 ? "verb" : "adverb",
        sourceLessonId: allLessons[wi % allLessons.length].id,
        createdAt,
      },
    });

    for (let r = 0; r < reviews; r++) {
      const reviewedAt = daysAgo(30 - wi - r * 6);
      const quality = det(`q${wi}-${r}`) < 0.8 ? 4 : 2;
      const next = sm2Step(quality, state, reviewedAt);
      await prisma.reviewLog.create({
        data: {
          entryId: entry.id,
          userId: dana.id,
          quality,
          prevInterval: state.intervalDays,
          newInterval: next.intervalDays,
          reviewedAt,
        },
      });
      state = next;
      lastReviewedAt = reviewedAt;
      dueAt = next.dueAt;
    }

    await prisma.vocabularyEntry.update({
      where: { id: entry.id },
      data: {
        repetitions: state.repetitions,
        easeFactor: state.easeFactor,
        intervalDays: state.intervalDays,
        dueAt,
        lastReviewedAt,
      },
    });
  }
  console.log(`✓ vocabulary: ${words.length} words for Dana (with SM-2 history, some due)`);

  // ---------- 7b. Разблокированные достижения (для страницы Achievements) ----------
  // Раздаём по успеваемости: сильным студентам — больше ачивок
  const achByStudent: string[][] = [
    ["first_steps", "question_master", "quick_learner", "course_explorer"], // Dana
    ["first_steps", "quick_learner"], // Erlan
    ["first_steps", "question_master", "centurion", "week_warrior"], // Madina
    ["first_steps"], // Timur
    ["first_steps", "quick_learner"], // Aliya
    ["first_steps"], // Sanzhar
  ];
  let achCount = 0;
  for (const [si, student] of students.entries()) {
    for (const [ai, achievementId] of (achByStudent[si] ?? []).entries()) {
      await prisma.userAchievement.create({
        data: {
          userId: student.id,
          achievementId,
          unlockedAt: daysAgo(25 - ai * 3),
        },
      });
      achCount++;
    }
  }
  console.log(`✓ achievements unlocked: ${achCount}`);

  // ---------- 8. Завершённый placement-тест для Dana ----------
  const danaTest = await prisma.placementTest.create({
    data: {
      userId: dana.id,
      status: "COMPLETED",
      ability: -0.3,
      questionsAsked: 12,
      estimatedLevel: "B1",
      startedAt: daysAgo(44),
      completedAt: daysAgo(44),
    },
  });
  let ability = 0;
  const traj = [true, true, false, true, false, true, true, false, true, true, false, true];
  for (const [i, ok] of traj.entries()) {
    ability += (ok ? 1 : -1) * (1 / Math.sqrt(i + 1)) * 0.7;
    await prisma.placementResponse.create({
      data: {
        testId: danaTest.id,
        itemId: `seed-item-${i}`,
        difficulty: -0.5 + i * 0.1,
        isCorrect: ok,
        abilityAfter: Math.max(-3, Math.min(3, ability)),
        answeredAt: daysAgo(44),
      },
    });
  }
  console.log("✓ placement: completed test with ability trajectory (Dana)");

  // ---------- 9. Снимки прогресса: PRE / WEEKLY / POST ----------
  // PRE (месяц назад, слабее) → недельные срезы → POST (сейчас, с ростом).
  // Для эксперимента: экспериментальная группа (первые 4) растёт сильнее.
  const clamp01 = (v: number) => Math.max(0.05, Math.min(1, v));
  let snapCount = 0;

  for (const [si, student] of students.entries()) {
    const spec = studentSpecs[si];
    // экспериментальная группа (первые 4) даёт больший прирост
    const gain = si < 4 ? 0.22 : 0.1;

    const pre = {
      reading: clamp01(spec.accuracyTarget - 0.2),
      listening: clamp01(spec.accuracyTarget - 0.15),
      speaking: clamp01(spec.accuracyTarget - 0.28),
      writing: clamp01(spec.accuracyTarget - 0.25),
      overall: clamp01(spec.accuracyTarget - 0.18),
      xp: Math.floor(det(`prexp${si}`) * 60),
    };
    const post = {
      reading: clamp01(pre.reading + gain),
      listening: clamp01(pre.listening + gain),
      speaking: clamp01(pre.speaking + gain),
      writing: clamp01(pre.writing + gain),
      overall: clamp01(pre.overall + gain),
      xp: student.totalXp,
    };

    // PRE — 30 дней назад
    await prisma.progressSnapshot.create({
      data: {
        userId: student.id,
        label: SnapshotLabel.PRE,
        level: spec.level,
        totalXp: pre.xp,
        accuracy: pre.overall,
        skillBreakdown: {
          READING: pre.reading,
          LISTENING: pre.listening,
          SPEAKING: pre.speaking,
          WRITING: pre.writing,
        },
        takenAt: daysAgo(30),
      },
    });
    snapCount++;

    // WEEKLY — 21/14/7 дней назад, линейный рост PRE→POST
    for (const [w, day] of [21, 14, 7].entries()) {
      const t = (w + 1) / 4; // доля пути к POST
      await prisma.progressSnapshot.create({
        data: {
          userId: student.id,
          label: SnapshotLabel.WEEKLY,
          level: spec.level,
          totalXp: Math.round(pre.xp + (post.xp - pre.xp) * t),
          accuracy: clamp01(pre.overall + (post.overall - pre.overall) * t),
          skillBreakdown: {
            READING: clamp01(pre.reading + (post.reading - pre.reading) * t),
            LISTENING: clamp01(pre.listening + (post.listening - pre.listening) * t),
            SPEAKING: clamp01(pre.speaking + (post.speaking - pre.speaking) * t),
            WRITING: clamp01(pre.writing + (post.writing - pre.writing) * t),
          },
          takenAt: daysAgo(day),
        },
      });
      snapCount++;
    }

    // POST — вчера
    await prisma.progressSnapshot.create({
      data: {
        userId: student.id,
        label: SnapshotLabel.POST,
        level: spec.level,
        totalXp: post.xp,
        accuracy: post.overall,
        skillBreakdown: {
          READING: post.reading,
          LISTENING: post.listening,
          SPEAKING: post.speaking,
          WRITING: post.writing,
        },
        takenAt: daysAgo(1),
      },
    });
    snapCount++;
  }
  console.log(`✓ progress snapshots: ${snapCount} (PRE + 3 weekly + POST per student)`);

  // ---------- Готово ----------
  console.log(`\nDone. Demo credentials (password for all: ${PASSWORD})`);
  console.log(`  TEACHER  teacher${SEED_DOMAIN}`);
  for (const s of students) console.log(`  STUDENT  ${s.email}`);
  console.log(
    "\nNext steps for a full demo: log in as a student → placement test builds the learning path;\n" +
      "as the teacher → /teach/analytics (heatmap, POST snapshot, CSV export).",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
