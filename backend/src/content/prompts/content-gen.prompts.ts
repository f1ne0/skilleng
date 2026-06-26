// Промпты генерации дидактического контента.
// Ключевая идея: JSON-контракт в промпте 1:1 совпадает с payload-классами
// (questions/dto/payloads.ts), а выход ОБЯЗАТЕЛЬНО прогоняется через
// validatePayloadByType — AI не может "продавить" невалидную структуру.

export const CONTENT_GEN_SYSTEM_PROMPT = `You are an expert ESL/EFL content designer creating exercises for a language-learning platform.

You always respond with STRICT, valid JSON — no markdown, no comments, no trailing commas.

CEFR level guidelines you must respect:
- A1: basic phrases, present simple, ~500 word vocabulary
- A2: routine topics, past/future simple, ~1000 words
- B1: familiar matters, most tenses, opinions, ~2000 words
- B2: complex texts, abstract topics, idioms, ~4000 words
- C1: fluent, nuanced, low-frequency vocabulary
- C2: near-native precision and subtlety

Question payload formats (follow EXACTLY):
- MULTIPLE_CHOICE: {"options": ["...", "..."], "correctIndex": 0}
  (2-8 options, each <= 200 chars, exactly one correct, correctIndex < options.length)
- FILL_BLANK: {"text": "I ___ to school.", "correctAnswers": ["go", "walk"], "caseSensitive": false}
  (text 5-500 chars, MUST contain ___ exactly once, 1-10 accepted answers)
- DRAG_DROP: {"words": ["I'm", "going", "to", "school"]}
  (2-20 words in the CORRECT order, all words must be UNIQUE — never repeat a word)
- MATCH_PAIRS: {"pairs": [{"left": "cat", "right": "кот"}]}
  (2-10 pairs, each side <= 100 chars, all left values unique, all right values unique)
- SHORT_WRITING: {"minWords": 50, "maxWords": 150, "rubric": "What to assess"}
  (minWords < maxWords, rubric <= 2000 chars)
- SPEAKING_RESPONSE: {"expectedKeyPoints": ["greet the client", "state the problem"], "minSeconds": 20, "maxSeconds": 120}
  (1-10 key points the spoken answer should cover, each <= 200 chars; 5 <= minSeconds < maxSeconds <= 600)

Each generated question object must be:
{"type": "<QuestionType>", "prompt": "<task text shown to the student>", "explanation": "<short explanation of the correct answer>", "payload": {<format above>}}`;

export function questionsGenPrompt(params: {
  topic: string;
  level: string;
  skill?: string;
  types: string[];
  count: number;
}): string {
  return `Generate exactly ${params.count} exercise questions.

Topic: ${params.topic}
CEFR level: ${params.level}${params.skill ? `\nTarget skill: ${params.skill}` : ""}
Allowed question types: ${params.types.join(", ")} (use only these, vary them across questions)

Return a JSON object: {"questions": [<question objects>]}`;
}

export function courseOutlinePrompt(params: {
  topic: string;
  level: string;
  lessonCount: number;
}): string {
  return `Design the outline of a short language course.

Topic: ${params.topic}
CEFR level: ${params.level}
Number of lessons: ${params.lessonCount}

Give the course a clear title and a 1-2 sentence description.
Then plan exactly ${params.lessonCount} lessons that build on each other in a logical teaching order.
Each lesson needs a short title and a one-sentence summary of what it teaches.

Return a JSON object:
{"title": "<course title>", "description": "<course description>", "lessons": [{"title": "<lesson title>", "summary": "<one sentence>"}]}`;
}

export function lessonTextPrompt(params: {
  topic: string;
  level: string;
}): string {
  return `Write the full text of one self-study lesson.

Lesson topic: ${params.topic}
CEFR level: ${params.level} (vocabulary and grammar must match this level)

Write a clear, friendly explanation a student can read on their own (180-320 words).
Format with markdown, strictly:
- Begin every section with a "## " heading on its own line (e.g. "## What is it?", "## How to use it", "## Key tips", "## Summary").
- Plain paragraphs for explanations.
- Use "- " bullet lists for steps or tips.
- Use **bold** for key terms (double asterisks, never single).
- Put each example on its own line starting with "> " (a quote), e.g. "> Example: ...".
Do NOT include exercises or questions.

Return a JSON object:
{"content": "<the lesson text in markdown>"}`;
}

export function lessonGenPrompt(params: {
  courseTopic: string;
  level: string;
  lessonTitle: string;
  lessonSummary: string;
  questionCount: number;
}): string {
  return `Write the full content of one lesson for a "${params.courseTopic}" course.

Lesson title: ${params.lessonTitle}
What it teaches: ${params.lessonSummary}
CEFR level: ${params.level} (vocabulary and grammar must match this level)

Write a clear, friendly explanation a student can read on their own (180-320 words).
Format with markdown, strictly:
- Begin every section with a "## " heading on its own line.
- Plain paragraphs, "- " bullet lists for steps/tips.
- Use **bold** for key terms (double asterisks, never single).
- Put each example on its own line starting with "> " (a quote).
Do NOT include exercises inside the text.

Then create ${params.questionCount} practice questions about this lesson.
Allowed question types: MULTIPLE_CHOICE, FILL_BLANK (use only these, vary them).

Return a JSON object:
{"content": "<the lesson text in markdown>", "questions": [<question objects>]}`;
}

export function readingGenPrompt(params: {
  topic: string;
  level: string;
  words: string;
  questionCount: number;
}): string {
  return `Write an original reading passage and comprehension questions.

Topic: ${params.topic}
CEFR level: ${params.level} (vocabulary and grammar must match this level)
Length: ${params.words} words

Then create ${params.questionCount} comprehension questions about the passage.
Allowed question types: MULTIPLE_CHOICE, FILL_BLANK, MATCH_PAIRS.

Return a JSON object:
{"title": "<short title>", "text": "<the passage, markdown allowed>", "questions": [<question objects>]}`;
}

export function listeningGenPrompt(params: {
  topic: string;
  level: string;
  format: "MONOLOGUE" | "DIALOGUE";
  questionCount: number;
  speakerA: string;
  speakerB: string;
}): string {
  const formatInstructions =
    params.format === "DIALOGUE"
      ? `Write a natural dialogue between two speakers named "${params.speakerA}" and "${params.speakerB}".
Each line MUST start with the speaker name and a colon, e.g. "${params.speakerA}: Hello!".
6-14 turns total.`
      : `Write a monologue (a single speaker talking) of 80-160 words. Plain text, no speaker labels.`;

  return `Create listening-comprehension material.

Topic: ${params.topic}
CEFR level: ${params.level} (spoken vocabulary must match this level)

${formatInstructions}

Then create ${params.questionCount} comprehension questions about what was said.
Allowed question types: MULTIPLE_CHOICE, FILL_BLANK.

Return a JSON object:
{"title": "<short title>", "transcript": "<the text to be voiced>", "questions": [<question objects>]}`;
}
