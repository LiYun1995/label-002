import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING_ASSIGN: "待派单",
    ASSIGNED: "已派单",
    IN_PROGRESS: "维修中",
    PENDING_INSPECTION: "待验收",
    COMPLETED: "已完成",
  };
  return statusMap[status] || status;
}

export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    PENDING_ASSIGN: "bg-yellow-100 text-yellow-800",
    ASSIGNED: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-purple-100 text-purple-800",
    PENDING_INSPECTION: "bg-orange-100 text-orange-800",
    COMPLETED: "bg-green-100 text-green-800",
  };
  return colorMap[status] || "bg-gray-100 text-gray-800";
}

export function getRepairTypeText(type: string): string {
  const typeMap: Record<string, string> = {
    PLUMBING: "水电",
    ELECTRICAL: "电器",
    DOORS_WINDOWS: "门窗",
    APPLIANCES: "家电",
    OTHER: "其他",
  };
  return typeMap[type] || type;
}

export function getSpecialtyText(specialty: string): string {
  const specialtyMap: Record<string, string> = {
    PLUMBER: "水工",
    ELECTRICIAN: "电工",
    MASON: "泥瓦工",
    CARPENTER: "木工",
    GENERAL: "综合维修",
  };
  return specialtyMap[specialty] || specialty;
}

export function isOverdue(deadline: Date | string | null | undefined): boolean {
  if (!deadline) return false;
  const d = typeof deadline === "string" ? new Date(deadline) : deadline;
  return new Date() > d;
}

export function hoursSince(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  return (now.getTime() - d.getTime()) / (1000 * 60 * 60);
}
