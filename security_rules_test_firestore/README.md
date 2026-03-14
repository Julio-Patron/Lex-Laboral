# Firestore Security Rules Tests

This project contains the unit tests for the Firebase Security Rules of the Lex Laboral app.

## Prerequisites
- Node.js 18+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Java JRE installed (for Firebase Emulator)

## Running the tests

1. Open a terminal and start the Firebase Emulator:
   ```bash
   npx firebase emulators:start --only firestore
   ```

2. Open a **second terminal**, navigate to this directory (`security_rules_test_firestore/`), and run the tests:
   ```bash
   npm test
   ```

## Deploying the Rules
If the tests pass, you can deploy the updated rules from the root of your project:
```bash
cd ..
firebase deploy --only firestore:rules
```
