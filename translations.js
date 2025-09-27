const translations = {
  en: {
    title: "🔍 Tech Detector",
    analyzing: "Analyzing technologies...",
    error: "Technology detection failed.",
    noTechDetected: "Not detected",
    copyJson: "Copy JSON",
    copied: "Copied!",
    failed: "Failed",
    inferred: "Inferred",
    viaHeaders: "Detected via headers",
    inferredLabel: "via inferred",
    viaHeadersLabel: "via headers",
    testSites: "Test Sites",
    legendTitle: "Legend",
    categories: {
      frameworks: "JavaScript Frameworks",
      cssFrameworks: "CSS Frameworks",
      analytics: "Analytics & Tracking",
      cms: "CMS & Platforms",
      libraries: "Libraries",
      backend: "Backend Technologies",
      databases: "Databases",
      hosting: "Hosting & CDN"
    }
  },
  tr: {
    title: "🔍 Teknoloji Dedektörü",
    analyzing: "Teknolojiler analiz ediliyor...",
    error: "Teknoloji tespiti yapılamadı.",
    noTechDetected: "Tespit edilemedi",
    copyJson: "JSON Kopyala",
    copied: "Kopyalandı!",
    failed: "Başarısız",
    inferred: "Çıkarım",
    viaHeaders: "Başlıklar ile tespit",
    inferredLabel: "çıkarım yoluyla",
    viaHeadersLabel: "başlıklar ile",
    testSites: "Test Siteleri",
    legendTitle: "Açıklamalar",
    categories: {
      frameworks: "JavaScript Framework'leri",
      cssFrameworks: "CSS Framework'leri",
      analytics: "Analitik & Takip",
      cms: "CMS & Platformlar",
      libraries: "Kütüphaneler",
      backend: "Backend Teknolojileri",
      databases: "Veritabanları",
      hosting: "Hosting & CDN"
    }
  }
};

function getCurrentLanguage() {
  const browserLang = navigator.language.slice(0, 2);
  return translations[browserLang] ? browserLang : 'en';
}

function t(key) {
  const lang = getCurrentLanguage();
  const keys = key.split('.');
  let value = translations[lang];

  for (const k of keys) {
    value = value?.[k];
  }

  return value || key;
}
