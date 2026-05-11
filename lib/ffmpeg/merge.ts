import { getFFmpeg } from "./loader";

export interface MergeInput {
  url: string;
  authorName: string;
  caption?: string;
}

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

  // 폰트 로드 (NotoSansKR 서브셋)
  const fontRes = await fetch("https://fonts.gstatic.com/s/notosanskr/v36/PbyxFmXiEBPT4ITbgNA5Cgm20xz64px_1hVWr0wuPNGmlQNMEfD4.0.woff2");
  if (fontRes.ok) {
    const fontBuf = await fontRes.arrayBuffer();
    await ff.writeFile("font.ttf", new Uint8Array(fontBuf));
  }

  // 각 클립 다운로드
  for (let i = 0; i < n; i++) {
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(inputs[i].url)}`;
    const res = await fetch(proxyUrl);
    const arrayBuffer = await res.arrayBuffer();
    await ff.writeFile(`clip${i}.mp4`, new Uint8Array(arrayBuffer));
    onProgress?.(Math.round((i + 1) / n * 20));
  }

  const { cols, w, h } = getGrid(n);

  // scale + drawtext 필터
  const hasFontFile = fontRes.ok;
  const filterInputs = inputs
    .map((inp, i) => {
      const name = inp.authorName.replace(/'/g, "");
      const caption = (inp.caption ?? "").replace(/'/g, "");
      const fontSize = Math.max(10, Math.floor(w / 12));
      const fontFile = hasFontFile ? `:fontfile=font.ttf` : "";

      const nameText = `drawtext=text='${name}'${fontFile}:fontcolor=white:fontsize=${fontSize}:x=8:y=h-${fontSize * 2 + 10}:shadowcolor=black:shadowx=1:shadowy=1`;
      const captionText = caption
        ? `drawtext=text='${caption}'${fontFile}:fontcolor=white@0.85:fontsize=${Math.max(8, fontSize - 2)}:x=8:y=h-${fontSize + 4}:shadowcolor=black:shadowx=1:shadowy=1`
        : "";

      const textFilters = captionText
        ? `${nameText},${captionText}`
        : nameText;

      return `[${i}:v]fps=30,scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,${textFilters}[v${i}]`;
    })
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
    "-r", "30",
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-crf", "28",
    "-movflags", "+faststart",
    "-an",
    "merged.mp4",
  ]);

  const data = await ff.readFile("merged.mp4");

  for (let i = 0; i < n; i++) await ff.deleteFile(`clip${i}.mp4`);
  await ff.deleteFile("merged.mp4");
  try { await ff.deleteFile("font.ttf"); } catch {}

  const buffer = data instanceof Uint8Array ? data.buffer.slice(0) : data;
  return new Blob([buffer as ArrayBuffer], { type: "video/mp4" });
}

function getGrid(n: number): { cols: number; rows: number; w: number; h: number } {
  if (n === 1) return { cols: 1, rows: 1, w: 720, h: 720 };
  if (n === 2) return { cols: 2, rows: 1, w: 360, h: 640 };
  if (n === 3) return { cols: 3, rows: 1, w: 240, h: 426 };
  if (n === 4) return { cols: 2, rows: 2, w: 360, h: 360 };
  if (n === 5) return { cols: 3, rows: 2, w: 240, h: 240 };
  return { cols: 3, rows: 2, w: 240, h: 240 };
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
