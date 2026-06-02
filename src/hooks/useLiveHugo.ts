import { useState, useCallback, useRef } from 'react';

export function useLiveHugo() {
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [liveError, setLiveError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);

  const stopLive = useCallback(() => {
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {}
      wsRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    setIsActive(false);
  }, []);

  const startLive = useCallback(async () => {
    try {
      setLiveError(null);
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

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/hugo/live`;
      console.log("Connecting to local Live Voice socket at URL:", wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Live Voice channel opened with server proxy");
      };

      ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("Voice channel stream packet:", message);
          
          if (message.error) {
            console.error("Live session error:", message.error);
            stopLive();
            return;
          }

          if (message.audio) {
            const base64Audio = message.audio;
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
              const sourceNode = audioContextRef.current.createBufferSource();
              sourceNode.buffer = audioBuffer;
              sourceNode.connect(audioContextRef.current.destination);
              
              const currentTime = audioContextRef.current.currentTime;
              if (nextPlayTimeRef.current < currentTime) {
                  nextPlayTimeRef.current = currentTime;
              }
              sourceNode.start(nextPlayTimeRef.current);
              nextPlayTimeRef.current += audioBuffer.duration;
            }
          }

          if (message.text) {
            setTranscript(prev => prev + ' ' + message.text);
          }

          if (message.interrupted) {
            console.log("Interruption signal received from engine");
            // Interruption handling (can expand as needed)
          }
        } catch (e) {
          console.error("Error processing text/voice frame:", e);
        }
      };

      ws.onclose = () => {
        console.log("Live Voice channel closed");
        stopLive();
      };

      ws.onerror = (err) => {
        console.error("Live Voice channel error:", err);
        stopLive();
      };

      processor.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16 PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        try {
          wsRef.current.send(JSON.stringify({ audio: base64Data }));
        } catch (err) {
          console.error("Failed to stream packet:", err);
        }
      };

    } catch (error: any) {
      console.error("Failed to start live session:", error);
      if (error?.name === 'NotAllowedError' || error?.message?.includes('Permission denied')) {
        setLiveError('Permiso de micrófono denegado. Por favor, revisa la configuración de tu navegador.');
      } else {
        setLiveError('Error al iniciar la sesión de voz en vivo.');
      }
      stopLive();
    }
  }, [stopLive]);

  return {
    isActive,
    transcript,
    liveError,
    startLive,
    stopLive
  };
}
