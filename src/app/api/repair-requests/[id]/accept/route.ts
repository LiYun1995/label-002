import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "WORKER") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const repairRequest = await prisma.repairRequest.findUnique({
      where: { id: params.id },
    });

    if (!repairRequest) {
      return NextResponse.json({ error: "报修单不存在" }, { status: 404 });
    }

    if (repairRequest.workerId !== session.user.id) {
      return NextResponse.json({ error: "无权限操作" }, { status: 403 });
    }

    if (repairRequest.status !== "ASSIGNED") {
      return NextResponse.json(
        { error: "当前状态不可接单" },
        { status: 400 }
      );
    }

    const updatedRequest = await prisma.repairRequest.update({
      where: { id: params.id },
      data: {
        status: "IN_PROGRESS",
        statusLogs: {
          create: {
            fromStatus: "ASSIGNED",
            toStatus: "IN_PROGRESS",
            remark: "维修工已接单",
          },
        },
      },
    });

    await prisma.notification.create({
      data: {
        userId: repairRequest.ownerId,
        title: "维修已开始",
        message: `您的报修单「${repairRequest.title}」维修工已接单开始维修`,
        type: "REPAIR_STARTED",
        requestId: params.id,
      },
    });

    return NextResponse.json({
      message: "接单成功",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Accept repair request error:", error);
    return NextResponse.json(
      { error: "接单失败，请稍后重试" },
      { status: 500 }
    );
  }
}
