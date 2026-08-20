import { readFileSync } from "fs";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { env } from "../config/env";

let firestore: Firestore | null = null;

export function getChatFirestore(): Firestore {
  if (firestore) return firestore;

  if (!env.firebaseServiceAccountJson && !env.firebaseServiceAccountPath) {
    throw new Error(
      "Neither FIREBASE_SERVICE_ACCOUNT_JSON nor FIREBASE_SERVICE_ACCOUNT_PATH is set — chat requires a Firebase service account key. See README for setup."
    );
  }

  if (getApps().length === 0) {
    const serviceAccount = env.firebaseServiceAccountJson
      ? JSON.parse(env.firebaseServiceAccountJson)
      : JSON.parse(readFileSync(env.firebaseServiceAccountPath!, "utf-8"));
    initializeApp({ credential: cert(serviceAccount) });
  }

  firestore = getFirestore();
  return firestore;
}
