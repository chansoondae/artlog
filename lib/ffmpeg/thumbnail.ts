import { fetchFile } from "@ffmpeg/util";
import { getFFmpeg } from "./loader";

export async function extractThumbnail(file: File | Blob): Promise<Blob> {
  const ff = await getFFmpeg();

  const inputName = "thumb_input.mp4";
  await ff.writeFile(inputName, await fetchFile(file));

  await ff.exec([
    "-i", inputName,
    "-ss", "0",
    "-frames:v", "1",
    "-q:v", "2",
    "thumb.jpg",
  ]);

  const data = await ff.readFile("thumb.jpg");
  await ff.deleteFile(inputName);
  await ff.deleteFile("thumb.jpg");

  const buffer = data instanceof Uint8Array ? data.buffer.slice(0) : data;
  return new Blob([buffer as ArrayBuffer], { type: "image/jpeg" });
}
