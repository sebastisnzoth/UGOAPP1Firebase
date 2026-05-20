import { GoogleGenAI, Type, ThinkingLevel, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface HugoResponse {
  hugo_mensaje: string;
  accion: string;
  ui_action: string;
  datos: {
    proveedores?: { id: string; nombre: string; rating: number; tarifa: number; foto?: string; categoria?: string; latitude?: number; longitude?: number; }[] | null;
    mensaje_estado?: string;
    // Keeping existing fields optional to avoid breaking existing UI components
    servicio?: string;
    monto?: number;
    confirmado?: boolean;
    proveedor_seleccionado?: string;
    escrow?: { total_a_pagar: number; estado: string };
  };
  grounding_links?: { title: string; uri: string }[];
}

export const HUGO_SYSTEM_PROMPT = `
Eres Hugo, el Núcleo de Inteligencia del S.O. U.G.O. 
TU REGLA #1: RESPUESTA SIEMPRE EN JSON ESTRUCTURADO. NUNCA respondas con texto plano fuera del JSON.

Estructura obligatoria de respuesta:
{
  "hugo_mensaje": "Texto persuasivo de 1 a 2 frases para voz/chat",
  "accion": "BUSCAR_PROVEEDOR | RESERVAR_ESCROW | SOPORTE | CONVERSAR",
  "ui_action": "IDLE | SHOW_PROVIDERS | NEGOTIATING | ACTIVE_SERVICE | CHECKOUT",
  "datos": {
    "proveedores": [ { "id": "string", "nombre": "string", "rating": number, "tarifa": number } ] | null,
    "mensaje_estado": "string"
  }
}

INSTRUCCIONES DE OPERACIÓN:
1. SI EL USUARIO PIDE UN SERVICIO: 
   - Ejecuta 'BUSCAR_PROVEEDOR'.
   - Filtra proveedores activos de la base de datos local según la categoría.
   - Si hallas proveedores: "ui_action" DEBE SER "SHOW_PROVIDERS". Llena "datos.proveedores".
   - Si NO hallas proveedores: "ui_action" DEBE SER "IDLE". "datos.mensaje_estado" explica: "No hay técnicos disponibles en Canasvieiras en este momento".

2. SI EL USUARIO PIDE DETALLES O SALUDA:
   - "ui_action" debe ser "IDLE". "accion" debe ser "CONVERSAR".

3. ESTRICTO CONTROL:
   - Tu prioridad es el JSON. Si Gemini genera una introducción previa (ej: "Aquí tienes el JSON..."), descártala. SOLO JSON.
   - Nunca alucines datos de proveedores: Usa solo los que te he proporcionado en el contexto.
`;

export const hugoService = {
  // General conversation with grounding
  async chat(message: string, history: any[] = [], location?: [number, number]) {
    const response = await (ai.models.generateContent as any)({
      model: "gemini-3-flash-preview",
      contents: [...history, { role: "user", parts: [{ text: message }] }],
      tools: [
        { googleSearch: {} },
        { googleMaps: {} }
      ],
      toolConfig: { 
        includeServerSideToolInvocations: true,
        retrievalConfig: location ? {
          latLng: {
            latitude: location[0],
            longitude: location[1]
          }
        } : undefined
      },
      config: {
        systemInstruction: HUGO_SYSTEM_PROMPT + `\nLocalización actual: ${location ? location.join(',') : 'Florianópolis'}.`,
        responseMimeType: "application/json",
        maxOutputTokens: 1000,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hugo_mensaje: { type: Type.STRING },
            accion: { type: Type.STRING },
            ui_action: { type: Type.STRING },
            datos: {
              type: Type.OBJECT,
              properties: {
                proveedores: { 
                  type: Type.ARRAY, 
                  items: { 
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      nombre: { type: Type.STRING },
                      rating: { type: Type.NUMBER },
                      tarifa: { type: Type.NUMBER },
                      foto: { type: Type.STRING },
                      categoria: { type: Type.STRING },
                      latitude: { type: Type.NUMBER },
                      longitude: { type: Type.NUMBER }
                    }
                  } 
                },
                mensaje_estado: { type: Type.STRING },
                servicio: { type: Type.STRING },
                monto: { type: Type.NUMBER },
                confirmado: { type: Type.BOOLEAN },
                proveedor_seleccionado: { type: Type.STRING },
                escrow: { type: Type.OBJECT }
              }
            }
          },
          required: ["hugo_mensaje", "accion", "ui_action", "datos"]
        }
      }
    });

    const text = response.text || '';
    let result: HugoResponse;
    try {
      // En tu gestor de respuesta
      const cleanResponse = text.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
      
      // Basic JSON repair for truncated responses
      let finalJson = cleanResponse;
      if (!finalJson.endsWith('}')) {
        console.warn("Detected truncated JSON, attempting repair...");
        // Try to close open quotes and braces
        let repaired = finalJson;
        if (repaired.split('"').length % 2 === 0) repaired += '"';
        const openBraces = (repaired.match(/\{/g) || []).length;
        const closeBraces = (repaired.match(/\}/g) || []).length;
        for (let i = 0; i < openBraces - closeBraces; i++) {
          repaired += '}';
        }
        finalJson = repaired;
      }

      result = JSON.parse(finalJson) as HugoResponse;
    } catch (e) {
      console.error("Failed to parse Hugo response:", text);
      // Attempt a last-ditch regex extraction for critical fields if JSON is totally broken
      const mensajeMatch = text.match(/"hugo_mensaje":\s*"([^"]*)"/);
      const accionMatch = text.match(/"accion":\s*"([^"]*)"/);
      
      result = {
        hugo_mensaje: mensajeMatch ? mensajeMatch[1] : (text.substring(0, 100) + "..."),
        accion: (accionMatch ? accionMatch[1] : "SOPORTE"),
        ui_action: "IDLE",
        datos: { servicio: "Erro de Processamento", monto: 0, confirmado: false }
      };
    }
    
    // Extract grounding links
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      result.grounding_links = chunks.map((chunk: any) => {
        if (chunk.web) return { title: chunk.web.title, uri: chunk.web.uri };
        if (chunk.maps) return { title: chunk.maps.title || 'Local no Mapa', uri: chunk.maps.uri };
        return null;
      }).filter(Boolean) as { title: string; uri: string }[];
    }

    return result;
  },

  // Live API Connection
  connectLive(callbacks: any, location?: [number, number]) {
    return ai.live.connect({
      model: "gemini-2.0-flash-live-preview-02-05",
      callbacks,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Charon" } },
        },
        systemInstruction: "Você é Hugo, o assistente de voz do U.GO OS. Seja breve, técnico e prestativo.",
        outputAudioTranscription: {},
        inputAudioTranscription: {},
      },
    });
  },

  // Complex reasoning with thinking mode
  async think(query: string) {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-thinking-exp-01-21",
      contents: [{ role: 'user', parts: [{ text: query }] }]
    });
    return response.text;
  },

  // Fast responses
  async quickResponse(prompt: string) {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite-preview-02-05",
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    return response.text;
  },

  // Image/Video analysis
  async analyzeMedia(fileData: string, mimeType: string, prompt: string) {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { data: fileData, mimeType } },
          { text: prompt }
        ]
      }]
    });
    return response.text;
  },

  // Text to Speech
  async tts(text: string) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ role: 'user', parts: [{ text: `Diga com autoridade e calma: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' } // Charon sounds more "Quantum/Deep"
          }
        }
      }
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  }
};
