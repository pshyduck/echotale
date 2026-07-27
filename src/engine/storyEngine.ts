import { normalizeWord } from './normalize';
import type { Choice, Story, StoryNode } from './types';

export class StoryEngine {
  private story: Story;
  private currentNodeId: string;
  private history: string[] = [];

  constructor(story: Story) {
    this.story = story;
    this.currentNodeId = story.start_node;
  }

  getCurrentNode(): StoryNode {
    const node = this.story.nodes[this.currentNodeId];
    if (!node) {
      throw new Error(`Unknown node id: ${this.currentNodeId}`);
    }
    return node;
  }

  getCurrentNodeId(): string {
    return this.currentNodeId;
  }

  isEnding(): boolean {
    return this.getCurrentNode().choices.length === 0;
  }

  /** Advances the story to the choice's target node. */
  selectChoice(choice: Choice): StoryNode {
    this.history.push(this.currentNodeId);
    this.currentNodeId = choice.next;
    return this.getCurrentNode();
  }

  /**
   * Matches a spoken/typed word against the current node's choices.
   * Checks both the Hungarian (narration language) and English (learning
   * language) word, since a child may repeat either one.
   */
  matchChoice(spokenWord: string): Choice | null {
    const normalized = normalizeWord(spokenWord);
    if (!normalized) return null;

    const choices = this.getCurrentNode().choices;
    return (
      choices.find(
        (choice) =>
          normalizeWord(choice.word_hu) === normalized ||
          normalizeWord(choice.word_en) === normalized,
      ) ?? null
    );
  }

  restart(): StoryNode {
    this.currentNodeId = this.story.start_node;
    this.history = [];
    return this.getCurrentNode();
  }

  getStoryTitle(): string {
    return this.story.title;
  }
}
