import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import { Gauge, History, LayoutDashboard, Radio, ScanLine, Split, Flag } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { isJudgeModeRequested, subscribeToJudgeMode } from "@shared/presentationMode";

const menuItems = [
  { icon: LayoutDashboard, label: "Mission Control", section: "mission-control" },
  { icon: ScanLine, label: "Live Analysis", section: "live-analysis" },
  { icon: Split, label: "Sector Matrix", section: "sector-matrix" },
  { icon: Flag, label: "Strategy Engine", section: "strategy-engine" },
  { icon: History, label: "History", section: "history" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <SidebarProvider defaultOpen={true}><DashboardLayoutContent>{children}</DashboardLayoutContent></SidebarProvider>;
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { toggleSidebar, state } = useSidebar();
  const isMobile = useIsMobile();
  const collapsed = state === "collapsed";
  const [judgeMode, setJudgeMode] = useState(() => isJudgeModeRequested(window.location.search));

  useEffect(() => {
    return subscribeToJudgeMode(window, setJudgeMode);
  }, []);

  const jumpTo = (section: string) => {
    document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className={`telemetry-bg min-h-screen w-full ${judgeMode ? "judge-mode-shell" : ""}`}>
      {!judgeMode && <Sidebar collapsible="icon" className="border-r border-white/[0.07] bg-[#080b11]" variant="sidebar">
        <SidebarHeader className="h-[84px] border-b border-white/[0.06] px-3">
          <div className="flex items-center gap-3 py-2">
            <button onClick={toggleSidebar} className="logo-mark shrink-0" aria-label="Toggle sidebar"><Gauge className="h-5 w-5" /></button>
            {!collapsed && <div className="min-w-0"><p className="brand-wordmark">TRACKSENSE</p><p className="brand-sub">PRO // RACE OPS</p></div>}
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2 py-5">
          <div className="sidebar-label">COMMAND DECK</div>
          <SidebarMenu className="gap-1 mt-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const active = index === 0 && location === "/";
              return <SidebarMenuItem key={item.section}>
                <SidebarMenuButton onClick={() => jumpTo(item.section)} isActive={active} tooltip={item.label} className="nav-button">
                  <Icon className="h-4 w-4" /><span>{item.label}</span><span className="nav-index">0{index + 1}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>;
            })}
          </SidebarMenu>
          <div className="mt-7 px-2"><div className="system-status"><span className="status-dot" /> SYSTEMS NOMINAL</div><div className="system-caption">Telemetry uplink stable<br />Model cache synchronized</div></div>
        </SidebarContent>
        <SidebarFooter className="border-t border-white/[0.06] p-3">
          <div className="flex w-full items-center gap-3 rounded-lg p-1.5 text-left">
            <div className="logo-mark h-8 w-8 shrink-0"><Radio className="h-4 w-4" /></div>
            {!collapsed && <div className="min-w-0"><p className="truncate text-xs font-semibold text-white">Trackside Console</p><p className="truncate text-[10px] text-muted-foreground">PUBLIC SESSION</p></div>}
          </div>
        </SidebarFooter>
      </Sidebar>}
      <SidebarInset className="bg-transparent min-w-0" style={{ paddingLeft: judgeMode || isMobile ? 0 : collapsed ? "var(--sidebar-width-icon)" : "var(--sidebar-width)" }}>
        {isMobile && !judgeMode && <div className="mobile-topbar"><SidebarTrigger className="text-white" /><div><p className="brand-wordmark">TRACKSENSE</p><p className="brand-sub">RACE OPS</p></div><Radio className="ml-auto h-4 w-4 text-[#b7ff39]" /></div>}
        <main className="min-h-screen">{children}</main>
      </SidebarInset>
    </div>
  );
}
