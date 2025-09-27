// Browser API compatibility
const runtime = (typeof browser !== 'undefined' && browser.runtime) || (typeof chrome !== 'undefined' && chrome.runtime);

// Prevent duplicate injection/redeclaration across repeated runs
(function() {
  if (window.__TECH_DETECTOR_LOADED__) {
    try {
      if (typeof window.__runTechDetector === 'function') {
        window.__runTechDetector();
      }
    } catch {}
    return;
  }
  window.__TECH_DETECTOR_LOADED__ = true;

class TechDetector {
  constructor() {
    this.detectedTechs = {
      frameworks: [],
      cssFrameworks: [],
      analytics: [],
      cms: [],
      libraries: [],
      backend: [],
      databases: [],
      hosting: []
    };
    // Track high-level context for cross-method use
    this.isNextJs = false;
    // Basic settings (can be extended via messaging later)
    this.settings = {
      enableChunkScan: false,
      chunkScanMaxFiles: 15,
      chunkScanMaxTimeMs: 500,
      enableHeaderHostingDetection: true,
      headerDetectionTimeoutMs: 800
    };
  }

  isSameOrigin(url) {
    try { const u = new URL(url, window.location.href); return u.origin === window.location.origin; } catch { return false; }
  }

  async detect() {
    this.detectFrameworks();
    this.detectCSSFrameworks();
    this.detectAnalytics();
    this.detectCMS();
    this.detectLibraries();
    this.detectClientStorage();
    await this.detectBackend();
    this.detectDatabases();
    this.detectHosting();
    // Backend labeling rules:
    // - If Next.js API detected, keep it singular (drop generic Node.js)
    const hasNextApi = this.detectedTechs.backend.find(b => b.name === 'Next.js API');
    if (hasNextApi) {
      this.detectedTechs.backend = this.detectedTechs.backend.filter(b => b.name !== 'Node.js');
    }
    // - If no backend detected but Next.js is present, infer Next.js runtime
    if (!hasNextApi && this.detectedTechs.backend.length === 0 && this.isNextJs) {
      this.detectedTechs.backend.push({ name: 'Next.js (runtime)', inferred: true });
    }
    return this.detectedTechs;
  }

  detectFrameworks() {
    // React
    if (window.React || document.querySelector('[data-reactroot]') ||
        document.querySelector('script[src*="react"]') ||
        document.body.innerHTML.includes('__REACT_DEVTOOLS_GLOBAL_HOOK__')) {
      this.detectedTechs.frameworks.push({ name: 'React', version: this.getReactVersion() });
    }

    // Vue.js
    if (window.Vue || document.querySelector('[data-v-]') ||
        document.querySelector('script[src*="vue"]') ||
        document.querySelector('[id*="vue"]')) {
      this.detectedTechs.frameworks.push({ name: 'Vue.js', version: this.getVueVersion() });
    }

    // Angular
    if (window.ng || window.angular || document.querySelector('[ng-app]') ||
        document.querySelector('[data-ng-app]') || document.querySelector('script[src*="angular"]')) {
      this.detectedTechs.frameworks.push({ name: 'Angular', version: this.getAngularVersion() });
    }

    // jQuery
    if (window.$ && window.$.fn && window.$.fn.jquery) {
      this.detectedTechs.frameworks.push({ name: 'jQuery', version: window.$.fn.jquery });
    }

    // Svelte
    if (document.querySelector('script[src*="svelte"]') ||
        document.body.innerHTML.includes('svelte')) {
      this.detectedTechs.frameworks.push({ name: 'Svelte' });
    }

    // Next.js
    if (window.__NEXT_DATA__ || document.querySelector('script[src*="_next"]')) {
      this.detectedTechs.frameworks.push({ name: 'Next.js' });
    }

    // Nuxt.js
    if (window.__NUXT__ || document.querySelector('script[src*="nuxt"]')) {
      this.detectedTechs.frameworks.push({ name: 'Nuxt.js' });
    }
  }

  detectCSSFrameworks() {
    const stylesheets = Array.from(document.styleSheets);
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    const allCSS = stylesheets.map(s => s.href).join('') + links.map(l => l.href).join('');

    // Bootstrap
    if (allCSS.includes('bootstrap') || document.querySelector('.container') ||
        document.querySelector('.row') || document.querySelector('.col-')) {
      this.detectedTechs.cssFrameworks.push({ name: 'Bootstrap' });
    }

    // Tailwind CSS
    if (allCSS.includes('tailwind') || this.hasTailwindClasses()) {
      this.detectedTechs.cssFrameworks.push({ name: 'Tailwind CSS' });
    }

    // Material-UI
    if (document.querySelector('.MuiButton-root') ||
        document.querySelector('[class*="MuiButton"]') ||
        allCSS.includes('material-ui')) {
      this.detectedTechs.cssFrameworks.push({ name: 'Material-UI' });
    }

    // Bulma
    if (allCSS.includes('bulma') || document.querySelector('.button.is-primary')) {
      this.detectedTechs.cssFrameworks.push({ name: 'Bulma' });
    }
  }

  detectAnalytics() {
    // Google Analytics
    if (window.gtag || window.ga || document.querySelector('script[src*="google-analytics"]') ||
        document.querySelector('script[src*="googletagmanager"]')) {
      this.detectedTechs.analytics.push({ name: 'Google Analytics' });
    }

    // Google Tag Manager
    if (window.dataLayer || document.querySelector('script[src*="googletagmanager"]')) {
      this.detectedTechs.analytics.push({ name: 'Google Tag Manager' });
    }

    // Facebook Pixel
    if (window.fbq || document.querySelector('script[src*="connect.facebook.net"]')) {
      this.detectedTechs.analytics.push({ name: 'Facebook Pixel' });
    }

    // Hotjar
    if (window.hj || document.querySelector('script[src*="hotjar"]')) {
      this.detectedTechs.analytics.push({ name: 'Hotjar' });
    }
  }

  detectCMS() {
    // WordPress
    if (document.querySelector('meta[name="generator"][content*="WordPress"]') ||
        document.querySelector('link[href*="wp-content"]') ||
        document.querySelector('script[src*="wp-content"]')) {
      this.detectedTechs.cms.push({ name: 'WordPress' });
    }

    // Shopify
    if (window.Shopify || document.querySelector('script[src*="shopify"]') ||
        document.querySelector('meta[name="generator"][content*="Shopify"]')) {
      this.detectedTechs.cms.push({ name: 'Shopify' });
    }

    // Drupal
    if (document.querySelector('meta[name="generator"][content*="Drupal"]') ||
        document.body.className.includes('drupal')) {
      this.detectedTechs.cms.push({ name: 'Drupal' });
    }

    // Joomla
    if (document.querySelector('meta[name="generator"][content*="Joomla"]')) {
      this.detectedTechs.cms.push({ name: 'Joomla' });
    }

    // Magento
    if (document.querySelector('script[src*="mage"]') || document.querySelector('body[class*="mage-"], body[class*="magento"]')) {
      this.detectedTechs.cms.push({ name: 'Magento' });
    }

    // WooCommerce (WordPress plugin)
    if (document.querySelector('script[src*="woocommerce"]') || document.body.innerHTML.includes('woocommerce')) {
      this.detectedTechs.cms.push({ name: 'WooCommerce' });
    }

    // OpenCart
    if (document.querySelector('meta[name="generator"][content*="OpenCart"]') ||
        document.body.innerHTML.includes('index.php?route=') ||
        document.cookie.includes('OCSESSID=')) {
      this.detectedTechs.cms.push({ name: 'OpenCart' });
    }

    // PrestaShop
    if (document.querySelector('meta[name="generator"][content*="PrestaShop"]') ||
        /PrestaShop/i.test(document.cookie)) {
      this.detectedTechs.cms.push({ name: 'PrestaShop' });
    }
  }

  detectLibraries() {
    // Lodash
    if (window._ && window._.VERSION) {
      this.detectedTechs.libraries.push({ name: 'Lodash', version: window._.VERSION });
    }

    // Moment.js
    if (window.moment) {
      this.detectedTechs.libraries.push({ name: 'Moment.js', version: window.moment.version });
    }

    // Chart.js
    if (window.Chart) {
      this.detectedTechs.libraries.push({ name: 'Chart.js' });
    }

    // D3.js
    if (window.d3) {
      this.detectedTechs.libraries.push({ name: 'D3.js', version: window.d3.version });
    }

    // Three.js
    if (window.THREE) {
      this.detectedTechs.libraries.push({ name: 'Three.js' });
    }
  }

  hasTailwindClasses() {
    const tailwindPatterns = [
      /\b(bg-|text-|p-|m-|w-|h-|flex|grid|hidden|block|inline)\w*/,
      /\b(hover:|focus:|active:|group-hover:)\w*/
    ];

    const allClasses = Array.from(document.querySelectorAll('*'))
      .map(el => el.className)
      .join(' ');

    return tailwindPatterns.some(pattern => pattern.test(allClasses));
  }

  async detectBackend() {
    // Next.js detection
    this.isNextJs = !!(window.__NEXT_DATA__ || document.querySelector('script[src*="_next"]'));

    if (this.isNextJs) {
      // Check for API routes more thoroughly
      const bodyHTML = document.body.innerHTML || '';
      const scriptsArr = Array.from(document.scripts);
      const apiIndicators = {
        bodyContainsApi: bodyHTML.includes('/api/'),
        bodyContainsTrpc: /(^|[^a-zA-Z])trpc([^a-zA-Z]|$)|\"\/trpc|\'\/trpc/.test(bodyHTML),
        bodyContainsGraphql: /graphql/i.test(bodyHTML),
        nextDataProps: !!window.__NEXT_DATA__?.props,
        scriptContainsApi: scriptsArr.some(script => script.textContent && (/\/api\//.test(script.textContent) || /\"\/trpc|\'\/trpc/.test(script.textContent) || /graphql/i.test(script.textContent))),
        fetchCalls: /fetch\([\"\']\/(api\/|trpc|graphql)/.test(bodyHTML),
        nextRouter: window.next?.router // Next.js router
      };

      if (apiIndicators.bodyContainsApi || apiIndicators.bodyContainsTrpc || apiIndicators.bodyContainsGraphql ||
          apiIndicators.scriptContainsApi ||
          apiIndicators.fetchCalls) {
        this.detectedTechs.backend.push({ name: 'Next.js API' });
      }
    }

    // Express.js via headers or meta tags
    const generator = document.querySelector('meta[name="generator"]');
    const powered = document.querySelector('meta[name="powered-by"]');

    if (generator?.content.includes('Express') || powered?.content.includes('Express')) {
      this.detectedTechs.backend.push({ name: 'Express.js' });
    }

    // FastAPI
    if (document.querySelector('script[src*="fastapi"]') ||
        document.querySelector('link[href*="fastapi"]') ||
        document.body.innerHTML.includes('fastapi')) {
      this.detectedTechs.backend.push({ name: 'FastAPI' });
    }

    // Django
    if (document.querySelector('input[name="csrfmiddlewaretoken"]') ||
        document.querySelector('script[src*="django"]') ||
        document.querySelector('meta[name="generator"][content*="Django"]')) {
      this.detectedTechs.backend.push({ name: 'Django' });
    }

    // Laravel (meta, scripts, cookies)
    if (document.querySelector('meta[name="csrf-token"]') ||
        document.querySelector('script[src*="laravel"]') ||
        document.querySelector('meta[name="generator"][content*="Laravel"]') ||
        document.cookie.includes('laravel_session=') ||
        document.cookie.includes('XSRF-TOKEN=') ||
        document.cookie.includes('remember_web=')) {
      this.detectedTechs.backend.push({ name: 'Laravel' });
    }

    // Generic PHP (cookies, DOM/resource URLs)
    try {
      const cookiesLower = (document.cookie || '').toLowerCase();
      const hasPhpSessId = cookiesLower.includes('phpsessid=');

      // Look for .php endpoints referenced in the page
      const nodes = [
        ...Array.from(document.querySelectorAll('a[href]')),
        ...Array.from(document.querySelectorAll('form[action]')),
        ...Array.from(document.querySelectorAll('script[src]')),
        ...Array.from(document.querySelectorAll('link[href]')),
        ...Array.from(document.querySelectorAll('img[src]'))
      ];
      const hasPhpUrl = nodes.some(el => {
        const url = el.getAttribute('href') || el.getAttribute('src') || el.getAttribute('action') || '';
        return /\.php(\?|$)/i.test(url);
      });

      // WordPress AJAX endpoint is a strong PHP signal
      const hasWpAjax = document.documentElement.outerHTML.includes('admin-ajax.php');
      const hasWpJson = document.documentElement.outerHTML.includes('/wp-json');

      if ((hasPhpSessId || hasPhpUrl || hasWpAjax || hasWpJson) &&
          !this.detectedTechs.backend.find(b => b.name === 'PHP')) {
        this.detectedTechs.backend.push({ name: 'PHP' });
      }
    } catch {}

    // Express session cookie
    try {
      const ck = (document.cookie || '');
      if (ck.includes('connect.sid=')) {
        if (!this.detectedTechs.backend.find(b => b.name === 'Express.js')) {
          this.detectedTechs.backend.push({ name: 'Express.js' });
        }
      }
    } catch {}

    // NextAuth cookies imply Next.js backend
    try {
      const ck = (document.cookie || '');
      if (ck.includes('next-auth.session-token=') || ck.includes('__Secure-next-auth.session-token=') || ck.includes('__Host-next-auth.session-token=')) {
        if (!this.detectedTechs.backend.find(b => b.name === 'Next.js API')) {
          this.detectedTechs.backend.push({ name: 'Next.js API' });
        }
      }
    } catch {}

    // CodeIgniter (cookie)
    if (document.cookie.toLowerCase().includes('ci_session=')) {
      this.detectedTechs.backend.push({ name: 'CodeIgniter' });
    }

    // Symfony (debug toolbar cookies rare in prod, but try body marker)
    if (document.querySelector('div.sf-toolbar') || document.querySelector('a.sf-toggle')) {
      this.detectedTechs.backend.push({ name: 'Symfony' });
    }

    // Koa (very weak client-side heuristics)
    if (document.querySelector('meta[name="generator"][content*="Koa"]')) {
      this.detectedTechs.backend.push({ name: 'Koa' });
    }

    // ASP.NET client hints via hidden inputs/antiforgery tokens
    if (document.querySelector('input[name="__RequestVerificationToken"]') ||
        document.cookie.includes('.AspNetCore.')) {
      this.detectedTechs.backend.push({ name: 'ASP.NET' });
    }
    // Classic ASP.NET session cookie
    try {
      const ck = (document.cookie || '').toLowerCase();
      if (ck.includes('asp.net_sessionid=')) {
        if (!this.detectedTechs.backend.find(b => b.name === 'ASP.NET')) {
          this.detectedTechs.backend.push({ name: 'ASP.NET' });
        }
      }
    } catch {}

    // Strapi (inline script mentions)
    const inlineText = Array.from(document.scripts).map(s => s.textContent || '').join(' ');
    if (/strapi/i.test(inlineText)) {
      this.detectedTechs.backend.push({ name: 'Strapi' });
    }
    // Laravel inline markers
    if (/window\.Laravel\b/i.test(inlineText) || /laravel-mix/i.test(inlineText)) {
      if (!this.detectedTechs.backend.find(b => b.name === 'Laravel')) {
        this.detectedTechs.backend.push({ name: 'Laravel' });
      }
    }

    // ASP.NET
    if (document.querySelector('form[action*="aspx"]') ||
        document.querySelector('input[name="__VIEWSTATE"]') ||
        document.querySelector('input[name="__VIEWSTATEGENERATOR"]')) {
      this.detectedTechs.backend.push({ name: 'ASP.NET' });
    }

    // Spring Boot
    if (document.querySelector('script[src*="spring"]') ||
        document.querySelector('meta[name="generator"][content*="Spring"]')) {
      this.detectedTechs.backend.push({ name: 'Spring Boot' });
    }

    // Ruby on Rails
    if (document.querySelector('meta[name="csrf-param"]') ||
        document.querySelector('script[src*="rails"]') ||
        document.querySelector('meta[name="generator"][content*="Rails"]')) {
      this.detectedTechs.backend.push({ name: 'Ruby on Rails' });
    }

    // Node.js indicators
    if (document.body.innerHTML.includes('node_modules') ||
        document.body.innerHTML.includes('nodejs')) {
      this.detectedTechs.backend.push({ name: 'Node.js' });
    }

    // Infer backend from CMS when applicable (PHP-based stacks)
    try {
      const phpCms = ['WordPress', 'Drupal', 'Joomla', 'Magento', 'OpenCart', 'PrestaShop', 'WooCommerce'];
      const cmsNames = (this.detectedTechs.cms || []).map(c => c.name);
      const isPhpBacked = cmsNames.some(n => phpCms.includes(n));
      if (isPhpBacked && !this.detectedTechs.backend.find(b => b.name === 'PHP')) {
        this.detectedTechs.backend.push({ name: 'PHP', inferred: true });
      }
    } catch {}

    // Try to detect via network requests
    await this.detectViaNetworkRequests();
  }

  detectDatabases() {
    // PostgreSQL - more specific checks
    if (document.querySelector('script[src*="postgres"]') ||
        document.querySelector('meta[name="database"][content*="postgres"]') ||
        (document.body.innerHTML.includes('postgresql') && document.body.innerHTML.includes('connect'))) {
      this.detectedTechs.databases.push({ name: 'PostgreSQL' });
    }

    // MongoDB - very specific checks only
    if (window.MongoDB ||
        document.querySelector('script[src*="mongodb.com"]') ||
        document.querySelector('script[src*="mongodbstitch"]') ||
        (document.body.innerHTML.includes('mongodb') && document.body.innerHTML.includes('cluster'))) {
      this.detectedTechs.databases.push({ name: 'MongoDB' });
    }

    // Firebase - specific indicators
    if (window.firebase ||
        document.querySelector('script[src*="firebase"]') ||
        document.querySelector('meta[name="firebase-app-id"]') ||
        document.querySelector('script[src*="firebaseapp.com"]') ||
        document.querySelector('script[src*="firebaseio.com"]') ||
        document.querySelector('script[src*="gstatic.com/firebasejs"]')) {
      this.detectedTechs.databases.push({ name: 'Firebase' });
    }

    // Supabase - specific indicators
    if (window.supabase ||
        document.querySelector('script[src*="supabase"]') ||
        document.querySelector('script[src*="supabase.co"]') ||
        document.querySelector('meta[name="supabase-url"]')) {
      this.detectedTechs.databases.push({ name: 'Supabase' });
    }

    // PlanetScale - specific indicators
    if (document.querySelector('script[src*="planetscale"]') ||
        document.querySelector('meta[name="database"][content*="planetscale"]')) {
      this.detectedTechs.databases.push({ name: 'PlanetScale' });
    }

    // MySQL - specific indicators
    if (document.querySelector('script[src*="mysql"]') ||
        document.querySelector('meta[name="database"][content*="mysql"]')) {
      this.detectedTechs.databases.push({ name: 'MySQL' });
    }

    // Redis - specific indicators
    if (document.querySelector('script[src*="redis"]') ||
        window.Redis ||
        document.querySelector('meta[name="cache"][content*="redis"]')) {
      this.detectedTechs.databases.push({ name: 'Redis' });
    }
  }

  detectHosting() {
    // Vercel - enhanced detection
    const hasNextScripts = document.querySelector('script[src*="_next"]');
    const nextDataExists = !!window.__NEXT_DATA__;

    const vercelIndicators = {
      metaXVercelId: document.querySelector('meta[name="x-vercel-id"]'),
      metaXVercelCache: document.querySelector('meta[name="x-vercel-cache"]'),
      vercelAppDomain: window.location.hostname.includes('vercel.app'),
      vercelInBody: document.body.innerHTML.includes('_vercel'),
      nextDataBuildId: window.__NEXT_DATA__?.buildId,
      nextDataDeploymentId: window.__NEXT_DATA__?.deploymentId,
      vercelScripts: document.querySelector('script[src*="vercel"]'),
      vercelAnalytics: window.va, // Vercel Analytics
      hasNextScripts: hasNextScripts,
      nextDataExists: nextDataExists
    };

    // Detect Vercel only with strong indicators
    if (vercelIndicators.metaXVercelId ||
        vercelIndicators.metaXVercelCache ||
        vercelIndicators.vercelAppDomain ||
        vercelIndicators.nextDataDeploymentId ||
        vercelIndicators.vercelAnalytics) {
      this.detectedTechs.hosting.push({ name: 'Vercel' });
    }

    // Netlify
    if (document.querySelector('meta[name="netlify"]') ||
        document.querySelector('meta[name="netlify-deploy-id"]') ||
        window.location.hostname.includes('netlify.app') ||
        document.body.innerHTML.includes('netlify')) {
      this.detectedTechs.hosting.push({ name: 'Netlify' });
    }

    // GitHub Pages
    if (window.location.hostname.includes('github.io')) {
      this.detectedTechs.hosting.push({ name: 'GitHub Pages' });
    }

    // Cloudflare
    if (document.querySelector('meta[name="cf-ray"]') ||
        document.body.innerHTML.includes('cloudflare') ||
        document.querySelector('script[src*="cloudflare"]')) {
      this.detectedTechs.hosting.push({ name: 'Cloudflare' });
    }

    // AWS
    if (document.body.innerHTML.includes('amazonaws') ||
        document.body.innerHTML.includes('aws-amplify') ||
        document.body.innerHTML.includes('cloudfront')) {
      this.detectedTechs.hosting.push({ name: 'AWS' });
    }

    // Heroku
    if (window.location.hostname.includes('herokuapp.com')) {
      this.detectedTechs.hosting.push({ name: 'Heroku' });
    }

    // Railway
    if (window.location.hostname.includes('railway.app')) {
      this.detectedTechs.hosting.push({ name: 'Railway' });
    }

    // Azure App Service
    try {
      const host = (window.location.hostname || '').toLowerCase();
      const cookies = (document.cookie || '');
      const azureCookie = cookies.includes('ARRAffinity=') || cookies.includes('ARRAffinitySameSite=') || cookies.includes('ApplicationGatewayAffinity=');
      if (host.includes('azurewebsites.net') || azureCookie) {
        if (!this.detectedTechs.hosting.find(h => h.name === 'Azure App Service')) {
          this.detectedTechs.hosting.push({ name: 'Azure App Service' });
        }
      }
    } catch {}

    // Optional: detect hosting via response headers (same-origin only)
    if (this.settings.enableHeaderHostingDetection) {
      this.detectHostingViaHeaders().catch(() => {});
    }
  }

  async detectHostingViaHeaders() {
    try {
      const controller = new AbortController();
      const to = setTimeout(() => controller.abort(), Math.max(200, Math.min(2000, this.settings.headerDetectionTimeoutMs || 800)));
      const res = await fetch(window.location.href, { method: 'GET', cache: 'no-store', credentials: 'same-origin', signal: controller.signal });
      clearTimeout(to);
      const headers = res.headers;
      const hv = (k) => (headers.get(k) || '').toLowerCase();

      // Vercel indicators
      const vercel = hv('x-vercel-id') || hv('x-vercel-cache') || hv('server').includes('vercel') || hv('x-now-trace');
      if (vercel) {
        const existing = this.detectedTechs.hosting.find(h => h.name === 'Vercel');
        if (existing) {
          existing.via = existing.via || 'headers';
        } else {
          this.detectedTechs.hosting.push({ name: 'Vercel', via: 'headers' });
        }
        runtime?.sendMessage?.({ action: 'techDetected', data: this.detectedTechs });
      }

      // Netlify
      const netlify = hv('x-nf-request-id') || hv('server').includes('netlify');
      if (netlify) {
        const existing = this.detectedTechs.hosting.find(h => h.name === 'Netlify');
        if (existing) {
          existing.via = existing.via || 'headers';
        } else {
          this.detectedTechs.hosting.push({ name: 'Netlify', via: 'headers' });
        }
        runtime?.sendMessage?.({ action: 'techDetected', data: this.detectedTechs });
      }

      // Cloudflare
      const cloudflare = hv('cf-ray') || hv('server').includes('cloudflare');
      if (cloudflare) {
        const existing = this.detectedTechs.hosting.find(h => h.name === 'Cloudflare');
        if (existing) {
          existing.via = existing.via || 'headers';
        } else {
          this.detectedTechs.hosting.push({ name: 'Cloudflare', via: 'headers' });
        }
        runtime?.sendMessage?.({ action: 'techDetected', data: this.detectedTechs });
      }

      // AWS CloudFront
      const cloudfront = hv('server').includes('cloudfront') || hv('x-amz-cf-id');
      if (cloudfront) {
        const existing = this.detectedTechs.hosting.find(h => h.name === 'AWS');
        if (existing) {
          existing.via = existing.via || 'headers';
        } else {
          this.detectedTechs.hosting.push({ name: 'AWS', via: 'headers' });
        }
        runtime?.sendMessage?.({ action: 'techDetected', data: this.detectedTechs });
      }
    } catch {}
  }

  getReactVersion() {
    // Try multiple methods to get React version
    if (window.React?.version) return window.React.version;

    // Check for React DevTools
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers) {
      const renderers = Array.from(window.__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.values());
      if (renderers[0]?.version) return renderers[0].version;
    }

    // Check script tags
    const scripts = document.querySelectorAll('script[src*="react"]');
    for (const script of scripts) {
      const versionMatch = script.src.match(/react[@\/](\d+\.\d+\.\d+)/);
      if (versionMatch) return versionMatch[1];
    }

    return 'Unknown';
  }

  getVueVersion() {
    if (window.Vue?.version) return window.Vue.version;
    if (window.Vue?.config?.globalProperties?.$vue?.version) return window.Vue.config.globalProperties.$vue.version;

    // Check for Vue 3
    if (window.__VUE__) return '3.x';

    return 'Unknown';
  }

  getAngularVersion() {
    if (window.ng?.version?.full) return window.ng.version.full;
    if (window.angular?.version?.full) return window.angular.version.full;

    // Check for Angular elements
    const ngElements = document.querySelectorAll('[ng-version]');
    if (ngElements.length > 0) {
      return ngElements[0].getAttribute('ng-version') || 'Unknown';
    }

    return 'Unknown';
  }

  async detectViaNetworkRequests() {
    try {
      // Check for common API endpoints
      const scripts = document.querySelectorAll('script[src]');
      const links = document.querySelectorAll('link[href]');

      const allUrls = [
        ...Array.from(scripts).map(s => s.src),
        ...Array.from(links).map(l => l.href)
      ];


      // Check for specific service URLs
      allUrls.forEach(url => {
        // Supabase detection (more patterns)
        if (url.includes('supabase.co') ||
            url.includes('supabase.com') ||
            url.includes('supabase.io') ||
            url.includes('.supabase.') ||
            url.match(/[a-z]+\.supabase\.co/)) {
          if (!this.detectedTechs.databases.find(d => d.name === 'Supabase')) {
            this.detectedTechs.databases.push({ name: 'Supabase' });
          }
        }

        // Firebase detection
        if (url.includes('firebase') && (url.includes('googleapis.com') || url.includes('firebaseapp.com'))) {
          if (!this.detectedTechs.databases.find(d => d.name === 'Firebase')) {
            this.detectedTechs.databases.push({ name: 'Firebase' });
          }
        }

        // Vercel detection
        if ((url.includes('vercel') || url.includes('_vercel')) && !url.includes('vercel.svg')) {
          if (!this.detectedTechs.hosting.find(h => h.name === 'Vercel')) {
            this.detectedTechs.hosting.push({ name: 'Vercel' });
          }
        }
      });

      // Additional checks in inline scripts and text content
      const allScripts = Array.from(document.scripts);
      const scriptContents = allScripts.map(s => s.textContent || '').join(' ');

      // Look for database connection strings or config (more patterns)
      const databasePatterns = {
        supabase: scriptContents.includes('supabase') ||
                 scriptContents.includes('SUPABASE') ||
                 scriptContents.includes('.co/auth') ||
                 scriptContents.includes('anon.') ||
                 scriptContents.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'), // JWT pattern
        postgres: scriptContents.includes('postgres') ||
                 scriptContents.includes('postgresql') ||
                 scriptContents.includes('pg_') ||
                 scriptContents.includes('5432') || // default postgres port
                 scriptContents.includes('PGPASSWORD')
      };


      if (databasePatterns.supabase) {
        if (!this.detectedTechs.databases.find(d => d.name === 'Supabase')) {
          this.detectedTechs.databases.push({ name: 'Supabase' });
        }
      }

      if (databasePatterns.postgres) {
        if (!this.detectedTechs.databases.find(d => d.name === 'PostgreSQL')) {
          this.detectedTechs.databases.push({ name: 'PostgreSQL' });
        }
      }

      // Firebase via inline init patterns
      if ((/firebase/i.test(scriptContents) && (/initializeApp\(/.test(scriptContents) || /firebaseConfig/i.test(scriptContents))) ||
          /gstatic\.com\/firebasejs/i.test(currentPageContent) ||
          /firebaseio\.com/i.test(currentPageContent) ||
          /firestore\.googleapis\.com/i.test(currentPageContent) ||
          /identitytoolkit\.googleapis\.com/i.test(currentPageContent)) {
        if (!this.detectedTechs.databases.find(d => d.name === 'Firebase')) {
          this.detectedTechs.databases.push({ name: 'Firebase' });
        }
      }

      // If Supabase is present, infer PostgreSQL (Supabase uses Postgres)
      if (this.detectedTechs.databases.find(d => d.name === 'Supabase') &&
          !this.detectedTechs.databases.find(d => d.name === 'PostgreSQL')) {
        this.detectedTechs.databases.push({ name: 'PostgreSQL', inferred: true });
      }


      // Resource-level scan (Performance API) for backend/db hints
      try {
        const entries = performance?.getEntriesByType?.('resource') || [];
        for (const e of entries) {
          const name = (e.name || '').toString();
          const sameOrigin = this.isSameOrigin(name);
          if (/\.php(\?|$)/i.test(name)) {
            if (!this.detectedTechs.backend.find(b => b.name === 'PHP')) {
              this.detectedTechs.backend.push({ name: 'PHP' });
            }
          }
          if (/\.aspx(\?|$)/i.test(name) || name.includes('__VIEWSTATE')) {
            if (!this.detectedTechs.backend.find(b => b.name === 'ASP.NET')) {
              this.detectedTechs.backend.push({ name: 'ASP.NET' });
            }
          }
          if (this.isNextJs && sameOrigin && (/\/api\//.test(name) || /\/(trpc|graphql)(\?|\/|$)/i.test(name))) {
            if (!this.detectedTechs.backend.find(b => b.name === 'Next.js API')) {
              this.detectedTechs.backend.push({ name: 'Next.js API' });
            }
          }
          
          if (/\/rest\/v1|\/auth\/v1|\/realtime\/v1/i.test(name)) {
            if (!this.detectedTechs.databases.find(d => d.name === 'Supabase')) {
              this.detectedTechs.databases.push({ name: 'Supabase', inferred: true });
            }
          }
          if (/firebaseio\.com|firestore\.googleapis\.com|identitytoolkit\.googleapis\.com|gstatic\.com\/firebasejs/i.test(name)) {
            if (!this.detectedTechs.databases.find(d => d.name === 'Firebase')) {
              this.detectedTechs.databases.push({ name: 'Firebase' });
            }
          }
          if (this.isNextJs && name.includes('/api/')) {
            if (!this.detectedTechs.backend.find(b => b.name === 'Next.js API')) {
              this.detectedTechs.backend.push({ name: 'Next.js API' });
            }
          }
        }
      } catch {}

      // Check window object for framework/service clues
      const windowKeys = Object.keys(window);

      // Check for common API endpoints in current page
      const currentPageContent = document.documentElement.outerHTML;
      if (currentPageContent.includes('/api/') && this.isNextJs) {
        if (!this.detectedTechs.backend.find(b => b.name === 'Next.js API')) {
          this.detectedTechs.backend.push({ name: 'Next.js API' });
        }
      }

      // Attempt to scan Next.js chunk files for embedded supabase config (with budget)
      try {
        const enable = !!this.settings.enableChunkScan;
        if (enable) {
          const limit = Math.max(1, Math.min(50, this.settings.chunkScanMaxFiles || 15));
          const deadline = Date.now() + Math.max(100, Math.min(2000, this.settings.chunkScanMaxTimeMs || 500));
          const chunkUrls = allUrls.filter(u => u.includes('/_next/static/chunks/') && u.endsWith('.js'))
                                   .slice(0, limit);
          for (const cu of chunkUrls) {
            if (Date.now() > deadline) { break; }
            try {
              const res = await fetch(cu, { credentials: 'omit' });
              if (res.ok) {
                const text = await res.text();
                const hasSupabase = /supabase/i.test(text) || /createClient\(/i.test(text) || /@supabase\//i.test(text) || /\.supabase\.(co|com|io)/i.test(text);
                if (hasSupabase) {
                  if (!this.detectedTechs.databases.find(d => d.name === 'Supabase')) {
                    this.detectedTechs.databases.push({ name: 'Supabase' });
                    this.detectedTechs.databases.push({ name: 'PostgreSQL', inferred: true });
                  }
                  break;
                }
              }
            } catch (e) {
            }
          }
        }
      } catch {}

      // Listen for future network requests (if any happen)
      this.setupNetworkListening();

    } catch (error) {
    }
  }

  setupNetworkListening() {
    const self = this;
    // Override fetch to catch API calls
    if (!window.__TD_FETCH_WRAPPED__) {
      window.__TD_FETCH_WRAPPED__ = true;
      const originalFetch = window.fetch;
      window.fetch = (...args) => {
        const url = args[0];

      if (typeof url === 'string') {
        if (url.includes('supabase.co') || url.includes('supabase.com')) {
          if (!self.detectedTechs.databases.find(d => d.name === 'Supabase')) {
            self.detectedTechs.databases.push({ name: 'Supabase' });
            self.detectedTechs.databases.push({ name: 'PostgreSQL', inferred: true });
            runtime.sendMessage({ action: 'techDetected', data: self.detectedTechs });
          }
        }

        try {
          const u = new URL(url, window.location.href);
          const p = u.pathname || '';
          const sameOrigin = (u.origin === window.location.origin);
          if (sameOrigin && (p.includes('/api/') || p.startsWith('/trpc') || p.includes('/graphql'))) {
            if (!self.detectedTechs.backend.find(b => b.name === 'Next.js API')) {
              self.detectedTechs.backend.push({ name: 'Next.js API' });
              runtime.sendMessage({ action: 'techDetected', data: self.detectedTechs });
            }
          }
          // Same-site subdomain API patterns → infer Node.js backend
          
        } catch {}
        if (/\.php(\?|$)/i.test(url)) {
          if (!self.detectedTechs.backend.find(b => b.name === 'PHP')) {
            self.detectedTechs.backend.push({ name: 'PHP' });
            runtime.sendMessage({ action: 'techDetected', data: self.detectedTechs });
          }
        }
        if (/\.aspx(\?|$)/i.test(url)) {
          if (!self.detectedTechs.backend.find(b => b.name === 'ASP.NET')) {
            self.detectedTechs.backend.push({ name: 'ASP.NET' });
            runtime.sendMessage({ action: 'techDetected', data: self.detectedTechs });
          }
        }
        if (/\/rest\/v1|\/auth\/v1|\/realtime\/v1/i.test(url)) {
          if (!self.detectedTechs.databases.find(d => d.name === 'Supabase')) {
            self.detectedTechs.databases.push({ name: 'Supabase', inferred: true });
            runtime.sendMessage({ action: 'techDetected', data: self.detectedTechs });
          }
        }
        if (/firebaseio\.com|firestore\.googleapis\.com|identitytoolkit\.googleapis\.com|gstatic\.com\/firebasejs/i.test(url)) {
          if (!self.detectedTechs.databases.find(d => d.name === 'Firebase')) {
            self.detectedTechs.databases.push({ name: 'Firebase' });
            runtime.sendMessage({ action: 'techDetected', data: self.detectedTechs });
          }
        }
      }

        const p = originalFetch(...args);
        try {
          return p.then(res => {
            try {
              const hv = (k) => (res.headers?.get?.(k) || '').toLowerCase();
              const xpb = hv('x-powered-by');
              const server = hv('server');

              if (xpb.includes('express') || server.includes('express')) {
                if (!self.detectedTechs.backend.find(b => b.name === 'Express.js')) {
                  self.detectedTechs.backend.push({ name: 'Express.js' });
                  runtime.sendMessage({ action: 'techDetected', data: self.detectedTechs });
                }
              }
              if (xpb.includes('fastify') || server.includes('fastify')) {
                if (!self.detectedTechs.backend.find(b => b.name === 'Fastify')) {
                  self.detectedTechs.backend.push({ name: 'Fastify' });
                  runtime.sendMessage({ action: 'techDetected', data: self.detectedTechs });
                }
              }
              if (xpb.includes('nestjs') || server.includes('nest')) {
                if (!self.detectedTechs.backend.find(b => b.name === 'NestJS')) {
                  self.detectedTechs.backend.push({ name: 'NestJS' });
                  runtime.sendMessage({ action: 'techDetected', data: self.detectedTechs });
                }
              }
              if (server.includes('node')) {
                if (!self.detectedTechs.backend.find(b => b.name === 'Node.js')) {
                  self.detectedTechs.backend.push({ name: 'Node.js' });
                  runtime.sendMessage({ action: 'techDetected', data: self.detectedTechs });
                }
              }
            } catch {}
            return res;
          });
        } catch {}
        return p;
      };
    }

    // Hook XMLHttpRequest to catch API and service calls
    if (!window.__TD_XHR_WRAPPED__) {
      window.__TD_XHR_WRAPPED__ = true;
      const OriginalXHR = window.XMLHttpRequest;
      function WrappedXHR() {
        const xhr = new OriginalXHR();
        const originalOpen = xhr.open;
        const originalSend = xhr.send;
        xhr.open = function(method, url, ...rest) {
          try {
            if (typeof url === 'string') {
              try { xhr.__td_url = new URL(url, window.location.href).toString(); } catch { xhr.__td_url = url; }
              if (url.includes('supabase.co') || url.includes('supabase.com')) {
                if (!self.detectedTechs.databases.find(d => d.name === 'Supabase')) {
                  self.detectedTechs.databases.push({ name: 'Supabase' });
                  self.detectedTechs.databases.push({ name: 'PostgreSQL', inferred: true });
                  runtime.sendMessage({ action: 'techDetected', data: self.detectedTechs });
                }
              }
              try {
                const u = new URL(url, window.location.href);
                const p = u.pathname || '';
                const sameOrigin = (u.origin === window.location.origin);
                if (sameOrigin && (p.includes('/api/') || p.startsWith('/trpc') || p.includes('/graphql'))) {
                  if (!self.detectedTechs.backend.find(b => b.name === 'Next.js API')) {
                    self.detectedTechs.backend.push({ name: 'Next.js API' });
                    runtime.sendMessage({ action: 'techDetected', data: self.detectedTechs });
                  }
                }
                
              } catch {}
              if (/\.php(\?|$)/i.test(url)) {
                if (!self.detectedTechs.backend.find(b => b.name === 'PHP')) {
                  self.detectedTechs.backend.push({ name: 'PHP' });
                  runtime.sendMessage({ action: 'techDetected', data: self.detectedTechs });
                }
              }
              if (/\.aspx(\?|$)/i.test(url)) {
                if (!self.detectedTechs.backend.find(b => b.name === 'ASP.NET')) {
                  self.detectedTechs.backend.push({ name: 'ASP.NET' });
                  runtime.sendMessage({ action: 'techDetected', data: self.detectedTechs });
                }
              }
              if (/\/rest\/v1|\/auth\/v1|\/realtime\/v1/i.test(url)) {
                if (!self.detectedTechs.databases.find(d => d.name === 'Supabase')) {
                  self.detectedTechs.databases.push({ name: 'Supabase', inferred: true });
                  runtime.sendMessage({ action: 'techDetected', data: self.detectedTechs });
                }
              }
              if (/firebaseio\.com|firestore\.googleapis\.com|identitytoolkit\.googleapis\.com|gstatic\.com\/firebasejs/i.test(url)) {
                if (!self.detectedTechs.databases.find(d => d.name === 'Firebase')) {
                  self.detectedTechs.databases.push({ name: 'Firebase' });
                  runtime.sendMessage({ action: 'techDetected', data: self.detectedTechs });
                }
              }
            }
          } catch {}
          return originalOpen.call(xhr, method, url, ...rest);
        };
        xhr.addEventListener('readystatechange', function() {
          try {
            if (xhr.readyState === 2 || xhr.readyState === 4) {
              const get = (k) => (xhr.getResponseHeader(k) || '').toLowerCase();
              const xpb = get('x-powered-by');
              const server = get('server');

              if (xpb.includes('express') || server.includes('express')) {
                if (!self.detectedTechs.backend.find(b => b.name === 'Express.js')) {
                  self.detectedTechs.backend.push({ name: 'Express.js' });
                  runtime.sendMessage({ action: 'techDetected', data: self.detectedTechs });
                }
              }
              if (xpb.includes('fastify') || server.includes('fastify')) {
                if (!self.detectedTechs.backend.find(b => b.name === 'Fastify')) {
                  self.detectedTechs.backend.push({ name: 'Fastify' });
                  runtime.sendMessage({ action: 'techDetected', data: self.detectedTechs });
                }
              }
              if (xpb.includes('nestjs') || server.includes('nest')) {
                if (!self.detectedTechs.backend.find(b => b.name === 'NestJS')) {
                  self.detectedTechs.backend.push({ name: 'NestJS' });
                  runtime.sendMessage({ action: 'techDetected', data: self.detectedTechs });
                }
              }
              if (server.includes('node')) {
                if (!self.detectedTechs.backend.find(b => b.name === 'Node.js')) {
                  self.detectedTechs.backend.push({ name: 'Node.js' });
                  runtime.sendMessage({ action: 'techDetected', data: self.detectedTechs });
                }
              }
            }
          } catch {}
        });
        xhr.send = function(...a) { try {} catch {} return originalSend.apply(xhr, a); };
        return xhr;
      }
      window.XMLHttpRequest = WrappedXHR;
    }

    // Hook sendBeacon for lightweight pings to /api
    if (navigator.sendBeacon && !window.__TD_BEACON_WRAPPED__) {
      window.__TD_BEACON_WRAPPED__ = true;
      const originalBeacon = navigator.sendBeacon.bind(navigator);
      navigator.sendBeacon = (url, data) => {
        try {
          try {
            const u = new URL(url, window.location.href);
            const p = u.pathname || '';
            const sameOrigin = (u.origin === window.location.origin);
            if (sameOrigin && (p.includes('/api/') || p.startsWith('/trpc') || p.includes('/graphql'))) {
              if (!self.detectedTechs.backend.find(b => b.name === 'Next.js API')) {
                self.detectedTechs.backend.push({ name: 'Next.js API' });
                runtime.sendMessage({ action: 'techDetected', data: self.detectedTechs });
              }
            }
            
          } catch {}
          if (typeof url === 'string' && /\.php(\?|$)/i.test(url)) {
            if (!self.detectedTechs.backend.find(b => b.name === 'PHP')) {
              self.detectedTechs.backend.push({ name: 'PHP' });
              runtime.sendMessage({ action: 'techDetected', data: self.detectedTechs });
            }
          }
          if (typeof url === 'string' && /\.aspx(\?|$)/i.test(url)) {
            if (!self.detectedTechs.backend.find(b => b.name === 'ASP.NET')) {
              self.detectedTechs.backend.push({ name: 'ASP.NET' });
              runtime.sendMessage({ action: 'techDetected', data: self.detectedTechs });
            }
          }
          if (typeof url === 'string' && /\/rest\/v1|\/auth\/v1|\/realtime\/v1/i.test(url)) {
            if (!self.detectedTechs.databases.find(d => d.name === 'Supabase')) {
              self.detectedTechs.databases.push({ name: 'Supabase', inferred: true });
              runtime.sendMessage({ action: 'techDetected', data: self.detectedTechs });
            }
          }
          if (typeof url === 'string' && /firebaseio\.com|firestore\.googleapis\.com|identitytoolkit\.googleapis\.com|gstatic\.com\/firebasejs/i.test(url)) {
            if (!self.detectedTechs.databases.find(d => d.name === 'Firebase')) {
              self.detectedTechs.databases.push({ name: 'Firebase' });
              runtime.sendMessage({ action: 'techDetected', data: self.detectedTechs });
            }
          }
        } catch {}
        return originalBeacon(url, data);
      };
    }

    // Hook WebSocket to catch Supabase Realtime and API gateways
    if (!window.__TD_WS_WRAPPED__) {
      window.__TD_WS_WRAPPED__ = true;
      const OriginalWS = window.WebSocket;
      try {
        window.WebSocket = function(url, protocols) {
          try {
            const u = typeof url === 'string' ? url : (url && url.url) || '';
            if (u.includes('supabase.co') || u.includes('supabase.com')) {
              if (!self.detectedTechs.databases.find(d => d.name === 'Supabase')) {
                self.detectedTechs.databases.push({ name: 'Supabase' });
                self.detectedTechs.databases.push({ name: 'PostgreSQL', inferred: true });
                runtime.sendMessage({ action: 'techDetected', data: self.detectedTechs });
              }
            }
          } catch {}
          return new OriginalWS(url, protocols);
        };
        window.WebSocket.prototype = OriginalWS.prototype;
      } catch {}
    }

  }

  detectClientStorage() {
    try {
      // Supabase Auth stores localStorage keys starting with sb-
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i) || '';
        if (key.startsWith('sb-') || key.toLowerCase().includes('supabase')) {
          if (!this.detectedTechs.databases.find(d => d.name === 'Supabase')) {
            this.detectedTechs.databases.push({ name: 'Supabase' });
            this.detectedTechs.databases.push({ name: 'PostgreSQL', inferred: true });
          }
        }
      }
    } catch {}

    try {
      const cookies = document.cookie || '';
      if (cookies.toLowerCase().includes('supabase')) {
        if (!this.detectedTechs.databases.find(d => d.name === 'Supabase')) {
          this.detectedTechs.databases.push({ name: 'Supabase' });
          this.detectedTechs.databases.push({ name: 'PostgreSQL', inferred: true });
        }
      }
    } catch {}

    // Firebase local clues: localStorage prefixes and IndexedDB database names
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i) || '';
        if (key.startsWith('firebase:') || key.includes('firebaseAuth') || key.includes('firebase:host:')) {
          if (!this.detectedTechs.databases.find(d => d.name === 'Firebase')) {
            this.detectedTechs.databases.push({ name: 'Firebase' });
          }
          break;
        }
      }
    } catch {}

    try {
      const dbsPromise = indexedDB?.databases?.();
      if (dbsPromise && typeof dbsPromise.then === 'function') {
        dbsPromise.then((dbs) => {
          const names = (dbs || []).map(d => (d && d.name) || '').filter(Boolean);
          const hasFirebaseIDB = names.some(n => n === 'firebaseLocalStorageDb' || n === 'firebase-installations-database');
          if (hasFirebaseIDB && !this.detectedTechs.databases.find(d => d.name === 'Firebase')) {
            this.detectedTechs.databases.push({ name: 'Firebase' });
            runtime?.sendMessage?.({ action: 'techDetected', data: this.detectedTechs });
          }
        }).catch(() => {});
      }
    } catch {}
  }
}

// Export TechDetector for Firefox direct access
window.TechDetector = TechDetector;

// Re-runnable detection entrypoint
window.__runTechDetector = async () => {
  try {
    const detector = new TechDetector();
    await detector.loadSettings?.();
    const detectedTechs = await detector.detect();

    // Store for Firefox fallback
    window.__detectedTechs = detectedTechs;

    runtime.sendMessage({ action: 'techDetected', data: detectedTechs });
    return detectedTechs;
  } catch (e) {
    console.error('Content script error:', e);
    return null;
  }
};

// Content script çalıştığında teknolojileri tespit et
window.__runTechDetector();

})();
