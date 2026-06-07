import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { getRepairTypeText, formatDate } from "@/lib/utils";
import { FileText } from "lucide-react";
import Link from "next/link";

export default async function OwnerRequests() {
  const session = await auth();

  if (!session || session.user.role !== "OWNER") {
    redirect("/login");
  }

  const requests = await prisma.repairRequest.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      photos: true,
    },
  });

  return (
    <SidebarLayout role="OWNER" activePath="/owner/requests">
      <Card>
        <CardHeader>
          <CardTitle>我的报修单</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <p className="text-lg">暂无报修记录</p>
              <p className="text-sm mt-2">
                您还没有提交过报修申请，点击下方按钮提交您的第一个报修
              </p>
              <Link
                href="/owner/new"
                className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                提交报修
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Link
                  key={request.id}
                  href={`/owner/requests/${request.id}`}
                  className="block p-4 border rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
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
                        <span>房间：{request.roomNumber}</span>
                        <span>提交时间：{formatDate(request.createdAt)}</span>
                      </div>
                    </div>
                    {request.photos.length > 0 && (
                      <div className="ml-4 flex gap-1">
                        {request.photos.slice(0, 3).map((photo) => (
                          <div
                            key={photo.id}
                            className="w-12 h-12 rounded bg-gray-100 overflow-hidden"
                          >
                            <img
                              src={photo.url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </SidebarLayout>
  );
}
