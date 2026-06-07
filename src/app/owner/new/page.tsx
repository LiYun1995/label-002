"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input, Textarea, Select } from "@/components/Input";
import { Upload, X } from "lucide-react";

const repairTypes = [
  { value: "PLUMBING", label: "水电" },
  { value: "ELECTRICAL", label: "电器" },
  { value: "DOORS_WINDOWS", label: "门窗" },
  { value: "APPLIANCES", label: "家电" },
  { value: "OTHER", label: "其他" },
];

export default function NewRepairRequest() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    roomNumber: "",
    type: "PLUMBING",
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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

    if (!formData.title || !formData.description || !formData.roomNumber) {
      toast.error("请填写所有必填字段");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/repair-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          photos,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("报修提交成功");
        router.push("/owner/requests");
      } else {
        toast.error(data.error || "提交失败");
      }
    } catch (error) {
      toast.error("提交失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarLayout role="OWNER" activePath="/owner/new">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>提交报修申请</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="报修标题"
                placeholder="请简要描述故障情况"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="房间号"
                  placeholder="如：1栋1单元101室"
                  value={formData.roomNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, roomNumber: e.target.value })
                  }
                  required
                />
                <Select
                  label="故障类型"
                  options={repairTypes}
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                />
              </div>

              <Textarea
                label="故障描述"
                placeholder="请详细描述故障情况，方便维修人员准备"
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  现场照片（最多3张）
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
                      <span className="text-xs text-gray-500 mt-1">上传照片</span>
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
                <Button type="submit" disabled={loading}>
                  {loading ? "提交中..." : "提交报修"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
