import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ShellState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
  /** Мобильное off-canvas меню (drawer). Не персистится — всегда закрыто при загрузке. */
  mobileOpen: boolean
  setMobileOpen: (v: boolean) => void
  toggleMobile: () => void
}

export const useShellStore = create<ShellState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      mobileOpen: false,
      setMobileOpen: (v) => set({ mobileOpen: v }),
      toggleMobile: () => set((s) => ({ mobileOpen: !s.mobileOpen })),
    }),
    {
      name: 'skilleng.shell',
      // в localStorage держим только состояние десктоп-сайдбара
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }),
    },
  ),
)
