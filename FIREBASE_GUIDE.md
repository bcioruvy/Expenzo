# Firebase Integration Guide

This application utilizes Firebase Authentication and Cloud Firestore to provide secure, isolated personal finance tracking.

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and give it a name (e.g., `personal-expense-tracker`).
3. Turn on/off Google Analytics as per your preference and click **Create Project**.

## Step 2: Register Your Web Application

1. On the project overview page, click the web icon (`</>`) to add an app.
2. Enter an app nickname (e.g., `expense-tracker-web`) and click **Register app**.
3. You will be presented with your Firebase configuration object containing `apiKey`, `authDomain`, `projectId`, etc.

## Step 3: Configure `src/firebase/config.ts`

Open `src/firebase/config.ts` in your code editor. You will see placeholder strings for each configuration parameter. Replace them with the actual keys from your Firebase Console.

```typescript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

## Step 4: Enable Authentication Methods

1. In the left navigation bar of the Firebase Console, click **Authentication**, then click **Get Started**.
2. Go to the **Sign-in method** tab.
3. Enable **Email/Password** (optionally enable Email link/passwordless sign-in).
4. Enable **Google** sign-in. You will need to configure a support email address.

## Step 5: Setup Cloud Firestore

1. In the left navigation bar, click **Firestore Database**, then click **Create database**.
2. Choose **Production mode** (security rules will protect your data) and select a Cloud Firestore location near you.
3. Once created, go to the **Rules** tab in Firestore.
4. Copy the entire content of the `firestore.rules` file provided in this repository and paste it into the Rules editor, then click **Publish**.

## Step 6: Deploy Indexes

Because the application performs advanced queries (e.g., filtering transactions by `userId` and ordering by `date`), composite indexes are required.

You can deploy the provided `firestore.indexes.json` via the Firebase CLI:
```bash
firebase init firestore
firebase deploy --only firestore:indexes
```

Alternatively, if you run the app and open the browser console, Firestore will automatically print a direct link to create the required indexes in the Firebase Console whenever an indexed query is executed for the first time.

## Data Isolation & Security

The Firestore security rules guarantee that users can only read, create, update, and delete documents where `resource.data.userId == request.auth.uid`. No user can access another user's financial data.
