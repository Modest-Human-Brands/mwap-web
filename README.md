<p align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/shba007/vuetemplate/main/src-tauri/icons/icon.png" alt="VueTemplate Logo" width="80" height="80" />
  </picture>
</p>

<h1 align="center">VueTemplate</h1>

<p align="center">
  <strong>Production-ready cross-platform starter kit for Web, Desktop, and Mobile.</strong>
</p>

<p align="center">
  <a href="https://github.com/shba007/vuetemplate/releases"><img src="https://img.shields.io/github/v/release/shba007/vuetemplate?include_prereleases&style=flat-square&color=blue" alt="Latest Release" /></a>
  <a href="https://github.com/shba007/vuetemplate/actions/workflows/integrate.yml"><img src="https://img.shields.io/github/actions/workflow/status/shba007/vuetemplate/integrate.yml?branch=develop&label=CI&style=flat-square" alt="CI Status" /></a>
  <a href="https://github.com/shba007/vuetemplate/actions/workflows/deploy.yml"><img src="https://img.shields.io/github/actions/workflow/status/shba007/vuetemplate/deploy.yml?label=CD&style=flat-square" alt="CD Status" /></a>
  <a href="https://github.com/shba007/vuetemplate/blob/main/LICENSE"><img src="https://img.shields.io/github/license/shba007/vuetemplate?style=flat-square" alt="License" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue-3.5-4FC08D?style=flat-square&logo=vue.js&logoColor=white" alt="Vue 3.5" />
  <img src="https://img.shields.io/badge/Tauri-v2.12-24C8DB?style=flat-square&logo=tauri&logoColor=white" alt="Tauri v2" />
  <img src="https://img.shields.io/badge/Vite--Plus-1.1-646CFF?style=flat-square" alt="Vite-Plus 1.1" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/VueUse-15.0-41B883?style=flat-square" alt="VueUse 15.0" />
  <img src="https://img.shields.io/badge/PWA-Ready-FFA000?style=flat-square&logo=pwa&logoColor=white" alt="PWA Ready" />
  <img src="https://img.shields.io/badge/Bun-1.4+-fbf0df?style=flat-square&logo=bun&logoColor=black" alt="Bun 1.4+" />
</p>

---

VueTemplate is an opinionated, high-performance starter template engineered for building cross-platform applications across Web, Desktop (Windows, macOS, Linux), and Mobile (Android). Powered by Vue 3, Tauri v2, Vite-Plus, VueUse, and Tailwind CSS v4, it provides unified development workflows with zero-config linting, automated native release builds, and integrated desktop auto-updates.

### Features

- 🖥️ **Cross-Platform Native Runtime**: Built on Tauri v2 and Rust (edition 2024), compiling desktop binaries (macOS Intel & Apple Silicon, Linux, Windows) and Android mobile packages (APK and AAB).
- ⚡ **Next-Gen Tooling with Vite-Plus**: Powered by `@voidzero-dev/vite-plus-core` and the `vp` CLI for lightning-fast bundling, built-in Oxlint linting, Oxfmt code formatting, and Vitest test execution.
- 📱 **Progressive Web App (PWA)**: Built on [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/) with automated service worker generation, offline precaching, and installable web manifest with maskable icons.
- 🌙 **Tailwind CSS v4 Dark Mode**: Class-based theme toggling via `@vueuse/core` (`useDark` / `useToggle`) synchronized seamlessly with Tailwind CSS v4's `@custom-variant dark`.
- 🔔 **Native & Web Notifications**: Reactive notification dispatching via `@vueuse/core`'s [`useWebNotification`](https://vueuse.org/core/useWebNotification/#usewebnotification).
- 📈 **Dynamic Google Analytics**: Dynamic script injection and custom event tracking powered by `@vueuse/core`'s [`useScriptTag`](https://vueuse.org/core/useScriptTag/#usescripttag).
- 🔄 **Built-In Desktop Auto-Updater**: Native update delivery via `@tauri-apps/plugin-updater` with a reactive Vue composable (`useAppUpdater`), GitHub Releases distribution, and minisign cryptographic signatures.
- 🐳 **Containerized Deployment**: Multi-stage `Dockerfile` with Bun builder and Alpine Nginx web server configured with gzip compression, SPA fallback, and dedicated 404 handler.
- 🤖 **Automated CI/CD Workflows**: GitHub Actions pipelines for continuous integration, automated PR changelogs via `changelogen`, Docker image publishing to GitHub Container Registry (GHCR) with provenance attestations, and signed multi-platform releases.

---

## Quick Start

### 1. Scaffold from Template

Clone the template repository using [`giget`](https://github.com/unjs/giget):

```bash
bunx giget@latest gh:shba007/vuetemplate#main my-app
cd my-app
```

Or via standard Git:

```bash
git clone https://github.com/shba007/vuetemplate.git my-app
cd my-app
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Start Development

| Target      | Command                    | Description                                                      |
| :---------- | :------------------------- | :--------------------------------------------------------------- |
| **Web**     | `bun run dev`              | Starts Vite-Plus web dev server at `http://localhost:5173`       |
| **Desktop** | `bun run tauri:dev`        | Launches Tauri v2 desktop application with HMR                   |
| **Android** | `bun run tauri:dev:mobile` | Runs development build on a connected Android device or emulator |

---

## Project Customization

When creating a new project from this template, update the following configuration points:

| File                                         | Target Fields / Keys                                   | Purpose                                                   |
| :------------------------------------------- | :----------------------------------------------------- | :-------------------------------------------------------- |
| `package.json`                               | `name`, `description`, `author`, `repository`          | Project metadata and Git links                            |
| `index.html`                                 | `<title>`                                              | HTML document browser title                               |
| `vite.config.ts`                             | `VitePWA({ manifest: { ... } })`                       | PWA application name, theme colors, and icons             |
| `src/style.css`                              | `@theme { ... }`                                       | Custom fonts, colors, and design tokens (Tailwind CSS v4) |
| `.env.example` / `.env`                      | `VITE_GA_MEASUREMENT_ID`                               | Google Analytics Measurement ID (e.g. `G-XXXXXXXXXX`)     |
| `src-tauri/Cargo.toml`                       | `package.name`, `description`, `authors`, `repository` | Rust crate identity                                       |
| `src-tauri/tauri.conf.json`                  | `productName`, `identifier`, `app.windows[0].title`    | App bundle name, bundle ID, window title                  |
| `src-tauri/tauri.conf.json`                  | `plugins.updater.endpoints`, `plugins.updater.pubkey`  | Update server URL and minisign public verification key    |
| `src-tauri/gen/android/app/build.gradle.kts` | `namespace`, `applicationId`                           | Android package namespace and application ID              |
| `.github/workflows/deploy.yml`               | `asset_name` (lines 296, 304)                          | Release asset naming for Android APK and AAB files        |

> [!NOTE]
> Tailwind CSS v4 does not use a `tailwind.config.ts` file. Configure custom theme variables directly in [`src/style.css`](file:///d:/Projects/Public/vuetemplate/code/src/style.css) using CSS `@theme` blocks.

---

## NPM Scripts

All development and lifecycle tasks are orchestrated through `bun run <script>`:

| Script               | Command                                                                                        | Purpose                                                      |
| :------------------- | :--------------------------------------------------------------------------------------------- | :----------------------------------------------------------- |
| `dev`                | `vp dev`                                                                                       | Start the local Vite-Plus development server with HMR        |
| `build`              | `vp build`                                                                                     | Build production frontend static assets to `dist/`           |
| `preview`            | `vp preview`                                                                                   | Preview production build locally                             |
| `lint`               | `vp lint . --fix`                                                                              | Lint codebase with Oxlint rules and auto-apply fixes         |
| `format`             | `vp fmt src/`                                                                                  | Format source code using Oxfmt                               |
| `test:unit`          | `vp test`                                                                                      | Run unit tests using Vitest                                  |
| `detect`             | `gitleaks git --verbose`                                                                       | Scan commit history for sensitive credentials and tokens     |
| `clean`              | `(cd src-tauri && cargo clean)`                                                                | Remove compiled Rust artifacts in `src-tauri/target/`        |
| `tauri`              | `tauri`                                                                                        | Invoke Tauri CLI directly                                    |
| `tauri:dev`          | `tauri dev`                                                                                    | Launch Tauri desktop app in dev mode using `.env.native`     |
| `tauri:build`        | `tauri build`                                                                                  | Build production desktop packages and updater bundles        |
| `tauri:dev:mobile`   | `tauri android dev`                                                                            | Launch Tauri on connected Android device / emulator          |
| `tauri:build:mobile` | `tauri android build`                                                                          | Build release Android APK and AAB bundles                    |
| `docker:build`       | `docker build --build-arg VERSION=dev --build-arg BUILD_TIME=now -t vuetemplate:dev .`         | Build production multi-stage Docker container                |
| `docker:start`       | `docker run --detach --name vuetemplate-dev --env-file .env.prod -p 2000:8080 vuetemplate:dev` | Run Docker container exposing port `2000` (mapped to `8080`) |
| `prepare`            | `husky`                                                                                        | Install and configure Husky git hooks                        |

---

## Programmatic API

### 1. `useDarkMode` Composable

Located at [`src/composables/useDarkMode.ts`](file:///d:/Projects/Public/vuetemplate/code/src/composables/useDarkMode.ts), this composable uses VueUse's `useDark` and `useToggle` to synchronize user theme preference with Tailwind CSS v4.

```vue
<script setup lang="ts">
import { useDarkMode } from '@/composables/useDarkMode'

const { isDark, toggleDark } = useDarkMode()
</script>

<template>
  <button @click="toggleDark()">
    {{ isDark ? '🌙 Dark' : '☀️ Light' }}
  </button>
</template>
```

- **CSS Configuration**: [`src/style.css`](file:///d:/Projects/Public/vuetemplate/code/src/style.css) defines `@custom-variant dark (&:where(.dark, .dark *));`, allowing classes like `dark:bg-slate-900` to respond instantly when `.dark` is added to `<html>`.

---

### 2. `useAppNotification` Composable

Located at [`src/composables/useAppNotification.ts`](file:///d:/Projects/Public/vuetemplate/code/src/composables/useAppNotification.ts), this composable uses VueUse's [`useWebNotification`](https://vueuse.org/core/useWebNotification/#usewebnotification) to handle permissions and trigger system notifications.

```vue
<script setup lang="ts">
import { useAppNotification } from '@/composables/useAppNotification'

const { isSupported, sendNotification } = useAppNotification()

const triggerNotice = () => {
  sendNotification({
    title: 'VueTemplate',
    body: 'Notification dispatched successfully!',
  })
}
</script>

<template>
  <button :disabled="!isSupported" @click="triggerNotice">Send Notification</button>
</template>
```

#### Return Value

| Property           | Type                                                                    | Description                                                       |
| :----------------- | :---------------------------------------------------------------------- | :---------------------------------------------------------------- |
| `isSupported`      | `Ref<boolean>`                                                          | `true` if Notification API is supported by the environment.       |
| `sendNotification` | `(payload?: NotificationPayload) => Promise<Notification \| undefined>` | Prompts for permission if needed and dispatches the notification. |
| `notification`     | `Ref<Notification \| null>`                                             | Current active `Notification` instance.                           |
| `close`            | `() => void`                                                            | Closes active notification.                                       |

---

### 3. `useGoogleAnalytics` Composable

Located at [`src/composables/useGoogleAnalytics.ts`](file:///d:/Projects/Public/vuetemplate/code/src/composables/useGoogleAnalytics.ts), this composable uses VueUse's [`useScriptTag`](https://vueuse.org/core/useScriptTag/#usescripttag) to inject Google Analytics (`gtag.js`) asynchronously.

```vue
<script setup lang="ts">
import { useGoogleAnalytics } from '@/composables/useGoogleAnalytics'

const { trackEvent } = useGoogleAnalytics({
  measurementId: 'G-XXXXXXXXXX', // Or via VITE_GA_MEASUREMENT_ID in .env
  enableInDev: false,
})

const onClick = () => {
  trackEvent('button_click', { button_name: 'signup' })
}
</script>
```

#### Options (`UseGoogleAnalyticsOptions`)

| Option          | Type      | Default                                  | Description                                                       |
| :-------------- | :-------- | :--------------------------------------- | :---------------------------------------------------------------- |
| `measurementId` | `string`  | `import.meta.env.VITE_GA_MEASUREMENT_ID` | Google Analytics Measurement ID.                                  |
| `enableInDev`   | `boolean` | `false`                                  | When `false`, suppresses analytics injection in development mode. |

---

### 4. `useAppUpdater` Composable

Located at [`src/composables/useAppUpdater.ts`](file:///d:/Projects/Public/vuetemplate/code/src/composables/useAppUpdater.ts), this composable wraps `@tauri-apps/plugin-updater` and `@tauri-apps/plugin-process` to provide reactive desktop update management.

```vue
<script setup lang="ts">
import { useAppUpdater } from '@/composables/useAppUpdater'

const {
  version,
  updateAvailable,
  isChecking,
  isDownloading,
  progress,
  error,
  checkForUpdates,
  downloadAndInstall,
} = useAppUpdater({
  checkOnStartup: true,
  autoInstall: false,
})
</script>

<template>
  <div v-if="isChecking">Checking for updates...</div>
  <div v-else-if="updateAvailable">
    <p>New version available: v{{ version }}</p>
    <button :disabled="isDownloading" @click="downloadAndInstall">
      {{ isDownloading ? `Downloading (${progress}%)` : 'Update & Restart' }}
    </button>
  </div>
  <p v-if="error" class="text-red-500">Error: {{ error }}</p>
</template>
```

#### Options (`UseAppUpdaterOptions`)

| Option           | Type      | Default | Description                                                                                         |
| :--------------- | :-------- | :------ | :-------------------------------------------------------------------------------------------------- |
| `checkOnStartup` | `boolean` | `true`  | When `true`, automatically queries the update endpoint inside Vue's `onMounted` lifecycle hook.     |
| `autoInstall`    | `boolean` | `false` | When `true`, automatically triggers `downloadAndInstall()` immediately after an update is detected. |

#### Return Value

| Property             | Type                  | Description                                                                                  |
| :------------------- | :-------------------- | :------------------------------------------------------------------------------------------- |
| `isChecking`         | `Ref<boolean>`        | `true` while the update check request is active.                                             |
| `isDownloading`      | `Ref<boolean>`        | `true` while update packages are being downloaded and applied.                               |
| `updateAvailable`    | `Ref<boolean>`        | `true` when a newer version has been discovered.                                             |
| `progress`           | `Ref<number>`         | Download completion percentage (`0` to `100`).                                               |
| `error`              | `Ref<string \| null>` | Error message if checking, downloading, or relaunching fails.                                |
| `version`            | `Ref<string \| null>` | Semantic version string of the available update (e.g. `0.0.8`).                              |
| `releaseNotes`       | `Ref<string \| null>` | Markdown or text release notes returned by the update endpoint.                              |
| `checkForUpdates`    | `() => Promise<void>` | Async function to manually query the updater endpoint.                                       |
| `downloadAndInstall` | `() => Promise<void>` | Async function to download the bundle, apply changes, and relaunch the app via `relaunch()`. |

> [!NOTE]
> In `src-tauri/src/lib.rs`, the Tauri updater plugin is enabled exclusively on desktop targets (`cfg(not(any(target_os = "android", target_os = "ios")))`).

---

## Code Signing & Release Setup

### 1. Desktop Updater Signing

Tauri requires cryptographic signing to ensure updater artifacts have not been tampered with.

1. **Generate Minisign Keypair:**
   ```bash
   bun x tauri signer generate -w ./src-tauri/app-sign.key
   ```
2. **Configure Public Key in [`src-tauri/tauri.conf.json`](file:///d:/Projects/Public/vuetemplate/code/src-tauri/tauri.conf.json):**
   ```json
   {
     "bundle": {
       "createUpdaterArtifacts": true
     },
     "plugins": {
       "updater": {
         "pubkey": "<YOUR_MINISIGN_PUBLIC_KEY>",
         "endpoints": ["https://github.com/<OWNER>/<REPO>/releases/latest/download/latest.json"]
       }
     }
   }
   ```
3. **Configure GitHub Actions Secrets:**
   - `TAURI_SIGNING_PRIVATE_KEY`: Content of `./src-tauri/app-sign.key`.
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: Password chosen when generating the key (leave empty if none).

### 2. Android Keystore Signing

Android release builds require a Java Keystore for APK and AAB signing. The signing logic is preconfigured in [`src-tauri/gen/android/app/build.gradle.kts`](file:///d:/Projects/Public/vuetemplate/code/src-tauri/gen/android/app/build.gradle.kts).

1. **Generate Keystore:**
   ```bash
   cd src-tauri/gen/android
   keytool -genkey -v -keystore release-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias release-key
   ```
2. **Local Development Configuration:**
   Create `src-tauri/gen/android/keystore.properties`:
   ```properties
   keyAlias=release-key
   password=your_keystore_password
   storeFile=../release-keystore.jks
   ```
3. **GitHub Actions CI Configuration:**
   Encode your keystore in Base64:
   ```bash
   # Linux/macOS
   cat src-tauri/gen/android/release-keystore.jks | base64 -w 0

   # Windows (PowerShell)
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("src-tauri/gen/android/release-keystore.jks"))
   ```
   Add the following GitHub Repository Secrets:
   - `ANDROID_KEY_BASE64`: Base64 string of `release-keystore.jks`.
   - `ANDROID_KEY_ALIAS`: Keystore alias name (e.g. `release-key`).
   - `ANDROID_KEY_PASSWORD`: Keystore password.

### 3. CI/CD Secrets & Variables Summary

The GitHub Actions workflows (`integrate.yml`, `release.yml`, `deploy.yml`) utilize the following variables and secrets:

| Type         | Identifier                           | Scope / Workflow | Purpose                                                                         |
| :----------- | :----------------------------------- | :--------------- | :------------------------------------------------------------------------------ |
| **Secret**   | `GH_PAT`                             | `release.yml`    | GitHub Personal Access Token for automated release generation via `changelogen` |
| **Secret**   | `TAURI_SIGNING_PRIVATE_KEY`          | `deploy.yml`     | Private key used by `tauri-action` to sign desktop bundles and updater metadata |
| **Secret**   | `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | `deploy.yml`     | Password for the Tauri signing private key                                      |
| **Secret**   | `ANDROID_KEY_BASE64`                 | `deploy.yml`     | Base64-encoded Android release keystore                                         |
| **Secret**   | `ANDROID_KEY_ALIAS`                  | `deploy.yml`     | Android signing key alias                                                       |
| **Secret**   | `ANDROID_KEY_PASSWORD`               | `deploy.yml`     | Android signing key password                                                    |
| **Variable** | `USERNAME`                           | `deploy.yml`     | GitHub username or organization for GHCR Docker image login                     |
| **Variable** | `SITE_URL`                           | `deploy.yml`     | Public base URL injected into Docker build args and native platform env         |

---

## Docker Deployment

The repository includes a production-grade multi-stage container setup:

```bash
# Build the Docker image
bun run docker:build

# Run the container (maps host port 2000 -> container port 8080)
bun run docker:start
```

- **Builder Stage**: `oven/bun:1-alpine` runs `bun install --frozen-lockfile` and `bun run build`.
- **Runner Stage**: `nginx:alpine` serves static files from `/usr/share/nginx/html`.
- **Nginx Config**: Configured in [`nginx.conf`](file:///d:/Projects/Public/vuetemplate/code/nginx.conf) to listen on port `8080`, with gzip compression enabled and client-side SPA routing (`try_files $uri $uri/index.html =404;`).

---

<details>
<summary><strong>Local Development & Architecture Notes</strong></summary>

### System Requirements

- **Package Manager / Runtime**: [Bun](https://bun.sh/) `^1.2.9` (lockfile version `1.4.3`) or [Node.js](https://nodejs.org/) (`^22.18.0 || ^24.11.0 || >=26.0.0`).
- **Rust Toolchain**: `rustc` / `cargo` `1.98.1+` with `edition = "2024"`.
- **Android SDK & NDK** (for mobile builds): Android SDK Platform 36, NDK `29.0.13846066`, Java 17.
- **Security Scanner** (optional): [Gitleaks](https://github.com/gitleaks/gitleaks) for local secret detection.

### Git Hooks

The repository uses [Husky](https://typicode.github.io/husky/) with automated pre-commit and commit-msg hooks:

- **`pre-commit`**: Scans the staged diff with Gitleaks when installed, then runs `vp staged` using the tasks configured in `vite.config.ts`.
- **`commit-msg`**: Validates commit messages with `@commitlint/cli` using Conventional Commits.

### Code Style & Formatting

Linter and formatter configurations are managed via Vite-Plus in [`vite.config.ts`](file:///d:/Projects/Public/vuetemplate/code/vite.config.ts):

- Single quotes (`singleQuote: true`)
- No semicolons (`semi: false`)
- Oxlint plugins: `typescript`, `unicorn`, `oxc`, `vue`, `vitest`

</details>

---

## License

Published under the [MIT](https://github.com/shba007/vuetemplate/blob/main/LICENSE) license.

<br>

<a href="https://github.com/shba007/vuetemplate/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=shba007/vuetemplate" alt="Contributors" />
</a>