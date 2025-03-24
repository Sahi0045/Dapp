import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default async function Home() {
  const cookieStore = await cookies()
  const authStatus = cookieStore.get("auth-status")
  const isAuthenticated = authStatus?.value === "authenticated"

  // Always redirect to login if not authenticated
  if (!isAuthenticated) {
    redirect("/login")
  }

  // If authenticated, redirect to dashboard
  redirect("/dashboard")
}

