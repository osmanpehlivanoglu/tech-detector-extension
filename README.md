# 🔍 Tech Detector Browser Extension

Comprehensive browser extension that detects technologies used on websites with multi-language support.

## ✨ Features

### Frontend Technologies
- **JavaScript Frameworks:** React, Vue.js, Angular, jQuery, Svelte, Next.js, Nuxt.js
- **CSS Frameworks:** Bootstrap, Tailwind CSS, Material-UI, Bulma

### Backend & Infrastructure
- **Backend Technologies:** Express.js, FastAPI, Django, Laravel, ASP.NET, Spring Boot, Ruby on Rails
- **Databases:** MongoDB, Firebase, Supabase, PlanetScale
- **Hosting & CDN:** Vercel, Netlify, GitHub Pages, Cloudflare, AWS, Heroku, Railway

### Analytics & CMS
- **Analytics & Tracking:** Google Analytics, Google Tag Manager, Facebook Pixel, Hotjar
- **CMS & Platforms:** WordPress, Shopify, Drupal, Joomla
- **Libraries:** Lodash, Moment.js, Chart.js, D3.js, Three.js

### 🌍 Multi-Language Support
- English (default)
- Turkish (Türkçe)
- Easily extensible for additional languages

## 🚀 Installation

1. Open Chrome/Edge and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select this folder

## 📱 Usage

1. Navigate to any website
2. Click the extension icon
3. View detected technologies in categorized sections

## 🛠 Technical Details

- **Manifest V3** compatible
- **Content Script** for DOM analysis
- **Multi-language** support system
- **Enhanced detection** algorithms
- **Real-time** technology detection
- **Improved version detection** for frameworks

## 🔧 Development

The extension uses a modular architecture:
- `content.js` - Technology detection logic
- `popup.js` - User interface management
- `translations.js` - Internationalization system
- `background.js` - Service worker for data management

## 📈 Version Detection Improvements

Enhanced version detection for:
- React (multiple detection methods)
- Vue.js (supports Vue 2 & 3)
- Angular (comprehensive element checking)

## 🌐 Adding Languages

To add a new language, update `translations.js`:

```javascript
const translations = {
  // ... existing languages
  'fr': {
    title: "🔍 Tech Detector",
    analyzing: "Analyse des technologies...",
    // ... add all translation keys
  }
};
```# tech-detector-extension
