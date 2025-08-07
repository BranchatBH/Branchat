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
  declarative_net_request: {
    rule_resources: [{
      id : "ruleset",
      enabled : true,
      path : "src/utils/rules.json"
    }]
  },
  action: {
    default_icon: {
      48: 'public/logo.png',
    },
    default_popup: 'src/popup/index.html',
  },
  content_scripts: [{
    js: ['src/content/content.tsx'],
    matches: ['<all_urls>'],
  }],
  background: {
    service_worker: "src/background.ts"
 },
  side_panel:{
    default_path:"src/sidepanel/main.html?url=https://chatgpt.com"
  },

  permissions:[
    "system.display",
    "tabs",
    "sidePanel",
    "declarativeNetRequest", "declarativeNetRequestWithHostAccess", "webRequest", "windows",
    "activeTab", "scripting"
  ],
  web_accessible_resources: [{
    resources: ["src/sidepanel/main.html"],
    matches: ["*://*/*"]
  }]
})
