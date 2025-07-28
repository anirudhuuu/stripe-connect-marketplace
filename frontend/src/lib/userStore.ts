import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}

export interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set: (fn: (state: UserState) => UserState) => void): UserState => ({
      user: null,
      setUser: (user: User | null) => set((state) => ({ ...state, user })),
      logout: () => set((state) => ({ ...state, user: null })),
    }),
    {
      name: "user-storage",
    }
  )
);
