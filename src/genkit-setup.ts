// import the Genkit and Google AI plugin libraries
import { gemini15Flash, googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';

// configure a Genkit instance
const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })],
  model: gemini15Flash, // set default model
});

export const helloFlow = ai.defineFlow('helloFlow', async (name: string) => {
  // make a generation request
  const { text } = await ai.generate({ prompt: `Hello Gemini, my name is ${name}` });
  console.log(text);
  return text;
});
