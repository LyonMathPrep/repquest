<div align="center">
  <img src="logo.png" alt="RepQuest Logo" width="150" />
  <h1>RepQuest</h1>
  <p><em>Your AI-powered, privacy-first fitness companion.</em></p>
  
  <p>
    <img src="https://img.shields.io/badge/Status-Active-success?style=flat-square" alt="Status" />
    <img src="https://img.shields.io/badge/Privacy-100%25%20On--Device-blue?style=flat-square" alt="Privacy" />
    <img src="https://img.shields.io/badge/ML-MediaPipe%20Pose-orange?style=flat-square" alt="Machine Learning" />
    <img src="https://img.shields.io/badge/Challenge-Congressional%20App%20Challenge-purple?style=flat-square" alt="Congressional App Challenge" />
  </p>
</div>

---

## 🌟 Overview
**RepQuest** is a web-based fitness application that brings the gym to your living room. Built for the **Congressional App Challenge**, RepQuest uses your device's camera and on-device machine learning to track your workouts, count your reps, and gamify your fitness journey—all without ever sending your video data to a server.

Whether you're warming up with Arm Circles or grinding through Squats, RepQuest keeps you accountable with daily challenges, XP tracking, and friend leaderboards.

---

## ✨ Key Features

- 📸 **Real-Time Pose Estimation:** Powered by MediaPipe Pose, accurately tracks your body mechanics and counts reps in real-time directly in your browser.
- 🔒 **100% Privacy-First:** Your camera feed is processed locally. Frames are analyzed in memory and instantly discarded. **No backend video processing. No telemetry.**
- 🏆 **Gamified Progression:** Earn XP for every rep (+10 XP/rep), maintain daily streaks 🔥, and rank up from **Rookie** to **Cadet** and beyond.
- 📅 **Daily Challenges:** Complete daily goals (e.g., 30 reps) to earn bonus XP (+50 XP) and keep your streak alive.
- 👥 **Social & Competitive:** Sync your cloud account to compete against friends on the Mini-Leaderboard.
- 🧘 **Guided Warm-Ups:** Built-in warm-up plans (like Forward Arm Circles) to prepare your body and prevent injury.
- 🔄 **Seamless Syncing:** Play as a Guest or create a Cloud Account. Easily sync your progress across devices using your exact username.

---

## 🛡️ Privacy by Design
We believe your workout data belongs to you. RepQuest operates on a strict **On-Device Only** philosophy:

> ✅ **Video processed locally** by MediaPipe Pose in your browser.  
> ✅ **Nothing recorded.** Frames are analyzed in memory and immediately discarded.  
> ✅ **Only numbers saved.** Rep counts and XP are stored locally in `localStorage`.  
> ✅ **Full control.** Pause or stop the camera anytime.  
> ❌ **No backend.** No video telemetry. No cloud video storage.  

---

## 📈 Gamification & Ranks
Track your fitness journey through our XP and Rank system. Complete workouts, maintain streaks, and conquer daily challenges to level up!

| Rank | XP Required | Status |
| :--- | :--- | :--- |
| **Rookie** | 0 - 100 XP | 🌱 *Just getting started!* |
| **Cadet** | 101 - 500 XP | 💪 *Building momentum.* |
| *(More ranks coming soon!)* | ... | 🚀 *Keep pushing!* |

---

## 🛠️ Tech Stack
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Machine Learning:** [MediaPipe Pose](https://developers.google.com/mediapipe) (Browser-based pose estimation)
- **Storage:** LocalStorage (Guest data), Cloud API (Account syncing)
- **Camera:** WebRTC / `getUserMedia` API

---

##  Getting Started

### Prerequisites
- A modern web browser (Chrome, Edge, Firefox, Safari) with camera access.
- A local server to run the app (browsers block camera access on `file://` protocols).

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/repquest.git
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

## 🤝 Contributing
This project was created for the Congressional App Challenge, but we welcome feedback and contributions! 
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

##  Acknowledgements
- 🎓 **Congressional App Challenge** - For inspiring us to build technology that impacts our communities.
- 🧠 **Google MediaPipe** - For providing the incredible on-device machine learning models that make RepQuest possible.
- 🎨 **Icons & UI** - Designed with a focus on accessibility, dark-mode aesthetics, and user experience.

<div align="center">
  <sub>Built with 💪 and ❤️ by the RepQuest Team</sub>
</div>
