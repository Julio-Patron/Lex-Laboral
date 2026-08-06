import { AppView } from '../types';

export const VIEW_PATHS: Record<AppView, string> = {
  [AppView.HOME]: '/',
  [AppView.CALCULATOR]: '/calculadora-liquidacion',
  [AppView.SOCIAL_SECURITY]: '/calculadora-imss',
  [AppView.PENSION_CALCULATOR]: '/calculadora-pensiones',
  [AppView.CONSULTAS]: '/consultas',
  [AppView.TERMS]: '/terminos',
  [AppView.PRIVACY]: '/privacidad',
};

const PATH_VIEW_MAP = new Map<string, AppView>(
  Object.entries(VIEW_PATHS).map(([view, path]) => [path, view as AppView])
);

export const getPathForView = (view: AppView): string => VIEW_PATHS[view] || VIEW_PATHS[AppView.HOME];

const normalizePath = (pathname: string): string => {
  if (!pathname) return VIEW_PATHS[AppView.HOME];
  if (pathname === '/') return pathname;

  const normalized = pathname.replace(/\/+$/, '');
  return normalized || VIEW_PATHS[AppView.HOME];
};

export const getViewForPath = (pathname: string): AppView =>
  PATH_VIEW_MAP.get(normalizePath(pathname)) || AppView.HOME;

export const isIndexableView = (view: AppView): boolean => true;
