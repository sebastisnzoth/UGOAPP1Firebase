import express from "express";
import { helloFlow } from "../src/genkit-setup";
import { hugoServerService } from "../src/services/hugoServerService";

const app = express();

// Config limit to handle media uploads (e.g. photos for analysis)
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

// Proxied Hugo Chat Endpoint (orchestrates agent operations)
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

// Text-to-Speech audio feedback service
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

// Multimodal media analyzer (processes voice inputs, environment reports)
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

// Backend Health endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Export default app for Vercel Serverless Function engine
export default app;
