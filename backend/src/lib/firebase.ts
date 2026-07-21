import { readFileSync } from "fs";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { env } from "../config/env";

let firestore: Firestore | null = null;

export function getChatFirestore(): Firestore {
  if (firestore) return firestore;

  if (!env.firebaseServiceAccountPath) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_PATH is not set — chat requires a Firebase service account key. See README for setup."
    );
  }

  if (getApps().length === 0) {
    const serviceAccount = JSON.parse(readFileSync(env.firebaseServiceAccountPath, "utf-8"));
    initializeApp({ credential: cert(serviceAccount) });
  }

  firestore = getFirestore();
  return firestore;
}
