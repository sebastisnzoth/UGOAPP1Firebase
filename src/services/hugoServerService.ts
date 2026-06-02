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

export const hugoServerService = {
  async chat(message: string, history: any[] = [], location?: [number, number]): Promise<HugoResponse> {
    let text: string;
    let chunks: any[] | undefined;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [...history, { role: "user", parts: [{ text: message }] }],
        config: {
          tools: [
            { googleSearch: {} }
          ],
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
        model: "gemini-1.5-flash",
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
        model: "gemini-1.5-flash",
        contents: [{ role: 'user', parts: [{ text: `Diga con autoridade e calma: ${text}` }] }]
      });
      return undefined;
    } catch (e: any) {
       console.warn("TTS generation failed or quota exceeded.", e.message);
       // Return undefined or a fallback message when failed so frontend handles it softly
       return undefined;
    }
  },

  async think(query: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.5-pro",
        contents: [{ role: 'user', parts: [{ text: query }] }]
      });
      return response.text || "Procesamiento no disponible.";
    } catch (e: any) {
      console.warn("AI think error:", e.message);
      return "Procesamiento no disponible por límite de cuota. Intente más tarde.";
    }
  }
};
