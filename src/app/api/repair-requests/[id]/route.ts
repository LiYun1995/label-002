import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const repairRequest = await prisma.repairRequest.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            ownerProfile: true,
          },
        },
        worker: {
          select: {
            id: true,
            name: true,
            email: true,
            workerProfile: true,
          },
        },
        photos: true,
        review: true,
        statusLogs: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!repairRequest) {
      return NextResponse.json({ error: "报修单不存在" }, { status: 404 });
    }

    if (
      session.user.role === "OWNER" &&
      repairRequest.ownerId !== session.user.id
    ) {
      return NextResponse.json({ error: "无权限查看" }, { status: 403 });
    }

    if (
      session.user.role === "WORKER" &&
      repairRequest.workerId !== session.user.id
    ) {
      return NextResponse.json({ error: "无权限查看" }, { status: 403 });
    }

    return NextResponse.json({ request: repairRequest });
  } catch (error) {
    console.error("Get repair request error:", error);
    return NextResponse.json(
      { error: "获取失败，请稍后重试" },
      { status: 500 }
    );
  }
}
