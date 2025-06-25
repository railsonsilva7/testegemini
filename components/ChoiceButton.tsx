
import React from 'react';

interface ChoiceButtonProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
  isGameOverChoice?: boolean;
}

const ChoiceButton: React.FC<ChoiceButtonProps> = ({ text, onClick, disabled = false, isGameOverChoice = false }) => {
  const baseClasses = "w-full px-4 py-3 rounded-lg font-medium transition-all duration-150 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-opacity-75 shadow-md hover:shadow-lg";
  const enabledClasses = "hover:scale-105";
  const disabledClasses = "opacity-60 cursor-not-allowed";
  
  let colorClasses = "bg-sky-600 hover:bg-sky-700 text-white focus:ring-sky-400";
  if (isGameOverChoice) {
    if (text.toLowerCase().includes("play again")) {
        colorClasses = "bg-green-600 hover:bg-green-700 text-white focus:ring-green-400";
    } else if (text.toLowerCase().includes("end game")) {
        colorClasses = "bg-red-600 hover:bg-red-700 text-white focus:ring-red-400";
    }
  }


  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${colorClasses} ${disabled ? disabledClasses : enabledClasses}`}
    >
      {text}
    </button>
  );
};

export default ChoiceButton;
    