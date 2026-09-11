<div align="center">
  <img src="repquestlogo.png" alt="RepQuest Logo" width="1500" />
  <h1>RepQuest</h1>
  <p><em>Your AI-powered, privacy-first fitness companion. Try it now at: https://lyonmathprep.github.io/repquest/ </em></p>
  
  <p>
    <img src="https://img.shields.io/badge/Status-Active-success?style=flat-square" alt="Status" />
    <img src="https://img.shields.io/badge/Privacy-100%25%20On--Device-blue?style=flat-square" alt="Privacy" />
    <img src="https://img.shields.io/badge/ML-MediaPipe%20Pose-orange?style=flat-square" alt="Machine Learning" />
    <img src="https://img.shields.io/badge/Challenge-Congressional%20App%20Challenge-purple?style=flat-square" alt="Congressional App Challenge" />
  </p>
</div>

---

## 🌟 Overview
**RepQuest** is a web-based fitness application that brings the gym to your living room, your office, your local park, almost anywhere! Designed for the **Congressional App Challenge**, RepQuest uses your device's camera and on-device machine learning to track your workouts, count your reps, and gamify your fitness journey. All without ever sending your video data to a server.

Whether you're warming up with Arm Circles or grinding through Squats, RepQuest keeps you accountable with daily challenges, XP tracking, and friend leaderboards.

---

## ✨ Key Features

-  **Real-Time Pose Estimation:** Powered by MediaPipe Pose, accurately tracks your body mechanics and counts reps in real-time directly in your browser.
-  **100% Privacy-First:** Your camera feed is processed locally. Frames are analyzed in memory and instantly discarded. **No backend video processing. No telemetry.**
-  **Gamified Progression:** Earn XP for every rep (+10 XP/rep), maintain daily streaks 🔥, and rank up through 11 unique tiers from **Rookie** to **Ascended**.
-  **Daily Challenges:** Complete daily goals (e.g., 30 reps) to earn bonus XP (+50 XP) and keep your streak alive.
-  **Social & Competitive:** Sync your cloud account to compete against friends on the Mini-Leaderboard and keep your XP between devices.
-  **Guided Warm-Ups:** Built-in warm-up plans (like Forward Arm Circles) to ready your body and prevent injury.
-  **Seamless Syncing:** Play as a Guest or create a Cloud Account. Easily sync your progress across devices using your username.

---

## 🛡️ Privacy by Design
We believe your workout data belongs to you. RepQuest operates on a strict **On-Device Only** philosophy:

> ✅ **ALL video processed locally.** by MediaPipe Pose in your browser.  
> ✅ **Nothing recorded.** Frames are analyzed in memory and immediately discarded.  
> ✅ **Only numbers saved.** Rep counts and XP are stored locally in `localStorage`.  
> ✅ **Full control.** Pause or stop the camera anytime.  
> ❌ **No sending your video or personal stuff to the cloud.** No video telemetry. No cloud video storage. If users opt in - we only store an XP and username. 

---

## 📈 Gamification & Ranks
Track your fitness journey through our comprehensive XP and Rank system. Complete workouts, maintain streaks, and conquer daily challenges to climb through 11 prestigious ranks!

Color swatches below match the `color` and `bg` values in the app's `RANKS` array.

| Rank | XP Required | Color | Badge BG | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Rookie** | 0 XP | ![#6b7280](https://img.shields.io/badge/-%236b7280-6b7280?style=flat-square) | ![#f3f4f6](https://img.shields.io/badge/-%23f3f4f6-f3f4f6?style=flat-square) | *Just getting started!* |
| **Cadet** | 100 XP | ![#3b82f6](https://img.shields.io/badge/-%233b82f6-3b82f6?style=flat-square) | ![#eff6ff](https://img.shields.io/badge/-%23eff6ff-eff6ff?style=flat-square) | *Building momentum.* |
| **Athlete** | 300 XP | ![#22c55e](https://img.shields.io/badge/-%2322c55e-22c55e?style=flat-square) | ![#f0fdf4](https://img.shields.io/badge/-%23f0fdf4-f0fdf4?style=flat-square) | *Finding your stride.* |
| **Warrior** | 700 XP | ![#f97316](https://img.shields.io/badge/-%23f97316-f97316?style=flat-square) | ![#fff7ed](https://img.shields.io/badge/-%23fff7ed-fff7ed?style=flat-square) | *Forged in sweat.* |
| **Champion** | 1,500 XP | ![#ef4444](https://img.shields.io/badge/-%23ef4444-ef4444?style=flat-square) | ![#fef2f2](https://img.shields.io/badge/-%23fef2f2-fef2f2?style=flat-square) | *Rising to the top.* |
| **Legend** | 3,000 XP | ![#a855f7](https://img.shields.io/badge/-%23a855f7-a855f7?style=flat-square) | ![#faf5ff](https://img.shields.io/badge/-%23faf5ff-faf5ff?style=flat-square) | *The stuff of legends.* |
| **Mythic** | 6,000 XP | ![#eab308](https://img.shields.io/badge/-%23eab308-eab308?style=flat-square) | ![#fefce8](https://img.shields.io/badge/-%23fefce8-fefce8?style=flat-square) | *Beyond extraordinary.* |
| **Titan** | 12,000 XP | ![#06b6d4](https://img.shields.io/badge/-%2306b6d4-06b6d4?style=flat-square) | ![#ecfeff](https://img.shields.io/badge/-%23ecfeff-ecfeff?style=flat-square) | *Unstoppable force.* |
| **Olympus** | 25,000 XP | ![#6366f1](https://img.shields.io/badge/-%236366f1-6366f1?style=flat-square) | ![#eef2ff](https://img.shields.io/badge/-%23eef2ff-eef2ff?style=flat-square) | *Among the gods.* |
| **Demigod** | 50,000 XP | ![#ec4899](https://img.shields.io/badge/-%23ec4899-ec4899?style=flat-square) | ![#fdf2f8](https://img.shields.io/badge/-%23fdf2f8-fdf2f8?style=flat-square) | *Half divine, all power.* |
| **Ascended** | 100,000 XP | ![#10b981](https://img.shields.io/badge/-%2310b981-10b981?style=flat-square) | ![#ecfdf5](https://img.shields.io/badge/-%23ecfdf5-ecfdf5?style=flat-square) | *Transcended limits.* |

---

## 🛠️ Tech Stack
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Machine Learning:** [MediaPipe Pose](https://developers.google.com/mediapipe) (Browser-based pose estimation)
- **Storage:** LocalStorage (Guest data), Cloud API (Account syncing)
- **Camera:** WebRTC / `getUserMedia` API

---

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Edge, Firefox, Safari) with camera access.
- A local server to run the app (browsers may block camera access on `file://` protocols).

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/LyonMathPrep/repquest.git
   cd repquest
   ```
2. Start a local server (using Python, Node, or VS Code Live Server):
   ```bash
   # Example using Python 3
   python -m http.server 8000
   ```
3. Open your browser and navigate to `http://localhost:8000`.
4. **Allow camera access** when prompted to start tracking your reps!

---

## 💻 Contributing
This project was created for the Congressional App Challenge, but we welcome feedback and contributions! 
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🏅 Acknowledgements
-  **Congressional App Challenge** - For inspiring us to build something that actually impacts our communities.
-  **Google MediaPipe** - For providing the incredible and intuitive on-device machine learning models that make RepQuest possible.
-  **Icons & UI/UX** - Designed with a focus on accessibility, dark-mode aesthetics, and user experience regardless of mobile or desktop.

---

<div align="center">
  <sub>Built with ❤️ by the RepQuest Team</sub>
</div>
