import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Gamepad2, 
  Coins, 
  Zap, 
  Trophy, 
  Gem, 
  Key, 
  Flame, 
  RefreshCw, 
  Lock, 
  Unlock 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { arcadeAudio } from '../../utils/audio';

interface RetroCaptchaProps {
  onVerify: (verified: boolean) => void;
  isVerified: boolean;
  className?: string;
}

interface ArcadeToken {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  bgGlow: string;
}

const ARCADE_TOKENS: ArcadeToken[] = [
  { id: 'coin', name: 'GOLD COIN', icon: Coins, color: '#F9ED69', bgGlow: 'rgba(249, 237, 105, 0.25)' },
  { id: 'pad', name: 'ARCADE PAD', icon: Gamepad2, color: '#00D2FF', bgGlow: 'rgba(0, 210, 255, 0.25)' },
  { id: 'bolt', name: 'POWER BOLT', icon: Zap, color: '#FF9F1C', bgGlow: 'rgba(255, 159, 28, 0.25)' },
  { id: 'trophy', name: 'TROPHY CUP', icon: Trophy, color: '#FFE600', bgGlow: 'rgba(255, 230, 0, 0.25)' },
  { id: 'gem', name: 'RUBY GEM', icon: Gem, color: '#E94560', bgGlow: 'rgba(233, 69, 96, 0.25)' },
  { id: 'key', name: 'CYBER KEY', icon: Key, color: '#00E676', bgGlow: 'rgba(0, 230, 118, 0.25)' },
  { id: 'flame', name: 'RETRO FLAME', icon: Flame, color: '#FF3860', bgGlow: 'rgba(255, 56, 96, 0.25)' },
];

export const RetroCaptcha: React.FC<RetroCaptchaProps> = ({ 
  onVerify, 
  isVerified,
  className = '' 
}) => {
  const [currentTarget, setCurrentTarget] = useState<ArcadeToken>(ARCADE_TOKENS[0]);
  const [options, setOptions] = useState<ArcadeToken[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  // Initialize or re-roll challenge
  const rollChallenge = () => {
    // Pick 1 target
    const targetIdx = Math.floor(Math.random() * ARCADE_TOKENS.length);
    const target = ARCADE_TOKENS[targetIdx];
    setCurrentTarget(target);

    // Pick 3 other random distinct distractors
    const otherTokens = ARCADE_TOKENS.filter((t) => t.id !== target.id);
    const shuffledOthers = [...otherTokens].sort(() => 0.5 - Math.random()).slice(0, 3);
    const roundOptions = [target, ...shuffledOthers].sort(() => 0.5 - Math.random());

    setOptions(roundOptions);
    setFeedback(null);
  };

  useEffect(() => {
    if (!isVerified) {
      rollChallenge();
    }
  }, [isVerified]);

  const handleSelect = (token: ArcadeToken) => {
    if (isVerified) return;

    if (token.id === currentTarget.id) {
      // Success!
      arcadeAudio.playLevelUp?.();
      try {
        confetti({
          particleCount: 28,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#F9ED69', '#00D2FF', '#00E676', '#E94560']
        });
      } catch {
        // Safe fallback
      }
      setFeedback('ACCESS GRANTED! HUMAN VERIFIED');
      onVerify(true);
    } else {
      // Failure
      arcadeAudio.playAlert?.();
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setFeedback(`Incorrect token! Required: ${currentTarget.name}`);
      // Re-roll target after short delay to prevent brute-forcing
      setTimeout(() => {
        rollChallenge();
      }, 700);
    }
  };

  const handleManualReset = () => {
    arcadeAudio.playClick?.();
    onVerify(false);
    rollChallenge();
  };

  const TargetIcon = currentTarget.icon;

  if (isVerified) {
    return (
      <div className={`p-3 bg-[#00E676]/10 border-3 border-[#00E676] rounded text-white shadow-[3px_3px_0px_#000] flex items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded bg-[#00E676] border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000]">
            <ShieldCheck className="w-5 h-5 text-black stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-pixel text-[#00E676] flex items-center gap-1.5 uppercase tracking-wide truncate">
              <Unlock className="w-3.5 h-3.5 inline shrink-0" />
              <span>HUMAN VERIFIED</span>
            </div>
            <p className="text-[10px] font-mono text-zinc-300 truncate">
              Security clearance granted. Forms unlocked!
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleManualReset}
          title="Reset verification"
          className="text-[10px] font-pixel text-zinc-400 hover:text-white px-2 py-1 bg-black/40 hover:bg-black/60 rounded border border-white/20 shrink-0 transition-colors"
        >
          RESET
        </button>
      </div>
    );
  }

  return (
    <div className={`comic-box bg-[#111726] border-3 border-black p-3 rounded shadow-[4px_4px_0px_#000] relative overflow-hidden transition-all ${shake ? 'ring-2 ring-[#E94560] translate-x-1' : ''} ${className}`}>
      
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b-2 border-white/10 pb-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF9F1C] animate-pulse" />
          <span className="text-[10px] sm:text-[11px] font-pixel text-[#F9ED69] uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#F9ED69]" />
            HUMAN VERIFICATION GATE
          </span>
        </div>

        <button
          type="button"
          onClick={() => { arcadeAudio.playClick?.(); rollChallenge(); }}
          title="Roll a new challenge"
          className="text-zinc-400 hover:text-white p-1 rounded transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Directive / Instructions */}
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 bg-black/50 p-2 border border-white/10 rounded">
        <div className="text-[11px] font-mono text-zinc-300">
          Directive: Select the{' '}
          <span 
            className="font-bold underline decoration-2 underline-offset-2 px-1 py-0.5 rounded"
            style={{ color: currentTarget.color, backgroundColor: currentTarget.bgGlow }}
          >
            {currentTarget.name}
          </span>
        </div>

        <div 
          className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-black text-black font-pixel text-[9px] shadow-[2px_2px_0px_#000]"
          style={{ backgroundColor: currentTarget.color }}
        >
          <TargetIcon className="w-3.5 h-3.5" />
          <span>TARGET</span>
        </div>
      </div>

      {/* Interactive Token Grid */}
      <div className="grid grid-cols-4 gap-2">
        {options.map((tok) => {
          const IconComp = tok.icon;
          return (
            <button
              key={tok.id}
              type="button"
              onClick={() => handleSelect(tok)}
              className="comic-btn bg-[#1A1A2E] hover:bg-[#252542] active:scale-95 border-2 border-black rounded p-2 flex flex-col items-center justify-center gap-1 group transition-all shadow-[2px_2px_0px_#000]"
            >
              <div 
                className="w-7 h-7 rounded flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ backgroundColor: tok.bgGlow }}
              >
                <IconComp className="w-4 h-4" style={{ color: tok.color }} />
              </div>
              <span className="text-[9px] font-pixel text-zinc-300 group-hover:text-white truncate max-w-full">
                {tok.name.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Error / Alert feedback */}
      {feedback && (
        <div className="mt-2.5 text-[10px] font-mono text-[#E94560] flex items-center gap-1.5 bg-[#E94560]/10 border border-[#E94560]/30 px-2 py-1 rounded">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}
    </div>
  );
};
