# Contributing to Developer OS ⚡

Thank you for your interest in contributing to **Developer OS**! As an open-source project, we welcome community contributions to build a better productivity environment for developers.

---

## 🛠️ Getting Started

### 1. Fork and Clone
1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/developer-os.git
   cd developer-os
   ```

### 2. Setup Local Environment
1. Install dependencies using `npm` or `bun`:
   ```bash
   npm install
   # or
   bun install
   ```
2. Configure your environment variables by copying `.env.example` (or creating `.env`):
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```
3. Run the local development server:
   ```bash
   npm run dev
   ```

---

## 📐 Guidelines & Rules

### 1. Code Standards
- **TypeScript**: The codebase is strictly typed. Avoid using `any` type overrides where possible.
- **Components**: Follow the atomic React pattern. Separate UI primitives from functional views. Keep components focused, modular, and responsive.
- **Styling**: Use Tailwind CSS utility classes. Make sure styling is adaptive to support both light and dark themes seamlessly.
- **Reactivity & State**: State management is handled through Zustand stores in the `src/store/` directory.

### 2. Git Commit Messages
We follow the conventional commit specification for clear version histories:
- `feat: ...` for new features or layouts.
- `fix: ...` for bugs, style corrections, or type fixes.
- `docs: ...` for documentation updates.
- `style: ...` for formatting, missing semicolons, etc.
- `refactor: ...` for code changes that neither fix bugs nor add features.

### 3. Creating a Pull Request
1. Create a descriptive feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make your changes and verify that the build succeeds:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
3. Commit your changes with a clear message and push your branch:
   ```bash
   git push origin feat/your-feature-name
   ```
4. Open a Pull Request on GitHub. Provide a clear summary of your changes and reference any related issues.

---

## 💬 Communication & Help
If you have any questions or want to discuss design implementations, please open an issue in the repository!
