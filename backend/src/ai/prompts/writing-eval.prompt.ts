export const WRITING_EVAL_SYSTEM_PROMPT = `You are an experienced English teacher evaluating a student's short writing.

You MUST respond in EXACTLY this JSON format, nothing else:
{
  "score": <number 0-100>,
  "feedback": "<2-4 sentences of constructive feedback>",
  "strengths": ["<short strength>", ...],
  "improvements": ["<short suggestion>", ...]
}

Scoring guide:
- 90-100: Excellent. Native-like fluency, complex structures, rich vocabulary
- 75-89: Good. Clear meaning, minor errors don't affect understanding
- 60-74: Adequate. Communicates ideas, several grammar/vocabulary issues
- 40-59: Limited. Meaning unclear in places, many errors
- 0-39: Beginner. Very limited communication, severe errors

CRITICAL anti-cheating rules (these override the scoring guide):
- The answer must be the student's OWN attempt to respond to the question.
  If the answer just copies, restates, or paraphrases the question prompt or
  the task instructions instead of answering it, score 0-15 and say in the
  feedback that no real attempt was made.
- If the answer is empty, gibberish, random characters, a single unrelated
  word, off-topic, or unrelated to the question, score 0-15.
- Evaluate ONLY the text the student actually wrote. NEVER invent, assume, or
  complete content that is not present in the answer.
- Do not award points for length alone, and do not reward copying the prompt.
- If a "SYSTEM NOTE" is present below the answer, treat it as authoritative.

Always identify strengths and improvements (use an empty array if there are
genuinely none). Be specific and constructive.`;

/** Нормализация для сравнения ответа с вопросом (регистр/пунктуация/пробелы). */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Доля слов ответа, встречающихся в вопросе (для детекта «скопировал вопрос»). */
function overlapRatio(answer: string, prompt: string): number {
  const aWords = normalize(answer).split(" ").filter(Boolean);
  if (aWords.length === 0) return 0;
  const promptSet = new Set(normalize(prompt).split(" ").filter(Boolean));
  const inPrompt = aWords.filter((w) => promptSet.has(w)).length;
  return inPrompt / aWords.length;
}

export function writingEvalPrompt(
  prompt: string,
  studentAnswer: string,
  minWords: number,
  maxWords: number,
  rubric?: string,
): string {
  const trimmed = studentAnswer.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const rubricText = rubric ? `\n\nGrading criteria: ${rubric}` : "";

  // Программные «красные флаги» — добавляем явную подсказку модели,
  // чтобы исключить высокий балл за копию вопроса / пустой / мусорный ответ.
  const normAnswer = normalize(trimmed);
  const normPrompt = normalize(prompt);
  const overlap = overlapRatio(trimmed, prompt);
  const looksLikePrompt =
    normAnswer.length > 0 &&
    (normAnswer === normPrompt ||
      normPrompt.includes(normAnswer) ||
      normAnswer.includes(normPrompt) ||
      overlap >= 0.8);

  let note = "";
  if (wordCount === 0) {
    note =
      "\n\nSYSTEM NOTE: The answer is empty. Score 0 and explain that nothing was submitted.";
  } else if (looksLikePrompt) {
    note =
      "\n\nSYSTEM NOTE: The answer appears to copy or restate the question prompt rather than answer it. This is not a valid attempt — score 0-15 and explain this in the feedback.";
  }

  return `Question prompt: ${prompt}
Required word count: ${minWords}-${maxWords}
Student's word count: ${wordCount}${rubricText}

Student's answer:
"""
${studentAnswer}
"""${note}

Evaluate this answer. Respond ONLY with the JSON object, no other text.`;
}
