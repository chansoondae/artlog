/**
 * 브라우저 네이티브 재생 + Canvas + MediaRecorder로
 * HEVC 등 ffmpeg.wasm 미지원 코덱 영상을 H.264 Blob으로 변환
 */
export async function transcodeToH264(
  file: File,
  startSec: number,
  durationSec: number,
  onProgress?: (p: number) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.src = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      video.currentTime = startSec;
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d")!;

      // MediaRecorder로 캡처
      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")
        ? "video/mp4;codecs=avc1"
        : MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
        ? "video/webm;codecs=vp8"
        : "video/webm";

      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        URL.revokeObjectURL(video.src);
        resolve(new Blob(chunks, { type: mimeType }));
      };
      recorder.onerror = (e) => reject(e);

      recorder.start(100);
      video.play();

      let elapsed = 0;
      const interval = setInterval(() => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        elapsed += 1 / 30;
        onProgress?.(Math.min(Math.round((elapsed / durationSec) * 100), 99));
        if (elapsed >= durationSec) {
          clearInterval(interval);
          video.pause();
          recorder.stop();
        }
      }, 1000 / 30);
    };

    video.onerror = () => reject(new Error("영상 로드 실패"));
  });
}
