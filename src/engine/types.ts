export interface Choice {
  word_hu: string;
  word_en: string;
  icon: string;
  next: string;
}

export interface StoryNode {
  text_hu: string;
  text_en?: string;
  audio_hu?: string;
  audio_en?: string;
  choices: Choice[];
}

export interface Story {
  story_id: string;
  title: string;
  start_node: string;
  nodes: Record<string, StoryNode>;
}
