import React from 'react';
import { AppView } from '../types';
import { Home, Calculator, ShieldCheck, Scale, BookOpen } from 'lucide-react';

interface MobileBottomNavProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentView, onChangeView }) => {
  const navItems = [
    { id: AppView.HOME, label: 'Inicio', icon: <Home size={20} /> },
    { id: AppView.CALCULATOR, label: 'Liquidación', icon: <Calculator size={20} /> },
    { id: AppView.SOCIAL_SECURITY, label: 'IMSS', icon: <ShieldCheck size={20} /> },
    { id: AppView.CONSULTAS, label: 'Fundamento', icon: <BookOpen size={20} /> },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-slate-950 border-t border-slate-800/60 pb-[env(safe-area-inset-bottom)] pt-2 px-2 shadow-2xl">
      {navItems.map((item) => {
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`flex flex-col items-center justify-center w-full py-1 gap-1 transition-colors ${
              isActive ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-semibold">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
