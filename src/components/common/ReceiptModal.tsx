import React from 'react';
import { X, Image as ImageIcon, Download, ZoomIn } from 'lucide-react';
import { arcadeAudio } from '../../utils/audio';

interface ReceiptModalProps {
  receiptUrl: string | null;
  title: string;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receiptUrl, title, onClose }) => {
  if (!receiptUrl) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-zinc-900 border-4 border-black shadow-[8px_8px_0px_#000000] comic-box overflow-hidden">
        
        <div className="flex items-center justify-between p-3.5 bg-zinc-950 border-b-3 border-black">
          <div className="font-comic text-lg text-yellow-400 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-cyan-400" />
            RECEIPT PROOF: {title}
          </div>
          <button
            onClick={() => { arcadeAudio.playClick(); onClose(); }}
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-zinc-950/60 flex flex-col items-center justify-center min-h-[280px]">
          <img 
            src={receiptUrl} 
            alt={`Receipt for ${title}`} 
            className="max-h-[350px] w-auto object-contain border-2 border-black rounded shadow-[4px_4px_0px_#000]"
          />
        </div>

        <div className="p-3 bg-zinc-900 border-t-3 border-black flex items-center justify-between">
          <span className="text-xs text-zinc-400 font-mono flex items-center gap-1">
            <ZoomIn className="w-3.5 h-3.5 text-yellow-400" /> Verified Receipt Document
          </span>

          <a
            href={receiptUrl}
            download={`receipt_${title.toLowerCase().replace(/\s+/g, '_')}.png`}
            target="_blank"
            rel="noreferrer"
            className="comic-btn bg-cyan-400 text-black font-comic text-xs px-3 py-1 font-bold flex items-center gap-1.5 uppercase"
          >
            <Download className="w-3.5 h-3.5" /> DOWNLOAD
          </a>
        </div>

      </div>
    </div>
  );
};
