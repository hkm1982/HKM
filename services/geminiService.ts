import { GoogleGenAI, Type, Modality, Chat } from "@google/genai";
import type { ChatMessage } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

let chatInstance: Chat | null = null;

const getChatInstance = () => {
  if (!chatInstance) {
    chatInstance = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: 'You are a helpful assistant specializing in prompt engineering. Answer the user\'s questions about writing effective prompts for AI models. Be friendly, concise, and provide examples when helpful. Use Markdown for formatting.',
      },
    });
  }
  return chatInstance;
};

export const geminiService = {
  refinePrompt: async (prompt: string, model: 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-2.5-flash-lite'): Promise<string> => {
    const response = await ai.models.generateContent({
      model: model,
      contents: `User prompt: "${prompt}"`,
      config: {
        systemInstruction: `You are an expert prompt engineer. Your task is to rewrite the user's prompt to be clearer, more specific, and more effective for a large language model.
1. Analyze the user's original intent.
2. Rewrite the prompt, improving wording, structure, and adding context where necessary.
3. Provide a brief, bulleted explanation of the key changes you made and why they improve the prompt.
4. Your output MUST be a valid JSON object.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            refined_prompt: {
              type: Type.STRING,
              description: "The improved, rewritten prompt."
            },
            explanation: {
              type: Type.STRING,
              description: "A brief, bulleted explanation of the key changes made and why they are improvements. Use Markdown for lists."
            }
          },
          required: ["refined_prompt", "explanation"]
        },
      }
    });
    return response.text;
  },

  refineWithSearch: async (prompt: string): Promise<{ text: string; sources: { title: string; uri: string }[] }> => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Rewrite and improve the following prompt, incorporating up-to-date information from the web to make it more specific and effective. Prompt: "${prompt}"`,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map(chunk => chunk.web)
      .filter(web => web?.uri && web?.title) as { title: string; uri: string }[] || [];

    return { text: response.text, sources: sources };
  },
  
  getChatResponse: async (history: ChatMessage[], newMessage: string): Promise<string> => {
      const chat = getChatInstance();
      // Note: The current SDK doesn't directly support passing history like this.
      // This is a simulation. For a real app, you'd manage history and send relevant parts.
      // For this implementation, we will just send the new message.
      const result = await chat.sendMessage({ message: newMessage });
      return result.text;
  },

  synthesizeSpeech: async (text: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data returned from API.");
    }
    return base64Audio;
  }
};
