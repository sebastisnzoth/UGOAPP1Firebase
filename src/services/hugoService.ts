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

export const hugoService = {
  // General conversation with grounding via proxy
  async chat(message: string, history: any[] = [], location?: [number, number]): Promise<HugoResponse> {
    try {
      const response = await fetch('/api/hugo/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history, location }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json() as HugoResponse;
    } catch (error) {
      console.error("Error in proxied chat:", error);
      return {
        hugo_mensaje: "Tengo problemas para conectar con mi cerebro cuántico. ¿Podrías intentar de nuevo?",
        accion: "SOPORTE",
        ui_action: "IDLE",
        datos: {}
      };
    }
  },

  // Image/Video analysis via proxy
  async analyzeMedia(fileData: string, mimeType: string, prompt: string): Promise<string> {
    try {
      const response = await fetch('/api/hugo/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileData, mimeType, prompt }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.text || "Análisis no disponible.";
    } catch (error) {
      console.error("Error in proxied analyzeMedia:", error);
      return "Tengo problemas para analizar esta imagen en este momento.";
    }
  },

  // Text to Speech via proxy
  async tts(text: string): Promise<string | undefined> {
    try {
      const response = await fetch('/api/hugo/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.audio;
    } catch (error) {
      console.error("Error in proxied tts:", error);
      return undefined;
    }
  }
};
