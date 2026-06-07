"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Home,
  FileText,
  Settings,
  Users,
  ClipboardList,
  Wrench,
  LogOut,
  Bell,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarLayoutProps {
  children: React.ReactNode;
  role: "OWNER" | "ADMIN" | "WORKER";
  activePath: string;
}

export function SidebarLayout({ children, role, activePath }: SidebarLayoutProps) {
  const router = useRouter();
  const sessionData = useSession();
  const session = sessionData?.data;

  const getNavItems = (): NavItem[] => {
    switch (role) {
      case "OWNER":
        return [
          { label: "首页", href: "/owner/dashboard", icon: <Home className="h-5 w-5" /> },
          { label: "提交报修", href: "/owner/new", icon: <FileText className="h-5 w-5" /> },
          { label: "我的报修", href: "/owner/requests", icon: <ClipboardList className="h-5 w-5" /> },
        ];
      case "ADMIN":
        return [
          { label: "工单管理", href: "/admin/dashboard", icon: <ClipboardList className="h-5 w-5" /> },
          { label: "业主审核", href: "/admin/owners", icon: <Users className="h-5 w-5" /> },
          { label: "维修工管理", href: "/admin/workers", icon: <Wrench className="h-5 w-5" /> },
        ];
      case "WORKER":
        return [
          { label: "我的工单", href: "/worker/dashboard", icon: <ClipboardList className="h-5 w-5" /> },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();
  const roleText = {
    OWNER: "业主",
    ADMIN: "管理员",
    WORKER: "维修工",
  }[role];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-blue-600">物业报修系统</h1>
          <p className="text-sm text-gray-500 mt-1">{roleText}端</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                "w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                activePath === item.href
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {item.icon}
              <span className="ml-3">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center mb-4">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {session?.user?.name}
              </p>
              <p className="text-xs text-gray-500">{session?.user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="ml-2">退出登录</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
          <h2 className="text-lg font-semibold text-gray-800">
            {navItems.find((item) => item.href === activePath)?.label || ""}
          </h2>
          <button className="relative p-2 text-gray-400 hover:text-gray-600">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
