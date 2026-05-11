import { fetchFile } from "@ffmpeg/util";
import { getFFmpeg } from "./loader";

export async function trimTo2Seconds(
  file: File,
  startSec: number,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const ff = await getFFmpeg();

  if (onProgress) {
    ff.on("progress", ({ progress }) => {
      onProgress(Math.min(Math.round(progress * 100), 99));
    });
  }

  await ff.writeFile("input.mp4", await fetchFile(file));

  await ff.exec([
    "-ss", String(startSec),
    "-i", "input.mp4",
    "-t", "2",
    "-c:v", "libx264",
    "-c:a", "aac",
    "-preset", "ultrafast",
    "-movflags", "+faststart",
    "output.mp4",
  ]);

  const data = await ff.readFile("output.mp4");
  await ff.deleteFile("input.mp4");
  await ff.deleteFile("output.mp4");

  const buffer = data instanceof Uint8Array ? data.buffer.slice(0) : data;
  return new Blob([buffer as ArrayBuffer], { type: "video/mp4" });
}
