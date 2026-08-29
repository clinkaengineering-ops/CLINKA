import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "@/types";
import api from "@/lib/axios";

interface AuthState {
  user: User | null;
  /** True after the first GET /users/me bootstrap finishes. */
  sessionReady: boolean;
  setUser: (user: User | null) => void;
  setSessionReady: (ready: boolean) => void;
  logout: () => Promise<void>;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      sessionReady: false,
      setUser: (user) => set({ user, sessionReady: true }),
      setSessionReady: (sessionReady) => set({ sessionReady }),
      logout: async () => {
        await api.post("/auth/logout");
        set({ user: null, sessionReady: true });
      },
    }),
    {
      name: "clinka-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        sessionReady: state.sessionReady,
      }),
    },
  ),
);

export default useAuthStore;
