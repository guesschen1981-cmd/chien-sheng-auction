/* ============================================================
   AUCTION TIMER  ·  app.js
   Full Frontend Logic — Two Timer Modes + Anti-Snipe Buffer
   ============================================================ */
'use strict';

// ─────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────
const RING_RADIUS      = 96;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // ≈ 603.19

// ─────────────────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────────────────
const S = {
  // ── Config (admin) ──────────────────────────────────────
  studioName  : '建生工坊',
  logoUrl     : '',
  itemName    : '',
  itemSubtitle: '',
  itemDesc    : '',
  itemQty     : 1,
  imgUrl      : '',           // URL fallback (single)
  images      : [],           // [{ src, name, isCover }] — managed by dropzone
  logoSrc     : '',           // base64 or URL — managed by logo dropzone
  startPrice  : 100,
  increment   : 50,
  pickups     : ['自取'],
  videoUrl    : '',
  customTerms : '',

  // Timer config
  timerMode   : 'fixed',   // 'fixed' | 'rolling'
  // fixed mode
  fixedDays   : 0,
  fixedHours  : 1,
  fixedMins   : 0,
  fixedSecs   : 0,
  // anti-snipe
  antiSnipe   : true,
  bufferMins  : 3,   // last N minutes → trigger anti-snipe
  extendMins  : 3,   // extend by N minutes on bid

  // ── Runtime ─────────────────────────────────────────────
  auctionLive : false,
  auctionDone : false,
  endTime     : null,       // Date
  totalSecs   : 0,          // total initial seconds (for ring calc)
  antiSnipeActive: false,

  currentBid  : 0,
  topBidder   : '',
  topBidTime  : null,
  bidHistory  : [],

  loggedUser  : null,
  pendingAmt  : 0,
  shareUrl    : '',

  // ── Firebase / Cloud ──────────────────────────────────────
  auctionId   : '',         // Unique Auction ID (cloud key)
  fbReady     : false,      // Firebase initialized & connected
  fbMode      : false,      // true when Firebase config exists
};

// ─────────────────────────────────────────────────────────
//  DOM SHORTCUTS
// ─────────────────────────────────────────────────────────
const el  = id  => document.getElementById(id);
const qsa = sel => document.querySelectorAll(sel);

/* Admin */
const cfgStudioName    = el('cfg-studio-name');
const cfgLogoUrl       = el('cfg-logo-url');
const cfgItemName      = el('cfg-item-name');
const cfgItemSubtitle  = el('cfg-item-subtitle');
const cfgItemDesc      = el('cfg-item-desc');
const cfgItemQty       = el('cfg-item-qty');
const cfgImgUrl        = el('cfg-img-url');
const cfgStartPrice    = el('cfg-start-price');
const cfgIncrement     = el('cfg-increment');
const cfgPickupCustCb  = el('pickup-custom-cb');
const cfgPickupCustWrp = el('pickup-custom-wrap');
const cfgPickupCustTxt = el('pickup-custom-text');
const cfgVideoUrl      = el('cfg-video-url');
const cfgVideoPreview  = el('cfg-video-preview');
const cfgTDays         = el('cfg-t-days');
const cfgTHours        = el('cfg-t-hours');
const cfgTMins         = el('cfg-t-mins');
const cfgTSecs         = el('cfg-t-secs');
const cfgAntiSnipe     = el('cfg-anti-snipe');
const cfgBufferMins    = el('cfg-buffer-mins');
const cfgBufferCustom  = el('cfg-buffer-custom');
const cfgExtendMins    = el('cfg-extend-mins');
const cfgExtendCustom  = el('cfg-extend-custom');
const cfgCustomTerms   = el('cfg-custom-terms');
const antiSnipeOpts    = el('anti-snipe-opts');

/* Buttons */
const btnPreview  = el('btn-preview');
const btnPublish  = el('btn-publish');
const btnBack     = el('btn-back');
const btnShareNav = el('btn-share-nav');

/* Auction page */
const aLogo       = el('a-logo');
const aStudio     = el('a-studio');
const aImg        = el('a-img');
const aImgPh      = el('a-img-ph');
const aItemName   = el('a-item-name');
const aItemSub    = el('a-item-subtitle');
const aQtyBadge   = el('a-qty-badge');
const aPickupChips= el('a-pickup-chips');
const aDesc       = el('a-desc');
const aVideoCard  = el('a-video-card');
const aVideoEmbed = el('a-video-embed');
const aVideoMobile= el('a-video-mobile');
const aShareUrl   = el('a-share-url');

/* Gallery */
const galleryMain    = el('gallery-main');
const galleryStrip   = el('gallery-strip');
const galleryCounter = el('gallery-counter');
const galleryPrev    = el('gallery-prev');
const galleryNext    = el('gallery-next');

/* Timer */
const ringFill    = el('ring-fill');
const ringDigits  = el('ring-digits');
const ringDays    = el('ring-days');
const ringStatus  = el('ring-status');
const ringLabel   = el('ring-label');
const aModeBadge  = el('a-mode-badge');
const antiSnipePill = el('anti-snipe-pill');

/* Bid display */
const aCurBid     = el('a-cur-bid');
const aTopBidder  = el('a-top-bidder');
const aBidTime    = el('a-bid-time');
const aNextBid    = el('a-next-bid');
const aIncrTag    = el('a-increment-tag');
const histBadge   = el('history-badge');
const histList    = el('history-list');
const histArrow   = el('history-arrow');
const btnHistTog  = el('btn-history-toggle');

/* Login */
const loggedUserBar  = el('logged-user-bar');
const loggedUserLbl  = el('logged-user-label');
const btnLogout      = el('btn-logout');
const loginForm      = el('login-form');
const inpAccount     = el('inp-account');
const inpPassword    = el('inp-password');
const btnLogin       = el('btn-login');

/* Bid input */
const inpBid      = el('inp-bid');
const btnMinus    = el('btn-minus');
const btnPlus     = el('btn-plus');
const btnBid      = el('btn-bid');
const bidBtnText  = el('bid-btn-text');

/* Admin stepper buttons */
const btnSpMinus  = el('btn-sp-minus');
const btnSpPlus   = el('btn-sp-plus');
const btnIncMinus = el('btn-inc-minus');
const btnIncPlus  = el('btn-inc-plus');

/* Mobile bar */
const mbarStatus  = el('mbar-status');
const mbarBid     = el('mbar-bid');

/* Share/QR */
const btnCopyUrl  = el('btn-copy-url');
const qrContainer = el('qr-container');
const btnDlQr     = el('btn-dl-qr');
const btnShareQr  = el('btn-share-qr');

/* Modal */
const bidModal    = el('bid-modal');
const t1 = el('t1'); const t2 = el('t2'); const t3 = el('t3'); const t5 = el('t5');
const t4Wrap = el('t4-wrap'); const t4Text = el('t4-text');
const modalWarrantyBox  = el('modal-warranty-box');
const modalWarrantyIcon = el('modal-warranty-icon');
const modalWarrantyText = el('modal-warranty-text');
const mBidder = el('m-bidder'); const mAmount = el('m-amount');
const btnMCancel  = el('btn-m-cancel');
const btnMConfirm = el('btn-m-confirm');

/* Toast */
const toastEl = el('toast');

let _timerInterval = null;
let _qrInstance    = null;
let _galleryIdx    = 0;   // current gallery image index

// ─────────────────────────────────────────────────────────
//  UTILITIES
// ─────────────────────────────────────────────────────────

const fmt  = n => 'NT$ ' + Number(n).toLocaleString('zh-TW');
const pad  = n => String(n).padStart(2, '0');

function relTime(d) {
  if (!d) return '';
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60)   return `${s} 秒前`;
  if (s < 3600) return `${Math.floor(s/60)} 分鐘前`;
  if (s < 86400)return `${Math.floor(s/3600)} 小時前`;
  return `${Math.floor(s/86400)} 天前`;
}

function maskName(n) {
  if (!n || n.length <= 2) return n || '匿名';
  return n[0] + '***' + n[n.length - 1];
}

let _toastTimer;
function showToast(msg, type = 'info', ms = 3200) {
  toastEl.textContent = msg;
  toastEl.style.borderColor = type === 'success' ? 'rgba(34,197,94,.38)'
    : type === 'error'   ? 'rgba(239,68,68,.38)'
    : type === 'warning' ? 'rgba(245,158,11,.38)'
    : 'rgba(130,100,230,.38)';
  toastEl.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
}

function parseVideoUrl(raw) {
  if (!raw) return null;
  raw = raw.trim();
  let m;
  // standard watch
  m = raw.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}?rel=0&modestbranding=1`;
  // shorts
  m = raw.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/);
  if (m) return `https://www.youtube.com/embed/${m[1]}?rel=0`;
  // already embed
  if (raw.includes('youtube.com/embed/')) return raw;
  return null;
}

function dhms(totalSecs) {
  const t = Math.max(0, Math.floor(totalSecs));
  return {
    d: Math.floor(t / 86400),
    h: Math.floor((t % 86400) / 3600),
    m: Math.floor((t % 3600) / 60),
    s: t % 60,
    total: t,
  };
}

function buildShareUrl() {
  const base = location.href.split('?')[0].split('#')[0];
  const p = new URLSearchParams({ auction:'1', title: S.itemName, studio: S.studioName });
  return `${base}?${p}`;
}

// ─────────────────────────────────────────────────────────
//  CONFETTI
// ─────────────────────────────────────────────────────────
function confetti(ms = 2500) {
  const cv = el('fx-canvas');
  const cx = cv.getContext('2d');
  cv.width = innerWidth; cv.height = innerHeight;
  const cols = ['#f59e0b','#fbbf24','#a855f7','#ef4444','#22c55e','#60a5fa','#fff'];
  const ps = Array.from({length: 100}, () => ({
    x: Math.random() * cv.width,
    y: Math.random() * -cv.height,
    w: Math.random() * 11 + 5,
    h: Math.random() * 6 + 3,
    c: cols[Math.floor(Math.random() * cols.length)],
    r: Math.random() * Math.PI * 2,
    rs: (Math.random() - .5) * .15,
    vy: Math.random() * 3 + 2,
    vx: (Math.random() - .5) * 1.8,
  }));
  let t0;
  const draw = ts => {
    if (!t0) t0 = ts;
    cx.clearRect(0, 0, cv.width, cv.height);
    ps.forEach(p => {
      p.y += p.vy; p.x += p.vx; p.r += p.rs;
      if (p.y > cv.height) { p.y = -15; p.x = Math.random() * cv.width; }
      cx.save();
      cx.translate(p.x + p.w/2, p.y + p.h/2);
      cx.rotate(p.r);
      cx.fillStyle = p.c;
      cx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      cx.restore();
    });
    if (ts - t0 < ms) requestAnimationFrame(draw);
    else cx.clearRect(0, 0, cv.width, cv.height);
  };
  requestAnimationFrame(draw);
}

// ─────────────────────────────────────────────────────────
//  FIREBASE MODULE — 雲端即時資料庫整合
//  Uses Firebase Realtime Database (REST + SDK compat v9)
// ─────────────────────────────────────────────────────────
const FirebaseModule = (function () {

  /* ══ 預設 Firebase 設定（建生工坊）══════════════════════
     此設定在頁面啟動時自動套用，無需使用者手動輸入。
     如需使用其他 Firebase 專案，可在「☁️ 雲端」設定中覆蓋。
  ════════════════════════════════════════════════════════ */
  const DEFAULT_FB_CONFIG = {
    apiKey      : 'AIzaSyBbO973mxIfyP3P2rWQVsI9KsgQHE6_amg',
    authDomain  : 'chien-sheng-auction.firebaseapp.com',
    databaseURL : 'https://chien-sheng-auction-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId   : 'chien-sheng-auction',
    appId       : '1:296167438991:web:e4a01094fcfeec0f438efa',
  };

  const LS_FB_KEY = 'agy_fb_config';   // localStorage key for user-override config
  let _db         = null;               // firebase.database() reference
  let _auctionRef = null;               // ref to current auction node
  let _presenceRef= null;               // ref for online presence
  let _listeners  = [];                 // active listeners to detach on cleanup

  /* ── Persist / load config ───────────────────────────── */
  function saveConfig(cfg) {
    localStorage.setItem(LS_FB_KEY, JSON.stringify(cfg));
  }
  function loadConfig() {
    try { return JSON.parse(localStorage.getItem(LS_FB_KEY) || 'null'); }
    catch { return null; }
  }
  function clearConfig() {
    localStorage.removeItem(LS_FB_KEY);
  }

  /* ── Initialize Firebase app ─────────────────────────── */
  function init(cfg) {
    if (!cfg || !cfg.apiKey || !cfg.databaseURL) {
      _setStatus('offline', '未設定雲端（本機模式）');
      return false;
    }
    try {
      // Delete existing app if re-initializing
      const existing = firebase.apps.find(a => a.name === '[DEFAULT]');
      if (existing) existing.delete().catch(() => {});
    } catch (_) {}

    try {
      firebase.initializeApp({
        apiKey        : cfg.apiKey,
        authDomain    : cfg.authDomain,
        databaseURL   : cfg.databaseURL,
        projectId     : cfg.projectId,
        appId         : cfg.appId,
        storageBucket : cfg.storageBucket || '',
        messagingSenderId: cfg.messagingSenderId || '',
      });
      _db = firebase.database();
      S.fbReady = true;
      S.fbMode  = true;
      _setStatus('syncing', '雲端連線成功 ✓');
      setTimeout(() => _setStatus('online', '雲端即時同步中'), 1200);
      return true;
    } catch (e) {
      console.error('[Firebase] init error:', e);
      _setStatus('offline', '連線失敗：' + e.message);
      S.fbReady = false;
      S.fbMode  = false;
      return false;
    }
  }

  /* ── Status bar update ───────────────────────────────── */
  function _setStatus(state, text) {
    const bar  = el('fb-status-bar');
    const dot  = el('fb-dot');
    const txt  = el('fb-status-text');
    if (!bar) return;
    bar.style.display = 'flex';
    if (dot)  { dot.className = `fb-status-dot ${state === 'online' ? '' : state}`; }
    if (txt)  { txt.textContent = text; }
  }

  /* ── Generate unique Auction ID ──────────────────────── */
  function _genAuctionId() {
    const ts = Date.now().toString(36).toUpperCase();
    const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `AUC-${ts}-${rnd}`;
  }

  /* ── Build share URL with Auction ID ─────────────────── */
  function buildCloudUrl(auctionId) {
    const base = location.href.split('?')[0].split('#')[0];
    return `${base}?id=${auctionId}`;
  }

  /* ── Publish auction to Firebase ─────────────────────── */
  async function publishAuction(totalSecs) {
    if (!S.fbReady || !_db) {
      // Fallback: local-only mode
      return null;
    }

    // Build snapshot — exclude large base64 images for performance
    // Images are stored by URL only if they are remote URLs; base64 kept local
    const imageList = S.images
      .filter(i => !i.src.startsWith('data:'))   // only remote URLs
      .map(i => ({ src: i.src, name: i.name, isCover: i.isCover }));
    const logoUrl = (S.logoSrc && !S.logoSrc.startsWith('data:')) ? S.logoSrc : '';

    const endTimestamp = Date.now() + totalSecs * 1000;

    const snapshot = {
      // Meta (auctionId will be set after push)
      createdAt  : Date.now(),
      endAt      : endTimestamp,
      totalSecs,
      // Seller
      studioName : S.studioName,
      logoUrl,
      // Product
      itemName    : S.itemName,
      itemSubtitle: S.itemSubtitle,
      itemDesc    : S.itemDesc,
      itemQty     : S.itemQty,
      videoUrl    : S.videoUrl,
      imageList,
      // Bid config
      startPrice  : S.startPrice,
      increment   : S.increment,
      pickups     : S.pickups,
      // Timer
      timerMode   : S.timerMode,
      fixedDays   : S.fixedDays,
      fixedHours  : S.fixedHours,
      fixedMins   : S.fixedMins,
      fixedSecs   : S.fixedSecs,
      // Anti-snipe
      antiSnipe   : S.antiSnipe,
      bufferMins  : S.bufferMins,
      extendMins  : S.extendMins,
      // Terms & warranty
      customTerms  : S.customTerms,
      warrantyMode : S.warrantyMode  || 'limited',
      warrantyDays : S.warrantyDays  || 3,
      warrantyTime : S.warrantyTime  || '12:00',
      // Live state (initial)
      currentBid  : S.startPrice,
      topBidder   : '',
      topBidTime  : 0,
      bidHistory  : [],
      auctionLive : true,
      auctionDone : false,
    };

    try {
      // Use push() to get a Firebase-generated unique key as the Auction ID
      const auctionsRef = _db.ref('auctions');
      const newRef = auctionsRef.push();
      const auctionId = newRef.key;   // Firebase auto-generated key

      // Write back the auctionId field into the snapshot
      snapshot.auctionId = auctionId;
      S.auctionId = auctionId;

      await newRef.set(snapshot);
      _auctionRef = newRef;
      _setStatus('online', `已發布至雲端 ✓ ID: ${auctionId}`);

      // Build and update share URL immediately
      const cloudUrl = buildCloudUrl(auctionId);
      S.shareUrl = cloudUrl;

      // Update share URL input field
      const shareInput = document.getElementById('a-share-url');
      if (shareInput) shareInput.value = cloudUrl;

      // Regenerate QR Code with the cloud URL
      if (typeof generateQR === 'function') generateQR(cloudUrl);

      // Start realtime listener for this auction
      _listenAuction(auctionId);
      _trackPresence(auctionId);
      _updateShareUI(auctionId);

      return auctionId;
    } catch (e) {
      console.error('[Firebase] publish error:', e);
      _setStatus('offline', '上傳失敗：' + e.message);
      showToast('⚠️ 雲端發布失敗，改用本機模式', 'warning', 4000);
      return null;
    }
  }

  /* ── Listen to auction data in real-time (seller + buyer) */
  function _listenAuction(auctionId) {
    if (!_db) return;
    _detachAll();

    const ref = _db.ref(`auctions/${auctionId}`);
    _auctionRef = ref;

    const handler = ref.on('value', snap => {
      if (!snap.exists()) return;
      const data = snap.val();

      // Update bid state from cloud
      const prevBid = S.currentBid;
      S.currentBid  = data.currentBid  ?? S.currentBid;
      S.topBidder   = data.topBidder   ?? S.topBidder;
      S.topBidTime  = data.topBidTime  ?? S.topBidTime;
      S.bidHistory  = Array.isArray(data.bidHistory) ? data.bidHistory : S.bidHistory;
      S.auctionDone = data.auctionDone ?? S.auctionDone;

      // Sync end time
      if (data.endAt) {
        S.endTime   = new Date(data.endAt);
        S.totalSecs = Math.max(1, data.totalSecs ?? S.totalSecs);
      }

      // Update bid count in status bar
      const bidCountEl = el('fb-bid-count');
      if (bidCountEl) bidCountEl.textContent = `${S.bidHistory.length} 筆出標`;

      // Trigger UI refresh if bid changed
      if (data.currentBid > prevBid) {
        renderBid();
        // Flash animation on bid display
        const bidEl = el('a-cur-bid');
        if (bidEl) { bidEl.classList.remove('flash-new'); void bidEl.offsetWidth; bidEl.classList.add('flash-new'); }
        if (!data._localBid) showToast(`🔨 有人出標：${fmt(data.currentBid)}`, 'success', 3500);
      } else {
        renderBid();
      }

      if (data.auctionDone && !S.auctionLive) {
        endAuction();
      }
    });

    _listeners.push(() => ref.off('value', handler));
  }

  /* ── Track online presence ───────────────────────────── */
  function _trackPresence(auctionId) {
    if (!_db) return;
    const presenceRef = _db.ref(`presence/${auctionId}`);
    const myRef = presenceRef.push();
    myRef.set({ t: Date.now() });
    myRef.onDisconnect().remove();
    _presenceRef = myRef;

    // Listen to count
    const countHandler = presenceRef.on('value', snap => {
      const count = snap.numChildren();
      const countEl = el('online-count-display');
      const countRow = el('online-count-row');
      if (countEl) countEl.textContent = count;
      if (countRow) countRow.style.display = count > 0 ? 'block' : 'none';
    });
    _listeners.push(() => presenceRef.off('value', countHandler));
  }

  /* ── Load auction by ID (buyer side) ─────────────────── */
  async function loadAuction(auctionId) {
    if (!_db) return null;
    _setStatus('syncing', `載入拍賣 ${auctionId}…`);
    try {
      const snap = await _db.ref(`auctions/${auctionId}`).once('value');
      if (!snap.exists()) {
        _setStatus('offline', '拍賣不存在或已結束');
        return null;
      }
      const data = snap.val();
      _setStatus('online', `已連線至拍賣 ${auctionId}`);
      _listenAuction(auctionId);
      _trackPresence(auctionId);
      return data;
    } catch (e) {
      _setStatus('offline', '載入失敗：' + e.message);
      return null;
    }
  }

  /* ── Push a bid to Firebase ──────────────────────────── */
  async function pushBid(bidderName, amount) {
    if (!S.fbReady || !_db || !S.auctionId) return false;
    const ref = _db.ref(`auctions/${S.auctionId}`);
    const histEntry = { user: bidderName, amount, time: Date.now() };
    try {
      const newHistory = [...S.bidHistory, histEntry];
      await ref.update({
        currentBid  : amount,
        topBidder   : bidderName,
        topBidTime  : Date.now(),
        bidHistory  : newHistory,
        _localBid   : false,   // so other clients show toast
      });
      return true;
    } catch (e) {
      console.error('[Firebase] pushBid error:', e);
      showToast('⚠️ 雲端出標失敗，已記錄本機', 'warning');
      return false;
    }
  }

  /* ── Push anti-snipe extension to Firebase ───────────── */
  async function pushAntiSnipe(newEndAt, newTotalSecs) {
    if (!S.fbReady || !_db || !S.auctionId) return;
    try {
      await _db.ref(`auctions/${S.auctionId}`).update({
        endAt    : newEndAt,
        totalSecs: newTotalSecs,
      });
    } catch (e) { console.error('[Firebase] pushAntiSnipe error:', e); }
  }

  /* ── Push end-of-auction to Firebase ─────────────────── */
  async function pushAuctionEnd() {
    if (!S.fbReady || !_db || !S.auctionId) return;
    try {
      await _db.ref(`auctions/${S.auctionId}`).update({
        auctionDone: true,
        auctionLive: false,
      });
    } catch (e) { console.error('[Firebase] pushAuctionEnd error:', e); }
  }

  /* ── Update Share Card UI with Auction ID ────────────── */
  function _updateShareUI(auctionId) {
    const idRow  = el('auction-id-row');
    const idDisp = el('auction-id-display');
    const idChip = el('auction-id-chip');
    if (idRow)  idRow.style.display  = 'block';
    if (idDisp) idDisp.textContent   = auctionId;
    if (idChip) {
      idChip.addEventListener('click', () => {
        navigator.clipboard?.writeText(auctionId).then(() =>
          showToast('✅ Auction ID 已複製', 'success', 2000)
        ).catch(() => {});
      });
    }
  }

  /* ── Detach all Firebase listeners ──────────────────────*/
  function _detachAll() {
    _listeners.forEach(off => { try { off(); } catch(_) {} });
    _listeners = [];
  }

  /* ── Firebase Setup Modal logic ──────────────────────── */
  function wireSetupModal() {
    const btnSetup  = el('btn-fb-setup');
    const modal     = el('fb-setup-modal');
    const btnCancel = el('btn-fb-cancel');
    const btnSave   = el('btn-fb-save');
    const btnClear  = el('btn-fb-clear');

    if (!btnSetup || !modal) return;

    // Pre-fill from saved config
    function fillForm(cfg) {
      if (!cfg) return;
      const set = (id, v) => { const e = el(id); if (e) e.value = v || ''; };
      set('fb-api-key',    cfg.apiKey);
      set('fb-auth-domain',cfg.authDomain);
      set('fb-db-url',     cfg.databaseURL);
      set('fb-project-id', cfg.projectId);
      set('fb-app-id',     cfg.appId);
    }

    btnSetup.addEventListener('click', () => {
      fillForm(loadConfig());
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    });

    btnCancel.addEventListener('click', () => {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    });

    modal.addEventListener('click', e => {
      if (e.target === modal) { modal.classList.remove('open'); document.body.style.overflow = ''; }
    });

    btnClear.addEventListener('click', () => {
      if (!confirm('確定要清除 Firebase 設定嗎？清除後將回到本機模式。')) return;
      clearConfig();
      S.fbReady = false; S.fbMode = false; _db = null;
      _setStatus('offline', '已清除設定（本機模式）');
      ['fb-api-key','fb-auth-domain','fb-db-url','fb-project-id','fb-app-id'].forEach(id => {
        const e = el(id); if (e) e.value = '';
      });
      showToast('🗑 Firebase 設定已清除', 'info');
    });

    btnSave.addEventListener('click', () => {
      const cfg = {
        apiKey      : el('fb-api-key')?.value.trim()     || '',
        authDomain  : el('fb-auth-domain')?.value.trim() || '',
        databaseURL : el('fb-db-url')?.value.trim()      || '',
        projectId   : el('fb-project-id')?.value.trim()  || '',
        appId       : el('fb-app-id')?.value.trim()      || '',
      };
      if (!cfg.apiKey || !cfg.databaseURL) {
        showToast('⚠️ 請至少填入 API Key 與 Database URL', 'warning'); return;
      }
      saveConfig(cfg);
      const ok = init(cfg);
      if (ok) {
        showToast('✅ Firebase 連線成功！已啟用雲端競標功能', 'success', 4000);
        modal.classList.remove('open');
        document.body.style.overflow = '';
        // Visual update on admin topbar
        const fbBtn = el('btn-fb-setup');
        if (fbBtn) { fbBtn.textContent = '✅ 已連線'; fbBtn.style.color = 'var(--c-green)'; }
      } else {
        showToast('❌ 連線失敗，請檢查設定是否正確', 'error', 5000);
      }
    });
  }

  /* ── Auto-init on startup ───────────────────────────────
     Priority: 1. User localStorage override  2. Default config
  ─────────────────────────────────────────────────────── */
  function autoInit() {
    // User may have saved a custom config in localStorage — use it first
    const userCfg = loadConfig();
    const cfg = (userCfg && userCfg.apiKey) ? userCfg : DEFAULT_FB_CONFIG;

    const ok = init(cfg);
    if (ok) {
      const fbBtn = el('btn-fb-setup');
      if (fbBtn) {
        const isDefault = cfg === DEFAULT_FB_CONFIG;
        fbBtn.textContent = isDefault ? '✅ 已連線（建生工坊）' : '✅ 已連線';
        fbBtn.style.color = 'var(--c-green)';
      }
    }
  }

  /* ── Public API ──────────────────────────────────────── */
  return {
    autoInit,
    wireSetupModal,
    publishAuction,
    loadAuction,
    pushBid,
    pushAntiSnipe,
    pushAuctionEnd,
    buildCloudUrl,
    isReady: () => S.fbReady && !!_db,
    getDb   : () => _db,
    detachAll: _detachAll,
  };
})();

// ─────────────────────────────────────────────────────────
//  STORAGE MODULE  — 分區獨立記憶 / 重置 / 匯出匯入
// ─────────────────────────────────────────────────────────
(function StorageModule() {


  /* ── LocalStorage keys ─────────────────────────────── */
  const LS = {
    A: 'auctionSect_A',   // 工作室
    B: 'auctionSect_B',   // 商品 + 影音
    C: 'auctionSect_C',   // 競標 + 計時 + 條款
    D: 'auctionSect_D',   // 取貨方式
  };

  /* ── Section field map: what to read/write per section ─ */
  const SECT_FIELDS = {
    A: () => ({
      studioName : el('cfg-studio-name')?.value ?? '',
      logoSrc    : S.logoSrc ?? '',   // base64 data URL or remote URL
    }),
    B: () => ({
      itemName    : el('cfg-item-name')?.value     ?? '',
      itemSubtitle: el('cfg-item-subtitle')?.value ?? '',
      itemDesc    : el('cfg-item-desc')?.value     ?? '',
      itemQty     : el('cfg-item-qty')?.value      ?? '1',
      videoUrl    : el('cfg-video-url')?.value     ?? '',
      // images array stored separately (base64 too large for frequent writes)
      images      : S.images.map(i => ({ src: i.src, name: i.name, isCover: i.isCover })),
    }),
    C: () => ({
      startPrice  : el('cfg-start-price')?.value  ?? '100',
      increment   : el('cfg-increment')?.value    ?? '50',
      timerMode   : document.querySelector('.mode-tab.active')?.dataset.mode ?? 'fixed',
      fixedDays   : el('cfg-t-days')?.value   ?? '0',
      fixedHours  : el('cfg-t-hours')?.value  ?? '1',
      fixedMins   : el('cfg-t-mins')?.value   ?? '0',
      fixedSecs   : el('cfg-t-secs')?.value   ?? '0',
      antiSnipe   : el('cfg-anti-snipe')?.checked ?? true,
      bufferMins  : el('cfg-buffer-mins')?.value  ?? '3',
      bufferCustom: el('cfg-buffer-custom')?.value ?? '3',
      extendMins  : el('cfg-extend-mins')?.value  ?? '3',
      extendCustom: el('cfg-extend-custom')?.value ?? '3',
      // Warranty & terms
      warrantyMode: document.querySelector('input[name="warranty-mode"]:checked')?.value ?? 'limited',
      warrantyDays: el('cfg-warranty-days')?.value ?? '3',
      warrantyTime: el('cfg-warranty-time')?.value ?? '12:00',
      qt48h       : el('qt-48h')?.checked  ?? true,
      qtTest      : el('qt-test')?.checked ?? true,
      qtAsis      : el('qt-asis')?.checked ?? true,
      customTerms : el('cfg-custom-terms')?.value  ?? '',
    }),
    D: () => {
      const checked = [];
      qsa('input[name="pickup"]:not(#pickup-custom-cb):checked').forEach(cb => checked.push(cb.value));
      return {
        pickups     : checked,
        customPickup: el('pickup-custom-cb')?.checked ?? false,
        customText  : el('pickup-custom-text')?.value ?? '',
      };
    },
  };

  /* ── Save one section to localStorage ─────────────── */
  function saveSection(sec) {
    try {
      const data = SECT_FIELDS[sec]();
      data._savedAt = new Date().toISOString();
      localStorage.setItem(LS[sec], JSON.stringify(data));
    } catch(e) {
      console.warn('[StorageModule] save failed', sec, e);
    }
  }

  /* ── Apply saved data back to the DOM ─────────────── */
  function applySection(sec, data) {
    if (!data) return;
    const set = (id, val) => { const el_ = el(id); if (el_) el_.value = val; };

    if (sec === 'A') {
      set('cfg-studio-name', data.studioName ?? '建生工坊');
      // Restore logo (base64 or URL)
      const logoSrc = data.logoSrc ?? data.logoUrl ?? '';
      if (logoSrc) {
        S.logoSrc = logoSrc;
        document.dispatchEvent(new CustomEvent('agy:restoreLogo', { detail: logoSrc }));
      } else {
        S.logoSrc = '';
        document.dispatchEvent(new CustomEvent('agy:restoreLogo', { detail: '' }));
      }
    }

    if (sec === 'B') {
      set('cfg-item-name',     data.itemName     ?? '');
      set('cfg-item-subtitle', data.itemSubtitle ?? '');
      set('cfg-item-desc',     data.itemDesc     ?? '');
      set('cfg-item-qty',      data.itemQty      ?? '1');
      set('cfg-video-url',     data.videoUrl     ?? '');

      // Restore images array
      if (Array.isArray(data.images) && data.images.length) {
        S.images = data.images;
        // Re-trigger dropzone thumb render by dispatching a custom event
        document.dispatchEvent(new CustomEvent('agy:restoreImages', { detail: data.images }));
      }

      // Fire video preview update
      const vid = el('cfg-video-url');
      if (vid) vid.dispatchEvent(new Event('input'));
    }

    if (sec === 'C') {
      set('cfg-start-price',  data.startPrice  ?? '100');
      set('cfg-increment',    data.increment   ?? '50');
      set('cfg-t-days',       data.fixedDays   ?? '0');
      set('cfg-t-hours',      data.fixedHours  ?? '1');
      set('cfg-t-mins',       data.fixedMins   ?? '0');
      set('cfg-t-secs',       data.fixedSecs   ?? '0');
      set('cfg-buffer-custom', data.bufferCustom ?? '3');
      set('cfg-extend-custom', data.extendCustom ?? '3');
      set('cfg-custom-terms',  data.customTerms  ?? '');
      // Warranty settings
      const wMode = data.warrantyMode ?? 'limited';
      const wRad  = el(`wmode-${wMode}`);
      if (wRad) { wRad.checked = true; wRad.dispatchEvent(new Event('change')); }
      set('cfg-warranty-days', data.warrantyDays ?? '3');
      set('cfg-warranty-time', data.warrantyTime ?? '12:00');
      const cb48h = el('qt-48h');  if (cb48h)  cb48h.checked  = data.qt48h  !== false;
      const cbTest = el('qt-test'); if (cbTest) cbTest.checked = data.qtTest !== false;
      const cbAsis = el('qt-asis'); if (cbAsis) cbAsis.checked = data.qtAsis !== false;

      // Timer mode tabs
      if (data.timerMode) {
        qsa('.mode-tab').forEach(t => {
          const match = t.dataset.mode === data.timerMode;
          t.classList.toggle('active', match);
          t.setAttribute('aria-selected', match);
        });
        el('panel-fixed')  ?.classList.toggle('active', data.timerMode === 'fixed');
        el('panel-rolling')?.classList.toggle('active', data.timerMode === 'rolling');
        S.timerMode = data.timerMode;
      }

      // Anti-snipe
      const asEl = el('cfg-anti-snipe');
      if (asEl) {
        asEl.checked = data.antiSnipe !== false;
        asEl.dispatchEvent(new Event('change'));
      }

      // Buffer/extend selects
      const restoreSelect = (selId, inpId, val, customVal) => {
        const sel = el(selId); const inp = el(inpId);
        if (!sel) return;
        const knownVals = Array.from(sel.options).map(o => o.value);
        if (knownVals.includes(String(val))) {
          sel.value = String(val);
          if (inp) inp.style.display = 'none';
        } else {
          sel.value = 'custom';
          if (inp) { inp.style.display = 'block'; inp.value = customVal || val; }
        }
      };
      restoreSelect('cfg-buffer-mins', 'cfg-buffer-custom', data.bufferMins,   data.bufferCustom);
      restoreSelect('cfg-extend-mins', 'cfg-extend-custom', data.extendMins,   data.extendCustom);

      // Refresh chip highlight
      if (typeof highlightActiveChip === 'function') {
        highlightActiveChip(data.increment ?? '50');
      }
    }

    if (sec === 'D') {
      // Uncheck all first
      qsa('input[name="pickup"]').forEach(cb => { cb.checked = false; });
      // Check saved ones
      (data.pickups || ['自取']).forEach(val => {
        const cb = document.querySelector(`input[name="pickup"][value="${val}"]`);
        if (cb) cb.checked = true;
      });
      // Custom pickup
      const custCb = el('pickup-custom-cb');
      const custWrp = el('pickup-custom-wrap');
      const custTxt = el('pickup-custom-text');
      if (custCb) {
        custCb.checked = !!data.customPickup;
        if (custWrp) custWrp.style.display = data.customPickup ? 'block' : 'none';
        if (custTxt && data.customText) custTxt.value = data.customText;
      }
    }
  }

  /* ── Load all sections from localStorage on boot ──── */
  function restoreAll() {
    Object.keys(LS).forEach(sec => {
      try {
        const raw = localStorage.getItem(LS[sec]);
        if (raw) applySection(sec, JSON.parse(raw));
      } catch(e) {
        console.warn('[StorageModule] restore failed', sec, e);
      }
    });
  }

  /* ── Debounced auto-save per section ───────────────── */
  const _saveTimers = {};
  function scheduleSave(sec, ms = 800) {
    clearTimeout(_saveTimers[sec]);
    _saveTimers[sec] = setTimeout(() => saveSection(sec), ms);
  }

  /* Wire up auto-save: A & B in left col, C & D in right col */
  function wireAutoSave() {
    const secAEls = [
      el('cfg-studio-name'),
      // cfg-logo-url url input: wired separately after logo-dropzone init
    ];
    const secBEls = [
      el('cfg-item-name'), el('cfg-item-subtitle'), el('cfg-item-desc'),
      el('cfg-item-qty'), el('cfg-video-url'),
    ];
    const secCEls = [
      el('cfg-start-price'), el('cfg-increment'),
      el('cfg-t-days'), el('cfg-t-hours'), el('cfg-t-mins'), el('cfg-t-secs'),
      el('cfg-anti-snipe'), el('cfg-buffer-mins'), el('cfg-buffer-custom'),
      el('cfg-extend-mins'), el('cfg-extend-custom'), el('cfg-custom-terms'),
      el('cfg-warranty-days'), el('cfg-warranty-time'),
      el('qt-48h'), el('qt-test'), el('qt-asis'),
      ...Array.from(document.querySelectorAll('input[name="warranty-mode"]')),
    ];
    const secDEls = [
      ...qsa('input[name="pickup"]'), el('pickup-custom-text'),
    ];

    const wire = (elemArr, sec) => {
      elemArr.forEach(e => {
        if (!e) return;
        const evts = e.type === 'checkbox' ? ['change'] : ['input', 'change'];
        evts.forEach(ev => e.addEventListener(ev, () => scheduleSave(sec)));
      });
    };
    wire(secAEls, 'A');
    wire(secBEls, 'B');
    wire(secCEls, 'C');
    wire(secDEls, 'D');

    // Mode tabs also trigger C save
    qsa('.mode-tab').forEach(tab => tab.addEventListener('click', () => scheduleSave('C')));

    // Images change triggers B save (listen for custom event from dropzone)
    document.addEventListener('agy:imagesChanged', () => scheduleSave('B'));

    // Logo change triggers A save (listen for custom event from logo dropzone)
    document.addEventListener('agy:logoChanged', () => scheduleSave('A'));
  }

  /* ── Reset a section to defaults ───────────────────── */
  const DEFAULTS = {
    A: { studioName: '建生工坊', logoSrc: '' },
    B: { itemName:'', itemSubtitle:'', itemDesc:'', itemQty:'1', videoUrl:'', images:[] },
    C: {
      startPrice:'100', increment:'50',
      timerMode:'fixed', fixedDays:'0', fixedHours:'1', fixedMins:'0', fixedSecs:'0',
      antiSnipe:true, bufferMins:'3', bufferCustom:'3', extendMins:'3', extendCustom:'3',
      warrantyMode:'limited', warrantyDays:'3', warrantyTime:'12:00',
      qt48h:true, qtTest:true, qtAsis:true,
      customTerms:'',
    },
    D: { pickups:['自取'], customPickup:false, customText:'' },
  };

  const SECT_NAMES = { A:'賣家/店鋪資訊', B:'商品資訊', C:'競標與計時設定', D:'取貨方式' };

  function resetSection(sec) {
    if (!confirm(`⚠️ 確定要清空「${SECT_NAMES[sec]}」區塊（${sec}）的所有設定嗎？\n其他區塊不受影響。`)) return;

    applySection(sec, DEFAULTS[sec]);

    // Extra: clear images if B
    if (sec === 'B') {
      S.images = [];
      document.dispatchEvent(new CustomEvent('agy:restoreImages', { detail: [] }));
    }

    localStorage.removeItem(LS[sec]);
    showToast(`↺ 區塊 ${sec}「${SECT_NAMES[sec]}」已重置`, 'info', 3000);
  }

  /* ── Export ─────────────────────────────────────────── */

  /**
   * 通用 Blob 下載函數（100% 相容 file:/// 本機環境）
   * 不使用 File System Access API，完全避開沙筆限制
   */
  function exportJSONBlob(payload, filename) {
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.style.display = 'none';
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  /** 生成日期時間標籤 YYYYMMDD_HHMM */
  function _dateTag() {
    const d  = new Date();
    const yy = d.getFullYear();
    const mo = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${yy}${mo}${dd}_${hh}${mm}`;
  }

  /** 儲存目前所有設定（A+B+C+D）並下載 */
  function saveAll() {
    Object.keys(LS).forEach(sec => saveSection(sec));
    const payload = {
      _type      : 'auction-full-backup',
      _version   : '1.0',
      _exportedAt: new Date().toISOString(),
      sections   : {},
    };
    Object.keys(LS).forEach(sec => {
      try {
        const raw = localStorage.getItem(LS[sec]);
        payload.sections[sec] = raw ? JSON.parse(raw) : DEFAULTS[sec];
      } catch { payload.sections[sec] = DEFAULTS[sec]; }
    });
    // 檔名格式：拍賣設定備份_[商品名稱]_[YYYYMMDD_HHMM].json
    const itemName  = el('cfg-item-name')?.value.trim()   || '';
    const shopName  = el('cfg-studio-name')?.value.trim() || '拍賣';
    const namePart  = itemName || shopName;
    const filename  = `拍賣設定備份_${namePart}_${_dateTag()}.json`;
    exportJSONBlob(payload, filename);
    showToast('💾 設定備份已下載', 'success', 3000);
  }

  /** 匯出全頁 HTML 備份（完整單一網頁檔，含 CSS + JS 內嵌）*/
  async function exportAll() {
    // 1. 先儲存目前所有設定到 localStorage
    Object.keys(LS).forEach(sec => saveSection(sec));

    // 2. 收集所有設定資料
    const allSettings = {};
    Object.keys(LS).forEach(sec => {
      try {
        const raw = localStorage.getItem(LS[sec]);
        allSettings[sec] = raw ? JSON.parse(raw) : DEFAULTS[sec];
      } catch { allSettings[sec] = DEFAULTS[sec]; }
    });

    // 3. 顯示進度提示
    showToast('📦 正在打包頁面…', 'info', 2000);

    // 4. 嘗試讀取外部 CSS / JS 檔案（fetch 方式，支援 http:// 環境）
    let cssContent  = '/* style.css not found */';
    let jsContent   = '/* app.js not found */';

    try {
      const cssResp = await fetch('style.css');
      if (cssResp.ok) cssContent = await cssResp.text();
    } catch (_) {}

    try {
      const jsResp  = await fetch('app.js');
      if (jsResp.ok) jsContent  = await jsResp.text();
    } catch (_) {}

    // 5. 抓取目前頁面 HTML 骨架並轉換為可獨立運作的備份頁面
    const originalHtml = document.documentElement.outerHTML;

    // 6. 將設定資料序列化為注入腳本
    const settingsJson = JSON.stringify(allSettings, null, 2);
    const shopName     = el('cfg-studio-name')?.value.trim() || '拍賣';
    const itemName     = el('cfg-item-name')?.value.trim()   || '商品';
    const dateTag      = _dateTag();

    // 7. 建立可獨立開啟的 HTML 字串
    //    注入順序：① 設定資料  ② style.css 內嵌  ③ app.js 內嵌
    const standalonePage = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>拍賣備份 — ${shopName} · ${itemName} (${dateTag})</title>
  <meta name="description" content="${shopName} 拍賣系統完整頁面備份，匯出於 ${new Date().toLocaleString('zh-TW')}" />

  <!-- QR Code Library (CDN) -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>

  <!-- Firebase SDK (CDN) -->
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"><\/script>
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js"><\/script>

  <!-- ❶ 注入備份時的所有後台設定（頁面載入後自動還原）-->
  <script>
  window.__AUCTION_BACKUP__ = {
    exportedAt: "${new Date().toISOString()}",
    shopName  : ${JSON.stringify(shopName)},
    itemName  : ${JSON.stringify(itemName)},
    settings  : ${settingsJson}
  };
  // 自動還原 localStorage（讓系統讀到備份當下的設定）
  (function restoreFromBackup() {
    const backup = window.__AUCTION_BACKUP__;
    if (!backup || !backup.settings) return;
    const keyMap = { A: 'auctionSect_A', B: 'auctionSect_B', C: 'auctionSect_C', D: 'auctionSect_D' };
    Object.entries(backup.settings).forEach(([sec, data]) => {
      if (keyMap[sec]) {
        try { localStorage.setItem(keyMap[sec], JSON.stringify(data)); } catch(_) {}
      }
    });
  })();
  <\/script>

  <!-- ❷ 嵌入 style.css -->
  <style>
${cssContent}

  /* ── 備份頁面額外標識樣式 ── */
  .backup-banner {
    background: linear-gradient(90deg, #f59e0b, #a855f7);
    color: white; text-align: center;
    padding: 7px 16px; font-size: .8rem; font-weight: 700;
    letter-spacing: .04em; position: sticky; top: 0; z-index: 9999;
  }
  </style>
</head>
<body>

  <!-- 備份標識 Banner -->
  <div class="backup-banner">
    📦 備份頁面 — ${shopName} · ${itemName} · 匯出於 ${new Date().toLocaleString('zh-TW')}
  </div>

${document.getElementById('page-admin')?.outerHTML || '<p>頁面結構讀取失敗</p>'}

  <!-- Toast / FX Canvas（從原頁面複製）-->
  ${document.getElementById('toast')?.outerHTML || ''}
  ${document.getElementById('fx-canvas')?.outerHTML || ''}

  <!-- Modals -->
  ${document.getElementById('bid-modal')?.outerHTML   || ''}
  ${document.getElementById('val-modal')?.outerHTML   || ''}
  ${document.getElementById('pv-modal')?.outerHTML    || ''}
  ${document.getElementById('fb-setup-modal')?.outerHTML || ''}

  <!-- ❸ 嵌入 app.js -->
  <script>
${jsContent}
  <\/script>

</body>
</html>`;

    // 8. Blob 下載
    const blob = new Blob([standalonePage], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.style.display = 'none';
    a.href     = url;
    a.download = `拍賣備份頁面_${shopName}_${itemName}_${dateTag}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 8000);

    showToast(`✅ 完整備份頁面已下載！（${shopName} · ${itemName}）`, 'success', 4500);
  }



  /** 單區匹出 */
  function exportSingleSection(sec) {
    saveSection(sec);
    const payload = {
      _type       : 'auction-section',
      _section    : sec,
      _sectionName: SECT_NAMES[sec],
      _version    : '1.0',
      _exportedAt : new Date().toISOString(),
      data        : SECT_FIELDS[sec](),
    };
    const shopName = el('cfg-studio-name')?.value.trim() || '拍賣';
    exportJSONBlob(payload, `區塊${sec}_${SECT_NAMES[sec]}_${shopName}_${_dateTag()}.json`);
    showToast(`⬆ 區塊 ${sec}「${SECT_NAMES[sec]}」已匯出`, 'success', 2500);
  }

  /* ── Import ─────────────────────────────────────────── */
  function importJSON(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const payload = JSON.parse(ev.target.result);

        if (payload._type === 'auction-full-backup' && payload.sections) {
          // Full backup
          if (!confirm(`📥 確定要匯入「全頁備份」？\n匯出時間：${payload._exportedAt || '未知'}\n\n這將覆蓋所有四個區塊的設定（A、B、C、D），已填寫的資料將被取代。`)) return;
          Object.keys(payload.sections).forEach(sec => {
            if (LS[sec]) {
              applySection(sec, payload.sections[sec]);
              localStorage.setItem(LS[sec], JSON.stringify(payload.sections[sec]));
            }
          });
          showToast('📥 全頁備份匯入完成！', 'success', 4000);

        } else if (payload._type === 'auction-section' && payload._section && payload.data) {
          // Single section
          const sec = payload._section;
          if (!LS[sec]) { showToast('⚠️ 無效的區塊代碼', 'error'); return; }
          if (!confirm(`📥 確定要匯入「${payload._sectionName || sec}」區塊設定？\n匯出時間：${payload._exportedAt || '未知'}\n\n這將覆蓋區塊 ${sec} 的設定，其他區塊不受影響。`)) return;
          applySection(sec, payload.data);
          localStorage.setItem(LS[sec], JSON.stringify(payload.data));
          showToast(`📥 區塊 ${sec}「${payload._sectionName}」匯入完成！`, 'success', 3500);

        } else {
          showToast('⚠️ 無法識別的 JSON 格式，請使用本系統匯出的備份檔', 'error', 4000);
        }
      } catch(e) {
        showToast('❌ JSON 解析失敗，請確認檔案格式', 'error', 4000);
        console.error('[StorageModule] import parse error', e);
      }
    };
    reader.readAsText(file, 'utf-8');
  }

  /* ── Wire UI buttons ─────────────────────────────────── */
  function wireButtons() {
    // Per-section reset buttons
    qsa('.sect-reset-btn').forEach(btn => {
      btn.addEventListener('click', () => resetSection(btn.dataset.reset));
    });

    // 儲存全頁（Blob 下載）
    const btnSaveAll = el('btn-save-all');
    if (btnSaveAll) btnSaveAll.addEventListener('click', saveAll);

    // Export all (blob download)
    const btnExpAll = el('btn-export-all');
    if (btnExpAll) btnExpAll.addEventListener('click', exportAll);

    // Import trigger
    const btnImpTrig = el('btn-import-trigger');
    const impFileInp = el('import-file-input');
    if (btnImpTrig && impFileInp) {
      btnImpTrig.addEventListener('click', () => impFileInp.click());
      impFileInp.addEventListener('change', () => {
        importJSON(impFileInp.files[0]);
        impFileInp.value = '';   // reset so same file can be re-imported
      });
    }

    // Per-section export chips
    qsa('.sect-exp-btn').forEach(btn => {
      btn.addEventListener('click', () => exportSingleSection(btn.dataset.section));
    });
  }

  /* ── Public API ─────────────────────────────────────── */
  window._storageSaveA = () => scheduleSave('A');
  window._storageSaveB = () => scheduleSave('B');
  window._storageSaveC = () => scheduleSave('C');

  /* ── INIT ─────────────────────────────────────────── */
  restoreAll();
  wireAutoSave();
  wireButtons();

})(); // end StorageModule

// ─────────────────────────────────────────────────────────
//  WARRANTY & TERMS MODULE
// ─────────────────────────────────────────────────────────
(function WarrantyTermsModule() {

  const DEFAULT_TERMS_FN = () => {
    const days = parseInt(el('cfg-warranty-days')?.value) || 3;
    const time = el('cfg-warranty-time')?.value || '12:00';
    const [hh, mm] = time.split(':');
    const timeStr = `${parseInt(hh)} 點${mm !== '00' ? mm + ' 分' : ''}整`;
    return [
      '1. 2手商品外觀難免有瑕疵。完美主義者，請斟酌購買。',
      '2. 下訂後，請於 48 小時內取件，逾時視為棄標。',
      '3. 請特別注意，現況出售。全機外觀及出售物件如圖。',
      `4. 出售後提供 ${days} 天保固（至第 ${days} 天中午 ${timeStr}），有問題可退貨，逾期不候。`,
      '5. 買回需自行測試，初步測試功能正常。',
    ].join('\n');
  };

  /** Build warranty description for modal banner */
  function getWarrantyInfo() {
    const mode = document.querySelector('input[name="warranty-mode"]:checked')?.value || 'limited';
    const days = parseInt(el('cfg-warranty-days')?.value) || 3;
    const time = el('cfg-warranty-time')?.value || '12:00';
    if (mode === 'limited') {
      return {
        icon : '🛡️',
        text : `有限保固 ${days} 天（至第 ${days} 天 ${time}）`,
        cls  : 'mode-limited',
      };
    }
    if (mode === 'none') {
      return {
        icon : '🚫',
        text : '本商品為現況出售，不提供保固',
        cls  : 'mode-none',
      };
    }
    // onsite
    return {
      icon : '👁',
      text : '僅限現場看貨測試，離場後不負保固責任',
      cls  : 'mode-onsite',
    };
  }
  // Expose for collectAdmin / openModal
  window._getWarrantyInfo   = getWarrantyInfo;
  window._getDefaultTerms   = DEFAULT_TERMS_FN;

  // ── DOM refs ─────────────────────────────────────────
  const wModes       = document.querySelectorAll('input[name="warranty-mode"]');
  const wLimitedOpts = el('warranty-limited-opts');
  const wDaysInp     = el('cfg-warranty-days');
  const wTimeInp     = el('cfg-warranty-time');
  const btnWdMinus   = el('btn-wd-minus');
  const btnWdPlus    = el('btn-wd-plus');
  const qtCbs        = document.querySelectorAll('.qt-cb');
  const termsArea    = el('cfg-custom-terms');
  const btnRestoreTerms = el('btn-restore-terms');

  if (!wDaysInp) return; // guard: not on admin page

  // ── Warranty mode → show/hide limited opts ──────────
  function syncWarrantyUI() {
    const mode = document.querySelector('input[name="warranty-mode"]:checked')?.value;
    if (wLimitedOpts) wLimitedOpts.classList.toggle('hidden', mode !== 'limited');
    scheduleSaveC();
  }
  wModes.forEach(r => r.addEventListener('change', syncWarrantyUI));
  syncWarrantyUI(); // init

  // ── Warranty days stepper ─────────────────────────
  if (btnWdMinus) {
    btnWdMinus.addEventListener('click', () => {
      wDaysInp.value = Math.max(1, (parseInt(wDaysInp.value) || 1) - 1);
      scheduleSaveC();
    });
  }
  if (btnWdPlus) {
    btnWdPlus.addEventListener('click', () => {
      wDaysInp.value = (parseInt(wDaysInp.value) || 1) + 1;
      scheduleSaveC();
    });
  }
  wDaysInp.addEventListener('input', scheduleSaveC);
  if (wTimeInp) wTimeInp.addEventListener('change', scheduleSaveC);

  // ── Quick-term checkboxes: auto-update textarea hint ─
  qtCbs.forEach(cb => cb.addEventListener('change', () => {
    scheduleSaveC();
  }));

  // ── Restore defaults button ───────────────────────
  if (btnRestoreTerms) {
    btnRestoreTerms.addEventListener('click', () => {
      if (termsArea) {
        termsArea.value = DEFAULT_TERMS_FN();
        termsArea.dispatchEvent(new Event('input'));
        showToast('↩ 預設條款已還原', 'success', 2000);
      }
    });
  }

  // ── Helper: trigger StorageModule C save ─────────
  function scheduleSaveC() {
    if (typeof window._storageSaveC === 'function') window._storageSaveC();
  }

})(); // end WarrantyTermsModule

// ─────────────────────────────────────────────────────────
//  LOGO DROPZONE MODULE  (Section A)
// ─────────────────────────────────────────────────────────
(function initLogoDropzone() {
  const dropzone   = el('logo-dropzone');
  const fileInput  = el('logo-file-input');
  const previewWrp = el('logo-preview-wrap');
  const previewImg = el('logo-preview-img');
  const btnRemove  = el('btn-logo-remove');
  const btnReselect= el('btn-logo-reselect');
  const btnAddUrl  = el('btn-add-logo-url');
  const urlInput   = el('cfg-logo-url');

  if (!dropzone) return; // guard: auction page won't have this

  // ── Internal helpers ──────────────────────────────────
  function showPreview(src) {
    S.logoSrc = src;
    previewImg.src = src;
    previewWrp.style.display = 'flex';
    dropzone.style.display   = 'none';
    // Notify StorageModule to auto-save A
    document.dispatchEvent(new CustomEvent('agy:logoChanged'));
  }

  function clearLogo() {
    S.logoSrc = '';
    previewImg.src = '';
    previewWrp.style.display = 'none';
    dropzone.style.display   = 'flex';
    if (urlInput) urlInput.value = '';
    document.dispatchEvent(new CustomEvent('agy:logoChanged'));
  }

  // ── Click / keyboard to open file picker ─────────────
  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
  });

  // ── Drag visual states ────────────────────────────────
  ['dragenter','dragover'].forEach(ev =>
    dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.add('dz-over'); })
  );
  ['dragleave','dragend'].forEach(ev =>
    dropzone.addEventListener(ev, () => dropzone.classList.remove('dz-over'))
  );

  // ── Drop handler ──────────────────────────────────────
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('dz-over');
    handleLogoFile(e.dataTransfer.files[0]);
  });

  // ── File input change ─────────────────────────────────
  fileInput.addEventListener('change', () => {
    handleLogoFile(fileInput.files[0]);
    fileInput.value = '';
  });

  // ── Convert file → base64 and show preview ───────────
  function handleLogoFile(file) {
    if (!file) return;
    const allowed = ['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'];
    if (!allowed.includes(file.type)) {
      showToast(`⚠️ 不支援的格式：${file.name}`, 'warning'); return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      showPreview(ev.target.result);
      showToast('✅ Logo 已上傳', 'success', 1800);
    };
    reader.readAsDataURL(file);
  }

  // ── Remove logo ───────────────────────────────────────
  if (btnRemove) {
    btnRemove.addEventListener('click', () => {
      clearLogo();
      showToast('🗑 Logo 已移除', 'info', 1800);
    });
  }

  // ── Reselect (open file picker from preview state) ───
  if (btnReselect) {
    btnReselect.addEventListener('click', () => fileInput.click());
  }

  // ── URL fallback "＋ 套用" button ─────────────────────
  if (btnAddUrl && urlInput) {
    btnAddUrl.addEventListener('click', () => {
      const url = urlInput.value.trim();
      if (!url) { showToast('⚠️ 請輸入 Logo 網址', 'warning'); return; }
      showPreview(url);
      showToast('✅ Logo 網址已套用', 'success', 1800);
    });
    urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') btnAddUrl.click(); });
    // Also wire URL input changes to auto-save A
    urlInput.addEventListener('input', () =>
      document.dispatchEvent(new CustomEvent('agy:logoChanged'))
    );
  }

  // ── Listen for restore event from StorageModule ───────
  document.addEventListener('agy:restoreLogo', ev => {
    const src = ev.detail;
    if (src) {
      showPreview(src);
    } else {
      clearLogo();
    }
  });

  // ── Wire agy:logoChanged → StorageModule auto-save A ─
  // (StorageModule listens for this; wire inside StorageModule via window API)
  document.addEventListener('agy:logoChanged', () => {
    if (typeof window._storageSaveA === 'function') window._storageSaveA();
  });

})(); // end LogoDropzone

// ─────────────────────────────────────────────────────────
//  IMAGE DROPZONE MODULE
(function initDropzone() {
  const dropzone   = el('img-dropzone');
  const fileInput  = el('img-file-input');
  const thumbGrid  = el('img-thumb-grid');
  const btnAddUrl  = el('btn-add-url-img');
  const urlInput   = el('cfg-img-url');

  if (!dropzone) return; // guard

  // ── Open file dialog on click / Enter / Space ──────────
  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
  });

  // ── Drag visual states ─────────────────────────────────
  ['dragenter','dragover'].forEach(ev =>
    dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.add('dz-over'); })
  );
  ['dragleave','dragend'].forEach(ev =>
    dropzone.addEventListener(ev, () => dropzone.classList.remove('dz-over'))
  );

  // ── Drop handler ───────────────────────────────────────
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('dz-over');
    handleFiles(e.dataTransfer.files);
  });

  // ── File input change ──────────────────────────────────
  fileInput.addEventListener('change', () => {
    handleFiles(fileInput.files);
    fileInput.value = ''; // reset so same file can be re-selected
  });

  // ── URL fallback "＋ 加入" button ───────────────────────
  if (btnAddUrl && urlInput) {
    btnAddUrl.addEventListener('click', () => {
      const url = urlInput.value.trim();
      if (!url) { showToast('⚠️ 請輸入圖片網址', 'warning'); return; }
      addImage({ src: url, name: url.split('/').pop() || '外部圖片' });
      urlInput.value = '';
      showToast('✅ 圖片網址已加入', 'success', 1800);
    });
    urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') btnAddUrl.click(); });
  }

  // ── Convert FileList → base64, add to S.images ─────────
  function handleFiles(files) {
    if (!files || !files.length) return;
    const allowed = ['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'];
    let added = 0;
    Array.from(files).forEach(file => {
      if (!allowed.includes(file.type)) {
        showToast(`⚠️ 不支援的格式：${file.name}`, 'warning'); return;
      }
      const reader = new FileReader();
      reader.onload = ev => {
        addImage({ src: ev.target.result, name: file.name });
        added++;
        if (added === 1) showToast(`✅ 已上傳 ${files.length} 張圖片`, 'success', 2000);
      };
      reader.readAsDataURL(file);
    });
  }

  // ── Add image to S.images & re-render thumbs ───────────
  function addImage({ src, name }) {
    const isCover = S.images.length === 0; // first image auto-becomes cover
    S.images.push({ src, name, isCover });
    renderThumbs();
  }

  // ── Render admin thumbnail grid ────────────────────────
  function renderThumbs() {
    thumbGrid.innerHTML = '';
    S.images.forEach((img, idx) => {
      const item = document.createElement('div');
      item.className = 'thumb-item' + (img.isCover ? ' is-cover' : '');
      item.tabIndex = 0;
      item.setAttribute('aria-label', img.name);

      // thumbnail img
      const picture = document.createElement('img');
      picture.className = 'thumb-img';
      picture.src   = img.src;
      picture.alt   = img.name;
      picture.loading = 'lazy';
      item.appendChild(picture);

      // delete button
      const del = document.createElement('button');
      del.className = 'thumb-del';
      del.type = 'button';
      del.title = '移除圖片';
      del.setAttribute('aria-label', '移除圖片');
      del.innerHTML = '✕';
      del.addEventListener('click', e => {
        e.stopPropagation();
        S.images.splice(idx, 1);
        // ensure there's still a cover
        if (S.images.length && !S.images.some(i => i.isCover)) {
          S.images[0].isCover = true;
        }
        renderThumbs();
        showToast('🗑 圖片已移除', 'info', 1600);
      });
      item.appendChild(del);

      // cover badge (shown when IS cover)
      if (img.isCover) {
        const badge = document.createElement('div');
        badge.className = 'thumb-cover-badge';
        badge.textContent = '★ 主圖';
        item.appendChild(badge);
      } else {
        // set-as-cover button (shown on hover)
        const setCover = document.createElement('div');
        setCover.className = 'thumb-set-cover';
        setCover.textContent = '設為主圖';
        setCover.addEventListener('click', e => {
          e.stopPropagation();
          S.images.forEach(i => { i.isCover = false; });
          S.images[idx].isCover = true;
          renderThumbs();
          showToast('✅ 已設為主圖', 'success', 1600);
        });
        item.appendChild(setCover);
      }

      thumbGrid.appendChild(item);
    });

    // Update dropzone visual state
    dropzone.classList.toggle('dz-has-files', S.images.length > 0);
    const dzText = dropzone.querySelector('.dz-text');
    if (dzText) {
      dzText.textContent = S.images.length > 0
        ? `已上傳 ${S.images.length} 張（點擊或拖曳可繼續新增）`
        : '點擊選取 或 拖曳圖片至此';
    }
    // Notify StorageModule that images changed → auto-save B
    document.dispatchEvent(new CustomEvent('agy:imagesChanged'));
  }

  // ── Listen for restore event from StorageModule ────────
  document.addEventListener('agy:restoreImages', ev => {
    // ev.detail is the images array (may be empty for reset)
    // S.images has already been set by StorageModule's applySection
    renderThumbs();
  });
})();

// ─────────────────────────────────────────────────────────
//  GALLERY RENDERER  (Auction page)
// ─────────────────────────────────────────────────────────
function renderGallery(imgList) {
  // Reset
  aImg.style.display    = 'none';
  aImgPh.style.display  = 'flex';
  galleryStrip.innerHTML  = '';
  galleryCounter.style.display = 'none';
  galleryPrev.style.display = 'none';
  galleryNext.style.display = 'none';

  if (!imgList || !imgList.length) return;

  // Reorder: put cover first
  const ordered = [
    ...imgList.filter(i => i.isCover),
    ...imgList.filter(i => !i.isCover),
  ];

  _galleryIdx = 0;

  function showIdx(idx) {
    _galleryIdx = Math.max(0, Math.min(idx, ordered.length - 1));
    const cur = ordered[_galleryIdx];
    aImg.src = cur.src;
    aImg.style.display = 'block';
    aImgPh.style.display = 'none';

    // counter
    if (ordered.length > 1) {
      galleryCounter.textContent    = `${_galleryIdx + 1} / ${ordered.length}`;
      galleryCounter.style.display  = 'block';
      galleryPrev.style.display     = 'flex';
      galleryNext.style.display     = 'flex';
      galleryPrev.disabled = _galleryIdx === 0;
      galleryNext.disabled = _galleryIdx === ordered.length - 1;
    }

    // strip highlight
    galleryStrip.querySelectorAll('.gs-thumb').forEach((th, i) => {
      th.classList.toggle('active', i === _galleryIdx);
    });
    // scroll active thumb into view
    const activeThumb = galleryStrip.querySelectorAll('.gs-thumb')[_galleryIdx];
    if (activeThumb) activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  // Build thumbnail strip
  ordered.forEach((img, idx) => {
    const th = document.createElement('div');
    th.className = 'gs-thumb' + (idx === 0 ? ' active' : '');
    th.innerHTML = `<img src="${img.src}" alt="${img.name}" loading="lazy" />`;
    th.addEventListener('click', () => showIdx(idx));
    galleryStrip.appendChild(th);
  });

  // Arrow listeners (replace old ones by cloning)
  const newPrev = galleryPrev.cloneNode(true);
  const newNext = galleryNext.cloneNode(true);
  galleryPrev.parentNode.replaceChild(newPrev, galleryPrev);
  galleryNext.parentNode.replaceChild(newNext, galleryNext);
  newPrev.addEventListener('click', () => showIdx(_galleryIdx - 1));
  newNext.addEventListener('click', () => showIdx(_galleryIdx + 1));

  // Swipe support (touch)
  let _tsx = 0;
  const gMain = el('gallery-main');
  gMain.addEventListener('touchstart', e => { _tsx = e.touches[0].clientX; }, { passive: true });
  gMain.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0].clientX - _tsx;
    if (Math.abs(dx) > 40) showIdx(_galleryIdx + (dx < 0 ? 1 : -1));
  }, { passive: true });

  showIdx(0);
}

// ─────────────────────────────────────────────────────────
//  ADMIN: SELECT & COLLECT
// ─────────────────────────────────────────────────────────

/* Mode tabs */
qsa('.mode-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    qsa('.mode-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
    tab.classList.add('active'); tab.setAttribute('aria-selected','true');
    const mode = tab.dataset.mode;
    el('panel-fixed').classList.toggle('active', mode === 'fixed');
    el('panel-rolling').classList.toggle('active', mode === 'rolling');
    S.timerMode = mode;
  });
});

/* Anti-snipe toggle */
cfgAntiSnipe.addEventListener('change', () => {
  antiSnipeOpts.style.display = cfgAntiSnipe.checked ? 'flex' : 'none';
});

/* Buffer / extend dropdowns */
cfgBufferMins.addEventListener('change', () => {
  cfgBufferCustom.style.display = cfgBufferMins.value === 'custom' ? 'block' : 'none';
});
cfgExtendMins.addEventListener('change', () => {
  cfgExtendCustom.style.display = cfgExtendMins.value === 'custom' ? 'block' : 'none';
});

/* Custom pickup */
cfgPickupCustCb.addEventListener('change', () => {
  cfgPickupCustWrp.style.display = cfgPickupCustCb.checked ? 'block' : 'none';
});

/* Live video preview */
cfgVideoUrl.addEventListener('input', () => {
  const url = parseVideoUrl(cfgVideoUrl.value);
  if (url) {
    cfgVideoPreview.style.display = 'block';
    cfgVideoPreview.innerHTML = `<div class="video-embed"><iframe src="${url}" allowfullscreen></iframe></div>`;
  } else {
    cfgVideoPreview.style.display = 'none';
    cfgVideoPreview.innerHTML = '';
  }
});

function getBufferVal(sel, inp) {
  return sel.value === 'custom' ? (parseInt(inp.value) || 3) : parseInt(sel.value);
}

function collectAdmin() {
  S.studioName   = cfgStudioName.value.trim()   || '建生工坊';
  S.logoUrl      = S.logoSrc || (cfgLogoUrl ? cfgLogoUrl.value.trim() : '');  // prefer dropzone, fallback to URL input
  S.itemName     = cfgItemName.value.trim()     || '（未命名商品）';
  S.itemSubtitle = cfgItemSubtitle.value.trim();
  S.itemDesc     = cfgItemDesc.value.trim();
  S.itemQty      = Math.max(1, parseInt(cfgItemQty.value) || 1);
  // images come from S.images (managed by dropzone module)
  // S.imgUrl is only used as fallback when S.images is empty
  S.imgUrl       = cfgImgUrl ? cfgImgUrl.value.trim() : '';
  S.startPrice   = Math.max(0, parseFloat(cfgStartPrice.value) || 0);
  S.increment    = Math.max(1, parseFloat(cfgIncrement.value)  || 1);
  S.videoUrl     = cfgVideoUrl.value.trim();
  S.customTerms  = cfgCustomTerms.value.trim();
  // Warranty settings
  S.warrantyMode = document.querySelector('input[name="warranty-mode"]:checked')?.value || 'limited';
  S.warrantyDays = parseInt(el('cfg-warranty-days')?.value) || 3;
  S.warrantyTime = el('cfg-warranty-time')?.value || '12:00';
  S.qt48h        = el('qt-48h')?.checked  ?? true;
  S.qtTest       = el('qt-test')?.checked ?? true;
  S.qtAsis       = el('qt-asis')?.checked ?? true;

  // Pickups
  S.pickups = [];
  qsa('input[name="pickup"]:not(#pickup-custom-cb):checked').forEach(cb => S.pickups.push(cb.value));
  if (cfgPickupCustCb.checked && cfgPickupCustTxt.value.trim()) {
    S.pickups.push(cfgPickupCustTxt.value.trim());
  }
  if (!S.pickups.length) S.pickups = ['自取'];

  // Timer mode
  const activeTab = document.querySelector('.mode-tab.active');
  S.timerMode = activeTab ? activeTab.dataset.mode : 'fixed';

  // Fixed durations
  S.fixedDays  = Math.max(0, parseInt(cfgTDays.value)  || 0);
  S.fixedHours = Math.max(0, parseInt(cfgTHours.value) || 0);
  S.fixedMins  = Math.max(0, parseInt(cfgTMins.value)  || 0);
  S.fixedSecs  = Math.max(0, parseInt(cfgTSecs.value)  || 0);

  // Anti-snipe
  S.antiSnipe  = cfgAntiSnipe.checked;
  S.bufferMins = getBufferVal(cfgBufferMins, cfgBufferCustom);
  S.extendMins = getBufferVal(cfgExtendMins, cfgExtendCustom);
}

// ─────────────────────────────────────────────────────────
//  PUBLISH & PREVIEW — VALIDATION + BUYER-VIEW MODAL
// ─────────────────────────────────────────────────────────

/* ── DOM refs for new modals ── */
const valModal    = el('val-modal');
const valErrList  = el('val-error-list');
const btnValClose = el('btn-val-close');
const pvModal     = el('pv-modal');
const pvInner     = el('pv-inner');
const pvFrame     = el('pv-device-frame');
const btnPvClose  = el('btn-pv-close');
const btnPvBack   = el('btn-pv-back');
const btnPvPublish = el('btn-pv-publish');
const pvBtnMobile  = el('pv-btn-mobile');
const pvBtnDesktop = el('pv-btn-desktop');

/* ── Validation rules ──────────────────────────────────── */
function validateAll() {
  collectAdmin();
  const errors = [];

  // A: Seller name
  const sellerName = el('cfg-studio-name')?.value.trim() || '';
  if (!sellerName) {
    errors.push({
      icon: '🏪', targetId: 'cfg-studio-name',
      cardSel: '[data-section="A"]',
      msg: '<strong>【區塊 A】</strong> 請填寫「賣家 / 店鋪名稱」',
    });
  }

  // B: Item name
  if (!cfgItemName.value.trim()) {
    errors.push({
      icon: '📦', targetId: 'cfg-item-name',
      cardSel: '[data-section="B"]',
      msg: '<strong>【區塊 B】</strong> 請填寫「商品名稱」',
    });
  }

  // B: Item desc
  if (!cfgItemDesc.value.trim()) {
    errors.push({
      icon: '📝', targetId: 'cfg-item-desc',
      cardSel: '[data-section="B"]',
      msg: '<strong>【區塊 B】</strong> 請填寫「詳細說明」',
    });
  }

  // B: At least 1 image
  const hasImages = S.images && S.images.length > 0;
  const hasImgUrl = el('cfg-img-url')?.value.trim();
  if (!hasImages && !hasImgUrl) {
    errors.push({
      icon: '🖼️', targetId: 'img-dropzone',
      cardSel: '[data-section="B"]',
      msg: '<strong>【區塊 B】</strong> 請至少上傳 1 張商品圖片',
    });
  }

  // B: YouTube URL format (if provided)
  const vidUrl = cfgVideoUrl.value.trim();
  if (vidUrl) {
    const ytRe = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)[\w\-]{11}/;
    if (!ytRe.test(vidUrl)) {
      errors.push({
        icon: '▶️', targetId: 'cfg-video-url',
        cardSel: '[data-section="B"]',
        msg: '<strong>【區塊 B】</strong> YouTube 網址格式不正確（需為有效的 YouTube 連結）',
      });
    }
  }

  // C: Start price > 0
  const sp = parseFloat(cfgStartPrice.value) || 0;
  if (sp <= 0) {
    errors.push({
      icon: '💰', targetId: 'cfg-start-price',
      cardSel: '[data-section="C"]',
      msg: '<strong>【區塊 C】</strong> 起標價格須大於 0',
    });
  }

  // C: Increment > 0
  const inc = parseFloat(cfgIncrement.value) || 0;
  if (inc <= 0) {
    errors.push({
      icon: '📈', targetId: 'cfg-increment',
      cardSel: '[data-section="C"]',
      msg: '<strong>【區塊 C】</strong> 最低加價單位須大於 0',
    });
  }

  // C: Fixed timer must have duration > 0
  if (S.timerMode === 'fixed') {
    const totalSecs = S.fixedDays * 86400 + S.fixedHours * 3600 + S.fixedMins * 60 + S.fixedSecs;
    if (totalSecs <= 0) {
      errors.push({
        icon: '⏱️', targetId: 'cfg-t-hours',
        cardSel: '[data-section-part="timer"]',
        msg: '<strong>【區塊 C】</strong> 固定期限倒數模式請設定倒數時間（至少 1 秒）',
      });
    }
  }

  // D: At least 1 pickup option
  const pickupChecked = document.querySelectorAll('input[name="pickup"]:checked').length;
  if (!pickupChecked) {
    errors.push({
      icon: '🚚', targetId: null,
      cardSel: '[data-section="D"]',
      msg: '<strong>【區塊 D】</strong> 請至少勾選一種取貨方式',
    });
  }

  return errors;
}

/* ── Show validation error modal ──────────────────────── */
function openValModal(errors) {
  valErrList.innerHTML = '';
  errors.forEach((err, i) => {
    const li = document.createElement('li');
    li.className = 'val-error-item';
    li.style.animationDelay = `${i * 0.05}s`;
    li.innerHTML = `
      <span class="val-error-icon">${err.icon}</span>
      <span class="val-error-msg">${err.msg}</span>
      <span class="val-error-arrow">→</span>`;
    li.addEventListener('click', () => {
      valModal.classList.remove('open');
      document.body.style.overflow = '';
      _scrollToError(err);
    });
    valErrList.appendChild(li);
  });
  valModal.classList.add('open');
  document.body.style.overflow = 'hidden';
  // Store first error for auto-scroll on close
  valModal._firstError = errors[0];
}

/** Scroll to and highlight an error target */
function _scrollToError(err, delay = 200) {
  setTimeout(() => {
    // Highlight card
    if (err.cardSel) {
      const card = document.querySelector(err.cardSel);
      if (card) {
        card.classList.add('card-error');
        setTimeout(() => card.classList.remove('card-error'), 2500);
      }
    }
    // Highlight + scroll to field
    const target = err.targetId ? el(err.targetId) : null;
    if (target) {
      target.classList.add('field-error');
      setTimeout(() => target.classList.remove('field-error'), 2500);
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => { try { target.focus(); } catch(_) {} }, 400);
    } else if (err.cardSel) {
      document.querySelector(err.cardSel)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, delay);
}

btnValClose?.addEventListener('click', () => {
  const firstErr = valModal._firstError;
  valModal.classList.remove('open');
  document.body.style.overflow = '';
  // Auto-scroll to first error after modal closes
  if (firstErr) _scrollToError(firstErr, 250);
});
valModal?.addEventListener('click', e => {
  if (e.target === valModal) {
    const firstErr = valModal._firstError;
    valModal.classList.remove('open');
    document.body.style.overflow = '';
    if (firstErr) _scrollToError(firstErr, 250);
  }
});

/* ── Preview Modal ─────────────────────────────────────── */
let _pendingTotalSecs = 0;
let _pvTimerInterval = null;   // preview countdown interval
let _pvGalleryIdx    = 0;      // preview gallery index
let _pvImgList       = [];     // preview image list

/* ── Build summary strip ─────────────────────────────────── */
function buildSummaryStrip() {
  const wi = typeof window._getWarrantyInfo === 'function'
    ? window._getWarrantyInfo()
    : { icon: '🛡️', text: '有限保固 3 天' };
  const timerStr = S.timerMode === 'rolling'
    ? '🔄 24小時滾動'
    : `📅 ${S.fixedDays}天 ${pad(S.fixedHours)}:${pad(S.fixedMins)}:${pad(S.fixedSecs)}`;
  el('pvs-name').innerHTML     = `<strong>${S.itemName || '—'}</strong>商品名稱`;
  el('pvs-price').innerHTML    = `<strong>NT$ ${Number(S.startPrice).toLocaleString('zh-TW')}</strong>起標 / +${Number(S.increment).toLocaleString('zh-TW')}`;
  el('pvs-timer').innerHTML    = `<strong>${timerStr}</strong>計時模式`;
  el('pvs-pickup').innerHTML   = `<strong>${S.pickups.join('・')}</strong>取貨方式`;
  el('pvs-warranty').innerHTML = `<strong>${wi.icon} ${wi.text}</strong>保固說明`;
}

/* ── Build full rich preview content ───────────────────── */
function buildPreviewContent() {
  collectAdmin();
  buildSummaryStrip();

  const wi = typeof window._getWarrantyInfo === 'function'
    ? window._getWarrantyInfo()
    : { icon: '🛡️', text: '有限保固 3 天', cls: 'mode-limited' };

  // ── Image list ─────────────────────────────────────────
  _pvImgList = [
    ...S.images.filter(i => i.isCover),
    ...S.images.filter(i => !i.isCover),
  ];
  if (!_pvImgList.length && S.imgUrl) {
    _pvImgList = [{ src: S.imgUrl, name: '外部圖片', isCover: true }];
  }
  _pvGalleryIdx = 0;

  // ── Logo ───────────────────────────────────────────────
  const logoHtml = S.logoSrc
    ? `<img src="${S.logoSrc}" class="pv-logo-img" alt="Logo" />`
    : `<div class="pv-logo-placeholder">🏪</div>`;

  // ── Timer string ──────────────────────────────────────
  const timerModeLabel = S.timerMode === 'rolling' ? '🔄 24小時滾動重置' : '📅 固定期限倒數';
  const timerBadgeColor = S.timerMode === 'rolling'
    ? 'rgba(168,85,247,.2);border:1px solid rgba(168,85,247,.45);color:#d8b4fe'
    : 'rgba(99,102,241,.2);border:1px solid rgba(129,140,248,.45);color:#a5b4fc';

  // ── Anti-snipe label ──────────────────────────────────
  const antiSnipeHtml = S.antiSnipe
    ? `<div class="pv-anti-snipe-pill">🛡️ 防壓標啟動（最後 ${S.bufferMins} 分鐘延長 ${S.extendMins} 分鐘）</div>`
    : '';

  // ── Pickup pills ──────────────────────────────────────
  const pickupPills = S.pickups.map(p =>
    `<span class="pv-pickup-pill">${p}</span>`
  ).join('');

  // ── Warranty class ────────────────────────────────────
  const wiClass = wi.cls || 'mode-limited';
  const wiColors = {
    'mode-limited': 'rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.25);',
    'mode-none'   : 'rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);',
    'mode-onsite' : 'rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);',
  };
  const wiColorStyle = wiColors[wiClass] || wiColors['mode-limited'];

  // ── Video embed ────────────────────────────────────────
  const embedUrl = parseVideoUrl(S.videoUrl);
  const videoSection = embedUrl
    ? `<div class="pv-section-card">
         <div class="pv-section-title">🎬 商品影片</div>
         <div class="pv-video-wrap"><iframe src="${embedUrl}" allowfullscreen></iframe></div>
       </div>`
    : '';

  // ── Custom terms ──────────────────────────────────────
  const termsSection = S.customTerms
    ? `<div class="pv-section-card pv-terms-block">
         <div class="pv-section-title">📜 競標條款</div>
         <div class="pv-terms-text">${S.customTerms.slice(0, 400)}${S.customTerms.length > 400 ? '\n…（點擊「我要出標」查看完整條款）' : ''}</div>
       </div>`
    : '';

  // ── Build gallery HTML ────────────────────────────────
  const galleryImages = _pvImgList;
  const mainImgHtml = galleryImages.length
    ? `<img id="pv-gallery-img" class="pv-gallery-img" src="${galleryImages[0].src}" alt="商品圖" />`
    : `<div class="pv-gallery-placeholder">📷 尚未上傳圖片</div>`;
  const hasMulti = galleryImages.length > 1;
  const arrowsHtml = hasMulti
    ? `<button class="pv-gallery-arrow pv-gallery-prev" id="pv-gallery-prev" aria-label="上一張">‹</button>
       <button class="pv-gallery-arrow pv-gallery-next" id="pv-gallery-next" aria-label="下一張">›</button>
       <div class="pv-gallery-counter" id="pv-gallery-counter">1 / ${galleryImages.length}</div>`
    : '';
  const thumbsHtml = hasMulti
    ? `<div class="pv-gallery-thumbs" id="pv-gallery-thumbs">${
        galleryImages.map((img, i) =>
          `<div class="pv-gs-thumb${i === 0 ? ' active' : ''}" data-idx="${i}">
             <img src="${img.src}" alt="${img.name}" loading="lazy" />
           </div>`
        ).join('')
      }</div>`
    : '';

  // ── QR Code placeholder ────────────────────────────────
  const qrSection = `
    <div class="pv-section-card">
      <div class="pv-section-title">🔗 分享 & QR Code</div>
      <div class="pv-qr-row">
        <div class="pv-qr-box" id="pv-qr-box"></div>
        <div class="pv-qr-meta">
          <div style="font-size:.75rem;color:var(--c-text-2);margin-bottom:6px;">正式發布後將生成專屬 QR Code，掃描即可直接進入競標頁面。</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <span class="pv-tag-chip">📋 複製連結</span>
            <span class="pv-tag-chip">⬇ 下載 QR</span>
          </div>
        </div>
      </div>
    </div>`;

  // ── Inject HTML ───────────────────────────────────────
  pvInner.innerHTML = `
    <div class="pv-page-wrap">

      <!-- Seller Nav Bar -->
      <div class="pv-nav-bar">
        <div class="pv-nav-brand">
          ${logoHtml}
          <span class="pv-nav-studio">${S.studioName || '賣家資訊'}</span>
        </div>
        <div class="pv-nav-badge">👁 買家視角</div>
      </div>

      <!-- Gallery -->
      <div class="pv-gallery-wrap">
        <div class="pv-gallery-main" id="pv-gallery-main">
          ${mainImgHtml}
          ${arrowsHtml}
        </div>
        ${thumbsHtml}
        <div class="pv-qty-badge">數量：${S.itemQty} 件</div>
      </div>

      <!-- Item info -->
      <div class="pv-info-block">
        <h2 class="pv-item-name">${S.itemName || '—'}</h2>
        ${S.itemSubtitle ? `<p class="pv-item-subtitle">${S.itemSubtitle}</p>` : ''}
        <div class="pv-pickup-row">${pickupPills}</div>
      </div>

      <!-- Timer Card -->
      <div class="pv-section-card pv-timer-card">
        <div class="pv-timer-mode-badge" style="background:${timerBadgeColor};">${timerModeLabel}</div>
        <div class="pv-timer-ring-wrap">
          <svg class="pv-ring-svg" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="pv-rg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stop-color="#f59e0b"/>
                <stop offset="50%"  stop-color="#ef4444"/>
                <stop offset="100%" stop-color="#a855f7"/>
              </linearGradient>
            </defs>
            <circle class="pv-ring-track" cx="100" cy="100" r="86" />
            <circle class="pv-ring-fill"  cx="100" cy="100" r="86"
              id="pv-ring-fill"
              stroke="url(#pv-rg)"
              stroke-dasharray="540.35"
              stroke-dashoffset="0" />
          </svg>
          <div class="pv-ring-inner">
            <div class="pv-ring-label">剩餘時間</div>
            <div class="pv-ring-digits" id="pv-ring-digits">${
              _pendingTotalSecs > 0
                ? (() => { const r = dhms(_pendingTotalSecs); return r.d > 0 ? `${r.d}天 ${pad(r.h)}:${pad(r.m)}:${pad(r.s)}` : `${pad(r.h)}:${pad(r.m)}:${pad(r.s)}`; })()
                : '--:--:--'
            }</div>
            <div class="pv-ring-status live" id="pv-ring-status">🟢 倒數示意</div>
          </div>
        </div>
        ${antiSnipeHtml}
      </div>

      <!-- Bid Card -->
      <div class="pv-section-card pv-bid-card">
        <div style="font-size:.75rem;color:var(--c-text-2);margin-bottom:4px;">💰 目前最高出價</div>
        <div class="pv-bid-amount">NT$ ${Number(S.startPrice).toLocaleString('zh-TW')}</div>
        <div style="font-size:.78rem;color:var(--c-text-3);margin:4px 0 12px;">起標 ・ 每次加價 ${Number(S.increment).toLocaleString('zh-TW')} 元</div>
        <div class="pv-bid-hint-row">
          <span>下一口最低：</span>
          <strong style="color:#22c55e;font-family:var(--f-num);">NT$ ${Number(S.startPrice + S.increment).toLocaleString('zh-TW')}</strong>
          <span class="pv-inc-tag">加價單位 NT$${Number(S.increment).toLocaleString('zh-TW')}</span>
        </div>

        <!-- Demo Bid Input -->
        <div class="pv-bid-input-row">
          <button class="pv-bid-adj-btn" disabled>−</button>
          <input type="number" class="pv-bid-field" value="${S.startPrice + S.increment}" readonly />
          <button class="pv-bid-adj-btn" disabled>＋</button>
        </div>

        <!-- Demo submit → opens terms demo modal -->
        <button class="pv-submit-btn" id="pv-demo-bid-btn">🔨 我要出標（試演條款彈窗）</button>
      </div>

      <!-- Description -->
      <div class="pv-section-card">
        <div class="pv-section-title">📝 商品詳情</div>
        <div class="pv-desc-text">${S.itemDesc || '（無詳細說明）'}</div>
      </div>

      <!-- Video -->
      ${videoSection}

      <!-- Warranty -->
      <div class="pv-section-card" style="background:${wiColorStyle}border-radius:14px;padding:14px;">
        <div class="pv-warranty-row">
          <span style="font-size:1.3rem;">${wi.icon}</span>
          <span style="font-size:.85rem;font-weight:600;">${wi.text}</span>
        </div>
      </div>

      <!-- Terms -->
      ${termsSection}

      <!-- QR -->
      ${qrSection}

    </div>

    <!-- ── Terms Demo Modal (inside pv-inner) ── -->
    <div class="pv-terms-modal" id="pv-terms-modal">
      <div class="pv-terms-sheet">
        <div class="pv-terms-drag"></div>
        <div class="pv-terms-hd">🔨 競標規則與宣告</div>
        <div class="pv-terms-body">
          <p style="font-size:.82rem;color:var(--c-text-2);margin-bottom:12px;">請仔細閱讀並勾選全部條款後，方可送出競標。</p>
          <div class="pv-warranty-banner">
            <span>${wi.icon}</span>
            <span>${wi.text}</span>
          </div>
          <div class="pv-term-item">
            <input type="checkbox" class="pv-tcb" id="pvt1" />
            <label for="pvt1"><strong>1. 遵守拍賣規則</strong><br>
              <span>本人已閱讀並完全同意本次拍賣之所有規則，承諾嚴格遵守。</span></label>
          </div>
          <div class="pv-term-item">
            <input type="checkbox" class="pv-tcb" id="pvt2" />
            <label for="pvt2"><strong>2. 同意取貨方式</strong><br>
              <span>本人同意依拍賣主所設定之取貨方式辦理。</span></label>
          </div>
          <div class="pv-term-item">
            <input type="checkbox" class="pv-tcb" id="pvt3" />
            <label for="pvt3"><strong>3. 絕不棄標切結</strong><br>
              <span>得標後若無故拒絕付款或取貨，視同棄標，主辦方保留追訴權利。</span></label>
          </div>
          ${S.customTerms ? `
          <div class="pv-full-terms">${S.customTerms}</div>` : ''}
          <div class="pv-term-item pv-term-final">
            <input type="checkbox" class="pv-tcb" id="pvt5" />
            <label for="pvt5"><strong>✅ 我已完整閱讀並同意上述所有條款</strong><br>
              <span>包含保固條件、取件期限及現況出售等所有說明事項。</span></label>
          </div>
          <div class="pv-modal-confirm-box">
            <div class="pv-mcrow"><span>競標者</span><strong>示範帳號</strong></div>
            <div class="pv-mcrow"><span>出價金額</span><strong style="color:#fbbf24;font-family:var(--f-num);font-size:1.1rem;">NT$ ${Number(S.startPrice + S.increment).toLocaleString('zh-TW')}</strong></div>
          </div>
        </div>
        <div class="pv-terms-ft">
          <button class="pv-cancel-btn" id="pv-demo-cancel">取消</button>
          <button class="pv-confirm-btn" id="pv-demo-confirm" disabled>✅ 確認競標（示演）</button>
        </div>
      </div>
    </div>`;

  // ── Wire preview gallery ──────────────────────────────
  _wirePvGallery();

  // ── Wire preview countdown timer ─────────────────────
  _startPvTimer();

  // ── Wire terms demo modal ─────────────────────────────
  _wirePvTermsDemo();

  // ── Wire QR placeholder ───────────────────────────────
  _renderPvQr();
}

/* ── Preview Gallery Logic ───────────────────────────── */
function _wirePvGallery() {
  const imgs = _pvImgList;
  if (!imgs.length) return;

  const pvImg     = pvInner.querySelector('#pv-gallery-img');
  const pvCounter = pvInner.querySelector('#pv-gallery-counter');
  const pvPrev    = pvInner.querySelector('#pv-gallery-prev');
  const pvNext    = pvInner.querySelector('#pv-gallery-next');
  const pvThumbs  = pvInner.querySelectorAll('.pv-gs-thumb');

  function pvShowIdx(idx) {
    _pvGalleryIdx = Math.max(0, Math.min(idx, imgs.length - 1));
    if (pvImg) { pvImg.src = imgs[_pvGalleryIdx].src; }
    if (pvCounter) pvCounter.textContent = `${_pvGalleryIdx + 1} / ${imgs.length}`;
    pvThumbs.forEach((th, i) => th.classList.toggle('active', i === _pvGalleryIdx));
    if (pvPrev) pvPrev.disabled = _pvGalleryIdx === 0;
    if (pvNext) pvNext.disabled = _pvGalleryIdx === imgs.length - 1;
  }

  if (pvPrev) pvPrev.addEventListener('click', () => pvShowIdx(_pvGalleryIdx - 1));
  if (pvNext) pvNext.addEventListener('click', () => pvShowIdx(_pvGalleryIdx + 1));
  pvThumbs.forEach((th, i) => th.addEventListener('click', () => pvShowIdx(i)));

  // Touch swipe
  const gMain = pvInner.querySelector('#pv-gallery-main');
  if (gMain) {
    let _tsx = 0;
    gMain.addEventListener('touchstart', e => { _tsx = e.touches[0].clientX; }, { passive: true });
    gMain.addEventListener('touchend',   e => {
      const dx = e.changedTouches[0].clientX - _tsx;
      if (Math.abs(dx) > 40) pvShowIdx(_pvGalleryIdx + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  pvShowIdx(0);
}

/* ── Preview Countdown Timer ─────────────────────────── */
function _startPvTimer() {
  clearInterval(_pvTimerInterval);
  if (_pendingTotalSecs <= 0) return;

  const PV_RING_CIRC = 2 * Math.PI * 86; // r=86 → ≈540.35
  let _pvRemaining = _pendingTotalSecs;
  const _pvTotal   = _pendingTotalSecs;

  function _tickPv() {
    _pvRemaining = Math.max(0, _pvRemaining - 1);
    const pvDigits = pvInner.querySelector('#pv-ring-digits');
    const pvFill   = pvInner.querySelector('#pv-ring-fill');
    const pvStatus = pvInner.querySelector('#pv-ring-status');
    if (!pvDigits) { clearInterval(_pvTimerInterval); return; }

    const { d, h, m, s } = dhms(_pvRemaining);
    pvDigits.textContent = d > 0 ? `${d}天 ${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}:${pad(s)}`;

    if (pvFill) {
      const ratio = Math.min(1, _pvRemaining / _pvTotal);
      pvFill.style.strokeDashoffset = (PV_RING_CIRC * (1 - ratio)).toFixed(2);
    }
    if (_pvRemaining <= 0) {
      clearInterval(_pvTimerInterval);
      if (pvStatus) { pvStatus.textContent = '⏰ 示演結束'; pvStatus.className = 'pv-ring-status ended'; }
    } else if (_pvRemaining < 300) {
      if (pvDigits) pvDigits.style.color = '#ef4444';
    } else {
      if (pvDigits) pvDigits.style.color = '';
    }
  }

  _pvTimerInterval = setInterval(_tickPv, 1000);
}

/* ── Terms Demo Modal ────────────────────────────────── */
function _wirePvTermsDemo() {
  const termsModal = pvInner.querySelector('#pv-terms-modal');
  const demoBtn    = pvInner.querySelector('#pv-demo-bid-btn');
  const cancelBtn  = pvInner.querySelector('#pv-demo-cancel');
  const confirmBtn = pvInner.querySelector('#pv-demo-confirm');
  const tcbs       = pvInner.querySelectorAll('.pv-tcb');

  if (!termsModal || !demoBtn) return;

  demoBtn.addEventListener('click', () => {
    termsModal.classList.add('open');
    tcbs.forEach(cb => { cb.checked = false; });
    if (confirmBtn) confirmBtn.disabled = true;
  });

  tcbs.forEach(cb => cb.addEventListener('change', () => {
    if (confirmBtn) confirmBtn.disabled = !Array.from(tcbs).every(c => c.checked);
  }));

  cancelBtn?.addEventListener('click', () => termsModal.classList.remove('open'));

  confirmBtn?.addEventListener('click', () => {
    termsModal.classList.remove('open');
    showToast('🎉 條款試演完成！（實際出標請在正式頁面操作）', 'success', 3500);
  });
}

/* ── Preview QR placeholder ──────────────────────────── */
function _renderPvQr() {
  const pvQrBox = pvInner.querySelector('#pv-qr-box');
  if (!pvQrBox) return;
  pvQrBox.innerHTML = '';
  const previewUrl = buildShareUrl();
  try {
    new QRCode(pvQrBox, {
      text: previewUrl || 'https://example.com',
      width: 90, height: 90,
      colorDark: '#000', colorLight: '#fff',
      correctLevel: QRCode.CorrectLevel.M,
    });
  } catch { pvQrBox.innerHTML = '<div style="font-size:.7rem;color:#888;padding:8px;">QR 預覽</div>'; }
}

function openPreviewModal() {
  buildPreviewContent();
  pvModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePreviewModal() {
  clearInterval(_pvTimerInterval);
  _pvTimerInterval = null;
  pvModal.classList.remove('open');
  document.body.style.overflow = '';
  if (pvInner) pvInner.innerHTML = ''; // clean up
}

// Device toggle
[pvBtnMobile, pvBtnDesktop].forEach(btn => btn?.addEventListener('click', () => {
  pvBtnMobile?.classList.toggle('active',  btn === pvBtnMobile);
  pvBtnDesktop?.classList.toggle('active', btn === pvBtnDesktop);
  pvFrame?.classList.toggle('desktop', btn === pvBtnDesktop);
}));

btnPvClose?.addEventListener('click', closePreviewModal);
btnPvBack?.addEventListener('click',  closePreviewModal);
pvModal?.addEventListener('click', e => { if (e.target === pvModal) closePreviewModal(); });

// Confirm & Publish from preview modal
btnPvPublish?.addEventListener('click', () => {
  closePreviewModal();
  doPublish(_pendingTotalSecs);
});

/* ── Core publish logic (extracted) ───────────────────── */
async function doPublish(totalSecs) {
  collectAdmin();
  S.currentBid      = S.startPrice;
  S.topBidder       = '';
  S.topBidTime      = null;
  S.bidHistory      = [];
  S.auctionLive     = true;
  S.auctionDone     = false;
  S.antiSnipeActive = false;
  S.totalSecs       = totalSecs;
  S.endTime         = new Date(Date.now() + totalSecs * 1000);
  S.shareUrl        = buildShareUrl();

  renderAuction();
  startTimer();
  generateQR();
  switchPage('auction');

  // ── Firebase: publish to cloud ────────────────────────
  if (FirebaseModule.isReady()) {
    showToast('☁️ 正在上傳至雲端…', 'info', 2000);
    const auctionId = await FirebaseModule.publishAuction(totalSecs);
    if (auctionId) {
      // Override share URL with cloud URL
      const cloudUrl = FirebaseModule.buildCloudUrl(auctionId);
      S.shareUrl = cloudUrl;
      S.auctionId = auctionId;
      // Update share URL field + regenerate QR
      const shareEl = el('a-share-url');
      if (shareEl) shareEl.value = cloudUrl;
      generateQR(cloudUrl);
      showToast(`🚀 拍賣已發布至雲端！ID: ${auctionId}`, 'success', 5000);
    } else {
      showToast('⚠️ 雲端上傳失敗，以本機模式繼續', 'warning', 4000);
    }
  } else {
    // Local mode
    showToast('🚀 拍賣已成功發布！QR Code 已生成', 'success', 4000);
  }

  confetti(3000);

  // 2.5s 後提示複製分享連結
  setTimeout(() => {
    if (!FirebaseModule.isReady()) {
      showToast('🔗 請至下方複製分享連結或下載 QR Code', 'info', 4500);
    }
    // 自動選取分享網址欄位（方便複製）
    const shareEl = el('a-share-url');
    if (shareEl) {
      const shareCard = el('share-card');
      if (shareCard) {
        shareCard.classList.add('just-published');
        setTimeout(() => shareCard.classList.remove('just-published'), 2000);
        shareCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setTimeout(() => { try { shareEl.select(); } catch(_) {} }, 600);
    }
  }, 2500);
}


/* ── 👁 Preview button: validate then open preview ─────── */
btnPreview.addEventListener('click', () => {
  const errors = validateAll();
  if (errors.length) {
    openValModal(errors);
    return;
  }
  // Compute totalSecs for display
  if (S.timerMode === 'fixed') {
    _pendingTotalSecs = S.fixedDays * 86400 + S.fixedHours * 3600 + S.fixedMins * 60 + S.fixedSecs;
  } else {
    _pendingTotalSecs = 86400;
  }
  openPreviewModal();
});

/* ── 🚀 Publish button: validate → preview → confirm ──── */
btnPublish.addEventListener('click', () => {
  const errors = validateAll();
  if (errors.length) {
    openValModal(errors);
    return;
  }

  if (S.timerMode === 'fixed') {
    _pendingTotalSecs = S.fixedDays * 86400 + S.fixedHours * 3600 + S.fixedMins * 60 + S.fixedSecs;
  } else {
    _pendingTotalSecs = 86400;
  }
  openPreviewModal();
});

btnBack.addEventListener('click', () => {
  stopTimer();
  switchPage('admin');
});

// ─────────────────────────────────────────────────────────
//  PAGE SWITCH  ── 確保頁面完整切換，避免排版重疊
// ─────────────────────────────────────────────────────────
function switchPage(which) {
  const adminEl   = el('page-admin');
  const auctionEl = el('page-auction');

  if (which === 'auction') {
    // ── 顯示買家競標頁面 ────────────────────────────────
    if (adminEl) {
      adminEl.classList.remove('active');
      adminEl.style.display = 'none';     // 確實隱藏，避免 z-index / overflow 衝突
    }
    if (auctionEl) {
      auctionEl.classList.add('active');
      auctionEl.style.display = '';       // 讓 CSS (#page-auction.active) 接管
      // 確保 admin topbar 的 sticky 不再覆蓋競標頁面
      const adminTopbar = document.querySelector('.admin-topbar');
      if (adminTopbar) adminTopbar.style.display = 'none';
    }
  } else {
    // ── 顯示賣家後台管理頁面 ────────────────────────────
    if (auctionEl) {
      auctionEl.classList.remove('active');
      auctionEl.classList.remove('buyer-loading');
      auctionEl.style.display = 'none';
    }
    if (adminEl) {
      adminEl.classList.add('active');
      adminEl.style.display = '';         // 讓 CSS (.page.active) 接管
      const adminTopbar = document.querySelector('.admin-topbar');
      if (adminTopbar) adminTopbar.style.display = '';
    }
  }

  window.scrollTo({ top: 0, behavior: 'instant' });
}

/** 顯示買家頁面載入中狀態（Firebase 資料尚未就緒時） */
function showBuyerLoading(show = true) {
  const auctionEl = el('page-auction');
  if (!auctionEl) return;
  if (show) {
    auctionEl.classList.add('buyer-loading');
  } else {
    auctionEl.classList.remove('buyer-loading');
  }
}


// ─────────────────────────────────────────────────────────
//  RENDER AUCTION PAGE
// ─────────────────────────────────────────────────────────
function renderAuction() {
  document.querySelector('#page-title').textContent = `${S.itemName}｜${S.studioName}`;

  // Header / Nav
  aStudio.textContent = S.studioName;
  if (S.logoUrl) { aLogo.src = S.logoUrl; aLogo.style.display = 'block'; }
  else aLogo.style.display = 'none';

  // Product
  aItemName.textContent = S.itemName;
  aItemSub.textContent  = S.itemSubtitle;
  aQtyBadge.textContent = `數量：${S.itemQty} 件`;

  // ── Gallery / Images ──────────────────────────────────
  _galleryIdx = 0;

  // Build combined image list: S.images first, then URL fallback
  const imgList = [...S.images];
  if (!imgList.length && S.imgUrl) {
    imgList.push({ src: S.imgUrl, name: '外部網址', isCover: true });
  }

  renderGallery(imgList);

  // Pickup chips
  aPickupChips.innerHTML = '';
  const icns = { '自取':'🏠', '宅配/寄送':'📦', '超商取貨':'🏪' };
  S.pickups.forEach(p => {
    const sp = document.createElement('span');
    sp.className = 'pickup-chip';
    sp.textContent = (icns[p] || '✏️') + ' ' + p;
    aPickupChips.appendChild(sp);
  });

  // Description
  aDesc.textContent = S.itemDesc || '（無詳細說明）';

  // Video
  const vUrl = parseVideoUrl(S.videoUrl);
  const isMobile = window.innerWidth < 768;

  if (vUrl) {
    const ifrHtml = `<div class="video-embed"><iframe src="${vUrl}" allowfullscreen></iframe></div>`;
    if (isMobile) {
      aVideoMobile.innerHTML = ifrHtml;
      aVideoMobile.style.display = 'block';
      aVideoCard.style.display = 'none';
    } else {
      aVideoEmbed.innerHTML = ifrHtml;
      aVideoCard.style.display = 'block';
      aVideoMobile.style.display = 'none';
    }
  } else {
    aVideoCard.style.display = 'none';
    aVideoMobile.style.display = 'none';
  }

  // Mode badge
  aModeBadge.textContent = S.timerMode === 'rolling' ? '🔄 24小時滾動' : '📅 固定倒數';

  // Anti-snipe pill
  antiSnipePill.style.display = S.antiSnipe ? 'block' : 'none';

  // Bid display
  renderBid();

  // Share URL
  aShareUrl.value = S.shareUrl || buildShareUrl();

  // Custom terms in modal
  if (S.customTerms) {
    t4Wrap.style.display = 'flex';
    t4Text.textContent = S.customTerms;
  } else {
    t4Wrap.style.display = 'none';
  }

  // Bid input default
  inpBid._userEdited = false;
  setNextBidInput();
}

function renderBid() {
  aCurBid.textContent      = fmt(S.currentBid);
  aIncrTag.textContent     = `加價單位 ${fmt(S.increment)}`;
  mbarBid.textContent      = fmt(S.currentBid);
  histBadge.textContent    = S.bidHistory.length;

  if (S.topBidder) {
    aTopBidder.textContent = '🏆 ' + maskName(S.topBidder);
    aBidTime.textContent   = relTime(S.topBidTime);
  } else {
    aTopBidder.textContent = '尚無出價，搶先下標！';
    aBidTime.textContent   = '';
  }

  setNextBidInput();
  renderHistory();
}

function setNextBidInput() {
  const next = Math.max(S.startPrice, S.currentBid + S.increment);
  aNextBid.textContent = fmt(next);
  inpBid.min = next;
  if (!inpBid._userEdited) inpBid.value = next;
}

function renderHistory() {
  histList.innerHTML = '';
  [...S.bidHistory].reverse().forEach((e, i) => {
    const d = document.createElement('div');
    d.className = 'h-item' + (i === 0 ? ' top' : '');
    d.innerHTML = `
      <span class="h-item-user">${maskName(e.user)}</span>
      <span class="h-item-amt">${fmt(e.amount)}</span>
      <span class="h-item-time">${relTime(e.time)}</span>`;
    histList.appendChild(d);
  });
}

// ─────────────────────────────────────────────────────────
//  COUNTDOWN TIMER
// ─────────────────────────────────────────────────────────
function startTimer() {
  stopTimer();
  if (!S.endTime) return;

  ringStatus.textContent  = '競標進行中';
  ringStatus.className    = 'ring-status live';
  ringLabel.textContent   = S.timerMode === 'rolling' ? '24小時重置' : '剩餘時間';

  _timerInterval = setInterval(tickTimer, 500);
}

function stopTimer() {
  clearInterval(_timerInterval);
  _timerInterval = null;
}

function tickTimer() {
  const rem = (S.endTime - Date.now()) / 1000;
  if (rem <= 0) {
    endAuction(); return;
  }
  renderTimer(rem);
}

function renderTimer(rem) {
  const { d, h, m, s, total } = dhms(rem);

  // Digits
  if (d > 0) {
    ringDays.textContent   = `${d} 天`;
    ringDigits.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
  } else {
    ringDays.textContent   = '';
    ringDigits.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  // Ring arc
  const ratio = Math.min(1, total / S.totalSecs);
  ringFill.style.strokeDashoffset = (RING_CIRCUMFERENCE * (1 - ratio)).toFixed(2);

  // Colour urgency
  if (total < 60) {
    ringDigits.style.color = '#ef4444';
    ringDigits.style.textShadow = '0 0 18px rgba(239,68,68,.6)';
  } else if (total < 300) {
    ringDigits.style.color = '#f97316';
    ringDigits.style.textShadow = '0 0 16px rgba(249,115,22,.5)';
  } else {
    ringDigits.style.color = '';
    ringDigits.style.textShadow = '';
  }

  // Mobile bar
  mbarStatus.textContent = d > 0
    ? `剩 ${d}天 ${pad(h)}:${pad(m)}:${pad(s)}`
    : `剩 ${pad(h)}:${pad(m)}:${pad(s)}`;

  // Show anti-snipe indicator
  antiSnipePill.style.display = (S.antiSnipe && S.antiSnipeActive) ? 'block' : (S.antiSnipe ? 'block' : 'none');
}

// ─────────────────────────────────────────────────────────
//  END AUCTION
// ─────────────────────────────────────────────────────────
function endAuction() {
  stopTimer();
  S.auctionLive = false;
  S.auctionDone = true;

  ringDigits.textContent = '00:00:00';
  ringDays.textContent   = '';
  ringStatus.textContent = '拍賣結束';
  ringStatus.className   = 'ring-status ended';
  ringFill.style.strokeDashoffset = RING_CIRCUMFERENCE.toFixed(2);
  mbarStatus.textContent = '拍賣已結束';

  btnBid.disabled = true;
  bidBtnText.textContent = '拍賣已結束';
  // Disable all bid interaction controls
  [btnMinus, btnPlus].forEach(b => { b.disabled = true; });
  qsa('.qb-chip').forEach(c => { c.disabled = true; });

  // ── Sync auction end to Firebase ─────────────────────
  FirebaseModule.pushAuctionEnd();

  if (S.topBidder) {
    showToast(`🎉 得標：${maskName(S.topBidder)} · ${fmt(S.currentBid)}`, 'success', 8000);
    confetti(4500);
  } else {
    showToast('⏰ 拍賣結束，無人出價', 'warning', 5000);
  }
}


// ─────────────────────────────────────────────────────────
//  ANTI-SNIPE LOGIC
// ─────────────────────────────────────────────────────────
/**
 * Called after every successful bid.
 * MODE FIXED:   If remaining time < bufferMins, extend by extendMins.
 * MODE ROLLING: Always reset to 24h.
 */
function handleAntiSnipe() {
  if (!S.antiSnipe || !S.endTime) return;

  const rem = (S.endTime - Date.now()) / 1000;

  if (S.timerMode === 'rolling') {
    // Always reset to 24h
    S.totalSecs = 86400;
    S.endTime   = new Date(Date.now() + 86400 * 1000);
    S.antiSnipeActive = true;
    showToast('🔄 24小時滾動重置！有人出標，計時重置。', 'warning', 4500);
    startTimer();
    // ── Sync to Firebase ─────────────────────────────────
    FirebaseModule.pushAntiSnipe(S.endTime.getTime(), 86400);

  } else {
    // Fixed: only if within buffer window
    const bufferSecs = S.bufferMins * 60;
    if (rem <= bufferSecs) {
      const extSecs = S.extendMins * 60;
      S.endTime = new Date(Date.now() + extSecs * 1000);
      S.totalSecs = extSecs;
      S.antiSnipeActive = true;
      showToast(`🛡️ 防壓標！最後 ${S.bufferMins} 分鐘內有人出標，延長 ${S.extendMins} 分鐘！`, 'warning', 5000);
      startTimer();
      // ── Sync to Firebase ─────────────────────────────────
      FirebaseModule.pushAntiSnipe(S.endTime.getTime(), extSecs);
    }
  }
}


// ─────────────────────────────────────────────────────────
//  LOGIN
// ─────────────────────────────────────────────────────────
function doLogin() {
  const acc = inpAccount.value.trim();
  if (!acc) {
    inpAccount.classList.add('shake');
    setTimeout(() => inpAccount.classList.remove('shake'), 400);
    showToast('⚠️ 請輸入帳號 / 暱稱', 'warning'); return;
  }
  S.loggedUser = acc;
  loggedUserLbl.textContent = `👤 ${acc}`;
  loginForm.style.display = 'none';
  loggedUserBar.style.display = 'flex';
  showToast(`✅ 已登入：${acc}`, 'success');
}

btnLogin.addEventListener('click', doLogin);
inpAccount.addEventListener('keydown',  e => { if (e.key === 'Enter') doLogin(); });
inpPassword.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

btnLogout.addEventListener('click', () => {
  S.loggedUser = null;
  loginForm.style.display = 'flex';
  loggedUserBar.style.display = 'none';
  inpAccount.value = ''; inpPassword.value = '';
  showToast('👋 已登出');
});

// ─────────────────────────────────────────────────────────
//  LONG-PRESS HELPER  (hold to repeat action)
// ─────────────────────────────────────────────────────────
function setupLongPress(btn, action, delay = 500, interval = 100) {
  let timer, repeat;
  const start = () => {
    timer = setTimeout(() => { repeat = setInterval(action, interval); }, delay);
  };
  const stop = () => { clearTimeout(timer); clearInterval(repeat); };
  btn.addEventListener('mousedown',   start);
  btn.addEventListener('touchstart',  start, { passive: true });
  btn.addEventListener('mouseup',     stop);
  btn.addEventListener('mouseleave',  stop);
  btn.addEventListener('touchend',    stop);
  btn.addEventListener('touchcancel', stop);
}

// ─────────────────────────────────────────────────────────
//  ADMIN STEPPER — 起標價格
// ─────────────────────────────────────────────────────────
/** Get current increment value safely */
function getAdminIncrement() {
  return Math.max(1, parseFloat(cfgIncrement.value) || 1);
}

/** Clamp start price to >= 0 */
btnSpMinus.addEventListener('click', () => {
  const step = getAdminIncrement();
  const cur  = parseFloat(cfgStartPrice.value) || 0;
  cfgStartPrice.value = Math.max(0, cur - step);
  cfgStartPrice.dispatchEvent(new Event('input'));
});
btnSpPlus.addEventListener('click', () => {
  const step = getAdminIncrement();
  const cur  = parseFloat(cfgStartPrice.value) || 0;
  cfgStartPrice.value = cur + step;
  cfgStartPrice.dispatchEvent(new Event('input'));
});

// Long-press support for admin steppers
setupLongPress(btnSpMinus, () => {
  const step = getAdminIncrement();
  cfgStartPrice.value = Math.max(0, (parseFloat(cfgStartPrice.value) || 0) - step);
});
setupLongPress(btnSpPlus, () => {
  const step = getAdminIncrement();
  cfgStartPrice.value = (parseFloat(cfgStartPrice.value) || 0) + step;
});

// ─────────────────────────────────────────────────────────
//  ADMIN STEPPER — 加價單位 + 快捷預設値
// ─────────────────────────────────────────────────────────
const INC_STEP = 10; // step for the increment field itself

btnIncMinus.addEventListener('click', () => {
  const cur = parseFloat(cfgIncrement.value) || INC_STEP;
  cfgIncrement.value = Math.max(1, cur - INC_STEP);
  highlightActiveChip(cfgIncrement.value);
});
btnIncPlus.addEventListener('click', () => {
  const cur = parseFloat(cfgIncrement.value) || INC_STEP;
  cfgIncrement.value = cur + INC_STEP;
  highlightActiveChip(cfgIncrement.value);
});

setupLongPress(btnIncMinus, () => {
  cfgIncrement.value = Math.max(1, (parseFloat(cfgIncrement.value) || INC_STEP) - INC_STEP);
  highlightActiveChip(cfgIncrement.value);
});
setupLongPress(btnIncPlus, () => {
  cfgIncrement.value = (parseFloat(cfgIncrement.value) || INC_STEP) + INC_STEP;
  highlightActiveChip(cfgIncrement.value);
});

// Sync highlight when typed manually
cfgIncrement.addEventListener('input', () => highlightActiveChip(cfgIncrement.value));

/** Highlight active inc-chip that matches current value */
function highlightActiveChip(val) {
  const numVal = parseFloat(val);
  qsa('.inc-chip').forEach(chip => {
    chip.classList.toggle('active', parseFloat(chip.dataset.val) === numVal);
  });
}

/** Preset chip click: set increment value directly */
qsa('.inc-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    cfgIncrement.value = chip.dataset.val;
    highlightActiveChip(chip.dataset.val);
    showToast(`✅ 加價單位已設為 ${Number(chip.dataset.val).toLocaleString('zh-TW')} 元`, 'success', 1600);
  });
});

// Highlight initial value
highlightActiveChip(cfgIncrement.value);

// ─────────────────────────────────────────────────────────
//  BUYER BID INPUT ADJUSTMENTS
// ─────────────────────────────────────────────────────────
inpBid.addEventListener('input', () => { inpBid._userEdited = true; });

/** Returns minimum allowed bid */
function minBidVal() {
  return Math.max(S.startPrice, S.currentBid + S.increment);
}

/** Clamp and set inp-bid value, mark as user-edited */
function setBidValue(val) {
  inpBid.value = Math.max(minBidVal(), val);
  inpBid._userEdited = true;
}

// − button: subtract one increment (floor at minimum)
btnMinus.addEventListener('click', () => {
  const cur = parseFloat(inpBid.value) || minBidVal();
  setBidValue(cur - S.increment);
});

// + button: add one increment
btnPlus.addEventListener('click', () => {
  const cur = parseFloat(inpBid.value) || minBidVal();
  setBidValue(cur + S.increment);
});

// Long-press on buyer ± buttons
setupLongPress(btnMinus, () => {
  const cur = parseFloat(inpBid.value) || minBidVal();
  setBidValue(cur - S.increment);
});
setupLongPress(btnPlus, () => {
  const cur = parseFloat(inpBid.value) || minBidVal();
  setBidValue(cur + S.increment);
});

// Quick-bid chip clicks: add fixed amount on top of current input
qsa('.qb-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    if (S.auctionDone) return;
    const addAmt = parseFloat(chip.dataset.add) || 0;
    const cur = parseFloat(inpBid.value) || minBidVal();
    // Ensure result is at least minBidVal
    setBidValue(Math.max(minBidVal(), cur + addAmt));
    // Brief visual feedback
    chip.classList.add('active');
    setTimeout(() => chip.classList.remove('active'), 300);
  });
});

// ─────────────────────────────────────────────────────────
//  SUBMIT BID → OPEN MODAL
// ─────────────────────────────────────────────────────────
btnBid.addEventListener('click', () => {
  if (S.auctionDone)  { showToast('⏰ 拍賣已結束', 'warning'); return; }
  if (!S.auctionLive) { showToast('⚠️ 拍賣尚未開始，請先從後台發布', 'warning'); return; }

  if (!S.loggedUser) {
    showToast('⚠️ 請先登入身份', 'warning');
    inpAccount.focus();
    el('login-card').classList.add('shake');
    setTimeout(() => el('login-card').classList.remove('shake'), 400);
    return;
  }

  const amt = parseFloat(inpBid.value);
  const minReq = Math.max(S.startPrice, S.currentBid + S.increment);

  if (isNaN(amt) || amt < minReq) {
    showToast(`⚠️ 出價至少需 ${fmt(minReq)}`, 'warning');
    inpBid.classList.add('shake');
    setTimeout(() => inpBid.classList.remove('shake'), 400);
    return;
  }

  S.pendingAmt = amt;
  openModal();
});

// ─────────────────────────────────────────────────────────
//  MODAL
// ─────────────────────────────────────────────────────────
function openModal() {
  // Reset all checkboxes
  [t1, t2, t3, t5].forEach(cb => { if (cb) cb.checked = false; });
  btnMConfirm.disabled = true;

  // ── Warranty banner ──────────────────────────────────
  if (modalWarrantyBox && typeof window._getWarrantyInfo === 'function') {
    const wi = window._getWarrantyInfo();
    modalWarrantyBox.className = `modal-warranty-box ${wi.cls}`;
    if (modalWarrantyIcon) modalWarrantyIcon.textContent = wi.icon;
    if (modalWarrantyText) modalWarrantyText.textContent = wi.text;
  }

  // ── Full terms display (read-only) ───────────────────
  if (S.customTerms && t4Wrap && t4Text) {
    t4Text.textContent = S.customTerms;
    t4Wrap.style.display = 'block';
  } else if (t4Wrap) {
    t4Wrap.style.display = 'none';
  }

  // ── Confirm box ──────────────────────────────────────
  mBidder.textContent = S.loggedUser;
  mAmount.textContent = fmt(S.pendingAmt);
  bidModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  bidModal.classList.remove('open');
  document.body.style.overflow = '';
}

function checkTerms() {
  // t1+t2+t3 always required; t5 (final agree) always required
  const allChecked = [t1, t2, t3, t5].filter(Boolean).every(cb => cb.checked);
  btnMConfirm.disabled = !allChecked;
}

[t1, t2, t3, t5].forEach(cb => { if (cb) cb.addEventListener('change', checkTerms); });
btnMCancel.addEventListener('click', closeModal);
bidModal.addEventListener('click', e => { if (e.target === bidModal) closeModal(); });

btnMConfirm.addEventListener('click', () => {
  closeModal();
  confirmBid();
});

// ─────────────────────────────────────────────────────────
//  CONFIRM BID
// ─────────────────────────────────────────────────────────
async function confirmBid() {
  const amt    = S.pendingAmt;
  const minReq = Math.max(S.startPrice, S.currentBid + S.increment);
  if (amt < minReq) {
    showToast(`⚠️ 出價不足，最低 ${fmt(minReq)}`, 'error'); return;
  }

  // Local state update
  S.bidHistory.push({ user: S.loggedUser, amount: amt, time: Date.now() });
  S.currentBid  = amt;
  S.topBidder   = S.loggedUser;
  S.topBidTime  = Date.now();
  inpBid._userEdited = false;

  // ── Firebase: push bid to cloud ───────────────────────
  if (FirebaseModule.isReady()) {
    const ok = await FirebaseModule.pushBid(S.loggedUser, amt);
    // If cloud push succeeded, Firebase listener will handle renderBid()
    // for remote clients. Local render below is for immediate feedback.
    if (!ok) {
      showToast('⚠️ 雲端同步失敗，已記錄本機', 'warning', 3000);
    }
  }

  // Anti-snipe (local + cloud)
  handleAntiSnipe();

  renderBid();

  // Flash animation on bid amount
  aCurBid.style.transition = 'none';
  aCurBid.style.transform = 'scale(1.15)';
  aCurBid.style.color = '#22c55e';
  setTimeout(() => {
    aCurBid.style.transform = '';
    aCurBid.style.color = '';
    aCurBid.style.transition = '';
  }, 500);

  showToast(`🔨 ${maskName(S.loggedUser)} 出標 ${fmt(amt)}！`, 'success', 4000);
  confetti(1500);
}


// ─────────────────────────────────────────────────────────
//  HISTORY TOGGLE
// ─────────────────────────────────────────────────────────
btnHistTog.addEventListener('click', () => {
  const open = histList.classList.toggle('open');
  histArrow.classList.toggle('open', open);
  // Refresh text
  btnHistTog.childNodes[0].textContent = (open ? '🔼 收起' : '📋') + ' 出價紀錄 ';
});

// ─────────────────────────────────────────────────────────
//  QR CODE
// ─────────────────────────────────────────────────────────
function generateQR() {
  qrContainer.innerHTML = '';
  const url = S.shareUrl || location.href;
  try {
    _qrInstance = new QRCode(qrContainer, {
      text: url,
      width: 102, height: 102,
      colorDark: '#000000', colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H,
    });
  } catch { qrContainer.textContent = 'QR 生成失敗'; }
}

btnDlQr.addEventListener('click', () => {
  const cv = qrContainer.querySelector('canvas');
  const im = qrContainer.querySelector('img');
  if (cv) {
    const a = document.createElement('a');
    a.download = `qr-${S.itemName || 'auction'}.png`;
    a.href = cv.toDataURL(); a.click();
    showToast('⬇ QR 已儲存', 'success');
  } else if (im) {
    const a = document.createElement('a');
    a.download = 'qr.png'; a.href = im.src; a.click();
    showToast('⬇ QR 已儲存', 'success');
  }
});

// ─────────────────────────────────────────────────────────
//  SHARE
// ─────────────────────────────────────────────────────────
async function doShare() {
  const url = aShareUrl.value || location.href;
  const data = {
    title: `${S.studioName} — ${S.itemName}`,
    text: `快來競標：${S.itemName} · 目前最高 ${fmt(S.currentBid)}`,
    url,
  };
  if (navigator.share) {
    try { await navigator.share(data); return; }
    catch(e) { if (e.name === 'AbortError') return; }
  }
  // fallback copy
  try {
    await navigator.clipboard.writeText(url);
    showToast('📋 連結已複製！', 'success');
  } catch {
    aShareUrl.select(); document.execCommand('copy');
    showToast('📋 已複製', 'success');
  }
}

btnCopyUrl.addEventListener('click', async () => {
  const url = aShareUrl.value;
  if (!url) { showToast('尚未發布', 'warning'); return; }
  try {
    await navigator.clipboard.writeText(url);
    showToast('📋 連結已複製！', 'success');
  } catch {
    aShareUrl.select(); document.execCommand('copy');
    showToast('📋 已複製', 'success');
  }
});

btnShareQr.addEventListener('click', doShare);
btnShareNav.addEventListener('click', doShare);

// ─────────────────────────────────────────────────────────
//  PERIODIC REFRESH (relative times)
// ─────────────────────────────────────────────────────────
setInterval(() => {
  if (S.auctionLive && S.topBidTime) {
    aBidTime.textContent = relTime(S.topBidTime);
    renderHistory();
  }
}, 30000);

// ─────────────────────────────────────────────────────────
//  RESPONSIVE VIDEO PLACEMENT
// ─────────────────────────────────────────────────────────
let _lastMobile = window.innerWidth < 768;
window.addEventListener('resize', () => {
  const mobile = window.innerWidth < 768;
  if (mobile !== _lastMobile) {
    _lastMobile = mobile;
    if (el('page-auction').classList.contains('active')) renderAuction();
  }
});

// ─────────────────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────────────────
(async function init() {

  // 1. Auto-init Firebase (runs regardless of page mode)
  FirebaseModule.autoInit();

  // 2. Wire Firebase Setup Modal events
  FirebaseModule.wireSetupModal();

  const p = new URLSearchParams(location.search);
  const cloudId = p.get('id');           // Cloud Auction ID (new format)
  const legacyAuction = p.get('auction'); // Legacy local mode

  // ── BUYER MODE: Load cloud auction by ?id= ────────────
  if (cloudId) {
    // Step 1: 立刻隱藏 admin 頁面，切至 auction 並顯示載入遮罩
    const adminEl = el('page-admin');
    if (adminEl) { adminEl.classList.remove('active'); adminEl.style.display = 'none'; }

    switchPage('auction');
    showBuyerLoading(true);   // 顯示 "☁️ 正在連線至雲端拍賣…" 遮罩

    // Step 2: 確保 Firebase 已連線（最多等 1.5s）
    if (!FirebaseModule.isReady()) {
      await new Promise(r => setTimeout(r, 1500));
    }

    if (!FirebaseModule.isReady()) {
      // 連線失敗：在 auction 頁面內顯示錯誤，不跳回 admin
      showBuyerLoading(false);
      const dashboard = el('page-auction')?.querySelector('.auction-dashboard');
      if (dashboard) {
        dashboard.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:80px 24px;">
            <div style="font-size:3rem;margin-bottom:16px;">☁️</div>
            <h2 style="font-size:1.2rem;font-weight:800;margin-bottom:8px;color:var(--c-text-1)">
              無法連線至雲端資料庫
            </h2>
            <p style="color:var(--c-text-2);font-size:.88rem;line-height:1.7;max-width:340px;margin:0 auto 24px;">
              請確認 Firebase 設定已完成，或聯繫主辦方取得正確連結。<br>
              Auction ID：<code style="color:var(--c-purple-1)">${cloudId}</code>
            </p>
            <button class="tbtn tbtn-ghost" onclick="location.href=location.pathname">
              ⟵ 返回首頁
            </button>
          </div>`;
      }
      showToast('⚠️ 無法連線至雲端，請確認 Firebase 設定', 'error', 8000);
      return;
    }

    // Step 3: 從 Firebase 載入拍賣資料
    const data = await FirebaseModule.loadAuction(cloudId);
    if (!data) {
      showBuyerLoading(false);
      const dashboard = el('page-auction')?.querySelector('.auction-dashboard');
      if (dashboard) {
        dashboard.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:80px 24px;">
            <div style="font-size:3rem;margin-bottom:16px;">🔍</div>
            <h2 style="font-size:1.2rem;font-weight:800;margin-bottom:8px;color:var(--c-text-1)">
              找不到此拍賣
            </h2>
            <p style="color:var(--c-text-2);font-size:.88rem;line-height:1.7;max-width:340px;margin:0 auto 24px;">
              拍賣 ID 無效、已結束或已被主辦方刪除。<br>
              <code style="color:var(--c-purple-1)">${cloudId}</code>
            </p>
            <button class="tbtn tbtn-ghost" onclick="location.href=location.pathname">
              ⟵ 返回首頁
            </button>
          </div>`;
      }
      showToast('❌ 找不到拍賣 ID: ' + cloudId, 'error', 8000);
      return;
    }

    // Step 4: 填入 S 狀態物件
    S.auctionId   = cloudId;
    S.studioName  = data.studioName  || '';
    S.logoUrl     = data.logoUrl     || '';
    S.itemName    = data.itemName    || '拍賣商品';
    S.itemSubtitle= data.itemSubtitle|| '';
    S.itemDesc    = data.itemDesc    || '';
    S.itemQty     = data.itemQty     || 1;
    S.videoUrl    = data.videoUrl    || '';
    S.startPrice  = data.startPrice  || 0;
    S.increment   = data.increment   || 50;
    S.pickups     = Array.isArray(data.pickups) ? data.pickups : [];
    S.customTerms = data.customTerms || '';
    S.timerMode   = data.timerMode   || 'fixed';
    S.antiSnipe   = !!data.antiSnipe;
    S.bufferMins  = data.bufferMins  || 3;
    S.extendMins  = data.extendMins  || 3;
    S.currentBid  = data.currentBid  || data.startPrice || 0;
    S.topBidder   = data.topBidder   || '';
    S.topBidTime  = data.topBidTime  || null;
    S.bidHistory  = Array.isArray(data.bidHistory) ? data.bidHistory : [];
    S.auctionLive = !data.auctionDone;
    S.auctionDone = !!data.auctionDone;
    S.totalSecs   = data.totalSecs   || 86400;
    S.shareUrl    = location.href;

    if (Array.isArray(data.imageList) && data.imageList.length) {
      S.images = data.imageList;
    }
    if (data.endAt) {
      S.endTime = new Date(data.endAt);
    }

    // Step 5: 渲染頁面，渲染完成後才移除 loading 遮罩
    renderAuction();

    // 等一個 rAF 確保 DOM 已繪製再移除 loading
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        showBuyerLoading(false);  // 移除遮罩，展示完整已渲染頁面
        generateQR();
        if (S.auctionLive && S.endTime) startTimer();

        // 顯示 Firebase 狀態列
        const fbBar = el('fb-status-bar');
        if (fbBar) fbBar.style.display = 'flex';

        showToast(`📲 已連線至拍賣：${S.itemName}`, 'success', 4000);
        if (data.auctionDone) endAuction();
      });
    });

    return; // Done — buyer mode
  }

  // ── LEGACY: ?auction=1 local share URL ────────────────
  if (legacyAuction === '1') {
    S.itemName   = p.get('title')  || '拍賣商品';
    S.studioName = p.get('studio') || '建生工坊';
    S.shareUrl   = location.href;
    renderAuction();
    generateQR();
    switchPage('auction');
    showToast('📲 歡迎！請聯繫主辦方取得更多資訊。', 'info', 5000);
    return;
  }

  // ── ADMIN MODE ─────────────────────────────────────────
  S.shareUrl = buildShareUrl();
  aShareUrl.value = S.shareUrl;
  switchPage('admin');
})();


