import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  icons: {
    48: 'public/logo.png',
  },
  host_permissions: [
    "https://chatgpt.com/*"
  ],
  action: {
    default_icon: {
      48: 'public/logo.png',
    }
  },
  content_scripts: [{
    js: ['src/content/content.tsx', 'src/content/fillAndSubmit.ts'],
    matches: ['<all_urls>'],
  }],
  background: {
    service_worker: "src/background.ts"
 },
  side_panel:{
    default_path:"src/sidepanel/main.html"
  },

  permissions:[
    "system.display",
    "tabs",
    "sidePanel",
    "declarativeNetRequest", "declarativeNetRequestWithHostAccess", "webRequest", "windows",
    "activeTab", "scripting", "contextMenus", "webNavigation", "storage"
  ],
  web_accessible_resources: [{
    resources: ["src/sidepanel/main.html"],
    matches: ["*://*/*"]
  }]
})
