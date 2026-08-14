import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LoginResponse } from '@/types/api';

interface AuthState {
  user: LoginResponse | null;
  permissions: string[];
  branchIds: number[];
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (authData: LoginResponse) => void;
  setPermissions: (permissions: string[]) => void;
  setBranchIds: (branchIds: number[]) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      permissions: [],
      branchIds: [],
      isAuthenticated: false,
      isLoading: true,
      
      setAuth: (authData) => set({ 
        user: authData, 
        isAuthenticated: true,
        isLoading: false 
      }),
      
      setPermissions: (permissions) => set({ permissions }),
      
      setBranchIds: (branchIds) => set({ branchIds }),
      
      logout: () => set({ 
        user: null, 
        permissions: [], 
        branchIds: [],
        isAuthenticated: false,
        isLoading: false 
      }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      initialize: () => {
        // Check if we have auth data in localStorage
        if (typeof window !== 'undefined') {
          const accessToken = localStorage.getItem('accessToken');
          const permissions = localStorage.getItem('permissions');
          
          if (accessToken) {
            set({ 
              isAuthenticated: true,
              permissions: permissions ? JSON.parse(permissions) : [],
              isLoading: false 
            });
          } else {
            set({ isLoading: false });
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        permissions: state.permissions,
        branchIds: state.branchIds,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);