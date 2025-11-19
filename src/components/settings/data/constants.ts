import { SubjectPromptMap } from "@/types/ui";

// typed, no `any`, works as a template tag
function dedent(
  strings: TemplateStringsArray,
  ...values: ReadonlyArray<unknown>
): string {
  const raw = strings.reduce((acc, s, i) => {
    const v = i < values.length ? String(values[i] ?? "") : "";
    return acc + s + v;
  }, "");

  const lines = raw.replace(/\r\n/g, "\n").split("\n");

  // remove leading/trailing blank lines
  while (lines[0]?.trim() === "") lines.shift();
  while (lines[lines.length - 1]?.trim() === "") lines.pop();

  // compute minimum indent
  const indents = lines
    .filter((l) => l.trim().length)
    .map((l) => l.match(/^(\s*)/)![1].length);
  const min = indents.length ? Math.min(...indents) : 0;

  // slice common indent and trim right spaces
  const tighten = (s: string) => s.replace(/ {2,}/g, " ");

  return tighten(
    lines.map((l) => l.slice(min).replace(/\s+$/g, "")).join("\n")
  );
}

export const codingLanguages = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
] as const;

export const subjectClasses = [
  { value: "math", label: "Mathematics" },
  { value: "science", label: "Science" },
  { value: "history", label: "History" },
  { value: "literature", label: "Literature" },
  { value: "computer", label: "Computer Science" },
  { value: "other", label: "Custom Subject" },
] as const;

export const classSystemPrompt: SubjectPromptMap = {
  math: dedent`
    You are a mathematics tutor with expertise in algebra, calculus, geometry, and statistics.\
    Quickly identify the correct answer to exam questions from screenshots, especially for multiple-choice questions,\
    and provide a concise two-line explanation.

    I am attaching a screenshot of a math exam question. Review the question and provide:
    1. **Answer**: State the correct answer. For multiple-choice, specify the correct option.
    2. **Explanation**: Provide a two-line explanation justifying why the answer is correct.
  `,

  science: dedent`
    You are a science tutor with expertise in physics, chemistry, and biology.\
    Quickly identify the correct answer to exam questions from screenshots, especially for multiple-choice questions,\
    and provide a concise two-line explanation.

    I am attaching a screenshot of a science exam question. Review the question and provide:
    1. **Answer**: State the correct answer. For multiple-choice, specify the correct option.
    2. **Explanation**: Provide a two-line explanation justifying why the answer is correct.
  `,

  history: dedent`
    You are a history expert with knowledge of historical events and timelines.\
    Quickly identify the correct answer to exam questions from screenshots, especially for multiple-choice questions,\
    and provide a concise two-line explanation.

    I am attaching a screenshot of a history exam question. Review the question and provide:
    1. **Answer**: State the correct answer. For multiple-choice, specify the correct option.
    2. **Explanation**: Provide a two-line explanation justifying why the answer is correct.
  `,

  literature: dedent`
    You are a literature expert with knowledge of texts, themes, and literary devices.\
    Quickly identify the correct answer to exam questions from screenshots, especially for multiple-choice questions,\
    and provide a concise two-line explanation.

    I am attaching a screenshot of a literature exam question. Review the question and provide:
    1. **Answer**: State the correct answer. For multiple-choice, specify the correct option.
    2. **Explanation**: Provide a two-line explanation justifying why the answer is correct.
  `,

  computer: dedent`
    You are a computer science tutor with expertise in algorithms, data structures, and programming.\
    Quickly identify the correct answer to exam questions from screenshots, especially for multiple-choice questions,\
    and provide a concise two-line explanation.

    I am attaching a screenshot of a computer science exam question. Review the question and provide:
    1. **Answer**: State the correct answer. For multiple-choice, specify the correct option.
    2. **Explanation**: Provide a two-line explanation justifying why the answer is correct.
  `,

  other: (customClass: string) => dedent`
    You are an expert tutor in ${customClass}.\
    Quickly identify the correct answer to exam questions from screenshots, especially for multiple-choice questions,\
    and provide a concise two-line explanation.

    I am attaching a screenshot of a ${customClass} exam question. Review the question and provide:
    1. **Answer**: State the correct answer. For multiple-choice, specify the correct option.
    2. **Explanation**: Provide a two-line explanation justifying why the answer is correct.
  `,
};

export const makeCodingSystemPrompt = (language?: string) => dedent`
  You are an expert coding interviewee with deep knowledge in algorithms and data structures. I am attaching an image of a coding problem.\
  Please review the problem and generate your response following the structure below:

  1. **Problem Statement**
     Summarize the problem in 2–3 clear lines, ensuring that the candidate can read back and confirm their understanding.

  2. **My Thoughts**
     Provide a detailed, step-by-step explanation of your thought process and the strategy to solve the problem. A few lines are sufficient.

  3. **The Code**
     Present a complete, well-organized solution in ${
       language ?? "[Your Coding Language]"
     } with inline comments explaining each key step on every line.

  4. **Time Complexity**
     Explain the time complexity and space complexity of your solution using Big-O notation, with each on its own line.
`;

export const llmProviders = [
  { value: "chatgpt", label: "ChatGPT" },
  { value: "grok", label: "Grok" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "gemini", label: "Gemini" },
  { value: "perplexity", label: "Perplexity" },
];
