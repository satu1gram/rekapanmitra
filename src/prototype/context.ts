import { createContext, useContext } from 'react';
import type { PrototypeData } from './model';

export interface PrototypeContext {
  data: PrototypeData;
  update: (change: (data: PrototypeData) => PrototypeData) => void;
  reset: (empty?: boolean) => void;
  message: string;
  notify: (message: string) => void;
}
export const Context = createContext<PrototypeContext | null>(null);
export function usePrototype() {
  const context = useContext(Context);
  if (!context) throw new Error('PrototypeProvider is required.');
  return context;
}
