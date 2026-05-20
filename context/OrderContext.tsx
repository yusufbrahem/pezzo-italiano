"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface OrderContextValue {
  isOpen: boolean;
  openOrder: () => void;
  closeOrder: () => void;
}

const OrderContext = createContext<OrderContextValue | null>(null);

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrder must be used within OrderProvider");
  return ctx;
}

export function OrderContextProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <OrderContext.Provider
      value={{
        isOpen,
        openOrder: () => setIsOpen(true),
        closeOrder: () => setIsOpen(false),
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}
