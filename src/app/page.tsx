import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  switch (session.user.role) {
    case "OWNER":
      redirect("/owner/dashboard");
    case "ADMIN":
      redirect("/admin/dashboard");
    case "WORKER":
      redirect("/worker/dashboard");
    default:
      redirect("/login");
  }
}
