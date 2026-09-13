"use client";

import type { ReactNode } from "react";
import { OrderContextProvider } from "@/context/OrderContext";
import OrderModal from "@/components/OrderModal";
import type { MenuItem } from "@/data/menu";
import type { ContactSettings } from "@/lib/data/settings";

export default function OrderProvider({
  children,
  items,
  contact,
}: {
  children: ReactNode;
  items: MenuItem[];
  contact: ContactSettings;
}) {
  return (
    <OrderContextProvider items={items} contact={contact}>
      {children}
      <OrderModal />
    </OrderContextProvider>
  );
}
