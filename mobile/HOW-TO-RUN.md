# How to Run the Dersimiz Mobile App

A step-by-step guide to run and test the app on your computer and phone. Written for first-time setup.

---

## Table of Contents

1. [Quick Start: What You Will Do](#1-quick-start-what-you-will-do)
2. [Choose Your Way to Run the App](#2-choose-your-way-to-run-the-app)
3. [Install Required Software](#3-install-required-software)
4. [Find Your Project and Install the App](#4-find-your-project-and-install-the-app)
5. [Set the Backend (API) Address](#5-set-the-backend-api-address)
6. [Start the Backend Server](#6-start-the-backend-server)
7. [Start the Mobile App](#7-start-the-mobile-app)
8. [Open the App on Your Phone or Emulator](#8-open-the-app-on-your-phone-or-emulator)
9. [What to Test in the App](#9-what-to-test-in-the-app)
10. [When Something Goes Wrong](#10-when-something-goes-wrong)
11. [Command Cheat Sheet](#11-command-cheat-sheet)

---

## 1. Quick Start: What You Will Do

In short, you will:

1. **Install** Node.js and (optionally) Expo Go on your phone.
2. **Open** the `mobile` folder in a terminal and run `npm install`.
3. **Tell the app** where your backend is (your computer’s IP or a server URL).
4. **Start** the backend server (if it runs on your computer).
5. **Start** the app with `npm start`.
6. **Open** the app on your phone by scanning the QR code, or in an emulator by pressing a key.

The app **cannot work without a running backend**. Every screen (login, dashboard, chat) talks to the API. Make sure the backend is running and the address is correct.

---

## 2. Choose Your Way to Run the App

Pick one. This determines which URL you will use later.

| How you will open the app | What you need | API URL you will use |
|---------------------------|----------------|------------------------|
| **Phone with Expo Go** (easiest) | Phone + Expo Go app + same Wi‑Fi as PC | Your computer’s IP, e.g. `http://192.168.1.5:3000` |
| **Android emulator** on PC | Android Studio + virtual device | `http://localhost:3000` or `http://10.0.2.2:3000` |
| **iOS Simulator** (Mac only) | Xcode | `http://localhost:3000` |
| **Backend on a real server** | Any of the above | Server URL, e.g. `https://api.dersimiz.com` |

- **Using your phone?** You must use your **computer’s IP address** (not `localhost`). The phone has its own “localhost” and cannot see your PC’s.
- **Using an emulator/simulator?** You can use `http://localhost:3000` if the backend runs on the same computer.

---

## 3. Install Required Software

### 3.1 Node.js (everyone needs this)

Node.js is the environment that runs the app and its tools.

**Step 1 — Check if it’s already installed**

1. Open a **terminal**:
   - **Windows:** Press `Win + R`, type `cmd` or `powershell`, press Enter.
   - **Mac:** Press `Cmd + Space`, type `Terminal`, press Enter.
2. Type this and press Enter:

   ```bash
   node --version
   ```

3. If you see a version like `v20.10.0` or `v22.0.0`, Node is installed. Go to [Section 3.2](#32-expo-go-on-your-phone-recommended).
4. If you see “not recognized” or “command not found”, continue below.

**Step 2 — Install Node.js**

1. Go to [https://nodejs.org](https://nodejs.org).
2. Download the **LTS** version (left button).
3. Run the installer. Accept the defaults.
4. **Close and reopen** the terminal.
5. Run again: `node --version`. You should see a version number.

**Step 3 — Check npm**

In the same terminal, run:

```bash
npm --version
```

You should see a number (e.g. `10.2.0`). npm is installed together with Node.

---

### 3.2 Expo Go on your phone (recommended)

Expo Go lets you open the app by scanning a QR code. No need to install Android Studio or Xcode.

- **Android:** Install **Expo Go** from [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent).
- **iPhone:** Install **Expo Go** from the [App Store](https://apps.apple.com/app/expo-go/id982107779).

You will use it in [Section 8](#8-open-the-app-on-your-phone-or-emulator).

---

### 3.3 (Optional) Android emulator

Only if you want to run the app on a virtual Android device on your PC:

1. Download [Android Studio](https://developer.android.com/studio).
2. Install and open it.
3. Go to **More Actions** → **Virtual Device Manager**.
4. Click **Create Device**, pick a phone (e.g. Pixel 6), click **Next**.
5. Pick a system image (e.g. API 34), download if needed, click **Next** → **Finish**.
6. Click the **Play** button to start the virtual device.

You can close Android Studio after the emulator is running. Use it in [Section 8](#8-open-the-app-on-your-phone-or-emulator) by pressing **a** in the Expo terminal.

---

### 3.4 (Optional) iOS Simulator (Mac only)

Only if you have a Mac and want to run the app in the iOS Simulator:

1. Install **Xcode** from the Mac App Store.
2. Open Xcode once and accept the license.
3. You do not need to create a project. Just have Xcode installed.

Use it in [Section 8](#8-open-the-app-on-your-phone-or-emulator) by pressing **i** in the Expo terminal.

---

## 4. Find Your Project and Install the App

### 4.1 Open the terminal in the project folder

You must be inside the **`mobile`** folder. That folder contains `package.json` and `App.tsx`.

**On Windows**

1. Open File Explorer and go to your project (e.g. `C:\Users\Volkan\Documents\personal\dersimiz-app`).
2. Open the **`mobile`** folder.
3. In the address bar, type `cmd` or `powershell` and press Enter. A terminal will open already in that folder.

**Or use the terminal with a path**

- **Windows (PowerShell or CMD):**

  ```bash
  cd C:\Users\Volkan\Documents\personal\dersimiz-app\mobile
  ```

- **Mac / Linux:**

  ```bash
  cd /Users/YourName/documents/dersimiz-app/mobile
  ```

Replace the path with **your** actual path to the `mobile` folder.

**Check you are in the right place:** run `dir` (Windows) or `ls` (Mac/Linux). You should see `package.json`, `App.tsx`, and a folder named `src`.

---

### 4.2 Install dependencies

With the terminal still in the **`mobile`** folder, run:

```bash
npm install
```

- This downloads all libraries the app needs (Expo, React Navigation, etc.).
- It can take 1–3 minutes.
- When it finishes, you should see something like `added 794 packages` and no red errors.

If you see errors, check that Node and npm are installed ([Section 3.1](#31-nodejs-everyone-needs-this)).

---

## 5. Set the Backend (API) Address

The app needs to know **where your backend is**. You set this with an environment variable: **`EXPO_PUBLIC_API_URL`**.

### 5.1 Decide which URL to use

Answer these in order:

1. **Is your backend on a remote server (e.g. api.dersimiz.com)?**  
   → Use that full URL. Example: `https://api.dersimiz.com`  
   → Skip to [Section 5.3](#53-set-the-url-before-running-npm-start).

2. **Are you opening the app on your phone with Expo Go?**  
   → You **must** use your **computer’s IP address** (not `localhost`).  
   → Go to [Section 5.2](#52-find-your-computers-ip-address-only-if-using-expo-go-on-phone) to find the IP, then use: `http://YOUR_IP:3000` (replace `3000` if your backend uses another port).

3. **Are you using an Android emulator or iOS Simulator on the same computer as the backend?**  
   → Use `http://localhost:3000` (or the port your backend uses).  
   → On Android emulator, if `localhost` does not work, try `http://10.0.2.2:3000`.

---

### 5.2 Find your computer’s IP address (only if using Expo Go on phone)

Your phone and computer must be on the **same Wi‑Fi**. The phone will connect to your PC using this IP.

**On Windows**

1. Open terminal (CMD or PowerShell).
2. Run:

   ```bash
   ipconfig
   ```

3. Find the section for your **Wi‑Fi adapter** (often “Wireless LAN adapter Wi-Fi”).
4. Look for **IPv4 Address**. It looks like `192.168.1.5` or `10.0.0.12`.
5. Your URL will be: `http://192.168.1.5:3000` (use your IP and your backend’s port).

**On Mac**

1. Open **Terminal**.
2. Run:

   ```bash
   ipconfig getifaddr en0
   ```

   (If nothing appears, try `en1` instead of `en0`.)

3. You’ll see one line with an IP like `192.168.1.5`.
4. Your URL will be: `http://192.168.1.5:3000` (use your IP and your backend’s port).

Write down the full URL (e.g. `http://192.168.1.5:3000`). You will use it in the next step.

---

### 5.3 Set the URL before running `npm start`

You must set **`EXPO_PUBLIC_API_URL`** in the **same** terminal session where you will run `npm start`. Do **not** add a slash at the end of the URL.

**Windows — PowerShell**

Run these two lines, one after the other (replace with your real URL):

```powershell
$env:EXPO_PUBLIC_API_URL = "http://192.168.1.122:3003"
npm start
```

**Windows — Command Prompt (CMD)**

Run these two lines, one after the other:

```cmd
set EXPO_PUBLIC_API_URL=http://192.168.1.5:3000
npm start
```

**Mac / Linux**

Run this single line (replace with your real URL):

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.5:3000 npm start
```

**If you skip this:** The app uses `http://localhost:3000`. That only works in an emulator/simulator, **not** on a real phone with Expo Go.

---

### 5.4 (Optional) Save the URL in a script so you don’t type it every time


**Windows — create `start-app.bat`**

1. In the **`mobile`** folder, create a new text file.
2. Name it exactly: `start-app.bat`.
3. Open it and paste (replace the IP and port with yours):

   ```bat
   @echo off
   set EXPO_PUBLIC_API_URL=http://192.168.1.5:3000
   npm start
   ```

4. Save and close.
5. Next time: double‑click `start-app.bat`, or in CMD run `start-app.bat` from the `mobile` folder.

**Mac / Linux — create `start-app.sh`**

1. In the **`mobile`** folder, create a file named `start-app.sh`.
2. Put this in it (replace the URL with yours):

   ```bash
   #!/bin/bash
   export EXPO_PUBLIC_API_URL=http://192.168.1.5:3000
   npm start
   ```

3. In Terminal, from the `mobile` folder, run: `chmod +x start-app.sh`.
4. Next time run: `./start-app.sh`.

---

## 6. Start the Backend Server

The mobile app only works if the **backend API** is running. If your backend is on your computer, start it **before** opening the app.

1. Find where your backend code is (e.g. a `backend` or `api` folder in the same project).
2. Open a **second** terminal (leave the one for the mobile app for later).
3. Go to the backend folder. Example:

   ```bash
   cd C:\Users\Volkan\Documents\personal\dersimiz-app\backend
   ```

4. If you haven’t already, run:

   ```bash
   npm install
   ```

5. Start the server. Often:

   ```bash
   npm run dev
   ```
   or
   ```bash
   npm start
   ```

6. Check the output: it should say it is listening on a port (e.g. `3000`). That port must match the one in `EXPO_PUBLIC_API_URL`.
7. **Keep this terminal open** while you test the app.

The app calls the API at **`<your URL>/api/v1`**. For example, if `EXPO_PUBLIC_API_URL` is `http://192.168.1.5:3000`, the app uses `http://192.168.1.5:3000/api/v1`. Your backend must respond on that path (see `API-BACKEND-MOBILE.md`).

---

## 7. Start the Mobile App

Do this **after** the backend is running (if the backend is on your machine).

1. Open a terminal (or use the one where you only ran `npm install` earlier).
2. Go to the **`mobile`** folder (see [Section 4.1](#41-open-the-terminal-in-the-project-folder)).
3. If you are **not** using the `start-app.bat` or `start-app.sh` script:
   - Set the API URL as in [Section 5.3](#53-set-the-url-before-running-npm-start).
   - Then run: `npm start`.
4. If you **are** using the script: run the script (`start-app.bat` or `./start-app.sh`).

**What you should see**

- A QR code in the terminal.
- Text like:
  - `Metro waiting on exp://192.168.x.x:8081`
  - `Scan the QR code above with Expo Go (Android) or the Camera app (iOS)`
  - `Press a │ open Android`
  - `Press i │ open iOS simulator`
  - `Press w │ open web`

**Leave this terminal open.** Do not close it while you are testing. To stop the app later, press `Ctrl + C` in this terminal.

---

## 8. Open the App on Your Phone or Emulator

### Option A — Phone with Expo Go (recommended)

1. Make sure the phone is on the **same Wi‑Fi** as your computer.
2. **Android:** Open the **Expo Go** app → tap **“Scan QR code”** → scan the QR code in the terminal.
3. **iPhone:** Open the **Camera** app → point at the QR code → tap the notification that appears → choose **Open in Expo Go**.
4. Wait 30–60 seconds the first time. The app will load. You should see the Dersimiz login (phone number) screen.

If it never loads or says it cannot connect, see [Section 10](#10-when-something-goes-wrong) (same Wi‑Fi, firewall, and API URL).

---

### Option B — Android emulator

1. Start the Android Virtual Device from Android Studio (Virtual Device Manager → Play).
2. In the terminal where `npm start` is running, press the **`a`** key.
3. The app will open in the emulator. First load can take a minute.

Use `http://localhost:3000` (or `http://10.0.2.2:3000` if localhost fails) as the API URL when you start the app.

---

### Option C — iOS Simulator (Mac only)

1. In the terminal where `npm start` is running, press the **`i`** key.
2. The iOS Simulator will open and load the app.

Use `http://localhost:3000` as the API URL when you start the app.

---

### Option D — Web browser

Press **`w`** in the terminal. The app opens in the browser. Some features (push, camera, secure storage) may not work as on a real device. Use this only for a quick look; prefer Expo Go or an emulator for real testing.

---

## 9. What to Test in the App

### First screen

- You should see a screen asking for a **phone number**.
- Enter a number (e.g. `+905551234567` for Turkey). Tap **Send Code**.
- If your backend is in demo mode (no real SMS), check its docs for the test OTP (often **`123456`**). Enter it and tap **Verify**.

### New user

1. **Legal agreements** — Read and tap **Accept all and continue**.
2. **Role** — Choose **Tutor** or **Student**.
3. **Onboarding** — Fill the steps (name, location, school, bio, lessons or interests, photo). Tap **Next** until you finish.
4. You should land on the **Dashboard**.

### Returning user

- After entering the OTP, you go to the **Dashboard** (or to onboarding if you didn’t finish it before).

### As a tutor

- **Dashboard:** View stats; use **Manage lessons** and **Set availability**.
- **Profile:** Open **Lessons**, **Availability**, **Subscription**, **Boosters**, **Support**, **Notifications**, **Settings**.
- **Students:** List of students you are in contact with.
- **Chat:** Open a conversation; send messages; use **Share contact** and **Request demo**.

### As a student

- **Dashboard:** Tap **Find tutors** to go to Search.
- **Search:** Choose lesson type, tap **Find tutors**, then add to favorites, open chat, or request a demo.
- **Favorites:** List of saved tutors.
- **Chat:** Same as tutor.
- **Profile:** **Support**, **Notifications**, **Settings**.

### Settings

- Change **Language** (e.g. Turkish / English).
- Adjust **Notifications** (on/off and optional quiet hours).

---

## 10. When Something Goes Wrong

### “Cannot connect to Metro” or “Unable to resolve module”

- **Phone and PC on the same Wi‑Fi?**
- **Firewall / antivirus:** Allow Node or your terminal app. Try temporarily disabling to test.
- **Restart:** In the terminal where the app is running, press `Ctrl + C`, then run `npm start` again (and set `EXPO_PUBLIC_API_URL` again if needed).
- **Clear cache:** Run `npx expo start --clear` instead of `npm start`.

---

### “Network request failed” or the app can’t reach the backend

- **Backend is running** in the other terminal.
- **Correct URL:**  
  - On a **phone**, you must use your **computer’s IP** (e.g. `http://192.168.1.5:3000`), **not** `localhost`.  
  - No slash at the end: `http://192.168.1.5:3000` not `http://192.168.1.5:3000/`.
- **Test in browser:** On the same Wi‑Fi, open `http://YOUR_IP:3000/health` (or your backend’s health URL). You should get a response.
- **After changing the URL:** Stop the app (`Ctrl + C`), set `EXPO_PUBLIC_API_URL` again, run `npm start`, then reopen the app on the phone (scan QR again or reload).

---

### QR code does nothing or “Expo Go” doesn’t open

- **Android:** Scan with **Expo Go** (inside the app: “Scan QR code”), not with the default camera “open link”.
- **iPhone:** Use the **Camera** app, then tap the banner to open in Expo Go.
- Update **Expo Go** to the latest version from the store.

---

### White or blank screen

- Wait up to 60 seconds on first load.
- **Reload:** Shake the phone and tap **Reload**, or in the terminal press **`r`**.
- Try: `npx expo start --clear`, then open the app again.

---

### “Invalid or expired OTP”

- Use the OTP your backend shows (e.g. in logs or docs). Demo backends often use **`123456`**.
- Make sure the app is talking to the backend you started (same URL in `EXPO_PUBLIC_API_URL`).

---

### “Port 8081 already in use”

- Another Expo/Metro process may be running. Close other terminals that ran `npm start`, or use another port:

  ```bash
  npx expo start --port 8082
  ```

---

### Code or env changes don’t show

- **Code:** Save the file; the app should reload. If not, shake device → **Reload** or press **`r`** in the terminal.
- **Env variable (API URL):** The app reads it only when Metro starts. Stop the app (`Ctrl + C`), set `EXPO_PUBLIC_API_URL` again, run `npm start`, then reopen the app.

---

## 11. Command Cheat Sheet

| What you want to do | Command |
|----------------------|--------|
| Go to app folder (Windows) | `cd C:\Users\Volkan\Documents\personal\dersimiz-app\mobile` |
| Go to app folder (Mac/Linux) | `cd ~/documents/dersimiz-app/mobile` |
| Install dependencies | `npm install` |
| Set API URL (PowerShell) then start | `$env:EXPO_PUBLIC_API_URL = "http://192.168.1.122:3003"` then `npm start` |
| Set API URL (Mac/Linux) and start | `EXPO_PUBLIC_API_URL=http://192.168.1.5:3000 npm start` |
| Start app (after URL is set or in script) | `npm start` |
| Start with cache cleared | `npx expo start --clear` |
| Open on Android emulator | Press **`a`** in the Expo terminal |
| Open on iOS simulator | Press **`i`** in the Expo terminal (Mac) |
| Open in browser | Press **`w`** in the Expo terminal |
| Reload app | Press **`r`** in the Expo terminal, or shake device → Reload |
| Stop the app | Press **`Ctrl + C`** in the Expo terminal |

---

### Full sequence example (Windows, backend on same PC, testing on phone)

1. Start backend (in one terminal):
   ```bash
   cd C:\Users\Volkan\Documents\personal\dersimiz-app\backend
   npm run dev
   ```
2. Start app (in a second terminal):
   ```powershell
   cd C:\Users\Volkan\Documents\personal\dersimiz-app\mobile
   $env:EXPO_PUBLIC_API_URL = "http://192.168.1.5:3000"
   npm start
   ```
3. On your phone, open Expo Go and scan the QR code. Replace `192.168.1.5` with the IP you got from `ipconfig`.

If anything fails, check: same Wi‑Fi, correct API URL (no trailing slash), backend running, and that you followed the steps for your chosen way to run (phone vs emulator).
