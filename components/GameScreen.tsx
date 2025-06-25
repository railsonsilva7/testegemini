
import React from 'react';
import { GameScene, StoryChoice } from '../types';
import ImageDisplay from './ImageDisplay';
import ChoiceButton from './ChoiceButton';

interface GameScreenProps {
  scene: GameScene;
  imageUrl: string | null;
  onChoice: (choice: string) => void;
  isLoadingImage: boolean;
  isGameOver: boolean;
  onRestart: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ scene, imageUrl, onChoice, isLoadingImage, isGameOver, onRestart }) => {
  return (
    <div className="w-full max-w-3xl p-6 bg-gray-800 rounded-xl shadow-2xl flex flex-col items-center">
      <div className="w-full md:w-3/4 lg:w-2/3 aspect-video mb-6 rounded-lg overflow-hidden shadow-lg bg-gray-700">
        <ImageDisplay imageUrl={imageUrl} altText={scene.imagePrompt} isLoading={isLoadingImage} />
      </div>

      <div className="w-full text-left mb-6 bg-gray-700 p-4 rounded-lg shadow-inner">
        <h2 className="text-xl font-semibold mb-2 text-indigo-300">Current Situation:</h2>
        <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{scene.story}</p>
      </div>

      {isGameOver && !scene.choices.some(c => c.text.toLowerCase().includes("play again")) && (
        <div className="w-full text-center mb-6 p-4 bg-gray-700 rounded-lg">
          <p className="text-2xl font-bold text-yellow-400">The End</p>
          <p className="text-gray-300 mt-2">{scene.story.includes("win") ? "Congratulations!" : "Better luck next time."}</p>
        </div>
      )}
      
      <div className="w-full">
        <h3 className="text-lg font-medium mb-3 text-center text-indigo-400">What do you do next?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {scene.choices.map((choice, index) => (
            <ChoiceButton
              key={index}
              text={choice.text}
              onClick={() => onChoice(choice.text)}
              isGameOverChoice={choice.isGameOverChoice}
            />
          ))}
        </div>
      </div>
       {isGameOver && scene.choices.some(c => c.text.toLowerCase().includes("play again")) && (
         <div className="mt-6 w-full text-center">
            {/* The "Play Again" choice itself will handle restart via onChoice logic in App.tsx */}
         </div>
       )}
    </div>
  );
};

export default GameScreen;
    