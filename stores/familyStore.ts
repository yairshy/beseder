"use client";

import { create } from "zustand";
import {
  subscribeToFamilyStatus,
  getFamily,
  type FamilyDoc,
  type LatestStatusDoc,
} from "@/lib/firestore";
import type { Unsubscribe } from "firebase/firestore";

interface FamilyState {
  family: FamilyDoc | null;
  familyId: string | null;
  statuses: Record<string, LatestStatusDoc>;
  loading: boolean;
  unsubscribe: Unsubscribe | null;
  loadFamily: (familyId: string) => Promise<void>;
  clear: () => void;
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  family: null,
  familyId: null,
  statuses: {},
  loading: false,
  unsubscribe: null,

  loadFamily: async (familyId: string) => {
    const prev = get().unsubscribe;
    if (prev) prev();

    set({ loading: true, familyId });

    const family = await getFamily(familyId);
    const unsub = subscribeToFamilyStatus(familyId, (statuses) => {
      set({ statuses });
    });

    set({ family, unsubscribe: unsub, loading: false });
  },

  clear: () => {
    const prev = get().unsubscribe;
    if (prev) prev();
    set({
      family: null,
      familyId: null,
      statuses: {},
      unsubscribe: null,
    });
  },
}));
