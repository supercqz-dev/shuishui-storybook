export type Shot = 'wide' | 'medium' | 'close-up' | 'extreme-close-up';

export type Page = {
  page: number;
  narration: string;
  dialogue?: { speaker: string; text: string }[];
  shot: Shot;
  emotion: string;
  characters_in_scene: string[];
  scene_state: {
    location: string;
    weather?: string;
    time_of_day?: string;
    props?: string[];
  };
  composition_hint?: string;
  image_path?: string;
};

export type Book = {
  id: string;
  title: string;
  subtitle?: string;
  theme: string;
  moral: string;
  age_target: string;
  cover_image?: string;
  pages: Page[];
  created_at: string;
  status: 'draft' | 'storyboarded' | 'rendering' | 'finished';
};
