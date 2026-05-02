import main_skills_prompt from "./skills-prompts/main_skills";
import d3_skills_prompt from "./skills-prompts/d3_skills";
import pdf_skills_prompt from "./skills-prompts/pdf_skills";

export const prompts: Record<"mainAgent" | "d3Skills" | "pdfSkills", string> = {
  mainAgent: main_skills_prompt,
  d3Skills: d3_skills_prompt,
  pdfSkills: pdf_skills_prompt,
};

export type PromptKey = keyof typeof prompts;
