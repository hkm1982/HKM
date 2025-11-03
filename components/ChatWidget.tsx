import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { geminiService } from '../services/geminiService';
import { PaperAirplaneIcon } from './Icons';

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Olá! Como posso ajudar com a engenharia de prompts hoje?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!userInput.trim() || isLoading) return;
    const newMessages: ChatMessage[] = [...messages, { role: 'user', text: userInput }];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await geminiService.getChatResponse(newMessages, userInput);
      setMessages([...newMessages, { role: 'model', text: response }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages([...newMessages, { role: 'model', text: 'Desculpe, ocorreu um erro.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-purple-600 text-white rounded-full p-4 shadow-lg hover:bg-purple-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        aria-label="Toggle chat"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-full max-w-md h-[60vh] bg-gray-800 rounded-lg shadow-xl flex flex-col border border-gray-700">
          <div className="p-4 bg-gray-900 rounded-t-lg border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Ajuda com Prompts</h3>
          </div>
          <div className="flex-grow p-4 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs md:max-w-sm px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
                 <div className="flex justify-start">
                    <div className="max-w-xs md:max-w-sm px-4 py-2 rounded-lg bg-gray-700 text-gray-200">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 border-t border-gray-700 bg-gray-900 rounded-b-lg">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Pergunte algo..."
                className="w-full bg-gray-700 text-white rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isLoading}
              />
              <button onClick={handleSend} disabled={isLoading || !userInput.trim()} className="bg-purple-600 text-white rounded-full p-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors">
                <PaperAirplaneIcon className="w-5 h-5"/>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
