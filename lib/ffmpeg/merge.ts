import { fetchFile } from "@ffmpeg/util";
import { getFFmpeg } from "./loader";

export interface MergeInput {
  url: string;
  authorName: string;
}

/**
 * 여러 2초 클립을 분할 화면으로 합쳐 하나의 MP4로 반환
 * 최대 6개 지원 (1/2/3/4/6개 그리드)
 */
export async function mergeClips(
  inputs: MergeInput[],
  onProgress?: (p: number) => void
): Promise<Blob> {
  const ff = await getFFmpeg();

  if (onProgress) {
    ff.on("progress", ({ progress }) => {
      onProgress(Math.min(Math.round(progress * 100), 99));
    });
  }

  const n = inputs.length;

  // 각 클립 다운로드 (CORS 우회: fetch → blob → ArrayBuffer)
  for (let i = 0; i < n; i++) {
    const res = await fetch(inputs[i].url);
    const blob = await res.blob();
    const arrayBuffer = await blob.arrayBuffer();
    await ff.writeFile(`clip${i}.mp4`, new Uint8Array(arrayBuffer));
    onProgress?.(Math.round((i + 1) / n * 20));
  }

  // 그리드 레이아웃 결정
  const { cols, rows, w, h } = getGrid(n);
  const outW = cols * w;
  const outH = rows * h;

  // xstack / vstack 필터 생성
  const filterInputs = inputs
    .map((_, i) => `[${i}:v]scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2[v${i}]`)
    .join("; ");

  const stackInputs = inputs.map((_, i) => `[v${i}]`).join("");
  const stackFilter = n === 1
    ? `[v0]copy[out]`
    : `${stackInputs}xstack=inputs=${n}:layout=${buildLayout(n, cols, w, h)}[out]`;

  const filterComplex = `${filterInputs}; ${stackFilter}`;

  const inputArgs = inputs.flatMap((_, i) => ["-i", `clip${i}.mp4`]);

  await ff.exec([
    ...inputArgs,
    "-filter_complex", filterComplex,
    "-map", "[out]",
    "-t", "2",
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-crf", "28",
    "-movflags", "+faststart",
    "-an",
    "merged.mp4",
  ]);

  const data = await ff.readFile("merged.mp4");

  // 정리
  for (let i = 0; i < n; i++) await ff.deleteFile(`clip${i}.mp4`);
  await ff.deleteFile("merged.mp4");

  const buffer = data instanceof Uint8Array ? data.buffer.slice(0) : data;
  return new Blob([buffer as ArrayBuffer], { type: "video/mp4" });
}

function getGrid(n: number): { cols: number; rows: number; w: number; h: number } {
  // 출력 해상도 720x720 기준
  if (n === 1) return { cols: 1, rows: 1, w: 720, h: 720 };
  if (n === 2) return { cols: 2, rows: 1, w: 360, h: 640 };
  if (n === 3) return { cols: 3, rows: 1, w: 240, h: 426 };
  if (n === 4) return { cols: 2, rows: 2, w: 360, h: 360 };
  if (n === 5) return { cols: 3, rows: 2, w: 240, h: 240 };
  return      { cols: 3, rows: 2, w: 240, h: 240 }; // 6
}

function buildLayout(n: number, cols: number, w: number, h: number): string {
  const positions: string[] = [];
  for (let i = 0; i < n; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions.push(`${col * w}_${row * h}`);
  }
  return positions.join("|");
}
