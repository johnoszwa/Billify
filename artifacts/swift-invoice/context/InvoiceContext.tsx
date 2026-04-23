import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  price: number; // quantity × unitPrice
}

export interface Invoice {
  id: string;
  clientName: string;
  clientEmail: string;
  items: InvoiceItem[];
  total: number;
  date: string;
  invoiceNumber: string;
  status: "draft" | "sent";
}

interface InvoiceContextType {
  invoices: Invoice[];
  isProUser: boolean;
  isLoading: boolean;
  addInvoice: (invoice: Invoice) => Promise<void>;
  updateInvoice: (invoice: Invoice) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  deleteAllData: () => Promise<void>;
  upgradeToPro: () => Promise<void>;
  defaultCurrency: string;
  setDefaultCurrency: (currency: string) => Promise<void>;
  generateInvoiceNumber: () => string;
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

const INVOICES_KEY = "@swift_invoice_invoices";
const PRO_KEY = "@swift_invoice_pro";
const CURRENCY_KEY = "@swift_invoice_currency";

export function InvoiceProvider({ children }: { children: React.ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isProUser, setIsProUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [defaultCurrency, setDefaultCurrencyState] = useState("USD");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [invoicesJson, proJson, currencyJson] = await Promise.all([
        AsyncStorage.getItem(INVOICES_KEY),
        AsyncStorage.getItem(PRO_KEY),
        AsyncStorage.getItem(CURRENCY_KEY),
      ]);

      if (invoicesJson) {
        setInvoices(JSON.parse(invoicesJson));
      }
      if (proJson) {
        setIsProUser(JSON.parse(proJson));
      }
      if (currencyJson) {
        setDefaultCurrencyState(JSON.parse(currencyJson));
      }
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  }

  const addInvoice = useCallback(async (invoice: Invoice) => {
    setInvoices((prev) => {
      const updated = [invoice, ...prev];
      AsyncStorage.setItem(INVOICES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateInvoice = useCallback(async (invoice: Invoice) => {
    setInvoices((prev) => {
      const updated = prev.map((inv) => (inv.id === invoice.id ? invoice : inv));
      AsyncStorage.setItem(INVOICES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteInvoice = useCallback(async (id: string) => {
    setInvoices((prev) => {
      const updated = prev.filter((inv) => inv.id !== id);
      AsyncStorage.setItem(INVOICES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteAllData = useCallback(async () => {
    await AsyncStorage.multiRemove([INVOICES_KEY, PRO_KEY, CURRENCY_KEY]);
    setInvoices([]);
    setIsProUser(false);
    setDefaultCurrencyState("USD");
  }, []);

  const upgradeToPro = useCallback(async () => {
    setIsProUser(true);
    await AsyncStorage.setItem(PRO_KEY, JSON.stringify(true));
  }, []);

  const setDefaultCurrency = useCallback(async (currency: string) => {
    setDefaultCurrencyState(currency);
    await AsyncStorage.setItem(CURRENCY_KEY, JSON.stringify(currency));
  }, []);

  const generateInvoiceNumber = useCallback(() => {
    const num = (invoices.length + 1).toString().padStart(4, "0");
    return `INV-${num}`;
  }, [invoices.length]);

  return (
    <InvoiceContext.Provider
      value={{
        invoices,
        isProUser,
        isLoading,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        deleteAllData,
        upgradeToPro,
        defaultCurrency,
        setDefaultCurrency,
        generateInvoiceNumber,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoice() {
  const ctx = useContext(InvoiceContext);
  if (!ctx) throw new Error("useInvoice must be used within InvoiceProvider");
  return ctx;
}
