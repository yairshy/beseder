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
  deleteDoc,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import type { StatusId } from "@/constants/statuses";

export interface UserDoc {
  phoneNumber: string;
  displayName: string;
  photoURL: string | null;
  familyId: string | null; // deprecated — kept for migration
  familyIds: string[];
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
    familyIds: [],
    pushSubscription: null,
    language: "he",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getUser(userId: string): Promise<UserDoc | null> {
  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) return null;
  const data = snap.data() as UserDoc;
  // Migration: if old familyId exists but familyIds is empty, migrate
  if (data.familyId && (!data.familyIds || data.familyIds.length === 0)) {
    data.familyIds = [data.familyId];
    await updateDoc(doc(db, "users", userId), { familyIds: [data.familyId] });
  }
  if (!data.familyIds) data.familyIds = [];
  return data;
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
  await updateDoc(doc(db, "users", userId), {
    familyId: familyRef.id,
    familyIds: arrayUnion(familyRef.id),
    updatedAt: serverTimestamp(),
  });
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
  await updateDoc(doc(db, "users", userId), {
    familyId: familyDoc.id,
    familyIds: arrayUnion(familyDoc.id),
    updatedAt: serverTimestamp(),
  });
  return familyDoc.id;
}

export async function leaveFamily(userId: string, familyId: string) {
  await updateDoc(doc(db, "families", familyId), {
    memberIds: arrayRemove(userId),
  });
  // Remove the user's latest status and push subscription
  await deleteDoc(doc(db, "families", familyId, "latestStatus", userId));
  await deleteDoc(doc(db, "families", familyId, "pushSubscriptions", userId)).catch(() => {});
  // Remove from familyIds array
  await updateDoc(doc(db, "users", userId), {
    familyIds: arrayRemove(familyId),
    updatedAt: serverTimestamp(),
  });
  // Update familyId to the next available family or null
  const userDoc = await getUser(userId);
  const remainingFamilies = userDoc?.familyIds?.filter((id) => id !== familyId) || [];
  await updateDoc(doc(db, "users", userId), {
    familyId: remainingFamilies.length > 0 ? remainingFamilies[0] : null,
  });
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

/** Report status to ALL families the user belongs to */
export async function reportStatusToAll(
  familyIds: string[],
  userId: string,
  userName: string,
  userPhotoURL: string | null,
  status: StatusId,
  message: string | null,
  photoURL: string | null
) {
  await Promise.all(
    familyIds.map((fid) =>
      reportStatus(fid, userId, userName, userPhotoURL, status, message, photoURL)
    )
  );
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
    },
    (error) => {
      console.error("Firestore listener error:", error);
    }
  );
}

export async function requestCheckIn(
  familyId: string,
  requestedBy: string,
  requestedByName: string
) {
  // Write a single "lastCheckInRequest" doc that gets overwritten each time
  await setDoc(doc(db, "families", familyId, "meta", "lastCheckInRequest"), {
    requestedBy,
    requestedByName,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToPendingCheckIn(
  familyId: string,
  currentUserId: string,
  callback: (pending: { requestedByName: string; requestedAt: Timestamp } | null) => void
): Unsubscribe {
  // Listen to the last check-in request
  const requestUnsub = onSnapshot(
    doc(db, "families", familyId, "meta", "lastCheckInRequest"),
    (requestSnap) => {
      if (!requestSnap.exists()) {
        callback(null);
        return;
      }
      const request = requestSnap.data();
      if (!request.createdAt || request.requestedBy === currentUserId) {
        callback(null);
        return;
      }

      // Check if this user's latest status is newer than the request
      const statusUnsub = onSnapshot(
        doc(db, "families", familyId, "latestStatus", currentUserId),
        (statusSnap) => {
          const requestTime = request.createdAt as Timestamp;
          if (statusSnap.exists()) {
            const status = statusSnap.data();
            const statusTime = status.updatedAt as Timestamp;
            if (statusTime && statusTime.toMillis() > requestTime.toMillis()) {
              // User already reported after the request
              callback(null);
              return;
            }
          }
          // Pending: request exists and user hasn't reported since
          callback({
            requestedByName: request.requestedByName,
            requestedAt: requestTime,
          });
        },
        (error) => console.error("Status check error:", error)
      );

      // Clean up inner listener when outer changes
      return () => statusUnsub();
    },
    (error) => console.error("Check-in request listener error:", error)
  );

  return requestUnsub;
}

/** Save push subscription to all families the user belongs to */
export async function savePushSubscriptionToFamilies(
  userId: string,
  familyIds: string[],
  subscription: string
) {
  await Promise.all(
    familyIds.map((fid) =>
      setDoc(doc(db, "families", fid, "pushSubscriptions", userId), {
        subscription,
        updatedAt: serverTimestamp(),
      })
    )
  );
}

/** Remove push subscription from a family when leaving */
export async function removePushSubscriptionFromFamily(
  userId: string,
  familyId: string
) {
  await deleteDoc(doc(db, "families", familyId, "pushSubscriptions", userId));
}

/** Get push subscriptions for all family members (excluding a specific user) */
export async function getFamilyPushSubscriptions(
  familyIds: string[],
  excludeUserId: string
): Promise<string[]> {
  const subscriptions: string[] = [];
  const seen = new Set<string>();

  for (const fid of familyIds) {
    const snap = await getDocs(collection(db, "families", fid, "pushSubscriptions"));
    snap.forEach((docSnap) => {
      if (docSnap.id !== excludeUserId && !seen.has(docSnap.id)) {
        seen.add(docSnap.id);
        const data = docSnap.data();
        if (data.subscription) {
          subscriptions.push(data.subscription);
        }
      }
    });
  }

  return subscriptions;
}
