import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality, LiveSession } from "@google/genai";
import { encode } from '../utils/audio';
import { MicrophoneIcon, StopIcon } from './Icons';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

interface VoiceInputProps {
  onTranscriptionComplete: (transcription: string) => void;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscriptionComplete }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  const stopListening = useCallback(() => {
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close());
        sessionPromiseRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    if(scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
    }
    if(mediaStreamSourceRef.current) {
        mediaStreamSourceRef.current.disconnect();
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    setIsListening(true);
    setTranscription('');
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            mediaStreamSourceRef.current = audioContextRef.current!.createMediaStreamSource(stream);
            scriptProcessorRef.current = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const l = inputData.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) {
                    int16[i] = inputData[i] * 32768;
                }
                const pcmBlob = {
                    data: encode(new Uint8Array(int16.buffer)),
                    mimeType: 'audio/pcm;rate=16000',
                };
                sessionPromiseRef.current?.then((session) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
            };

            mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(audioContextRef.current!.destination);
          },
          onmessage: (message) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setTranscription(prev => prev + text);
            }
          },
          onerror: (e) => {
            console.error('Live API Error:', e);
            setError('Ocorreu um erro de conexão.');
            stopListening();
          },
          onclose: () => {
             stream.getTracks().forEach(track => track.stop());
          },
        },
      });

    } catch (err) {
      console.error('Error starting voice input:', err);
      setError('Não foi possível acessar o microfone.');
      setIsListening(false);
    }
  }, [stopListening]);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleUseText = () => {
    onTranscriptionComplete(transcription);
    setTranscription('');
    stopListening();
  };

  return (
    <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
      <div className="flex items-center gap-4">
        <button
          onClick={handleToggleListening}
          className={`p-3 rounded-full transition-colors ${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'}`}
        >
          {isListening ? <StopIcon className="w-6 h-6 text-white" /> : <MicrophoneIcon className="w-6 h-6 text-white" />}
        </button>
        <div className="flex-grow">
          <p className="text-sm text-gray-400">
            {isListening ? 'Ouvindo...' : 'Pressione para falar'}
          </p>
          {transcription && <p className="text-gray-200 mt-1 italic">"{transcription}"</p>}
          {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
        </div>
        {transcription && !isListening && (
          <button
            onClick={handleUseText}
            className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            Usar este Texto
          </button>
        )}
      </div>
    </div>
  );
};
