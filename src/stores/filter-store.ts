import { create } from "zustand";

interface FilterState {
  search: string;
  member: string | null;
  status: string | null;
  setSearch: (search: string) => void;
  setMember: (member: string | null) => void;
  setStatus: (status: string | null) => void;
  clearAll: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  search: "",
  member: null,
  status: null,
  setSearch: (search) => set({ search }),
  setMember: (member) => set({ member }),
  setStatus: (status) => set({ status }),
  clearAll: () => set({ search: "", member: null, status: null }),
}));
