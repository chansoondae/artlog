/**
 * Canvas로 영상 첫 프레임을 JPEG으로 추출 (ffmpeg 불필요)
 */
export async function extractThumbnail(file: File | Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.src = URL.createObjectURL(file);

    video.onloadeddata = () => {
      video.currentTime = 0;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d")!.drawImage(video, 0, 0);
        URL.revokeObjectURL(video.src);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("썸네일 추출 실패"));
        }, "image/jpeg", 0.8);
      } catch (e) {
        reject(e);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("영상 로드 실패"));
    };
  });
}
