// Банк вопросов по 18 юнитам "English for IT" (ручной, без AI).
// По 4 валидных вопроса на юнит (под validatePayloadByType):
// MULTIPLE_CHOICE / FILL_BLANK / DRAG_DROP / MATCH_PAIRS.
// Используется в seed: наполняет уроки юнитов и собирает экзамены.

export type SeedQ =
  | { type: "MULTIPLE_CHOICE"; prompt: string; payload: { options: string[]; correctIndex: number }; explanation?: string }
  | { type: "FILL_BLANK"; prompt: string; payload: { text: string; correctAnswers: string[]; caseSensitive?: boolean }; explanation?: string }
  | { type: "DRAG_DROP"; prompt: string; payload: { words: string[] }; explanation?: string }
  | { type: "MATCH_PAIRS"; prompt: string; payload: { pairs: { left: string; right: string }[] }; explanation?: string }
  | { type: "SHORT_WRITING"; prompt: string; payload: { minWords: number; maxWords: number; rubric: string }; explanation?: string }
  | { type: "SPEAKING_RESPONSE"; prompt: string; payload: { expectedKeyPoints?: string[]; minSeconds?: number; maxSeconds?: number }; explanation?: string };

// Типы, которые попадают в экзамены (авто-проверяемые).
// Writing/Speaking требуют AI-оценки — в экзамены их не берём, только в уроки.
export const EXAM_SAFE_TYPES = new Set([
  "MULTIPLE_CHOICE",
  "FILL_BLANK",
  "DRAG_DROP",
  "MATCH_PAIRS",
]);

export const UNIT_QUESTIONS: Record<number, SeedQ[]> = {
  1: [
    // VOCABULARY (Reading) — key terms from the unit glossary
    { type: "MATCH_PAIRS", prompt: "Vocabulary: match each IT term with its definition.", payload: { pairs: [
      { left: "software", right: "programs that run on a computer" },
      { left: "hardware", right: "physical components of a computer" },
      { left: "algorithm", right: "step-by-step instructions to solve a problem" },
      { left: "debug", right: "to find and fix errors in code" },
      { left: "compile", right: "to translate source code to machine code" },
      { left: "repository", right: "storage for code, often on GitHub" },
    ] }, explanation: "These ten terms appear in the Unit 1 reading and glossary." },
    // GRAMMAR — Present Simple (Activity 1)
    { type: "FILL_BLANK", prompt: "Grammar — Present Simple. Use the correct form of 'process'.", payload: { text: "The CPU ___ millions of instructions per second.", correctAnswers: ["processes"], caseSensitive: false }, explanation: "Third person singular adds -es after -ss." },
    { type: "MULTIPLE_CHOICE", prompt: "Plural nouns: choose the correct irregular plural.", payload: { options: ["datums", "data", "datas", "datae"], correctIndex: 1 }, explanation: "'datum' → 'data' (irregular plural)." },
    { type: "FILL_BLANK", prompt: "Grammar — Present Simple negative. Complete with 'not / use'.", payload: { text: "She ___ Windows — she prefers Linux.", correctAnswers: ["does not use", "doesn't use"], caseSensitive: false }, explanation: "Negative Present Simple: does not + base verb." },
    // READING — comprehension of the unit text (Azamat's profile)
    { type: "MULTIPLE_CHOICE", prompt: "Reading: What does Azamat study?", payload: { options: ["Cybersecurity", "Computer engineering", "Data science", "Web design"], correctIndex: 1 }, explanation: "He studies computer engineering at Nukus State Technical University." },
    { type: "FILL_BLANK", prompt: "Plural nouns: write the plural form of 'virus'.", payload: { text: "virus → ___", correctAnswers: ["viruses"], caseSensitive: false }, explanation: "Nouns ending in -s add -es: virus → viruses." },
    { type: "DRAG_DROP", prompt: "Put the words in the correct order (Present Simple).", payload: { words: ["I", "use", "digital", "tools", "every", "day"] } },
    // WRITING — professional profile task
    { type: "SHORT_WRITING", prompt: "Writing: Write your personal profile for a GitHub or LinkedIn page. Use Present Simple. Include your name, university, year and specialty, your daily routine, the languages and tools you know, and a career goal.", payload: { minWords: 100, maxWords: 120, rubric: "Assess: correct Present Simple usage, relevant IT vocabulary, all required points covered (name, university/year/specialty, daily routine, languages/tools, career goal), clarity and coherence." } },
    // SPEAKING — self-introduction
    { type: "SPEAKING_RESPONSE", prompt: "Speaking: Introduce yourself to the class for about one minute. Use Present Simple. Say your name and specialty, the programming languages you know, the digital tools you use daily, and a future project you would like to work on.", payload: { expectedKeyPoints: ["full name and specialty", "programming languages", "digital tools used daily", "a future project or goal"], minSeconds: 30, maxSeconds: 90 } },
  ],
  2: [
    // VOCABULARY (Reading) — Agile / time-management terms
    { type: "MATCH_PAIRS", prompt: "Vocabulary: match each term with its definition.", payload: { pairs: [
      { left: "deadline", right: "the time by which a task must be completed" },
      { left: "sprint", right: "a fixed time period for completing tasks (Agile)" },
      { left: "standup", right: "a short daily team meeting (usually 15 min)" },
      { left: "milestone", right: "a key point or achievement in a project" },
      { left: "commit", right: "to save code changes to a repository" },
      { left: "deploy", right: "to make software available for use" },
    ] }, explanation: "Key terms from the Unit 2 glossary." },
    // GRAMMAR — prepositions of time
    { type: "FILL_BLANK", prompt: "Preposition of time: complete with at / on / in / by.", payload: { text: "We have a standup meeting ___ 9 AM.", correctAnswers: ["at"], caseSensitive: false }, explanation: "Use 'at' with clock times." },
    { type: "MULTIPLE_CHOICE", prompt: "Preposition of time: The release is scheduled ___ Monday.", payload: { options: ["in", "on", "at", "by"], correctIndex: 1 }, explanation: "Use 'on' with days and dates." },
    { type: "FILL_BLANK", prompt: "Preposition of time: complete the sentence.", payload: { text: "___ the morning, he develops new features.", correctAnswers: ["in"], caseSensitive: false }, explanation: "Use 'in' with parts of the day." },
    { type: "FILL_BLANK", prompt: "Preposition of time: 'no later than'.", payload: { text: "He completes at least one task ___ midday.", correctAnswers: ["by"], caseSensitive: false }, explanation: "'by' = no later than a point in time." },
    // READING — comprehension of the unit text (Albert's routine)
    { type: "MULTIPLE_CHOICE", prompt: "Reading: What is the Friday meeting called?", payload: { options: ["Standup", "Sprint review", "Planning session", "Hackathon"], correctIndex: 1 }, explanation: "On Fridays the team holds a sprint review to demonstrate the week's work." },
    { type: "DRAG_DROP", prompt: "Put the words in the correct order.", payload: { words: ["We", "work", "in", "two-week", "sprints"] } },
    // WRITING — typical weekday paragraph
    { type: "SHORT_WRITING", prompt: "Writing: Describe YOUR typical weekday as a computer engineering student. Use at least five different prepositions of time. Include morning activities, afternoon schedule, evening routine, and a deadline or goal you work toward.", payload: { minWords: 100, maxWords: 120, rubric: "Assess: at least five different time prepositions used correctly (at/on/in/by/during/until), clear morning/afternoon/evening structure, a stated deadline or goal, accurate time expressions, coherence." } },
    // SPEAKING — digital time management
    { type: "SPEAKING_RESPONSE", prompt: "Speaking: Describe a typical weekday for a developer, using at least five time-related prepositions. Then say whether you prefer a fixed schedule or flexible hours, and why.", payload: { expectedKeyPoints: ["typical weekday described in order", "at least five time prepositions", "preference: fixed vs flexible schedule", "a reason for the preference"], minSeconds: 30, maxSeconds: 90 } },
  ],
  3: [
    // VOCABULARY (Reading) — digital technology terms
    { type: "MATCH_PAIRS", prompt: "Vocabulary: match each term with its definition.", payload: { pairs: [
      { left: "artificial intelligence", right: "computer systems that simulate human intelligence" },
      { left: "cloud computing", right: "using remote servers over the internet" },
      { left: "cybersecurity", right: "protecting systems from digital attacks" },
      { left: "machine learning", right: "AI systems that learn from data" },
      { left: "automation", right: "technology performing tasks automatically" },
      { left: "innovation", right: "a new idea, method, or product" },
    ] }, explanation: "Key terms from the Unit 3 glossary." },
    // GRAMMAR — Present Continuous
    { type: "FILL_BLANK", prompt: "Present Continuous: complete with the correct form of 'develop'.", payload: { text: "Engineers ___ a new quantum algorithm.", correctAnswers: ["are developing"], caseSensitive: false }, explanation: "Present Continuous: are + verb-ing." },
    { type: "MULTIPLE_CHOICE", prompt: "Present Continuous: choose the correct form.", payload: { options: ["change", "changes", "is changing", "changed"], correctIndex: 2 }, explanation: "AI is changing the medical field right now — current trend." },
    // GRAMMAR — adjective opposites
    { type: "FILL_BLANK", prompt: "Adjective opposite: complete the sentence.", payload: { text: "Linux is open-source; Windows is ___.", correctAnswers: ["proprietary"], caseSensitive: false }, explanation: "open-source ↔ proprietary." },
    { type: "MULTIPLE_CHOICE", prompt: "Adjective opposite: the opposite of 'modern' is ___.", payload: { options: ["outdated", "portable", "secure", "wireless"], correctIndex: 0 }, explanation: "modern ↔ outdated." },
    // READING — comprehension of the unit text
    { type: "MULTIPLE_CHOICE", prompt: "Reading: According to the text, what is replacing outdated technologies?", payload: { options: ["Wireless networks", "Modern cloud infrastructure", "Interactive platforms", "Online courses"], correctIndex: 1 }, explanation: "'Modern cloud infrastructure is taking the place of outdated technologies.'" },
    { type: "DRAG_DROP", prompt: "Put the words in the correct order (Present Continuous).", payload: { words: ["AI", "is", "getting", "more", "powerful", "every", "day"] } },
    // WRITING — current trend paragraph
    { type: "SHORT_WRITING", prompt: "Writing: Write a paragraph about a current trend in digital technology (AI, cybersecurity, 5G, robotics, or cloud computing). Use the Present Continuous and at least four adjectives, including two opposites. Say what is happening now, describe the technology, its impact, and your opinion.", payload: { minWords: 100, maxWords: 120, rubric: "Assess: correct Present Continuous for current actions/trends, at least four adjectives with two opposites, clear structure (what is happening / description / impact / opinion), relevant tech vocabulary." } },
    // SPEAKING — recent development
    { type: "SPEAKING_RESPONSE", prompt: "Speaking: Using the Present Continuous, explain a recent development in digital technology (e.g. AI in teaching, 5G growth, social media algorithms). Describe what is happening now and why it matters.", payload: { expectedKeyPoints: ["a recent tech development named", "Present Continuous to describe current actions", "what is changing right now", "why it matters"], minSeconds: 30, maxSeconds: 90 } },
  ],
  4: [
    // VOCABULARY (Reading) — computer hardware terms
    { type: "MATCH_PAIRS", prompt: "Vocabulary: match each hardware term with its definition.", payload: { pairs: [
      { left: "CPU", right: "the brain of a computer that processes instructions" },
      { left: "RAM", right: "temporary working memory" },
      { left: "SSD", right: "fast permanent storage" },
      { left: "GPU", right: "handles visual data" },
      { left: "motherboard", right: "the main circuit board connecting all components" },
      { left: "cache", right: "small, fast memory for frequently used data" },
    ] }, explanation: "Key terms from the Unit 4 glossary." },
    // GRAMMAR — there is / there are
    { type: "FILL_BLANK", prompt: "There is / there are: complete the sentence.", payload: { text: "___ several USB-C ports on the new MacBook.", correctAnswers: ["There are"], caseSensitive: false }, explanation: "Use 'There are' with plural nouns." },
    { type: "MULTIPLE_CHOICE", prompt: "There is / there are: choose the correct form.", payload: { options: ["There is", "There are", "There be", "It have"], correctIndex: 0 }, explanation: "'There is' + singular noun: There is a GPU in every gaming computer." },
    // GRAMMAR — countable / uncountable + quantity
    { type: "FILL_BLANK", prompt: "Quantity words: choose much or many.", payload: { text: "How ___ RAM does your laptop have?", correctAnswers: ["much"], caseSensitive: false }, explanation: "RAM/memory is uncountable → 'much'." },
    { type: "MULTIPLE_CHOICE", prompt: "Countable / uncountable: We have ___ data to process this week.", payload: { options: ["many", "much", "a few", "several"], correctIndex: 1 }, explanation: "'data' is uncountable → 'much'." },
    // READING — comprehension of the unit text
    { type: "MULTIPLE_CHOICE", prompt: "Reading: According to the text, which component is the 'brain' of the computer?", payload: { options: ["RAM", "CPU", "GPU", "SSD"], correctIndex: 1 }, explanation: "The CPU is described as the system's brain." },
    { type: "DRAG_DROP", prompt: "Put the words in the correct order (there is/are).", payload: { words: ["There", "are", "several", "ports", "on", "the", "laptop"] } },
    // WRITING — describe the ideal computer
    { type: "SHORT_WRITING", prompt: "Writing: Describe the ideal computer for a computer engineering student in technical terms. Use countable/uncountable nouns, quantity expressions and is/are. Mention the CPU, RAM, GPU, storage, display, operating system and software tools.", payload: { minWords: 100, maxWords: 120, rubric: "Assess: correct there is/are and countable/uncountable usage, appropriate quantity words (much/many/several/a lot of), all required components covered, accurate technical vocabulary." } },
    // SPEAKING — ideal workstation
    { type: "SPEAKING_RESPONSE", prompt: "Speaking: Present your ideal $2,000 engineering workstation (CPU, RAM, storage, GPU, display). Use there is/are and justify your choices.", payload: { expectedKeyPoints: ["CPU and number of cores", "amount of RAM", "storage type and size", "GPU and display choices", "there is/are used to describe the build"], minSeconds: 30, maxSeconds: 90 } },
  ],
  5: [
    // VOCABULARY (Reading) — navigation & comparison terms
    { type: "MATCH_PAIRS", prompt: "Vocabulary: match each term with its definition.", payload: { pairs: [
      { left: "navigation", right: "moving between pages or sections in a digital system" },
      { left: "interface", right: "the part of a program users interact with" },
      { left: "latency", right: "the delay between a request and the system's response" },
      { left: "protocol", right: "a set of rules governing how data is transmitted" },
      { left: "benchmark", right: "a standard used to measure and compare performance" },
      { left: "trade-off", right: "accepting one disadvantage to gain an advantage" },
    ] }, explanation: "Key terms from the Unit 5 glossary." },
    // GRAMMAR — prepositions of place
    { type: "FILL_BLANK", prompt: "Preposition of place: complete the sentence.", payload: { text: "The navigation bar is ___ the top of the interface.", correctAnswers: ["at"], caseSensitive: false }, explanation: "'at' for a specific point or place." },
    { type: "MULTIPLE_CHOICE", prompt: "Preposition of place: The server is ___ the data centre.", payload: { options: ["in", "on", "at", "between"], correctIndex: 0 }, explanation: "'in' for inside a space or area." },
    // GRAMMAR — degrees of comparison
    { type: "MULTIPLE_CHOICE", prompt: "Degrees of comparison: HTTPS is ___ than HTTP.", payload: { options: ["safe", "safer", "safest", "more safe"], correctIndex: 1 }, explanation: "Comparative of a short adjective: safe → safer." },
    { type: "FILL_BLANK", prompt: "Degrees of comparison: use the superlative of 'high'.", payload: { text: "Of all the systems tested, this one has the ___ bandwidth.", correctAnswers: ["highest"], caseSensitive: false }, explanation: "Superlative: high → highest." },
    // READING — comprehension of the unit text
    { type: "MULTIPLE_CHOICE", prompt: "Reading: What does research show happens if a website takes more than three seconds to load?", payload: { options: ["It crashes", "Over half of visitors leave", "Latency drops to zero", "The server restarts"], correctIndex: 1 }, explanation: "Over half of visitors will leave if loading takes more than three seconds." },
    { type: "DRAG_DROP", prompt: "Put the words in the correct order.", payload: { words: ["HTTPS", "transfers", "data", "between", "browser", "and", "server"] } },
    // WRITING — compare two operating systems
    { type: "SHORT_WRITING", prompt: "Writing: Write a paragraph that compares two operating systems (e.g. Windows, Linux, macOS). Use prepositions of place and comparative/superlative degrees. Mention where important settings are located, which is faster/safer/easier to use, and your recommendation.", payload: { minWords: 100, maxWords: 120, rubric: "Assess: correct prepositions of place, accurate comparative/superlative forms, at least five unit vocabulary terms, a clear recommendation, coherent paragraph." } },
    // SPEAKING — mini presentation
    { type: "SPEAKING_RESPONSE", prompt: "Speaking: Give a short presentation on how 'Digital Navigation & Tech Comparisons' will affect your future work as a computer engineer. Compare two technologies and say which is better and why.", payload: { expectedKeyPoints: ["topic introduced", "two technologies compared", "comparative/superlative language used", "a justified opinion or recommendation"], minSeconds: 30, maxSeconds: 90 } },
  ],
  6: [
    // VOCABULARY (Reading) — computing history terms
    { type: "MATCH_PAIRS", prompt: "Vocabulary: match each term with its definition.", payload: { pairs: [
      { left: "problem-solving", right: "the process of finding solutions to complex issues" },
      { left: "computing", right: "using computers to process data and perform calculations" },
      { left: "engineering", right: "applying scientific and mathematical knowledge to build systems" },
      { left: "instructions", right: "commands given to a computer to perform tasks" },
      { left: "gears", right: "toothed wheels that work together to transmit motion" },
      { left: "Pascaline", right: "an early calculator from 1642 that could add using gears" },
    ] }, explanation: "Key terms from the Unit 6 glossary." },
    // GRAMMAR — Present Perfect (past participle)
    { type: "FILL_BLANK", prompt: "Present Perfect: complete with the correct form of 'use'.", payload: { text: "They ___ this device before.", correctAnswers: ["have used"], caseSensitive: false }, explanation: "Present Perfect: have + past participle." },
    { type: "MULTIPLE_CHOICE", prompt: "Present Perfect: choose the correct auxiliary.", payload: { options: ["have", "has", "had", "is"], correctIndex: 1 }, explanation: "She has not finished her work yet (3rd person → has)." },
    // GRAMMAR — past modals
    { type: "FILL_BLANK", prompt: "Past modal: complete with should + have.", payload: { text: "You ___ studied harder for the exam.", correctAnswers: ["should have"], caseSensitive: false }, explanation: "should have + past participle expresses past regret/advice." },
    { type: "MULTIPLE_CHOICE", prompt: "Past modal: He ___ have done this alone — it was too complex.", payload: { options: ["could not", "should", "will", "can"], correctIndex: 0 }, explanation: "could not have + V3 = it was impossible in the past." },
    // READING — comprehension of the unit text
    { type: "MULTIPLE_CHOICE", prompt: "Reading: Who created the Pascaline in 1642?", payload: { options: ["Alan Turing", "Blaise Pascal", "Charles Babbage", "Ada Lovelace"], correctIndex: 1 }, explanation: "Blaise Pascal, a French mathematician, created the Pascaline in 1642." },
    { type: "DRAG_DROP", prompt: "Put the words in the correct order (Present Perfect).", payload: { words: ["Engineers", "have", "built", "powerful", "computers"] } },
    // WRITING — historical milestone
    { type: "SHORT_WRITING", prompt: "Writing: Write a historical paragraph about a significant computer milestone (e.g. the development of Linux, the internet, or the first smartphone). Use past modal forms and past participles, and at least five terms from this unit.", payload: { minWords: 100, maxWords: 120, rubric: "Assess: correct Present Perfect and past-modal forms (should/could/must + have + V3), accurate past participles, at least five unit terms, a coherent historical account." } },
    // SPEAKING — mini presentation
    { type: "SPEAKING_RESPONSE", prompt: "Speaking: Give a short presentation on the history of computing and IT milestones, and how it influences your future as a computer engineer. Mention one milestone and use Present Perfect / past modals.", payload: { expectedKeyPoints: ["a computing milestone named", "Present Perfect or past-modal forms used", "why the history matters", "a personal reflection"], minSeconds: 30, maxSeconds: 90 } },
  ],
  7: [
    // VOCABULARY (Reading) — software development terms
    { type: "MATCH_PAIRS", prompt: "Vocabulary: match each term with its definition.", payload: { pairs: [
      { left: "development", right: "the process of creating or improving something" },
      { left: "programming language", right: "a formal language used to write instructions for a computer" },
      { left: "application", right: "a software program designed to perform a specific task" },
      { left: "testing", right: "the process of checking software for errors or bugs" },
      { left: "bug", right: "an error or flaw in a computer program" },
      { left: "version control", right: "a system that tracks changes to code over time" },
    ] }, explanation: "Key terms from the Unit 7 glossary." },
    // GRAMMAR — irregular past verbs
    { type: "FILL_BLANK", prompt: "Irregular past: complete with the past form of 'meet'.", payload: { text: "The team ___ the client last Monday.", correctAnswers: ["met"], caseSensitive: false }, explanation: "meet → met (irregular)." },
    { type: "MULTIPLE_CHOICE", prompt: "Irregular past: choose the correct form of 'write'.", payload: { options: ["writed", "wrote", "written", "writes"], correctIndex: 1 }, explanation: "write → wrote (past simple)." },
    // GRAMMAR — sequencing words
    { type: "FILL_BLANK", prompt: "Sequencing word: complete the sentence.", payload: { text: "First we plan the program, ___ we write the code.", correctAnswers: ["then", "next"], caseSensitive: false }, explanation: "Sequencing words show the order of steps." },
    { type: "MULTIPLE_CHOICE", prompt: "Sequencing word: We tested the app, and ___ we deployed it.", payload: { options: ["finally", "before", "first", "during"], correctIndex: 0 }, explanation: "'finally' marks the last step." },
    // READING — comprehension of the unit text
    { type: "MULTIPLE_CHOICE", prompt: "Reading: According to the text, software errors are also known as ___.", payload: { options: ["bugs", "patches", "builds", "scripts"], correctIndex: 0 }, explanation: "Errors found during testing are also known as bugs." },
    { type: "DRAG_DROP", prompt: "Put the development steps in the correct order.", payload: { words: ["First", "plan", "then", "code", "finally", "test"] } },
    // WRITING — informal report
    { type: "SHORT_WRITING", prompt: "Writing: Write an informal report to your professor about a coding project. Describe what you and your team did using irregular past verbs and sequencing words (First we met… Then we chose… After that we built… Finally we tested…). Include at least five unit vocabulary words.", payload: { minWords: 120, maxWords: 150, rubric: "Assess: correct irregular past verbs, clear sequencing words (first/then/next/after that/finally), at least five unit terms, logical project narrative." } },
    // SPEAKING — role-play
    { type: "SPEAKING_RESPONSE", prompt: "Speaking: A junior developer asks about your last project. Describe what happened using irregular past verbs and sequencing words: what you planned, the language you chose, what you built and how you tested it.", payload: { expectedKeyPoints: ["project described in past tense", "irregular past verbs used (met, chose, built, wrote)", "sequencing words (first/then/finally)", "stages of the SDLC mentioned"], minSeconds: 30, maxSeconds: 90 } },
  ],
  8: [
    // VOCABULARY (Reading) — future-tech terms
    { type: "MATCH_PAIRS", prompt: "Vocabulary: match each term with its definition.", payload: { pairs: [
      { left: "quantum computing", right: "computing using quantum mechanical phenomena" },
      { left: "IoT", right: "a network of physical devices with internet connectivity" },
      { left: "cryptography", right: "the science of secure communication through encoding" },
      { left: "autonomous", right: "self-governing; operating without human control" },
      { left: "augmented reality", right: "technology overlaying digital info on the real world" },
      { left: "edge computing", right: "processing data near the source rather than in a cloud" },
    ] }, explanation: "Key terms from the Unit 8 glossary." },
    // GRAMMAR — Future Simple (will)
    { type: "FILL_BLANK", prompt: "Future Simple: complete with will + replace.", payload: { text: "By 2035, AI ___ many repetitive tasks.", correctAnswers: ["will replace"], caseSensitive: false }, explanation: "Future Simple: will + base verb." },
    { type: "MULTIPLE_CHOICE", prompt: "Future Simple (negative): Some jobs ___ exist in 2040.", payload: { options: ["will not", "do not", "are not", "did not"], correctIndex: 0 }, explanation: "Future negative: will not (won't) + base verb." },
    // GRAMMAR — making suggestions
    { type: "FILL_BLANK", prompt: "Suggestion: complete with the modal of advice.", payload: { text: "You ___ learn Python if you want to work in AI.", correctAnswers: ["should"], caseSensitive: false }, explanation: "should + base verb gives advice." },
    { type: "MULTIPLE_CHOICE", prompt: "Suggestion: ___ don't you join a hackathon?", payload: { options: ["Why", "How", "What", "When"], correctIndex: 0 }, explanation: "'Why don't you…' makes a suggestion." },
    // READING — comprehension of the unit text
    { type: "MULTIPLE_CHOICE", prompt: "Reading: According to the text, what will programmers focus on in 2040?", payload: { options: ["Writing simple code", "Design, ethics and high-level problem-solving", "Hardware repair", "Data entry"], correctIndex: 1 }, explanation: "Programmers will focus on design, ethics and high-level problem-solving." },
    { type: "DRAG_DROP", prompt: "Put the words in the correct order (Future Simple).", payload: { words: ["AI", "will", "transform", "every", "industry"] } },
    // WRITING — predictions blog post
    { type: "SHORT_WRITING", prompt: "Writing: Write a blog post titled 'Technology in 2035: My Predictions'. Use will + base verb for certainty and modals for advice. Make three predictions with explanations.", payload: { minWords: 100, maxWords: 120, rubric: "Assess: correct Future Simple (will + verb), at least three clear predictions with explanations, some suggestion/advice language, relevant future-tech vocabulary, coherent blog style." } },
    // SPEAKING — mini presentation
    { type: "SPEAKING_RESPONSE", prompt: "Speaking: Give a short presentation on the future of technology and how it will affect your career. Make predictions with 'will' and give advice on what students should study.", payload: { expectedKeyPoints: ["predictions with will", "a future technology described", "advice on what to study (should/ought to)", "impact on a computer engineer's career"], minSeconds: 30, maxSeconds: 90 } },
  ],
  9: [
    // VOCABULARY (Reading) — professional communication terms
    { type: "MATCH_PAIRS", prompt: "Vocabulary: match each term with its definition.", payload: { pairs: [
      { left: "standup", right: "a short daily team meeting (usually 15 minutes)" },
      { left: "blocker", right: "a problem that stops progress on a task" },
      { left: "pull request", right: "a request to merge code changes into the main branch" },
      { left: "stakeholder", right: "a person with an interest in the project outcome" },
      { left: "escalate", right: "to raise an issue to a higher level of management" },
      { left: "delegate", right: "to assign a task to another person" },
    ] }, explanation: "Key terms from the Unit 9 glossary." },
    // GRAMMAR — collocations do/make/have/take/bring
    { type: "MULTIPLE_CHOICE", prompt: "Collocation: We need to ___ a decision about the server upgrade.", payload: { options: ["do", "make", "have", "take"], correctIndex: 1 }, explanation: "make a decision (not 'do a decision')." },
    { type: "FILL_BLANK", prompt: "Collocation: complete with do/make/have/take/bring.", payload: { text: "Engineers always ___ notes during requirements sessions.", correctAnswers: ["take"], caseSensitive: false }, explanation: "take notes." },
    { type: "MULTIPLE_CHOICE", prompt: "Collocation: Let's ___ a meeting to discuss this issue.", payload: { options: ["do", "make", "have", "take"], correctIndex: 2 }, explanation: "have a meeting (not 'take a meeting')." },
    { type: "FILL_BLANK", prompt: "Collocation: complete with the past form of the right verb.", payload: { text: "Yesterday she ___ research before the meeting.", correctAnswers: ["did"], caseSensitive: false }, explanation: "do research → did research (not 'made research')." },
    // READING — comprehension of the unit text
    { type: "MULTIPLE_CHOICE", prompt: "Reading: According to the text, what do the best IT communicators bring?", payload: { options: ["Problems", "Excuses", "Solutions", "Deadlines"], correctIndex: 2 }, explanation: "The best communicators bring solutions, not just problems." },
    { type: "DRAG_DROP", prompt: "Put the words in the correct order.", payload: { words: ["The", "best", "communicators", "bring", "solutions", "not", "problems"] } },
    // WRITING — email to manager
    { type: "SHORT_WRITING", prompt: "Writing: Write a short email to your manager about your current task. Use collocations: make progress, have a problem, take action, bring solutions. Report what you have done, any blocker, and your plan.", payload: { minWords: 100, maxWords: 120, rubric: "Assess: correct collocations with do/make/have/take/bring, professional email tone, progress + blocker + plan covered, clarity and politeness." } },
    // SPEAKING — standup simulation
    { type: "SPEAKING_RESPONSE", prompt: "Speaking: Give a 60-second standup update: 'Yesterday I… Today I will… I have a blocker:…'. Use collocations with do/make/have/take/bring naturally.", payload: { expectedKeyPoints: ["what you did yesterday", "what you will do today", "a blocker stated", "collocations used (make progress, take action, have a problem)"], minSeconds: 30, maxSeconds: 90 } },
  ],
  10: [
    // VOCABULARY (Reading) — cybersecurity terms
    { type: "MATCH_PAIRS", prompt: "Vocabulary: match each term with its definition.", payload: { pairs: [
      { left: "ransomware", right: "malware that encrypts files and demands payment to restore them" },
      { left: "vulnerability", right: "a weakness in a system that can be exploited by attackers" },
      { left: "patch", right: "a software update that fixes a security flaw" },
      { left: "malware", right: "malicious software designed to harm computer systems" },
      { left: "firewall", right: "security software that monitors and controls network traffic" },
      { left: "phishing", right: "a fraudulent attempt to steal sensitive information via fake messages" },
    ] }, explanation: "Key terms from the Unit 10 glossary." },
    // GRAMMAR — Past Simple
    { type: "MULTIPLE_CHOICE", prompt: "Past Simple: choose the correct form of 'begin'.", payload: { options: ["began", "begun", "beginned", "begins"], correctIndex: 0 }, explanation: "begin → began (irregular past simple)." },
    { type: "FILL_BLANK", prompt: "Past Simple: complete with the past form of 'appear'.", payload: { text: "While she was typing her password, an alert ___.", correctAnswers: ["appeared"], caseSensitive: false }, explanation: "Past Simple for the short interrupting action." },
    // GRAMMAR — Past Continuous
    { type: "FILL_BLANK", prompt: "Past Continuous: complete with the correct form of 'analyze'.", payload: { text: "While engineers ___ the code, the malware was spreading.", correctAnswers: ["were analyzing", "were analysing"], caseSensitive: false }, explanation: "Past Continuous: were + verb-ing." },
    { type: "MULTIPLE_CHOICE", prompt: "Past Continuous: What ___ you doing when the attack started?", payload: { options: ["was", "were", "did", "are"], correctIndex: 1 }, explanation: "'you' takes 'were' in the past continuous." },
    // READING — comprehension of the unit text
    { type: "MULTIPLE_CHOICE", prompt: "Reading: How did Marcus Hutchins stop WannaCry?", payload: { options: ["He paid the ransom", "He registered a hidden domain (a kill switch)", "He rebooted every server", "He wrote a new firewall"], correctIndex: 1 }, explanation: "He registered a hidden domain found in the code, which activated a kill switch." },
    { type: "DRAG_DROP", prompt: "Put the words in the correct order (Past Continuous).", payload: { words: ["The", "malware", "was", "spreading", "across", "networks"] } },
    // WRITING — incident report
    { type: "SHORT_WRITING", prompt: "Writing: Write a cybersecurity incident report. Scenario: your company's database was breached at 2 am last Tuesday. Use Past Simple (what happened) and Past Continuous (what was happening at the time). Include when it happened, what was occurring, what the team did and what action was taken.", payload: { minWords: 130, maxWords: 160, rubric: "Assess: correct Past Simple and Past Continuous (including while/when patterns), clear timeline, at least five unit terms, professional report structure." } },
    // SPEAKING — crime investigation role-play
    { type: "SPEAKING_RESPONSE", prompt: "Speaking: You are a cybersecurity detective reconstructing an attack. Describe what was happening when the breach occurred and what the team did, using Past Simple and Past Continuous.", payload: { expectedKeyPoints: ["what was happening when the attack started (Past Continuous)", "what the team did (Past Simple)", "a while/when sentence", "the outcome of the incident"], minSeconds: 30, maxSeconds: 90 } },
  ],
  11: [
    // VOCABULARY (Reading) — computing-evolution terms
    { type: "MATCH_PAIRS", prompt: "Vocabulary: match each term with its definition.", payload: { pairs: [
      { left: "wearable", right: "a computing device designed to be worn on the body" },
      { left: "portable", right: "easy to carry or move around" },
      { left: "lightweight", right: "low in weight, especially for its size" },
      { left: "processing power", right: "the speed and capacity of a CPU to perform calculations" },
      { left: "obsolete", right: "no longer in use or useful" },
      { left: "cutting-edge", right: "at the most advanced stage of development" },
    ] }, explanation: "Key terms from the Unit 11 glossary." },
    // GRAMMAR — past tenses review
    { type: "MULTIPLE_CHOICE", prompt: "Past Perfect: By 2007, Apple ___ a revolutionary mobile device.", payload: { options: ["created", "has created", "had created", "was creating"], correctIndex: 2 }, explanation: "Past Perfect (had + V3) for an action completed before another past point." },
    { type: "FILL_BLANK", prompt: "Past Continuous: complete with the correct form of 'develop'.", payload: { text: "While IBM ___ mainframes, Apple designed personal computers.", correctAnswers: ["was developing"], caseSensitive: false }, explanation: "Past Continuous for the longer background action." },
    { type: "FILL_BLANK", prompt: "Past Simple: complete with the past form of 'weigh'.", payload: { text: "The ENIAC ___ 27 tons and occupied an entire building.", correctAnswers: ["weighed"], caseSensitive: false }, explanation: "Past Simple for a completed past fact." },
    // GRAMMAR — adjective order
    { type: "MULTIPLE_CHOICE", prompt: "Adjective order (Opinion → Size → Age): choose the correct phrase.", payload: { options: ["a powerful small new laptop", "a new small powerful laptop", "a small new powerful laptop", "a new powerful small laptop"], correctIndex: 0 }, explanation: "Order: opinion (powerful) → size (small) → age (new)." },
    // READING — comprehension of the unit text
    { type: "MULTIPLE_CHOICE", prompt: "Reading: According to the text, how heavy was the ENIAC?", payload: { options: ["2 tons", "27 tons", "270 kg", "7 tons"], correctIndex: 1 }, explanation: "The ENIAC weighed 27 tons and occupied an entire building." },
    { type: "DRAG_DROP", prompt: "Put the words in the correct order.", payload: { words: ["Modern", "wearable", "devices", "are", "thin", "and", "flexible"] } },
    // WRITING — comparative history
    { type: "SHORT_WRITING", prompt: "Writing: Write a comparative history paragraph titled 'How Computers Have Changed in 50 Years'. Use Past Simple, Past Perfect and descriptive adjectives. Compare 1975 computers with 2025 smartphones across size, speed and price.", payload: { minWords: 130, maxWords: 160, rubric: "Assess: correct Past Simple and Past Perfect, varied descriptive adjectives, comparison across size/speed/price, at least five unit terms, coherent historical paragraph." } },
    // SPEAKING — describe and guess / timeline
    { type: "SPEAKING_RESPONSE", prompt: "Speaking: Describe how computing devices have evolved from room-sized machines to wearables. Use descriptive adjectives and past tenses to compare at least two eras.", payload: { expectedKeyPoints: ["at least two eras of devices compared", "descriptive adjectives (enormous, sleek, lightweight…)", "past tenses used correctly", "a clear trend described"], minSeconds: 30, maxSeconds: 90 } },
  ],
  12: [
    // VOCABULARY (Reading) — big-data terms
    { type: "MATCH_PAIRS", prompt: "Vocabulary: match each term with its definition.", payload: { pairs: [
      { left: "zettabyte", right: "a unit for measuring enormous data volumes (10^21 bytes)" },
      { left: "distributed", right: "spread across multiple servers or locations" },
      { left: "pipeline", right: "a set of automated processes for data flow" },
      { left: "throughput", right: "the amount of data processed in a given time" },
      { left: "structured data", right: "data organized in a predefined format like a table" },
      { left: "analytics", right: "the discovery of patterns and insights in data" },
    ] }, explanation: "Key terms from the Unit 12 glossary." },
    // GRAMMAR — quantity words
    { type: "FILL_BLANK", prompt: "Quantity word: choose much or many.", payload: { text: "There is not ___ free storage left on the server.", correctAnswers: ["much"], caseSensitive: false }, explanation: "'storage' is uncountable → 'much'." },
    { type: "MULTIPLE_CHOICE", prompt: "Quantity word: How ___ users can the system support at once?", payload: { options: ["much", "many", "little", "a great deal"], correctIndex: 1 }, explanation: "'users' is countable → 'many'." },
    // GRAMMAR — modal verbs
    { type: "MULTIPLE_CHOICE", prompt: "Modal verb (obligation): All user data ___ be encrypted before storage.", payload: { options: ["must", "might", "could", "may"], correctIndex: 0 }, explanation: "must = strong obligation/necessity." },
    { type: "FILL_BLANK", prompt: "Modal verb (advice): complete the sentence.", payload: { text: "Engineers ___ learn SQL before NoSQL.", correctAnswers: ["should"], caseSensitive: false }, explanation: "should = advice/recommendation." },
    // READING — comprehension of the unit text
    { type: "MULTIPLE_CHOICE", prompt: "Reading: What are the 3 Vs of Big Data?", payload: { options: ["Volume, Velocity, Variety", "Value, Volume, Verify", "Volume, Vision, Variety", "Velocity, Value, Volume"], correctIndex: 0 }, explanation: "The 3 Vs are Volume, Velocity and Variety." },
    { type: "DRAG_DROP", prompt: "Put the words in the correct order (modal verb).", payload: { words: ["Engineers", "must", "encrypt", "all", "personal", "data"] } },
    // WRITING — recommendation letter
    { type: "SHORT_WRITING", prompt: "Writing: Write a formal recommendation letter to an IT manager suggesting upgrades to the company's data infrastructure. Use modal verbs (must/should/could) and quantity expressions (much/many/a lot of/billions of).", payload: { minWords: 100, maxWords: 120, rubric: "Assess: correct modal verbs for obligation/advice/possibility, accurate quantity expressions, formal letter tone, concrete infrastructure recommendations, at least five unit terms." } },
    // SPEAKING — mini presentation
    { type: "SPEAKING_RESPONSE", prompt: "Speaking: Give a short presentation on big data management and how it affects your future career. Use modal verbs to state what engineers must/should do and quantity expressions to describe the scale of data.", payload: { expectedKeyPoints: ["the scale of big data described with quantity words", "the 3 Vs or key challenges", "modal verbs (must/should) for best practices", "impact on a computer engineer's career"], minSeconds: 30, maxSeconds: 90 } },
  ],
  13: [
    // VOCABULARY (Reading) — performance terms
    { type: "MATCH_PAIRS", prompt: "Vocabulary: match each term with its definition.", payload: { pairs: [
      { left: "optimization", right: "the process of making something as effective as possible" },
      { left: "bottleneck", right: "the slowest part of a system that limits overall performance" },
      { left: "profiling", right: "measuring where a program spends its time and resources" },
      { left: "memory leak", right: "a program failing to release memory it no longer needs" },
      { left: "index", right: "a data structure that speeds up database query performance" },
      { left: "concurrency", right: "running multiple tasks simultaneously" },
    ] }, explanation: "Key terms from the Unit 13 glossary." },
    // GRAMMAR — degrees of comparison
    { type: "MULTIPLE_CHOICE", prompt: "Comparison: An SSD is ___ faster than an HDD.", payload: { options: ["much", "very", "more", "most"], correctIndex: 0 }, explanation: "'much' intensifies a comparative; 'very' cannot." },
    { type: "FILL_BLANK", prompt: "Comparison (irregular superlative of 'bad').", payload: { text: "This is the ___ memory leak I have ever seen.", correctAnswers: ["worst"], caseSensitive: false }, explanation: "bad → worse → the worst." },
    { type: "FILL_BLANK", prompt: "Equality (as … as): complete the sentence.", payload: { text: "Python is not as fast ___ C++ for system-level programming.", correctAnswers: ["as"], caseSensitive: false }, explanation: "as + adjective + as expresses equality." },
    // GRAMMAR — idiomatic expressions
    { type: "MULTIPLE_CHOICE", prompt: "Idiom: '___ the hood' means the internal workings of a system.", payload: { options: ["Under", "Behind", "Inside", "Below"], correctIndex: 0 }, explanation: "'under the hood' = the internal workings." },
    // READING — comprehension of the unit text
    { type: "MULTIPLE_CHOICE", prompt: "Reading: According to the text, what is often the biggest bottleneck in web applications?", payload: { options: ["Memory leaks", "Database queries", "Network speed", "CPU cache"], correctIndex: 1 }, explanation: "Database queries are often the biggest bottleneck." },
    { type: "DRAG_DROP", prompt: "Put the words in the correct order (superlative).", payload: { words: ["Profiling", "is", "the", "most", "important", "first", "step"] } },
    // WRITING — opinion essay
    { type: "SHORT_WRITING", prompt: "Writing: Write an opinion essay titled 'What is the Most Important Skill for a Computer Engineer?'. Use at least six comparative/superlative adjectives and at least two idiomatic expressions. Structure: intro → reason 1 → reason 2 → counter-argument → conclusion.", payload: { minWords: 130, maxWords: 160, rubric: "Assess: at least six correct comparative/superlative forms, at least two idioms used naturally, clear essay structure with counter-argument, at least five unit terms." } },
    // SPEAKING — pitch game
    { type: "SPEAKING_RESPONSE", prompt: "Speaking: In 60 seconds, persuade the class that your chosen programming language is the best, fastest and most powerful. Use superlatives, comparatives and at least one idiom.", payload: { expectedKeyPoints: ["a language chosen and praised", "superlatives and comparatives used", "at least one idiom", "a persuasive, confident pitch"], minSeconds: 30, maxSeconds: 90 } },
  ],
  14: [
    // VOCABULARY (Reading) — project & risk terms
    { type: "MATCH_PAIRS", prompt: "Vocabulary: match each term with its definition.", payload: { pairs: [
      { left: "risk register", right: "a document tracking all identified risks in a project" },
      { left: "mitigation", right: "action taken to reduce the impact of a risk" },
      { left: "contingency", right: "a plan for dealing with a possible future problem" },
      { left: "scope creep", right: "the uncontrolled expansion of project requirements" },
      { left: "critical path", right: "the sequence of tasks that determines the minimum project duration" },
      { left: "dependency", right: "a task that cannot start until another task is completed" },
    ] }, explanation: "Key terms from the Unit 14 glossary." },
    // GRAMMAR — first conditional
    { type: "MULTIPLE_CHOICE", prompt: "First conditional (result clause): If the code compiles, the tests ___ automatically.", payload: { options: ["run", "will run", "ran", "would run"], correctIndex: 1 }, explanation: "First conditional: if + present, will + base verb." },
    { type: "FILL_BLANK", prompt: "First conditional (if clause): complete with 'not test'.", payload: { text: "If engineers ___ the API, bugs will reach production.", correctAnswers: ["do not test", "don't test"], caseSensitive: false }, explanation: "Use Present Simple in the if clause — never 'will'." },
    { type: "MULTIPLE_CHOICE", prompt: "First conditional: choose the correct if-clause form.", payload: { options: ["will test", "test", "tested", "testing"], correctIndex: 1 }, explanation: "If you test the code… (Present Simple, not 'will')." },
    // GRAMMAR — unless
    { type: "FILL_BLANK", prompt: "Conditional with 'unless' (= if … not).", payload: { text: "___ we fix the bug now, users will see the error.", correctAnswers: ["Unless"], caseSensitive: false }, explanation: "'Unless' means 'if … not'." },
    // READING — comprehension of the unit text
    { type: "MULTIPLE_CHOICE", prompt: "Reading: According to the text, what happens if a team skips testing?", payload: { options: ["The project finishes faster", "Critical bugs will reach end users", "The client pays more", "The budget increases"], correctIndex: 1 }, explanation: "If developers skip testing, critical bugs will reach end users." },
    { type: "DRAG_DROP", prompt: "Put the words in the correct order (first conditional).", payload: { words: ["If", "you", "ignore", "the", "issue", "it", "will", "grow"] } },
    // WRITING — internship application letter
    { type: "SHORT_WRITING", prompt: "Writing: Write a formal letter applying for an IT internship at IT Park, Tashkent. Use the first conditional at least five times ('If I get this internship, I will…'). Include why you want it, what you offer and what you hope to achieve.", payload: { minWords: 130, maxWords: 160, rubric: "Assess: at least five correct first-conditional sentences (Present Simple if-clause + will), formal letter tone, clear motivation and offer, at least five unit terms." } },
    // SPEAKING — project risk role-play
    { type: "SPEAKING_RESPONSE", prompt: "Speaking: You are a project manager explaining the risks of a software project to a client. Describe at least three risks using the first conditional ('If we miss this milestone, the launch will be delayed').", payload: { expectedKeyPoints: ["at least three risks stated", "first conditional used correctly", "a mitigation or contingency suggested", "clear, professional explanation"], minSeconds: 30, maxSeconds: 90 } },
  ],
  15: [
    // VOCABULARY (Reading) — achievement terms
    { type: "MATCH_PAIRS", prompt: "Vocabulary: match each term with its definition.", payload: { pairs: [
      { left: "achievement", right: "something accomplished, especially through effort" },
      { left: "breakthrough", right: "an important discovery solving a long-standing problem" },
      { left: "contribute", right: "to give something (time, code, money) to a shared goal" },
      { left: "pioneer", right: "to be among the first to develop something new" },
      { left: "surpass", right: "to exceed a previous limit or standard" },
      { left: "iterate", right: "to repeat a process, making improvements each time" },
    ] }, explanation: "Key terms from the Unit 15 glossary." },
    // GRAMMAR — Present Perfect
    { type: "FILL_BLANK", prompt: "Present Perfect (negative): complete with 'not deploy'.", payload: { text: "We ___ the update yet — we are still testing.", correctAnswers: ["have not deployed", "haven't deployed"], caseSensitive: false }, explanation: "Present Perfect negative: have not + past participle." },
    { type: "MULTIPLE_CHOICE", prompt: "Present Perfect: The team ___ just released version 3.0.", payload: { options: ["have", "has", "had", "having"], correctIndex: 1 }, explanation: "'The team' (singular) → has + past participle." },
    { type: "FILL_BLANK", prompt: "Present Perfect question (ever): complete the sentence.", payload: { text: "___ you ever contributed to an open-source project?", correctAnswers: ["Have"], caseSensitive: false }, explanation: "Question form: Have you + past participle." },
    // GRAMMAR — since / for
    { type: "MULTIPLE_CHOICE", prompt: "Present Perfect: She has worked here ___ 2021.", payload: { options: ["since", "for", "from", "in"], correctIndex: 0 }, explanation: "'since' + a point in time; 'for' + a period." },
    // READING — comprehension of the unit text
    { type: "MULTIPLE_CHOICE", prompt: "Reading: According to the text, what has happened to the number of IT specialists in Uzbekistan in the last five years?", payload: { options: ["It has halved", "It has doubled", "It has stayed the same", "It has tripled"], correctIndex: 1 }, explanation: "The number of IT specialists has doubled in the last five years." },
    { type: "DRAG_DROP", prompt: "Put the words in the correct order (Present Perfect).", payload: { words: ["Computer", "scientists", "have", "achieved", "remarkable", "things"] } },
    // WRITING — GitHub blog post
    { type: "SHORT_WRITING", prompt: "Writing: Write a blog post titled 'My First Steps on GitHub — What I Have Learned'. Use the Present Perfect at least eight times ('I have created… I have uploaded… The experience has taught me…'). Include what you have done, what has been challenging, what you have not done yet, and your next plans.", payload: { minWords: 130, maxWords: 160, rubric: "Assess: at least eight correct Present Perfect sentences, varied signal words (already/yet/just/since/for), reflective blog tone, at least five unit terms." } },
    // SPEAKING — achievement share / interview
    { type: "SPEAKING_RESPONSE", prompt: "Speaking: Share three things you have achieved this semester using the Present Perfect ('I have learned… I have built… I have completed…'), then answer as if in a job interview ('Have you ever used Python? Yes, I have…').", payload: { expectedKeyPoints: ["three achievements in Present Perfect", "correct have/has + past participle", "signal words (ever/already/just)", "a confident self-presentation"], minSeconds: 30, maxSeconds: 90 } },
  ],
  16: [
    // VOCABULARY (Reading) — innovation terms
    { type: "MATCH_PAIRS", prompt: "Vocabulary: match each term with its definition.", payload: { pairs: [
      { left: "hypothetical", right: "based on a possible situation that has not happened" },
      { left: "decentralized", right: "distributed without a single controlling authority" },
      { left: "cryptographic identity", right: "a unique, unforgeable digital identity based on encryption" },
      { left: "semantic web", right: "a web where data has meaning that computers can interpret" },
      { left: "disruptive", right: "radically changing an existing industry or market" },
      { left: "prototype", right: "a first version of a product used to test a concept" },
    ] }, explanation: "Key terms from the Unit 16 glossary." },
    // GRAMMAR — second conditional
    { type: "FILL_BLANK", prompt: "Second conditional (result): complete with 'redesign'.", payload: { text: "If I had unlimited resources, I ___ the internet.", correctAnswers: ["would redesign"], caseSensitive: false }, explanation: "Second conditional: if + past simple, would + base verb." },
    { type: "MULTIPLE_CHOICE", prompt: "Second conditional (if clause): If quantum computers ___ for everyday use, encryption would need to change.", payload: { options: ["exist", "existed", "will exist", "would exist"], correctIndex: 1 }, explanation: "Use Past Simple in the if-clause, never 'would'." },
    { type: "FILL_BLANK", prompt: "Second conditional: use the formal form of 'be' for he/she/it.", payload: { text: "If he ___ the CTO, he would not use this architecture.", correctAnswers: ["were"], caseSensitive: false }, explanation: "Use 'were' (not 'was') with I/he/she/it in formal writing." },
    { type: "MULTIPLE_CHOICE", prompt: "Second conditional: choose the correct sentence.", payload: { options: ["If I had more time, I would learn Rust.", "If I would have more time, I would learn Rust.", "If I will have more time, I would learn Rust.", "If I have more time, I would learn Rust."], correctIndex: 0 }, explanation: "Never use 'would' in the if-clause." },
    // READING — comprehension of the unit text
    { type: "MULTIPLE_CHOICE", prompt: "Reading: What would Tim Berners-Lee build into the web if he designed it today?", payload: { options: ["More ads", "Privacy, decentralization and semantic data", "A single global authority", "Faster servers only"], correctIndex: 1 }, explanation: "He would build in privacy, decentralization and semantic data from the beginning." },
    { type: "DRAG_DROP", prompt: "Put the words in the correct order (second conditional).", payload: { words: ["If", "engineers", "used", "formal", "verification", "the", "code", "would", "be", "safer"] } },
    // WRITING — opinion essay
    { type: "SHORT_WRITING", prompt: "Writing: Write an opinion essay titled 'If I Could Solve One Technology Problem in Uzbekistan, What Would It Be?'. Use the second conditional at least six times. Structure: intro (the problem) → why it matters → your solution (If I… I would…) → impact → conclusion.", payload: { minWords: 140, maxWords: 180, rubric: "Assess: at least six correct second-conditional sentences (Past Simple if-clause + would), clear essay structure, a concrete problem and solution, at least five unit terms." } },
    // SPEAKING — Shark Tank pitch
    { type: "SPEAKING_RESPONSE", prompt: "Speaking: Pitch a hypothetical tech product in 90 seconds using the second conditional ('If I had $1 million, I would build… If users could… they would…').", payload: { expectedKeyPoints: ["a hypothetical product described", "second conditional used (if + past, would + base)", "the benefit to users", "a persuasive pitch"], minSeconds: 30, maxSeconds: 90 } },
  ],
  17: [
    // VOCABULARY (Reading) — technical-writing terms
    { type: "MATCH_PAIRS", prompt: "Vocabulary: match each term with its definition.", payload: { pairs: [
      { left: "documentation", right: "written material explaining how software works or should be used" },
      { left: "user manual", right: "a guide explaining how to use a product" },
      { left: "release notes", right: "a document describing changes in a new software version" },
      { left: "troubleshooting", right: "the process of finding and solving problems" },
      { left: "README", right: "a file in a code repository explaining the project" },
      { left: "changelog", right: "a record of all changes made to a project" },
    ] }, explanation: "Key terms from the Unit 17 glossary." },
    // GRAMMAR — compound nouns
    { type: "FILL_BLANK", prompt: "Compound noun: form one from 'a tool for debugging'.", payload: { text: "A tool for debugging is a ___ tool.", correctAnswers: ["debugging"], caseSensitive: false }, explanation: "verb + noun compound: debugging tool." },
    { type: "MULTIPLE_CHOICE", prompt: "Compound noun: the interface that users interact with is the ___.", payload: { options: ["user interface", "interface user", "using interface", "user-interfacing"], correctIndex: 0 }, explanation: "noun + noun compound: user interface." },
    // GRAMMAR — adjective suffixes
    { type: "MULTIPLE_CHOICE", prompt: "Adjective suffix: You can configure this system, so it is ___.", payload: { options: ["configurable", "configureful", "configureless", "configurive"], correctIndex: 0 }, explanation: "configure → configurable (-able)." },
    { type: "FILL_BLANK", prompt: "Adjective suffix (-less): complete the sentence.", payload: { text: "There are no wires, so the device is ___.", correctAnswers: ["wireless"], caseSensitive: false }, explanation: "wire → wireless (-less)." },
    // READING — comprehension of the unit text
    { type: "MULTIPLE_CHOICE", prompt: "Reading: According to the text, what is one characteristic of good documentation?", payload: { options: ["Jargon-heavy", "User-friendly", "Undocumented", "Hard to navigate"], correctIndex: 1 }, explanation: "Good documentation must be user-friendly, well-structured and version-controlled." },
    { type: "DRAG_DROP", prompt: "Put the words in the correct order.", payload: { words: ["The", "command-line", "tool", "has", "a", "user-friendly", "interface"] } },
    // WRITING — professional email
    { type: "SHORT_WRITING", prompt: "Writing: Write a professional email to a colleague explaining how to use a software feature or API. Use compound nouns (source code, user interface, error message) and adjective suffixes (scalable, configurable, user-friendly).", payload: { minWords: 100, maxWords: 120, rubric: "Assess: at least five compound nouns, at least three adjective suffixes used correctly, clear and precise technical explanation, professional email tone." } },
    // SPEAKING — technical description
    { type: "SPEAKING_RESPONSE", prompt: "Speaking: Describe a software tool to a junior developer using compound nouns and adjectives with suffixes (e.g. 'It has a user-friendly command-line interface and is highly configurable').", payload: { expectedKeyPoints: ["a tool described", "several compound nouns used", "adjective suffixes (-able/-ful/-ive)", "clear technical explanation"], minSeconds: 30, maxSeconds: 90 } },
  ],
  18: [
    // VOCABULARY (Reading) — standards & research terms
    { type: "MATCH_PAIRS", prompt: "Vocabulary: match each term with its definition.", payload: { pairs: [
      { left: "standard", right: "an established technical specification for systems to follow" },
      { left: "protocol", right: "a set of rules for data communication between systems" },
      { left: "peer review", right: "evaluation of work by others in the same field" },
      { left: "citation", right: "a reference to a source in academic or technical writing" },
      { left: "ratify", right: "to formally approve a standard or agreement" },
      { left: "interoperability", right: "the ability of systems to work together" },
    ] }, explanation: "Key terms from the Unit 18 glossary." },
    // GRAMMAR — passive voice
    { type: "FILL_BLANK", prompt: "Past Simple Passive: complete with the passive of 'develop'.", payload: { text: "TCP/IP ___ by ARPA in the 1960s.", correctAnswers: ["was developed"], caseSensitive: false }, explanation: "Past Simple Passive: was/were + past participle." },
    { type: "MULTIPLE_CHOICE", prompt: "Present Perfect Passive: The update ___ to all servers.", payload: { options: ["has deployed", "has been deployed", "is deploying", "was deploy"], correctIndex: 1 }, explanation: "Present Perfect Passive: has been + past participle." },
    { type: "MULTIPLE_CHOICE", prompt: "Present Simple Passive: Standards ___ by technical committees.", payload: { options: ["review", "reviews", "are reviewed", "reviewing"], correctIndex: 2 }, explanation: "Present Simple Passive: are + past participle." },
    { type: "FILL_BLANK", prompt: "Modal Passive: complete with 'encrypt'.", payload: { text: "All personal data must ___.", correctAnswers: ["be encrypted"], caseSensitive: false }, explanation: "Modal Passive: modal + be + past participle." },
    // READING — comprehension of the unit text
    { type: "MULTIPLE_CHOICE", prompt: "Reading: According to the text, who defined the HTTP protocol?", payload: { options: ["IEEE", "ISO", "The W3C", "ARPA"], correctIndex: 2 }, explanation: "The HTTP protocol was defined by the W3C." },
    { type: "DRAG_DROP", prompt: "Put the words in the correct order (Present Continuous Passive).", payload: { words: ["The", "system", "is", "currently", "being", "tested"] } },
    // WRITING — technical abstract
    { type: "SHORT_WRITING", prompt: "Writing: Write a technical abstract for a research paper on any CS topic you studied this semester. Use the passive voice at least eight times. Structure: background → problem → method → results → conclusion.", payload: { minWords: 140, maxWords: 180, rubric: "Assess: at least eight correct passive constructions across tenses, objective academic tone, clear abstract structure (background/problem/method/results/conclusion), at least five unit terms." } },
    // SPEAKING — research presentation
    { type: "SPEAKING_RESPONSE", prompt: "Speaking: Give a 2-minute presentation about a technology standard (USB, HTTP, Bluetooth, Wi-Fi). Use the passive voice to describe how it was created, reviewed and approved.", payload: { expectedKeyPoints: ["a standard chosen", "passive voice used to describe its creation", "who developed/approved it", "why the standard matters"], minSeconds: 30, maxSeconds: 120 } },
  ],
};

/** Все вопросы юнитов из диапазона [from..to] (для сборки экзаменов) */
export function questionsForUnits(from: number, to: number): SeedQ[] {
  const out: SeedQ[] = [];
  for (let n = from; n <= to; n++) {
    out.push(...(UNIT_QUESTIONS[n] ?? []));
  }
  return out;
}

// Богатый контент урока (markdown), взятый из учебника "English for IT".
// Подаётся по 4 навыкам, как в книге: Listening / Reading / Speaking / Writing
// (+ Vocabulary, Grammar, Critical thinking, Digital tasks).
// Если для юнита контента нет — seed использует короткую заглушку.
export const UNIT_CONTENT: Record<number, string> = {
  1: `# Unit 1: Personal portfolio in the digital world

**Grammar focus:** Present Simple — use + singular & plural nouns

## Warm-up
Consider how you present yourself on the internet. Do you have a portfolio website, a LinkedIn page, or a GitHub profile? First impressions matter in the digital world. As a future computer engineer, what would you write about yourself?

## Listening
Watch *"How to Introduce Yourself Professionally"* (~5 minutes, TED-Ed).

*Before listening:* predict what professionals say when they introduce themselves.
*While listening:* note three phrases the speaker uses to explain their line of work.
*After listening:*

- What is the occupation of the speaker?
- Which three abilities does the speaker list?
- What term would you use to introduce yourself?

## Reading
> Hello, I'm Azamat, a student of computer engineering.
>
> I'm Azamat Karimov, and I attend Nukus State Technical University to study computer engineering. I'm a second-year student. I use various digital tools on a daily basis. I write Python and C++ programs using Visual Studio. I save and share my work on GitHub.
>
> My everyday routine is hectic but fascinating. I go to lectures in the morning. I work in the computer lab and complete programming assignments in the afternoon. I spend my evenings reading English-language technical articles on websites like Medium.
>
> English, in my opinion, is crucial for computer engineers. The majority of research papers, tutorials, and documentation are written in English. One day, I hope to speak with multinational teams with confidence.

**Comprehension:** What does Azamat study and where? What tools does he use every day? Why does he think English is important for engineers?

## Vocabulary
Study the key terms and memorise an example for each:

- **software** — programs that run on a computer
- **hardware** — physical components of a computer
- **algorithm** — step-by-step instructions to solve a problem
- **debug** — to find and fix errors in code
- **compile** — to translate source code to machine code
- **repository** — storage for code, often on GitHub
- **interface** — the point where user and system interact
- **syntax** — the rules of writing a programming language

## Grammar focus — Present Simple
Use it for habits, routines, facts and general truths.

**Form:** Subject + base verb (add *-s / -es* for he/she/it).

- *I write code every day.*
- *She uses Python for data analysis.*
- *He does not understand recursion yet.*
- *Do you work with databases?*

**Singular & plural nouns:** file → files, process → processes, datum → data, criterion → criteria, person → people. No plural: software, hardware, information, knowledge.

## Speaking
**Partner interview** — ask your partner, then report back to the class:

- What is your full name and area of expertise?
- Which programming languages are you familiar with?
- Which digital tools do you use daily?
- What kind of projects would you like to work on in the future?

Then use Present Simple to introduce your partner to the class for one minute.

## Writing
Write your personal profile for a GitHub or LinkedIn page (100–120 words, Present Simple). Include your name, university, year and specialty; your daily routine; the languages and tools you know; and a career goal.

## Critical thinking
- Will English proficiency be necessary for programmers to succeed in ten years? Give two reasons.
- "A GitHub profile matters more than a university degree for a developer." Do you agree?

## Digital tasks
- Create a Quizlet set with the 10 vocabulary words and study with *Learn* and *Match*.
- Create a GitHub profile README using your writing task text.
- Ask ChatGPT to act as an IT recruiter and interview you in English using Present Simple.`,

  2: `# Unit 2: Managing time in the digital age

**Grammar focus:** Prepositions of time + time expressions

## Warm-up
Do you miss deadlines? Do you use a digital calendar or task manager? Engineers work on strict timelines — sprints, releases, standups. How do you organise your time as a student?

## Listening
Watch Thomas Frank's *"Time Management for Students"* (~8 minutes).

*Before listening:* which time-management techniques do you use now?
*While listening:* list three methods the speaker suggests.
*After listening:*

- Which digital tools does the speaker mention?
- What advice is most helpful for an engineering student?
- The speaker says: *"Work expands to fill the available time."* What does this mean?

## Reading
> Albert works as a junior developer at a startup in Tashkent. On Monday, he joins a 15-minute standup meeting at 9 AM to begin work. The team talks about their plans for today and their actions from yesterday during the meeting.
>
> He works on new features and develops code in the morning. The team meets for extended planning sessions on Tuesdays and Thursdays. He typically completes at least one assignment by midday.
>
> He writes documentation and reviews his colleague's code in the afternoon. He uploads his code to GitHub at 6:00 PM. He never works beyond midnight because he feels that creative problem-solving requires rest. On Fridays, the team holds a sprint review, where they demonstrate what was built during the week. After work, he spends time on personal projects and online courses.

**Comprehension:** What happens every Monday at 9 AM? What does Albert do by noon each day? What is the Friday meeting called, and what happens during it?

## Vocabulary
- **deadline** — the time by which a task must be completed
- **sprint** — a fixed time period for completing tasks (Agile)
- **standup** — a short daily team meeting (usually 15 min)
- **milestone** — a key point or achievement in a project
- **commit** — to save code changes to a repository
- **schedule** — a plan that shows when tasks will be done
- **deploy** — to make software available for use
- **backlog** — a list of tasks yet to be completed

## Grammar focus — Prepositions of time
- **at** — specific times: *at 9 AM, at noon, at midnight*
- **on** — days and dates: *on Monday, on March 15, on weekdays*
- **in** — periods: *in the morning, in April, in 2025*
- **by** — no later than: *by Friday, by the end of the sprint*
- **during** — throughout a period: *during the meeting, during the course*
- **until** — up to a time: *until midnight, until the deadline*

*Common IT time expressions:* The release is scheduled for next Tuesday. We work in two-week sprints. By the end of the quarter, we must deliver three features.

## Speaking
**Digital time management** — in groups of three, use at least five time prepositions to describe a typical weekday. Then debate: a rigid schedule (same hours daily) vs flexible hours (work when most productive). Use: *In my view… / I believe that… / One benefit of… / Conversely…* Present your group's findings to the class.

## Writing
Write a paragraph about your typical weekday as a computer engineering student (100–120 words). Use at least five different prepositions of time. Cover morning activities, afternoon schedule, evening routine, and a deadline or goal you work toward. Start with: *"My typical weekday as a computer engineering student begins…"*

## Critical thinking
- Is a fixed schedule or flexible working better for a developer? Give reasons.
- How can digital tools both save and waste your time?

## Digital tasks
- Build a Trello or Notion board for this week's tasks with deadlines.
- Create a Quizlet set with the 8 time-management terms.
- Ask ChatGPT to plan an ideal study week for an engineering student and review its advice.`,

  3: `# Unit 3: Digital technologies are changing the world

**Grammar focus:** Present Continuous + adjectives (opposites)

## Warm-up
Look around you. Which digital processes are taking place right now? AI models are learning from data, developers are pushing code, and servers are processing requests around the world.

## Listening
Watch *"How AI is Changing the World"* (Vox, ~8 min).

*Before listening:* list three ways you think AI is influencing society now.
*While listening:* note where AI is changing specific industries.
*After listening:*

- Which industries are mentioned in the video?
- What issues does the speaker raise about AI?
- How will this impact computer engineers in the future?

## Reading
> **The current state of the digital revolution**
>
> The rate at which technology is changing our world is astounding. Thousands of programmers are currently creating programs, writing code, and resolving challenging problems. Every day, artificial intelligence grows more powerful.
>
> AI is being used by businesses to enhance their products and services. To make classes more interesting, educators are using interactive platforms. Through online courses, students are learning new programming frameworks.
>
> Meanwhile, cybersecurity professionals are battling increasingly complex threats. Remote locations are seeing an increase in wireless networks. Modern cloud infrastructure is taking the place of outdated technologies.
>
> The field of computer engineering is advancing at an astounding rate; it is not standing still. Are you ready to take part in this revolution?

**Comprehension:** Find three examples of the present continuous in the text. What are cybersecurity specialists doing now? Can you identify any adjective opposites (e.g. outdated vs current)?

## Vocabulary
- **artificial intelligence** — computer systems that simulate human intelligence
- **cloud computing** — using remote servers over the internet
- **cybersecurity** — protecting systems from digital attacks
- **machine learning** — AI systems that learn from data
- **automation** — technology performing tasks automatically
- **interactive** — allowing two-way communication or response
- **wireless** — free of physical cables
- **innovation** — a new idea, method, or product

## Grammar focus — Present Continuous
**Form:** Subject + am/is/are + verb-ing. Use for:

- current actions: *The server is processing your request.*
- temporary situations: *I am working from home this month.*
- current trends: *AI is changing the medical field.*

Negative: *The system is not responding.* Question: *Are you doing software updates?*

**Adjective opposites in tech:** fast ↔ slow, secure ↔ insecure, modern ↔ outdated, portable ↔ fixed, open-source ↔ proprietary, wireless ↔ wired, efficient ↔ inefficient, encrypted ↔ unencrypted, compatible ↔ incompatible.

## Speaking
Using the Present Continuous, each student explains a recent development in digital technology; the partner asks three follow-up questions. Topics: AI in teaching, cybersecurity challenges, the growth of 5G, electric cars and software, social-media algorithms. Then the class votes on which trend will have the biggest impact in five years.

## Writing
Write a paragraph about a current trend in digital technology (100–120 words). Use the Present Continuous and at least four adjectives (including two opposites). Structure: what is happening now → describe the technology → its impact → your opinion.

## Critical thinking
- *"Automation is destroying more jobs than it creates."* Give one argument for and one against, with IT examples.
- Rank AI, cybersecurity, 5G, blockchain, cloud computing and robotics from most to least important right now — and justify it.
- Should AI systems be allowed to make decisions about loans, diagnosis or hiring? What rules should govern AI decisions?

## Digital tasks
- Post a current tech trend on the class Padlet wall and comment on two classmates' posts.
- Ask ChatGPT for the top 5 technology trends happening right now and evaluate its answer.`,

  4: `# Unit 4: Computer hardware and systems

**Grammar focus:** There is/are + countable & uncountable nouns

## Warm-up
What's inside your phone or computer? Can you identify the parts? Think about what determines a computer's speed, power and reliability. What resources does it need?

## Listening
Watch *"How Does a CPU Work?"* (Techquickie, ~5 min).

*Before listening:* write down five computer components you know.
*While listening:* sketch how data flows through a CPU.
*After listening:*

- What does CPU stand for and what is its job?
- How is RAM different from storage (SSD/HDD)?
- What would happen if a computer had no RAM?

## Reading
> **Inside a modern computer**
>
> A modern computer is made up of numerous crucial parts. The central processing unit (CPU) is the system's brain. The computer also uses random access memory (RAM) to temporarily store data while it operates.
>
> Storage devices come in several forms. Hard disk drives (HDDs) are cheaper but slower than solid-state drives (SSDs), which are fast and silent. A graphics processing unit (GPU) is needed for machine learning and gaming because it handles visual output.
>
> Every computer also has a large amount of software installed — operating systems, apps, background services and security software. At every moment, some data is being processed.
>
> There are different amounts of resources in different computers. A basic laptop may have 8 GB of RAM, while a high-performance server may have several terabytes of memory.

**Comprehension:** What does RAM do? What distinguishes an SSD from an HDD? Find five instances of "there is/are" in the text.

## Vocabulary
- **CPU** — Central Processing Unit, the brain of a computer
- **RAM** — Random Access Memory, temporary working memory
- **SSD** — Solid State Drive, fast permanent storage
- **GPU** — Graphics Processing Unit, handles visual data
- **motherboard** — the main circuit board connecting all components
- **bandwidth** — maximum data transfer rate of a connection
- **cache** — small, fast memory for frequently used data
- **firmware** — permanent software stored on a hardware device

## Grammar focus — There is / There are
- **There is** + singular or uncountable noun: *There is a GPU in every gaming computer. There is not enough memory on this device.*
- **There are** + plural noun: *There are several ports on the back of the laptop.*
- Questions: *Is there a backup of the database? Are there any viruses on this computer?*

**Countable:** program, file, server, error, device, port. **Uncountable:** software, hardware, data, information, memory, bandwidth.

**Quantity words:** countable → many / a few / several; uncountable → much / a little / a great deal of; both → some / any / a lot of / enough / no.

## Speaking
**Build your ideal engineering workstation** (pair task). With a $2,000 budget, design the perfect setup: CPU and cores, RAM (8/16/32/64 GB), storage (SSD size, cloud), GPU, single vs dual monitors. Present your build to the class using there is/are and justify your choices.

## Writing
Describe the ideal computer for a computer engineering student in technical terms (100–120 words). Use countable/uncountable nouns, quantity expressions and is/are. Cover the CPU, RAM, GPU, storage, display, operating system and software tools. Start with: *"The perfect computer for a computer engineering student is…"*

## Critical thinking
- Is it better to buy a powerful laptop or use cloud computing resources? Why?
- Which component gives the biggest performance boost for machine-learning work, and why?

## Digital tasks
- Use an online PC-builder (e.g. PCPartPicker) to spec a workstation within budget.
- Create a Quizlet set with the 8 hardware terms.
- Ask ChatGPT to compare SSD vs HDD for a developer and check the explanation.`,

  5: `# Unit 5: Digital navigation and tech comparisons

**Grammar focus:** Prepositions of place + degrees of comparison

## Warm-up
Think about tech comparisons and digital navigation. What do you already know? What questions do you have? Discuss with a partner before starting.

## Listening
Watch *"Prepositions of Place"* (Learn English with Rebecca).

*Before listening:* list three topics you think the video will cover.
*While listening:* note at least five new vocabulary terms.
*After listening:*

- What is the main idea of the video?
- What surprised you most, and why?
- If you could ask the speaker one question, what would it be?

## Reading
> **Finding your way through digital systems**
>
> Millions of people use operating systems, apps and websites every day without considering how they work. To find information quickly, they use search bars, swipe across screens and click links. But engineers have made crucial choices about the tools and technologies behind each smooth navigation experience.
>
> A sequence of events takes place in milliseconds when you type a web URL into your browser. First, your device sends a request over the internet using a protocol called HTTP or HTTPS. After receiving the request, a server locates the right data and replies. Your browser then reads the code — usually HTML, CSS and JavaScript — and displays the page.
>
> This sounds simple, but engineers spend years optimising it. A slow page load loses users quickly: research shows that if a website takes more than three seconds to load, over half of visitors will leave. That is why latency and bandwidth are critical metrics that engineers monitor constantly.

**Comprehension:** Summarise the main topic in one sentence. Find three technical terms and explain them. What is the most important idea in the final paragraph?

## Vocabulary
- **navigation** — moving between pages or sections in a digital system
- **interface** — the part of a program users interact with
- **algorithm** — a step-by-step set of instructions a computer follows
- **bandwidth** — the amount of data a connection can send per second
- **latency** — the delay between a request and the system's response
- **protocol** — a set of rules governing how data is transmitted
- **trade-off** — accepting one disadvantage to gain an advantage
- **benchmark** — a standard used to measure and compare performance

## Grammar focus — Prepositions of place & comparison
**Prepositions of place:** *in* (inside a space), *on* (a surface), *at* (a specific point), *between* (in the middle of two things), *next to* (beside). *The server is in the data centre. The button is at the top.*

**Degrees of comparison:** comparative (*faster, safer, more efficient*) and superlative (*the fastest, the safest, the most efficient*). *HTTPS is safer than HTTP. Of all the systems, this one has the highest bandwidth.*

## Speaking
Pair talk, then a 3-minute mini-presentation: how will digital navigation and tech comparisons affect your future work? Use: *From my perspective… / I think that… / One instance of this is… / Consequently…* Finish with a class debate using formal language.

## Writing
Write a paragraph comparing two operating systems (Windows, Linux, macOS), 100–120 words. Use prepositions of place and comparative degrees. Include where important settings are located, which is faster/safer/easier, and your recommendation. Use at least five terms from this unit.

## Critical thinking
- Make a T-chart of the advantages and disadvantages of the technologies in this unit.
- Which concept from this unit is most essential to society? Rank ideas and justify it.

## Digital tasks
- Run an online speed/benchmark test on two browsers and compare the results.
- Create a Quizlet set with the 8 navigation/comparison terms.
- Ask ChatGPT to compare two operating systems and evaluate its reasoning.`,

  6: `# Unit 6: IT milestones and computing history

**Grammar focus:** Past participle (Present Perfect) + past forms of modals

## Warm-up
What do you already know about the history of computing and IT milestones? What questions do you have? Discuss with a partner before you begin.

## Listening
Watch *"History of Computers Documentary"* (BBC).

*Before listening:* write down three topics you think the video will cover.
*While listening:* note at least five new vocabulary terms.
*After listening:*

- What is the main idea of the video?
- What surprised you most, and why?
- If you could ask the speaker one question, what would it be?

## Reading
> **From abacus to AI**
>
> The computer you use today is the product of thousands of years of human problem-solving. The history of computing is one of the most amazing stories in engineering — from simple counting tools made of bone to devices that handle billions of instructions every second. By knowing this history, engineers better understand the advances in technology and the reasons behind modern designs.
>
> European mathematicians began building mechanical calculators in the 17th century. These devices had real wheels and gears that could automatically add and subtract. Blaise Pascal, a French mathematician, created the Pascaline in 1642; it used interlocking gears to perform addition.
>
> Today, technologists are creating tools that could define the next computing era. Quantum computers may solve problems that are impossible for classical computers, and artificial intelligence systems — trained on massive datasets — can now write code, recognise images, translate languages and assist with medical diagnosis with surprising precision.

**Comprehension:** Summarise the main subject in one sentence. Choose three technical terms and define them. What is the most significant idea in the last paragraph?

## Vocabulary
- **problem-solving** — finding solutions to difficult or complex issues
- **computing** — using computers to process data and perform calculations
- **engineering** — applying scientific and mathematical knowledge to design and build systems
- **counting tools** — simple past devices used to help people count (bones, stones)
- **devices** — machines or tools made for a specific purpose
- **instructions** — commands given to a computer to perform tasks
- **gears** — toothed wheels that work together to transmit motion
- **Pascaline** — an early calculator (1642) that performed addition using gears

## Grammar focus — Present Perfect & past modals
**Present Perfect:** subject + have/has + past participle (V3). *I have already finished my homework. She has not finished yet. Have you ever visited London?*

**Past modals:** subject + could/should/must/might + have + past participle — for past possibility, regret or criticism. *You should have studied harder. He could not have done this alone. Could they have missed it?*

Signal words: *already, yet, just, ever, never, recently, since, for, so far.*

## Speaking
Pair talk, then a 3-minute mini-presentation: how does the history of computing influence your future as an engineer? Use: *From my perspective… / I think that… / One instance of this is… / Consequently…* Finish with a class debate.

## Writing
Write a 100–120 word historical paragraph about a significant computer milestone (Linux, the internet, the first smartphone, etc.). Use past-modal and past-participle forms, and at least five terms from this unit.

## Critical thinking
- Which milestone in computing history changed the world the most? Justify your choice.
- "Quantum computing will make today's computers obsolete." Do you agree? Why?

## Digital tasks
- Build an interactive timeline of computing history (e.g. with Sutori or Padlet).
- Create a Quizlet set with the 8 history terms.
- Ask ChatGPT for the five most important milestones in computing and verify the dates.`,

  7: `# Unit 7: Software development

**Grammar focus:** Irregular verbs + sequencing words

## Warm-up
What is software? What kinds of software do you know and use? What kinds of software might be invented in the future?

## Listening
Watch *"What is Agile?"* (Atlassian).

*Before listening:* list three topics you think the video will cover.
*While listening:* note at least five new vocabulary terms.
*After listening:*

- What is the main idea of the Software Development Life Cycle?
- What surprised you most, and why?
- If you could ask the speaker one question, what would it be?

## Reading
> Software development is the process of creating, designing, testing and maintaining computer programs and applications. It plays a crucial role in modern society, as software is used in almost every industry — education, healthcare, business and entertainment. From mobile apps to complex operating systems, software helps people work more efficiently and solve everyday problems.
>
> The process usually follows several stages. First, developers analyse user needs and plan the structure of the program. Next, they write code using languages such as Python, Java or C++. After coding, the software is carefully tested to find and fix errors, also known as bugs. Once the program works correctly, it is deployed and made available to users.
>
> Software development also involves teamwork: developers collaborate with designers, project managers and testers to create high-quality products. Tools like version control systems help teams manage changes and work together. Modern approaches such as Agile and DevOps let teams develop and improve software continuously.

**Comprehension:** Summarise the central theme in one sentence. Explain three technical terms in your own words. Which idea in the last paragraph is most crucial?

## Vocabulary
- **development** — the process of creating or improving something
- **programming language** — a formal language used to write instructions for a computer
- **application (app)** — a software program designed to perform a specific task
- **testing** — checking software for errors or bugs
- **deployment** — making software available for use
- **bug** — an error or flaw in a computer program
- **version control** — a system that tracks changes to code over time
- **collaboration** — working together with others to achieve a goal

## Grammar focus — Irregular verbs & sequencing
**Irregular verbs** don't follow the regular *-ed* pattern: go → went, make → made, see → saw, write → wrote, build → built. *First I went to the office, then I met my team, and finally we made a plan.*

**Sequencing words** show the order of actions: *first, then, next, after that, finally.*

## Speaking
**Sequence game** (pairs): take turns describing the SDLC — *"First, the team…" / "Then, the architects…"*. **Role-play:** a junior developer asks about your last project; describe it with irregular past verbs. **Debate:** Is Agile better than Waterfall? Use sequencing words to structure your argument.

## Writing
Write an informal report to your professor about a coding project (130–150 words). Describe what your team did using irregular past verbs and sequencing words: *First we met… Then we chose… After that we built… Finally we tested…* Include at least five vocabulary words.

## Critical thinking
- Is Agile always better than Waterfall, or does it depend on the project? Explain.
- Why is version control essential even for a solo developer?

## Digital tasks
- Create a GitHub repository and make three commits to practise version control.
- Build a Quizlet set with the 8 software-development terms.
- Ask ChatGPT to outline the SDLC stages and compare them with the unit text.`,

  8: `# Unit 8: The future of technology

**Grammar focus:** Future Simple (will) + suggestions and advice

## Warm-up
The future of technology — what do you already know? What links can you draw between your studies and your everyday life? Discuss with a partner.

## Listening
Watch *"The Future of AI"* (TED Talk).

*Before listening:* list three things you think the video will cover.
*While listening:* note at least five new vocabulary terms.
*After listening:*

- What is the video's central thesis about the future of technology?
- What surprised you most, and why?
- If you could ask the speaker one question, what would it be?

## Reading
> **Technology in 2040: predictions**
>
> Artificial intelligence will be integrated into nearly all digital systems worldwide by 2040. AI assistants will make financial decisions, write code, diagnose illnesses and manage calendars. The job of programmers will shift, but it won't disappear — instead of writing simple code, they will focus on design, ethics and high-level problem-solving.
>
> Cybersecurity will change because of quantum computing: today's encryption won't withstand quantum attacks, so governments and businesses will need entirely new standards. Engineers and cryptographers with quantum training will be in high demand.
>
> The Internet of Things will connect billions more devices, and cities will become "smart" — traffic managed by AI, energy optimised automatically, safety systems responding in real time. For students today, the direction is clear: focus on AI, machine learning and data science, consider quantum fundamentals, and above all keep learning, because the landscape will change faster than any career plan.

**Comprehension:** What will programmers focus on in 2040? Why will quantum computing threaten current encryption? What will smart cities be able to do?

## Vocabulary
- **quantum computing** — computing using quantum mechanical phenomena
- **IoT (Internet of Things)** — a network of physical devices with internet connectivity
- **cryptography** — the science of secure communication through encoding
- **embedded** — built permanently into a system or device
- **autonomous** — self-governing; operating without human control
- **augmented reality** — technology overlaying digital info on the real world
- **neural interface** — technology connecting computers directly to the brain
- **edge computing** — processing data near the source rather than in a cloud

## Grammar focus — Future Simple & suggestions
**Future Simple with will:** *(+) AI will transform every industry. (–) Some jobs will not exist in 2040. (?) Will quantum computers break encryption?* Contraction: will not → won't. Use *will* for predictions, promises, spontaneous decisions and offers; use *going to* for decided plans and evidence-based predictions.

**Making suggestions:** *You should learn Python. You ought to practise every day. Why don't you join a hackathon? How about taking an online AI course? I suggest focusing on cybersecurity.*

## Speaking
Pair talk, then a 3-minute mini-presentation on the future of technology. Use: *From my perspective… / I think that… / One instance of this is… / Consequently…* Finish with a class debate: *"Robots will take 50% of jobs by 2040."*

## Writing
Write a 100–120 word blog post titled *"Technology in 2035: My Predictions."* Use will + base verb for certainty or potential, and give three forecasts with explanations.

## Critical thinking
- "Robots will take 50% of jobs by 2040." Write three *will* sentences for each side.
- Which future technology should your country invest in first, and why?

## Digital tasks
- Use an AI image generator to picture a "smart city" in 2040 and describe it.
- Create a Quizlet set with the 8 future-tech terms.
- Ask ChatGPT for its top predictions for technology in 2035 and compare them with yours.`,

  9: `# Unit 9: Professional communication in IT

**Grammar focus:** Collocations with do / make / have / take / bring

## Warm-up
Professional communication in IT — what do you already know? What connections can you make to your studies or daily life? Discuss with a partner.

## Listening
Watch *"Professional Communication Skills for Engineers."*

*Before listening:* which communication skills are most important for a software engineer?
*While listening:* list every professional phrase the speaker uses.
*After listening:*

- What is the speaker's number-one tip for professional communication?
- What common mistake does the speaker warn against?
- Which tip is most relevant for your future career?

## Reading
> **Soft skills are hard: communication in tech**
>
> "Technical skills get you hired. Communication skills get you promoted." This is a common saying in the IT industry, and research supports it. Engineers who can clearly explain their ideas, make decisions confidently and give effective feedback are far more valuable than those who can only code.
>
> In a typical Agile team, communication takes many forms. Every morning the team has a standup meeting where engineers take turns explaining what they did yesterday, what they will do today and whether they have any blockers. The goal is to make progress visible and take action on problems quickly.
>
> Written communication matters just as much: engineers write technical documentation, make proposals for new features and give feedback during pull-request reviews. The best IT communicators do not just bring problems — they bring solutions. They do not make excuses when things go wrong; they take responsibility, make a plan and keep the team informed.

**Comprehension:** Why is communication important beyond coding? What happens during a standup meeting? Find all collocations with make/do/have/take/bring in the text.

## Vocabulary
- **standup** — a short daily team meeting (usually 15 min)
- **blocker** — a problem that stops progress on a task
- **pull request** — a request to merge code changes into the main branch
- **stakeholder** — a person with an interest in the project outcome
- **feedback** — information about reactions to a product or performance
- **escalate** — to raise an issue to a higher level of management
- **delegate** — to assign a task to another person
- **bandwidth** *(informal)* — mental capacity or availability to take on tasks

## Grammar focus — Collocations
Word combinations that naturally go together:

- **do:** do research, do homework, do a test, do your best, do work
- **make:** make a decision, make progress, make a mistake, make a plan, make a presentation
- **have:** have a meeting, have access, have a problem, have experience, have a look
- **take:** take notes, take a break, take responsibility, take action, take a risk
- **bring:** bring solutions, bring value, bring results, bring ideas, bring change

**Common mistakes:** *do a decision* → make a decision; *make a research* → do research; *take a meeting* → have a meeting. Learn these as fixed phrases — don't translate word by word!

## Speaking
**Standup simulation:** each student gives a 60-second standup — *"Yesterday I… Today I will… I have a blocker:…"* — using collocations naturally. **Collocation challenge:** in pairs, who can make the most correct sentences with do/make/have/take/bring in two minutes? **Role-play:** give feedback after a code review using *"I think we should make… / Have you considered… / I suggest taking…"*

## Writing
Write a short email to your manager (100–120 words) using collocations: *make progress, have a problem, take action, bring solutions.* Report your progress, any blocker and your plan.

## Critical thinking
- Why do communication skills "get you promoted" while technical skills "get you hired"?
- Is it better to bring a problem early or to solve it first and then report? Explain.

## Digital tasks
- Write a sample pull-request description and ask a partner for feedback.
- Create a Quizlet set with the 8 communication terms.
- Ask ChatGPT to rewrite a blunt message into polite, professional English and compare versions.`,

  10: `# Unit 10: Cybersecurity incidents

**Grammar focus:** Past Simple + Past Continuous

## Warm-up
Cybersecurity incidents — what do you already know? What connections can you make to your studies or daily life? Discuss with a partner.

## Listening
Watch *"Famous Cybersecurity Attacks Explained"* (~10 min).

*Before listening:* have you heard of any famous hacking incidents? Write what you know.
*While listening:* note every cyberattack the speaker describes and its impact.
*After listening:*

- Which attack does the speaker call most damaging?
- What could the victims have done to prevent it?
- What lesson does the speaker draw for IT professionals?

## Reading
> **The WannaCry attack: when the world stopped**
>
> On 12 May 2017, a cyberattack began spreading across the globe. While engineers were starting their workday in Europe, hospitals in the United Kingdom were already losing access to their systems. The attack was called WannaCry, and within 24 hours it had infected over 200,000 computers in 150 countries.
>
> WannaCry was a type of malware called ransomware. While it was spreading through networks, it was encrypting files and demanding payment in Bitcoin. Organisations were paying ransoms because they had not made proper backups. Meanwhile, IT teams were desperately trying to stop the spread.
>
> A 22-year-old British security researcher named Marcus Hutchins stopped the attack almost by accident. While he was analysing the malware, he found a hidden domain name in the code. He registered the domain for $10.69, which activated a "kill switch" that stopped WannaCry from spreading. The incident showed that even a single person could make a massive difference in cybersecurity.

**Comprehension:** When did the WannaCry attack begin? How did it spread and what did it do? Why were organisations vulnerable?

## Vocabulary
- **ransomware** — malware that encrypts files and demands payment to restore them
- **vulnerability** — a weakness in a system that can be exploited
- **patch** — a software update that fixes a security flaw
- **malware** — malicious software designed to harm computer systems
- **encrypt** — to convert data into a code to prevent unauthorised access
- **exploit** — to take advantage of a vulnerability in software
- **firewall** — security software that monitors and controls network traffic
- **phishing** — a fraudulent attempt to steal sensitive information via fake messages

## Grammar focus — Past Simple & Past Continuous
**Past Simple** = a completed action at a specific time: *The attack began at 9:00 am. They did not install the patch. When did the attack start?* Signal words: *yesterday, last week, in 2017, ago, when, then.*

**Past Continuous** = an action in progress at a past moment (was/were + verb-ing): *Engineers were analysing the code. The malware was spreading rapidly.*

**Key pattern:** *While (Past Continuous)… (Past Simple)* — interrupted action: *While engineers were sleeping, the malware was spreading across networks.*

## Speaking
**Timeline reconstruction** (pairs): rebuild the WannaCry timeline using Past Simple. **Crime investigation:** one is a detective, one a witness — *"What were you doing when the attack happened? When did you notice?"* **Debate:** "Companies should be legally required to install security patches within 30 days."

## Writing
Write a cybersecurity incident report (140–160 words). Scenario: your company's database was breached at 2 am last Tuesday. Use Past Simple (what happened) and Past Continuous (what was happening). Include when it happened, what was occurring, what the team did and what action was taken.

## Critical thinking
- Research the 2021 Colonial Pipeline or 2020 SolarWinds attack — what went wrong?
- Who is responsible when an unpatched system is breached: the vendor or the company? Why?

## Digital tasks
- Run a phishing-awareness quiz (e.g. Google's) and report your score.
- Create a Quizlet set with the 8 cybersecurity terms.
- Ask ChatGPT to explain how ransomware spreads and check it against the unit text.`,

  11: `# Unit 11: Evolution of computing devices

**Grammar focus:** Descriptive adjectives + past tenses review

## Warm-up
The evolution of computing devices — what do you already know? What connections can you make to your studies or daily life? Discuss with a partner.

## Listening
Watch *"Evolution of Computers: From Room-Sized to Pocket-Sized"* (~7 min).

*Before listening:* what was the biggest/smallest/slowest/fastest computer you have ever used?
*While listening:* note every descriptive adjective the speaker uses.
*After listening:*

- What is the most dramatic change in computing the speaker describes?
- Which descriptive adjectives did the speaker use most?
- How has the size-to-power ratio changed?

## Reading
> **From ENIAC to Apple Watch: 80 years of computing**
>
> The first electronic computers were enormous, unreliable and incredibly expensive. The ENIAC weighed 27 tons and occupied an entire building. It was powerful enough to perform complex calculations, but it was also fragile, overheating frequently and breaking down often. Despite these limitations, it was a revolutionary machine.
>
> By the 1970s, computers became smaller, cheaper and more reliable. The first personal computers were boxy and slow by modern standards, with tiny memories — typically 4 KB of RAM — yet affordable enough for individuals to own. The Altair 8800 (1975) and Apple II (1977) turned computing from a professional tool into a consumer product.
>
> The 1990s brought even more dramatic changes: laptops became lightweight and portable, and by 2007 the iPhone had packed a powerful, touch-sensitive computer into a sleek, pocket-sized device. Today, wearable computers are thin, flexible and energy-efficient. The trajectory is clear: computers are becoming smaller, lighter, smarter and more powerful at the same time.

**Comprehension:** What were early computers like? Why were the first PCs significant despite their limits? How did the iPhone change computing?

## Vocabulary
- **wearable** — a computing device designed to be worn on the body
- **portable** — easy to carry or move around
- **lightweight** — low in weight, especially for its size
- **processing power** — the speed and capacity of a CPU to perform calculations
- **transistor density** — the number of transistors per unit area on a chip
- **obsolete** — no longer in use or useful
- **cutting-edge** — at the most advanced stage of development
- **miniaturization** — the process of making devices smaller

## Grammar focus — Adjectives & past tenses
**Descriptive adjectives:** size (enormous, tiny, compact), speed (rapid, sluggish), quality (reliable, fragile, robust), appearance (sleek, boxy, flexible), price (affordable, expensive). **Adjective order:** Opinion → Size → Age → Shape → Colour → Origin → Material → Purpose + noun.

**Past tenses review:** Past Simple (*The ENIAC occupied a building.*), Past Continuous (*Engineers were improving hardware while costs were falling.*), Past Perfect (*By 1977, Apple had already created its first computer.*), Past Perfect Continuous (*Scientists had been working on transistors for decades.*).

## Speaking
**Describe and guess** (pairs): describe a device using only adjectives; the partner guesses. **History timeline:** each student picks a year and describes its technology with descriptive adjectives. **Debate:** "Smartphones have made people less focused."

## Writing
Write a comparative history paragraph titled *"How Computers Have Changed in 50 Years"* (140–160 words). Use Past Simple, Past Perfect and descriptive adjectives, comparing 1975 computers with 2025 smartphones across size, speed and price.

## Critical thinking
- Research Moore's Law. What does it predict, and has it stayed accurate?
- Will wearables replace smartphones the way smartphones replaced PCs? Why or why not?

## Digital tasks
- Build a visual timeline of computing devices with images and adjectives.
- Create a Quizlet set with the 8 evolution terms.
- Ask ChatGPT to describe a 1975 computer and a 2025 smartphone and compare the adjectives.`,

  12: `# Unit 12: Big data management

**Grammar focus:** Quantity words + modal verbs

## Warm-up
Big data management — what do you already know? What connections can you make to your studies or daily life? Discuss with a partner.

## Listening
Watch *"What is Big Data?"* (TED-Ed).

*Before listening:* write three things you predict the video will cover.
*While listening:* note at least five new vocabulary terms.
*After listening:*

- What is the main idea about big data and network management?
- What surprised you most, and why?
- What question would you ask the speaker?

## Reading
> **Big data: managing the information tsunami**
>
> Every minute, humans generate enormous quantities of data. More than 500 hours of video are uploaded to YouTube every minute, and over 300 billion emails are sent each day. Every search, click, purchase and heartbeat monitored by a smartwatch becomes a data point. The total volume of data is measured in zettabytes — 10 to the power of 21 bytes.
>
> Engineers who work with big data must master specialised tools. Apache Hadoop and Apache Spark process vast amounts of distributed data; they should also know SQL for structured data and NoSQL databases like MongoDB for unstructured data. The challenges can be summarised with the "3 Vs": Volume (how much data), Velocity (how fast it arrives) and Variety (how many types). A good data engineer must handle all three at once and build pipelines that process millions of records per second.
>
> Privacy is a critical concern. Organisations collect a lot of personal data, but they cannot always use it without permission. There are many laws governing data use, including Europe's GDPR. Engineers must understand these regulations — too much data without proper management may become a liability rather than an asset.

**Comprehension:** How much video is uploaded to YouTube per minute? What are the 3 Vs? Name two big-data processing tools.

## Vocabulary
- **zettabyte** — 10^21 bytes; a unit for measuring enormous data volumes
- **distributed** — spread across multiple servers or locations
- **pipeline** — a set of automated processes for data flow
- **throughput** — the amount of data processed in a given time
- **latency** — the delay between input and response in a system
- **structured data** — data organised in a predefined format like a table
- **unstructured data** — data with no fixed format (text, images, video)
- **analytics** — the discovery of patterns and insights in data

## Grammar focus — Quantity words & modals
**Quantity words:** countable → many / a few / several; uncountable → much / little / a great deal of; both → a lot of / some / any / no / most / all. With numbers: *billions of records, millions of users.*

**Modal verbs:** *must* (strong obligation), *should* (advice), *can/cannot* (ability/impossibility), *may/might* (possibility), *could* (possibility or polite suggestion), *need to* (necessity). *You must encrypt all personal data. Engineers should update patches. This database might be too slow.*

## Speaking
Pair discussion, then a 3-minute mini-presentation on big data and network management. Use: *In my view… / I believe that… / One example of this is… / As a result…* Finish with a class debate using formal language.

## Writing
Write a formal recommendation letter (100–120 words) to an IT manager suggesting upgrades to the company's data infrastructure. Use modal verbs and quantity expressions.

## Critical thinking
- Should companies be allowed to collect personal data if they anonymise it? Why or why not?
- "More data always leads to better decisions." Do you agree? Give examples.

## Digital tasks
- Explore a public dataset (e.g. Kaggle) and describe its volume, velocity and variety.
- Create a Quizlet set with the 8 big-data terms.
- Ask ChatGPT to explain the 3 Vs with examples and compare them with the unit text.`,

  13: `# Unit 13: Performance optimization

**Grammar focus:** Degrees of comparison + idiomatic expressions

## Warm-up
Performance optimization — what do you already know? What connections can you make to your studies or daily life? Discuss with a partner.

## Listening
Watch *"Code Optimization Tips Every Developer Should Know"* (~8 min).

*Before listening:* what makes a program fast or slow? Write three ideas.
*While listening:* list every optimization tip the speaker mentions.
*After listening:*

- What is the speaker's most important tip?
- What idiomatic expression does the speaker use?
- Which technique is most relevant to your studies?

## Reading
> **The art of performance optimization**
>
> Every programmer wants to write the fastest, most efficient code possible. But optimization is not just about raw speed — it is about the best balance between performance, readability and maintainability. The most elegant solution is rarely the fastest, and the fastest solution is often the hardest to read.
>
> Profiling is the most important first step: before optimising anything, measure what is actually slow. The worst approach is to optimise blindly. Database queries are often the biggest bottleneck in web applications — a poorly written query can be thousands of times slower than an optimised one, and adding an index to a frequently queried column is one of the simplest and most effective fixes. Sometimes you need to "think outside the box" and restructure the data instead.
>
> Memory management is equally critical. In languages like C and C++, the programmer has the greatest degree of control over memory. Leaking memory leads to the worst performance problems over time, so the most experienced engineers "keep their eye on the ball" and monitor memory usage continuously.

**Comprehension:** What is profiling and why does it matter? What is often the biggest bottleneck in web apps? What makes memory leaks so problematic?

## Vocabulary
- **optimization** — making something as effective as possible
- **bottleneck** — the slowest part of a system that limits performance
- **profiling** — measuring where a program spends its time and resources
- **benchmark** — a standard test used to measure system performance
- **cache hit** — successfully finding requested data in the cache
- **memory leak** — a program failing to release memory it no longer needs
- **index** — a data structure that speeds up database queries
- **concurrency** — running multiple tasks simultaneously

## Grammar focus — Comparison & idioms
**Degrees of comparison:** short (fast → faster → the fastest), long (efficient → more efficient → the most efficient), irregular (good → better → the best; bad → worse → the worst; little → less → the least). **As … as** (equality): *Python is not as fast as C++.* **Much + comparative** (intensifier): *An SSD is much faster than an HDD.*

**IT idioms:** *think outside the box* (find creative solutions), *keep your eye on the ball* (stay focused), *get the ball rolling* (start a process), *under the hood* (the internal workings), *cutting-edge* (most advanced), *hit the ground running* (start at full speed).

## Speaking
**Pitch game:** 60 seconds to persuade the class that your language is "the best, fastest, most powerful" — use superlatives. **Optimization role-play:** a senior engineer advises a junior on slow code using comparatives, superlatives and idioms.

## Writing
Write an opinion essay titled *"What is the Most Important Skill for a Computer Engineer?"* (140–160 words). Use at least six comparative/superlative adjectives and two idioms. Structure: intro → reason 1 → reason 2 → counter-argument → conclusion.

## Critical thinking
- Research Big-O notation: rank O(1), O(log n), O(n), O(n²) from fastest to slowest and explain with comparatives.
- Which gives the best performance per cost: indexing, caching, a hardware upgrade or a better algorithm? Justify it.

## Digital tasks
- Profile a small script (e.g. with Python's cProfile) and report the biggest bottleneck.
- Create a Quizlet set with the 8 optimization terms.
- Ask ChatGPT for five code-optimization tips and evaluate which apply to your projects.`,

  14: `# Unit 14: Project planning and risk management

**Grammar focus:** First conditional

## Warm-up
Project planning and risk management — what do you already know? What connections can you make to your studies or daily life? Discuss with a partner.

## Listening
Watch *"Software Project Management"* (Simplilearn).

*Before listening:* write three things you predict the video will cover.
*While listening:* note at least five new vocabulary terms.
*After listening:*

- What is the main idea about project planning and risk management?
- What surprised you most, and why?
- What question would you ask the speaker?

## Reading
> **Managing risk in software development**
>
> Every software project carries risks. If the team does not define requirements clearly, the client will reject the final product. If developers skip testing, critical bugs will reach end users. If the project runs over budget, the company will lose money. Planning for these risks is not pessimism — it is professional engineering.
>
> Risk management in Agile teams follows a simple process. First, the team identifies possible risks. If a risk is likely and high-impact, it will go to the top of the risk register; if it is unlikely, it will receive a lower priority. The team reviews the register at the start of every sprint.
>
> Communication risks are often underestimated. If requirements are not documented properly, developers will build the wrong features. If stakeholders do not approve the design on time, the schedule will slip. For junior engineers, the lesson is simple: if you find a problem, report it immediately. If you ignore a small issue, it will grow into a large one — but if you communicate openly, your team will trust you, and your career will grow faster than you expect.

**Comprehension:** What happens if a team skips testing? How do Agile teams prioritise risks? When is knowledge transfer critical?

## Vocabulary
- **risk register** — a document tracking all identified risks in a project
- **mitigation** — action taken to reduce the impact of a risk
- **contingency** — a plan for dealing with a possible future problem
- **scope creep** — the uncontrolled expansion of project requirements
- **critical path** — the sequence of tasks that determines the minimum project duration
- **dependency** — a task that cannot start until another is completed
- **stakeholder** — any person with an interest in the project
- **acceptance criteria** — the conditions under which a feature is considered complete

## Grammar focus — First conditional
**Real, possible situations with likely results:** IF + Present Simple, WILL + base verb. *(+) If the code compiles, the tests will run. (–) If you do not back up the data, you will lose it. (?) What will happen if the server crashes?*

**Important:** use Present Simple in the if-clause — never *will*. *If you test the code…* (not *If you will test…*). **Unless** = if … not: *Unless we fix the bug now, users will see the error.* **When vs if:** *when* = certain, *if* = possible.

## Speaking
**Risk brainstorm** (pairs): list five risks for an app project, each as a first conditional — *"If X happens, Y will occur."* **Role-play:** a project manager explains risks to a client — *"If we miss this milestone, the launch will be delayed. However, if we add one more developer…"*

## Writing
Write a formal letter (140–160 words) applying for an IT internship at IT Park, Tashkent. Use the first conditional at least five times — *"If I get this internship, I will…"* Include why you want it, what you offer and what you hope to achieve.

## Critical thinking
- Choose a famous software failure (Healthcare.gov, Therac-25). Write five *"If they had… they would have…"* sentences. What risks should have been managed?
- Which risk is most dangerous: technical, communication, financial or schedule? Justify it.

## Digital tasks
- Build a risk-register table in Google Sheets (Risk | Probability | Impact | Mitigation | First-conditional statement).
- Create a Quizlet set with the 8 risk-management terms.
- Search hh.uz for three IT internships and write five first-conditional sentences about qualifying for them.`,

  15: `# Unit 15: Achievements in computer science

**Grammar focus:** Present Perfect tense

## Warm-up
Achievements in computer science — what do you already know? What connections can you make to your studies or daily life? Discuss with a partner.

## Listening
Watch *"Greatest Achievements in Computer Science History"* (~7 min).

*Before listening:* what do you consider the greatest achievement in computer science?
*While listening:* note every achievement the speaker mentions.
*After listening:*

- Which achievement does the speaker rank most important?
- What Present Perfect sentences does the speaker use?
- Which achievement surprises you most?

## Reading
> **How far have we come? Milestones in computer science**
>
> Computer scientists have achieved remarkable things in the past 80 years. They have built machines that calculate faster than the human brain, created networks that connect billions of people, and developed artificial intelligence that can defeat world champions in chess, Go and even protein-structure prediction.
>
> Open-source software has transformed the industry. Millions of developers have contributed code to projects like Linux, Python and TensorFlow without being paid, building tools that power the world's infrastructure — all available for free. In Uzbekistan, the technology sector has grown significantly: the number of IT specialists has doubled in the last five years, IT Park has already attracted hundreds of companies, and young Uzbek developers have won international coding competitions.
>
> But there is still much to achieve. Researchers have not yet solved fully general artificial intelligence. Engineers have not made quantum computers reliable for everyday use. The digital divide has not disappeared. The journey has been extraordinary, but the greatest chapters have not yet been written.

**Comprehension:** Name three areas where AI has defeated human experts. What has open-source software contributed? How has the IT sector grown in Uzbekistan?

## Vocabulary
- **achievement** — something accomplished, especially through effort
- **breakthrough** — an important discovery solving a long-standing problem
- **contribute** — to give time, code or money to a shared goal
- **deploy** — to make software available in a live environment
- **pioneer** — to be among the first to develop something new
- **surpass** — to exceed a previous limit or standard
- **milestone** — an important stage in progress
- **iterate** — to repeat a process, making improvements each time

## Grammar focus — Present Perfect
**Connection between a past action and present significance:** have/has + past participle. *(+) I have fixed the bug. We have launched three apps. (–) I have not tested this yet. (?) Have you ever used GitHub?*

**Signal words:** *ever/never, already, yet, just, since/for, recently/so far.* *I have already finished the module. The team has just released v2.0. She has worked here since 2021.*

## Speaking
**Achievement share:** each student shares three things they have achieved this semester in the Present Perfect. **Interview simulation:** recruiter and candidate — *"Have you ever used Python? Yes, I have. I have built three projects…"* **Debate:** "Open-source software has done more good than commercial software."

## Writing
Write a blog post titled *"My First Steps on GitHub — What I Have Learned"* (140–160 words). Use the Present Perfect at least eight times. Include what you have done, what has been challenging, what you have not done yet and your next plans.

## Critical thinking
- Research 10 major achievements in computer science since 2000 and rank them, writing each as a Present Perfect sentence.
- Has open-source helped or harmed commercial software companies? Argue both sides.

## Digital tasks
- Make your first GitHub commit and describe what you have done in the Present Perfect.
- Create a Quizlet set with the 8 achievement terms.
- Ask ChatGPT for the biggest CS breakthroughs since 2000 and turn them into Present Perfect sentences.`,

  16: `# Unit 16: Innovation and hypothetical thinking

**Grammar focus:** Second conditional

## Warm-up
Innovation and hypothetical thinking — what do you already know? What connections can you make to your studies or daily life? Discuss with a partner.

## Listening
Watch *"The Art of Creative Thinking in Engineering"* (TED, ~8 min).

*Before listening:* what would you create if you had unlimited resources and time?
*While listening:* note every hypothetical scenario the speaker imagines.
*After listening:*

- What imaginary scenario does the speaker use to make a point?
- How does hypothetical thinking help real engineering?
- What would you create if you were the speaker?

## Reading
> **If I could redesign the internet…**
>
> If computer scientists could start again from scratch, what would they change about the internet? Many researchers believe the web's original architecture has critical flaws. If Tim Berners-Lee were designing the web today, he would probably build in privacy, decentralization and semantic data from the beginning.
>
> If we could eliminate spam, phishing and malware with a single design decision, what would it be? Some argue that if every user had a cryptographic identity, most cybercrime would become impossible. If email had been designed with authentication built in, spam would never have become such a massive problem.
>
> Imagining alternatives is not just academic — it drives real innovation. If engineers did not ask "what if?", progress would stall. The greatest inventions began as hypothetical questions: "What if we could carry a computer in our pocket? What if machines could learn from data?" For you as a student: if you could solve one problem in technology, what would it be? The best engineers imagine better worlds and then work to build them.

**Comprehension:** What would Tim Berners-Lee change about the web today? How would cryptographic identity reduce cybercrime? Why does imagining alternatives "drive real innovation"?

## Vocabulary
- **hypothetical** — based on a possible situation that has not happened
- **decentralized** — distributed without a single controlling authority
- **cryptographic identity** — a unique, unforgeable digital identity based on encryption
- **semantic web** — a web where data has meaning computers can interpret
- **innovation** — the introduction of new ideas, methods or products
- **disruptive** — radically changing an existing industry or market
- **prototype** — a first version of a product used to test a concept
- **iterate** — to repeat a process with improvements each time

## Grammar focus — Second conditional
**Imaginary, unreal or unlikely situations:** IF + Past Simple, WOULD + base verb. *(+) If I had unlimited resources, I would redesign the internet. (–) If she were the CTO, she would not use this database. (?) What would you do if you had to start from scratch?*

Use **were** (not *was*) with I/he/she/it in formal writing. Compare: *If it rains, I will stay home* (possible — first conditional) vs *If I were a bird, I would fly* (impossible — second). **Common error:** never use *would* in the if-clause — *If I had more time…* (not *If I would have…*).

## Speaking
**Shark Tank:** 90 seconds to pitch a hypothetical product — *"If I had $1 million, I would build…"* **If I were…:** *"If I were the Minister of Digital Technology, what would I change?"* — share three ideas. **Innovation brainstorm:** what would you change about university education with unlimited resources?

## Writing
Write an opinion essay titled *"If I Could Solve One Technology Problem in Uzbekistan, What Would It Be?"* (150–180 words). Use the second conditional at least six times. Structure: intro → why it matters → your solution → impact → conclusion.

## Critical thinking
- If you could redesign one everyday technology from scratch, what would you change and why?
- Would the internet be safer if every user had a verified cryptographic identity? What would be the trade-offs?

## Digital tasks
- Sketch a prototype of your hypothetical product (Figma or paper) and describe it.
- Create a Quizlet set with the 8 innovation terms.
- Ask ChatGPT "What if…?" questions about future tech and respond with second-conditional answers.`,

  17: `# Unit 17: Technical writing

**Grammar focus:** Compound nouns + adjective suffixes

## Warm-up
Technical writing — what do you already know? What connections can you make to your studies or daily life? Discuss with a partner.

## Listening
Watch *"How to Write Technical Documentation"* (~8 min).

*Before listening:* have you ever read technical documentation in English? Was it easy or hard? Why?
*While listening:* list every compound noun the speaker uses (e.g. "user interface", "source code").
*After listening:*

- What is the speaker's most important advice for technical writers?
- Which compound nouns did the speaker use most?
- What makes technical writing different from academic writing?

## Reading
> **The art of technical writing for computer engineers**
>
> Technical writing is one of the most underrated skills in computer engineering. Every day, engineers write user manuals, API documentation, error messages, release notes and troubleshooting guides. Poor technical writing leads to user confusion and wasted developer time — clear, precise writing is just as important as clean, readable code.
>
> Good documentation has key characteristics: it must be user-friendly (readable by its audience without unnecessary jargon), well-structured (using headings, numbered lists and code examples), and version-controlled (updated every time the software changes).
>
> Compound nouns are everywhere: "source code", "command-line interface", "error message", "pull request", "file system", "network bandwidth". Adjective suffixes describe properties precisely: a *scalable* system grows with demand, a *configurable* app is customised easily, a *portable* framework works across platforms, and a *modular* architecture is built from interchangeable components.

**Comprehension:** Why is technical writing important? What are three characteristics of good documentation? Find ten compound nouns in the text.

## Vocabulary
- **documentation** — written material explaining how software works
- **user manual** — a guide explaining how to use a product
- **release notes** — a document describing changes in a new version
- **troubleshooting** — the process of finding and solving problems
- **API documentation** — a technical description of how to use an API
- **README** — a file in a repository explaining the project
- **markup language** — code used to structure and display content (HTML, Markdown)
- **changelog** — a record of all changes made to a project

## Grammar focus — Compound nouns & suffixes
**Compound nouns:** noun + noun (*source code, error message*), adj + noun (*open-source, real-time*), verb + noun (*debugging tool, login page*). Written as one word (*keyboard, database*), two words (*source code, data center*) or hyphenated (*full-stack, user-friendly*) — when in doubt, check a technical dictionary.

**Adjective suffixes:** *-able/-ible* (scalable, configurable, flexible), *-ful* (useful, powerful), *-less* (wireless, stateless), *-ive* (interactive, responsive), *-al* (logical, functional).

## Speaking
**Compound-noun chain:** round the class, each student adds a new compound noun; first to repeat or hesitate is out. **Technical description:** describe a tool using only compound nouns and suffixed adjectives; a partner guesses it. **Documentation role-play:** a technical writer explains an API to a junior developer.

## Writing
Write a professional email to a colleague explaining how to use a software feature or API (100–120 words). Use compound nouns and adjective suffixes throughout.

## Critical thinking
- Why is unclear documentation as costly as buggy code? Give an example.
- Should writing skills be a required part of every computer-science degree? Argue your view.

## Digital tasks
- Write a clear README for one of your projects using Markdown.
- Create a Quizlet set with the 8 technical-writing terms.
- Ask ChatGPT to review one of your error messages and suggest clearer wording.`,

  18: `# Unit 18: Technology standards and research

**Grammar focus:** Passive voice (all tenses)

## Warm-up
Technology standards and research — what do you already know? What connections can you make to your studies or daily life? Discuss with a partner.

## Listening
Watch *"How Internet Standards are Created"* (IEEE/W3C).

*Before listening:* write three things you predict the video will cover.
*While listening:* note at least five new vocabulary terms.
*After listening:*

- What is the main idea about technology standards and research?
- What surprised you most, and why?
- What question would you ask the speaker?

## Reading
> **Technology standards: the invisible rules that shape our world**
>
> Technology standards are established by international organisations such as IEEE, ISO and W3C, and are followed by engineers worldwide. The HTTP protocol was defined by the W3C; the TCP/IP suite was developed by ARPA in the 1960s; USB standards are set by the USB Implementers Forum. Without these standards, devices made by different companies could not communicate.
>
> The process of creating a standard is long and careful. First a problem is identified by a technical committee. Then a proposal is drafted by working-group members. The draft is reviewed by experts from multiple countries, feedback is collected and incorporated, and finally the standard is approved by a vote and published.
>
> Research papers are the foundation of innovation. Every year, thousands of papers are published in journals like IEEE Transactions and the ACM Digital Library; ideas are shared, reviewed by peers and cited by other researchers. For students, understanding standards and research is increasingly important: you are expected to read technical standards, cite academic sources and contribute to research projects.

**Comprehension:** What does IEEE do? Describe the process of creating a technology standard. How are research papers shared and evaluated?

## Vocabulary
- **standard** — an established technical specification for systems to follow
- **protocol** — a set of rules for data communication between systems
- **peer review** — evaluation of work by others in the same field
- **citation** — a reference to a source in academic or technical writing
- **specification** — a precise technical description of a system or interface
- **ratify** — to formally approve a standard or agreement
- **interoperability** — the ability of systems to work together
- **compliance** — conforming to required rules or standards

## Grammar focus — Passive voice
**Focus on the action or result, not who does it:** object + *to be* (correct tense) + past participle. *Active:* Engineers developed TCP/IP. *Passive:* TCP/IP was developed by engineers.

**Tense forms:** Present Simple (*Standards are reviewed*), Past Simple (*The bug was fixed*), Present Perfect (*The update has been deployed*), Future (*The next version will be released*), Modal (*All data must be encrypted*), Present Continuous (*The system is being tested*).

**By + agent:** include only when who did it is important — *TCP/IP was developed by ARPA* vs *The code was written.* In technical writing, the passive is preferred for objectivity and formality.

## Speaking
**Passive transformation race:** the teacher reads active sentences; students race to give the passive. **Research presentation:** a 2-minute talk about a standard (USB, HTTP, Bluetooth, Wi-Fi) using the passive to describe how it was created. **Debate:** "All software should follow international standards, even if it slows development."

## Writing
Write a technical abstract for a research paper on any CS topic you studied this semester (150–180 words). Use the passive voice at least eight times. Structure: background → problem → method → results → conclusion.

## Critical thinking
- Do international standards speed up innovation or slow it down? Argue both sides.
- Why is peer review essential before research is trusted? What are its weaknesses?

## Digital tasks
- Find a real research paper on Google Scholar and write its citation correctly.
- Create a Quizlet set with the 8 standards-and-research terms.
- Ask ChatGPT to convert five active sentences into the passive and check its answers.`,
};
