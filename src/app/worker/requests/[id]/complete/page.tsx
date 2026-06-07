"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/Card";
import { Button } from "@/components/Button";
import { Textarea } from "@/components/Input";
import { StatusBadge } from "@/components/StatusBadge";
import { getRepairTypeText, formatDate } from "@/lib/utils";
import { Upload, X, ArrowLeft } from "lucide-react";
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
  owner: {
    name: string;
  };
}

export default function CompleteRepairPage({ params }: PageProps) {
  const router = useRouter();
  const [request, setRequest] = useState<RepairRequest | null>(null);
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
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
        if (data.request.status !== "IN_PROGRESS") {
          toast.error("当前状态不可完成维修");
          router.back();
        }
      }
    } catch (error) {
      toast.error("获取工单详情失败");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (photos.length + files.length > 3) {
      toast.error("最多只能上传3张照片");
      return;
    }

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error("请填写维修说明");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/repair-requests/${params.id}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description,
            photos,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("维修完成，已通知业主验收");
        router.push(`/worker/requests/${params.id}`);
      } else {
        toast.error(data.error || "操作失败");
      }
    } catch (error) {
      toast.error("操作失败，请稍后重试");
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

  return (
    <SidebarLayout role="WORKER" activePath="/worker/dashboard">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href={`/worker/requests/${params.id}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回详情
          </Link>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>工单信息</CardTitle>
                <StatusBadge status={request.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">工单标题</span>
                <span className="font-medium">{request.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">故障类型</span>
                <span>{getRepairTypeText(request.type)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">房间号</span>
                <span>{request.roomNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">业主</span>
                <span>{request.owner.name}</span>
              </div>
              <div>
                <p className="text-gray-500 mb-1">故障描述</p>
                <p className="text-gray-700">{request.description}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>完成维修</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <Textarea
                  label="维修说明"
                  placeholder="请详细描述维修过程和结果..."
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    维修后照片（最多3张）
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {photos.map((photo, index) => (
                      <div
                        key={index}
                        className="relative aspect-square rounded-lg overflow-hidden border"
                      >
                        <img
                          src={photo}
                          alt={`照片${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {photos.length < 3 && (
                      <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                        <Upload className="h-8 w-8 text-gray-400" />
                        <span className="text-xs text-gray-500 mt-1">
                          上传照片
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.back()}
                  >
                    取消
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "提交中..." : "确认完成"}
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
