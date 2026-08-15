import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LoginResponse, AuthMeResponse } from '@/types/api';

interface AuthState {
  user: LoginResponse | null;
  currentUser: AuthMeResponse | null;
  permissions: string[];
  branchIds: number[];
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (authData: LoginResponse) => void;
  setCurrentUser: (currentUser: AuthMeResponse) => void;
  setPermissions: (permissions: string[]) => void;
  setBranchIds: (branchIds: number[]) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  initialize: () => void;
  getOrganizationId: () => number;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      currentUser: null,
      permissions: [],
      branchIds: [],
      isAuthenticated: false,
      isLoading: true,
      
      setAuth: (authData) => set({ 
        user: authData, 
        isAuthenticated: true,
        isLoading: false 
      }),
      
      setCurrentUser: (currentUser) => set({ currentUser }),
      
      setPermissions: (permissions) => set({ permissions }),
      
      setBranchIds: (branchIds) => set({ branchIds }),
      
      logout: () => {
        // Clear localStorage tokens
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('permissions');
          localStorage.removeItem('organizationId');
          // Expire the middleware session cookie
          document.cookie = 'isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        }
        set({
          user: null,
          currentUser: null,
          permissions: [],
          branchIds: [],
          isAuthenticated: false,
          isLoading: false,
        });
      },
      
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

      getOrganizationId: () => {
        return useAuthStore.getState().user?.organizationId || 1;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        currentUser: state.currentUser,
        permissions: state.permissions,
        branchIds: state.branchIds,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);