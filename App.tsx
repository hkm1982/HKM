import React, { useState, useCallback } from 'react';
import { PromptInput } from './components/PromptInput';
import { PromptOutput } from './components/PromptOutput';
import { ChatWidget } from './components/ChatWidget';
import { geminiService } from './services/geminiService';
import type { RefinedPromptResponse, ChatMessage } from './types';
import { GithubIcon, SparklesIcon } from './components/Icons';

const App: React.FC = () => {
  const [originalPrompt, setOriginalPrompt] = useState<string>('');
  const [refinedResponse, setRefinedResponse] = useState<RefinedPromptResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [groundingSources, setGroundingSources] = useState<{title: string, uri: string}[]>([]);

  const handleRefine = useCallback(async (model: 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-2.5-flash-lite', withSearch: boolean = false) => {
    if (!originalPrompt.trim()) {
      setError('Por favor, insira um prompt para refinar.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setRefinedResponse(null);
    setGroundingSources([]);

    try {
      let result;
      if (withSearch) {
        result = await geminiService.refineWithSearch(originalPrompt);
        setGroundingSources(result.sources);
        setRefinedResponse({ refined_prompt: result.text, explanation: "Refinado com informações da web para maior precisão e atualidade. Fontes listadas abaixo." });
      } else {
        const responseText = await geminiService.refinePrompt(originalPrompt, model);
        const parsedResponse: RefinedPromptResponse = JSON.parse(responseText);
        setRefinedResponse(parsedResponse);
      }
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro ao refinar o prompt. Verifique o console para mais detalhes.');
      setRefinedResponse(null);
    } finally {
      setIsLoading(false);
    }
  }, [originalPrompt]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4 shadow-lg sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className='flex items-center gap-3'>
            <SparklesIcon className="w-8 h-8 text-purple-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Assistente de Engenharia de Prompt
            </h1>
          </div>
          <a href="https://github.com/google/gemini-api-cookbook" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
            <GithubIcon className="w-7 h-7" />
          </a>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8 flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PromptInput
          originalPrompt={originalPrompt}
          setOriginalPrompt={setOriginalPrompt}
          onRefine={handleRefine}
          isLoading={isLoading}
        />
        <PromptOutput
          originalPrompt={originalPrompt}
          refinedResponse={refinedResponse}
          isLoading={isLoading}
          error={error}
          groundingSources={groundingSources}
        />
      </main>
      
      <ChatWidget />
    </div>
  );
};

export default App;
