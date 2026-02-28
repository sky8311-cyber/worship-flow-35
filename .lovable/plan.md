

# K-Worship iOS App Build Plan (Mac)

Your project already has Capacitor configured. Here is the step-by-step plan to get the app running on your iPhone or iOS Simulator.

## Current Status
- Capacitor is installed and configured (`appId: app.kworship.main`)
- iOS and Android packages are in `package.json`
- No native `ios/` folder exists yet (needs to be generated locally)

## Your Steps (on your Mac)

### Prerequisites
- **Xcode 15+** installed from the Mac App Store
- **Node.js** installed (via nvm or Homebrew)
- An **Apple Developer account** (free for Simulator testing; paid $99/year for device deployment and App Store)

### Step-by-step

1. **Export to GitHub** -- In Lovable, go to Settings and connect/export to your GitHub repository

2. **Clone and install**
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd <PROJECT_FOLDER>
npm install
```

3. **Add the iOS platform**
```bash
npx cap add ios
```
This creates the `ios/` folder with the Xcode project.

4. **Build the web app and sync**
```bash
npm run build
npx cap sync ios
```

5. **Open in Xcode**
```bash
npx cap open ios
```

6. **In Xcode**:
   - Select a Simulator (e.g. iPhone 16) or your connected device
   - For a real device: sign with your Apple Developer team under Signing & Capabilities
   - Press the Play button to build and run

7. **Test the app** on your Simulator or device

### Development Hot-Reload (Optional)
To see live changes from Lovable while developing, temporarily add a server block to `capacitor.config.ts`:
```typescript
const config: CapacitorConfig = {
  appId: 'app.kworship.main',
  appName: 'K-Worship',
  webDir: 'dist',
  server: {
    url: 'https://2ed7309e-d6b0-4f05-9642-be9265249510.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};
```
Then run `npx cap sync ios` again. **Remove this server block before publishing to the App Store.**

### Publishing to the App Store
When ready to publish:
1. Enroll in the **Apple Developer Program** ($99/year)
2. Remove the `server` block from `capacitor.config.ts`
3. Run `npm run build && npx cap sync ios`
4. In Xcode: set version/build numbers, configure app icons and splash screen
5. Archive the app (Product -> Archive) and upload to App Store Connect
6. Submit for Apple review

## No Code Changes Needed from Lovable
Everything is already configured. All steps happen locally on your Mac.

## Useful Reference
- [Capacitor iOS docs](https://capacitorjs.com/docs/ios)
- [Lovable native app guide](https://docs.lovable.dev/tips-tricks/native-mobile-apps)

