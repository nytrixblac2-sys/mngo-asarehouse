import { NextResponse } from "next/server";

/** context/03-code-standards.md "API Routes": "Return consistent response shapes: { data, error }." */
export function apiSuccess<T>(data: T) {
  return NextResponse.json({ data, error: null });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ data: null, error: message }, { status });
}
