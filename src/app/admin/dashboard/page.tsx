import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/Button";
import { getRepairTypeText, formatDate, hoursSince } from "@/lib/utils";
import { FileText, Clock, CheckCircle, AlertTriangle, Users, Wrench } from "lucide-react";
import Link from "next/link";

type TabType = "pending" | "processing" | "completed" | "overdue";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const activeTab: TabType =
    (searchParams.tab as TabType) || "pending";

  const allRequests = await prisma.repairRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: {
        select: { name: true, email: true },
      },
      worker: {
        select: { name: true, email: true },
      },
    },
  });

  const pendingRequests = allRequests.filter(
    (r) => r.status === "PENDING_ASSIGN"
  );
  const processingRequests = allRequests.filter(
    (r) => r.status === "ASSIGNED" || r.status === "IN_PROGRESS"
  );
  const completedRequests = allRequests.filter(
    (r) => r.status === "COMPLETED" || r.status === "PENDING_INSPECTION"
  );

  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const overdueRequests = pendingRequests.filter(
    (r) => new Date(r.createdAt) < fortyEightHoursAgo
  );

  const getDisplayRequests = () => {
    switch (activeTab) {
      case "pending":
        return pendingRequests;
      case "processing":
        return processingRequests;
      case "completed":
        return completedRequests;
      case "overdue":
        return overdueRequests;
      default:
        return pendingRequests;
    }
  };

  const displayRequests = getDisplayRequests();

  const tabs = [
    { key: "pending", label: "待派单", count: pendingRequests.length, icon: Clock },
    { key: "processing", label: "处理中", count: processingRequests.length, icon: Wrench },
    { key: "completed", label: "已完成", count: completedRequests.length, icon: CheckCircle },
    { key: "overdue", label: "已超时", count: overdueRequests.length, icon: AlertTriangle, danger: true },
  ];

  return (
    <SidebarLayout role="ADMIN" activePath="/admin/dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">全部工单</p>
                <p className="text-2xl font-bold text-gray-900">
                  {allRequests.length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">待派单</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pendingRequests.length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Wrench className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">处理中</p>
                <p className="text-2xl font-bold text-gray-900">
                  {processingRequests.length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">已超时</p>
                <p className="text-2xl font-bold text-red-600">
                  {overdueRequests.length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.key}
                    href={`/admin/dashboard?tab=${tab.key}`}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? tab.danger
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        activeTab === tab.key
                          ? tab.danger
                            ? "bg-red-200 text-red-800"
                            : "bg-blue-200 text-blue-800"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </Link>
                );
              })}
            </div>
          </CardHeader>
          <CardContent>
            {displayRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p>暂无工单</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayRequests.map((request) => {
                  const isOverdue =
                    request.status === "PENDING_ASSIGN" &&
                    hoursSince(request.createdAt) > 48;

                  return (
                    <div
                      key={request.id}
                      className={`p-4 border rounded-lg hover:border-blue-300 transition-colors ${
                        isOverdue ? "border-red-300 bg-red-50/50" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-gray-900">
                              {request.title}
                            </h3>
                            <StatusBadge status={request.status} />
                            {isOverdue && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                超时
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {request.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="px-2 py-1 bg-gray-100 rounded">
                              {getRepairTypeText(request.type)}
                            </span>
                            <span>业主：{request.owner.name}</span>
                            <span>房间：{request.roomNumber}</span>
                            <span>提交：{formatDate(request.createdAt)}</span>
                            {request.worker && (
                              <span>维修工：{request.worker.name}</span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          {request.status === "PENDING_ASSIGN" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                (window.location.href = `/admin/requests/${request.id}/assign`)
                              }
                            >
                              派单
                            </Button>
                          )}
                          {request.status !== "PENDING_ASSIGN" && (
                            <Link
                              href={`/admin/requests/${request.id}`}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-500"
                            >
                              查看详情
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
