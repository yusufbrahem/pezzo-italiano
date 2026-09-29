"use client";

import type { ReactNode } from "react";
import { OrderContextProvider } from "@/context/OrderContext";
import OrderModal from "@/components/OrderModal";
import type { MenuItem } from "@/data/menu";
import type { ContactSettings, PricingTiers } from "@/lib/data/settings";

export default function OrderProvider({
  children,
  items,
  contact,
  pricingTiers,
  showComingSoon,
}: {
  children: ReactNode;
  items: MenuItem[];
  contact: ContactSettings;
  pricingTiers: PricingTiers;
  showComingSoon: boolean;
}) {
  return (
    <OrderContextProvider items={items} contact={contact} pricingTiers={pricingTiers} showComingSoon={showComingSoon}>
      {children}
      <OrderModal />
    </OrderContextProvider>
  );
}
