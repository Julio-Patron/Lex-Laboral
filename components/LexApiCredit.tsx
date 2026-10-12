import { ExternalLink } from 'lucide-react';
import React from 'react';

export const LEX_API_MX_URL = 'https://lexapi.mx';

interface LexApiCreditProps {
  tone?: 'light' | 'dark';
  className?: string;
}

export const LexApiCredit: React.FC<LexApiCreditProps> = ({ tone = 'light', className = '' }) => {
  const isDark = tone === 'dark';
  return (
    <p className={`text-xs leading-5 ${isDark ? 'text-slate-400' : 'text-slate-500'} ${className}`}>
      Artículos y vigencia del fundamentador vía{' '}
      <a
        href={LEX_API_MX_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline ${
          isDark
            ? 'text-amber-400 hover:text-amber-300'
            : 'text-slate-900 decoration-legal-gold/70 hover:text-slate-700'
        }`}
      >
        Lex API MX
        <ExternalLink size={11} aria-hidden="true" />
      </a>
    </p>
  );
};
