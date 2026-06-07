import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/Button";
import { getRepairTypeText, formatDate, getSpecialtyText } from "@/lib/utils";
import { Wrench, Clock, CheckCircle, FileText, AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function WorkerDashboard() {
  const session = await auth();

  if (!session || session.user.role !== "WORKER") {
    redirect("/login");
  }

  const workerProfile = await prisma.workerProfile.findUnique({
    where: { userId: session.user.id },
  });

  const requests = await prisma.repairRequest.findMany({
    where: { workerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      owner: {
        select: { name: true, email: true },
      },
    },
  });

  const assignedRequests = requests.filter((r) => r.status === "ASSIGNED");
  const inProgressRequests = requests.filter((r) => r.status === "IN_PROGRESS");
  const completedRequests = requests.filter(
    (r) => r.status === "COMPLETED" || r.status === "PENDING_INSPECTION"
  );

  return (
    <SidebarLayout role="WORKER" activePath="/worker/dashboard">
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Wrench className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {session.user.name}
                </p>
                <p className="text-sm text-gray-500">
                  {workerProfile && getSpecialtyText(workerProfile.specialty)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {assignedRequests.length}
                </p>
                <p className="text-xs text-gray-500">待接单</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {inProgressRequests.length}
                </p>
                <p className="text-xs text-gray-500">进行中</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {completedRequests.length}
                </p>
                <p className="text-xs text-gray-500">已完成</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {assignedRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                待接单工单
                <span className="text-sm font-normal text-gray-500">
                  ({assignedRequests.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assignedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 border border-yellow-200 bg-yellow-50/50 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-900">
                            {request.title}
                          </h3>
                          <StatusBadge status={request.status} />
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
                          <span>派单时间：{formatDate(request.assignedAt || request.createdAt)}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col gap-2">
                        <Link
                          href={`/worker/requests/${request.id}`}
                          className="inline-flex items-center justify-center font-medium rounded-lg transition-colors px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                        >
                          查看并接单
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {inProgressRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-blue-500" />
                维修中工单
                <span className="text-sm font-normal text-gray-500">
                  ({inProgressRequests.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inProgressRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 border rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-900">
                            {request.title}
                          </h3>
                          <StatusBadge status={request.status} />
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
                        </div>
                      </div>
                      <div className="ml-4">
                        <Link
                          href={`/worker/requests/${request.id}/complete`}
                          className="inline-flex items-center justify-center font-medium rounded-lg transition-colors px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"
                        >
                          完成维修
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              全部工单
              <span className="text-sm font-normal text-gray-500">
                ({requests.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p>暂无工单</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => (
                  <Link
                    key={request.id}
                    href={`/worker/requests/${request.id}`}
                    className="block p-4 border rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-900">
                            {request.title}
                          </h3>
                          <StatusBadge status={request.status} />
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
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
