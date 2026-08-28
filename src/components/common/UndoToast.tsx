import React from 'react';
import { RotateCcw, AlertTriangle, X } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export const UndoToast: React.FC = () => {
  const { undoStack, undoLastDelete, dismissUndoAction, formatCurrency } = useFinance();

  if (undoStack.length === 0) return null;

  const latestAction = undoStack[0];
  const tx = latestAction.transaction;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="comic-box bg-red-950 text-white border-3 border-black p-3.5 shadow-[6px_6px_0px_#000000] flex items-center gap-3.5 max-w-sm">
        <div className="w-8 h-8 bg-red-500 border-2 border-black flex items-center justify-center text-black shrink-0 font-pixel">
          <AlertTriangle className="w-5 h-5 text-black stroke-[2.5]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-comic text-sm text-yellow-400 truncate">
            TRANSACTION DELETED!
          </div>
          <div className="text-xs text-zinc-300 truncate font-mono">
            {tx.title} ({formatCurrency(tx.amount)})
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={undoLastDelete}
            className="comic-btn bg-yellow-400 text-black font-comic text-xs px-2.5 py-1.5 font-bold flex items-center gap-1 hover:bg-yellow-300 uppercase"
          >
            <RotateCcw className="w-3.5 h-3.5 stroke-[3]" />
            UNDO
          </button>

          <button
            onClick={() => dismissUndoAction(latestAction.id)}
            className="p-1.5 hover:bg-red-900 text-zinc-300 hover:text-white rounded transition-colors border border-red-700/60 bg-red-900/40"
            title="Dismiss popup"
            aria-label="Dismiss popup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
