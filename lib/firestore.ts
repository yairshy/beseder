import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  addDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import type { StatusId } from "@/constants/statuses";

export interface UserDoc {
  phoneNumber: string;
  displayName: string;
  photoURL: string | null;
  familyId: string | null;
  pushSubscription: string | null;
  language: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FamilyDoc {
  name: string;
  createdBy: string;
  inviteCode: string;
  memberIds: string[];
  createdAt: Timestamp;
}

export interface LatestStatusDoc {
  status: StatusId;
  message: string | null;
  photoURL: string | null;
  updatedAt: Timestamp;
  userName: string;
  userPhotoURL: string | null;
}

export interface StatusReportDoc {
  userId: string;
  userName: string;
  status: StatusId;
  message: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createUser(
  userId: string,
  phoneNumber: string,
  displayName: string
) {
  await setDoc(doc(db, "users", userId), {
    phoneNumber,
    displayName,
    photoURL: null,
    familyId: null,
    pushSubscription: null,
    language: "he",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getUser(userId: string): Promise<UserDoc | null> {
  const snap = await getDoc(doc(db, "users", userId));
  return snap.exists() ? (snap.data() as UserDoc) : null;
}

export async function updateUser(
  userId: string,
  data: Partial<UserDoc>
) {
  await updateDoc(doc(db, "users", userId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function createFamily(
  userId: string,
  familyName: string
): Promise<string> {
  const inviteCode = generateInviteCode();
  const familyRef = await addDoc(collection(db, "families"), {
    name: familyName,
    createdBy: userId,
    inviteCode,
    memberIds: [userId],
    createdAt: serverTimestamp(),
  });
  await updateUser(userId, { familyId: familyRef.id });
  return familyRef.id;
}

export async function joinFamily(
  userId: string,
  inviteCode: string
): Promise<string | null> {
  const q = query(
    collection(db, "families"),
    where("inviteCode", "==", inviteCode.toUpperCase())
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const familyDoc = snap.docs[0];
  await updateDoc(familyDoc.ref, {
    memberIds: arrayUnion(userId),
  });
  await updateUser(userId, { familyId: familyDoc.id });
  return familyDoc.id;
}

export async function leaveFamily(userId: string, familyId: string) {
  await updateDoc(doc(db, "families", familyId), {
    memberIds: arrayRemove(userId),
  });
  await updateUser(userId, { familyId: null });
}

export async function getFamily(
  familyId: string
): Promise<FamilyDoc | null> {
  const snap = await getDoc(doc(db, "families", familyId));
  return snap.exists() ? (snap.data() as FamilyDoc) : null;
}

export async function reportStatus(
  familyId: string,
  userId: string,
  userName: string,
  userPhotoURL: string | null,
  status: StatusId,
  message: string | null,
  photoURL: string | null
) {
  await addDoc(collection(db, "families", familyId, "statusReports"), {
    userId,
    userName,
    status,
    message,
    photoURL,
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "families", familyId, "latestStatus", userId), {
    status,
    message,
    photoURL,
    updatedAt: serverTimestamp(),
    userName,
    userPhotoURL,
  });
}

export function subscribeToFamilyStatus(
  familyId: string,
  callback: (statuses: Record<string, LatestStatusDoc>) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, "families", familyId, "latestStatus"),
    (snapshot) => {
      const statuses: Record<string, LatestStatusDoc> = {};
      snapshot.forEach((doc) => {
        statuses[doc.id] = doc.data() as LatestStatusDoc;
      });
      callback(statuses);
    }
  );
}

export async function requestCheckIn(
  familyId: string,
  requestedBy: string
) {
  await addDoc(collection(db, "families", familyId, "checkInRequests"), {
    requestedBy,
    createdAt: serverTimestamp(),
  });
}
