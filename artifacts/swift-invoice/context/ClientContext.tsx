import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const CLIENTS_KEY = "@swift_invoice_clients";

export interface Client {
  id: string;
  name: string;
  email: string;
  address: string;
  phone: string;
}

interface ClientContextType {
  clients: Client[];
  isLoading: boolean;
  addClient: (client: Client) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(CLIENTS_KEY)
      .then((json) => {
        if (json) setClients(JSON.parse(json));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const addClient = useCallback(async (client: Client) => {
    setClients((prev) => {
      const updated = [client, ...prev];
      AsyncStorage.setItem(CLIENTS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateClient = useCallback(async (client: Client) => {
    setClients((prev) => {
      const updated = prev.map((c) => (c.id === client.id ? client : c));
      AsyncStorage.setItem(CLIENTS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    setClients((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      AsyncStorage.setItem(CLIENTS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <ClientContext.Provider value={{ clients, isLoading, addClient, updateClient, deleteClient }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClients() {
  const ctx = useContext(ClientContext);
  if (!ctx) throw new Error("useClients must be used within ClientProvider");
  return ctx;
}
