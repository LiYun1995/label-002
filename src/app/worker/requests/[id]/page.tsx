"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/Card";
import { Button } from "@/components/Button";
import { Textarea } from "@/components/Input";
import { StatusBadge } from "@/components/StatusBadge";
import { getRepairTypeText, formatDate, getSpecialtyText } from "@/lib/utils";
import { MapPin, Calendar, User, ArrowLeft, X } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: { id: string };
}

interface RepairRequest {
  id: string;
  title: string;
  description: string;
  roomNumber: string;
  type: string;
  status: string;
  createdAt: string;
  assignedAt?: string;
  expectedDeadline?: string;
  rejectReason?: string;
  owner: {
    name: string;
    email: string;
  };
  worker: {
    name: string;
    email: string;
    workerProfile?: {
      specialty: string;
    };
  };
  photos: {
    id: string;
    url: string;
    type: string;
  }[];
  statusLogs: {
    id: string;
    fromStatus?: string;
    toStatus: string;
    remark?: string;
    createdAt: string;
  }[];
}

export default function WorkerRequestDetail({ params }: PageProps) {
  const router = useRouter();
  const [request, setRequest] = useState<RepairRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRequest();
  }, [params.id]);

  const fetchRequest = async () => {
    try {
      const response = await fetch(`/api/repair-requests/${params.id}`);
      const data = await response.json();
      if (response.ok) {
        setRequest(data.request);
      }
    } catch (error) {
      toast.error("获取工单详情失败");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/repair-requests/${params.id}/accept`,
        {
          method: "POST",
        }
      );
      const data = await response.json();
      if (response.ok) {
        toast.success("接单成功");
        fetchRequest();
      } else {
        toast.error(data.error || "接单失败");
      }
    } catch (error) {
      toast.error("接单失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("请填写拒单原因");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/repair-requests/${params.id}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: rejectReason }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        toast.success("已拒单");
        setShowRejectModal(false);
        router.push("/worker/dashboard");
      } else {
        toast.error(data.error || "拒单失败");
      }
    } catch (error) {
      toast.error("拒单失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SidebarLayout role="WORKER" activePath="/worker/dashboard">
        <div className="text-center py-12">加载中...</div>
      </SidebarLayout>
    );
  }

  if (!request) {
    return (
      <SidebarLayout role="WORKER" activePath="/worker/dashboard">
        <div className="text-center py-12">工单不存在</div>
      </SidebarLayout>
    );
  }

  const beforePhotos = request.photos.filter((p) => p.type === "BEFORE");
  const afterPhotos = request.photos.filter((p) => p.type === "AFTER");

  return (
    <SidebarLayout role="WORKER" activePath="/worker/dashboard">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/worker/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回工单列表
          </Link>
          <div className="flex gap-2">
            {request.status === "ASSIGNED" && (
              <>
                <Button variant="danger" onClick={() => setShowRejectModal(true)}>
                  拒单
                </Button>
                <Button onClick={handleAccept} disabled={submitting}>
                  {submitting ? "处理中..." : "接单"}
                </Button>
              </>
            )}
            {request.status === "IN_PROGRESS" && (
              <Button
                onClick={() =>
                  router.push(`/worker/requests/${request.id}/complete`)
                }
              >
                完成维修
              </Button>
            )}
          </div>
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
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">故障类型</p>
                  <p className="font-medium">{getRepairTypeText(request.type)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">派单时间</p>
                  <p className="font-medium">{formatDate(request.assignedAt || request.createdAt)}</p>
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
              <p className="text-gray-700 whitespace-pre-wrap">
                {request.description}
              </p>
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
                </div>
              </div>
            </div>

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

            {request.rejectReason && (
              <div className="border-t pt-6">
                <p className="text-sm text-gray-500 mb-2">上次拒单原因</p>
                <p className="text-gray-700 bg-red-50 p-3 rounded-lg">
                  {request.rejectReason}
                </p>
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
                        <p className="text-sm text-gray-600 mt-1">
                          {log.remark}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">拒单原因</h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Textarea
              label="请填写拒单原因"
              placeholder="请详细说明拒单原因，以便管理员重新派单"
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowRejectModal(false)}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                disabled={submitting || !rejectReason.trim()}
                className="flex-1"
              >
                {submitting ? "提交中..." : "确认拒单"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
