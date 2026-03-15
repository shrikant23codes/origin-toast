// Made Where? – Content Script
// Detects country of origin on apparel product pages and shows a small toast.

const COUNTRY_FLAGS = {
  "Afghanistan": "🇦🇫", "Albania": "🇦🇱", "Algeria": "🇩🇿", "Argentina": "🇦🇷",
  "Australia": "🇦🇺", "Austria": "🇦🇹", "Bangladesh": "🇧🇩", "Belgium": "🇧🇪",
  "Bolivia": "🇧🇴", "Brazil": "🇧🇷", "Bulgaria": "🇧🇬", "Cambodia": "🇰🇭",
  "Canada": "🇨🇦", "Chile": "🇨🇱", "China": "🇨🇳", "Colombia": "🇨🇴",
  "Croatia": "🇭🇷", "Czech Republic": "🇨🇿", "Denmark": "🇩🇰", "Egypt": "🇪🇬",
  "Ethiopia": "🇪🇹", "Finland": "🇫🇮", "France": "🇫🇷", "Germany": "🇩🇪",
  "Ghana": "🇬🇭", "Greece": "🇬🇷", "Guatemala": "🇬🇹", "Honduras": "🇭🇳",
  "Hong Kong": "🇭🇰", "Hungary": "🇭🇺", "India": "🇮🇳", "Indonesia": "🇮🇩",
  "Iran": "🇮🇷", "Israel": "🇮🇱", "Italy": "🇮🇹", "Japan": "🇯🇵",
  "Jordan": "🇯🇴", "Kenya": "🇰🇪", "Laos": "🇱🇦", "Lebanon": "🇱🇧",
  "Madagascar": "🇲🇬", "Malaysia": "🇲🇾", "Mauritius": "🇲🇺", "Mexico": "🇲🇽",
  "Morocco": "🇲🇦", "Myanmar": "🇲🇲", "Nepal": "🇳🇵", "Netherlands": "🇳🇱",
  "New Zealand": "🇳🇿", "Nicaragua": "🇳🇮", "Nigeria": "🇳🇬", "North Korea": "🇰🇵",
  "Pakistan": "🇵🇰", "Peru": "🇵🇪", "Philippines": "🇵🇭", "Poland": "🇵🇱",
  "Portugal": "🇵🇹", "Romania": "🇷🇴", "Russia": "🇷🇺", "Senegal": "🇸🇳",
  "Singapore": "🇸🇬", "South Africa": "🇿🇦", "South Korea": "🇰🇷", "Spain": "🇪🇸",
  "Sri Lanka": "🇱🇰", "Sweden": "🇸🇪", "Switzerland": "🇨🇭", "Taiwan": "🇹🇼",
  "Tanzania": "🇹🇿", "Thailand": "🇹🇭", "Tunisia": "🇹🇳", "Turkey": "🇹🇷",
  "Türkiye": "🇹🇷", "Uganda": "🇺🇬", "Ukraine": "🇺🇦", "United Kingdom": "🇬🇧",
  "UK": "🇬🇧", "United States": "🇺🇸", "USA": "🇺🇸", "Uruguay": "🇺🇾",
  "Uzbekistan": "🇺🇿", "Vietnam": "🇻🇳", "Yemen": "🇾🇪", "Zimbabwe": "🇿🇼"
};

const DEBUG = true;

function debugLog(...args) {
  if (!DEBUG) return;
  console.log('[MadeWhere]', ...args);
}

// Convenience helper so we do not repeat hostname checks everywhere.
function isMyntra() {
  return window.location.hostname.includes('myntra.com');
}

// Country name aliases for flexible matching
const COUNTRY_ALIASES = {
  "prc": "China", "people's republic of china": "China", "peoples republic of china": "China",
  "p.r.c": "China", "p.r. china": "China",
  "viet nam": "Vietnam", "việt nam": "Vietnam",
  "republic of korea": "South Korea", "korea": "South Korea", "rok": "South Korea",
  "dprk": "North Korea",
  "united states of america": "United States", "u.s.a": "United States", "u.s": "United States",
  "great britain": "United Kingdom", "england": "United Kingdom", "britain": "United Kingdom",
  "türkiye": "Turkey", "turkiye": "Turkey",
  "czechia": "Czech Republic",
  "burma": "Myanmar"
};

// Keyword patterns to search for
const ORIGIN_PATTERNS = [
  /country\s+of\s+origin\s*[:\-–—]?\s*([A-Za-z\s,\.]+)/i,
  /made\s+in\s*[:\-–—]?\s*([A-Za-z\s,\.]+)/i,
  /manufactured\s+in\s*[:\-–—]?\s*([A-Za-z\s,\.]+)/i,
  /product\s+of\s*[:\-–—]?\s*([A-Za-z\s,\.]+)/i,
  /origin\s*[:\-–—]\s*([A-Za-z\s,\.]+)/i,
  /imported\s+from\s*[:\-–—]?\s*([A-Za-z\s,\.]+)/i,
];

// Site-specific selectors to check first (faster than full-page scan)
const SITE_SELECTORS = {
  "myntra.com": [
    ".pdp-product-description-content",
    ".pdp-sizeguide-header",
    '[class*="description"]',
    '[class*="detail"]',
    '[class*="specification"]',
    '[class*="product-desc"]',
    ".index-tableContainer",
    ".index-row",
    ".Modal-modalContent",
    ".details-details"
  ],
  "uniqlo.com": [
    '[class*="ProductFeatures"]',
    '[class*="product-features"]',
    '[class*="description"]',
    ".fr-body",
    '[data-testid*="feature"]',
    '[class*="Detail"]'
  ],
  "hm.com": [
    ".product-description-content",
    '[class*="description"]',
    ".details-attributes-list",
    '[class*="product-details"]',
    "section.accordion"
  ],
  "zara.com": [
    '[class*="description"]',
    '[class*="composition"]',
    '[class*="product-detail"]',
    ".product-detail-info__content"
  ],
  "amazon": [
    "#detailBullets_feature_div",
    "#productDetails_techSpec_section_1",
    "#productDetails_feature_div",
    "#feature-bullets",
    ".a-expander-content",
    "#aplus"
  ],
  "flipkart.com": [
    "._1AtVbE",
    '[class*="specification"]',
    '[class*="_3k-BhJ"]',
    "._2418kt",
    "table.attributes",
    "._3 counterIe"
  ],
  "ajio.com": [
    ".prod-desc",
    '[class*="description"]',
    '[class*="detail"]',
    ".prod-list"
  ],
  "default": [
    '[class*="description"]',
    '[class*="detail"]',
    '[class*="specification"]',
    '[class*="product-info"]',
    '[class*="additional-info"]',
    'table',
    '[class*="accordion"]',
    '[class*="feature"]'
  ]
};

function getCurrentHostSelectors() {
  const host = window.location.hostname;
  for (const [key, selectors] of Object.entries(SITE_SELECTORS)) {
    if (host.includes(key)) return selectors;
  }
  return SITE_SELECTORS.default;
}

function normalizeCountry(rawText) {
  const cleaned = rawText.trim().replace(/[.,;:!?]+$/, '').trim();
  // Check aliases first
  const lower = cleaned.toLowerCase();
  if (COUNTRY_ALIASES[lower]) return COUNTRY_ALIASES[lower];
  // Direct match in flags dict
  for (const country of Object.keys(COUNTRY_FLAGS)) {
    if (country.toLowerCase() === lower) return country;
  }
  // Partial match – country name contained in text
  for (const country of Object.keys(COUNTRY_FLAGS)) {
    if (lower.includes(country.toLowerCase()) && country.length > 3) return country;
  }
  return cleaned;
}

function findCountryInText(text) {
  // Tries each keyword pattern and returns a normalized country string if found.
  for (const pattern of ORIGIN_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].split(/[\n\r\|]/)[0].trim();
      if (candidate.length > 1 && candidate.length < 50) {
        return normalizeCountry(candidate);
      }
    }
  }
  return null;
}

function scanElements(selectors) {
  // Walk through a list of CSS selectors and try to extract a country
  // from the inner text of matching elements.
  for (const selector of selectors) {
    try {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        const text = el.innerText || el.textContent || '';
        const country = findCountryInText(text);
        if (country) return country;
      }
    } catch (e) {
      // Invalid selector, skip
    }
  }
  return null;
}

function scanFullPage() {
  // Fallback when targeted selectors fail – search the entire page text.
  const bodyText = document.body.innerText || document.body.textContent || '';
  return findCountryInText(bodyText);
}

function getFlag(country) {
  // Exact match
  if (COUNTRY_FLAGS[country]) return COUNTRY_FLAGS[country];
  // Partial match
  for (const [name, flag] of Object.entries(COUNTRY_FLAGS)) {
    if (country.toLowerCase().includes(name.toLowerCase())) return flag;
  }
  return "🌍";
}

function injectStyles() {
  // Injects toast styles once per page.
  if (document.getElementById('madewhere-styles')) return;
  const style = document.createElement('style');
  style.id = 'madewhere-styles';
  style.textContent = `
    #madewhere-toast {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(15, 15, 15, 0.95);
      color: #fff;
      padding: 12px 16px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      min-width: 200px;
      max-width: 280px;
      cursor: pointer;
      transform: translateX(120%);
      opacity: 0;
      transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
      pointer-events: auto;
      user-select: none;
    }

    #madewhere-toast.visible {
      transform: translateX(0);
      opacity: 1;
    }

    #madewhere-toast.hiding {
      transform: translateX(120%);
      opacity: 0;
      transition: transform 0.3s ease-in, opacity 0.3s ease;
    }

    #madewhere-toast .mw-flag {
      font-size: 26px;
      line-height: 1;
      flex-shrink: 0;
    }

    #madewhere-toast .mw-content {
      flex: 1;
      min-width: 0;
    }

    #madewhere-toast .mw-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.45);
      margin-bottom: 2px;
    }

    #madewhere-toast .mw-country {
      font-size: 15px;
      font-weight: 600;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    #madewhere-toast .mw-close {
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.5);
      font-size: 11px;
      flex-shrink: 0;
      transition: background 0.15s, color 0.15s;
      line-height: 1;
    }

    #madewhere-toast .mw-close:hover {
      background: rgba(255,255,255,0.2);
      color: #fff;
    }

    #madewhere-toast.not-found {
      background: rgba(30, 25, 15, 0.95);
    }

    #madewhere-toast .mw-country.unknown {
      color: rgba(255,255,255,0.5);
      font-style: italic;
    }
  `;
  document.head.appendChild(style);
}

let toastEl = null;
let hideTimeout = null;
let myntraSizeListenerAttached = false;

function showToast(country, found) {
  // Render or replace the toast showing the detected country (or not-found).
  if (toastEl) {
    toastEl.remove();
    toastEl = null;
  }
  clearTimeout(hideTimeout);

  injectStyles();

  const flag = found ? getFlag(country) : "❓";
  const displayCountry = found ? country : "Not found on page";

  toastEl = document.createElement('div');
  toastEl.id = 'madewhere-toast';
  if (!found) toastEl.classList.add('not-found');

  toastEl.innerHTML = `
    <div class="mw-flag">${flag}</div>
    <div class="mw-content">
      <div class="mw-label">Made in</div>
      <div class="mw-country ${!found ? 'unknown' : ''}">${displayCountry}</div>
    </div>
    <div class="mw-close">✕</div>
  `;

  toastEl.querySelector('.mw-close').addEventListener('click', (e) => {
    e.stopPropagation();
    hideToast();
  });

  document.body.appendChild(toastEl);

  // Trigger animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toastEl && toastEl.classList.add('visible');
    });
  });

  // Auto-hide after 6 seconds if found, 4 if not
  hideTimeout = setTimeout(hideToast, found ? 6000 : 4000);
}

function hideToast() {
  if (!toastEl) return;
  toastEl.classList.remove('visible');
  toastEl.classList.add('hiding');
  setTimeout(() => {
    toastEl && toastEl.remove();
    toastEl = null;
  }, 350);
}

function isProductPage() {
  const url = window.location.href;
  const host = window.location.hostname;

  debugLog('Checking if product page', { host, url });

  // Site-specific product page detection
  if (isMyntra() && url.match(/\/[^/]+-\d+\/buy$/)) {
    debugLog('Myntra product page detected by URL pattern');
    return true;
  }
  if (host.includes('uniqlo.com') && url.includes('/products/')) return true;
  if (host.includes('hm.com') && url.includes('/productpage')) return true;
  if (host.includes('hm.com') && url.match(/\/en_\w+\/productpage/)) return true;
  if (host.includes('zara.com') && url.includes('/p0')) return true;
  if (host.includes('amazon') && url.includes('/dp/')) return true;
  if (host.includes('flipkart.com') && url.includes('/p/')) return true;
  if (host.includes('ajio.com') && url.includes('/p/')) return true;
  if (host.includes('shein.com') && url.includes('-p-')) return true;
  if (host.includes('mango.com') && url.includes('.html')) return true;

  // Generic: if there's a product title and price visible, likely a product page
  const hasPrice = document.querySelector('[class*="price"], [itemprop="price"], .price');
  const hasTitle = document.querySelector('[class*="product-title"], [itemprop="name"], h1');
  debugLog('Generic product page heuristic', { hasPrice: !!hasPrice, hasTitle: !!hasTitle });
  return !!(hasPrice && hasTitle);
}

async function openMyntraCountryModalIfNeeded() {
  // Myntra-only: open the supplier modal in a hidden (stealth) way,
  // scan it for Country of Origin, then close it again.
  if (!isMyntra()) return null;
  debugLog('Attempting to open Myntra supplier modal (stealth mode)');

  // Find the "View Supplier Information" trigger
  const trigger = document.querySelector('.supplier-viewmore-link');
  if (!trigger) {
    debugLog('Myntra supplier link (.supplier-viewmore-link) not found');
    return null;
  }

  addMyntraModalStealthStyle();

  debugLog('Clicking Myntra supplier link to open modal');
  trigger.click();

  // Give the modal time to render but keep it visually hidden
  await new Promise(r => setTimeout(r, 900));
  debugLog('Finished waiting for Myntra modal to render, scanning its content');

  const selectors = getCurrentHostSelectors();
  const country = scanElements(selectors);

  closeMyntraModalIfOpen();
  removeMyntraModalStealthStyle();

  debugLog('Country found from Myntra modal flow', country);
  return country;
}

function setupMyntraSizeListener() {
  // Attach one click listener on the size-buttons container so that
  // detection runs only after the user has selected a size.
  if (!isMyntra()) return;

  if (myntraSizeListenerAttached) {
    debugLog('Myntra size listener already attached');
    return;
  }

  const container = document.querySelector('#sizeButtonsContainer .size-buttons-size-buttons');
  if (!container) {
    debugLog('Myntra size buttons container not found; will retry');
    setTimeout(setupMyntraSizeListener, 1000);
    return;
  }

  if (container.dataset.madewhereSizeListener === 'true') {
    debugLog('Myntra size buttons already have listener via data attribute');
    myntraSizeListenerAttached = true;
    return;
  }

  container.dataset.madewhereSizeListener = 'true';
  myntraSizeListenerAttached = true;

  container.addEventListener('click', async (event) => {
    const sizeButton = event.target.closest('.size-buttons-size-button');
    if (!sizeButton) return;
    debugLog('Myntra size selected, triggering detection flow');
    await detectCountryAndToast();
  });

  debugLog('Attached Myntra size selection listener');
}

function addMyntraModalStealthStyle() {
  // Hide the Myntra modal visually while still allowing our script
  // to read its DOM contents.
  if (document.getElementById('madewhere-myntra-stealth')) return;
  const style = document.createElement('style');
  style.id = 'madewhere-myntra-stealth';
  style.textContent = `
    .Modal-modalContent,
    .Modal-modalDialog {
      opacity: 0 !important;
      pointer-events: none !important;
    }
  `;
  document.head.appendChild(style);
  debugLog('Injected Myntra modal stealth style');
}

function removeMyntraModalStealthStyle() {
  const style = document.getElementById('madewhere-myntra-stealth');
  if (style) {
    style.remove();
    debugLog('Removed Myntra modal stealth style');
  }
}

function closeMyntraModalIfOpen() {
  // Try to close the Myntra modal via its close button; if that fails,
  // fall back to removing the modal node directly.
  const modal = document.querySelector('.Modal-modalContent');
  if (!modal) {
    debugLog('No Myntra modal found to close');
    return;
  }

  const closeBtn = document.querySelector('.Address-close-button');
  if (closeBtn) {
    debugLog('Clicking Myntra modal close button');
    closeBtn.click();
  } else {
    debugLog('No close button found; removing Myntra modal node directly');
    modal.remove();
  }
}

async function detectCountryAndToast() {
  // Shared detection flow used by all sites (and triggered from
  // different events like initial load or size selection).
  // Wait a bit for dynamic content to load or update
  await new Promise(r => setTimeout(r, 1500));

  // Try targeted selectors first
  const selectors = getCurrentHostSelectors();
  debugLog('Using selectors', selectors);
  let country = scanElements(selectors);

  debugLog('Country from targeted selector scan', country);

  // For Myntra, important details (Country of Origin) can be inside
  // a modal opened via the "View Supplier Information" link.
  if (!country && isMyntra()) {
    debugLog('No country found yet on Myntra, trying modal flow (stealth)');
    country = await openMyntraCountryModalIfNeeded();
  }

  // Fallback: scan full page text
  if (!country) {
    debugLog('Falling back to full page scan');
    country = scanFullPage();
  }

  if (country && country.length > 1) {
    debugLog('Final country detected', country);
    showToast(country, true);
  } else {
    // Show "not found" only on clear product pages
    debugLog('No country detected, showing not-found toast');
    showToast(null, false);
  }
}

async function run() {
  debugLog('run() invoked', window.location.href);

  if (!isProductPage()) {
    debugLog('Not a product page, aborting run()');
    return;
  }

  // Myntra: wait for the user to select a size, then run detection.
  if (isMyntra()) {
    debugLog('Myntra product page: deferring detection until size selection');
    setupMyntraSizeListener();
    return;
  }

  // Other sites: detect immediately on load.
  await detectCountryAndToast();
}

// Watch for SPA navigation (Myntra, etc. use client-side routing)
let lastUrl = location.href;
const urlObserver = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    hideToast();
    myntraSizeListenerAttached = false;
    // Re-run after navigation
    setTimeout(run, 2000);
  }
});

urlObserver.observe(document.body, { childList: true, subtree: true });

// Initial run
run();
