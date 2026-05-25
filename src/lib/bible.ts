import { promises as fs } from 'fs';
import path from 'path';
import YAML from 'yaml';

const BIBLE_DIR = path.join(process.cwd(), 'assets', 'bible');

export type StyleBible = {
  id: string;
  name: string;
  reference: string;
  description: string;
  prompt_anchor: string;
  [k: string]: unknown;
};

export type WorldBible = {
  id: string;
  name: string;
  setting: string;
  rules: string[];
  prompt_anchor: string;
  [k: string]: unknown;
};

export type CharacterBible = {
  id: string;
  name_cn: string;
  name_en: string;
  role: string;
  animal: string;
  prompt_anchor: string;
  [k: string]: unknown;
};

async function readYaml<T>(rel: string): Promise<T> {
  const raw = await fs.readFile(path.join(BIBLE_DIR, rel), 'utf-8');
  return YAML.parse(raw) as T;
}

export async function loadStyle(): Promise<StyleBible> {
  return readYaml<StyleBible>('style.yaml');
}

export async function loadWorld(): Promise<WorldBible> {
  return readYaml<WorldBible>('world.yaml');
}

export async function loadCharacters(): Promise<CharacterBible[]> {
  const dir = path.join(BIBLE_DIR, 'characters');
  const files = (await fs.readdir(dir)).filter((f) => f.endsWith('.yaml'));
  return Promise.all(files.map((f) => readYaml<CharacterBible>(`characters/${f}`)));
}
