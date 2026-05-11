// Firestore 컬렉션 경로
export const COLLECTIONS = {
  users: "artlog_users",
  rooms: "artlog_rooms",
} as const;

// Firestore 서브컬렉션 이름
export const SUBCOLLECTIONS = {
  members: "members",
  logs: "logs",
} as const;

// Storage 경로 생성 헬퍼
export const STORAGE_PATHS = {
  clip: (roomId: string, dayKey: string, logId: string) =>
    `artlog_clips/${roomId}/${dayKey}/${logId}.mp4`,
  thumb: (roomId: string, dayKey: string, logId: string) =>
    `artlog_thumbs/${roomId}/${dayKey}/${logId}.jpg`,
  export: (roomId: string, dayKey: string) =>
    `artlog_exports/${roomId}/${dayKey}.mp4`,
  avatar: (uid: string) => `artlog_avatars/${uid}.jpg`,
} as const;
