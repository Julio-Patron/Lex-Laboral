import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

export const WorkspacePage: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn('min-h-full w-full overflow-visible bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.12),_transparent_30%),linear-gradient(180deg,_#fffefa_0%,_#f8fafc_44%,_#eef3f8_100%)]', className)}>
    <div className="mx-auto w-full max-w-[1180px] px-4 py-5 sm:px-6 md:px-8 md:py-9 xl:px-10">{children}</div>
  </div>
);

export const WorkspaceHeader: React.FC<{
  eyebrow?: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ eyebrow, title, description, icon, actions }) => (
  <motion.header
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: 'easeOut' }}
    className="mb-6 flex min-w-0 flex-col gap-5 md:mb-8 lg:flex-row lg:items-end lg:justify-between"
  >
    <div className="min-w-0 max-w-3xl">
      {eyebrow ? <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{eyebrow}</p> : null}
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        <div className="ui-icon-chip mt-1 shrink-0">{icon}</div>
        <div className="min-w-0">
          <h1 className="text-balance break-words font-serif text-3xl font-bold text-slate-950 sm:text-4xl lg:text-[2.65rem]">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 md:text-[15px]">{description}</p>
        </div>
      </div>
    </div>
    {actions ? <div className="flex w-full min-w-0 flex-wrap items-center gap-3 lg:w-auto">{actions}</div> : null}
  </motion.header>
);

export const WorkspacePanel: React.FC<{ children: React.ReactNode; className?: string; muted?: boolean }> = ({
  children,
  className,
  muted = false,
}) => (
  <motion.section
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.32, ease: 'easeOut' }}
    className={cn('min-w-0 max-w-full', muted ? 'ui-panel-muted' : 'ui-panel', className)}
  >
    {children}
  </motion.section>
);

export const WorkspaceEmpty: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}> = ({ icon, title, description, className }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.985 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.32, ease: 'easeOut' }}
    className={cn('ui-empty-state', className)}
  >
    <div className="ui-empty-icon">{icon}</div>
    <h3 className="text-lg font-serif font-bold text-slate-900 sm:text-xl">{title}</h3>
    <p className="max-w-sm text-sm leading-6 text-slate-600">{description}</p>
  </motion.div>
);

export const WorkspaceStat: React.FC<{
  label: string;
  value: string;
  emphasis?: 'default' | 'accent' | 'inverse';
}> = ({ label, value, emphasis = 'default' }) => (
  <div
    className={cn(
      'min-w-0 rounded-lg border p-4 text-center sm:p-5',
      emphasis === 'inverse'
        ? 'border-slate-900 bg-slate-950 text-white shadow-[0_18px_45px_-34px_rgba(15,23,42,0.85)]'
        : 'border-slate-200/80 bg-white/90 backdrop-blur-sm',
    )}
  >
    <span className={cn('text-[11px] font-bold uppercase tracking-[0.16em]', emphasis === 'inverse' ? 'text-white/55' : 'text-slate-500')}>
      {label}
    </span>
    <p className={cn('mt-2 break-words font-sans text-xl font-extrabold tabular-nums sm:text-2xl', emphasis === 'accent' ? 'text-legal-gold' : emphasis === 'inverse' ? 'text-white' : 'text-slate-950')}>
      {value}
    </p>
  </div>
);
