"use client";

import { create } from "zustand";
import {
  subscribeToFamilyStatus,
  getFamily,
  type FamilyDoc,
  type LatestStatusDoc,
} from "@/lib/firestore";
import type { Unsubscribe } from "firebase/firestore";

interface FamilyData {
  family: FamilyDoc;
  statuses: Record<string, LatestStatusDoc>;
}

interface FamilyState {
  /** All loaded families keyed by familyId */
  families: Record<string, FamilyData>;
  /** Currently selected family for viewing on the family tab */
  activeFamilyId: string | null;
  /** All family IDs the user belongs to */
  familyIds: string[];
  loading: boolean;
  unsubscribes: Record<string, Unsubscribe>;

  // Computed helpers
  activeFamily: () => FamilyData | null;

  // Actions
  loadFamilies: (familyIds: string[]) => Promise<void>;
  setActiveFamilyId: (id: string) => void;
  clear: () => void;
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  families: {},
  activeFamilyId: null,
  familyIds: [],
  loading: false,
  unsubscribes: {},

  activeFamily: () => {
    const { families, activeFamilyId } = get();
    return activeFamilyId ? families[activeFamilyId] || null : null;
  },

  loadFamilies: async (familyIds: string[]) => {
    // Clean up previous subscriptions
    const prevUnsubs = get().unsubscribes;
    Object.values(prevUnsubs).forEach((unsub) => unsub());

    if (familyIds.length === 0) {
      set({ families: {}, familyIds: [], activeFamilyId: null, unsubscribes: {}, loading: false });
      return;
    }

    set({ loading: true, familyIds });

    const newUnsubs: Record<string, Unsubscribe> = {};
    const newFamilies: Record<string, FamilyData> = {};

    await Promise.all(
      familyIds.map(async (fid) => {
        const family = await getFamily(fid);
        if (!family) return;

        newFamilies[fid] = { family, statuses: {} };

        const unsub = subscribeToFamilyStatus(fid, (statuses) => {
          set((state) => ({
            families: {
              ...state.families,
              [fid]: { ...state.families[fid], statuses },
            },
          }));
        });
        newUnsubs[fid] = unsub;
      })
    );

    const prevActive = get().activeFamilyId;
    const activeFamilyId =
      prevActive && familyIds.includes(prevActive) ? prevActive : familyIds[0];

    set({
      families: newFamilies,
      unsubscribes: newUnsubs,
      activeFamilyId,
      loading: false,
    });
  },

  setActiveFamilyId: (id: string) => set({ activeFamilyId: id }),

  clear: () => {
    const unsubs = get().unsubscribes;
    Object.values(unsubs).forEach((unsub) => unsub());
    set({
      families: {},
      activeFamilyId: null,
      familyIds: [],
      unsubscribes: {},
    });
  },
}));
