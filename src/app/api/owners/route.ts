import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let where: any = {
      role: "OWNER",
    };

    if (status) {
      where.ownerProfile = {
        status,
      };
    }

    const owners = await prisma.user.findMany({
      where,
      include: {
        ownerProfile: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ owners });
  } catch (error) {
    console.error("Get owners error:", error);
    return NextResponse.json(
      { error: "获取失败，请稍后重试" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { userId, status } = await request.json();

    if (!userId || !status) {
      return NextResponse.json(
        { error: "参数不完整" },
        { status: 400 }
      );
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "无效的状态" },
        { status: 400 }
      );
    }

    const ownerProfile = await prisma.ownerProfile.findUnique({
      where: { userId },
    });

    if (!ownerProfile) {
      return NextResponse.json(
        { error: "业主不存在" },
        { status: 404 }
      );
    }

    const updated = await prisma.ownerProfile.update({
      where: { userId },
      data: { status },
    });

    return NextResponse.json({
      message: status === "APPROVED" ? "审核通过" : "已拒绝",
      profile: updated,
    });
  } catch (error) {
    console.error("Update owner status error:", error);
    return NextResponse.json(
      { error: "操作失败，请稍后重试" },
      { status: 500 }
    );
  }
}
