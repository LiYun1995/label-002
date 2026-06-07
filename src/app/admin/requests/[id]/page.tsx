import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { getRepairTypeText, formatDate, getSpecialtyText } from "@/lib/utils";
import { Clock, User, MapPin, Calendar, Star, FileText } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: { id: string };
}

export default async function AdminRequestDetail({ params }: PageProps) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const request = await prisma.repairRequest.findUnique({
    where: { id: params.id },
    include: {
      owner: {
        include: {
          ownerProfile: true,
        },
      },
      worker: {
        include: {
          workerProfile: true,
        },
      },
      photos: true,
      review: true,
      statusLogs: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!request) {
    redirect("/admin/dashboard");
  }

  const beforePhotos = request.photos.filter((p) => p.type === "BEFORE");
  const afterPhotos = request.photos.filter((p) => p.type === "AFTER");

  return (
    <SidebarLayout role="ADMIN" activePath="/admin/dashboard">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← 返回列表
          </Link>
          {request.status === "PENDING_ASSIGN" && (
            <a href={`/admin/requests/${request.id}/assign`} className="inline-flex items-center justify-center font-medium rounded-lg transition-colors px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500">
              派单
            </a>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{request.title}</CardTitle>
              <StatusBadge status={request.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">房间号</p>
                  <p className="font-medium">{request.roomNumber}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">故障类型</p>
                  <p className="font-medium">{getRepairTypeText(request.type)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">提交时间</p>
                  <p className="font-medium">{formatDate(request.createdAt)}</p>
                </div>
              </div>
              {request.expectedDeadline && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">期望完成时限</p>
                    <p className="font-medium">{formatDate(request.expectedDeadline)}</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-2">故障描述</p>
              <p className="text-gray-700 whitespace-pre-wrap">{request.description}</p>
            </div>

            {beforePhotos.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">现场照片</p>
                <div className="grid grid-cols-3 gap-3">
                  {beforePhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="aspect-square rounded-lg overflow-hidden border"
                    >
                      <img
                        src={photo.url}
                        alt="现场照片"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-6">
              <p className="text-sm text-gray-500 mb-3">业主信息</p>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{request.owner.name}</p>
                  <p className="text-sm text-gray-500">{request.owner.email}</p>
                  <p className="text-sm text-gray-500">
                    房号：{request.owner.ownerProfile?.roomNumber}
                  </p>
                </div>
              </div>
            </div>

            {request.worker && (
              <div className="border-t pt-6">
                <p className="text-sm text-gray-500 mb-3">维修工信息</p>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">{request.worker.name}</p>
                    <p className="text-sm text-gray-500">{request.worker.email}</p>
                    {request.worker.workerProfile && (
                      <p className="text-sm text-gray-500">
                        工种：{getSpecialtyText(request.worker.workerProfile.specialty)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {afterPhotos.length > 0 && (
              <div className="border-t pt-6">
                <p className="text-sm text-gray-500 mb-2">维修后照片</p>
                <div className="grid grid-cols-3 gap-3">
                  {afterPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="aspect-square rounded-lg overflow-hidden border"
                    >
                      <img
                        src={photo.url}
                        alt="维修后照片"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {request.review && (
              <div className="border-t pt-6">
                <p className="text-sm text-gray-500 mb-3">业主评价</p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < request.review!.rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-600 ml-2">
                      {request.review.rating} 星
                    </span>
                  </div>
                  {request.review.comment && (
                    <p className="text-gray-700">{request.review.comment}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>状态变更记录</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div className="space-y-4">
                {request.statusLogs.map((log) => (
                  <div key={log.id} className="relative pl-10">
                    <div className="absolute left-2 top-1 h-4 w-4 rounded-full bg-blue-500 border-2 border-white"></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={log.toStatus} />
                        <span className="text-sm text-gray-500">
                          {formatDate(log.createdAt)}
                        </span>
                      </div>
                      {log.remark && (
                        <p className="text-sm text-gray-600 mt-1">{log.remark}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
