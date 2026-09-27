
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import React from 'react';
import { AppNotification } from '../types';

interface NotificationHubProps {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
}

export const NotificationHub: React.FC<NotificationHubProps> = ({ notifications, onDismiss }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="text-red-500" size={20} />;
      case 'success': return <CheckCircle2 className="text-emerald-500" size={20} />;
      case 'warning': return <AlertTriangle className="text-amber-500" size={20} />;
      default: return <Info className="text-blue-500" size={20} />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'error': return 'border-red-100 bg-red-50';
      case 'success': return 'border-emerald-100 bg-emerald-50';
      case 'warning': return 'border-amber-100 bg-amber-50';
      default: return 'border-blue-100 bg-blue-50';
    }
  };

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 right-4 z-[100] flex max-w-[calc(100vw-2rem)] flex-col items-end space-y-3 sm:left-auto sm:w-full sm:max-w-sm">
      {notifications.map((n) => (
        <div 
          key={n.id}
          className={`pointer-events-auto flex w-full items-start rounded-lg border-l-4 p-4 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300 ${getBgColor(n.type)}`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getIcon(n.type)}
          </div>
          <div className="ml-3 flex-1">
            {n.title && <p className="text-sm font-bold text-slate-900 mb-0.5">{n.title}</p>}
            <p className="break-words text-sm leading-relaxed text-slate-700">{n.message}</p>
          </div>
          <button 
            type="button"
            onClick={() => onDismiss(n.id)}
            aria-label="Cerrar notificación"
            className="ml-4 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
