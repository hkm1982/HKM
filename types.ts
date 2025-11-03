export interface RefinedPromptResponse {
  refined_prompt: string;
  explanation: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
