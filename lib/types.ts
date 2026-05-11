import { Timestamp } from "firebase/firestore";

export interface UserDoc {
  displayName: string;
  photoURL: string | null;
  createdAt: Timestamp;
}

export interface Room {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  memberIds: string[];
  maxMembers: number;
  dayStartHour: number;
  defaultVenue: string | null;
  createdAt: Timestamp;
}

export interface RoomMember {
  displayName: string;
  photoURL: string | null;
  joinedAt: Timestamp;
  role: "owner" | "member";
}

export interface Log {
  id: string;
  authorId: string;
  authorName: string;
  videoUrl: string;
  videoPath: string;
  thumbnailUrl: string | null;
  caption: string;
  artworkTitle: string | null;
  artworkArtist: string | null;
  venue: string | null;
  dayKey: string;
  duration: number;
  createdAt: Timestamp;
}
