"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/Card";
import { Button } from "@/components/Button";
import { User, Check, X, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Owner {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  ownerProfile: {
    id: string;
    roomNumber: string;
    status: string;
  } | null;
}

export default function OwnerManagement() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOwners();
  }, []);

  const fetchOwners = async () => {
    try {
      const response = await fetch("/api/owners");
      const data = await response.json();
      if (response.ok) {
        setOwners(data.owners);
      }
    } catch (error) {
      toast.error("获取业主列表失败");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      const response = await fetch("/api/owners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: "APPROVED" }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("审核通过");
        fetchOwners();
      } else {
        toast.error(data.error || "操作失败");
      }
    } catch (error) {
      toast.error("操作失败，请稍后重试");
    }
  };

  const handleReject = async (userId: string) => {
    try {
      const response = await fetch("/api/owners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: "REJECTED" }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("已拒绝");
        fetchOwners();
      } else {
        toast.error(data.error || "操作失败");
      }
    } catch (error) {
      toast.error("操作失败，请稍后重试");
    }
  };

  const pendingOwners = owners.filter((o) => o.ownerProfile?.status === "PENDING");
  const approvedOwners = owners.filter((o) => o.ownerProfile?.status === "APPROVED");
  const rejectedOwners = owners.filter((o) => o.ownerProfile?.status === "REJECTED");

  return (
    <SidebarLayout role="ADMIN" activePath="/admin/owners">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              待审核业主
              <span className="text-sm font-normal text-gray-500">
                ({pendingOwners.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : pendingOwners.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无待审核业主
              </div>
            ) : (
              <div className="space-y-3">
                {pendingOwners.map((owner) => (
                  <div
                    key={owner.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                        <User className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium">{owner.name}</p>
                        <p className="text-sm text-gray-500">{owner.email}</p>
                        <p className="text-sm text-gray-500">
                          房号：{owner.ownerProfile?.roomNumber}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          注册时间：{formatDate(owner.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleApprove(owner.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        通过
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleReject(owner.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        拒绝
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>已通过业主 ({approvedOwners.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {approvedOwners.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无已通过业主
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {approvedOwners.map((owner) => (
                  <div
                    key={owner.id}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {owner.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {owner.ownerProfile?.roomNumber}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {rejectedOwners.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>已拒绝业主 ({rejectedOwners.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {rejectedOwners.map((owner) => (
                  <div
                    key={owner.id}
                    className="flex items-center gap-3 p-3 border border-red-200 bg-red-50/30 rounded-lg"
                  >
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {owner.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {owner.email}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleApprove(owner.id)}
                    >
                      恢复
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </SidebarLayout>
  );
}
