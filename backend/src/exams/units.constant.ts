// Программа "English for IT" (B1-B2): 18 юнитов за 2 семестра.
// Каждый юнит = грамматическая тема + IT-тематика. Используется
// для генерации вопросов экзаменов по конкретным юнитам.

export interface CourseUnit {
  number: number;
  grammar: string;
  topic: string;
}

export const UNITS: CourseUnit[] = [
  { number: 1, grammar: "Present Simple tense; singular and plural nouns", topic: "Personal portfolio in the digital world" },
  { number: 2, grammar: "Prepositions of time; time expressions", topic: "Managing time in the digital age" },
  { number: 3, grammar: "Present Continuous; adjectives", topic: "Digital technologies are changing the world" },
  { number: 4, grammar: "There is / there are; countable and uncountable nouns", topic: "Computer hardware and systems" },
  { number: 5, grammar: "Prepositions of place; degrees of comparison", topic: "Digital navigation and tech comparisons" },
  { number: 6, grammar: "Past participle; past forms of modals", topic: "IT milestones and computing history" },
  { number: 7, grammar: "Irregular verbs; sequencing verbs", topic: "Software development" },
  { number: 8, grammar: "Future Simple tense; suggestions and advice", topic: "The future of technology" },
  { number: 9, grammar: "Collocations with do/make/have/take/bring", topic: "Professional communication in IT" },
  { number: 10, grammar: "Past Simple; Past Continuous", topic: "Cybersecurity incidents" },
  { number: 11, grammar: "Descriptive adjectives; past tenses review", topic: "Evolution of computing devices" },
  { number: 12, grammar: "Quantity words; modal verbs", topic: "Big data management" },
  { number: 13, grammar: "Degrees of adjectives; idiomatic expressions", topic: "Performance optimization" },
  { number: 14, grammar: "First conditional", topic: "Project planning and risk management" },
  { number: 15, grammar: "Present Perfect tense", topic: "Achievements in computer science" },
  { number: 16, grammar: "Second conditional", topic: "Innovation and hypothetical thinking" },
  { number: 17, grammar: "Compound nouns; adjective suffixes", topic: "Technical writing" },
  { number: 18, grammar: "Passive voice", topic: "Technology standards and research" },
];

export function unitsInRange(from: number, to: number): CourseUnit[] {
  return UNITS.filter((u) => u.number >= from && u.number <= to);
}

/** Сжатое текстовое описание диапазона юнитов для промпта генерации */
export function unitsPromptText(units: CourseUnit[]): string {
  return units
    .map((u) => `Unit ${u.number} — grammar: ${u.grammar}; theme: ${u.topic}`)
    .join("\n");
}
