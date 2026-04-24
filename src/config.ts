function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function optional(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== "" ? value : undefined;
}

function numberFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return value;
}

export const env = {
  OPENAI_API_KEY: optional("OPENAI_API_KEY"),
  OPENAI_MODEL: optional("OPENAI_MODEL") ?? "gpt-5",
  PORT: numberFromEnv("PORT", 3333),
  REVIEWER_API_TOKEN: optional("REVIEWER_API_TOKEN")
};

export function requireOpenAiApiKey(): string {
  return required("OPENAI_API_KEY");
}
