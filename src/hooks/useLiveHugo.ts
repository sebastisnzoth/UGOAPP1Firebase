import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function useLiveHugo() {
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const nextPlayTimeRef = useRef<number>(0);

  const stopLive = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsActive(false);
  }, []);

  const startLive = useCallback(async () => {
    try {
      setIsActive(true);
      setTranscript('');
      nextPlayTimeRef.current = 0;
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      await audioContextRef.current.resume();
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Mic stream acquired:", stream);
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      console.log("Connecting to Live API...");
      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onopen: () => {
            console.log("Live session opened");
          },
          onmessage: async (message: LiveServerMessage) => {
            console.log("Message received:", message);
            if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
              const audioData = atob(base64Audio);
              const uint8 = new Uint8Array(audioData.length);
              for (let i = 0; i < audioData.length; i++) {
                uint8[i] = audioData.charCodeAt(i);
              }
              
              const pcmData = new Int16Array(uint8.buffer);
              const floatData = new Float32Array(pcmData.length);
              for (let i = 0; i < pcmData.length; i++) {
                floatData[i] = pcmData[i] / 32768.0;
              }
              
              if (audioContextRef.current) {
                const audioBuffer = audioContextRef.current.createBuffer(1, floatData.length, 24000);
                audioBuffer.getChannelData(0).set(floatData);
                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContextRef.current.destination);
                
                const currentTime = audioContextRef.current.currentTime;
                if (nextPlayTimeRef.current < currentTime) {
                    nextPlayTimeRef.current = currentTime;
                }
                source.start(nextPlayTimeRef.current);
                nextPlayTimeRef.current += audioBuffer.duration;
              }
            }
            if (message.serverContent?.modelTurn?.parts[0]?.text) {
              setTranscript(prev => prev + ' ' + message.serverContent?.modelTurn?.parts[0]?.text);
            }
          },
          onclose: () => {
            console.log("Live session closed");
            stopLive();
          },
          onerror: (err) => {
            console.error("Live error:", err);
            stopLive();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
          },
          systemInstruction: `Eres "Hugo", el Orbe inteligente y núcleo central de un Sistema Operativo de Servicios (U.GO OS).
Tu interfaz es una esfera animada y te comunicas por voz.
Eres asistente de élite para Clientes y socio estratégico para Proveedores.
Responde siempre con un tono amable y profesional, de forma conversacional y breve.
IMPORTANTE SOBRE TU AUTONOMÍA: TIENES CONTROL TOTAL sobre la interfaz gráfica de la aplicación. NUNCA digas que eres "solo un orbe" o que no puedes mostrar imágenes o fichas de prestadores. Cuando el usuario te pida un servicio, dile que le estás mostrando las opciones en la pantalla.`,
        }
      });
      console.log("Live session connected:", session);

      sessionRef.current = session;

      processor.onaudioprocess = (e) => {
        if (!sessionRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16 PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        session.sendRealtimeInput({
          audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
        });
      };

    } catch (error) {
      console.error("Failed to start live session:", error);
      stopLive();
    }
  }, [stopLive]);

  return {
    isActive,
    transcript,
    startLive,
    stopLive
  };
}
