import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { getRepairTypeText, formatDate } from "@/lib/utils";
import { FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default async function OwnerDashboard() {
  const session = await auth();

  if (!session || session.user.role !== "OWNER") {
    redirect("/login");
  }

  const ownerProfile = await prisma.ownerProfile.findUnique({
    where: { userId: session.user.id },
  });

  const requests = await prisma.repairRequest.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const stats = await prisma.repairRequest.groupBy({
    by: ["status"],
    where: { ownerId: session.user.id },
    _count: { status: true },
  });

  const getCount = (status: string) => {
    const item = stats.find((s) => s.status === status);
    return item?._count.status || 0;
  };

  const totalRequests = stats.reduce((sum, s) => sum + s._count.status, 0);

  return (
    <SidebarLayout role="OWNER" activePath="/owner/dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">全部报修</p>
                <p className="text-2xl font-bold text-gray-900">{totalRequests}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">处理中</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getCount("PENDING_ASSIGN") + getCount("ASSIGNED") + getCount("IN_PROGRESS")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">待验收</p>
                <p className="text-2xl font-bold text-gray-900">{getCount("PENDING_INSPECTION")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">已完成</p>
                <p className="text-2xl font-bold text-gray-900">{getCount("COMPLETED")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>最近报修</CardTitle>
              <a
                href="/owner/requests"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                查看全部
              </a>
            </div>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p>暂无报修记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-medium text-gray-900">{request.title}</p>
                        <StatusBadge status={request.status} />
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>{getRepairTypeText(request.type)}</span>
                        <span>{request.roomNumber}</span>
                        <span>{formatDate(request.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
