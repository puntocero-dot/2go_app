import type { ReactNode } from "react";
import { InstallPrompt } from "@/components/install-prompt";

export default function ArmadorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      {children}
      <InstallPrompt />
    </>
  );
}
