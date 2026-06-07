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

    const { description, photos } = await request.json();

    const repairRequest = await prisma.repairRequest.findUnique({
      where: { id: params.id },
    });

    if (!repairRequest) {
      return NextResponse.json({ error: "报修单不存在" }, { status: 404 });
    }

    if (repairRequest.workerId !== session.user.id) {
      return NextResponse.json({ error: "无权限操作" }, { status: 403 });
    }

    if (repairRequest.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "当前状态不可完成" },
        { status: 400 }
      );
    }

    const photoData = (photos || []).slice(0, 3).map((url: string) => ({
      url,
      type: "AFTER",
    }));

    const updatedRequest = await prisma.repairRequest.update({
      where: { id: params.id },
      data: {
        status: "PENDING_INSPECTION",
        statusLogs: {
          create: {
            fromStatus: "IN_PROGRESS",
            toStatus: "PENDING_INSPECTION",
            remark: description || "维修完成，等待业主验收",
          },
        },
        photos: {
          create: photoData,
        },
      },
      include: {
        photos: true,
      },
    });

    await prisma.notification.create({
      data: {
        userId: repairRequest.ownerId,
        title: "维修已完成，请验收",
        message: `您的报修单「${repairRequest.title}」已维修完成，请前往验收`,
        type: "REPAIR_COMPLETED",
        requestId: params.id,
      },
    });

    return NextResponse.json({
      message: "维修完成，已通知业主验收",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Complete repair request error:", error);
    return NextResponse.json(
      { error: "操作失败，请稍后重试" },
      { status: 500 }
    );
  }
}
