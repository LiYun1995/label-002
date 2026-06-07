"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/Card";
import { Button } from "@/components/Button";
import { Textarea } from "@/components/Input";
import { Star } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: { id: string };
}

export default function InspectPage({ params }: PageProps) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating < 1 || rating > 5) {
      toast.error("请选择评分");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/repair-requests/${params.id}/inspect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("验收成功，感谢您的评价");
        router.push(`/owner/requests/${params.id}`);
      } else {
        toast.error(data.error || "验收失败");
      }
    } catch (error) {
      toast.error("验收失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarLayout role="OWNER" activePath="/owner/requests">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href={`/owner/requests/${params.id}`}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← 返回详情
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>维修验收</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              请对本次维修服务进行评价
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  服务评分
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="p-1 focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          star <= (hoveredRating || rating)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {rating} 星
                  </span>
                </div>
              </div>

              <Textarea
                label="评价内容（可选）"
                placeholder="请分享您对本次维修服务的感受..."
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.back()}
                >
                  取消
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "提交中..." : "确认验收"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
