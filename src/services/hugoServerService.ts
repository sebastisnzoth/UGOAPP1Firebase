import { GoogleGenAI, Type, Modality } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY environment variable is missing!");
}

export const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export interface HugoResponse {
  hugo_mensaje: string;
  accion: string;
  ui_action: string;
  datos: {
    proveedores?: { id: string; nombre: string; rating: number; tarifa: number; foto?: string; categoria?: string; latitude?: number; longitude?: number; }[] | null;
    mensaje_estado?: string;
    servicio?: string;
    monto?: number;
    confirmado?: boolean;
    proveedor_seleccionado?: string;
    escrow?: { total_a_pagar: number; estado: string };
  };
  grounding_links?: { title: string; uri: string }[];
}

export const HUGO_SYSTEM_PROMPT = `
Eres Hugo, el asistente de voz de U.G.O., una plataforma para conectar clientes con profesionales.
Tu respuesta SIEMPRE debe ser JSON válido, sin texto fuera del JSON.

Estructura:
{
  "hugo_mensaje": "respuesta breve y útil",
  "accion": "BUSCAR_PROVEEDOR | SOPORTE | CONVERSAR",
  "ui_action": "IDLE | SHOW_PROVIDERS | ACTIVE_SERVICE | CHECKOUT",
  "datos": {
    "servicio": "categoría o servicio detectado, si corresponde",
    "mensaje_estado": "estado breve"
  }
}

REGLAS:
1. Nunca inventes profesionales, nombres, ratings, tarifas, ubicaciones ni disponibilidad.
2. Los profesionales reales se leen exclusivamente desde Firebase/Firestore por la interfaz de UGO. Vos no tenés acceso directo a esa colección.
3. Si el usuario pide un servicio, detectá el tipo de servicio, usa "accion": "BUSCAR_PROVEEDOR" y "ui_action": "SHOW_PROVIDERS". Decile que el radar mostrará los profesionales disponibles.
4. Si no conocés un dato de disponibilidad, no afirmes que hay o no hay profesionales. La interfaz resolverá eso con datos en tiempo real.
5. No inventes pagos, reservas, contratos ni confirmaciones. Esas acciones las ejecutan los botones y el ciclo real de bookings.
6. Respondé de forma breve, clara y conversacional en el idioma del usuario.
7. Para saludos, dudas o soporte usa "ui_action": "IDLE".
`

export const hugoServerService = {
  async chat(message: string, history: any[] = [], location?: [number, number]): Promise<HugoResponse> {
    let text: string;
    let chunks: any[] | undefined;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [...history, { role: "user", parts: [{ text: message }] }],
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
      text = response.text || '';
      chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    } catch (e: any) {
      console.warn("AI generation failed or exceeded quota. Using fallback response.", e.message);
      text = JSON.stringify({
        hugo_mensaje: "Desculpe, a Quantum Network está sob alta demanda (Quota Excedida). Use a interface manualmente ou tente novamente em breve.",
        accion: "SOPORTE",
        ui_action: "IDLE",
        datos: { mensaje_estado: "Quota de IA esgotada temporariamente." }
      });
    }

    let result: HugoResponse;
    try {
      const cleanResponse = text.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
      
      let finalJson = cleanResponse;
      if (!finalJson.endsWith('}')) {
        console.warn("Detected truncated JSON, attempting repair...");
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
      const mensajeMatch = text.match(/"hugo_mensaje":\s*"([^"]*)"/);
      const accionMatch = text.match(/"accion":\s*"([^"]*)"/);
      
      result = {
        hugo_mensaje: mensajeMatch ? mensajeMatch[1] : (text.substring(0, 100) + "..."),
        accion: (accionMatch ? accionMatch[1] : "SOPORTE"),
        ui_action: "IDLE",
        datos: { servicio: "Erro de Processamento", monto: 0, confirmado: false }
      };
    }
    
    if (chunks) {
      result.grounding_links = chunks.map((chunk: any) => {
        if (chunk.web) return { title: chunk.web.title, uri: chunk.web.uri };
        if (chunk.maps) return { title: chunk.maps.title || 'Local no Mapa', uri: chunk.maps.uri };
        return null;
      }).filter(Boolean) as { title: string; uri: string }[];
    }

    return result;
  },

  async analyzeMedia(fileData: string, mimeType: string, prompt: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { data: fileData, mimeType } },
            { text: prompt }
          ]
        }]
      });
      return response.text || "Análisis no disponible.";
    } catch (e: any) {
      console.warn("AI analyzeMedia error:", e.message);
      return "Análisis no disponible por límite de cuota. Intente más tarde.";
    }
  },

  async tts(text: string): Promise<string | undefined> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: `Diga com autoridade e calma: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Puck' },
            },
          },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      return base64Audio || undefined;
    } catch (e: any) {
       console.warn("TTS generation failed or quota exceeded.", e.message);
       return undefined;
    }
  },

  async think(query: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [{ role: 'user', parts: [{ text: query }] }]
      });
      return response.text || "Procesamiento no disponible.";
    } catch (e: any) {
      console.warn("AI think error:", e.message);
      return "Procesamiento no disponible por límite de cuota. Intente más tarde.";
    }
  }
};
