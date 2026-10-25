import { useCallback, useState, type ReactNode } from 'react';
import { seedPrototype } from './model';
import { Context, type PrototypeContext } from './context';

export function PrototypeProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(() => seedPrototype());
  const [message, setMessage] = useState('');
  const update: PrototypeContext['update'] = useCallback(change => setData(previous => {
    const next = change(previous);
    if (next.profile !== previous.profile) return { ...next, team: next.team.map(member => member.id === 'owner' ? { ...member, name: next.profile.name, email: next.profile.email } : member) };
    return next;
  }), []);
  return <Context.Provider value={{ data, update, reset: empty => { setData(previous => ({ ...seedPrototype(empty), design: previous.design })); setMessage('Skenario demo dimuat ulang.'); }, message, notify: setMessage }}>{children}</Context.Provider>;
}
