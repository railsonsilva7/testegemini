
import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { GameState, GameScene, HistoryEntry, StoryChoice } from './types';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import LoadingIndicator from './components/LoadingIndicator';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START_SCREEN);
  const [currentScene, setCurrentScene] = useState<GameScene | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [chatInstance, setChatInstance] = useState<Chat | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    // API_KEY is expected to be in process.env.
    const keyFromEnv = process.env.API_KEY;
    if (keyFromEnv) {
      setApiKey(keyFromEnv);
    } else {
      console.warn("API_KEY not found in process.env. Game functionality will be severely limited or disabled.");
      setErrorMessage("CRITICAL: API_KEY for Gemini services is not configured. Please ensure the API_KEY environment variable is set.");
      // Set to ERROR state, but allow app to render basic structure
      // setGameState(GameState.ERROR); // Or handle this more gracefully, perhaps allowing a demo mode if possible
    }
  }, []);


  const parseGeminiResponse = (responseText: string): GameScene | null => {
    try {
      let jsonStr = responseText.trim();
      const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[1]) {
        jsonStr = match[1].trim();
      }
      
      const parsed = JSON.parse(jsonStr);

      if (parsed.story && parsed.imagePrompt && Array.isArray(parsed.choices)) {
        // Ensure choices are in the correct format
        const formattedChoices: StoryChoice[] = parsed.choices.map((choice: any) => {
          if (typeof choice === 'string') {
            return { text: choice, isGameOverChoice: choice.toLowerCase().includes("play again") || choice.toLowerCase().includes("end game") };
          } else if (typeof choice === 'object' && choice.text) {
            return { text: choice.text, isGameOverChoice: choice.isGameOverChoice || choice.text.toLowerCase().includes("play again") || choice.text.toLowerCase().includes("end game") };
          }
          console.warn("Invalid choice format encountered:", choice);
          return { text: "Error: Invalid choice format", isGameOverChoice: true }; // Fallback
        });

        return {
          story: parsed.story,
          imagePrompt: parsed.imagePrompt,
          choices: formattedChoices,
        };
      }
      console.error("Parsed JSON does not match GameScene structure:", parsed);
      setErrorMessage("The story data from the AI is malformed. The adventure might be corrupted.");
      return null;
    } catch (error) {
      console.error("Failed to parse Gemini response:", error, "Raw response:", responseText);
      setErrorMessage("There was an issue understanding the story. The adventure might be corrupted by unparseable AI response.");
      return null;
    }
  };

  const generateImage = useCallback(async (prompt: string) => {
    if (!apiKey) {
      setErrorMessage("API Key is not configured. Cannot generate image.");
      setCurrentImageUrl(`https://picsum.photos/seed/${encodeURIComponent(prompt)}/512/512?text=API+Key+Missing`);
      return; 
    }
    setGameState(GameState.GENERATING_IMAGE);
    setCurrentImageUrl(null); 

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
      });

      if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image?.imageBytes) {
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        setCurrentImageUrl(`data:image/jpeg;base64,${base64ImageBytes}`);
      } else {
        throw new Error("No image generated or invalid response structure from Imagen API.");
      }
    } catch (error) {
      console.error("Imagen API error:", error);
      setErrorMessage(`Failed to generate image for the scene ("${prompt}"). Using a placeholder. Error: ${error instanceof Error ? error.message : String(error)}`);
      setCurrentImageUrl(`https://picsum.photos/seed/${encodeURIComponent(prompt)}/512/512?text=Image+Gen+Failed`);
    }
  }, [apiKey]);

  const processTurn = useCallback(async (geminiResponse: GenerateContentResponse) => {
    const responseText = geminiResponse.text;
    if (!responseText) {
        console.error("Received empty response text from Gemini.");
        setErrorMessage("The AI storyteller fell silent. No story data received.");
        setGameState(GameState.ERROR);
        return;
    }
    const newScene = parseGeminiResponse(responseText);

    if (newScene) {
      setCurrentScene(newScene);
      await generateImage(newScene.imagePrompt); // This will set currentImageUrl
      
      // Determine game state after image generation
      const isGameOverScene = newScene.choices.some(choice => choice.isGameOverChoice && choice.text.toLowerCase().includes("end game"));
      const hasPlayAgainOption = newScene.choices.some(choice => choice.isGameOverChoice && choice.text.toLowerCase().includes("play again"));

      if (isGameOverScene && !hasPlayAgainOption) {
         setGameState(GameState.GAME_OVER); // Ends, no explicit play again
      } else if (hasPlayAgainOption) { // Covers "Play Again" or "End Game" with "Play Again"
         setGameState(GameState.GAME_OVER); // Game is over, but play again is an option
      } else {
        setGameState(GameState.PLAYING);
      }
    } else {
      // parseGeminiResponse already sets an error message and logs
      setGameState(GameState.ERROR);
      // If errorMessage is still null here, set a generic one.
      if (!errorMessage) {
        setErrorMessage("Failed to process game turn due to response parsing issue.");
      }
    }
  }, [generateImage, apiKey, parseGeminiResponse, errorMessage]); // Added parseGeminiResponse and errorMessage


  const handleStartGame = useCallback(async (theme: string) => {
    if (!apiKey) {
      setErrorMessage("API Key is not configured. Cannot start game.");
      setGameState(GameState.ERROR);
      return;
    }
    setGameState(GameState.LOADING_STORY);
    setErrorMessage(null);
    setCurrentScene(null);
    setCurrentImageUrl(null);
    setHistory([]);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const newChat = ai.chats.create({
        model: 'gemini-2.5-flash-preview-04-17',
        config: {
          systemInstruction: `You are a text adventure game master. The user wants an adventure with the theme: "${theme}". Your goal is to create an engaging, dynamic story. For each turn, you MUST respond ONLY with a valid JSON object string. The JSON object must contain three properties: "story" (a paragraph describing the current situation, max 200 words), "imagePrompt" (a concise, vivid prompt for an image generation AI, focusing on key visual elements, max 30 words, e.g., 'A sun-dappled forest path leading to a mysterious ancient ruin.'), and "choices" (an array of 3-4 short, distinct action choices for the player, each max 15 words). Ensure choices lead to meaningful consequences and plot progression. If a choice leads to a game over (win or lose), clearly state it in the story and ensure "choices" contains options like "Play Again with a new theme?" or "End Game". Do not use any markdown formatting (like \`\`\`json) around your JSON output. Your entire response must be ONLY the JSON string. Ensure choices are strings.`,
          responseMimeType: "application/json", 
        },
      });
      setChatInstance(newChat);

      const initialMessage = `Start the adventure with the theme: ${theme}. Create the first scene.`;
      
      const result = await newChat.sendMessage({ message: initialMessage });
            
      await processTurn(result);

    } catch (error) {
      console.error("Gemini API error (startGame):", error);
      const specificError = error instanceof Error ? error.message : String(error);
      setErrorMessage(`Failed to start the adventure. ${specificError}. Please check your API key and network connection, then try again.`);
      setGameState(GameState.ERROR);
    }
  }, [apiKey, processTurn]);

  const handleChoice = useCallback(async (choiceText: string) => {
    if (!chatInstance || !currentScene) {
        console.warn("handleChoice called with no chatInstance or currentScene.");
        return;
    }

    if (currentScene && choiceText) {
        setHistory(prev => [...prev, { story: currentScene.story, imageUrl: currentImageUrl, chosenAction: choiceText }]);
    }
    
    setGameState(GameState.LOADING_STORY);
    setErrorMessage(null);
    setCurrentImageUrl(null); // Clear image while loading next scene

     const selectedChoice = currentScene.choices.find(c => c.text === choiceText);
     if (selectedChoice && selectedChoice.isGameOverChoice) {
        if (selectedChoice.text.toLowerCase().includes("play again")) {
            setGameState(GameState.START_SCREEN);
            setCurrentScene(null);
            setCurrentImageUrl(null);
            setChatInstance(null);
            setHistory([]);
            return;
        }
        if (selectedChoice.text.toLowerCase().includes("end game")) {
            setGameState(GameState.GAME_OVER);
            // Optionally enrich the final scene story slightly
            setCurrentScene(prevScene => ({
                ...(prevScene as GameScene), // Type assertion as prevScene won't be null here
                story: (prevScene?.story || "The adventure concluded.") + "\n\n The adventure has ended definitively.",
                choices: [{text: "Play Again with a new theme?", isGameOverChoice: true}] // Ensure a way to restart
            }));
            return;
        }
    }


    try {
      const result = await chatInstance.sendMessage({ message: choiceText });
      await processTurn(result);
    } catch (error) {
      console.error("Gemini API error (handleChoice):", error);
      const specificError = error instanceof Error ? error.message : String(error);
      setErrorMessage(`An error occurred while progressing the story: ${specificError}. The adventure may be unstable.`);
      setGameState(GameState.ERROR);
    }
  }, [chatInstance, processTurn, currentScene, currentImageUrl]);
  
  const handleRestart = () => {
    setGameState(GameState.START_SCREEN);
    setCurrentScene(null);
    setCurrentImageUrl(null);
    setChatInstance(null);
    setErrorMessage(null);
    setHistory([]);
  };


  if (!apiKey && gameState !== GameState.ERROR && gameState !== GameState.START_SCREEN) { 
     // Show stricter API key message if not already in error or start state.
     // StartScreen might be shown initially even without API key, until an action requires it.
     return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-gray-100 p-4">
            <h1 className="text-4xl font-bold mb-8 text-indigo-400">Gemini Adventure Weaver</h1>
            <LoadingIndicator message="Initializing... Validating API Key." />
            <div className="mt-4 p-4 bg-red-800 border border-red-600 rounded-lg text-yellow-300 text-center">
                <p className="font-semibold">CRITICAL: API Key Not Found!</p>
                <p className="mt-2">
                    This application requires a Google Gemini API key to function. 
                    Please ensure the <code>API_KEY</code> environment variable is correctly set up and accessible by the application.
                </p>
                <p className="mt-2">The game cannot proceed without it.</p>
            </div>
        </div>
     );
  }


  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-gray-100 p-4 selection:bg-indigo-500 selection:text-white">
      <header className="w-full max-w-4xl mt-4 mb-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 py-2">
          Gemini Adventure Weaver
        </h1>
      </header>

      {errorMessage && (
        <div className="w-full max-w-2xl p-4 mb-4 bg-red-800 border border-red-600 rounded-lg text-white text-center shadow-lg">
          <p className="font-semibold text-lg">An Error Occurred:</p>
          <p className="mt-1">{errorMessage}</p>
          {(gameState === GameState.ERROR || gameState === GameState.GAME_OVER || currentScene ) && (
            <button 
              onClick={handleRestart}
              className="mt-3 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold rounded-md transition-colors"
            >
              Restart Adventure
            </button>
          )}
        </div>
      )}

      {gameState === GameState.START_SCREEN && <StartScreen onStart={handleStartGame} disabled={!apiKey} />}
      
      {(gameState === GameState.LOADING_STORY || gameState === GameState.GENERATING_IMAGE) && (
        <LoadingIndicator message={
          gameState === GameState.LOADING_STORY ? "The storyteller is weaving the next part of your tale..." : "The world is materializing before your eyes..."
        } />
      )}

      {(gameState === GameState.PLAYING || gameState === GameState.GAME_OVER || (gameState === GameState.ERROR && currentScene)) && currentScene && (
        <GameScreen
          scene={currentScene}
          imageUrl={currentImageUrl}
          onChoice={handleChoice}
          isLoadingImage={false} 
          isGameOver={gameState === GameState.GAME_OVER}
          onRestart={handleRestart}
        />
      )}
      
      { (gameState === GameState.PLAYING || gameState === GameState.GAME_OVER) && history.length > 0 && !errorMessage && (
         <button 
            onClick={handleRestart}
            className="mt-8 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out transform hover:scale-105"
          >
           Restart Adventure From Scratch
          </button>
      )}

    </div>
  );
};

export default App;
