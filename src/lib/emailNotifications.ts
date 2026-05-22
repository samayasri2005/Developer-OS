import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

type TestPayload = {
  appId: string;
  appName: string;
  recipientEmail?: string;
};

export const sendNotificationTestEmail = async (payload: TestPayload) => {
  const callable = httpsCallable(functions, "sendNotificationTestEmail");
  return callable(payload);
};
