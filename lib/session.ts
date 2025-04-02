import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SessionState {
  isAuthenticated: boolean;
  sessionId: string | null;
  lastActive: number | null;
  setAuthenticated: (value: boolean) => void;
  setSessionId: (id: string | null) => void;
  updateLastActive: () => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      sessionId: null,
      lastActive: null,
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setSessionId: (id) => set({ sessionId: id }),
      updateLastActive: () => set({ lastActive: Date.now() }),
      clearSession: () => set({ 
        isAuthenticated: false, 
        sessionId: null, 
        lastActive: null 
      }),
    }),
    {
      name: 'whatsapp-session',
    }
  )
);