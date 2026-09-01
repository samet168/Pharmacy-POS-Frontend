import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LoginResponse, AuthMeResponse } from '@/types/api';

interface AuthState {
  user: LoginResponse | null;
  currentUser: AuthMeResponse | null;
  currentBranch: any | null;
  selectedBranchId: number | null;
  permissions: string[];
  branchIds: number[];
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (authData: LoginResponse) => void;
  setCurrentUser: (currentUser: AuthMeResponse) => void;
  setCurrentBranch: (branch: any) => void;
  setSelectedBranchId: (id: number | null) => void;
  setPermissions: (permissions: string[]) => void;
  setBranchIds: (branchIds: number[]) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  initialize: () => void;
  getOrganizationId: () => number;
  getSelectedBranchId: () => number;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      currentUser: null,
      currentBranch: null,
      selectedBranchId: null,
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
      
      setCurrentBranch: (branch) => {
        if (typeof window !== 'undefined' && branch) {
          localStorage.setItem('selectedBranchId', branch.id?.toString());
          localStorage.setItem('selectedBranchName', branch.name);
        }
        set({ currentBranch: branch, selectedBranchId: branch ? branch.id : null });
      },

      setSelectedBranchId: (id) => {
        if (typeof window !== 'undefined' && id) {
          localStorage.setItem('selectedBranchId', id.toString());
        }
        set({ selectedBranchId: id });
      },
      
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
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
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

      getOrganizationId: (): number => {
        if (typeof window !== 'undefined') {
          const storedOrgId = localStorage.getItem('organizationId');
          if (storedOrgId) return Number(storedOrgId);
        }
        return get().user?.organizationId || 1;
      },

      getSelectedBranchId: (): number => {
        if (typeof window !== 'undefined') {
          const storedBranchId = localStorage.getItem('selectedBranchId');
          if (storedBranchId) return Number(storedBranchId);
        }
        return get().selectedBranchId || get().currentBranch?.id || 1;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        currentUser: state.currentUser,
        currentBranch: state.currentBranch,
        selectedBranchId: state.selectedBranchId,
        permissions: state.permissions,
        branchIds: state.branchIds,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);