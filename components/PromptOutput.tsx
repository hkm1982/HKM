import React, { useState, useCallback } from 'react';
import type { RefinedPromptResponse } from '../types';
import { geminiService } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audio';
import { ClipboardIcon, VolumeUpIcon } from './Icons';

interface PromptOutputProps {
  originalPrompt: string;
  refinedResponse: RefinedPromptResponse | null;
  isLoading: boolean;
  error: string | null;
  groundingSources: {title: string; uri: string}[];
}

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
    </div>
);

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    // A simple renderer for demonstration. A library like 'marked' or 'react-markdown' would be better for a full implementation.
    const renderContent = () => {
        return content
            .split('\n')
            .map((line, index) => {
                if (line.startsWith('* ')) {
                    return <li key={index} className="ml-5 list-disc">{line.substring(2)}</li>;
                }
                return <p key={index}>{line}</p>;
            });
    };
    return <div className="prose prose-invert prose-sm max-w-none">{renderContent()}</div>;
};

export const PromptOutput: React.FC<PromptOutputProps> = ({ refinedResponse, isLoading, error, groundingSources }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');

  const handleSpeak = useCallback(async () => {
    if (!refinedResponse?.refined_prompt || isSpeaking) return;
    setIsSpeaking(true);
    try {
      const audioB64 = await geminiService.synthesizeSpeech(refinedResponse.refined_prompt);
      const audioBytes = decode(audioB64);
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => setIsSpeaking(false);
      source.start();

    } catch (e) {
      console.error("Error synthesizing speech:", e);
      setIsSpeaking(false);
    }
  }, [refinedResponse, isSpeaking]);

  const handleCopy = () => {
    if (!refinedResponse?.refined_prompt) return;
    navigator.clipboard.writeText(refinedResponse.refined_prompt).then(() => {
        setCopySuccess('Copiado!');
        setTimeout(() => setCopySuccess(''), 2000);
    }, (err) => {
        console.error('Could not copy text: ', err);
        setCopySuccess('Falha ao copiar');
        setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  const renderContent = () => {
    if (isLoading) return <LoadingSpinner />;
    if (error) return <div className="text-red-400 bg-red-900/50 p-4 rounded-md">{error}</div>;
    if (!refinedResponse) {
      return (
        <div className="text-center text-gray-500 flex flex-col items-center justify-center h-full">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
          <p>Seu prompt refinado aparecerá aqui.</p>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-green-300">Prompt Refinado</h3>
            <div className="flex items-center gap-2">
                <button onClick={handleSpeak} disabled={isSpeaking} className="p-2 text-gray-400 hover:text-white disabled:opacity-50 transition-colors rounded-full hover:bg-gray-700">
                    <VolumeUpIcon className="w-5 h-5" />
                </button>
                <button onClick={handleCopy} className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700 relative">
                    <ClipboardIcon className="w-5 h-5" />
                    {copySuccess && <span className="absolute -top-7 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded">{copySuccess}</span>}
                </button>
            </div>
          </div>
          <div className="bg-gray-900 p-4 rounded-md border border-gray-700">
            <p className="text-gray-200 whitespace-pre-wrap">{refinedResponse.refined_prompt}</p>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-blue-300 mb-2">Explicação</h3>
          <div className="bg-gray-900 p-4 rounded-md border border-gray-700 text-gray-300 space-y-2">
            <MarkdownRenderer content={refinedResponse.explanation} />
          </div>
        </div>
        {groundingSources.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-yellow-300 mb-2">Fontes da Web</h3>
            <div className="bg-gray-900 p-4 rounded-md border border-gray-700 space-y-2">
                <ul className="list-disc pl-5">
                {groundingSources.map((source, index) => (
                    <li key={index} className="truncate">
                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                            {source.title}
                        </a>
                    </li>
                ))}
                </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 shadow-2xl h-full overflow-y-auto">
      {renderContent()}
    </div>
  );
};
