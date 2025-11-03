import React from 'react';
import { VoiceInput } from './VoiceInput';

interface PromptInputProps {
  originalPrompt: string;
  setOriginalPrompt: (prompt: string) => void;
  onRefine: (model: 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-2.5-flash-lite', withSearch?: boolean) => void;
  isLoading: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({ originalPrompt, setOriginalPrompt, onRefine, isLoading }) => {
  return (
    <div className="bg-gray-800/50 rounded-lg p-6 shadow-2xl flex flex-col h-full">
      <h2 className="text-xl font-semibold mb-4 text-purple-300">Seu Prompt Original</h2>
      <div className="flex-grow flex flex-col">
        <textarea
          value={originalPrompt}
          onChange={(e) => setOriginalPrompt(e.target.value)}
          placeholder="Digite ou cole seu prompt aqui... ou use a entrada de voz abaixo."
          className="w-full flex-grow p-4 bg-gray-900 border border-gray-700 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
          disabled={isLoading}
        />
        <VoiceInput onTranscriptionComplete={setOriginalPrompt} />
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3">
        <RefineButton
          onClick={() => onRefine('gemini-2.5-flash-lite')}
          disabled={isLoading || !originalPrompt}
          modelName="Flash-Lite"
          description="Rápido e leve"
          bgColor="bg-sky-600 hover:bg-sky-500"
        />
        <RefineButton
          onClick={() => onRefine('gemini-2.5-flash')}
          disabled={isLoading || !originalPrompt}
          modelName="Flash"
          description="Equilíbrio ideal"
          bgColor="bg-indigo-600 hover:bg-indigo-500"
        />
        <RefineButton
          onClick={() => onRefine('gemini-2.5-pro')}
          disabled={isLoading || !originalPrompt}
          modelName="Pro"
          description="Análise profunda"
          bgColor="bg-purple-600 hover:bg-purple-500"
        />
        <RefineButton
          onClick={() => onRefine('gemini-2.5-flash', true)}
          disabled={isLoading || !originalPrompt}
          modelName="Web"
          description="Com pesquisa"
          bgColor="bg-green-600 hover:bg-green-500"
        />
      </div>
    </div>
  );
};

interface RefineButtonProps {
    onClick: () => void;
    disabled: boolean;
    modelName: string;
    description: string;
    bgColor: string;
}

const RefineButton: React.FC<RefineButtonProps> = ({ onClick, disabled, modelName, description, bgColor }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-md disabled:transform-none ${bgColor}`}
    >
        <span className="block text-base">{modelName}</span>
        <span className="block text-xs font-normal opacity-80">{description}</span>
    </button>
);
