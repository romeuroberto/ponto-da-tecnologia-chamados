import { auth } from "@/auth";
import { appNavigation, filterNavigationByRole } from "@/components/layout/navigation-config";
import { MobileNavClient } from "@/components/layout/mobile-nav-client";

export async function MobileNav() {
  const session = await auth();
  const role = session?.user?.role;
  const filteredNavigation = filterNavigationByRole(appNavigation, role);

  return <MobileNavClient items={filteredNavigation} />;
}
