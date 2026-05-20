import { Mic, MicOff, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface HugoOrbProps {
  state: 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING';
  className?: string;
  onClick?: () => void;
}

export default function HugoOrb({ state, className, onClick }: HugoOrbProps) {
  const variants: any = {
    IDLE: {
      scale: [1, 1.05, 1],
      opacity: [0.6, 0.8, 0.6],
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
    },
    LISTENING: {
      scale: [1, 1.15, 1],
      boxShadow: [
        "0 0 20px rgba(0, 242, 255, 0.4)",
        "0 0 60px rgba(0, 242, 255, 0.9)",
        "0 0 20px rgba(0, 242, 255, 0.4)"
      ],
      transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
    },
    THINKING: {
      rotate: 360,
      scale: [1, 0.9, 1],
      transition: { duration: 2, repeat: Infinity, ease: "linear" }
    },
    SPEAKING: {
      scale: [1, 1.2, 0.9, 1.3, 1],
      boxShadow: [
        "0 0 20px rgba(0, 242, 255, 0.4)",
        "0 0 80px rgba(0, 242, 255, 1)",
        "0 0 20px rgba(0, 242, 255, 0.4)"
      ],
      transition: { duration: 0.4, repeat: Infinity, ease: "easeInOut" }
    }
  };

  return (
    <motion.div
      className={cn("relative cursor-pointer group flex items-center justify-center", className)}
      onClick={onClick}
      animate={state}
      variants={variants}
    >
      {/* Glassy Transparent Orb Base */}
      <div className="absolute inset-0 rounded-full bg-white/5 backdrop-blur-md border border-white/20 shadow-[0_0_30px_rgba(0,242,255,0.1)] transition-all duration-500 group-hover:bg-white/10 group-hover:border-white/30" />
      
      {/* Microphone Icon */}
      <div className="relative z-10 text-white/80 group-hover:text-white transition-colors">
        {state === 'LISTENING' ? (
          <Mic className="w-1/3 h-1/3 text-quantum-cyan drop-shadow-[0_0_8px_rgba(0,242,255,0.8)]" />
        ) : state === 'THINKING' ? (
          <BrainCircuit className="w-1/3 h-1/3 animate-pulse text-quantum-cyan" />
        ) : (
          <MicOff className="w-1/3 h-1/3 opacity-50" />
        )}
      </div>

      {/* Quantum Rings */}
      <motion.div
        className="absolute inset-0 rounded-full border border-quantum-cyan opacity-20"
        animate={{ rotate: 360, scale: [1, 1.05, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />
      
      <AnimatePresence>
        {(state === 'SPEAKING' || state === 'LISTENING') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.3 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="absolute inset-0 rounded-full border-2 border-quantum-cyan/30"
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="absolute inset-0 rounded-full border-2 border-quantum-cyan opacity-20"
        animate={{ scale: [1, 1.4], opacity: [0.2, 0] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      />
    </motion.div>
  );
}
