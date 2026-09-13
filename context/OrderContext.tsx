"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { MenuItem } from "@/data/menu";
import type { ContactSettings, PricingTiers } from "@/lib/data/settings";

interface OrderContextValue {
  isOpen: boolean;
  openOrder: () => void;
  closeOrder: () => void;
  items: MenuItem[];
  contact: ContactSettings;
  pricingTiers: PricingTiers;
}

const OrderContext = createContext<OrderContextValue | null>(null);

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrder must be used within OrderProvider");
  return ctx;
}

export function OrderContextProvider({
  children,
  items,
  contact,
  pricingTiers,
}: {
  children: ReactNode;
  items: MenuItem[];
  contact: ContactSettings;
  pricingTiers: PricingTiers;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <OrderContext.Provider
      value={{
        isOpen,
        openOrder: () => setIsOpen(true),
        closeOrder: () => setIsOpen(false),
        items,
        contact,
        pricingTiers,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}
