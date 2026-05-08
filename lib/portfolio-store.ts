import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PortfolioState {
  count: number;
  cashRatio: number;
  sortKey: "person_count" | "sum_ratio";
  weightBasis: "sum_ratio" | "person_count";
  setCount: (count: number) => void;
  setCashRatio: (cashRatio: number) => void;
  setSortKey: (sortKey: "person_count" | "sum_ratio") => void;
  setWeightBasis: (weightBasis: "sum_ratio" | "person_count") => void;
  reset: () => void;
}

const INITIAL_STATE = {
  count: 10,
  cashRatio: 0,
  sortKey: "person_count" as const,
  weightBasis: "sum_ratio" as const,
};

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,
      setCount: (count) => set({ count }),
      setCashRatio: (cashRatio) => set({ cashRatio }),
      setSortKey: (sortKey) => set({ sortKey }),
      setWeightBasis: (weightBasis) => set({ weightBasis }),
      reset: () => set(INITIAL_STATE),
    }),
    {
      name: "portfolio-store",
    }
  )
);
