import admin from "firebase-admin";
import serviceAccount from "../../google-credentials.json" with { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: serviceAccount.project_id,
    privateKey: serviceAccount.private_key,
    clientEmail: serviceAccount.client_email,
  }),
});

export const auth = admin.auth();
