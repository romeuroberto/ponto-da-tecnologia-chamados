import { MobileNavClient } from "@/components/layout/mobile-nav-client";
import { portalNavigation } from "@/components/portal/portal-navigation-config";

export function PortalMobileNav() {
  return (
    <MobileNavClient
      items={portalNavigation}
      eyebrowLabel="Portal"
      footerHref="/portal/dashboard"
      footerLabel="Ir para dashboard"
    />
  );
}
