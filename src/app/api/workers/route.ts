import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get("specialty");

    let where: any = {
      role: "WORKER",
    };

    if (specialty) {
      where.workerProfile = {
        specialty,
      };
    }

    const workers = await prisma.user.findMany({
      where,
      include: {
        workerProfile: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ workers });
  } catch (error) {
    console.error("Get workers error:", error);
    return NextResponse.json(
      { error: "获取失败，请稍后重试" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { name, email, password, specialty, phone } = await request.json();

    if (!name || !email || !password || !specialty) {
      return NextResponse.json(
        { error: "请填写所有必填字段" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "该邮箱已被使用" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const worker = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "WORKER",
        workerProfile: {
          create: {
            specialty,
            phone: phone || null,
          },
        },
      },
      include: {
        workerProfile: true,
      },
    });

    return NextResponse.json(
      { message: "维修工添加成功", worker },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create worker error:", error);
    return NextResponse.json(
      { error: "添加失败，请稍后重试" },
      { status: 500 }
    );
  }
}
