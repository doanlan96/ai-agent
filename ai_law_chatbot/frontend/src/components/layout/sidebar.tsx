"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { LayoutDashboard, MessageSquare, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { useSidebarStore } from "@/stores";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose, Button } from "@/components/ui";

const navigation = [
  { name: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { name: "Chat", href: ROUTES.CHAT, icon: MessageSquare },
];

function NavLinks({ onNavigate, isCollapsed }: { onNavigate?: () => void; isCollapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 p-4">
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            title={isCollapsed ? item.name : undefined}
            className={cn(
              "flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200",
              "min-h-[44px]",
              isCollapsed ? "justify-center px-0" : "gap-3",
              isActive
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground"
            )}
          >
            <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
            {!isCollapsed && <span className="truncate">{item.name}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ onNavigate, isCollapsed, onToggleCollapse }: { onNavigate?: () => void; isCollapsed?: boolean; onToggleCollapse?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-14 items-center border-b px-4 transition-all duration-300", isCollapsed ? "justify-center" : "justify-between")}>
        <Link
          href={ROUTES.HOME}
          className="flex items-center gap-2 font-semibold overflow-hidden"
          onClick={onNavigate}
        >
          {!isCollapsed && <span className="truncate">{"ai_law_chatbot"}</span>}
          {isCollapsed && <span className="text-primary font-bold text-lg">AL</span>}
        </Link>
        {!onNavigate && (
             <Button 
                variant="ghost" 
                size="icon" 
                onClick={onToggleCollapse} 
                className="h-8 w-8 hover:bg-secondary/80 shrink-0"
              >
               {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
             </Button>
        )}
      </div>
      <NavLinks onNavigate={onNavigate} isCollapsed={isCollapsed} />
    </div>
  );
}

export function Sidebar() {
  const { isOpen, isCollapsed, close, toggleCollapse } = useSidebarStore();

  return (
    <>
      <aside className={cn(
        "bg-background hidden shrink-0 border-r md:block transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <SidebarContent isCollapsed={isCollapsed} onToggleCollapse={toggleCollapse} />
      </aside>

      <Sheet open={isOpen} onOpenChange={close}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="h-14 px-4 border-b flex flex-row items-center justify-between space-y-0">
            <SheetTitle className="text-left font-semibold">{"ai_law_chatbot"}</SheetTitle>
          </SheetHeader>
          <NavLinks onNavigate={close} />
        </SheetContent>
      </Sheet>
    </>
  );
}
