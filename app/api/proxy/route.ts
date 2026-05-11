import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("url 파라미터 필요", { status: 400 });

  // Firebase Storage URL만 허용
  if (!url.startsWith("https://firebasestorage.googleapis.com/")) {
    return new NextResponse("허용되지 않은 URL", { status: 403 });
  }

  const res = await fetch(url);
  if (!res.ok) return new NextResponse("fetch 실패", { status: res.status });

  const buffer = await res.arrayBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "video/mp4",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
