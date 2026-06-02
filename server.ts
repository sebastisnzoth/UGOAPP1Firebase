import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import { helloFlow } from "./src/genkit-setup";
import http from "http";
import { WebSocketServer } from "ws";
import { Modality } from "@google/genai";
import { hugoServerService, ai as serverAi } from "./src/services/hugoServerService";

// Initialize Firebase Admin SDK lazily
let adminApp: admin.app.App | null = null;

export function getAdminApp(): admin.app.App {
  if (!adminApp) {
    try {
        adminApp = admin.initializeApp({
            credential: admin.credential.applicationDefault()
        });
    } catch (e) {
        console.error("Firebase Admin initialization error:", e);
        throw new Error("Failed to initialize Firebase Admin SDK");
    }
  }
  return adminApp;
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);

  // Configure WebSocket Server for Live Voice Chat
  const wss = new WebSocketServer({ server, path: '/api/hugo/live' });

  wss.on("connection", async (clientWs) => {
    console.log("Client connected to server live voice socket");
    let session: any = null;
    try {
      session = await serverAi.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onmessage: (message: any) => {
            try {
              const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audio) {
                clientWs.send(JSON.stringify({ audio }));
              }
              if (message.serverContent?.interrupted) {
                clientWs.send(JSON.stringify({ interrupted: true }));
              }
              if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
                clientWs.send(JSON.stringify({ text: message.serverContent.modelTurn.parts[0].text }));
              }
            } catch (err) {
              console.error("Error sending live message to client:", err);
            }
          },
          onclose: () => {
            console.log("Gemini live session closed");
            try { clientWs.close(); } catch (e) {}
          },
          onerror: (err: any) => {
            console.error("Gemini live session error:", err);
            try {
              clientWs.send(JSON.stringify({ error: "Gemini session error" }));
              clientWs.close();
            } catch (e) {}
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
          },
          systemInstruction: `Eres "Hugo", el Orbe inteligente y núcleo central de un Sistema Operativo de Servicios (U.GO OS).
Tu interfaz es una de las esferas animadas y te comunicas por voz.
Eres asistente de élite para Clientes y socio estratégico para Proveedores.
Responde siempre con un tono amable y profesional, de forma conversacional y breve.
IMPORTANTE SOBRE TU AUTONOMÍA: TIENES CONTROL TOTAL sobre la interfaz gráfica de la aplicación. NUNCA digas que eres "solo un orbe" o que no puedes mostrar imágenes o fichas de proveedores. Cuando el usuario te pida un servicio, dile que le estás mostrando las opciones en la pantalla.`,
        },
      });
    } catch (error) {
      console.error("Failed to connect Gemini Live on server:", error);
      try {
        clientWs.send(JSON.stringify({ error: "No se pudo iniciar la llamada de voz con el servidor." }));
        clientWs.close();
      } catch (e) {}
      return;
    }

    clientWs.on("message", (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.audio && session) {
          session.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: "audio/pcm;rate=16000" },
          });
        }
      } catch (err) {
        console.error("Error receiving/sending client audio to Gemini:", err);
      }
    });

    clientWs.on("close", () => {
      console.log("Client closed live voice socket");
      if (session) {
        try {
          session.close();
        } catch (e) {}
      }
    });
  });

  // API routes
  app.use(express.json({ limit: '50mb' }));
  
  app.post("/api/hugo", async (req, res) => {
    try {
      const { prompt } = req.body;
      const response = await helloFlow(prompt || "Hola");
      res.json({ text: response });
    } catch (error) {
      console.error("Genkit error:", error);
      res.status(500).json({ error: "Error interno en Hugo" });
    }
  });

  // Proxied Hugo endpoints
  app.post("/api/hugo/chat", async (req, res) => {
    try {
      const { message, history, location } = req.body;
      const result = await hugoServerService.chat(message, history, location);
      res.json(result);
    } catch (error: any) {
      console.error("Proxy error in /api/hugo/chat:", error);
      res.status(error?.status || 500).json({ error: error?.message || "Error de conexión con el cerebro de Hugo." });
    }
  });

  app.post("/api/hugo/tts", async (req, res) => {
    try {
      const { text } = req.body;
      const audio = await hugoServerService.tts(text);
      res.json({ audio });
    } catch (error: any) {
      console.error("Proxy error in /api/hugo/tts:", error);
      res.status(error?.status || 500).json({ error: error?.message || "Error al generar voz." });
    }
  });

  app.post("/api/hugo/analyze", async (req, res) => {
    try {
      const { fileData, mimeType, prompt } = req.body;
      const text = await hugoServerService.analyzeMedia(fileData, mimeType, prompt);
      res.json({ text });
    } catch (error: any) {
      console.error("Proxy error in /api/hugo/analyze:", error);
      res.status(error?.status || 500).json({ error: error?.message || "Error al analizar mídias." });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
