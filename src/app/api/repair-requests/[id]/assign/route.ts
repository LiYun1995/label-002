import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { workerId, expectedDeadline } = await request.json();

    if (!workerId) {
      return NextResponse.json(
        { error: "请选择维修工" },
        { status: 400 }
      );
    }

    const repairRequest = await prisma.repairRequest.findUnique({
      where: { id: params.id },
    });

    if (!repairRequest) {
      return NextResponse.json({ error: "报修单不存在" }, { status: 404 });
    }

    if (repairRequest.status !== "PENDING_ASSIGN") {
      return NextResponse.json(
        { error: "当前状态不可派单" },
        { status: 400 }
      );
    }

    const worker = await prisma.user.findUnique({
      where: { id: workerId },
      include: { workerProfile: true },
    });

    if (!worker || worker.role !== "WORKER") {
      return NextResponse.json(
        { error: "维修工不存在" },
        { status: 400 }
      );
    }

    const updatedRequest = await prisma.repairRequest.update({
      where: { id: params.id },
      data: {
        workerId,
        status: "ASSIGNED",
        assignedAt: new Date(),
        expectedDeadline: expectedDeadline
          ? new Date(expectedDeadline)
          : null,
        statusLogs: {
          create: {
            fromStatus: "PENDING_ASSIGN",
            toStatus: "ASSIGNED",
            remark: `管理员派单给 ${worker.name}`,
          },
        },
      },
      include: {
        worker: true,
      },
    });

    await prisma.notification.create({
      data: {
        userId: workerId,
        title: "新的维修工单",
        message: `您有一个新的维修工单：${repairRequest.title}`,
        type: "NEW_ASSIGNMENT",
        requestId: params.id,
      },
    });

    return NextResponse.json({
      message: "派单成功",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Assign repair request error:", error);
    return NextResponse.json(
      { error: "派单失败，请稍后重试" },
      { status: 500 }
    );
  }
}
