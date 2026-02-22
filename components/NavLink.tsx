"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavLinkProps = {
  to: string;
  className?: string;
  activeClassName?: string;
  children: React.ReactNode;
};

export function NavLink({ to, className, activeClassName, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === to || pathname.startsWith(`${to}/`);

  return (
    <Link href={to} className={cn(className, isActive && activeClassName)}>
      {children}
    </Link>
  );
}
