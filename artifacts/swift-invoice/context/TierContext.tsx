import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const TIER_KEY = "@swift_invoice_tier";

export type Tier = "free" | "pro_device" | "pro_cloud";

interface TierContextType {
  tier: Tier;
  setTier: (tier: Tier) => Promise<void>;
  isPro: boolean;
  isProDevice: boolean;
  isProCloud: boolean;
}

const TierContext = createContext<TierContextType | undefined>(undefined);

export function TierProvider({ children }: { children: React.ReactNode }) {
  const [tier, setTierState] = useState<Tier>("free");

  useEffect(() => {
    AsyncStorage.getItem(TIER_KEY).then((stored) => {
      if (stored === "pro_device" || stored === "pro_cloud") {
        setTierState(stored);
      }
    });
  }, []);

  const setTier = useCallback(async (next: Tier) => {
    setTierState(next);
    await AsyncStorage.setItem(TIER_KEY, next);
  }, []);

  const isPro = tier === "pro_device" || tier === "pro_cloud";
  const isProDevice = tier === "pro_device";
  const isProCloud = tier === "pro_cloud";

  return (
    <TierContext.Provider value={{ tier, setTier, isPro, isProDevice, isProCloud }}>
      {children}
    </TierContext.Provider>
  );
}

export function useTier() {
  const ctx = useContext(TierContext);
  if (!ctx) throw new Error("useTier must be used within a TierProvider");
  return ctx;
}
