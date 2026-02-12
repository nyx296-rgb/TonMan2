
import React from 'react';

export const COLORS = {
  PRETO: '#1a1a1a',
  CIANO: '#06b6d4',
  MAGENTA: '#ec4899',
  AMARELO: '#eab308',
  PRIMARY: '#6366f1',
  DANGER: '#ef4444',
  SUCCESS: '#22c55e',
  WARNING: '#f59e0b',
};

export const getColorHex = (colorName: string): string => {
  const c = colorName.toLowerCase();
  if (c.includes('preto')) return COLORS.PRETO;
  if (c.includes('ciano')) return COLORS.CIANO;
  if (c.includes('magenta')) return COLORS.MAGENTA;
  if (c.includes('amarelo')) return COLORS.AMARELO;
  return COLORS.PRIMARY;
};

export const ROLES_CONFIG = {
  admin: { label: 'Administrador', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
  support: { label: 'Suporte', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
  editor: { label: 'Editor', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
  viewer: { label: 'Visualizador', color: 'bg-gray-500/20 text-gray-400 border-gray-500/50' },
};
