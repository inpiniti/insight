import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Account {
  id: string;
  name?: string;
  appkey: string;
  appsecret: string;
  accountNo: string;
  accountCode: string;
  token: string | null;
  tokenExpiresAt: number | null;
}

interface AccountState {
  accounts: Account[];
  selectedId: string | null;
  addAccount: (input: Omit<Account, "id" | "token" | "tokenExpiresAt">) => string;
  removeAccount: (id: string) => void;
  selectAccount: (id: string) => void;
  updateToken: (id: string, token: string, expiresAt: number) => void;
  getSelected: () => Account | null;
  isTokenExpired: (account: Account) => boolean;
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      accounts: [],
      selectedId: null,

      addAccount: (input) => {
        const id = crypto.randomUUID();
        const account: Account = {
          id,
          ...input,
          token: null,
          tokenExpiresAt: null,
        };
        set((s) => ({ accounts: [...s.accounts, account] }));
        return id;
      },

      removeAccount: (id) =>
        set((s) => ({
          accounts: s.accounts.filter((a) => a.id !== id),
          selectedId: s.selectedId === id ? null : s.selectedId,
        })),

      selectAccount: (id) => set({ selectedId: id }),

      updateToken: (id, token, expiresAt) =>
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === id ? { ...a, token, tokenExpiresAt: expiresAt } : a
          ),
        })),

      getSelected: () => {
        const s = get();
        return s.accounts.find((a) => a.id === s.selectedId) ?? null;
      },

      isTokenExpired: (account) => {
        if (!account.token || !account.tokenExpiresAt) return true;
        return Date.now() > account.tokenExpiresAt - 5 * 60 * 1000;
      },
    }),
    {
      name: "account-store",
      version: 1,
    }
  )
);

export function parseAccountNo(raw: string): { accountNo: string; accountCode: string } {
  const [no, code = "01"] = raw.split("-");
  return { accountNo: no.trim(), accountCode: code.trim() };
}
