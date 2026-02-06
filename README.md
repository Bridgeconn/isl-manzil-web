# Indian Sign Language Video (ISLV) Bible Website

The **ISLV Bible Website** is a web application designed to provide the Bible in **Indian Sign Language (ISL)** through an intuitive and accessible video-based interface. It seeks to serve over 64 million Deaf individuals across India by delivering Scripture in their native “heart language” via culturally relevant and easy-to-share videos.


## 🌟 Purpose

- To make the Word of God accessible to Deaf users in India through Indian Sign Language.
- To create a platform where ISL Bible videos are organized, easily navigable.
- To support spiritual growth and community gatherings for the Deaf with visual-first communication.


## 🌈 Features of This App
- ✅ Organized Access to ISL Bible videos: Clearly separated Old and New Testament sections with available ISL content.

- 🎨 Theme Switching: Choose from multiple visual themes for better readability.

- 🔍 Intuitive Navigation: Dropdowns and navigation buttons help move easily between books and chapters.

- ⏩ Playback Speed Control: Watch videos at slower or faster speeds.

- ⬇️ Download Video: Download ISL Bible videos for offline use.

- 🎥 Change Video Quality: Stream in different resolutions (e.g., Ultra HD, HD, SD).

- 💬 Feedback Option: Accessible button to collect user feedback.

- 📤 Share Feature: Share ISL Bible videos and Bible text links on social media platforms.

- 🖍️ Video-Synced Text: Highlights verse text in sync with the video.

- 💻📱 Multi-Device Support: Designed to adapt to screens of smartphones, tablets, and iPads.


## 📋 Requirements

- **Node.js** >= 18.x
- **pnpm** >= 8.x
- **Vimeo Developer Account** (for API access)
- Access to appropriate API credentials


## 🛠️ Technology Used

- **React JS** – Frontend Framework
- **Vite** – Fast development server and bundler
- **Tailwind CSS** – Styling
- **Zustand** – Lightweight state management
- **Shadcn UI** – UI component library
- **Vimeo API** – Video streaming and download management
- **Vercel** – Deployment platform

## 🔧 Setup Steps 

1. **Clone the repository**

   ```bash
   git clone <https://github.com/Bridgeconn/isl-manzil-web.git>
   cd isl-manzil-web
   ```
2. **Install pnpm if not already installed**

   If you don't have pnpm installed, you can install it globally using:

   ```bash
   npm install -g pnpm
   ```

3. **Install project dependencies**

   ```bash
   pnpm install
   ```
4. **Setup environment variables**


   create a `.env` file in the root directory of the project and add the following:

   ```env
   VITE_VIMEO_CLIENT_ID=<YOUR_VIMEO_CLIENT_ID>
   VITE_VIMEO_CLIENT_SECRET=<YOUR_VIMEO_CLIENT_SECRET>
   VITE_VIMEO_ACCESS_TOKEN=<YOUR_VIMEO_ACCESS_TOKEN>
   VITE_FEEDBACK_FORM_URL=<YOUR_FEEDBACK_FORM_URL>
   ```

## 🔐 Setting up Vimeo API Credentials
1. Go to Vimeo Developer Site [https://developer.vimeo.com/](https://developer.vimeo.com/).

2. Create an app to obtain your Client ID and Client Secret.

3. Generate an Access Token with the required scopes (e.g., public, video_files).

4. Add these credentials to your .env file as shown above.

## 🚀 Running the App

1. **Start the development server (Desktop / Local)**

   ```bash
   pnpm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser to view the app.

2. **Mobile Testing using Local Network (LAN)** (optional)
   To test the app on a mobile device using the local development server:
   ```bash
   pnpm run dev --host 0.0.0.0
   ```
   This will expose the dev server on your local network and Vite will display a Network URL, for example:
   `http://192.168.1.5:5173`

**Steps to follow:**

- Ensure both desktop and mobile devices are connected to the same LAN / Wi-Fi network.

- Copy the Network URL shown in the terminal.

- Open that URL in the mobile browser.

- This allows real-device testing for responsiveness, touch interactions, and mobile-specific behavior.
   

3. **Build for production** (optional)

   ```bash
   pnpm run build
   ```

   The app will be built in the `dist` directory.
   To preview the built app, run the following command:

   ```bash
   pnpm run preview
   ```