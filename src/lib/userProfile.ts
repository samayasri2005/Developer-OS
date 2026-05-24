import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase";

export const APP_ID = "developer-os";
export const DEFAULT_SENDER_EMAIL = "samayasri2005@gmail.com";
export const DEFAULT_RECIPIENT_EMAIL = "avenger3202@gmail.com";

export type AppNotificationPreferences = {
  enabled: boolean;
  recipientEmail: string;
  triggers: Record<string, boolean>;
};

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  emailVerified: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
  lastLoginAt?: unknown;
  appAccess: Record<string, boolean>;
  notificationPreferences: {
    senderEmail: string;
    defaultRecipientEmail: string;
    apps: Record<string, AppNotificationPreferences>;
  };
  apiKeys?: {
    vercel?: string;
    github?: string;
  };
};

export const getDefaultAppPreferences = (): AppNotificationPreferences => ({
  enabled: true,
  recipientEmail: DEFAULT_RECIPIENT_EMAIL,
  triggers: {
    taskReminders: true,
    buildAlerts: true,
    notesDigest: false,
  },
});

const getDefaultProfile = (user: User) => ({
  uid: user.uid,
  email: user.email ?? "",
  displayName: user.displayName ?? "",
  photoURL: user.photoURL ?? "",
  emailVerified: user.emailVerified,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  lastLoginAt: serverTimestamp(),
  appAccess: {
    [APP_ID]: true,
  },
  notificationPreferences: {
    senderEmail: DEFAULT_SENDER_EMAIL,
    defaultRecipientEmail: DEFAULT_RECIPIENT_EMAIL,
    apps: {
      [APP_ID]: getDefaultAppPreferences(),
    },
  },
});

export const ensureUserProfile = async (user: User): Promise<UserProfile> => {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const profile = getDefaultProfile(user);
    await setDoc(ref, profile);
    const created = await getDoc(ref);
    return created.data() as UserProfile;
  }

  const data = snap.data() as UserProfile;
  const updates: Record<string, unknown> = {
    email: user.email ?? data.email ?? "",
    displayName: user.displayName ?? data.displayName ?? "",
    photoURL: user.photoURL ?? data.photoURL ?? "",
    emailVerified: user.emailVerified,
    lastLoginAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    [`appAccess.${APP_ID}`]: true,
  };

  if (!data.notificationPreferences?.apps?.[APP_ID]) {
    updates[`notificationPreferences.apps.${APP_ID}`] = getDefaultAppPreferences();
  }

  if (!data.notificationPreferences?.senderEmail) {
    updates["notificationPreferences.senderEmail"] = DEFAULT_SENDER_EMAIL;
  }

  if (!data.notificationPreferences?.defaultRecipientEmail) {
    updates["notificationPreferences.defaultRecipientEmail"] = DEFAULT_RECIPIENT_EMAIL;
  }

  await updateDoc(ref, updates);
  const updated = await getDoc(ref);
  return updated.data() as UserProfile;
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
};

export const updateAppNotificationPreferences = async (
  uid: string,
  preferences: Partial<AppNotificationPreferences>,
) => {
  const updates: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (typeof preferences.enabled === "boolean") {
    updates[`notificationPreferences.apps.${APP_ID}.enabled`] = preferences.enabled;
  }

  if (typeof preferences.recipientEmail === "string") {
    updates[`notificationPreferences.apps.${APP_ID}.recipientEmail`] = preferences.recipientEmail;
    updates["notificationPreferences.defaultRecipientEmail"] = preferences.recipientEmail;
  }

  if (preferences.triggers) {
    for (const [key, value] of Object.entries(preferences.triggers)) {
      updates[`notificationPreferences.apps.${APP_ID}.triggers.${key}`] = value;
    }
  }

  await updateDoc(doc(db, "users", uid), updates);
};

export const updateApiKeys = async (
  uid: string,
  keys: { vercel?: string; github?: string },
) => {
  const updates: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (keys.vercel !== undefined) {
    updates["apiKeys.vercel"] = keys.vercel;
  }
  if (keys.github !== undefined) {
    updates["apiKeys.github"] = keys.github;
  }

  await updateDoc(doc(db, "users", uid), updates);
};
