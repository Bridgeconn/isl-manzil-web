import { create } from "zustand";

interface ModalStore {
  isModalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

const useModalStore = create<ModalStore>((set) => ({
  isModalOpen: false,
  setModalOpen: (open) => set({ isModalOpen: open }),
}));

export default useModalStore;
