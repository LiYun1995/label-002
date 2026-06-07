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

    const { reason } = await request.json();

    if (!reason) {
      return NextResponse.json(
        { error: "请填写拒单原因" },
        { status: 400 }
      );
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
        { error: "当前状态不可拒单" },
        { status: 400 }
      );
    }

    const updatedRequest = await prisma.repairRequest.update({
      where: { id: params.id },
      data: {
        status: "PENDING_ASSIGN",
        workerId: null,
        assignedAt: null,
        rejectReason: reason,
        statusLogs: {
          create: {
            fromStatus: "ASSIGNED",
            toStatus: "PENDING_ASSIGN",
            remark: `维修工拒单，原因：${reason}`,
          },
        },
      },
    });

    await prisma.notification.createMany({
      data: [
        {
          userId: repairRequest.ownerId,
          title: "工单状态更新",
          message: `您的报修单「${repairRequest.title}」已退回待派单状态`,
          type: "STATUS_UPDATE",
          requestId: params.id,
        },
      ],
    });

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
    });

    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        title: "工单被拒",
        message: `工单「${repairRequest.title}」被维修工拒单，请重新派单`,
        type: "REJECTED",
        requestId: params.id,
      })),
    });

    return NextResponse.json({
      message: "已拒单，工单已退回待派单",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Reject repair request error:", error);
    return NextResponse.json(
      { error: "拒单失败，请稍后重试" },
      { status: 500 }
    );
  }
}
