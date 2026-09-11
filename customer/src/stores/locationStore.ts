import { create } from 'zustand';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  permissionGranted: boolean;
  
  setLocation: (lat: number, lng: number, address?: string) => void;
  setPermission: (granted: boolean) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  latitude: null,
  longitude: null,
  address: null,
  permissionGranted: false,

  setLocation: (latitude, longitude, address) => 
    set({ latitude, longitude, address: address || null }),
    
  setPermission: (permissionGranted) => 
    set({ permissionGranted }),
    
  clearLocation: () => 
    set({ latitude: null, longitude: null, address: null }),
}));
