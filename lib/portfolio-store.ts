import { create } from "zustand";

interface PortfolioState {
  count: number;
  sortKey: "person_count" | "sum_ratio";
  weightBasis: "sum_ratio" | "person_count";
  setCount: (count: number) => void;
  setSortKey: (sortKey: "person_count" | "sum_ratio") => void;
  setWeightBasis: (weightBasis: "sum_ratio" | "person_count") => void;
  reset: () => void;
}

const INITIAL_STATE = {
  count: 10,
  sortKey: "person_count" as const,
  weightBasis: "sum_ratio" as const,
};

export const usePortfolioStore = create<PortfolioState>((set) => ({
  ...INITIAL_STATE,
  setCount: (count) => set({ count }),
  setSortKey: (sortKey) => set({ sortKey }),
  setWeightBasis: (weightBasis) => set({ weightBasis }),
  reset: () => set(INITIAL_STATE),
}));
