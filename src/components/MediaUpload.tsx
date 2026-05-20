import { useDropzone } from 'react-dropzone';
import { Image as ImageIcon, Video, Upload, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface MediaUploadProps {
  onUpload: (file: File) => void;
}

export default function MediaUpload({ onUpload }: MediaUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': [],
      'video/*': []
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        setFileType(file.type.startsWith('image') ? 'image' : 'video');
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
        onUpload(file);
      }
    }
  });

  return (
    <div className="mt-4">
      <AnimatePresence mode="wait">
        {!preview ? (
          <div
            key="dropzone"
            {...getRootProps()}
            className={`border-2 border-dashed rounded-quantum p-6 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-quantum-cyan bg-quantum-cyan/5' : 'border-white/10 hover:border-white/20'
            }`}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <input {...getInputProps()} />
              <div className="flex justify-center gap-4 mb-2">
                <ImageIcon className="text-white/40" size={24} />
                <Video className="text-white/40" size={24} />
              </div>
              <p className="text-xs text-white/50">
                {isDragActive ? 'Solte para analisar' : 'Arraste fotos ou vídeos para análise do Hugo'}
              </p>
            </motion.div>
          </div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative rounded-quantum overflow-hidden border border-quantum-cyan/30 aspect-video bg-black"
          >
            {fileType === 'image' ? (
              <img src={preview} alt="Preview" className="w-full h-full object-contain" />
            ) : (
              <video src={preview} className="w-full h-full object-contain" controls />
            )}
            <button
              onClick={() => setPreview(null)}
              className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black"
            >
              <X size={16} />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <div className="flex items-center gap-2">
                <Upload size={14} className="text-quantum-cyan" />
                <span className="text-[10px] font-bold text-quantum-cyan uppercase tracking-widest italic">Analisando com Gemini Pro...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
