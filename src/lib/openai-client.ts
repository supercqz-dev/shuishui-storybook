import OpenAI from 'openai';

let _client: OpenAI | null = null;

export function getClient(): OpenAI {
  if (_client) return _client;
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL;
  if (!apiKey) throw new Error('OPENAI_API_KEY missing in .env');
  if (!baseURL) throw new Error('OPENAI_BASE_URL missing in .env');
  _client = new OpenAI({ apiKey, baseURL });
  return _client;
}

export const LLM_MODEL = process.env.LLM_MODEL || 'azure_openai/gpt-5.5';
export const IMAGE_MODEL = process.env.IMAGE_MODEL || 'azure_openai/gpt-image-2';
