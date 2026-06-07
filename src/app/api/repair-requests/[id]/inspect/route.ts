import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { rating, comment } = await request.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "请选择有效评分" },
        { status: 400 }
      );
    }

    const repairRequest = await prisma.repairRequest.findUnique({
      where: { id: params.id },
    });

    if (!repairRequest) {
      return NextResponse.json({ error: "报修单不存在" }, { status: 404 });
    }

    if (repairRequest.ownerId !== session.user.id) {
      return NextResponse.json({ error: "无权限操作" }, { status: 403 });
    }

    if (repairRequest.status !== "PENDING_INSPECTION") {
      return NextResponse.json(
        { error: "当前状态不可验收" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.repairRequest.update({
        where: { id: params.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          statusLogs: {
            create: {
              fromStatus: "PENDING_INSPECTION",
              toStatus: "COMPLETED",
              remark: "业主验收通过，工单完成",
            },
          },
        },
      });

      const review = await tx.review.create({
        data: {
          requestId: params.id,
          rating,
          comment,
          ownerId: session.user.id,
          workerId: repairRequest.workerId!,
        },
      });

      return { request: updatedRequest, review };
    });

    if (repairRequest.workerId) {
      await prisma.notification.create({
        data: {
          userId: repairRequest.workerId,
          title: "工单已验收完成",
          message: `您负责的工单「${repairRequest.title}」业主已验收通过，评分：${rating}星`,
          type: "INSPECTION_PASSED",
          requestId: params.id,
        },
      });
    }

    return NextResponse.json({
      message: "验收成功",
      ...result,
    });
  } catch (error) {
    console.error("Inspect repair request error:", error);
    return NextResponse.json(
      { error: "验收失败，请稍后重试" },
      { status: 500 }
    );
  }
}
