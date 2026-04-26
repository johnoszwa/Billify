import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const INVENTORY_KEY = "@swift_invoice_inventory";

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  currency: string;
}

interface InventoryContextType {
  items: InventoryItem[];
  isLoading: boolean;
  addInventoryItem: (item: InventoryItem) => Promise<void>;
  updateInventoryItem: (item: InventoryItem) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(INVENTORY_KEY)
      .then((json) => {
        if (json) setItems(JSON.parse(json));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const addInventoryItem = useCallback(async (item: InventoryItem) => {
    setItems((prev) => {
      const updated = [item, ...prev];
      AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateInventoryItem = useCallback(async (item: InventoryItem) => {
    setItems((prev) => {
      const updated = prev.map((i) => (i.id === item.id ? item : i));
      AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteInventoryItem = useCallback(async (id: string) => {
    setItems((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <InventoryContext.Provider
      value={{ items, isLoading, addInventoryItem, updateInventoryItem, deleteInventoryItem }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used within InventoryProvider");
  return ctx;
}
