"use client";

import { create } from "zustand";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUser, type UserDoc } from "@/lib/firestore";

interface AuthState {
  user: User | null;
  profile: UserDoc | null;
  loading: boolean;
  initialized: boolean;
  setProfile: (profile: UserDoc | null) => void;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  setProfile: (profile) => set({ profile }),
  refreshProfile: async () => {
    const { user } = get();
    if (user) {
      const profile = await getUser(user.uid);
      set({ profile });
    }
  },
}));

if (typeof window !== "undefined") {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const profile = await getUser(user.uid);
      useAuthStore.setState({
        user,
        profile,
        loading: false,
        initialized: true,
      });
    } else {
      useAuthStore.setState({
        user: null,
        profile: null,
        loading: false,
        initialized: true,
      });
    }
  });
}
