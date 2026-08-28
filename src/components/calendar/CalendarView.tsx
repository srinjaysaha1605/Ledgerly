import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Repeat, 
  Target 
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { arcadeAudio } from '../../utils/audio';

interface CalendarViewProps {
  onOpenQuickAdd: (type?: 'income' | 'expense') => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onOpenQuickAdd }) => {
  const { transactions, goals, formatCurrency } = useFinance();

  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 1)); // July 2026

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Navigation
  const prevMonth = () => {
    arcadeAudio.playClick();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    arcadeAudio.playClick();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Generate Days Grid for month
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const leadingPadding = Array.from({ length: firstDayIndex }, (_, i) => null);

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="comic-box bg-zinc-900 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-comic text-3xl text-yellow-400 flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-cyan-400" />
            FINANCIAL SCHEDULE & CALENDAR
          </h1>
          <p className="text-xs font-mono text-zinc-400">
            Track daily transactions, upcoming recurring bills, and goal deadline milestones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-950 border-2 border-black p-1 rounded font-comic text-lg">
            <button 
              onClick={prevMonth}
              className="p-1 hover:bg-zinc-800 text-yellow-400 rounded"
            >
              <ChevronLeft className="w-5 h-5 stroke-[3]" />
            </button>

            <span className="px-3 text-white uppercase min-w-[140px] text-center">
              {monthName} {year}
            </span>

            <button 
              onClick={nextMonth}
              className="p-1 hover:bg-zinc-800 text-yellow-400 rounded"
            >
              <ChevronRight className="w-5 h-5 stroke-[3]" />
            </button>
          </div>

          <button
            onClick={() => { arcadeAudio.playCoin(); onOpenQuickAdd(); }}
            className="comic-btn bg-yellow-400 text-black font-comic text-base px-3 py-1.5 font-bold flex items-center gap-1.5 uppercase"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> ADD ENTRY
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="comic-box bg-zinc-900 p-4">
        
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center font-pixel text-[10px] text-zinc-400 uppercase py-2 border-b-2 border-black mb-2">
          <span>SUN</span>
          <span>MON</span>
          <span>TUE</span>
          <span>WED</span>
          <span>THU</span>
          <span>FRI</span>
          <span>SAT</span>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1.5 min-h-[480px]">
          
          {/* Leading Padding Days */}
          {leadingPadding.map((_, idx) => (
            <div key={`pad-${idx}`} className="bg-zinc-950/30 border border-zinc-900 rounded p-1.5 opacity-30" />
          ))}

          {/* Actual Month Days */}
          {daysArray.map((day) => {
            const dateFormatted = `${monthStr}-${String(day).padStart(2, '0')}`;
            
            // Transactions on this date
            const dayTxs = transactions.filter(t => t.date === dateFormatted);
            const dayIncome = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
            const dayExpense = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

            // Goals deadline on this date
            const dayGoals = goals.filter(g => g.deadline === dateFormatted);

            const isToday = dateFormatted === new Date().toISOString().split('T')[0];

            return (
              <div 
                key={day}
                onClick={() => { arcadeAudio.playClick(); onOpenQuickAdd(); }}
                className={`border-2 border-black rounded p-1.5 bg-zinc-950 hover:border-yellow-400 transition-all flex flex-col justify-between cursor-pointer group min-h-[90px] ${
                  isToday ? 'ring-2 ring-yellow-400 bg-zinc-900' : ''
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className={`font-pixel text-xs font-bold ${
                    isToday ? 'text-yellow-400' : 'text-zinc-300'
                  }`}>
                    {day}
                  </span>

                  {dayTxs.length > 0 && (
                    <span className="font-mono text-[9px] bg-zinc-800 text-zinc-400 px-1 rounded">
                      {dayTxs.length} TX
                    </span>
                  )}
                </div>

                {/* Day Summary Highlights */}
                <div className="space-y-1 my-1 font-mono text-[10px]">
                  {dayIncome > 0 && (
                    <div className="bg-green-950/80 text-green-400 border border-green-800/80 px-1 rounded truncate">
                      +{formatCurrency(dayIncome)}
                    </div>
                  )}

                  {dayExpense > 0 && (
                    <div className="bg-red-950/80 text-red-400 border border-red-800/80 px-1 rounded truncate">
                      -{formatCurrency(dayExpense)}
                    </div>
                  )}

                  {dayGoals.map(g => (
                    <div key={g.id} className="bg-yellow-950 text-yellow-300 border border-yellow-700 px-1 rounded truncate font-comic text-xs">
                      🎯 {g.name}
                    </div>
                  ))}
                </div>

                <div className="opacity-0 group-hover:opacity-100 text-[9px] font-pixel text-yellow-400 text-right">
                  + ADD
                </div>
              </div>
            );
          })}

        </div>

      </div>

    </div>
  );
};
