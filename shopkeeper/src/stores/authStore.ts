import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '../types';

const STORAGE_KEY_CURRENT_USER = '@localmart_shopkeeper_current_user';

interface AuthState {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
  setUser: (user: User | null) => void;
  setRole: (role: UserRole) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,

  initialize: async () => {
    try {
      const storedUser = await AsyncStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        set({
          user: parsedUser,
          role: parsedUser.role || null,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }
    } catch (e) {
      console.log('Error initializing auth store:', e);
    }
    set({ isLoading: false });
  },

  setUser: (user) => {
    set({ user, isAuthenticated: !!user, role: user?.role || null });
    if (user) {
      AsyncStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user)).catch(() => {});
    } else {
      AsyncStorage.removeItem(STORAGE_KEY_CURRENT_USER).catch(() => {});
    }
  },

  setRole: (role) => set({ role }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => {
    set({ user: null, role: null, isAuthenticated: false });
    AsyncStorage.removeItem(STORAGE_KEY_CURRENT_USER).catch(() => {});
  },
}));

