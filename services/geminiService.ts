import { GoogleGenAI, Type } from "@google/genai";
import { MODULE_DEFINITIONS } from "../constants";

// Initialize Gemini API
// We assume process.env.API_KEY is available as per instructions.
// If not, we'll handle it gracefully in the UI.

const apiKey = process.env.API_KEY;

export const generateConfigFromPrompt = async (userPrompt: string) => {
  if (!apiKey) {
    throw new Error("API Key not configured");
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
    You are a configuration generator for the Starship shell prompt. 
    The user will describe a visual style (e.g., "cyberpunk", "minimalist", "rainbow").
    You must return a JSON object representing a list of modules to be enabled and their properties.
    
    Available modules: ${MODULE_DEFINITIONS.map(m => m.name).join(', ')}.
    
    Rules:
    1. Return a strictly valid JSON.
    2. The structure should be: { "modules": [ { "type": "module_name", "properties": { "key": "value" } } ] }
    3. Use 'line_break' type for newlines.
    4. Prioritize aesthetics matching the user's description.
    5. Use NerdFont symbols where appropriate.
    6. Format strings should follow Starship syntax: "[$symbol...]($style)".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                modules: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING },
                            properties: { type: Type.OBJECT }
                        },
                        required: ["type", "properties"]
                    }
                }
            }
        }
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No response text");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
