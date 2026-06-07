"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { Wrench, Plus, User } from "lucide-react";
import { getSpecialtyText } from "@/lib/utils";

const specialties = [
  { value: "PLUMBER", label: "水工" },
  { value: "ELECTRICIAN", label: "电工" },
  { value: "MASON", label: "泥瓦工" },
  { value: "CARPENTER", label: "木工" },
  { value: "GENERAL", label: "综合维修" },
];

interface Worker {
  id: string;
  name: string;
  email: string;
  workerProfile: {
    specialty: string;
    phone?: string | null;
  } | null;
}

export default function WorkerManagement() {
  const router = useRouter();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    specialty: "GENERAL",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/workers");
      const data = await response.json();
      if (response.ok) {
        setWorkers(data.workers);
      }
    } catch (error) {
      toast.error("获取维修工列表失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      toast.error("请填写所有必填字段");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("维修工添加成功");
        setShowForm(false);
        setFormData({
          name: "",
          email: "",
          password: "",
          specialty: "GENERAL",
          phone: "",
        });
        fetchWorkers();
      } else {
        toast.error(data.error || "添加失败");
      }
    } catch (error) {
      toast.error("添加失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SidebarLayout role="ADMIN" activePath="/admin/workers">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">维修工管理</h2>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-1" />
            添加维修工
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>添加维修工</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="姓名"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                  <Input
                    label="邮箱"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="初始密码"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                  <Select
                    label="工种"
                    options={specialties}
                    value={formData.specialty}
                    onChange={(e) =>
                      setFormData({ ...formData, specialty: e.target.value })
                    }
                  />
                </div>
                <Input
                  label="联系电话（可选）"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowForm(false)}
                  >
                    取消
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "添加中..." : "添加"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-blue-500" />
              维修工列表
              <span className="text-sm font-normal text-gray-500">
                ({workers.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : workers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无维修工
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workers.map((worker) => (
                  <div
                    key={worker.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{worker.name}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {worker.email}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {worker.workerProfile &&
                          getSpecialtyText(worker.workerProfile.specialty)}
                      </span>
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
