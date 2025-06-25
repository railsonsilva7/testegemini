
import React from 'react';

interface ImageDisplayProps {
  imageUrl: string | null;
  altText: string;
  isLoading: boolean;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({ imageUrl, altText, isLoading }) => {
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-700 animate-pulse">
        <svg className="w-12 h-12 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="ml-3 text-gray-400">Conjuring visuals...</span>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-600">
        <svg className="w-16 h-16 text-gray-400 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7.172a4 4 0 015.656 0M3 10v10M3.828 8.828A4 4 0 010 12M20.172 8.828A4 4 0 0024 12" opacity="0.3" />
        </svg>
        <p className="text-gray-300 text-sm">No image available for this scene.</p>
        <p className="text-xs text-gray-400 mt-1 px-2 text-center">Attempting to visualize: "{altText}"</p>
      </div>
    );
  }

  return (
    <img 
        src={imageUrl} 
        alt={altText} 
        className="w-full h-full object-cover" 
        onError={(e) => {
            // Fallback for broken image links or invalid base64
            const target = e.target as HTMLImageElement;
            target.src = `https://picsum.photos/seed/${encodeURIComponent(altText)}/512/512`;
            target.alt = "Image failed to load. Placeholder shown.";
        }}
    />
  );
};

export default ImageDisplay;
    