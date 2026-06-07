import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log("开始初始化数据...");

  const adminPassword = await hashPassword("admin123");
  const workerPassword = await hashPassword("worker123");
  const ownerPassword = await hashPassword("owner123");

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "系统管理员",
      email: "admin@example.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("管理员账号已创建:", admin.email);

  const plumber = await prisma.user.upsert({
    where: { email: "plumber@example.com" },
    update: {},
    create: {
      name: "张水工",
      email: "plumber@example.com",
      password: workerPassword,
      role: "WORKER",
      workerProfile: {
        create: {
          specialty: "PLUMBER",
          phone: "13800138001",
        },
      },
    },
  });
  console.log("水工账号已创建:", plumber.email);

  const electrician = await prisma.user.upsert({
    where: { email: "electrician@example.com" },
    update: {},
    create: {
      name: "李电工",
      email: "electrician@example.com",
      password: workerPassword,
      role: "WORKER",
      workerProfile: {
        create: {
          specialty: "ELECTRICIAN",
          phone: "13800138002",
        },
      },
    },
  });
  console.log("电工账号已创建:", electrician.email);

  const mason = await prisma.user.upsert({
    where: { email: "mason@example.com" },
    update: {},
    create: {
      name: "王泥瓦工",
      email: "mason@example.com",
      password: workerPassword,
      role: "WORKER",
      workerProfile: {
        create: {
          specialty: "MASON",
          phone: "13800138003",
        },
      },
    },
  });
  console.log("泥瓦工账号已创建:", mason.email);

  const owner1 = await prisma.user.upsert({
    where: { email: "owner1@example.com" },
    update: {},
    create: {
      name: "业主小明",
      email: "owner1@example.com",
      password: ownerPassword,
      role: "OWNER",
      ownerProfile: {
        create: {
          roomNumber: "1栋1单元101室",
          status: "APPROVED",
        },
      },
    },
  });
  console.log("业主账号已创建:", owner1.email);

  const owner2 = await prisma.user.upsert({
    where: { email: "owner2@example.com" },
    update: {},
    create: {
      name: "业主小红",
      email: "owner2@example.com",
      password: ownerPassword,
      role: "OWNER",
      ownerProfile: {
        create: {
          roomNumber: "2栋3单元502室",
          status: "PENDING",
        },
      },
    },
  });
  console.log("待审核业主账号已创建:", owner2.email);

  console.log("\n数据初始化完成!");
  console.log("\n测试账号:");
  console.log("  管理员: admin@example.com / admin123");
  console.log("  水工: plumber@example.com / worker123");
  console.log("  电工: electrician@example.com / worker123");
  console.log("  泥瓦工: mason@example.com / worker123");
  console.log("  已审核业主: owner1@example.com / owner123");
  console.log("  待审核业主: owner2@example.com / owner123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
