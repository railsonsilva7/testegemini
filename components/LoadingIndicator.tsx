
import React from 'react';

interface LoadingIndicatorProps {
  message?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center w-full max-w-md bg-gray-800 rounded-xl shadow-xl">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mb-6"></div>
      <p className="text-xl font-semibold text-gray-200">{message}</p>
      <p className="text-sm text-gray-400 mt-2">Please wait a moment.</p>
    </div>
  );
};

export default LoadingIndicator;
    