"use client";

import type { ReactNode } from "react";
import { OrderContextProvider } from "@/context/OrderContext";
import OrderModal from "@/components/OrderModal";

export default function OrderProvider({ children }: { children: ReactNode }) {
  return (
    <OrderContextProvider>
      {children}
      <OrderModal />
    </OrderContextProvider>
  );
}
