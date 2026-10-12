import React from 'react';
import { cn } from '../lib/cn';
import { getPathForView } from '../lib/routes';
import { AppView } from '../types';

interface TermsLimitationsNoteProps {
  className?: string;
  inset?: boolean;
}

export const TermsLimitationsNote: React.FC<TermsLimitationsNoteProps> = ({
  className,
  inset = false,
}) => (
  <p
    className={cn(
      'text-xs leading-5 text-slate-500',
      inset && 'border-b border-slate-100 bg-white px-5 py-3 sm:px-6',
      className,
    )}
  >
    Limitaciones y deslinde:{' '}
    <a
      href={getPathForView(AppView.TERMS)}
      className="font-semibold text-amber-800 underline underline-offset-2 hover:text-amber-950"
    >
      Términos y condiciones
    </a>
  </p>
);
