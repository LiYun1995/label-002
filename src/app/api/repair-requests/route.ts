import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { title, description, roomNumber, type, photos } = await request.json();

    if (!title || !description || !roomNumber || !type) {
      return NextResponse.json(
        { error: "请填写所有必填字段" },
        { status: 400 }
      );
    }

    const repairRequest = await prisma.repairRequest.create({
      data: {
        title,
        description,
        roomNumber,
        type,
        ownerId: session.user.id,
        photos: {
          create: (photos || []).slice(0, 3).map((url: string) => ({
            url,
            type: "BEFORE",
          })),
        },
        statusLogs: {
          create: {
            toStatus: "PENDING_ASSIGN",
            remark: "业主提交报修",
          },
        },
      },
      include: {
        photos: true,
      },
    });

    return NextResponse.json(
      { message: "报修提交成功", request: repairRequest },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create repair request error:", error);
    return NextResponse.json(
      { error: "提交失败，请稍后重试" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const ownerId = searchParams.get("ownerId");
    const workerId = searchParams.get("workerId");

    let where: any = {};

    if (status) {
      where.status = status;
    }

    if (session.user.role === "OWNER") {
      where.ownerId = session.user.id;
    } else if (session.user.role === "WORKER") {
      where.workerId = session.user.id;
    }

    if (ownerId && session.user.role === "ADMIN") {
      where.ownerId = ownerId;
    }

    if (workerId && session.user.role === "ADMIN") {
      where.workerId = workerId;
    }

    const requests = await prisma.repairRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        worker: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        photos: true,
      },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Get repair requests error:", error);
    return NextResponse.json(
      { error: "获取失败，请稍后重试" },
      { status: 500 }
    );
  }
}
