import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/** Next.js 16: `proxy.ts` wird als Middleware geladen — nur Durchleiten (kein Login). */
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url))
  }
  return NextResponse.next()
}
