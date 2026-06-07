"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/Card";
import { Button } from "@/components/Button";
import { Select, Input } from "@/components/Input";
import { StatusBadge } from "@/components/StatusBadge";
import { getRepairTypeText, formatDate, getSpecialtyText } from "@/lib/utils";
import { User, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Worker {
  id: string;
  name: string;
  email: string;
  workerProfile: {
    specialty: string;
    phone?: string | null;
  } | null;
}

interface RepairRequest {
  id: string;
  title: string;
  description: string;
  roomNumber: string;
  type: string;
  status: string;
  createdAt: string;
  owner: {
    name: string;
  };
}

interface PageProps {
  params: { id: string };
}

export default function AssignPage({ params }: PageProps) {
  const router = useRouter();
  const [request, setRequest] = useState<RepairRequest | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [expectedDeadline, setExpectedDeadline] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reqRes, workersRes] = await Promise.all([
          fetch(`/api/repair-requests/${params.id}`),
          fetch("/api/workers"),
        ]);

        const reqData = await reqRes.json();
        const workersData = await workersRes.json();

        if (reqRes.ok) {
          setRequest(reqData.request);
        }
        if (workersRes.ok) {
          setWorkers(workersData.workers);
        }
      } catch (error) {
        toast.error("获取数据失败");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedWorker) {
      toast.error("请选择维修工");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/repair-requests/${params.id}/assign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workerId: selectedWorker,
            expectedDeadline: expectedDeadline || null,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("派单成功");
        router.push("/admin/dashboard");
      } else {
        toast.error(data.error || "派单失败");
      }
    } catch (error) {
      toast.error("派单失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SidebarLayout role="ADMIN" activePath="/admin/dashboard">
        <div className="text-center py-12">加载中...</div>
      </SidebarLayout>
    );
  }

  if (!request) {
    return (
      <SidebarLayout role="ADMIN" activePath="/admin/dashboard">
        <div className="text-center py-12">工单不存在</div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout role="ADMIN" activePath="/admin/dashboard">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回工单列表
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>工单信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">工单标题</p>
                <p className="font-medium">{request.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">状态</p>
                <StatusBadge status={request.status} />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">故障类型</p>
                <p>{getRepairTypeText(request.type)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">房间号</p>
                <p>{request.roomNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">业主</p>
                <p>{request.owner.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">提交时间</p>
                <p>{formatDate(request.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">故障描述</p>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {request.description}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>指派维修工</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择维修工
                  </label>
                  {workers.length === 0 ? (
                    <p className="text-sm text-gray-500">暂无可用维修工</p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {workers.map((worker) => (
                        <label
                          key={worker.id}
                          className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedWorker === worker.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="worker"
                            value={worker.id}
                            checked={selectedWorker === worker.id}
                            onChange={(e) => setSelectedWorker(e.target.value)}
                            className="mr-3"
                          />
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="ml-3">
                              <p className="font-medium text-gray-900">
                                {worker.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {worker.workerProfile &&
                                  getSpecialtyText(
                                    worker.workerProfile.specialty
                                  )}
                              </p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <Input
                  label="期望完成时限"
                  type="datetime-local"
                  value={expectedDeadline}
                  onChange={(e) => setExpectedDeadline(e.target.value)}
                />

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.back()}
                  >
                    取消
                  </Button>
                  <Button type="submit" disabled={submitting || !selectedWorker}>
                    {submitting ? "派单中..." : "确认派单"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  );
}
