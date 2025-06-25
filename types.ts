
export enum GameState {
  START_SCREEN,
  LOADING_STORY,
  GENERATING_IMAGE,
  PLAYING,
  GAME_OVER,
  ERROR
}

export interface StoryChoice {
  text: string;
  isGameOverChoice?: boolean; // Indicates if this choice leads to a game over screen (e.g., "Play Again")
}

export interface GameScene {
  story: string;
  imagePrompt: string;
  choices: StoryChoice[]; // Changed to StoryChoice[]
}

export interface HistoryEntry {
  story: string;
  imageUrl: string | null;
  chosenAction: string;
}
    