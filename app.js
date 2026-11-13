/* ============================================================
   建生工坊線上拍賣系統  ·  app.js (核心腳本)
   架構：多商品同時競標 + 多國貨幣切換 + 嚴格出價與電話防偽 + 手機優先設計
   規範：一律使用「腳本」二字進行開發與維護
   ============================================================ */
'use strict';

/* ─────────────────────────────────────────────────────────────
   1. 常數與匯率資料表 (Currency Rates & Formats)
   ───────────────────────────────────────────────────────────── */
const CURRENCY_RATES = {
  TWD: { rate: 1,      symbol: 'NT$ ', name: '新台幣',  digits: 0 },
  USD: { rate: 0.031,  symbol: '$ ',   name: '美金',    digits: 2 },
  JPY: { rate: 4.75,   symbol: '¥ ',   name: '日圓',    digits: 0 },
  VND: { rate: 800,    symbol: '₫ ',   name: '越南盾',  digits: 0 },
  IDR: { rate: 510,    symbol: 'Rp ',  name: '印尼盾',  digits: 0 },
  THB: { rate: 1.12,   symbol: '฿ ',   name: '泰銖',    digits: 0 }
};

/* 預設多商品初始資料 (真實拍賣商品：Acer Aspire 7 電競筆電) */
const DEFAULT_ITEMS = [
  {
    id: 'item-1',
    name: '高雄 小港區 桂林 - 2手 Acer 宏碁 Aspire 7 A715-71G 電競筆記型電腦 15.6吋 i5-7300HQ GTX 1050 獨立顯示卡 8成新 出售 - 自取自搬 - 透天1～3樓',
    subtitle: '15.6吋 Full HD・i5-7300HQ・GTX 1050 獨顯・8成新',
    desc: `💻 規格與重點配置
‧ 品牌型號：Acer (宏碁) Aspire 7 A715-71G-54UE
‧ 處理器：Intel (英特爾) Core i5-7300HQ（4核4緒，最高 3.5GHz）
‧ 獨立顯示卡：NVIDIA (輝達) GeForce GTX 1050 2GB GDDR5（Samsung 三星顯存）
‧ 記憶體：DDR4 記憶體
‧ 儲存空間：
  - M.2 NVMe SSD 固態硬碟
  - TOSHIBA (東芝) 1TB HDD 機械硬碟
‧ 螢幕尺寸：15.6 吋 Full HD (1920x1080)
‧ 音效支援：Dolby (杜比) Audio Premium / Acer TrueHarmony

商品概述
這台機器已經清潔與整備完畢，目前運行非常流暢穩定。大螢幕不論是拿來當成桌機替代機、日常看影片、辦公寫程式都超級過癮

📊 效能實測狀況
‧ 鍵盤測試：全機鍵盤按鍵（含數字小鍵盤）測試運作皆正常。
‧ CPU-Z 跑分：單核 272.5 / 多核 1026.5
‧ Cinebench R15 跑分：CPU 372 cb / OpenGL 69.49 fps
‧ CrystalDiskMark 讀寫：SSD 實測連續讀取 2484.33 MB/s、寫入 1759.85 MB/s
‧ 系統主板：系統與主機板、獨立顯示卡運作均正常良好。

⚠️ 測試與機況補充（請務必詳閱）
1. 功能測試說明：全機已完成鍵盤、CPU-Z 跑分、Cinebench R15 及獨立顯示卡測試，系統與主板運作皆正常。
2. 聲音系統狀況：內建喇叭已損壞無聲，需買零件自行更換，或接外接喇叭/耳機使用。
3. 電池與電源狀況：電池已老化不蓄電。原廠充電頭因接頭接觸不良燈不亮，需搭配「較長接頭/轉接頭」才能通電開機。
4. 配件說明：本商品為單機零件機出清，【不含充電器、不含轉接頭】，請買家自備變壓器與長頭轉接線。
5. 適合對象：適合具備電腦 DIY 拆裝能力、會自行安裝 SSD/重灌系統/更換喇叭的買家，或作為固定地點外接喇叭使用的代步機/零件機。
【零件機出清】Acer (宏碁) Aspire 7 A715-71G 15.6吋筆電（i5-7300HQ / GTX 1050 獨立顯示卡 / FHD 1080P）`,
    images: [],
    videoUrl: 'https://youtu.be/YJJEP2dyl4M',
    sellerName: '建生工坊',
    sellerLogo: 'icon-192.png',
    startPrice: 10000,
    increment: 10,
    currentPrice: 10000,
    currentBid: 10000,
    topBidder: '',
    topBidderContact: null,
    topBidTime: null,
    bids: {},
    bidHistory: [],
    endTime: Date.now() + 24 * 3600 * 1000,
    status: 'live',
    timeMode: 'reset24',
    autoRelistIfNoBids: true,
    antiSnipeEnable: true,
    antiSnipeEnabled: true,
    antiSnipeMins: 3,
    antiSnipeExt: 3,
    antiSnipeExtMins: 3,
    pickupDeadlineHours: 72,
    pickupDeadline: null,
    pickupOptions: { self: true, delivery: false, cvs: false },
    pickupCustom: '自取自搬・透天1～3樓',
    extraNotes: '其他備註：\n\n (取貨時請自備保護措施及包裝袋。)\n\n（親膚商品皆會用酒精清潔或WD-40噴油保養）。\n\n\n（因為PO網拍賣，多少有歲月使用痕跡，高標準吹毛求疵者請勿競標，售後不接受以不喜歡或非商品故障因素要求退貨，買賣雙方請互相體諒與尊重，謝謝合作）。',
    warrantyDays: 3,
    warrantyText: '原件現況出售',
    qa: {},
    winnerMsgs: []
  }
];

/* ─────────────────────────────────────────────────────────────
   2. 全局應用狀態 (App State)
   ───────────────────────────────────────────────────────────── */
const UNIFIED_AUCTION_ID = 'item-local-recovered';

// 👑 最高權限管理者帳號與密碼驗證常數
const SUPER_ADMIN_ACCOUNT = 'guess_chen1981';
const SUPER_ADMIN_PASS = 'dr_chen_1981cs701203';
const ADMIN_AUTH_STORAGE_KEY = 'agy_super_admin_auth';
const ADMIN_AUTH_SESSION_KEY = 'agy_super_admin_session';
const ADMIN_TOKEN_VAL = 'verified_guess_chen1981_v1';

const AppState = {
  studioName: '建生工坊',
  baseCurrency: 'TWD',
  activeCurrency: 'TWD',
  activeItemId: 'item-local-recovered',
  items: JSON.parse(JSON.stringify(DEFAULT_ITEMS)),
  broadcasts: [],
  auctionId: UNIFIED_AUCTION_ID,
  isAdmin: false,
  isAdminAuthenticated: false,
  viewMode: 'mobile',            // 觀看模式：'mobile' (手機觀看模式) | 'desktop' (電腦觀看模式)
  pendingAdminAction: null,
  isTabsManuallyExpanded: false, // 標記使用者是否已點擊展開全部商品
  userProfile: {
    name: '',
    phone: '',
    line: '',
    ig: '',
    fb: '',
    retentionDays: 7,
    retentionExpiresAt: null
  },
  prevTopBidders: {}, // 記錄每個品項的前任最高出價者，用於出價超越警示
  galleryIndex: 0,
  currentEditImages: [], // 編輯中的圖片陣列 (支援拖曳上傳預覽)
  registeredBuyers: [], // 雲端即時同步之買家註冊名冊
  blacklist: {},        // 棄標封鎖黑名單 (key: 純數字手機號碼)
  activeBackupTemplate: 'discount', // 後台遞補邀請話術當前選用範本
  customCannedReplies: [], // 賣家自訂罐頭快答詞庫 (雲端同步)
  qaSelectedCannedMap: {}, // 各提問面板目前已勾選之快答 ID 清單 (支援智慧多選組合)
  qaLastComposedMap: {},   // 各提問面板前一次智慧組合產生的句子 (用於取消勾選時保留手動文字)
  qaDraftTextMap: {},      // 保留各展開回覆盒內正在輸入的草稿內容
  qaHeightMode: null,      // 'compact' | 'tall' | 'infinite' | 'custom'
  qaHeightModeManual: false, // 使用者是否曾手動切換或拖曳鎖定過高度
  qaCustomHeight: 420,     // 底部拖曳鎖定之自訂高度 (px)
  qaExpandAllGroups: false, // 是否一鍵展開所有買家歷史摺疊夾
  manuallyCollapsedAdminReplyMap: {}, // 管理員手動收合之待回覆提問紀錄（尊重手動收合）
  manuallyCollapsedBuyerGroupMap: {}  // 手動收合之買家歷史摺疊夾紀錄
};

// === 捲軸記憶與抗跳動保護模組 ===
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

let scrollSaveTimer = null;
window.addEventListener('scroll', () => {
  if (scrollSaveTimer) clearTimeout(scrollSaveTimer);
  scrollSaveTimer = setTimeout(() => {
    try {
      sessionStorage.setItem('auction_scroll_y', String(window.scrollY));
      sessionStorage.setItem('auction_active_item', AppState.activeItemId || '');
      const isViewingAdmin = document.getElementById('page-admin')?.classList.contains('active');
      sessionStorage.setItem('auction_active_page', (AppState.isAdmin && isViewingAdmin) ? 'admin' : 'auction');
    } catch (e) {}
  }, 100);
}, { passive: true });

window.addEventListener('beforeunload', () => {
  try {
    sessionStorage.setItem('auction_scroll_y', String(window.scrollY));
    const isViewingAdmin = document.getElementById('page-admin')?.classList.contains('active');
    sessionStorage.setItem('auction_active_page', (AppState.isAdmin && isViewingAdmin) ? 'admin' : 'auction');
  } catch (e) {}
});

function restoreScrollPosition() {
  try {
    const savedY = sessionStorage.getItem('auction_scroll_y');
    if (savedY !== null && !isNaN(Number(savedY))) {
      const targetY = Number(savedY);
      requestAnimationFrame(() => {
        window.scrollTo({ top: targetY, behavior: 'instant' });
      });
      setTimeout(() => {
        window.scrollTo({ top: targetY, behavior: 'instant' });
      }, 60);
      setTimeout(() => {
        window.scrollTo({ top: targetY, behavior: 'instant' });
      }, 250);
    }
  } catch (e) {}
}

// 伺服器回報之區域網路 IP (局域網網址，保證手機掃描 QR Code 正常連線)
let serverLanUrl = 'http://192.168.1.110:8080';
// 初始資料載入完成旗標（防「先存後讀」覆蓋漏洞）
let isInitialDataLoaded = false;

/* ─────────────────────────────────────────────────────────────
   3. 輔助函式 (Helper Utilities)
   ───────────────────────────────────────────────────────────── */
function el(id) { return document.getElementById(id); }

/**
 * 安全 LocalStorage 存取封裝 (防無痕模式崩潰與序列化異常)
 */
/** 判斷保留期限設定值是否為「∞ 永久保留」 */
function isPermanentRetention(val) {
  return val === 'forever' || val === 0 || val === '0' || val === -1 || val === Infinity || val === true;
}

const SafeStorage = {
  get(key, fallback = null) {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) {
        try {
          return JSON.parse(val);
        } catch (_) {
          return val;
        }
      }
    } catch (e) {
      console.warn('localStorage get blocked:', e);
    }
    // 若 localStorage 無資料且讀取買家設定或管理員驗證，自動由 Cookie 備援還原
    if ((key === 'agy_buyer_profile' || key === 'agy_super_admin_auth') && typeof document !== 'undefined' && document.cookie) {
      try {
        const match = document.cookie.split('; ').find(row => row.startsWith(key + '='));
        if (match) {
          const decoded = decodeURIComponent(match.split('=')[1]);
          try {
            return JSON.parse(decoded);
          } catch (_) {
            return decoded;
          }
        }
      } catch (_) {}
    }
    return fallback;
  },
  set(key, value) {
    let ok = false;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      ok = true;
    } catch (e) {
      console.warn('localStorage set blocked:', e);
    }
    // 針對買家身分資料與管理員登入狀態同步寫入 Cookie（永久保留設定 10 年效期）
    if (key === 'agy_buyer_profile' && value && typeof value === 'object' && typeof document !== 'undefined') {
      try {
        const isPerm = isPermanentRetention(value.retentionDays) || value.isPermanent;
        const maxAge = isPerm ? 315360000 : (Number(value.retentionDays || 7) * 86400);
        document.cookie = `agy_buyer_profile=${encodeURIComponent(JSON.stringify(value))}; path=/; max-age=${maxAge}; SameSite=Lax`;
      } catch (_) {}
    } else if (key === 'agy_super_admin_auth' && value && typeof document !== 'undefined') {
      try {
        document.cookie = `agy_super_admin_auth=${encodeURIComponent(JSON.stringify(value))}; path=/; max-age=315360000; SameSite=Lax`;
      } catch (_) {}
    }
    return ok;
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
    if ((key === 'agy_buyer_profile' || key === 'agy_super_admin_auth') && typeof document !== 'undefined') {
      try {
        document.cookie = `${key}=; path=/; max-age=0; SameSite=Lax`;
      } catch (_) {}
    }
  }
};

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** 貨幣金額格式化換算 (核心功能 2) */
function formatMoney(amountInTWD, targetCurrency) {
  const curKey = targetCurrency || AppState.activeCurrency || 'TWD';
  const meta = CURRENCY_RATES[curKey] || CURRENCY_RATES.TWD;
  const converted = Math.round(Number(amountInTWD || 0) * meta.rate);
  const formattedNum = converted.toLocaleString('zh-TW', {
    minimumFractionDigits: meta.digits,
    maximumFractionDigits: meta.digits
  });
  return meta.symbol + formattedNum;
}

/** 相對時間計算 */
function formatRelTime(timestamp) {
  if (!timestamp) return '';
  const now = (typeof getServerNow === 'function') ? getServerNow() : Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);
  if (diffSec < 60) return `${diffSec} 秒前`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} 分鐘前`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} 小時前`;
  return `${Math.floor(diffSec / 86400)} 天前`;
}

/** 買家暱稱遮罩保護 (非管理員檢視) */
function maskBuyerName(name) {
  if (name && typeof name === 'object') name = name.name;
  if (!name) return '匿名買家';
  if (AppState.isAdmin) return String(name);
  const s = String(name);
  if (s.length <= 2) return s[0] + '*';
  return s[0] + '***' + s[s.length - 1];
}

function getBidderName(val) {
  if (!val) return '';
  if (typeof val === 'object') return val.name || '';
  return String(val);
}

/** 顯示 Toast 浮動提示條 */
let _toastTimer = null;
function showToast(msg, ms = 3200) {
  const t = el('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

/**
 * 圖片資料安全提取與相容解析 (相容多圖陣列、舊版單圖、imageList、imageUrls、imgUrl 等)
 */
function extractImagesFromRaw(obj) {
  const list = [];
  if (!obj) return list;

  function addImg(val) {
    if (!val) return;
    if (typeof val === 'string') {
      const clean = val.trim();
      if (clean && !list.includes(clean)) list.push(clean);
    } else if (typeof val === 'object') {
      const s = val.src || val.url || val.imageUrl || val.link;
      if (typeof s === 'string' && s.trim() && !list.includes(s.trim())) {
        list.push(s.trim());
      }
    }
  }

  if (Array.isArray(obj.images)) obj.images.forEach(addImg);
  if (Array.isArray(obj.imageList)) obj.imageList.forEach(addImg);
  if (Array.isArray(obj.imageUrls)) obj.imageUrls.forEach(addImg);
  else if (typeof obj.imageUrls === 'string') {
    obj.imageUrls.split(/[\n,]/).forEach(addImg);
  }
  if (obj.imgUrl) addImg(obj.imgUrl);
  if (obj.img) addImg(obj.img);
  if (obj.pic) addImg(obj.pic);
  if (obj.logoSrc && typeof obj.logoSrc === 'string' && !obj.logoSrc.startsWith('data:')) {
    addImg(obj.logoSrc);
  }

  return list;
}

/**
 * 商品資料結構向下相容與正規化處理 (Data Migration & Normalization)
 * 嚴密防護舊版與各版本欄位差異，防止預設資料覆蓋使用者原始珍貴設定
 */
function normalizeItem(raw, fallbackId) {
  if (!raw || typeof raw !== 'object') {
    return {
      id: fallbackId || ('item-' + Date.now()),
      name: '拍賣商品',
      subtitle: '',
      desc: '',
      images: ['icon-512.png'],
      videoUrl: '',
      startPrice: 100,
      increment: 10,
      currentBid: 100,
      topBidder: '',
      topBidderContact: null,
      topBidTime: null,
      bidHistory: [],
      endTime: Date.now() + 86400000,
      status: 'active',
      sellerName: '建生工坊',
      sellerLogo: 'icon-192.png',
      timeMode: 'fixed',
      antiSnipeEnabled: true,
      antiSnipeMins: 3,
      antiSnipeExtMins: 3,
      pickupDeadlineHours: 48,
      pickupDeadline: null,
      qa: {},
      winnerMsgs: []
    };
  }

  // 0. 賣家/店家/企業名稱與 Logo 商標
  const sellerName = raw.sellerName || raw.storeName || '建生工坊';
  const sellerLogo = raw.sellerLogo || raw.storeLogo || 'icon-192.png';

  // 1. 商品名稱 (支援 name, itemName, title)
  const name = raw.name || raw.itemName || raw.title || raw.itemTitle || '拍賣商品';

  // 2. 副標題與特色
  const subtitle = raw.subtitle || raw.itemSubtitle || '';

  // 3. 詳細說明
  const desc = raw.desc || raw.itemDesc || raw.description || '';

  // 4. 多圖片整合提取
  let images = extractImagesFromRaw(raw);
  if (!images.length) {
    images = ['icon-512.png'];
  }

  // 5. 影片連結 (YouTube / TikTok / IG / Threads / FB / MP4)
  const videoUrl = raw.videoUrl || raw.videoLink || raw.video || raw.embedUrl || raw.youtubeUrl || '';

  // 6. 價格設定
  const startPrice = Number(raw.startPrice ?? raw.price ?? 100);
  const increment = Number(raw.increment ?? 10);
  const currentPrice = Number(raw.currentPrice ?? raw.currentBid ?? raw.startPrice ?? startPrice);
  const currentBid = currentPrice;

  // 7. 出價歷史紀錄
  let bidHistory = [];
  if (Array.isArray(raw.bidHistory)) {
    bidHistory = raw.bidHistory;
  } else if (raw.bidHistory && typeof raw.bidHistory === 'object') {
    bidHistory = Object.values(raw.bidHistory);
  } else if (raw.bids && typeof raw.bids === 'object') {
    bidHistory = Object.values(raw.bids).map(b => ({
      user: b.bidderName || b.user || '買家',
      amount: b.amount,
      time: b.timestamp || b.time || Date.now(),
      phoneMasked: b.bidderPhoneMasked
    })).sort((a, b) => b.amount - a.amount);
  }
  const bids = (raw.bids && typeof raw.bids === 'object') ? raw.bids : {};

  // 8. 結標時間與狀態判斷
  const nowServer = (typeof getServerNow === 'function') ? getServerNow() : Date.now();
  let endTime = Number(raw.endTime || raw.endAt || raw.endTimestamp) || (nowServer + 86400000);
  let status = (raw.status === 'live' || raw.status === 'active') ? 'live' : raw.status;
  if (!status) {
    if (raw.auctionDone === true || (endTime <= nowServer && raw.auctionLive === false)) {
      status = 'ended';
    } else {
      status = 'live';
    }
  }

  // 9. 取貨期限、取貨管道與自訂說明 (核心功能復原)
  const pickupDeadlineHours = Number(raw.pickupDeadlineHours || (raw.warrantyDays ? raw.warrantyDays * 24 : 48));
  const pickupOptions = (raw.pickupOptions && typeof raw.pickupOptions === 'object')
    ? {
        self: raw.pickupOptions.self !== false,
        delivery: !!raw.pickupOptions.delivery,
        cvs: !!raw.pickupOptions.cvs
      }
    : { self: true, delivery: false, cvs: false };
  const pickupCustom = raw.pickupCustom || raw.pickupInfo || raw.pickupText || '';

  // 10. 額外備註欄 (Extra Notes / Remarks)
  const extraNotes = raw.extraNotes || raw.notes || raw.remarks || raw.customTerms || '';

  // 11. 保固說明 (Warranty)
  const warrantyDays = Number(raw.warrantyDays ?? (raw.warranty ? parseInt(raw.warranty, 10) : 0)) || 0;
  const warrantyText = raw.warrantyText || raw.warranty || '原件現況出售';

  // 12. 問答與專屬私訊留言板
  const qa = (raw.qa && typeof raw.qa === 'object') ? raw.qa : ((raw.questions && typeof raw.questions === 'object') ? raw.questions : {});
  let winnerMsgs = [];
  if (Array.isArray(raw.winnerMsgs)) {
    winnerMsgs = raw.winnerMsgs;
  } else if (raw.winnerMsgs && typeof raw.winnerMsgs === 'object') {
    winnerMsgs = Object.values(raw.winnerMsgs);
  }

  return {
    id: String(raw.id || raw.itemId || fallbackId || ('item-' + Date.now())),
    name: name,
    sellerName: sellerName,
    sellerLogo: sellerLogo,
    subtitle: subtitle,
    desc: desc,
    images: images,
    videoUrl: videoUrl,
    startPrice: startPrice,
    increment: increment,
    currentPrice: currentPrice,
    currentBid: currentBid,
    bids: bids,
    topBidder: raw.topBidder || '',
    topBidderContact: raw.topBidderContact || null,
    topBidTime: raw.topBidTime || null,
    bidHistory: bidHistory,
    endTime: endTime,
    status: status,
    timeMode: raw.timeMode === 'reset24' ? 'reset24' : 'fixed',
    autoRelistIfNoBids: raw.autoRelistIfNoBids !== false,
    endedEarly: Boolean(raw.endedEarly),
    manualEnd: Boolean(raw.manualEnd),
    isEnded: Boolean(raw.isEnded),
    relistSeq: Number(raw.relistSeq || 0),
    reopenedAt: raw.reopenedAt ? Number(raw.reopenedAt) : null,
    pickedUpAt: raw.pickedUpAt ? Number(raw.pickedUpAt) : null,
    backupState: raw.backupState || null,
    antiSnipeEnable: raw.antiSnipeEnable !== false && raw.antiSnipeEnabled !== false,
    antiSnipeEnabled: raw.antiSnipeEnable !== false && raw.antiSnipeEnabled !== false,
    antiSnipeMins: Number(raw.antiSnipeMins || 3),
    antiSnipeExt: Number(raw.antiSnipeExt || raw.antiSnipeExtMins || 3),
    antiSnipeExtMins: Number(raw.antiSnipeExt || raw.antiSnipeExtMins || 3),
    pickupDeadlineHours: pickupDeadlineHours,
    pickupDeadline: raw.pickupDeadline || null,
    pickupDeadlineMode: raw.pickupDeadlineMode || 'hours',
    pickupDeadlineWeekday: raw.pickupDeadlineWeekday !== undefined ? Number(raw.pickupDeadlineWeekday) : 6,
    pickupDeadlineCustomText: raw.pickupDeadlineCustomText || '',
    pickupOptions: pickupOptions,
    pickupCustom: pickupCustom,
    extraNotes: extraNotes,
    warrantyDays: warrantyDays,
    warrantyText: warrantyText,
    qa: qa,
    winnerMsgs: winnerMsgs,
    backupOffer: (raw.backupOffer && typeof raw.backupOffer === 'object') ? raw.backupOffer : null,
    finalDealPrice: raw.finalDealPrice ? Number(raw.finalDealPrice) : null,
    defaultedBidders: Array.isArray(raw.defaultedBidders) ? raw.defaultedBidders : (raw.defaultedBidders ? Object.values(raw.defaultedBidders) : [])
  };
}

/**
 * 讀取歷史 localStorage 設定進行舊資料還原保護 (相容舊版分區記憶 auctionSect_A/B/C/D)
 * 嚴格過濾並清除舊版系統假古董範例（樟木箱/茶盤/官帽椅），保護使用者真實資料
 */
function restoreSavedLegacyLocalStorage() {
  try {
    const secA = SafeStorage.get('auctionSect_A', null);
    const secB = SafeStorage.get('auctionSect_B', null);
    const secC = SafeStorage.get('auctionSect_C', null);

    const savedStudioName = SafeStorage.get('agy_studio_name') || (secA && secA.studioName);
    if (savedStudioName && !savedStudioName.includes('JianSheng Boutique')) {
      updateStudioName(savedStudioName, false);
    }

    // 檢查若包含舊版假範例商品（樟木箱/茶盤/官帽椅），強制清除
    if (secB && (secB.itemName || secB.itemDesc)) {
      const bName = String(secB.itemName || '');
      if (bName.includes('樟木箱') || bName.includes('茶盤') || bName.includes('官帽椅')) {
        SafeStorage.remove('auctionSect_B');
        SafeStorage.remove('auctionSect_C');
      } else {
        console.log('📦 腳本已自本機快取成功恢復歷史商品設定，保護原有設定不被覆蓋！');
        const recoveredItem = normalizeItem({
          ...secB,
          ...(secC || {})
        }, 'item-local-recovered');
        AppState.items = [recoveredItem];
        AppState.activeItemId = recoveredItem.id;
      }
    }

    const cachedItems = SafeStorage.get('agy_items', null);
    if (Array.isArray(cachedItems) && cachedItems.length > 0) {
      const filtered = cachedItems.filter(it => {
        const n = String(it.name || '');
        return !n.includes('樟木箱') && !n.includes('茶盤') && !n.includes('官帽椅');
      });
      if (filtered.length > 0) {
        AppState.items = filtered;
        AppState.activeItemId = filtered[0].id;
        SafeStorage.set('agy_items', filtered);
      } else {
        SafeStorage.remove('agy_items');
      }
    }
  } catch (e) {
    console.warn('本機舊版設定還原檢測：', e);
  }
}

/* ─────────────────────────────────────────────────────────────
   4. 多平台影音連結解析器 (Multi-Platform Video Embed - 核心功能 3)
   支援 YouTube / TikTok / 抖音 / IG Reels / Threads / FB / 直播影片
   ───────────────────────────────────────────────────────────── */
function parseVideoEmbed(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const url = rawUrl.trim();
  if (!url) return null;

  // 0. 直接 MP4 / WebM / OGG / MOV 本地或遠端影片檔案 (100% 內嵌原生播放，免去第三方協定限制)
  if (/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url) || url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm')) {
    return {
      platform: '🎬 實拍影音',
      html: `<video controls playsinline preload="metadata" style="width:100%;aspect-ratio:16/9;border-radius:12px;background:#000;" src="${escapeHtml(url)}"></video>`
    };
  }

  // 1. YouTube (標準, shorts, youtu.be, embed)
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return {
      platform: 'YouTube',
      html: `<iframe src="https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&modestbranding=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen style="width:100%;aspect-ratio:16/9;border-radius:12px;border:none;"></iframe>`
    };
  }

  // 2. TikTok
  const ttMatch = url.match(/tiktok\.com\/(?:@[^\/]+\/video\/|v\/)(\d+)/i);
  if (ttMatch && ttMatch[1]) {
    return {
      platform: 'TikTok',
      html: `<iframe src="https://www.tiktok.com/embed/v2/${ttMatch[1]}" frameborder="0" allowfullscreen style="width:100%;height:520px;border-radius:12px;border:none;"></iframe>`
    };
  }

  // 3. 抖音 (Douyin)
  const dyMatch = url.match(/douyin\.com\/video\/(\d+)/i);
  if (dyMatch && dyMatch[1]) {
    return {
      platform: '抖音',
      html: `<iframe src="https://www.douyin.com/embed/video/${dyMatch[1]}" frameborder="0" allowfullscreen style="width:100%;height:520px;border-radius:12px;border:none;"></iframe>`
    };
  }

  // 4. Instagram (IG Reels & Posts)
  const igMatch = url.match(/instagram\.com\/(?:reel|p)\/([a-zA-Z0-9_-]+)/i);
  if (igMatch && igMatch[1]) {
    return {
      platform: 'Instagram Reels',
      html: `<iframe src="https://www.instagram.com/reel/${igMatch[1]}/embed/" frameborder="0" scrolling="no" allowtransparency="true" style="width:100%;height:520px;border-radius:12px;border:none;background:#000;"></iframe>`
    };
  }

  // 5. Threads 影片貼文
  const thMatch = url.match(/threads\.(?:net|com)\/(?:@[^\/]+\/post\/)([a-zA-Z0-9_-]+)/i);
  if (thMatch && thMatch[1]) {
    return {
      platform: 'Threads',
      html: `<iframe src="https://www.threads.net/post/${thMatch[1]}/embed" frameborder="0" scrolling="no" allowtransparency="true" style="width:100%;height:480px;border-radius:12px;border:none;"></iframe>`
    };
  }

  // 6. Facebook 影片 / Reels
  if (url.includes('facebook.com') || url.includes('fb.watch')) {
    const encoded = encodeURIComponent(url);
    return {
      platform: 'Facebook 影片',
      html: `<iframe src="https://www.facebook.com/plugins/video.php?href=${encoded}&show_text=false&width=500" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen style="width:100%;aspect-ratio:16/9;min-height:280px;border-radius:12px;border:none;"></iframe>`
    };
  }

  // 7. 直接 MP4 / WebM / OGG 影片檔案 (備用規則)
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)) {
    return {
      platform: '🎬 實拍影音',
      html: `<video src="${escapeHtml(url)}" controls playsinline preload="metadata" style="width:100%;aspect-ratio:16/9;border-radius:12px;background:#000;"></video>`
    };
  }

  // 8. 備用外顯外部連結
  return {
    platform: '外部影音',
    html: `
      <div style="background:rgba(0,0,0,0.4);border:1px solid var(--c-border);padding:18px;border-radius:12px;text-align:center;width:100%;">
        <p style="font-size:.85rem;color:var(--c-text-1);margin-bottom:10px;">🎬 本商品附有實拍影音連結：</p>
        <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="tbtn tbtn-gold tbtn-sm">
          ▶ 開啟觀看實拍影片
        </a>
      </div>
    `
  };
}

/* ─────────────────────────────────────────────────────────────
   5. 嚴格電話號碼驗證與防偽檢驗 (核心功能 3)
   ───────────────────────────────────────────────────────────── */
function validatePhoneNumber(rawPhone, userName) {
  if (!rawPhone) {
    return { valid: false, message: '請輸入聯絡手機號碼！' };
  }
  const clean = String(rawPhone).replace(/[\s\-\(\)]/g, '');

  // 👑 內建三組預設測試買家門號（小建 0931849482、阿豪 0911222333、小美 0922333444）於管理員測試時直接放行
  if (['0931849482', '0911222333', '0922333444'].includes(clean) && AppState.isAdmin && AppState.isAdminAuthenticated) {
    try {
      const boundPhones = SafeStorage.get('agy_registered_users', {}) || {};
      if (userName) {
        boundPhones[clean] = userName.trim();
        SafeStorage.set('agy_registered_users', boundPhones);
      }
    } catch (e) {}
    return { valid: true, phone: clean };
  }

  const isTwPhone = /^09\d{8}$/.test(clean);
  const isIntlPhone = /^\+?\d{9,15}$/.test(clean);

  if (!isTwPhone && !isIntlPhone) {
    return {
      valid: false,
      message: '手機號碼格式不正確！台灣手機號碼需為 09 開頭的 10 位數字。'
    };
  }

  // 檢測全重複數字
  if (/^09(\d)\1{7}$/.test(clean)) {
    return {
      valid: false,
      message: '❌ 檢測到重複異常手機號碼，腳本已攔截並阻止出價。請填寫真實聯絡手機！'
    };
  }

  // 虛假號碼黑名單
  const blacklist = [
    '0931000000',
    '0912345678',
    '0987654321',
    '0900123456',
    '0900000001',
    '0912000000',
    '0920000000',
    '0930000000'
  ];
  if (blacklist.includes(clean) || /^09\d{2}000000$/.test(clean)) {
    return {
      valid: false,
      message: '❌ 檢測到異常或重複虛假電話號碼，腳本已攔截並阻止出價。請填寫真實有效之聯絡手機！'
    };
  }

  // 重複帳號衝突檢驗（最高權限管理者進行多組測試買家分身切換時享有豁免特權）
  try {
    const isSuperAdmin = !!(AppState.isAdmin && AppState.isAdminAuthenticated);
    const boundPhones = SafeStorage.get('agy_registered_users', {}) || {};
    if (!isSuperAdmin && boundPhones[clean] && userName && boundPhones[clean] !== userName.trim()) {
      return {
        valid: false,
        message: `⚠️ 該電話已綁定買家帳號「${boundPhones[clean]}」，為防身分冒用，腳本已拒絕本次出價。`
      };
    }
    if (userName) {
      boundPhones[clean] = userName.trim();
      SafeStorage.set('agy_registered_users', boundPhones);
    }
  } catch (e) {}

  // 檢查是否已被列入棄標封鎖黑名單
  if (typeof isBuyerBlacklisted === 'function' && isBuyerBlacklisted(clean)) {
    return {
      valid: false,
      message: '🚫 此聯絡電話因歷史棄標紀錄已被系統列入封鎖黑名單，腳本已攔截並禁止參與競標！'
    };
  }

  return { valid: true, phone: clean };
}

/* ─────────────────────────────────────────────────────────────
   5.5 動態店鋪名稱核心管理 (Dynamic Store Name Management)
   ───────────────────────────────────────────────────────────── */

/**
 * 全域動態更新店鋪名稱（同步導覽列、分頁 Title、後台標題、輸入框與 Firebase）
 */

/* ─────────────────────────────────────────────────────────────
   5.8 📱 手機觀看模式 / 💻 電腦觀看模式 智慧偵測與自由切換腳本
   ───────────────────────────────────────────────────────────── */
const VIEW_MODE_STORAGE_KEY = 'agy_view_mode';
const VIEW_MODE_EXPLICIT_KEY = 'agy_view_mode_explicit_v2';

/**
 * 智慧判斷初始觀看模式：
 * 1. 若網址參數帶有 ?view=mobile 或 ?view=desktop 優先採用
 * 2. 若使用者曾點擊「💻 電腦模式 / 📱 手機模式」並存入 localStorage，自動維持上次習慣的觀看模式
 * 3. 否則在寬螢幕 (寬度 >= 860px) 下自動啟用「💻 電腦模式（黃金雙欄儀表板）」，手機螢幕預設「📱 手機模式」
 */
function detectInitialViewMode() {
  try {
    const params = new URLSearchParams(window.location.search);
    const urlView = params.get('view');
    if (urlView === 'mobile' || urlView === 'desktop') {
      return urlView;
    }
    const explicitMode = SafeStorage.get(VIEW_MODE_EXPLICIT_KEY);
    if (explicitMode === 'mobile' || explicitMode === 'desktop') {
      return explicitMode;
    }
  } catch (e) {}
  return (window.innerWidth >= 860) ? 'desktop' : 'mobile';
}

/**
 * 套用指定的觀看模式 ('mobile' | 'desktop')
 * @param {'mobile'|'desktop'} mode 目標觀看模式
 * @param {boolean} savePreference 是否寫入 localStorage 記憶使用者選擇
 */
function applyViewMode(mode, savePreference = true) {
  const targetMode = (mode === 'desktop') ? 'desktop' : 'mobile';
  AppState.viewMode = targetMode;

  document.body.classList.toggle('view-mode-desktop', targetMode === 'desktop');
  document.body.classList.toggle('view-mode-mobile', targetMode === 'mobile');

  const container = el('auction-container');
  const emptyState = el('auction-empty-state');
  if (container && (!emptyState || emptyState.style.display === 'none')) {
    container.style.display = (targetMode === 'desktop') ? 'grid' : 'flex';
  }

  if (savePreference) {
    SafeStorage.set(VIEW_MODE_STORAGE_KEY, targetMode);
    SafeStorage.set(VIEW_MODE_EXPLICIT_KEY, targetMode);
  }

  // 動態調度出價控制列 (#mobile-bid-bar) 位置：
  // 電腦模式下直接嵌入右欄 #bid-current-card 下方；手機模式下固定於 #page-auction 底部懸浮
  const bidBar = el('mobile-bid-bar');
  const bidCurrentCard = el('bid-current-card');
  const colSide = el('auction-col-side');
  const pageAuction = el('page-auction');

  if (bidBar) {
    if (targetMode === 'desktop' && colSide && bidCurrentCard) {
      if (bidCurrentCard.nextSibling !== bidBar) {
        colSide.insertBefore(bidBar, bidCurrentCard.nextSibling);
      }
    } else if (targetMode === 'mobile' && pageAuction) {
      if (bidBar.parentElement !== pageAuction) {
        pageAuction.appendChild(bidBar);
      }
    }
  }

  // 更新頂端導覽列「💻 電腦模式 / 📱 手機模式」雙按鈕膠囊高亮狀態
  const btnDesktop = el('btn-view-desktop');
  const btnMobile = el('btn-view-mobile');
  if (btnDesktop) btnDesktop.classList.toggle('active', targetMode === 'desktop');
  if (btnMobile) btnMobile.classList.toggle('active', targetMode === 'mobile');

  // 更新窄螢幕單鍵切換按鈕（顯示下一個可切換之目標模式，直覺好按）
  const navIcon = el('view-mode-icon');
  const navText = el('view-mode-text');
  const navBtn = el('btn-toggle-view-mode');
  if (navIcon) navIcon.textContent = targetMode === 'desktop' ? '📱' : '💻';
  if (navText) navText.textContent = targetMode === 'desktop' ? '手機模式' : '電腦模式';
  if (navBtn) {
    navBtn.title = targetMode === 'desktop'
      ? '點擊收合為「📱 手機模式」預覽視窗'
      : '點擊展開為「💻 電腦模式」寬螢幕雙欄儀表板';
  }

  // 更新「⋯ 更多功能選單」內的切換項目文字
  const dropIcon = el('dropdown-viewmode-icon');
  const dropText = el('dropdown-viewmode-text');
  if (dropIcon) dropIcon.textContent = targetMode === 'desktop' ? '📱' : '💻';
  if (dropText) {
    dropText.textContent = targetMode === 'desktop'
      ? '切換為手機觀看模式 (單欄預覽)'
      : '切換為電腦觀看模式 (黃金雙欄)';
  }

  // 更新後台頂部切換按鈕文字
  const adminViewBtn = el('btn-admin-view-mode');
  if (adminViewBtn) {
    adminViewBtn.innerHTML = targetMode === 'desktop'
      ? '📱 切換手機觀看模式'
      : '💻 切換電腦觀看模式';
  }

  // 當在電腦寬螢幕 (寬度 >= 600px) 選擇「手機觀看模式」時，顯示頂端手機模擬器狀態列
  const simBanner = el('mobile-sim-banner');
  if (simBanner) {
    const showSim = (targetMode === 'mobile' && window.innerWidth >= 600);
    simBanner.style.display = showSim ? 'flex' : 'none';
  }
}

/**
 * 一鍵切換「📱 手機觀看模式 / 💻 電腦觀看模式」
 */
function toggleViewMode() {
  const nextMode = (AppState.viewMode === 'desktop') ? 'mobile' : 'desktop';
  applyViewMode(nextMode, true);
  if (nextMode === 'desktop') {
    showToast('💻 已切換為「電腦觀看模式」（1380px 黃金雙欄儀表板）');
  } else {
    showToast('📱 已切換為「手機觀看模式」（精緻直式視窗預覽）');
  }
}

function updateStudioName(newName, shouldSync = true) {
  let trimmed = (newName || '').trim();
  if (!trimmed || trimmed === 'JianSheng Boutique') {
    trimmed = '建生工坊';
  }

  AppState.studioName = trimmed;
  SafeStorage.set('agy_studio_name', trimmed);

  // 1. 網頁最頂部的導覽列標題（自動偵測長文字啟動平滑跑馬燈，防止擠出右側功能按鈕）
  const navStudio = el('nav-studio-name');
  if (navStudio) navStudio.textContent = trimmed;
  const navStudioBox = el('nav-studio-name-box');
  if (navStudioBox) {
    navStudioBox.classList.toggle('is-marquee', trimmed.length > 10);
  }

  const brandLink = el('brand-link');
  if (brandLink) brandLink.title = `${trimmed}線上拍賣系統`;

  // 2. 瀏覽器分頁 Title
  const pageTitle = el('page-title');
  if (pageTitle) pageTitle.textContent = `線上拍賣系統｜${trimmed}`;
  document.title = `線上拍賣系統｜${trimmed}`;

  // 3. 後台控制中心標題
  const adminTitle = el('admin-top-title');
  if (adminTitle) adminTitle.textContent = `🔨 ${trimmed}拍賣後台控制中心`;

  // 4. 後台店鋪設定輸入框
  const cfgInput = el('cfg-studio-name');
  if (cfgInput && cfgInput !== document.activeElement && cfgInput.value !== trimmed) {
    cfgInput.value = trimmed;
  }

  // 5. 前台當前商品賣家名稱同步（若商品未自訂特定賣家）
  const curItem = getActiveItem();
  if (curItem && (!curItem.sellerName || curItem.sellerName === '建生工坊')) {
    const sNameEl = el('product-seller-name');
    if (sNameEl) sNameEl.textContent = trimmed;
  }

  // 6. 雲端 Firebase 同步
  if (shouldSync) {
    syncStudioNameToFirebase(trimmed);
  }
}

/**
 * 全域動態更新賣家/店家 Logo 與名片貼圖（同步導覽列、後台店鋪設定、前台商品賣家名片與 Firebase）
 */
function updateStudioLogo(newLogo, shouldSync = true) {
  let logo = (newLogo || '').trim();
  if (!logo) logo = 'icon-192.png';

  AppState.studioLogo = logo;
  SafeStorage.set('agy_studio_logo', logo);

  // 1. 網頁最頂部的導覽列 Logo
  const navLogo = el('nav-logo-img');
  if (navLogo) navLogo.src = logo;

  // 2. 後台店鋪設定 Logo 輸入框與縮圖預覽
  const shopLogoImg = el('shop-logo-preview-img');
  if (shopLogoImg) shopLogoImg.src = logo;
  const cfgLogoInput = el('cfg-studio-logo');
  if (cfgLogoInput && cfgLogoInput !== document.activeElement && cfgLogoInput.value !== logo) {
    cfgLogoInput.value = logo;
  }

  // 3. 前台當前商品賣家名片 Logo（若該商品使用預設 Logo 則同步切換）
  const curItem = getActiveItem();
  if (curItem && (!curItem.sellerLogo || curItem.sellerLogo === 'icon-192.png')) {
    const prodLogo = el('product-seller-logo');
    if (prodLogo) prodLogo.src = logo;
  }

  // 4. 雲端 Firebase 同步
  if (shouldSync) {
    syncStudioLogoToFirebase(logo);
  }
}

/**
 * 將店鋪名稱儲存至 Firebase 的設定節點 (settings/shop) 與當前拍賣節點
 */
function syncStudioNameToFirebase(name) {
  const db = FirebaseManager.getDb();
  if (!db) return;

  const validName = (name && name !== 'JianSheng Boutique') ? name : '建生工坊';

  db.ref('settings/shop').update({
    studioName: validName,
    updatedAt: Date.now()
  }).catch(e => console.warn('同步店鋪名稱至 settings/shop 失敗:', e));

  if (AppState.auctionId) {
    db.ref('auctions/' + AppState.auctionId).update({
      studioName: validName,
      lastUpdated: Date.now()
    }).catch(e => console.warn('同步店鋪名稱至拍賣節點失敗:', e));
  }
}

/**
 * 將賣家 Logo 儲存至 Firebase 的設定節點 (settings/shop) 與當前拍賣節點
 */
function syncStudioLogoToFirebase(logo) {
  const db = FirebaseManager.getDb();
  if (!db) return;

  const validLogo = logo || 'icon-192.png';

  db.ref('settings/shop').update({
    studioLogo: validLogo,
    updatedAt: Date.now()
  }).catch(e => console.warn('同步店鋪 Logo 至 settings/shop 失敗:', e));

  if (AppState.auctionId) {
    db.ref('auctions/' + AppState.auctionId).update({
      studioLogo: validLogo,
      lastUpdated: Date.now()
    }).catch(e => console.warn('同步店鋪 Logo 至拍賣節點失敗:', e));
  }
}

/* ─────────────────────────────────────────────────────────────
   5.6 賣家 Logo / 企業名片 尺寸拉伸與顯示適配管理
   ───────────────────────────────────────────────────────────── */
const DEFAULT_LOGO_CONFIG = {
  shape: 'circle',     // 'circle' | 'square' | 'card' | 'banner'
  fit: 'contain',      // 'contain' | 'cover' | 'fill'
  size: 26,            // badge height in px
  zoom: 100,           // zoom percentage
  stretchX: 100,       // width stretch percentage
  stretchY: 100        // height stretch percentage
};

function getLogoConfig() {
  try {
    const saved = SafeStorage.get('agy_studio_logo_cfg');
    if (saved) return Object.assign({}, DEFAULT_LOGO_CONFIG, typeof saved === 'object' ? saved : JSON.parse(saved));
  } catch (_) {}
  return Object.assign({}, DEFAULT_LOGO_CONFIG);
}

function applyLogoConfig(cfg, shouldSync = true) {
  if (!cfg) cfg = getLogoConfig();
  AppState.logoConfig = cfg;
  SafeStorage.set('agy_studio_logo_cfg', cfg);

  const size = cfg.size || 26;
  let width = size;
  let height = size;
  let borderRadius = '50%';

  if (cfg.shape === 'circle') {
    width = size;
    height = size;
    borderRadius = '50%';
  } else if (cfg.shape === 'square') {
    width = size;
    height = size;
    borderRadius = '6px';
  } else if (cfg.shape === 'card') {
    width = Math.round(size * 1.77); // 16:9 企業名片
    height = size;
    borderRadius = '4px';
  } else if (cfg.shape === 'banner') {
    width = Math.round(size * 2.5); // 2.5:1 長條名片橫幅
    height = size;
    borderRadius = '4px';
  }

  const transformStr = `scale(${(cfg.zoom / 100) * (cfg.stretchX / 100)}, ${(cfg.zoom / 100) * (cfg.stretchY / 100)})`;
  const fitMode = cfg.fit || 'contain';

  // 1. 前台商品標題膠囊徽章 Logo
  const prodLogo = el('product-seller-logo');
  if (prodLogo) {
    prodLogo.style.width = width + 'px';
    prodLogo.style.height = height + 'px';
    prodLogo.style.borderRadius = borderRadius;
    prodLogo.style.objectFit = fitMode;
    prodLogo.style.transform = transformStr;
  }

  // 2. 後台店鋪設定與基本資料預覽圖
  const shopLogoImg = el('shop-logo-preview-img');
  if (shopLogoImg) {
    shopLogoImg.style.objectFit = fitMode;
    shopLogoImg.style.transform = transformStr;
    if (shopLogoImg.parentElement) {
      if (cfg.shape === 'card' || cfg.shape === 'banner') {
        shopLogoImg.parentElement.style.width = Math.min(width, 70) + 'px';
      } else {
        shopLogoImg.parentElement.style.width = '44px';
      }
    }
  }
  const sellerLogoImg = el('seller-logo-preview-img');
  if (sellerLogoImg) {
    sellerLogoImg.style.objectFit = fitMode;
    sellerLogoImg.style.transform = transformStr;
    if (sellerLogoImg.parentElement) {
      if (cfg.shape === 'card' || cfg.shape === 'banner') {
        sellerLogoImg.parentElement.style.width = Math.min(width, 70) + 'px';
      } else {
        sellerLogoImg.parentElement.style.width = '44px';
      }
    }
  }

  // 3. 頂端導覽列 Logo
  const navLogo = el('nav-logo-img');
  if (navLogo) {
    navLogo.style.objectFit = fitMode;
    if (cfg.shape === 'circle') navLogo.style.borderRadius = '50%';
    else if (cfg.shape === 'square') navLogo.style.borderRadius = '6px';
  }

  // 4. 彈窗即時預覽元件同步
  const previewBadgeLogo = el('preview-badge-logo');
  if (previewBadgeLogo) {
    previewBadgeLogo.style.width = width + 'px';
    previewBadgeLogo.style.height = height + 'px';
    previewBadgeLogo.style.borderRadius = borderRadius;
    previewBadgeLogo.style.objectFit = fitMode;
    previewBadgeLogo.style.transform = transformStr;
  }
  const previewNavLogo = el('preview-nav-logo');
  if (previewNavLogo) {
    previewNavLogo.style.objectFit = fitMode;
    previewNavLogo.style.borderRadius = (cfg.shape === 'circle') ? '50%' : '6px';
  }

  // 5. 雲端 Firebase 同步
  if (shouldSync) {
    const db = FirebaseManager.getDb();
    if (db) {
      db.ref('settings/shop/logoConfig').set(cfg).catch(() => {});
      if (AppState.auctionId) {
        db.ref('auctions/' + AppState.auctionId + '/logoConfig').set(cfg).catch(() => {});
      }
    }
  }
}

let currentTargetIsShop = true;
let tempLogoConfig = null;

function openLogoFitModal(isShop = true) {
  currentTargetIsShop = isShop;
  tempLogoConfig = Object.assign({}, getLogoConfig());

  let currentLogo = 'icon-192.png';
  let currentName = '建生工坊';
  if (isShop) {
    currentLogo = el('cfg-studio-logo')?.value.trim() || SafeStorage.get('agy_studio_logo') || 'icon-192.png';
    currentName = el('cfg-studio-name')?.value.trim() || '建生工坊';
  } else {
    currentLogo = el('edit-item-seller-logo')?.value.trim() || 'icon-192.png';
    currentName = el('edit-item-seller-name')?.value.trim() || '建生工坊';
  }

  if (el('preview-badge-logo')) el('preview-badge-logo').src = currentLogo;
  if (el('preview-badge-name')) el('preview-badge-name').textContent = currentName;
  if (el('preview-nav-logo')) el('preview-nav-logo').src = currentLogo;
  if (el('preview-nav-name')) el('preview-nav-name').textContent = currentName;

  updateModalUIFromConfig(tempLogoConfig);
  applyModalLivePreview(tempLogoConfig);

  const modal = el('modal-logo-fit');
  if (modal) modal.classList.add('show', 'active');
}

function closeLogoFitModal() {
  const modal = el('modal-logo-fit');
  if (modal) modal.classList.remove('show', 'active');
}

function updateModalUIFromConfig(cfg) {
  document.querySelectorAll('.logo-shape-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.shape === cfg.shape);
  });
  document.querySelectorAll('.logo-fit-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.fit === cfg.fit);
  });
  if (el('slider-logo-size')) el('slider-logo-size').value = cfg.size;
  if (el('val-logo-size')) el('val-logo-size').textContent = cfg.size + 'px';

  if (el('slider-logo-zoom')) el('slider-logo-zoom').value = cfg.zoom;
  if (el('val-logo-zoom')) el('val-logo-zoom').textContent = cfg.zoom + '%';

  if (el('slider-logo-stretch-x')) el('slider-logo-stretch-x').value = cfg.stretchX;
  if (el('val-logo-stretch-x')) el('val-logo-stretch-x').textContent = cfg.stretchX + '%';

  if (el('slider-logo-stretch-y')) el('slider-logo-stretch-y').value = cfg.stretchY;
  if (el('val-logo-stretch-y')) el('val-logo-stretch-y').textContent = cfg.stretchY + '%';
}

function applyModalLivePreview(cfg) {
  const size = cfg.size || 26;
  let width = size;
  let height = size;
  let borderRadius = '50%';

  if (cfg.shape === 'circle') {
    width = size;
    height = size;
    borderRadius = '50%';
  } else if (cfg.shape === 'square') {
    width = size;
    height = size;
    borderRadius = '6px';
  } else if (cfg.shape === 'card') {
    width = Math.round(size * 1.77);
    height = size;
    borderRadius = '4px';
  } else if (cfg.shape === 'banner') {
    width = Math.round(size * 2.5);
    height = size;
    borderRadius = '4px';
  }

  const transformStr = `scale(${(cfg.zoom / 100) * (cfg.stretchX / 100)}, ${(cfg.zoom / 100) * (cfg.stretchY / 100)})`;
  const fitMode = cfg.fit || 'contain';

  const previewBadgeLogo = el('preview-badge-logo');
  if (previewBadgeLogo) {
    previewBadgeLogo.style.width = width + 'px';
    previewBadgeLogo.style.height = height + 'px';
    previewBadgeLogo.style.borderRadius = borderRadius;
    previewBadgeLogo.style.objectFit = fitMode;
    previewBadgeLogo.style.transform = transformStr;
  }
}

function setupLogoFitModal() {
  el('shop-logo-preview-box')?.addEventListener('click', () => openLogoFitModal(true));
  el('btn-edit-shop-logo-fit')?.addEventListener('click', () => openLogoFitModal(true));
  el('seller-logo-preview-box')?.addEventListener('click', () => openLogoFitModal(false));
  el('btn-edit-item-logo-fit')?.addEventListener('click', () => openLogoFitModal(false));

  document.querySelectorAll('.logo-shape-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.logo-shape-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (tempLogoConfig) {
        tempLogoConfig.shape = btn.dataset.shape;
        applyModalLivePreview(tempLogoConfig);
      }
    });
  });

  document.querySelectorAll('.logo-fit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.logo-fit-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (tempLogoConfig) {
        tempLogoConfig.fit = btn.dataset.fit;
        applyModalLivePreview(tempLogoConfig);
      }
    });
  });

  el('slider-logo-size')?.addEventListener('input', e => {
    const val = Number(e.target.value);
    if (el('val-logo-size')) el('val-logo-size').textContent = val + 'px';
    if (tempLogoConfig) {
      tempLogoConfig.size = val;
      applyModalLivePreview(tempLogoConfig);
    }
  });

  el('slider-logo-zoom')?.addEventListener('input', e => {
    const val = Number(e.target.value);
    if (el('val-logo-zoom')) el('val-logo-zoom').textContent = val + '%';
    if (tempLogoConfig) {
      tempLogoConfig.zoom = val;
      applyModalLivePreview(tempLogoConfig);
    }
  });

  el('slider-logo-stretch-x')?.addEventListener('input', e => {
    const val = Number(e.target.value);
    if (el('val-logo-stretch-x')) el('val-logo-stretch-x').textContent = val + '%';
    if (tempLogoConfig) {
      tempLogoConfig.stretchX = val;
      applyModalLivePreview(tempLogoConfig);
    }
  });

  el('slider-logo-stretch-y')?.addEventListener('input', e => {
    const val = Number(e.target.value);
    if (el('val-logo-stretch-y')) el('val-logo-stretch-y').textContent = val + '%';
    if (tempLogoConfig) {
      tempLogoConfig.stretchY = val;
      applyModalLivePreview(tempLogoConfig);
    }
  });

  el('btn-logo-fit-reset')?.addEventListener('click', () => {
    tempLogoConfig = Object.assign({}, DEFAULT_LOGO_CONFIG);
    updateModalUIFromConfig(tempLogoConfig);
    applyModalLivePreview(tempLogoConfig);
    showToast('🔄 已恢復預設適配與尺寸數值');
  });

  el('btn-logo-fit-cancel')?.addEventListener('click', closeLogoFitModal);
  el('modal-logo-fit')?.addEventListener('click', e => {
    if (e.target === el('modal-logo-fit')) closeLogoFitModal();
  });

  el('btn-logo-fit-apply')?.addEventListener('click', () => {
    if (tempLogoConfig) {
      applyLogoConfig(tempLogoConfig, true);
      closeLogoFitModal();
      showToast('✅ 賣家 Logo / 名片尺寸拉伸與顯示適配已儲存生效！');
    }
  });

  const dropzone = el('modal-logo-dropzone');
  const fileInput = el('modal-logo-file-input');
  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const dataUrl = ev.target.result;
        if (el('preview-badge-logo')) el('preview-badge-logo').src = dataUrl;
        if (el('preview-nav-logo')) el('preview-nav-logo').src = dataUrl;
        if (currentTargetIsShop) {
          updateStudioLogo(dataUrl, true);
        } else {
          if (el('edit-item-seller-logo')) el('edit-item-seller-logo').value = dataUrl;
          if (el('seller-logo-preview-img')) el('seller-logo-preview-img').src = dataUrl;
        }
        showToast('📷 已成功選取新圖片！請點選「確認套用」生效。');
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    });
  }
}

function setupLogoDragAndDrop() {
  const targets = [
    { zone: el('shop-logo-preview-box'), input: el('cfg-studio-logo'), isGlobal: true },
    { zone: el('cfg-studio-logo'), input: el('cfg-studio-logo'), isGlobal: true },
    { zone: el('seller-logo-preview-box'), input: el('edit-item-seller-logo'), isGlobal: false },
    { zone: el('edit-item-seller-logo'), input: el('edit-item-seller-logo'), isGlobal: false },
    { zone: el('modal-logo-dropzone'), input: null, isGlobal: true }
  ];

  targets.forEach(({ zone, input, isGlobal }) => {
    if (!zone) return;

    ['dragenter', 'dragover'].forEach(name => {
      zone.addEventListener(name, e => {
        e.preventDefault();
        e.stopPropagation();
        zone.classList.add('logo-drag-over', 'drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      zone.addEventListener(name, e => {
        e.preventDefault();
        e.stopPropagation();
        zone.classList.remove('logo-drag-over', 'drag-over');
      });
    });

    zone.addEventListener('drop', e => {
      const dt = e.dataTransfer;
      if (!dt || !dt.files || !dt.files.length) return;
      const file = dt.files[0];
      if (!file.type.startsWith('image/')) {
        showToast('⚠️ 請拖曳圖片檔案（支援 JPG、PNG、WEBP、GIF、SVG 等）！');
        return;
      }

      const reader = new FileReader();
      reader.onload = ev => {
        const dataUrl = ev.target.result;
        if (input) input.value = dataUrl;
        if (isGlobal) {
          updateStudioLogo(dataUrl, true);
        } else {
          if (el('seller-logo-preview-img')) el('seller-logo-preview-img').src = dataUrl;
        }
        if (el('preview-badge-logo')) el('preview-badge-logo').src = dataUrl;
        if (el('preview-nav-logo')) el('preview-nav-logo').src = dataUrl;
        showToast('📷 已成功透過拖曳載入圖片！點選可自由拉伸調整大小與適配。');
      };
      reader.readAsDataURL(file);
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   6. Firebase 雲端模組 (Firebase Module)
   ───────────────────────────────────────────────────────────── */
// 系統內建預設 Firebase Realtime Database 雲端節點常數 (新加坡區域 chien-sheng-auction)
const DEFAULT_FIREBASE_CONFIG = Object.freeze({
  apiKey: "AIzaSyDemoAuctionKeyFake1234567890",
  databaseURL: "https://chien-sheng-auction-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chien-sheng-auction"
});

const FirebaseManager = (function () {
  let _app = null;
  let _db = null;
  let _activeCfg = Object.assign({}, DEFAULT_FIREBASE_CONFIG);

  // 強制寫死綁定真實 Firebase Realtime Database 雲端節點 (新加坡區域)
  const DEFAULT_CONFIG = DEFAULT_FIREBASE_CONFIG;

  function isValidFirebaseConfig(candidate) {
    if (!candidate || typeof candidate !== 'object') return false;
    const apiKey = String(candidate.apiKey || '').trim();
    const dbUrl = String(candidate.databaseURL || '').trim();
    const projId = String(candidate.projectId || '').trim();
    if (!apiKey || !dbUrl || !projId) return false;
    if (!dbUrl.startsWith('https://')) return false;
    if (!dbUrl.includes('firebasedatabase.app') && !dbUrl.includes('firebaseio.com')) return false;
    return true;
  }

  function resolveEffectiveConfig() {
    try {
      const stored = SafeStorage.get('agy_fb_config');
      if (stored) {
        const parsed = typeof stored === 'object' ? stored : JSON.parse(stored);
        if (isValidFirebaseConfig(parsed)) {
          return {
            apiKey: String(parsed.apiKey).trim(),
            databaseURL: String(parsed.databaseURL).trim(),
            projectId: String(parsed.projectId).trim()
          };
        } else {
          // 自動清除無效或空白的覆蓋設定，確保絕不斷線
          SafeStorage.remove('agy_fb_config');
        }
      }
    } catch (e) {}
    return Object.assign({}, DEFAULT_CONFIG);
  }

  function init() {
    _activeCfg = resolveEffectiveConfig();

    try {
      if (typeof firebase !== 'undefined' && !_app) {
        _app = firebase.initializeApp(_activeCfg);
        _db = firebase.database();
        if (typeof initServerTimeSync === 'function') {
          initServerTimeSync(_db);
        }
        listenShopSettings();
        listenAuctionSync();
        listenBuyers();
      }
    } catch (e) {
      console.warn('Firebase init fallback:', e);
    }
  }

  // 👥 即時監聽買家註冊名冊節點 (同時監聽 settings/buyers 與 buyers 進行雙向無縫合併)
  function listenBuyers() {
    if (!_db) return;
    const buyersMap = {};

    const updateBuyerRoster = () => {
      const buyers = Object.values(buyersMap);
      buyers.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
      const prevCount = AppState.registeredBuyers ? AppState.registeredBuyers.length : 0;
      AppState.registeredBuyers = buyers;

      if (AppState.isAdmin && buyers.length > prevCount && prevCount > 0) {
        const newest = buyers[0];
        showToast(`🔔 新買家「${newest.name} (${newest.phone ? newest.phone.slice(-4) : ''})」已登入系統！`);
      }

      renderAdminBuyersRoster();

      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        syncToLocalServer();
      }
    };

    _db.ref('settings/buyers').on('value', snap => {
      if (snap.exists()) {
        const val = snap.val() || {};
        Object.assign(buyersMap, val);
        updateBuyerRoster();
      }
    });

    _db.ref('buyers').on('value', snap => {
      if (snap.exists()) {
        const val = snap.val() || {};
        Object.assign(buyersMap, val);
        updateBuyerRoster();
      }
    });

    _db.ref('settings/blacklist').on('value', snap => {
      if (snap.exists()) {
        AppState.blacklist = snap.val() || {};
        SafeStorage.set('agy_blacklist', AppState.blacklist);
        try { renderAdminBuyersRoster(); } catch (e) {}
      }
    });
  }

  // 即時監聽 Firebase 店鋪設定節點
  function listenShopSettings() {
    if (!_db) return;
    _db.ref('settings/shop').on('value', snap => {
      if (snap.exists()) {
        const val = snap.val();
        if (val) {
          if (val.studioName) {
            updateStudioName(val.studioName === 'JianSheng Boutique' ? '建生工坊' : val.studioName, false);
          }
          if (val.studioLogo) {
            updateStudioLogo(val.studioLogo, false);
          }
          if (val.logoConfig) {
            applyLogoConfig(val.logoConfig, false);
          }
          if (val.customCannedReplies !== undefined) {
            const list = Array.isArray(val.customCannedReplies)
              ? val.customCannedReplies
              : (val.customCannedReplies && typeof val.customCannedReplies === 'object' ? Object.values(val.customCannedReplies) : []);
            AppState.customCannedReplies = list.filter(c => c && c.label && c.text);
            SafeStorage.set('agy_custom_canned_replies', AppState.customCannedReplies);
            try { renderQA(true, null); } catch (e) {}
            try { renderAdminAllQA(); } catch (e) {}
            if (typeof renderCustomCannedManagerList === 'function') {
              try { renderCustomCannedManagerList(); } catch (e) {}
            }
          }
        }
      }
    });
  }

  function getDb() { return _db; }
  function isReady() { return !!_db; }
  function getDefaultConfig() { return Object.assign({}, DEFAULT_CONFIG); }
  function getActiveConfig() {
    const resolved = resolveEffectiveConfig();
    _activeCfg = resolved;
    return Object.assign({}, _activeCfg);
  }

  return {
    init: init,
    getDb: getDb,
    isReady: isReady,
    getDefaultConfig: getDefaultConfig,
    getActiveConfig: getActiveConfig,
    isValidFirebaseConfig: isValidFirebaseConfig
  };
})();

/**
 * 徹底統一 Firebase 拍賣商品與出價、問答同步模組 (雙向合流保護)
 * 同步監聽 auctions/item-local-recovered 與 auction/items 節點，合流最新數據
 */
function listenAuctionSync() {
  const db = FirebaseManager.getDb();
  if (!db) return;

  AppState.auctionId = UNIFIED_AUCTION_ID;

  // 1. 監聽統一主拍賣節點 auctions/item-local-recovered
  db.ref('auctions/' + UNIFIED_AUCTION_ID).on('value', snap => {
    if (!snap.exists()) return;
    const data = snap.val();
    if (!data) return;
    handleIncomingAuctionData(data);
  });

  // 2. 鏡像監聽單數節點 auction/items
  db.ref('auction/items').on('value', snap => {
    if (!snap.exists()) return;
    const remoteItems = snap.val();
    if (!remoteItems) return;
    handleIncomingAuctionItems(remoteItems);
  });
}

// 本機重開競標防競態鎖定表（避免雲端延遲快照或舊節點回彈覆蓋新倒數）
const _relistLockUntil = {};

function setItemRelistLock(itemId, durationMs = 8000) {
  if (!itemId) return;
  _relistLockUntil[itemId] = Date.now() + Number(durationMs || 8000);
}

function isItemRelistLocked(itemId) {
  if (!itemId || !_relistLockUntil[itemId]) return false;
  if (Date.now() < _relistLockUntil[itemId]) return true;
  delete _relistLockUntil[itemId];
  return false;
}

/**
 * 判斷遠端 Firebase 快照是否為「重開競標前的陳舊資料」，若是則應忽略以防止時間回彈與自動結標
 */
function shouldIgnoreStaleRemoteUpdate(local, rItem) {
  if (!local || !rItem) return false;
  const localSeq = Number(local.relistSeq || 0);
  const remoteSeq = Number(rItem.relistSeq || 0);
  const localReopen = Number(local.reopenedAt || 0);
  const remoteReopen = Number(rItem.reopenedAt || 0);
  const remoteEnded = (rItem.status === 'ended' || rItem.status === 'picked_up' || rItem.endedEarly === true || rItem.manualEnd === true || rItem.isEnded === true);

  if (remoteSeq < localSeq) return true;
  if (localReopen > 0 && remoteReopen < localReopen && (remoteEnded || (rItem.endTime && Number(rItem.endTime) < Number(local.endTime || 0)))) {
    return true;
  }
  if (isItemRelistLocked(local.id)) {
    const localEnd = Number(local.endTime || 0);
    const remoteEnd = Number(rItem.endTime || 0);
    if (remoteEnded || (remoteEnd > 0 && remoteEnd + 5000 < localEnd)) {
      return true;
    }
  }
  return false;
}

function handleIncomingAuctionItems(remoteItems) {
  let changed = false;
  Object.keys(remoteItems).forEach(key => {
    const rItem = remoteItems[key];
    if (!rItem) return;
    const id = rItem.id || key;
    const local = AppState.items.find(i => i.id === id);
    if (local) {
      if (shouldIgnoreStaleRemoteUpdate(local, rItem)) {
        return;
      }

      const remoteReopen = Number(rItem.reopenedAt || 0);
      const remoteSeq = Number(rItem.relistSeq || 0);
      const isRemoteFreshRelist = (remoteSeq > Number(local.relistSeq || 0)) || (remoteReopen > Number(local.reopenedAt || 0));

      const remoteHasBids = !!(rItem.bids && Object.keys(rItem.bids).length > 0) || !!(rItem.topBidder && (rItem.topBidder.name || typeof rItem.topBidder === 'string'));
      if (isRemoteFreshRelist || (!remoteHasBids && rItem.currentPrice !== undefined && Number(rItem.currentPrice) <= Number(rItem.startPrice || local.startPrice || 10000))) {
        const resetPrice = Number(rItem.startPrice || local.startPrice || 10000);
        if (isRemoteFreshRelist || local.currentPrice !== resetPrice || local.topBidder || (local.bidHistory && local.bidHistory.length > 0)) {
          local.startPrice = resetPrice;
          local.currentPrice = resetPrice;
          local.currentBid = resetPrice;
          local.topBidder = '';
          local.topBidderContact = null;
          local.topBidTime = null;
          local.bids = {};
          local.bidHistory = [];
          local.winnerMsgs = [];
          local.backupOffer = null;
          local.backupState = null;
          local.finalDealPrice = null;
          local.defaultedBidders = [];
          local.endedEarly = false;
          local.manualEnd = false;
          local.isEnded = false;
          local.pickupDeadline = null;
          local.pickedUpAt = null;
          if (remoteSeq) local.relistSeq = remoteSeq;
          if (remoteReopen) local.reopenedAt = remoteReopen;
          if (rItem.timeMode) local.timeMode = rItem.timeMode === 'reset24' ? 'reset24' : 'fixed';
          changed = true;
        }
      } else if (rItem.currentPrice !== undefined && rItem.currentPrice > (local.currentPrice || local.currentBid || 0)) {
        const bidderName = rItem.topBidder?.name || rItem.topBidder || '';
        checkOutbidNotice(id, bidderName, rItem.currentPrice);
        local.currentPrice = rItem.currentPrice;
        local.currentBid = rItem.currentPrice;
        local.topBidder = bidderName;
        if (rItem.topBidder && typeof rItem.topBidder === 'object') {
          local.topBidderContact = rItem.topBidder;
        }
        changed = true;
      }
      if (rItem.endTime && rItem.endTime !== local.endTime) {
        local.endTime = rItem.endTime;
        changed = true;
      }
      if (rItem.status && rItem.status !== local.status) {
        local.status = rItem.status;
        changed = true;
      }
      if (rItem.bids) {
        local.bids = rItem.bids;
        local.bidHistory = Object.values(rItem.bids).map(b => ({
          user: b.bidderName || b.user || '買家',
          amount: b.amount,
          time: b.timestamp || b.time || (typeof getServerNow === 'function' ? getServerNow() : Date.now()),
          phone: b.bidderPhone || b.phone || '',
          phoneMasked: b.bidderPhoneMasked || (b.bidderPhone ? maskPhone(b.bidderPhone) : ''),
          line: b.bidderLine || b.line || '',
          ig: b.bidderIg || b.ig || '',
          fb: b.bidderFb || b.fb || ''
        })).sort((a, b) => b.amount - a.amount);
        changed = true;
      }
      if (rItem.qa) {
        const oldKeys = Object.keys(local.qa || {});
        const newKeys = Object.keys(rItem.qa);
        const isDiff = JSON.stringify(local.qa || {}) !== JSON.stringify(rItem.qa);
        if (isDiff) {
          if (AppState.isAdmin && newKeys.length > oldKeys.length) {
            const newestKey = newKeys.filter(k => !oldKeys.includes(k))[0] || newKeys[newKeys.length - 1];
            const qData = rItem.qa[newestKey];
            if (qData && qData.question) {
              showToast(`💬 收到新提問！${qData.user ? qData.user + '：' : ''}${qData.question?.slice(0, 25) || ''}`);
            }
          }
          local.qa = rItem.qa;
          changed = true;
        }
      } else if (!rItem.qa && local.qa && Object.keys(local.qa).length > 0) {
        local.qa = {};
        changed = true;
      }
    }
  });

  if (changed) {
    applySafeBackgroundRender();
  }
}

function handleIncomingAuctionData(data) {
  if (data.studioName) {
    updateStudioName(data.studioName === 'JianSheng Boutique' ? '建生工坊' : data.studioName, false);
  }
  if (data.studioLogo) {
    updateStudioLogo(data.studioLogo, false);
  }
  if (data.logoConfig) {
    applyLogoConfig(data.logoConfig, false);
  }
  if (data.baseCurrency) AppState.baseCurrency = data.baseCurrency;

  let incomingItems = [];
  if (data.items) {
    const rawList = (Array.isArray(data.items) ? data.items : Object.values(data.items)).filter(it => {
      if (!it || typeof it !== 'object') return false;
      const nm = String(it.name || it.itemName || it.title || '').trim();
      if (!nm || (nm === '拍賣商品' && Number(it.startPrice) === 100 && (!it.images || it.images[0] === 'icon-512.png'))) return false;
      return true;
    });
    incomingItems = rawList.map((it, idx) => normalizeItem(it, it.id || `item-${idx + 1}`));
  } else if (data.name || data.itemName) {
    incomingItems = [normalizeItem(data, data.id || 'item-local-recovered')];
  }

  if (incomingItems.length > 0) {
    let changed = false;
    incomingItems.forEach(rItem => {
      const local = AppState.items.find(i => i.id === rItem.id);
      if (local) {
        if (shouldIgnoreStaleRemoteUpdate(local, rItem)) {
          return;
        }

        const remoteReopen = Number(rItem.reopenedAt || 0);
        const remoteSeq = Number(rItem.relistSeq || 0);
        const isRemoteFreshRelist = (remoteSeq > Number(local.relistSeq || 0)) || (remoteReopen > Number(local.reopenedAt || 0));

        const rHasBids = !!(rItem.bids && Object.keys(rItem.bids).length > 0) || !!(rItem.bidHistory && rItem.bidHistory.length > 0) || !!rItem.topBidder;
        if (isRemoteFreshRelist || (!rHasBids && Number(rItem.currentBid || rItem.startPrice) <= Number(rItem.startPrice || local.startPrice || 10000))) {
          const resetP = Number(rItem.startPrice || local.startPrice || 10000);
          if (isRemoteFreshRelist || local.currentPrice !== resetP || local.topBidder || (local.bidHistory && local.bidHistory.length > 0)) {
            local.startPrice = resetP;
            local.currentPrice = resetP;
            local.currentBid = resetP;
            local.topBidder = '';
            local.topBidderContact = null;
            local.topBidTime = null;
            local.bids = {};
            local.bidHistory = [];
            local.winnerMsgs = [];
            local.backupOffer = null;
            local.backupState = null;
            local.finalDealPrice = null;
            local.defaultedBidders = [];
            local.endedEarly = false;
            local.manualEnd = false;
            local.isEnded = false;
            local.pickupDeadline = null;
            local.pickedUpAt = null;
            if (remoteSeq) local.relistSeq = remoteSeq;
            if (remoteReopen) local.reopenedAt = remoteReopen;
            if (rItem.timeMode) local.timeMode = rItem.timeMode === 'reset24' ? 'reset24' : 'fixed';
            changed = true;
          }
        } else if (rItem.currentBid > (local.currentPrice || local.currentBid || 0)) {
          checkOutbidNotice(rItem.id, rItem.topBidder, rItem.currentBid);
          local.currentPrice = rItem.currentBid;
          local.currentBid = rItem.currentBid;
          local.topBidder = rItem.topBidder;
          local.topBidderContact = rItem.topBidderContact;
          changed = true;
        }
        if (rItem.endTime && rItem.endTime !== local.endTime) {
          local.endTime = rItem.endTime;
          changed = true;
        }
        if (rItem.status && rItem.status !== local.status) {
          local.status = rItem.status;
          changed = true;
        }
        if (rItem.bids) {
          local.bids = rItem.bids;
          local.bidHistory = Object.values(rItem.bids).map(b => ({
            user: b.bidderName || b.user || '買家',
            amount: b.amount,
            time: b.timestamp || b.time || (typeof getServerNow === 'function' ? getServerNow() : Date.now()),
            phone: b.bidderPhone || b.phone || '',
            phoneMasked: b.bidderPhoneMasked || (b.bidderPhone ? maskPhone(b.bidderPhone) : ''),
            line: b.bidderLine || b.line || '',
            ig: b.bidderIg || b.ig || '',
            fb: b.bidderFb || b.fb || ''
          })).sort((a, b) => b.amount - a.amount);
          changed = true;
        }
        if (rItem.backupOffer !== undefined) {
          if (JSON.stringify(local.backupOffer || null) !== JSON.stringify(rItem.backupOffer || null)) {
            local.backupOffer = rItem.backupOffer;
            changed = true;
          }
        }
        if (rItem.finalDealPrice !== undefined && rItem.finalDealPrice !== local.finalDealPrice) {
          local.finalDealPrice = Number(rItem.finalDealPrice);
          local.currentPrice = Number(rItem.finalDealPrice);
          local.currentBid = Number(rItem.finalDealPrice);
          if (rItem.topBidder) {
            local.topBidder = rItem.topBidder?.name || rItem.topBidder;
            if (typeof rItem.topBidder === 'object') local.topBidderContact = rItem.topBidder;
          }
          if (rItem.topBidderContact) local.topBidderContact = rItem.topBidderContact;
          changed = true;
        }
        if (rItem.winnerMsgs && JSON.stringify(local.winnerMsgs || []) !== JSON.stringify(rItem.winnerMsgs)) {
          local.winnerMsgs = Array.isArray(rItem.winnerMsgs) ? rItem.winnerMsgs : Object.values(rItem.winnerMsgs);
          changed = true;
        }
        if (rItem.qa) {
          const oldKeys = Object.keys(local.qa || {});
          const newKeys = Object.keys(rItem.qa);
          const isDiff = JSON.stringify(local.qa || {}) !== JSON.stringify(rItem.qa);
          if (isDiff) {
            if (AppState.isAdmin && newKeys.length > oldKeys.length) {
              const newestKey = newKeys.filter(k => !oldKeys.includes(k))[0] || newKeys[newKeys.length - 1];
              const qData = rItem.qa[newestKey];
              if (qData) {
                showToast(`💬 收到新提問！${qData.user ? qData.user + '：' : ''}${qData.question?.slice(0, 25) || ''}`);
              }
            }
            local.qa = rItem.qa;
            changed = true;
          }
        } else if (!rItem.qa && local.qa && Object.keys(local.qa).length > 0) {
          local.qa = {};
          changed = true;
        }
      }
    });

    if (changed) {
      applySafeBackgroundRender();
    }
  }

  if (data.broadcasts && Array.isArray(data.broadcasts)) {
    if (data.broadcasts.length > AppState.broadcasts.length) {
      const latest = data.broadcasts[data.broadcasts.length - 1];
      if (latest && latest.msg) {
        showTopBroadcastBanner(latest.msg);
      }
      AppState.broadcasts = data.broadcasts;
      renderBroadcastHistory();
    }
  }
}

/** 背景即時同步時之安全保護渲染：絕不讓捲軸往上跳動，且不清除使用者正在打字的輸入框 */
function applySafeBackgroundRender() {
  const prevScroll = window.scrollY;
  const activeEl = document.activeElement;
  const isInputFocused = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
  const focusedId = isInputFocused ? activeEl.id : null;
  const focusedVal = isInputFocused ? activeEl.value : null;
  const selStart = isInputFocused ? activeEl.selectionStart : null;
  const selEnd = isInputFocused ? activeEl.selectionEnd : null;

  try { renderActiveItemDisplay(); } catch (e) {}
  try { renderItemTabs(); } catch (e) {}
  try { renderBidHistory(); } catch (e) {}
  try { renderQA(); } catch (e) {}
  try { renderAdminAllQA(); } catch (e) {}
  try { renderWinnerStatus(); } catch (e) {}
  if (typeof updateAuctionTimerUI === 'function') {
    try { updateAuctionTimerUI(); } catch (e) {}
  }

  if (focusedId && el(focusedId)) {
    const curInp = el(focusedId);
    if (focusedVal !== null && curInp.value !== focusedVal) {
      curInp.value = focusedVal;
    }
    curInp.focus();
    if (selStart !== null && selEnd !== null) {
      try { curInp.setSelectionRange(selStart, selEnd); } catch (e) {}
    }
  }

  window.scrollTo({ top: prevScroll, behavior: 'instant' });

  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    syncToLocalServer();
  }
}

/* ─────────────────────────────────────────────────────────────
   7. 拍賣主邏輯 (Auction Core Operations)
   ───────────────────────────────────────────────────────────── */

/** 獲取當前選定的商品品項 (若空則返回 null) */
function getActiveItem() {
  if (!AppState.items || !AppState.items.length) return null;
  const item = AppState.items.find(i => i.id === AppState.activeItemId);
  return item || AppState.items[0];
}

/** 切換當前選定的商品品項 */
function switchActiveItem(itemId) {
  const target = AppState.items.find(i => i.id === itemId);
  if (!target) return;
  AppState.activeItemId = itemId;
  AppState.galleryIndex = 0;

  // 動態更新網頁標題與網址列 (保留既有 mode 參數)
  const isEnded = target.status === 'ended' || target.status === 'picked_up';
  const studio = AppState.studioName || '建生工坊';
  const statusPrefix = isEnded ? '【已結標】' : '【競標中】';
  document.title = `${statusPrefix} ${target.name}｜${studio}`;
  const pageTitle = el('page-title');
  if (pageTitle) pageTitle.textContent = document.title;

  try {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('id', itemId);
    window.history.replaceState(null, '', currentUrl.toString());
  } catch (e) {}

  renderItemTabs();
  renderActiveItemDisplay();
  renderBidHistory();
  renderQA();
  renderWinnerStatus();
  if (typeof updateAuctionTimerUI === 'function') {
    updateAuctionTimerUI();
  }
  updateShareUrl();
}

/** 渲染商品切換標籤列 */
function renderItemTabs() {
  const scroll = el('item-tabs-scroll');
  const section = el('item-tabs-section');
  if (!scroll) return;
  scroll.innerHTML = '';

  // 若商品已全部刪除，隱藏切換列
  if (!AppState.items || !AppState.items.length) {
    if (section) section.style.display = 'none';
    return;
  }

  // 若處於單品鎖定模式 (mode=single) 且尚未被主動展開，則隱藏商品切換分頁列
  const params = new URLSearchParams(window.location.search);
  const isSingle = (params.get('mode') === 'single') && !AppState.isTabsManuallyExpanded;
  if (section) {
    section.style.display = isSingle ? 'none' : 'block';
  }

  AppState.items.forEach(item => {
    const chip = document.createElement('div');
    chip.className = `item-tab-chip ${item.id === AppState.activeItemId ? 'active' : ''}`;
    chip.dataset.itemId = item.id;

    let badgeClass = 'badge-live';
    let badgeText = '競標中';
    if (item.status === 'picked_up') {
      badgeClass = 'badge-picked';
      badgeText = '已取貨';
    } else if (item.status === 'ended') {
      badgeClass = 'badge-ended';
      badgeText = '已結標';
    }

    const priceText = formatMoney(item.currentBid || item.startPrice, AppState.activeCurrency);

    chip.innerHTML = `
      <span>📦</span>
      <span class="item-tab-title">${escapeHtml(item.name)}</span>
      <span style="font-family:var(--f-num);font-size:.78rem;font-weight:800;">${priceText}</span>
      <span class="item-tab-badge ${badgeClass}">${badgeText}</span>
    `;

    chip.addEventListener('click', () => switchActiveItem(item.id));
    scroll.appendChild(chip);
  });
}

/** 渲染選定商品的圖片輪播、影音與文字 (支援全部刪除空狀態 - 核心功能 1 & 3) */
function renderActiveItemDisplay() {
  try {
    const item = getActiveItem();
    const emptyState = el('auction-empty-state');
    const container = el('auction-container');
    const bidBar = el('mobile-bid-bar');

    // 全部商品已刪除時的乾淨空狀態版面 (核心功能 1)
    if (!item) {
      if (emptyState) emptyState.style.display = 'block';
      if (container) container.style.display = 'none';
      if (bidBar) bidBar.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (container) container.style.display = (AppState.viewMode === 'desktop') ? 'grid' : 'flex';
    if (bidBar) {
      bidBar.style.display = (item.status === 'active' || item.status === 'live') ? 'block' : 'none';
    }

  // 1-0. 店家識別標籤 (在商品名稱正上方：[店家 Logo 縮圖/商標] + 店家或企業名稱)
  const sellerBadge = el('product-seller-badge');
  const sellerNameEl = el('product-seller-name');
  const sellerLogoEl = el('product-seller-logo');
  if (sellerBadge) {
    const sName = item.sellerName || '建生工坊';
    const sLogo = item.sellerLogo || 'icon-192.png';
    if (sellerNameEl) sellerNameEl.textContent = sName;
    if (sellerLogoEl) sellerLogoEl.src = sLogo;
    sellerBadge.style.display = 'inline-flex';
    applyLogoConfig(getLogoConfig(), false);
  }

  // 1. 文字與標題
  if (el('product-name')) el('product-name').textContent = item.name;
  if (el('product-subtitle')) el('product-subtitle').textContent = item.subtitle || '';
  if (el('product-desc')) el('product-desc').textContent = item.desc || '';

  // 1-1. 取件標籤與說明動態渲染 (核心功能復原)
  const pickupBox = el('pickup-chips-container');
  if (pickupBox) {
    pickupBox.innerHTML = '';
    const opts = item.pickupOptions || { self: true };
    if (opts.self) {
      pickupBox.innerHTML += '<span class="item-tab-badge badge-live">🏠 實體門市面交</span>';
    }
    if (opts.delivery) {
      pickupBox.innerHTML += '<span class="item-tab-badge badge-live">📦 宅配/貨運寄送</span>';
    }
    if (opts.cvs) {
      pickupBox.innerHTML += '<span class="item-tab-badge badge-live">🏪 超商取件</span>';
    }
    if (item.pickupCustom) {
      pickupBox.innerHTML += `<span class="item-tab-badge badge-live">📍 ${escapeHtml(item.pickupCustom)}</span>`;
    }
  }

  // 1-2. 額外備註說明與注意事項動態渲染 (核心功能復原)
  const extraNotesBox = el('product-extra-notes-box');
  const extraNotesText = el('product-extra-notes-text');
  if (extraNotesBox && extraNotesText) {
    if (item.extraNotes && item.extraNotes.trim()) {
      extraNotesText.textContent = item.extraNotes.trim();
      extraNotesBox.style.display = 'block';
    } else {
      extraNotesBox.style.display = 'none';
    }
  }

  // 1-3. 保固說明動態渲染 (核心功能復原)
  const warrantyBox = el('product-warranty-box');
  const warrantyText = el('product-warranty-text');
  if (warrantyBox && warrantyText) {
    if (item.warrantyText && item.warrantyText.trim()) {
      warrantyText.textContent = item.warrantyText.trim();
      warrantyBox.style.display = 'block';
    } else {
      warrantyBox.style.display = 'none';
    }
  }

  // 2. 圖片輪播與 28 張縮圖多欄網格 / 水平滑動渲染
  const images = (item.images && item.images.length) ? item.images : ['icon-512.png'];
  if (AppState.galleryIndex >= images.length) AppState.galleryIndex = 0;

  const mainImg = el('gallery-main-img');
  if (mainImg) {
    mainImg.src = images[AppState.galleryIndex];
  }
  const counter = el('gallery-counter');
  if (counter) {
    counter.textContent = `${AppState.galleryIndex + 1} / ${images.length}`;
  }
  const countBadge = el('gallery-thumbs-count-badge');
  if (countBadge) {
    countBadge.textContent = `共 ${images.length} 張實拍照`;
  }

  // 縮圖列表 (電腦模式為多欄 Grid，手機模式為 60x60 水平滑動，點擊零延遲切換主圖)
  const thumbsBox = el('gallery-thumbs');
  if (thumbsBox) {
    thumbsBox.innerHTML = '';
    images.forEach((src, idx) => {
      const th = document.createElement('img');
      const isActive = idx === AppState.galleryIndex;
      th.className = `gallery-thumb ${isActive ? 'active' : ''}`;
      th.src = src;
      th.alt = `縮圖 ${idx + 1}`;
      th.loading = 'lazy';
      th.addEventListener('click', () => {
        switchGalleryImage(idx);
      });
      thumbsBox.appendChild(th);
      if (isActive && AppState.viewMode === 'mobile') {
        setTimeout(() => {
          th.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }, 30);
      }
    });
  }

  // 3. 多平台影音播放器嵌入 (核心功能 3)
  const videoCard = el('product-video-card');
  const videoContainer = el('video-embed-container');
  const videoPlatformBadge = el('video-platform-badge');

  if (item.videoUrl && videoCard && videoContainer) {
    const embedInfo = parseVideoEmbed(item.videoUrl);
    if (embedInfo) {
      videoCard.style.display = 'block';
      if (videoPlatformBadge) videoPlatformBadge.textContent = embedInfo.platform;
      videoContainer.innerHTML = embedInfo.html;
    } else {
      videoCard.style.display = 'none';
      videoContainer.innerHTML = '';
    }
  } else if (videoCard) {
    videoCard.style.display = 'none';
    if (videoContainer) videoContainer.innerHTML = '';
  }

  // 4. 出價金額顯示 (核心功能 2 多幣別換算)
  const curBidVal = item.currentPrice ?? item.currentBid ?? item.startPrice ?? 0;
  if (el('cur-bid-amount')) {
    el('cur-bid-amount').textContent = formatMoney(curBidVal, AppState.activeCurrency);
  }
  const topName = getBidderName(item.topBidder);
  if (el('cur-top-bidder')) {
    el('cur-top-bidder').textContent = topName
      ? maskBuyerName(topName)
      : '尚無人出價（起標價等待中）';
  }
  if (el('active-currency-badge')) {
    el('active-currency-badge').textContent = `${AppState.activeCurrency} (${CURRENCY_RATES[AppState.activeCurrency].name})`;
  }

  // 5. 下一口最低出價
  const hasPriorBids = !!topName || (item.bids && Object.keys(item.bids).length > 0) || (item.bidHistory && item.bidHistory.length > 0);
  const nextMinBid = hasPriorBids ? (curBidVal + item.increment) : item.startPrice;
  if (el('next-min-bid-val')) {
    el('next-min-bid-val').textContent = formatMoney(nextMinBid, AppState.activeCurrency);
  }

  // 6. 底部出價輸入框預設值
  const inpBid = el('inp-bid-val');
  if (inpBid && !inpBid.value) {
    inpBid.value = nextMinBid;
  }
  if (el('btn-submit-text') && !(typeof isSubmittingBid !== 'undefined' && isSubmittingBid)) {
    el('btn-submit-text').textContent = '立即出標';
  }

  // 7. 管理者應變按鈕顯示 (核心功能 7)
  const adminItemControls = el('admin-item-controls');
  if (adminItemControls) {
    adminItemControls.style.display = AppState.isAdmin ? 'flex' : 'none';
  }
  } catch (err) {
    console.error('renderActiveItemDisplay 錯誤:', err);
  }
}

/**
 * 零延遲切換主圖與縮圖高亮狀態（絕不觸發頁面垂直捲動跳動）
 */
function switchGalleryImage(idx) {
  const item = getActiveItem();
  if (!item) return;
  const images = (item.images && item.images.length) ? item.images : ['icon-512.png'];
  const total = images.length;
  AppState.galleryIndex = ((idx % total) + total) % total;

  const mainImg = el('gallery-main-img');
  if (mainImg) {
    mainImg.src = images[AppState.galleryIndex];
  }
  const counter = el('gallery-counter');
  if (counter) {
    counter.textContent = `${AppState.galleryIndex + 1} / ${total}`;
  }

  const thumbsBox = el('gallery-thumbs');
  if (thumbsBox) {
    const allThumbs = thumbsBox.querySelectorAll('.gallery-thumb');
    allThumbs.forEach((th, i) => {
      const active = (i === AppState.galleryIndex);
      th.classList.toggle('active', active);
      if (active && AppState.viewMode === 'mobile') {
        th.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });
  }

  // 若滿版預覽視窗開啟中，同步更新滿版大圖
  const lbModal = el('modal-gallery-lightbox');
  if (lbModal && lbModal.style.display !== 'none') {
    syncLightboxDisplay();
  }
}

/**
 * 開啟商品實拍照全螢幕滿版放大預覽器 (#modal-gallery-lightbox)
 */
function openGalleryLightbox() {
  const item = getActiveItem();
  if (!item) return;
  const lbModal = el('modal-gallery-lightbox');
  if (!lbModal) return;

  lbModal.style.display = 'flex';
  syncLightboxDisplay();
}

function closeGalleryLightbox() {
  const lbModal = el('modal-gallery-lightbox');
  if (lbModal) lbModal.style.display = 'none';
}

function syncLightboxDisplay() {
  const item = getActiveItem();
  if (!item) return;
  const images = (item.images && item.images.length) ? item.images : ['icon-512.png'];
  const total = images.length;
  if (AppState.galleryIndex >= total) AppState.galleryIndex = 0;

  if (el('lightbox-main-img')) el('lightbox-main-img').src = images[AppState.galleryIndex];
  if (el('lightbox-counter')) el('lightbox-counter').textContent = `${AppState.galleryIndex + 1} / ${total}`;
  if (el('lightbox-title')) el('lightbox-title').textContent = item.name || '商品實拍照滿版預覽';

  const strip = el('lightbox-thumbs');
  if (strip) {
    if (strip.dataset.itemId !== item.id || strip.children.length !== total) {
      strip.dataset.itemId = item.id;
      strip.innerHTML = '';
      images.forEach((src, i) => {
        const im = document.createElement('img');
        im.className = `lightbox-thumb-item ${i === AppState.galleryIndex ? 'active' : ''}`;
        im.src = src;
        im.alt = `預覽縮圖 ${i + 1}`;
        im.addEventListener('click', (e) => {
          e.stopPropagation();
          switchGalleryImage(i);
        });
        strip.appendChild(im);
      });
    } else {
      Array.from(strip.children).forEach((child, i) => {
        const isAct = (i === AppState.galleryIndex);
        child.classList.toggle('active', isAct);
        if (isAct) {
          child.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      });
    }
  }
}


/** 渲染出價歷史清單 (支援管理者完整解碼與買家隱私遮罩) */
function renderBidHistory() {
  const item = getActiveItem();
  const list = el('history-list');
  const countSpan = el('history-count');
  if (!list) return;

  if (!item) {
    list.innerHTML = '<div style="font-size:.78rem;color:var(--c-text-3);text-align:center;padding:12px;">尚無商品</div>';
    if (countSpan) countSpan.textContent = '0';
    return;
  }

  const history = item.bidHistory || [];
  if (countSpan) countSpan.textContent = history.length;

  if (!history.length) {
    list.innerHTML = '<div style="font-size:.78rem;color:var(--c-text-3);text-align:center;padding:12px;">尚無出價紀錄，成為第一位出標者！</div>';
    return;
  }

  list.innerHTML = '';
  history.slice().reverse().forEach((b, idx) => {
    const d = document.createElement('div');
    d.className = `history-item ${idx === 0 ? 'is-top' : ''}`;

    const isTopTag = idx === 0 ? '<span class="item-tab-badge badge-live" style="margin-right:4px;">目前最高</span>' : '';
    
    // 👑 管理者最高權限解碼視角 vs 一般買家隱私遮罩
    let userDisplay = '';
    if (AppState.isAdmin) {
      const rawPhone = b.phone || (b.contact && b.contact.phone) || '';
      const rawLine = b.line || (b.contact && b.contact.line) || '';
      const phoneLink = rawPhone ? `<a href="tel:${escapeHtml(rawPhone)}" class="buyer-phone-link" data-phone="${escapeHtml(rawPhone)}" title="點擊複製並撥打電話" style="padding:1px 6px;font-size:.72rem;margin-left:4px;">📞 ${escapeHtml(rawPhone)}</a>` : '';
      const lineTag = rawLine ? `<button type="button" class="buyer-contact-badge badge-line" data-line="${escapeHtml(rawLine)}" title="點擊複製 Line ID 並開啟 Line" style="font-size:.66rem;padding:1px 5px;margin-left:3px;">💬 Line: ${escapeHtml(rawLine)}</button>` : '';
      userDisplay = `<span class="history-user" style="font-weight:700;">👤 ${escapeHtml(b.user || b.bidderName || '買家')}</span>${phoneLink}${lineTag}`;
    } else {
      const maskedPhone = b.phoneMasked || (b.phone ? maskPhone(b.phone) : '');
      const phoneDisplay = maskedPhone ? ` (${maskedPhone})` : '';
      userDisplay = `<span class="history-user">${maskBuyerName(b.user || b.bidderName)}${phoneDisplay}</span>`;
    }

    d.innerHTML = `
      <div>
        ${isTopTag}
        ${userDisplay}
        <div class="history-time">${formatRelTime(b.time)}</div>
      </div>
      <div class="history-amt">${formatMoney(b.amount, AppState.activeCurrency)}</div>
    `;
    list.appendChild(d);
  });
}

/** 判斷商品是否具有有效出價紀錄 */
function hasItemBids(item) {
  if (!item) return false;
  const winnerName = getBidderName(item.topBidder);
  if (winnerName && winnerName !== '無人出標' && winnerName !== 'null') return true;
  if (item.bids && Object.keys(item.bids).length > 0) return true;
  if (item.bidHistory && item.bidHistory.length > 0) return true;
  return false;
}

/**
 * 🔄 一鍵重新開啟競標核心函式 (支援改價重開 + 多種時段)
 */
function restartAuctionItem(itemId, mode = 'reset24', durationHours = 24, newStartPrice = null) {
  if (!requireAdminAuth(() => restartAuctionItem(itemId, mode, durationHours, newStartPrice))) return;
  const item = AppState.items.find(i => i.id === itemId) || getActiveItem();
  if (!item) return;

  // 0. 暫停計時器並啟動重開鎖定視窗，徹底杜絕計時器與雲端監聽器競態回彈
  if (typeof timerIntervalId !== 'undefined' && timerIntervalId) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
  setItemRelistLock(item.id, 8000);

  const now = getServerNow();
  const parsedHours = Number(durationHours);
  const safeHours = (Number.isFinite(parsedHours) && parsedHours > 0) ? parsedHours : 24;
  let price = Number(newStartPrice);
  if (!Number.isFinite(price) || price <= 0) {
    price = Number(item.startPrice || 100);
  }

  // 1. 徹底歸零前檔結標、得標者、候補遞補、取貨期限與歷史出價紀錄，並設定全新未來截標時間
  item.relistSeq = Number(item.relistSeq || 0) + 1;
  item.reopenedAt = now;
  item.startPrice = price;
  item.currentPrice = price;
  item.currentBid = price;
  item.topBidder = '';
  item.topBidderContact = null;
  item.topBidTime = null;
  item.bids = {};
  item.bidHistory = [];
  item.winnerMsgs = [];
  item.winner = null;
  item.endedEarly = false;
  item.manualEnd = false;
  item.isEnded = false;
  item.pickupDeadline = null;
  item.pickedUpAt = null;
  item.backupOffer = null;
  item.backupState = null;
  item.finalDealPrice = null;
  item.defaultedBidders = [];
  item.status = 'live';
  item.auctionDone = false;
  item.auctionLive = true;
  item.timeMode = (mode === 'reset24') ? 'reset24' : 'fixed';
  item.endTime = now + safeHours * 3600 * 1000;
  item.autoRelistIfNoBids = (item.autoRelistIfNoBids !== false);

  // 2. 本機快取與前後台表單輸入值同步重置
  SafeStorage.set('agy_items', AppState.items);
  if (AppState.activeItemId === item.id && el('inp-bid-val')) {
    el('inp-bid-val').value = price;
  }
  if (typeof loadItemIntoEditForm === 'function') {
    loadItemIntoEditForm(item.id);
  }

  // 3. 畫面刷新並重啟倒數計時器
  renderItemTabs();
  renderActiveItemDisplay();
  renderBidHistory();
  renderWinnerStatus();
  renderAdminItemsList();
  startAuctionTimer();

  // 4. 解鎖底部出價按鈕與立即出價條
  const submitBidBtn = el('btn-submit-bid');
  if (submitBidBtn) {
    submitBidBtn.disabled = false;
    delete submitBidBtn.dataset.submitting;
  }
  const mobileBidBar = el('mobile-bid-bar');
  if (mobileBidBar) mobileBidBar.style.display = 'block';

  // 5. 跨端同步：更新本機伺服器 my_auction_data.json 與 Firebase（顯式送出 null 清除舊出價與結標欄位）
  syncToFirebase();
  syncToLocalServer();

  const durationLabel = (mode === 'reset24')
    ? '24 小時（動態重置模式）'
    : (safeHours >= 24 ? `${safeHours / 24} 天` : `${safeHours} 小時`);
  showToast(`🚀 商品【${item.name}】已成功重新開啟競標（${durationLabel}，起標價 NT$ ${price.toLocaleString()}）！`);
}

/** 渲染結標狀態與得標專屬卡片 (智慧區分有人得標與無人出標流標) */
function renderWinnerStatus() {
  const item = getActiveItem();
  const card = el('winner-card');
  const timerCard = el('timer-card');
  const bidBar = el('mobile-bid-bar');
  if (!card) return;

  if (!item) {
    card.classList.remove('show');
    return;
  }

  if (item.status === 'ended' || item.status === 'picked_up') {
    card.classList.add('show');
    if (bidBar) bidBar.style.display = 'none';

    const winnerName = getBidderName(item.topBidder);
    const hasBids = hasItemBids(item);

    const trophyIcon = el('winner-trophy-icon');
    const deadlineAlert = el('winner-deadline-alert');
    const adminContacts = el('winner-admin-contacts');
    const adminActions = el('winner-admin-actions');
    const chatSection = el('winner-chat-section') || card.querySelector('.winner-chat-section');
    const relistPanel = el('winner-relist-panel');

    if (hasBids) {
      // ── A. 有人得標情況 ──
      if (trophyIcon) trophyIcon.textContent = '🏆';
      if (timerCard) {
        el('timer-status-text').textContent = item.status === 'picked_up' ? '已完成取貨' : '競價成功・已結標';
        el('timer-status-chip').className = 'timer-status-chip ended';
      }
      el('winner-headline').textContent = (AppState.userProfile.name && AppState.userProfile.name === winnerName)
        ? '🎉 競價成功！恭喜您得標！'
        : '🎉 拍賣圓滿結標！';
      const dealAmount = item.finalDealPrice || item.currentPrice || item.currentBid || item.startPrice;
      const isBackupAccepted = item.backupOffer && item.backupOffer.status === 'accepted';
      el('winner-subline').textContent = `得標商品：${item.name}`;
      el('winner-name-tag').textContent = `${isBackupAccepted ? '遞補得標買家' : '得標買家'}：${maskBuyerName(winnerName)}`;
      el('winner-amount-tag').textContent = `${isBackupAccepted ? '💰 遞補優惠成交價' : '結標金額'}：${formatMoney(dealAmount, AppState.activeCurrency)}`;

      if (deadlineAlert) {
        deadlineAlert.style.display = 'block';
        el('winner-deadline-time').textContent = formatPickupDeadlineDisplay(item);
      }

      if (AppState.isAdmin) {
        if (adminContacts) adminContacts.style.display = 'block';
        if (adminActions) adminActions.style.display = 'block';
        renderWinnerContacts(item.topBidderContact || (typeof item.topBidder === 'object' ? item.topBidder : null));
      } else {
        if (adminContacts) adminContacts.style.display = 'none';
        if (adminActions) adminActions.style.display = 'none';
      }

      renderSellerWinnerContacts(true);

      if (chatSection) chatSection.style.display = 'block';
      renderWinnerMessages(item);

      // 渲染買家端「🎁 專屬遞補購買意願確認卡」（含賣家提供之遞補優惠價）
      renderBackupOfferConfirmCard(item);

      // 渲染管理員後台「🔄 棄標處理與次高價順位遞補優惠控制台」
      renderAdminBackupPanel(item);

      // 若管理員檢視已結標卡片，底部也提供重開競標控制台
      if (relistPanel) {
        relistPanel.style.display = AppState.isAdmin ? 'block' : 'none';
        if (el('winner-relist-price')) el('winner-relist-price').value = item.startPrice || 10000;
      }
    } else {
      // ── B. 無人出標（流標）情況 ──
      if (trophyIcon) trophyIcon.textContent = '⏳';
      if (timerCard) {
        el('timer-status-text').textContent = '競標已截止（無人出標）';
        el('timer-status-chip').className = 'timer-status-chip ended';
      }
      el('winner-headline').textContent = '⏳ 本檔期競標時間已結束（尚無人出標）';
      el('winner-subline').textContent = AppState.isAdmin
        ? '可由下方快速重新開啟競標，或調整起標價後再次發布'
        : '本檔期競標時間已截止，敬請期待賣家開啟下一檔期競標';
      el('winner-name-tag').textContent = '得標買家：無人出標（流標）';
      el('winner-amount-tag').textContent = `起標金額：${formatMoney(item.startPrice, AppState.activeCurrency)}`;

      // 強制隱藏取貨提醒、管理者聯絡、賣家聯絡、私訊留言板與取貨按鈕
      if (deadlineAlert) deadlineAlert.style.display = 'none';
      if (adminContacts) adminContacts.style.display = 'none';
      if (adminActions) adminActions.style.display = 'none';
      renderSellerWinnerContacts(false);
      if (chatSection) chatSection.style.display = 'none';
      if (el('backup-offer-confirm-card')) el('backup-offer-confirm-card').style.display = 'none';
      if (el('winner-backup-panel')) el('winner-backup-panel').style.display = AppState.isAdmin ? 'block' : 'none';
      if (AppState.isAdmin) renderAdminBackupPanel(item);

      // 僅限最高權限管理者顯示「重新開啟競標控制面板」
      if (relistPanel) {
        relistPanel.style.display = AppState.isAdmin ? 'block' : 'none';
        if (el('winner-relist-price')) el('winner-relist-price').value = item.startPrice || 10000;
      }
    }
  } else {
    card.classList.remove('show');
    renderSellerWinnerContacts(false);
    if (bidBar) bidBar.style.display = 'block';
    if (timerCard) {
      el('timer-status-text').textContent = '競標進行中';
      el('timer-status-chip').className = 'timer-status-chip live';
    }
  }
}

/** 跨裝置安全複製文字至剪貼簿（相容 HTTPS clipboard API 與本地 HTTP 備援） */
function copyTextToClipboard(text) {
  const val = String(text || '').trim();
  if (!val) return Promise.resolve(false);
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    return navigator.clipboard.writeText(val).then(() => true).catch(() => fallbackCopyText(val));
  }
  return Promise.resolve(fallbackCopyText(val));
}

function fallbackCopyText(val) {
  try {
    const ta = document.createElement('textarea');
    ta.value = val;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, val.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    return false;
  }
}

/** 全站統一「撥打電話」雙動能腳本：複製號碼 + Toast 提示 + 呼叫撥號盤 */
function triggerPhoneContact(phone) {
  const clean = String(phone || '').trim();
  if (!clean) return;
  copyTextToClipboard(clean);
  showToast(`📋 已複製電話號碼：${clean}（若使用手機將為您開啟撥號盤）`);
  try {
    const a = document.createElement('a');
    a.href = `tel:${clean}`;
    a.setAttribute('data-bypass-contact-intercept', '1');
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (e) {}
}

/** 全站統一「Line ID 加好友」雙動能腳本：複製 ID + Toast 提示 + 開啟 Line App / 網頁加友連結 */
function triggerLineContact(lineId) {
  const clean = String(lineId || '').trim();
  if (!clean) return;
  const pathSeg = clean.startsWith('@') ? encodeURIComponent(clean) : `~${encodeURIComponent(clean)}`;
  const webUrl = `https://line.me/R/ti/p/${pathSeg}`;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');

  copyTextToClipboard(clean);
  showToast(`✅ 已自動複製 Line ID：${clean}！正在開啟 Line，您可直接貼上搜尋加好友`);

  if (isMobile) {
    try {
      window.location.href = `line://ti/p/${pathSeg}`;
      setTimeout(() => {
        window.open(webUrl, '_blank', 'noopener');
      }, 700);
    } catch (e) {
      window.open(webUrl, '_blank', 'noopener');
    }
  } else {
    window.open(webUrl, '_blank', 'noopener');
  }
}

/** 渲染得標者聯絡按鈕管道 */
function renderWinnerContacts(contact) {
  const box = el('winner-contacts-list');
  if (!box) return;
  box.innerHTML = '';
  if (!contact) {
    box.innerHTML = '<span style="font-size:.78rem;color:var(--c-text-3);">買家未填寫詳細聯絡資料</span>';
    return;
  }
  if (contact.phone) {
    box.innerHTML += `<a href="tel:${escapeHtml(contact.phone)}" class="contact-btn phone" data-phone="${escapeHtml(contact.phone)}" title="點擊複製電話並撥號">📞 撥打電話 (${escapeHtml(contact.phone)})</a>`;
  }
  if (contact.line) {
    const cleanLine = String(contact.line).trim();
    const pathSeg = cleanLine.startsWith('@') ? encodeURIComponent(cleanLine) : `~${encodeURIComponent(cleanLine)}`;
    box.innerHTML += `<a href="https://line.me/R/ti/p/${pathSeg}" target="_blank" rel="noopener" class="contact-btn line" data-line="${escapeHtml(cleanLine)}" title="點擊複製 Line ID 並開啟 Line">💬 Line ID: ${escapeHtml(cleanLine)}</a>`;
  }
  if (contact.ig) {
    box.innerHTML += `<a href="https://instagram.com/${escapeHtml(contact.ig)}" target="_blank" rel="noopener" class="contact-btn ig">📸 IG: ${escapeHtml(contact.ig)}</a>`;
  }
  if (contact.fb) {
    const fbHref = contact.fb.startsWith('http') ? contact.fb : `https://facebook.com/${contact.fb}`;
    box.innerHTML += `<a href="${escapeHtml(fbHref)}" target="_blank" rel="noopener" class="contact-btn fb">👤 FB 聯絡</a>`;
  }
}

/** 渲染賣家官方聯絡管道（供得標買家一鍵撥打與加 Line 確認取貨） */
function renderSellerWinnerContacts(show) {
  const wrap = el('winner-seller-contacts');
  const box = el('winner-seller-contacts-list');
  if (!wrap || !box) return;
  if (!show) {
    wrap.style.display = 'none';
    box.innerHTML = '';
    return;
  }
  const sellerPhone = '0931849482';
  const sellerLine = 'guess_chen1981';
  wrap.style.display = 'block';
  box.innerHTML = `
    <a href="tel:${sellerPhone}" class="contact-btn phone" data-phone="${sellerPhone}" title="點擊複製電話並聯絡建生工坊">📞 撥打電話 (${sellerPhone})</a>
    <a href="https://line.me/R/ti/p/~${sellerLine}" target="_blank" rel="noopener" class="contact-btn line" data-line="${sellerLine}" title="點擊複製 Line ID 並加建生工坊好友">💬 Line ID: ${sellerLine}</a>
  `;
}

/** 渲染得標者專屬私訊留言板 */
function renderWinnerMessages(item) {
  const msgsBox = el('winner-chat-msgs');
  if (!msgsBox) return;
  const msgs = item.winnerMsgs || [];
  msgsBox.innerHTML = '';

  if (!msgs.length) {
    msgsBox.innerHTML = '<div style="font-size:.78rem;color:var(--c-text-3);text-align:center;padding:10px 0;">尚無私訊紀錄，請於此處發送訊息確認交割事宜</div>';
    return;
  }

  msgs.forEach(m => {
    const d = document.createElement('div');
    d.className = `winner-chat-item ${m.isSeller ? 'seller' : 'buyer'}`;
    const who = m.isSeller ? '🛡️ 賣家' : `👤 買家 ${maskBuyerName(m.sender)}`;
    d.innerHTML = `
      <div style="font-size:.68rem;color:var(--c-text-3);margin-bottom:2px;font-weight:700;">
        ${who} · ${formatRelTime(m.time)}
      </div>
      <div>${escapeHtml(m.text)}</div>
    `;
    msgsBox.appendChild(d);
  });
  msgsBox.scrollTop = msgsBox.scrollHeight;
}

/* ─────────────────────────────────────────────────────────────
   8. 現代化流水式 Q&A 問答討論串模組 (輕量瘦身版 + 單則回覆獨立刪除 + 收合式罐頭快回)
   ───────────────────────────────────────────────────────────── */

/** 賣家常用罐頭快捷回覆預設 12 組詞庫 */
const QA_CANNED_REPLIES = [
  { id: 'canned_in_stock', label: '📦 已有貨', text: '此商品目前還有現貨' },
  { id: 'canned_pickup', label: '🏠 可自取', text: '歡迎預約現場看機自取' },
  { id: 'canned_reserved', label: '🔒 已保留', text: '目前已為得標買家保留中，若逾時棄標將依序開放遞補' },
  { id: 'canned_working', label: '💻 機況正常', text: '各項功能與機況皆經實測正常' },
  { id: 'canned_bid', label: '💰 請直接出標', text: '競標進行中，歡迎直接於頁面上加價出標參與' },
  { id: 'canned_schedule', label: '📅 約時間看機', text: '歡迎透過問答或得標後私訊約定方便的時段現場看機' },
  { id: 'canned_no_haggle', label: '🙅‍♂️ 恕不議價', text: '本賣場採公開競標制，一律以系統出價為準，恕不接受私下議價' },
  { id: 'canned_accessories', label: '🔌 附完整配件', text: '隨附原廠變壓器／必要電源線材，入手即可直接使用' },
  { id: 'canned_onsite_test', label: '🛡️ 現場測試交機', text: '支援現場開機實測，確認功能滿意後再取走，保障雙方權益' },
  { id: 'canned_xiaogang', label: '📍 小港桂林自取', text: '自取地點位於高雄小港區桂林（透天 1～3 樓），得標後提供詳細位置' },
  { id: 'canned_flexible_time', label: '🕒 自取時段彈性', text: '平假日白天或晚間皆可配合預約，出發前請先聯繫確認' },
  { id: 'canned_pickup_only', label: '🚚 限自取不寄送', text: '為確保商品完好與交易安全，本品項僅限現場自取自搬，暫不開放寄送' }
];

/** 取得完整快答清單（內建 12 組 ＋ 賣家雲端自訂詞庫） */
function getAllCannedReplies() {
  const presets = QA_CANNED_REPLIES.map(c => ({ ...c, isCustom: false }));
  const customs = (Array.isArray(AppState.customCannedReplies) ? AppState.customCannedReplies : [])
    .filter(c => c && c.label && c.text)
    .map(c => ({
      id: String(c.id || ('custom_' + encodeURIComponent(c.label))),
      label: String(c.label).trim(),
      text: String(c.text).trim(),
      isCustom: true
    }));
  return [...presets, ...customs];
}

/** 清理單句前後問候與標點，供智慧多選串接使用 */
function normalizeCannedClause(text) {
  return String(text || '')
    .trim()
    .replace(/^您好[！!，,、\s]*/, '')
    .replace(/[。！!，,]+$/, '');
}

/** 智慧組合多選快答語句：開頭自動加一次「您好！」，句間自然連接，結尾補句號並保留手動補充內容 */
function composeSmartCannedReply(clauses, manualText = '') {
  const cleanClauses = (clauses || []).map(normalizeCannedClause).filter(Boolean);
  const cleanManual = String(manualText || '').trim();
  if (!cleanClauses.length && !cleanManual) return '';
  if (!cleanClauses.length) return cleanManual;

  const body = cleanClauses.map((c, idx) => {
    if (idx === cleanClauses.length - 1) return `${c}。`;
    return (c.length >= 24 && cleanClauses.length > 2) ? `${c}。` : `${c}，`;
  }).join('');

  const cannedFull = `您好！${body}`;
  return cleanManual ? `${cannedFull} ${cleanManual}` : cannedFull;
}

/** 從目前輸入框內容分離「前次自動組合句」與「管理員手動打字補充內容」，確保反覆切換不遺失手打字 */
function extractManualTextPreservingEdit(currentVal, prevComposed) {
  const raw = String(currentVal || '');
  const prev = String(prevComposed || '');
  if (!raw.trim()) return '';
  if (!prev) return raw.trim();

  if (raw.startsWith(prev)) {
    return raw.slice(prev.length).trim();
  }
  const idx = raw.indexOf(prev);
  if (idx !== -1) {
    return (raw.slice(0, idx) + ' ' + raw.slice(idx + prev.length)).trim();
  }
  // 容錯：若使用者小幅刪改了前段最後標點
  const prevCore = prev.replace(/[。！!，,]+$/, '');
  if (prevCore && raw.includes(prevCore)) {
    return raw.replace(prevCore, '').replace(/^[。！!，,\s]+/, '').trim();
  }
  return raw.trim();
}

/** 自動依據內容高度撐開 Q&A 回覆輸入框，避免出現狹窄高度與白色捲軸 */
function autoResizeQATextarea(textarea) {
  if (!textarea) return;
  textarea.style.height = 'auto';
  const nextHeight = Math.min(Math.max(textarea.scrollHeight, 54), 220);
  textarea.style.height = `${nextHeight}px`;
  textarea.style.overflowY = textarea.scrollHeight > 220 ? 'auto' : 'hidden';
}

/** 共用建立「12 組預設 ＋ 自訂快答 ＋ 管理鈕」標籤列 HTML */
function buildCannedChipsHtml(itemId, qaKey, inputPrefix = 'inp-reply-') {
  const boxKey = `${inputPrefix}${qaKey}`;
  const selectedIds = Array.isArray(AppState.qaSelectedCannedMap?.[boxKey]) ? AppState.qaSelectedCannedMap[boxKey] : [];
  const allCanned = getAllCannedReplies();
  const chips = allCanned.map(c => {
    const isSelected = selectedIds.includes(c.id);
    return `<button type="button" class="btn-qa-canned ${c.isCustom ? 'is-custom' : ''} ${isSelected ? 'is-selected' : ''}" data-canned-id="${escapeHtml(c.id)}" ${itemId ? `data-item-id="${escapeHtml(itemId)}"` : ''} data-qa-key="${escapeHtml(qaKey)}" data-input-prefix="${escapeHtml(inputPrefix)}" data-label="${escapeHtml(c.label)}" data-reply-text="${escapeHtml(c.text)}" title="${escapeHtml(c.text)}"><span class="canned-check-mark">✓</span><span>${escapeHtml(c.label)}</span></button>`;
  }).join('');
  const managerBtn = AppState.isAdmin
    ? `<button type="button" class="btn-open-canned-manager" title="新增、編輯或刪除賣家自訂快答詞庫（雲端同步）">➕ 自訂快答</button>`
    : '';
  return `${chips}${managerBtn}`;
}

/** 載入本機快取之賣家自訂快答詞庫 */
function loadSavedCustomCannedReplies() {
  try {
    const saved = SafeStorage.get('agy_custom_canned_replies');
    if (Array.isArray(saved)) {
      AppState.customCannedReplies = saved.filter(c => c && c.label && c.text);
    }
  } catch (e) {}
}

/** 將自訂快答詞庫同步儲存至本機快取與 Firebase 雲端 (settings/shop/customCannedReplies) */
function syncCustomCannedRepliesToCloud() {
  const list = Array.isArray(AppState.customCannedReplies) ? AppState.customCannedReplies : [];
  SafeStorage.set('agy_custom_canned_replies', list);
  const db = FirebaseManager.getDb();
  if (db) {
    db.ref('settings/shop/customCannedReplies').set(list.length ? list : null).catch(err => {
      console.warn('同步自訂快答詞庫至 Firebase 失敗:', err);
    });
  }
  try { renderQA(true, null); } catch (e) {}
  try { renderAdminAllQA(); } catch (e) {}
}

/** 開啟「➕ 自訂快答」詞庫管理彈窗 */
function openCustomCannedModal() {
  if (!requireAdminAuth(() => openCustomCannedModal())) return;
  resetCustomCannedForm();
  renderCustomCannedManagerList();
  el('modal-canned-replies')?.classList.add('show');
}

function closeCustomCannedModal() {
  el('modal-canned-replies')?.classList.remove('show');
  resetCustomCannedForm();
}

function resetCustomCannedForm() {
  if (el('inp-custom-canned-edit-id')) el('inp-custom-canned-edit-id').value = '';
  if (el('inp-custom-canned-label')) el('inp-custom-canned-label').value = '';
  if (el('inp-custom-canned-text')) el('inp-custom-canned-text').value = '';
  if (el('btn-save-custom-canned')) el('btn-save-custom-canned').textContent = '➕ 新增並同步雲端';
  if (el('btn-cancel-edit-custom-canned')) el('btn-cancel-edit-custom-canned').style.display = 'none';
}

function renderCustomCannedManagerList() {
  const container = el('custom-canned-replies-list');
  const badge = el('custom-canned-count-badge');
  if (!container) return;
  const list = Array.isArray(AppState.customCannedReplies) ? AppState.customCannedReplies : [];
  if (badge) badge.textContent = `${list.length} 組自訂`;

  if (!list.length) {
    container.innerHTML = '<div style="font-size:.78rem;color:var(--c-text-3);text-align:center;padding:14px;border:1px dashed rgba(255,255,255,0.1);border-radius:8px;">尚未新增自訂快答，可使用上方表單建立常用語句！</div>';
    return;
  }

  container.innerHTML = '';
  list.forEach((item, idx) => {
    const row = document.createElement('div');
    row.className = 'custom-canned-row';
    row.innerHTML = `
      <div class="custom-canned-row-info">
        <div class="custom-canned-row-label">${escapeHtml(item.label)}</div>
        <div class="custom-canned-row-text">${escapeHtml(item.text)}</div>
      </div>
      <div class="custom-canned-row-actions">
        <button type="button" class="tbtn tbtn-ghost tbtn-xs btn-edit-custom-canned" data-idx="${idx}" title="編輯此自訂快答">✏️ 編輯</button>
        <button type="button" class="tbtn tbtn-danger tbtn-xs btn-del-custom-canned" data-idx="${idx}" title="刪除此自訂快答">🗑️</button>
      </div>
    `;
    row.querySelector('.btn-edit-custom-canned')?.addEventListener('click', () => {
      if (el('inp-custom-canned-edit-id')) el('inp-custom-canned-edit-id').value = item.id;
      if (el('inp-custom-canned-label')) el('inp-custom-canned-label').value = item.label;
      if (el('inp-custom-canned-text')) el('inp-custom-canned-text').value = item.text;
      if (el('btn-save-custom-canned')) el('btn-save-custom-canned').textContent = '💾 儲存修改並同步雲端';
      if (el('btn-cancel-edit-custom-canned')) el('btn-cancel-edit-custom-canned').style.display = 'inline-flex';
      el('inp-custom-canned-label')?.focus();
    });
    row.querySelector('.btn-del-custom-canned')?.addEventListener('click', () => {
      deleteCustomCannedReply(item.id);
    });
    container.appendChild(row);
  });
}

function saveCustomCannedReply() {
  if (!requireAdminAuth(() => saveCustomCannedReply())) return;
  const editId = el('inp-custom-canned-edit-id')?.value.trim() || '';
  const label = el('inp-custom-canned-label')?.value.trim() || '';
  const rawText = el('inp-custom-canned-text')?.value.trim() || '';
  const text = normalizeCannedClause(rawText);
  if (!label || !text) {
    showToast('⚠️ 請填寫「按鈕標籤」與「回覆語句內容」！');
    return;
  }

  if (!Array.isArray(AppState.customCannedReplies)) AppState.customCannedReplies = [];
  if (editId) {
    const target = AppState.customCannedReplies.find(c => c.id === editId);
    if (target) {
      target.label = label;
      target.text = text;
      target.updatedAt = Date.now();
    } else {
      AppState.customCannedReplies.push({ id: editId, label, text, createdAt: Date.now() });
    }
    showToast(`💾 已更新自訂快答「${label}」並同步至雲端！`);
  } else {
    const newId = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    AppState.customCannedReplies.push({ id: newId, label, text, createdAt: Date.now() });
    showToast(`✅ 已新增自訂快答「${label}」並同步至雲端！`);
  }

  resetCustomCannedForm();
  syncCustomCannedRepliesToCloud();
  renderCustomCannedManagerList();
}

function deleteCustomCannedReply(cannedId) {
  if (!requireAdminAuth(() => deleteCustomCannedReply(cannedId))) return;
  if (!Array.isArray(AppState.customCannedReplies)) return;
  const target = AppState.customCannedReplies.find(c => c.id === cannedId);
  AppState.customCannedReplies = AppState.customCannedReplies.filter(c => c.id !== cannedId);
  syncCustomCannedRepliesToCloud();
  renderCustomCannedManagerList();
  showToast(`🗑️ 已刪除自訂快答${target ? `「${target.label}」` : ''}並同步雲端！`);
}

/** 判斷一則提問是否處於「待賣家回覆」狀態（含買家後續追問但賣家尚未回覆） */
function isQuestionUnanswered(q) {
  if (!q) return false;
  const replies = Array.isArray(q.replies) ? q.replies.filter(r => r && r.text) : [];
  const hasMainReply = Boolean(q.reply && String(q.reply).trim());
  if (replies.length > 0) {
    const lastFloor = replies[replies.length - 1];
    if (!lastFloor.isSeller) {
      if (!hasMainReply || Number(lastFloor.time || 0) > Number(q.replyTime || 0)) {
        return true;
      }
    }
    const hasSellerFloor = replies.some(r => r.isSeller);
    if (hasSellerFloor || hasMainReply) {
      return false;
    }
  }
  return !hasMainReply;
}

/** 計算單則留言的熱門討論度分數（依按讚數、回覆樓層數與官方回覆加權） */
function getQuestionHeatScore(q) {
  if (!q) return 0;
  const likes = Number(q.likes || 0);
  const repliesCount = Array.isArray(q.replies) ? q.replies.length : 0;
  const hasMainReply = (q.reply && String(q.reply).trim()) ? 1 : 0;
  return (likes * 3) + (repliesCount * 2) + hasMainReply;
}

/** 判斷是否為目前登入買家本人發表的提問 */
function isQuestionMine(q) {
  if (!q || !AppState.userProfile) return false;
  const myPhone = String(AppState.userProfile.phone || '').replace(/[^0-9]/g, '');
  const qPhone = String(q.phone || '').replace(/[^0-9]/g, '');
  if (myPhone && qPhone && myPhone === qPhone) return true;
  const myName = String(AppState.userProfile.name || '').trim();
  const qName = String(q.user || '').trim();
  return Boolean(myName && qName && myName === qName);
}

/** 格式化問答時間（相對時間 + 月/日 時:分） */
function formatQAStreamTime(ts) {
  if (!ts) return '剛剛';
  const rel = formatRelTime(ts);
  try {
    const d = new Date(Number(ts));
    if (isNaN(d.getTime())) return rel;
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${rel} (${mm}/${dd} ${hh}:${mi})`;
  } catch (e) {
    return rel;
  }
}

/** 取得目前裝置已按讚的問答紀錄 */
function getLikedQAMap() {
  try {
    return SafeStorage.get('agy_qa_liked_map') || {};
  } catch (e) {
    return {};
  }
}

/** 切換問答區的排序與篩選模式（保持捲軸位置絕不亂跳） */
function setQAFilterMode(mode) {
  const validModes = ['latest', 'hot', 'unanswered', 'mine'];
  AppState.qaFilterMode = validModes.includes(mode) ? mode : 'latest';
  const prevScroll = window.scrollY;
  renderQA(true, null);
  window.scrollTo({ top: prevScroll, behavior: 'instant' });
}

/** 切換後台問答總覽的篩選模式 */
function setAdminQAFilterMode(mode) {
  const validModes = ['all', 'unanswered', 'hot'];
  AppState.adminQaFilterMode = validModes.includes(mode) ? mode : 'all';
  const prevScroll = window.scrollY;
  renderAdminAllQA();
  window.scrollTo({ top: prevScroll, behavior: 'instant' });
}

/** 建立單筆問答留言串 DOM 節點（支援主回覆與子樓層獨立刪除、收合式罐頭快答、歷史樓層摺疊、雙工作台 ID 隔離） */
function buildSingleQAStreamNode(item, k, q, floorNum, likedMap, topBidderName, bidderSet, highlightKey, idPrefix = '') {
  const isUnans = isQuestionUnanswered(q);
  const isMine = isQuestionMine(q);
  const isBlack = isBuyerBlacklisted(q.phone, q.user);
  const authorRaw = String(q.user || '買家').trim();
  const isTopBidder = Boolean(topBidderName && authorRaw === topBidderName);
  const isHistoryBidder = bidderSet.has(authorRaw);

  const streamItem = document.createElement('div');
  streamItem.className = `qa-stream-item ${isUnans ? 'is-unanswered' : ''} ${highlightKey === k ? 'qa-just-updated' : ''}`;
  streamItem.dataset.qaKey = k;
  streamItem.id = `qa-item-${k}`;

  // 1. 左側頭像與身分標示
  const avatarChar = authorRaw ? authorRaw.charAt(0).toUpperCase() : '買';
  const avatarClass = isBlack
    ? 'is-blacklisted'
    : (isTopBidder ? 'is-top-bidder' : (isMine ? 'is-mine' : ''));

  // 2. 身分徽章與狀態標籤
  let roleBadgesHtml = '';
  if (isTopBidder) {
    roleBadgesHtml += `<span class="qa-role-badge role-top">👑 最高出價</span>`;
  } else if (isHistoryBidder) {
    roleBadgesHtml += `<span class="qa-role-badge role-bidder">🔨 競標買家</span>`;
  }
  if (isMine) {
    roleBadgesHtml += `<span class="qa-role-badge role-mine">🙋 我的提問</span>`;
  }
  if (isBlack && AppState.isAdmin) {
    roleBadgesHtml += `<span class="item-tab-badge" style="background:#ef4444;color:#fff;font-size:.62rem;padding:0 5px;">🚫 黑名單</span>`;
  }
  roleBadgesHtml += isUnans
    ? `<span class="qa-role-badge role-pending">⏳ 待回覆</span>`
    : `<span class="qa-role-badge role-replied">✅ 已回覆</span>`;

  // 3. 發問者顯示名稱（管理者可見完整真實姓名，一般買家自動遮罩）
  const displayAuthorName = AppState.isAdmin ? escapeHtml(authorRaw) : escapeHtml(maskBuyerName(authorRaw));

  // 4. 管理者專屬解碼個資條（超緊湊單列）
  let adminContactStripHtml = '';
  if (AppState.isAdmin) {
    const phoneHtml = q.phone
      ? `<a href="tel:${escapeHtml(q.phone)}" class="buyer-phone-link" data-phone="${escapeHtml(q.phone)}" title="點擊複製並撥打電話" style="padding:0 5px;font-size:.68rem;">📞 ${escapeHtml(q.phone)}</a>
         <button type="button" class="tbtn tbtn-ghost tbtn-xs btn-copy-phone" data-phone="${escapeHtml(q.phone)}" style="padding:0 4px;font-size:.64rem;">📋</button>`
      : '<span style="color:var(--c-text-3);">未留電話</span>';
    const lineHtml = q.line
      ? `<button type="button" class="buyer-contact-badge badge-line" data-line="${escapeHtml(q.line)}" title="點擊複製 Line ID 並開啟 Line" style="font-size:.64rem;padding:0 5px;">💬 Line: ${escapeHtml(q.line)}</button>
         <button type="button" class="tbtn tbtn-ghost tbtn-xs btn-copy-line" data-line="${escapeHtml(q.line)}" style="padding:0 4px;font-size:.64rem;">📋</button>`
      : '';
    const igHtml = q.ig ? `<span class="buyer-contact-badge badge-ig" style="font-size:.64rem;padding:0 5px;">IG: ${escapeHtml(q.ig)}</span>` : '';
    const fbHtml = q.fb ? `<span class="buyer-contact-badge badge-fb" style="font-size:.64rem;padding:0 5px;">FB: ${escapeHtml(q.fb)}</span>` : '';
    const blackBtnHtml = q.phone
      ? `<button type="button" class="tbtn ${isBlack ? 'tbtn-gold' : 'tbtn-danger'} tbtn-xs btn-toggle-blacklist" data-phone="${escapeHtml(q.phone)}" data-name="${escapeHtml(authorRaw)}" style="padding:0 5px;font-size:.64rem;">${isBlack ? '🔓 解封' : '🚫 封鎖'}</button>`
      : '';
    const delBtnHtml = `<button type="button" class="btn-del-qa" data-qa-key="${k}" title="刪除此整筆提問" style="margin-left:auto;font-size:.65rem;padding:0 5px;">🗑️ 刪除提問</button>`;

    adminContactStripHtml = `
      <div class="qa-admin-contact-strip">
        <span style="color:var(--c-gold-1);font-weight:800;">🔓 個資：</span>
        ${phoneHtml}
        ${lineHtml}
        ${igHtml}
        ${fbHtml}
        ${blackBtnHtml}
        ${delBtnHtml}
      </div>
    `;
  }

  // 5. 組裝「賣家官方回覆」與「多樓層對話串 (q.replies)」，並賦予每一筆回覆獨立刪除座標 (floorType, replyIdx)
  const floors = [];
  if (q.reply && String(q.reply).trim()) {
    floors.push({
      floorType: 'main',
      replyIdx: -1,
      isSeller: true,
      author: AppState.studioName || '建生工坊賣家',
      text: q.reply,
      time: q.replyTime || q.time,
      isMainReply: true
    });
  }
  if (Array.isArray(q.replies)) {
    q.replies.forEach((rep, rIdx) => {
      if (rep && rep.text) {
        floors.push({
          floorType: 'sub',
          replyIdx: rIdx,
          isSeller: Boolean(rep.isSeller),
          author: rep.author || (rep.isSeller ? (AppState.studioName || '建生工坊賣家') : authorRaw),
          text: rep.text,
          time: rep.time
        });
      }
    });
  }

  let repliesHtml = '';
  if (floors.length > 0) {
    const isHistoryExpanded = Boolean(AppState.expandedHistoryFloorsMap && AppState.expandedHistoryFloorsMap[k]);
    const shouldCollapseOlderFloors = floors.length > 2 && !isHistoryExpanded;
    const visibleFloors = shouldCollapseOlderFloors ? floors.slice(floors.length - 1) : floors;
    const hiddenFloorCount = floors.length - visibleFloors.length;

    const collapseFloorsBtnHtml = floors.length > 2
      ? `<button type="button" class="qa-collapse-toggle-bar btn-toggle-floor-history" data-qa-key="${k}">
           <span>${shouldCollapseOlderFloors ? `📂 展開較早的 ${hiddenFloorCount} 則歷史回覆 ▼` : `🔼 收合較早的回覆對話（共 ${floors.length} 則）`}</span>
         </button>`
      : '';

    const floorsInner = visibleFloors.map((fl) => {
      const dispIdx = floors.indexOf(fl) + 1;
      const badgeHtml = fl.isSeller
        ? `<span class="qa-seller-badge">🛡️ 賣家官方回覆（建生工坊）${floors.length > 1 ? ` #${dispIdx}` : ''} ✓</span>`
        : `<span class="qa-buyer-floor-badge">💬 ${AppState.isAdmin ? escapeHtml(fl.author) : escapeHtml(maskBuyerName(fl.author))} 追問 #${dispIdx}</span>`;

      // 👑 最高權限管理者專屬：每一筆回覆旁皆具備獨立「🗑️ 刪除此回覆」按鈕（一般買家不可見）
      const delSingleReplyBtnHtml = AppState.isAdmin
        ? `<button type="button" class="btn-del-single-reply"
             data-item-id="${escapeHtml(item.id)}"
             data-qa-key="${escapeHtml(k)}"
             data-floor-type="${fl.floorType}"
             data-reply-idx="${fl.replyIdx}"
             title="僅刪除此筆回覆記錄（保留買家原提問）">
             🗑️ 刪除此回覆
           </button>`
        : '';

      return `
        <div class="qa-reply-floor ${fl.isSeller ? 'is-seller' : 'is-buyer'}">
          <div class="qa-reply-floor-hd">
            ${badgeHtml}
            <div class="qa-reply-floor-meta-right">
              <span class="qa-stream-time">${formatQAStreamTime(fl.time)}</span>
              ${delSingleReplyBtnHtml}
            </div>
          </div>
          <div class="qa-reply-floor-text">${escapeHtml(fl.text)}</div>
        </div>
      `;
    }).join('');

    repliesHtml = `
      <div class="qa-thread-replies">
        ${collapseFloorsBtnHtml}
        ${floorsInner}
      </div>
    `;
  }

  // 6. 互動列（按讚熱度、買家追問按鈕、以及管理者專屬「💬 回覆此提問」收合開關按鈕）
  const likeCount = Number(q.likes || 0);
  const isLiked = Boolean(likedMap[k]);
  const isSuperAdmin = Boolean(AppState.isAdmin && AppState.isAdminAuthenticated);
  const wasManuallyCollapsed = Boolean(AppState.manuallyCollapsedAdminReplyMap && AppState.manuallyCollapsedAdminReplyMap[k]);
  const isAdminBoxOpen = Boolean(
    (AppState.expandedAdminReplyMap && AppState.expandedAdminReplyMap[k]) ||
    (isSuperAdmin && isUnans && !wasManuallyCollapsed)
  );
  const inputPrefix = `${idPrefix}inp-reply-`;
  const boxPrefix = `${idPrefix}qa-admin-reply-box-`;
  const followupBoxId = `${idPrefix}qa-followup-box-${k}`;
  const followupInpId = `${idPrefix}inp-qa-followup-${k}`;

  const adminReplyToggleBtnHtml = AppState.isAdmin
    ? `<button type="button" class="qa-action-btn btn-qa-admin-reply-toggle ${isUnans ? 'is-unanswered-btn' : ''} ${isAdminBoxOpen ? 'active' : ''}" data-qa-key="${k}" data-box-prefix="${boxPrefix}" data-input-prefix="${inputPrefix}" data-unans="${isUnans ? '1' : '0'}" title="展開或收合賣家罐頭快答與回覆面板">
         <span>💬</span>
         <span>${isAdminBoxOpen ? '收合回覆面板 ▲' : (isUnans ? '回覆此提問 ▼' : '回覆 / 罐頭快答 ▼')}</span>
       </button>`
    : '';

  const actionsHtml = `
    <div class="qa-stream-actions">
      <button type="button" class="qa-action-btn btn-qa-like ${isLiked ? 'liked' : ''}" data-qa-key="${k}" title="對此問題按讚或表示同問">
        <span>👍</span>
        <span>讚 (${likeCount})</span>
      </button>
      <button type="button" class="qa-action-btn btn-qa-followup-toggle" data-qa-key="${k}" data-followup-box-id="${followupBoxId}" data-followup-inp-id="${followupInpId}" title="在此討論串下方追加提問或補充">
        <span>💬</span>
        <span>追問 (${floors.length})</span>
      </button>
      ${adminReplyToggleBtnHtml}
    </div>
  `;

  // 7. 買家樓中樓追問輸入框
  const buyerFollowupHtml = `
    <div class="qa-buyer-followup-box" id="${followupBoxId}">
      <div style="display:flex;gap:5px;align-items:center;">
        <input type="text" class="form-input" id="${followupInpId}" data-qa-key="${k}" maxlength="250"
          placeholder="輸入您想繼續追問或補充的內容…" style="height:32px;font-size:.78rem;flex:1;" />
        <button type="button" class="tbtn tbtn-purple tbtn-xs btn-submit-qa-followup" data-qa-key="${k}" data-followup-inp-id="${followupInpId}" style="height:32px;padding:0 10px;">
          送出追問
        </button>
      </div>
    </div>
  `;

  // 8. 管理者專屬：收合式「12 組一鍵罐頭快答 ＋ 智慧多選組合 ＋ 自訂詞庫」（最高管理者待回覆自動展開，其餘點擊展開）
  let adminReplyBoxHtml = '';
  if (AppState.isAdmin) {
    const draftKey = `${inputPrefix}${k}`;
    const savedDraft = (AppState.qaDraftTextMap && AppState.qaDraftTextMap[draftKey]) ? AppState.qaDraftTextMap[draftKey] : '';
    const cannedBtns = buildCannedChipsHtml('', k, inputPrefix);

    adminReplyBoxHtml = `
      <div class="qa-admin-reply-box ${isAdminBoxOpen ? 'show' : ''}" id="${boxPrefix}${k}">
        <div class="qa-canned-toolbar">
          <span class="qa-canned-title">⚡ 賣家一鍵罐頭快答（可複選智慧組合）：</span>
          <label class="qa-instant-send-lbl" title="勾選後點擊單一罐頭將直接送出；取消勾選則可多選標籤智慧串接後再送出">
            <input type="checkbox" class="chk-qa-instant-canned" ${AppState.qaInstantCannedSend ? 'checked' : ''} style="accent-color:var(--c-gold-1);" />
            <span>⚡ 點擊罐頭句立即送出</span>
          </label>
        </div>
        <div class="qa-canned-chips-row">
          ${cannedBtns}
        </div>
        <div class="qa-admin-input-row">
          <textarea class="qa-admin-textarea" placeholder="${q.reply ? '輸入新內容以覆蓋主回覆，或點選上方多組快答自動組句（支援 Ctrl+Enter 送出）…' : '點選上方快答標籤自動組合回覆，或手動輸入補充說明（支援 Ctrl+Enter 送出）…'}" maxlength="600" id="${inputPrefix}${k}">${escapeHtml(savedDraft)}</textarea>
          <div class="qa-admin-btn-group">
            <button type="button" class="btn-clear-qa-draft" data-qa-key="${k}" data-input-prefix="${inputPrefix}" title="一鍵取消所有已選快答標籤並清空文字">🧹 清空重選</button>
            <button type="button" class="tbtn tbtn-purple tbtn-xs btn-submit-qa-reply" data-qa-key="${k}" data-input-prefix="${inputPrefix}" style="height:34px;padding:0 11px;font-weight:800;">
              ${q.reply ? '✏️ 覆蓋主回覆' : '🚀 送出回覆'}
            </button>
            ${q.reply ? `<button type="button" class="tbtn tbtn-gold tbtn-xs btn-append-qa-floor" data-qa-key="${k}" data-input-prefix="${inputPrefix}" title="保留現有回覆並新增一樓官方補充回覆" style="height:34px;padding:0 9px;font-weight:800;">➕ 加蓋樓層</button>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  streamItem.innerHTML = `
    <div class="qa-avatar-col">
      <div class="qa-avatar ${avatarClass}" title="${displayAuthorName}">${escapeHtml(avatarChar)}</div>
      <div class="qa-timeline-line"></div>
    </div>
    <div class="qa-stream-main">
      <div class="qa-stream-header">
        <div class="qa-stream-user-group">
          <span class="qa-floor-tag">#${floorNum}F</span>
          <span class="qa-author-name">${displayAuthorName}</span>
          ${roleBadgesHtml}
        </div>
        <span class="qa-stream-time">${formatQAStreamTime(q.time)}</span>
      </div>
      ${adminContactStripHtml}
      <div class="qa-stream-question-body">${escapeHtml(q.question)}</div>
      ${actionsHtml}
      ${repliesHtml}
      ${buyerFollowupHtml}
      ${adminReplyBoxHtml}
    </div>
  `;

  return streamItem;
}

const QA_HEIGHT_PRESETS = { compact: 420, tall: 840 };

/** 判斷目前是否為最高權限賣家身分 */
function isSuperAdminQARole() {
  return Boolean(AppState.isAdmin && AppState.isAdminAuthenticated);
}

/** 根據身分自動套用問答討論串預設高度（無手動偏好時：一般買家預設 420px 固定捲軸；最高管理者預設 ∞ 無限延伸） */
function applyRoleBasedQADefaults(forceApply = false) {
  if (!forceApply && AppState.qaHeightModeManual) {
    applyQAContainerHeightMode();
    return;
  }
  AppState.qaHeightMode = isSuperAdminQARole() ? 'infinite' : 'compact';
  applyQAContainerHeightMode();
}

/** 從本機儲存初始化問答區高度偏好設定 */
function initQAHeightPreferences() {
  const savedMode = SafeStorage.get('agy_qa_height_mode');
  const savedCustomH = Number(SafeStorage.get('agy_qa_custom_height'));
  if (Number.isFinite(savedCustomH) && savedCustomH >= 220) {
    AppState.qaCustomHeight = Math.round(Math.max(220, Math.min(2400, savedCustomH)));
  }
  if (['compact', 'tall', 'infinite', 'custom'].includes(savedMode)) {
    AppState.qaHeightModeManual = true;
    AppState.qaHeightMode = savedMode;
  } else {
    AppState.qaHeightModeManual = false;
    AppState.qaHeightMode = isSuperAdminQARole() ? 'infinite' : 'compact';
  }
  applyQAContainerHeightMode();
}

/** 將目前問答討論串高度模式 (#qa-list) 鎖定套用至 DOM，確保重繪或雲端同步後絕不跳回預設值 */
function applyQAContainerHeightMode() {
  const listEl = el('qa-list');
  const handleLabel = el('qa-resize-handle-label');
  const mode = AppState.qaHeightMode || (isSuperAdminQARole() ? 'infinite' : 'compact');

  document.querySelectorAll('#qa-view-controls .qa-view-btn[data-qa-size]').forEach(btn => {
    const isAct = btn.dataset.qaSize === mode;
    btn.classList.toggle('active', isAct);
    btn.setAttribute('aria-pressed', isAct ? 'true' : 'false');
  });

  if (!listEl) return;

  if (mode === 'infinite') {
    listEl.classList.add('qa-size-mode-infinite');
    listEl.style.height = 'auto';
    listEl.style.maxHeight = 'none';
    listEl.style.overflowY = 'visible';
    if (handleLabel) {
      handleLabel.textContent = '♾️ 目前為無限延伸模式 — 按住上下拖曳即可改為自訂固定高度';
    }
  } else {
    listEl.classList.remove('qa-size-mode-infinite');
    let targetPx = QA_HEIGHT_PRESETS.compact;
    let modeHint = '420px 固定捲軸';
    if (mode === 'tall') {
      targetPx = QA_HEIGHT_PRESETS.tall;
      modeHint = '840px 加長框體';
    } else if (mode === 'custom') {
      targetPx = Math.round(Math.max(220, Math.min(2400, Number(AppState.qaCustomHeight) || QA_HEIGHT_PRESETS.compact)));
      modeHint = `自訂 ${targetPx}px 鎖定高度`;
    }
    listEl.style.height = `${targetPx}px`;
    listEl.style.maxHeight = `${targetPx}px`;
    listEl.style.overflowY = 'auto';
    if (handleLabel) {
      handleLabel.textContent = `↕️ 按住上下拖曳調整高度（目前：${modeHint}）`;
    }
  }
}

/** 切換問答區容器尺寸模式 (compact / tall / infinite) */
function setQAContainerHeightMode(mode, isManual = true) {
  const validModes = ['compact', 'tall', 'infinite', 'custom'];
  if (!validModes.includes(mode)) return;
  AppState.qaHeightMode = mode;
  AppState.qaHeightModeManual = Boolean(isManual);
  if (isManual) {
    SafeStorage.set('agy_qa_height_mode', mode);
  }
  applyQAContainerHeightMode();

  const msgMap = {
    compact: '📏 已切換為「固定捲軸 (420px)」模式並記住偏好！',
    tall: '↕️ 已切換為「加長框體 (840px)」模式並記住偏好！',
    infinite: '♾️ 已切換為「無限延伸」模式，問答串將完整展開顯示！'
  };
  if (msgMap[mode]) showToast(msgMap[mode]);
}

/** 初始化問答區底部拖曳把手（支援滑鼠左鍵與手機觸控即時調整並鎖定高度） */
function initQAResizeDrag() {
  const handle = el('qa-resize-handle');
  const listEl = el('qa-list');
  if (!handle || !listEl || handle.dataset.dragBound === '1') return;
  handle.dataset.dragBound = '1';

  let isDragging = false;
  let startY = 0;
  let startHeight = 420;
  let lastHeight = 420;

  const getClientY = (evt) => {
    if (evt.touches && evt.touches.length > 0) return evt.touches[0].clientY;
    if (evt.changedTouches && evt.changedTouches.length > 0) return evt.changedTouches[0].clientY;
    return evt.clientY;
  };

  const onDragStart = (evt) => {
    if (evt.type === 'mousedown' && evt.button !== 0) return;
    isDragging = true;
    startY = getClientY(evt);
    const rect = listEl.getBoundingClientRect();
    startHeight = Math.round(Math.max(220, Math.min(2400, rect.height || Number(AppState.qaCustomHeight) || 420)));
    lastHeight = startHeight;
    document.body.classList.add('is-qa-resizing');
    handle.classList.add('dragging');
    evt.preventDefault();
  };

  const onDragMove = (evt) => {
    if (!isDragging) return;
    const deltaY = getClientY(evt) - startY;
    const nextH = Math.round(Math.max(220, Math.min(2400, startHeight + deltaY)));
    lastHeight = nextH;

    listEl.classList.remove('qa-size-mode-infinite');
    listEl.style.height = `${nextH}px`;
    listEl.style.maxHeight = `${nextH}px`;
    listEl.style.overflowY = 'auto';

    document.querySelectorAll('#qa-view-controls .qa-view-btn[data-qa-size]').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    const labelEl = el('qa-resize-handle-label');
    if (labelEl) {
      labelEl.textContent = `↕️ 放開後鎖定高度：${nextH}px`;
    }
    if (evt.cancelable) evt.preventDefault();
  };

  const onDragEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    document.body.classList.remove('is-qa-resizing');
    handle.classList.remove('dragging');
    AppState.qaHeightMode = 'custom';
    AppState.qaHeightModeManual = true;
    AppState.qaCustomHeight = lastHeight;
    SafeStorage.set('agy_qa_height_mode', 'custom');
    SafeStorage.set('agy_qa_custom_height', lastHeight);
    applyQAContainerHeightMode();
    showToast(`📐 已鎖定問答討論串高度為 ${lastHeight}px！`);
  };

  handle.addEventListener('mousedown', onDragStart);
  handle.addEventListener('touchstart', onDragStart, { passive: false });
  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('touchmove', onDragMove, { passive: false });
  document.addEventListener('mouseup', onDragEnd);
  document.addEventListener('touchend', onDragEnd);
  document.addEventListener('touchcancel', onDragEnd);
}

/** 同步更新主視窗與工作台的一鍵「📂 展開全部 / 📁 收合全部」按鈕外觀 */
function updateQAToggleAllButtonsUI(hasCollapsibleGroups) {
  const isAllExpanded = Boolean(AppState.qaExpandAllGroups);
  [el('btn-qa-toggle-all-groups'), el('btn-wb-toggle-all-groups')].forEach(btn => {
    if (!btn) return;
    btn.classList.toggle('active', isAllExpanded);
    btn.textContent = isAllExpanded ? '📁 收合全部' : '📂 展開全部';
    btn.style.display = hasCollapsibleGroups ? 'inline-flex' : 'none';
  });
}

/** 一鍵切換展開或收合所有買家的多則歷史提問摺疊夾 */
function toggleAllQABuyerGroups() {
  const nextExpanded = !Boolean(AppState.qaExpandAllGroups);
  AppState.qaExpandAllGroups = nextExpanded;
  AppState.expandedBuyerGroupMap = {};
  AppState.manuallyCollapsedBuyerGroupMap = {};

  if (nextExpanded) {
    const item = getActiveItem();
    const qaData = (item && item.qa) ? item.qa : {};
    Object.keys(qaData).forEach(k => {
      const q = qaData[k];
      if (!q || typeof q !== 'object') return;
      const cleanPhone = String(q.phone || '').replace(/[^0-9]/g, '');
      const cleanUser = String(q.user || '買家').trim();
      const buyerGroupKey = cleanPhone || cleanUser || k;
      AppState.expandedBuyerGroupMap[buyerGroupKey] = true;
    });
  }

  renderQA(true, null);
  showToast(nextExpanded
    ? '📂 已一鍵展開所有買家歷史提問！'
    : '📁 已一鍵收合買家歷史摺疊夾（僅保留各買家最新留言）！');
}

/** 開啟「🔍 放大工作台」全螢幕寬敞工作視窗 */
function openQAWorkbench() {
  const modal = el('modal-qa-workbench');
  if (!modal) return;
  modal.classList.add('show');
  renderQAWorkbench();
}

/** 關閉「🔍 放大工作台」 */
function closeQAWorkbench() {
  const modal = el('modal-qa-workbench');
  if (!modal) return;
  modal.classList.remove('show');
}

/** 共享核心：將指定商品的問答串渲染至目標容器（支援主頁面 #qa-list 與放大工作台 #qa-workbench-list ID 隔離） */
function renderQAStreamIntoContainer(listEl, item, options = {}) {
  if (!listEl) return;
  const {
    idPrefix = '',
    countPrefix = 'qa-',
    filterBarId = 'qa-filter-bar',
    summaryBadgeId = 'qa-summary-badge',
    topPillId = 'qa-unanswered-top-pill',
    highlightKey = null
  } = options;

  if (!item) {
    listEl.innerHTML = '<div style="font-size:.8rem;color:var(--c-text-3);text-align:center;padding:12px;">目前尚無商品</div>';
    updateQAToggleAllButtonsUI(false);
    return;
  }

  const qaData = item.qa || {};
  const allKeys = Object.keys(qaData).filter(k => qaData[k] && typeof qaData[k] === 'object');

  // 依發問時間由舊到新建立固定樓層編號 (#1F, #2F, #3F...)
  const chronoKeys = allKeys.slice().sort((a, b) => Number(qaData[a].time || 0) - Number(qaData[b].time || 0));
  const floorMap = {};
  chronoKeys.forEach((k, idx) => {
    floorMap[k] = idx + 1;
  });

  // 統計各分類數量
  const totalCount = allKeys.length;
  const unansweredKeys = allKeys.filter(k => isQuestionUnanswered(qaData[k]));
  const mineKeys = allKeys.filter(k => isQuestionMine(qaData[k]));
  const hotKeys = allKeys.slice().sort((a, b) => {
    const diff = getQuestionHeatScore(qaData[b]) - getQuestionHeatScore(qaData[a]);
    return diff !== 0 ? diff : (Number(qaData[b].time || 0) - Number(qaData[a].time || 0));
  });

  if (el(`${countPrefix}count-latest`)) el(`${countPrefix}count-latest`).textContent = String(totalCount);
  if (el(`${countPrefix}count-hot`)) el(`${countPrefix}count-hot`).textContent = String(totalCount);
  if (el(`${countPrefix}count-unanswered`)) {
    el(`${countPrefix}count-unanswered`).textContent = String(unansweredKeys.length);
    el(`${countPrefix}count-unanswered`).classList.toggle('has-pending', unansweredKeys.length > 0);
  }
  if (el(`${countPrefix}count-mine`)) el(`${countPrefix}count-mine`).textContent = String(mineKeys.length);

  if (summaryBadgeId && el(summaryBadgeId)) {
    el(summaryBadgeId).textContent = unansweredKeys.length > 0
      ? `共 ${totalCount} 則討論 · 待回覆 ${unansweredKeys.length} 則`
      : `共 ${totalCount} 則討論 · 全部已解答`;
  }
  if (topPillId && el(topPillId)) {
    if (unansweredKeys.length > 0 && AppState.isAdmin) {
      el(topPillId).textContent = `❓ 待回覆 ${unansweredKeys.length} 則`;
      el(topPillId).style.background = 'rgba(239, 68, 68, 0.22)';
      el(topPillId).style.color = '#fca5a5';
    } else {
      el(topPillId).textContent = '即時互動解答';
      el(topPillId).style.background = '';
      el(topPillId).style.color = '';
    }
  }

  // 更新篩選按鈕高亮狀態
  const currentFilter = AppState.qaFilterMode || 'latest';
  document.querySelectorAll(`#${filterBarId} .qa-filter-tab`).forEach(tab => {
    const isAct = tab.dataset.qaFilter === currentFilter;
    tab.classList.toggle('active', isAct);
    tab.setAttribute('aria-selected', isAct ? 'true' : 'false');
  });

  // 根據當前篩選與排序模式決定顯示清單
  let filteredKeys = [];
  if (currentFilter === 'hot') {
    filteredKeys = hotKeys;
  } else if (currentFilter === 'unanswered') {
    filteredKeys = unansweredKeys.slice().sort((a, b) => Number(qaData[b].time || 0) - Number(qaData[a].time || 0));
  } else if (currentFilter === 'mine') {
    filteredKeys = mineKeys.slice().sort((a, b) => Number(qaData[b].time || 0) - Number(qaData[a].time || 0));
  } else {
    filteredKeys = allKeys.slice().sort((a, b) => Number(qaData[b].time || 0) - Number(qaData[a].time || 0));
  }

  if (!filteredKeys.length) {
    let emptyMsg = '目前本品項尚無問答，若有任何問題歡迎於上方留言提問！';
    if (totalCount > 0) {
      if (currentFilter === 'unanswered') {
        emptyMsg = '🎉 太棒了！目前所有買家提問皆已回覆完畢，沒有待回覆問題。';
      } else if (currentFilter === 'mine') {
        emptyMsg = AppState.userProfile?.name
          ? `您（${escapeHtml(AppState.userProfile.name)}）目前尚未在此商品發表過提問，歡迎直接在上方輸入問題！`
          : '請先填寫買家稱呼與電話（或發表一則提問），即可在此快速檢視您的專屬發問紀錄！';
      }
    }
    listEl.innerHTML = `<div style="text-align:center;padding:18px 10px;font-size:.8rem;color:var(--c-text-3);" class="qa-empty-hint">${emptyMsg}</div>`;
    updateQAToggleAllButtonsUI(false);
    return;
  }

  const likedMap = getLikedQAMap();
  const topBidderName = getBidderName(item.topBidder);
  const bidderSet = new Set((item.bidHistory || []).map(b => String(getBidderName(b.user || b.name) || '').trim()));

  listEl.innerHTML = '';

  // 依據買家識別 (電話或名稱) 將同一位買家的多則歷史提問自動分組摺疊（最新一則直接顯示，較舊的歸入可展開歷史夾）
  const buyerGroupsMap = new Map();
  const primaryOrder = [];

  filteredKeys.forEach(k => {
    const q = qaData[k];
    const cleanPhone = String(q.phone || '').replace(/[^0-9]/g, '');
    const cleanUser = String(q.user || '買家').trim();
    const buyerGroupKey = cleanPhone || cleanUser || k;

    if (!buyerGroupsMap.has(buyerGroupKey)) {
      buyerGroupsMap.set(buyerGroupKey, []);
      primaryOrder.push(buyerGroupKey);
    }
    buyerGroupsMap.get(buyerGroupKey).push(k);
  });

  const isSuperAdmin = isSuperAdminQARole();
  let hasCollapsibleGroups = false;

  primaryOrder.forEach(buyerGroupKey => {
    const groupKeys = buyerGroupsMap.get(buyerGroupKey);
    const newestKey = groupKeys[0];
    const newestQ = qaData[newestKey];
    const primaryNode = buildSingleQAStreamNode(
      item, newestKey, newestQ, floorMap[newestKey] || 1, likedMap, topBidderName, bidderSet, highlightKey, idPrefix
    );
    listEl.appendChild(primaryNode);

    // 若同一位買家有超過 1 則提問，將較早的歷史提問收納至摺疊夾
    if (groupKeys.length > 1) {
      hasCollapsibleGroups = true;
      const olderKeys = groupKeys.slice(1);
      const authorRaw = String(newestQ.user || '買家').trim();
      const dispName = AppState.isAdmin ? escapeHtml(authorRaw) : escapeHtml(maskBuyerName(authorRaw));
      const pendingOlderCount = olderKeys.filter(ok => isQuestionUnanswered(qaData[ok])).length;
      const wasGroupManuallyCollapsed = Boolean(AppState.manuallyCollapsedBuyerGroupMap && AppState.manuallyCollapsedBuyerGroupMap[buyerGroupKey]);
      const isGroupExpanded = Boolean(
        AppState.qaExpandAllGroups ||
        (AppState.expandedBuyerGroupMap && AppState.expandedBuyerGroupMap[buyerGroupKey]) ||
        (isSuperAdmin && pendingOlderCount > 0 && !wasGroupManuallyCollapsed) ||
        (highlightKey && olderKeys.includes(highlightKey))
      );

      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'qa-collapse-toggle-bar btn-toggle-buyer-history';
      toggleBtn.style.marginLeft = '36px';
      toggleBtn.style.marginBottom = '4px';
      toggleBtn.dataset.buyerGroup = buyerGroupKey;
      toggleBtn.dataset.expanded = isGroupExpanded ? '1' : '0';
      const pendingHint = pendingOlderCount > 0 ? ` · <span style="color:#fbbf24;">含 ${pendingOlderCount} 則待回覆</span>` : '';
      toggleBtn.innerHTML = isGroupExpanded
        ? `🔼 收合【${dispName}】另外 ${olderKeys.length} 則歷史提問`
        : `📂 展開【${dispName}】另外 ${olderKeys.length} 則歷史提問${pendingHint} ▼`;
      listEl.appendChild(toggleBtn);

      const historyWrap = document.createElement('div');
      historyWrap.className = `qa-buyer-history-group-wrap ${isGroupExpanded ? 'show' : ''}`;
      historyWrap.id = `${idPrefix}qa-buyer-group-${buyerGroupKey}`;
      olderKeys.forEach(ok => {
        const oNode = buildSingleQAStreamNode(
          item, ok, qaData[ok], floorMap[ok] || 1, likedMap, topBidderName, bidderSet, highlightKey, idPrefix
        );
        historyWrap.appendChild(oNode);
      });
      listEl.appendChild(historyWrap);
    }
  });

  updateQAToggleAllButtonsUI(hasCollapsibleGroups);

  // 綁定流水式留言串內所有互動按鈕事件
  bindQAStreamItemEvents(listEl, item.id);
}

/** 渲染「🔍 放大工作台」內的問答討論串（與主頁即時連動，具備獨立表單 ID 避免碰撞） */
function renderQAWorkbench(highlightKey = null) {
  const wbList = el('qa-workbench-list');
  const modal = el('modal-qa-workbench');
  if (!wbList || !modal || !modal.classList.contains('show')) return;
  const item = getActiveItem();
  renderQAStreamIntoContainer(wbList, item, {
    idPrefix: 'wb-',
    countPrefix: 'wb-',
    filterBarId: 'qa-wb-filter-bar',
    summaryBadgeId: 'wb-qa-summary-badge',
    topPillId: '',
    highlightKey
  });
}

/** 渲染商品頁「流水式留言串（Timeline Stream）」與四維度排序過濾計數（支援同一買家多則歷史提問摺疊） */
function renderQA(preserveScroll = true, highlightKey = null) {
  const prevScroll = window.scrollY;
  const item = getActiveItem();
  const listEl = el('qa-list');
  if (!listEl) return;

  renderQAStreamIntoContainer(listEl, item, {
    idPrefix: '',
    countPrefix: 'qa-',
    filterBarId: 'qa-filter-bar',
    summaryBadgeId: 'qa-summary-badge',
    topPillId: 'qa-unanswered-top-pill',
    highlightKey
  });

  // 每次重繪後維持目前高度/模式鎖定
  applyQAContainerHeightMode();

  // 若放大工作台目前為開啟狀態，一併同步重繪
  if (el('modal-qa-workbench')?.classList.contains('show')) {
    renderQAWorkbench(highlightKey);
  }

  if (preserveScroll) {
    window.scrollTo({ top: prevScroll, behavior: 'instant' });
  }
}

/** 綁定問答留言串內的複製、黑名單、按讚、追問、收合面板、單則回覆刪除、罐頭快回與整筆刪除事件 */
function bindQAStreamItemEvents(containerEl, defaultItemId) {
  if (!containerEl) return;

  // 1. 複製手機號碼
  containerEl.querySelectorAll('.btn-copy-phone').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const phoneNum = btn.dataset.phone;
      if (phoneNum && navigator.clipboard) {
        navigator.clipboard.writeText(phoneNum).then(() => showToast(`📋 已複製手機: ${phoneNum}`));
      }
    });
  });

  // 2. 複製 Line ID
  containerEl.querySelectorAll('.btn-copy-line').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const lineId = btn.dataset.line;
      if (lineId && navigator.clipboard) {
        navigator.clipboard.writeText(lineId).then(() => showToast(`📋 已複製 Line: ${lineId}`));
      }
    });
  });

  // 3. 封鎖 / 解封黑名單
  containerEl.querySelectorAll('.btn-toggle-blacklist').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const phoneNum = btn.dataset.phone;
      const bName = btn.dataset.name || '買家';
      toggleBuyerBlacklist(phoneNum, bName);
    });
  });

  // 4. 按讚 / 同問互動
  containerEl.querySelectorAll('.btn-qa-like').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const itId = btn.dataset.itemId || defaultItemId;
      const qKey = btn.dataset.qaKey;
      toggleQALike(itId, qKey);
    });
  });

  // 5. 展開 / 收合買家追問輸入框
  containerEl.querySelectorAll('.btn-qa-followup-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const qKey = btn.dataset.qaKey;
      const boxId = btn.dataset.followupBoxId || `qa-followup-box-${qKey}`;
      const inpId = btn.dataset.followupInpId || `inp-qa-followup-${qKey}`;
      const box = el(boxId);
      if (box) {
        const isShow = box.classList.toggle('show');
        if (isShow) {
          el(inpId)?.focus();
        }
      }
    });
  });

  // 5-1. 展開 / 收合管理者「💬 回覆此提問（罐頭快答面板）」
  containerEl.querySelectorAll('.btn-qa-admin-reply-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const qKey = btn.dataset.qaKey;
      const boxPrefix = btn.dataset.boxPrefix || 'qa-admin-reply-box-';
      const inpPrefix = btn.dataset.inputPrefix || 'inp-reply-';
      const isUnansBtn = btn.dataset.unans === '1';
      if (!AppState.expandedAdminReplyMap) AppState.expandedAdminReplyMap = {};
      if (!AppState.manuallyCollapsedAdminReplyMap) AppState.manuallyCollapsedAdminReplyMap = {};

      const box = el(`${boxPrefix}${qKey}`);
      const isCurrentlyOpen = box ? box.classList.contains('show') : Boolean(AppState.expandedAdminReplyMap[qKey]);
      const nextState = !isCurrentlyOpen;
      AppState.expandedAdminReplyMap[qKey] = nextState;
      AppState.manuallyCollapsedAdminReplyMap[qKey] = !nextState;

      if (box) {
        box.classList.toggle('show', nextState);
        btn.classList.toggle('active', nextState);
        const labelSpan = btn.querySelectorAll('span')[1];
        if (labelSpan) {
          labelSpan.textContent = nextState ? '收合回覆面板 ▲' : (isUnansBtn ? '回覆此提問 ▼' : '回覆 / 罐頭快答 ▼');
        }
        if (nextState) {
          const targetInp = el(`${inpPrefix}${qKey}`);
          if (targetInp) {
            autoResizeQATextarea(targetInp);
            targetInp.focus();
          }
        }
      }
    });
  });

  // 5-2. 展開 / 收合單題多樓層歷史回覆對話
  containerEl.querySelectorAll('.btn-toggle-floor-history').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const qKey = btn.dataset.qaKey;
      if (!AppState.expandedHistoryFloorsMap) AppState.expandedHistoryFloorsMap = {};
      AppState.expandedHistoryFloorsMap[qKey] = !AppState.expandedHistoryFloorsMap[qKey];
      const prevScroll = window.scrollY;
      renderQA(true, null);
      window.scrollTo({ top: prevScroll, behavior: 'instant' });
    });
  });

  // 5-3. 展開 / 收合同一位買家的多則歷史提問
  containerEl.querySelectorAll('.btn-toggle-buyer-history').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const bgKey = btn.dataset.buyerGroup;
      if (!AppState.expandedBuyerGroupMap) AppState.expandedBuyerGroupMap = {};
      if (!AppState.manuallyCollapsedBuyerGroupMap) AppState.manuallyCollapsedBuyerGroupMap = {};
      const wasExpanded = btn.dataset.expanded === '1' || Boolean(AppState.expandedBuyerGroupMap[bgKey]);
      const nextState = !wasExpanded;
      AppState.expandedBuyerGroupMap[bgKey] = nextState;
      AppState.manuallyCollapsedBuyerGroupMap[bgKey] = !nextState;
      if (!nextState) AppState.qaExpandAllGroups = false;
      const prevScroll = window.scrollY;
      renderQA(true, null);
      window.scrollTo({ top: prevScroll, behavior: 'instant' });
    });
  });

  // 6. 送出買家追問（或管理員樓中樓回覆）
  containerEl.querySelectorAll('.btn-submit-qa-followup').forEach(btn => {
    btn.addEventListener('click', () => {
      const itId = btn.dataset.itemId || defaultItemId;
      const qKey = btn.dataset.qaKey;
      const inpId = btn.dataset.followupInpId || `inp-qa-followup-${qKey}`;
      const inp = el(inpId);
      if (!inp || !inp.value.trim()) {
        showToast('請輸入追問或補充內容！');
        return;
      }
      submitQAFollowup(itId, qKey, inp.value.trim(), AppState.isAdmin);
    });
  });
  containerEl.querySelectorAll('[id^="inp-qa-followup-"], [id^="wb-inp-qa-followup-"]').forEach(inp => {
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const qKey = inp.dataset.qaKey || inp.id.replace('wb-inp-qa-followup-', '').replace('inp-qa-followup-', '');
        if (inp.value.trim()) {
          submitQAFollowup(defaultItemId, qKey, inp.value.trim(), AppState.isAdmin);
        }
      }
    });
  });

  // 7. 切換「點擊罐頭句立即送出」開關
  containerEl.querySelectorAll('.chk-qa-instant-canned').forEach(chk => {
    chk.addEventListener('change', (e) => {
      AppState.qaInstantCannedSend = Boolean(e.target.checked);
      SafeStorage.set('agy_qa_instant_canned', AppState.qaInstantCannedSend);
      containerEl.querySelectorAll('.chk-qa-instant-canned').forEach(other => {
        other.checked = AppState.qaInstantCannedSend;
      });
      showToast(AppState.qaInstantCannedSend
        ? '⚡ 已開啟「點擊罐頭句立即送出」模式！'
        : '✏️ 已切換為「點擊罐頭句先填入輸入框」模式！');
    });
  });

  // 8. 點擊賣家罐頭快答按鈕（立即送出模式 vs 多選智慧組合切換模式）
  containerEl.querySelectorAll('.btn-qa-canned').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const itId = btn.dataset.itemId || defaultItemId;
      const qKey = btn.dataset.qaKey;
      const cannedId = btn.dataset.cannedId || '';
      const label = btn.dataset.label || '';
      const replyText = btn.dataset.replyText || '';
      const prefix = btn.dataset.inputPrefix || 'inp-reply-';
      const boxKey = `${prefix}${qKey}`;
      const inp = el(boxKey);

      if (AppState.qaInstantCannedSend) {
        const singleComposed = composeSmartCannedReply([replyText]);
        if (inp) {
          inp.value = singleComposed;
          autoResizeQATextarea(inp);
        }
        submitQAReply(itId, qKey, singleComposed);
        return;
      }

      if (!AppState.qaSelectedCannedMap) AppState.qaSelectedCannedMap = {};
      if (!AppState.qaLastComposedMap) AppState.qaLastComposedMap = {};
      if (!AppState.qaDraftTextMap) AppState.qaDraftTextMap = {};

      const selectedIds = Array.isArray(AppState.qaSelectedCannedMap[boxKey])
        ? AppState.qaSelectedCannedMap[boxKey].slice()
        : [];
      const prevComposed = AppState.qaLastComposedMap[boxKey] || '';
      const manualText = inp ? extractManualTextPreservingEdit(inp.value, prevComposed) : '';

      const existingIdx = selectedIds.indexOf(cannedId);
      let isAdding = true;
      if (existingIdx !== -1) {
        selectedIds.splice(existingIdx, 1);
        isAdding = false;
      } else {
        selectedIds.push(cannedId);
      }

      AppState.qaSelectedCannedMap[boxKey] = selectedIds;

      const allCanned = getAllCannedReplies();
      const selectedClauses = selectedIds
        .map(id => {
          const found = allCanned.find(c => c.id === id);
          return found ? found.text : '';
        })
        .filter(Boolean);

      const onlyCannedComposed = composeSmartCannedReply(selectedClauses, '');
      const finalText = composeSmartCannedReply(selectedClauses, manualText);
      AppState.qaLastComposedMap[boxKey] = onlyCannedComposed;
      AppState.qaDraftTextMap[boxKey] = finalText;

      // 同步更新該回覆盒所有標籤的選中樣式
      const boxEl = btn.closest('.qa-admin-reply-box');
      if (boxEl) {
        boxEl.querySelectorAll('.btn-qa-canned').forEach(chipEl => {
          chipEl.classList.toggle('is-selected', selectedIds.includes(chipEl.dataset.cannedId));
        });
      }

      if (inp) {
        inp.value = finalText;
        autoResizeQATextarea(inp);
        inp.focus();
      }
      showToast(isAdding
        ? `✅ 已加入「${label}」（已選 ${selectedIds.length} 項組合句）`
        : `❎ 已取消「${label}」`);
    });
  });

  // 8-1. 開啟「➕ 自訂快答」詞庫管理彈窗（僅最高權限管理者）
  containerEl.querySelectorAll('.btn-open-canned-manager').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openCustomCannedModal();
    });
  });

  // 8-2. 🧹 清空重選（一鍵取消所有選中標籤並清空輸入框文字）
  containerEl.querySelectorAll('.btn-clear-qa-draft').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const qKey = btn.dataset.qaKey;
      const prefix = btn.dataset.inputPrefix || 'inp-reply-';
      const boxKey = `${prefix}${qKey}`;
      if (AppState.qaSelectedCannedMap) delete AppState.qaSelectedCannedMap[boxKey];
      if (AppState.qaLastComposedMap) delete AppState.qaLastComposedMap[boxKey];
      if (AppState.qaDraftTextMap) delete AppState.qaDraftTextMap[boxKey];

      const boxEl = btn.closest('.qa-admin-reply-box');
      if (boxEl) {
        boxEl.querySelectorAll('.btn-qa-canned').forEach(c => c.classList.remove('is-selected'));
      }
      const inp = el(boxKey);
      if (inp) {
        inp.value = '';
        autoResizeQATextarea(inp);
        inp.focus();
      }
      showToast('🧹 已清空所有已選標籤與回覆草稿！');
    });
  });

  // 9. 送出或更新主回覆
  containerEl.querySelectorAll('.btn-submit-qa-reply').forEach(btn => {
    btn.addEventListener('click', () => {
      const itId = btn.dataset.itemId || defaultItemId;
      const qKey = btn.dataset.qaKey;
      const prefix = btn.dataset.inputPrefix || 'inp-reply-';
      const boxKey = `${prefix}${qKey}`;
      const inp = el(boxKey);
      if (!inp || !inp.value.trim()) {
        showToast('請輸入回覆內容或點選上方罐頭快答！');
        return;
      }
      if (AppState.qaSelectedCannedMap) delete AppState.qaSelectedCannedMap[boxKey];
      if (AppState.qaLastComposedMap) delete AppState.qaLastComposedMap[boxKey];
      if (AppState.qaDraftTextMap) delete AppState.qaDraftTextMap[boxKey];
      submitQAReply(itId, qKey, inp.value.trim());
    });
  });

  // 支援輸入時自動增高 (.qa-admin-textarea) 與 Ctrl+Enter / Cmd+Enter 快速送出
  containerEl.querySelectorAll('.qa-admin-textarea').forEach(area => {
    autoResizeQATextarea(area);
    area.addEventListener('input', () => {
      autoResizeQATextarea(area);
      if (!AppState.qaDraftTextMap) AppState.qaDraftTextMap = {};
      AppState.qaDraftTextMap[area.id] = area.value;
    });
    area.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const qKey = area.id.replace('inp-admin-reply-', '').replace('wb-inp-reply-', '').replace('inp-reply-', '');
        const isBackend = area.id.startsWith('inp-admin-reply-');
        const btn = containerEl.querySelector(`${isBackend ? '.btn-admin-submit-reply' : '.btn-submit-qa-reply'}[data-qa-key="${qKey}"]`);
        const itId = btn?.dataset.itemId || defaultItemId;
        if (area.value.trim()) {
          if (AppState.qaSelectedCannedMap) delete AppState.qaSelectedCannedMap[area.id];
          if (AppState.qaLastComposedMap) delete AppState.qaLastComposedMap[area.id];
          if (AppState.qaDraftTextMap) delete AppState.qaDraftTextMap[area.id];
          submitQAReply(itId, qKey, area.value.trim());
        }
      }
    });
  });

  // 10. 管理員加蓋新樓層官方回覆
  containerEl.querySelectorAll('.btn-append-qa-floor').forEach(btn => {
    btn.addEventListener('click', () => {
      const itId = btn.dataset.itemId || defaultItemId;
      const qKey = btn.dataset.qaKey;
      const prefix = btn.dataset.inputPrefix || 'inp-reply-';
      const boxKey = `${prefix}${qKey}`;
      const inp = el(boxKey);
      if (!inp || !inp.value.trim()) {
        showToast('請在輸入框填寫要加蓋樓層的補充回覆內容！');
        return;
      }
      if (AppState.qaSelectedCannedMap) delete AppState.qaSelectedCannedMap[boxKey];
      if (AppState.qaLastComposedMap) delete AppState.qaLastComposedMap[boxKey];
      if (AppState.qaDraftTextMap) delete AppState.qaDraftTextMap[boxKey];
      submitQAFollowup(itId, qKey, inp.value.trim(), true);
    });
  });

  // 11. 👑 最高權限管理者專屬：單一回覆獨立刪除按鈕 (.btn-del-single-reply)
  containerEl.querySelectorAll('.btn-del-single-reply').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const itId = btn.dataset.itemId || defaultItemId;
      const qKey = btn.dataset.qaKey;
      const floorType = btn.dataset.floorType || 'main';
      const replyIdx = Number(btn.dataset.replyIdx ?? -1);
      deleteSingleQAReply(itId, qKey, floorType, replyIdx);
    });
  });

  // 12. 刪除整筆提問
  containerEl.querySelectorAll('.btn-del-qa').forEach(btn => {
    btn.addEventListener('click', () => {
      const itId = btn.dataset.itemId || defaultItemId;
      const qKey = btn.dataset.qaKey;
      if (confirm('確定要刪除這整筆買家提問嗎？刪除後將同步自雲端移除。')) {
        deleteQuestion(itId, qKey);
      }
    });
  });
}

/**
 * 👑 最高權限管理者專屬：獨立刪除單一筆賣家回覆或追問樓層（保留原買家提問）
 * @param {string} itemId 商品 ID
 * @param {string} qKey 提問 Key
 * @param {string} floorType 'main' (主回覆 q.reply) 或 'sub' (多樓層陣列 q.replies[replyIdx])
 * @param {number} replyIdx 當 floorType 為 'sub' 時之陣列索引
 */
function deleteSingleQAReply(itemId, qKey, floorType, replyIdx) {
  if (!requireAdminAuth()) return;
  const prevScroll = window.scrollY;
  const item = AppState.items.find(i => i.id === itemId) || getActiveItem();
  if (!item || !item.qa || !item.qa[qKey]) return;

  const q = item.qa[qKey];
  if (floorType === 'main') {
    q.reply = null;
    q.replyTime = null;
  } else if (floorType === 'sub') {
    if (Array.isArray(q.replies) && replyIdx >= 0 && replyIdx < q.replies.length) {
      q.replies.splice(replyIdx, 1);
    }
  }

  renderQA(true, qKey);
  renderAdminAllQA();
  window.scrollTo({ top: prevScroll, behavior: 'instant' });
  showToast('🗑️ 已刪除此筆回覆並同步更新雲端！');

  const db = FirebaseManager.getDb();
  if (db && item.id) {
    db.ref(`auction/items/${item.id}/qa/${qKey}`).set(q).catch(() => {});
  }
  syncToFirebase();
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    syncToLocalServer();
  }
}

/** 買家或訪客對某則提問按讚 / 同問 (+1 熱度，影響「🔥 最熱門」排序並同步雲端) */
function toggleQALike(itemId, qKey) {
  const prevScroll = window.scrollY;
  const item = AppState.items.find(i => i.id === itemId) || getActiveItem();
  if (!item || !item.qa || !item.qa[qKey]) return;

  const likedMap = getLikedQAMap();
  const q = item.qa[qKey];
  const curLikes = Number(q.likes || 0);

  if (likedMap[qKey]) {
    q.likes = Math.max(0, curLikes - 1);
    delete likedMap[qKey];
    showToast('已收回按讚');
  } else {
    q.likes = curLikes + 1;
    likedMap[qKey] = true;
    showToast('👍 已表示同問 / 按讚！問題熱度已提升');
  }
  SafeStorage.set('agy_qa_liked_map', likedMap);

  renderQA(true, qKey);
  renderAdminAllQA();
  window.scrollTo({ top: prevScroll, behavior: 'instant' });

  const db = FirebaseManager.getDb();
  if (db && item.id) {
    db.ref(`auction/items/${item.id}/qa/${qKey}/likes`).set(q.likes).catch(() => {});
  }
  syncToFirebase();
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    syncToLocalServer();
  }
}

/** 新增多樓層對話（買家追問 或 賣家追加新樓層官方回覆） */
function submitQAFollowup(itemId, qKey, text, isSellerFloor = false) {
  const prevScroll = window.scrollY;
  const cleanText = String(text || '').trim();
  if (!cleanText) return;

  if (isSellerFloor) {
    if (!requireAdminAuth()) return;
  } else {
    if (!AppState.userProfile.name || !AppState.userProfile.phone) {
      showToast('追問前請先填寫您的稱呼與聯絡手機！');
      openBuyerProfileModal();
      return;
    }
    if (isBuyerBlacklisted(AppState.userProfile.phone, AppState.userProfile.name)) {
      showToast('🚫 您的帳號已被限制發言，無法送出追問。');
      return;
    }
  }

  const item = AppState.items.find(i => i.id === itemId) || getActiveItem();
  if (!item || !item.qa || !item.qa[qKey]) return;

  const now = typeof getServerNow === 'function' ? getServerNow() : Date.now();
  const q = item.qa[qKey];
  if (!Array.isArray(q.replies)) q.replies = [];

  // 若為賣家回覆且尚無主回覆，直接存入主回覆避免重複產生兩筆相同樓層
  if (isSellerFloor && !(q.reply && String(q.reply).trim())) {
    q.reply = cleanText;
    q.replyTime = now;
  } else {
    q.replies.push({
      author: isSellerFloor ? (AppState.studioName || '建生工坊賣家') : AppState.userProfile.name,
      phone: isSellerFloor ? '' : (AppState.userProfile.phone || ''),
      isSeller: Boolean(isSellerFloor),
      text: cleanText,
      time: now
    });
  }

  // 送出後自動收合管理員回覆面板，保持版面精簡
  if (isSellerFloor && AppState.expandedAdminReplyMap) {
    AppState.expandedAdminReplyMap[qKey] = false;
  }

  renderQA(true, qKey);
  renderAdminAllQA();
  window.scrollTo({ top: prevScroll, behavior: 'instant' });
  showToast(isSellerFloor ? '🛡️ 已成功新增賣家官方回覆樓層！' : '💬 您的追問已成功送出！');

  const db = FirebaseManager.getDb();
  if (db && item.id) {
    db.ref(`auction/items/${item.id}/qa/${qKey}`).set(q).catch(() => {});
  }
  syncToFirebase();
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    syncToLocalServer();
  }
}

/** 提交新提問（連同買家真實聯絡資料完整推播至 Firebase 雲端，並保持捲軸鎖定與平滑高亮） */
function submitQuestion() {
  const inp = el('qa-ask-input');
  const text = inp ? inp.value.trim() : '';
  if (!text) {
    showToast('請輸入提問內容！');
    inp?.focus();
    return;
  }

  // 若最高管理者目前鎖定為「👑 官方賣家身分（建生工坊）」，直接將輸入內容作為官方回覆發送給最新一筆問題
  if (AppState.isAdmin && AppState.activeIdentityRole === 'seller') {
    const activeItem = getActiveItem();
    const qaObj = activeItem?.qa || {};
    const allKeys = Object.keys(qaObj).filter(k => qaObj[k] && typeof qaObj[k] === 'object');
    if (allKeys.length > 0) {
      // 優先尋找最新一筆待回覆問題，若皆已回覆則針對最新一筆問題加蓋官方回覆樓層
      const unansKeys = allKeys.filter(k => isQuestionUnanswered(qaObj[k])).sort((a, b) => Number(qaObj[b].time || 0) - Number(qaObj[a].time || 0));
      const sortedAll = allKeys.slice().sort((a, b) => Number(qaObj[b].time || 0) - Number(qaObj[a].time || 0));
      const targetKey = unansKeys[0] || sortedAll[0];
      inp.value = '';
      if (!qaObj[targetKey].reply) {
        submitQAReply(activeItem.id, targetKey, text);
      } else {
        submitQAFollowup(activeItem.id, targetKey, text, true);
      }
      return;
    } else {
      showToast('👑 您目前為「官方賣家身分」，目前尚無買家提問可供回覆。若要模擬買家發問，請點擊「🧪 切換為測試買家發問」！');
      return;
    }
  }
  if (!AppState.userProfile.name || !AppState.userProfile.phone) {
    showToast('提問前請先填寫您的稱呼與聯絡手機！');
    openBuyerProfileModal();
    return;
  }
  if (isBuyerBlacklisted(AppState.userProfile.phone, AppState.userProfile.name)) {
    showToast('🚫 很抱歉，您的帳號已被限制留言與競標權限。');
    return;
  }

  const item = getActiveItem();
  if (!item) {
    showToast('目前尚無商品可供提問！');
    return;
  }

  const prevScroll = window.scrollY;
  const now = typeof getServerNow === 'function' ? getServerNow() : Date.now();
  const qKey = 'qa_' + now + '_' + Math.random().toString(36).slice(2, 6);
  if (!item.qa) item.qa = {};
  const newQ = {
    id: qKey,
    user: AppState.userProfile.name,
    phone: AppState.userProfile.phone,
    line: AppState.userProfile.line || '',
    ig: AppState.userProfile.ig || '',
    fb: AppState.userProfile.fb || '',
    question: text,
    time: now,
    likes: 0,
    reply: null,
    replyTime: null,
    replies: []
  };
  item.qa[qKey] = newQ;

  inp.value = '';
  if (AppState.qaFilterMode !== 'latest' && AppState.qaFilterMode !== 'mine') {
    AppState.qaFilterMode = 'latest';
  }
  renderQA(true, qKey);
  renderAdminAllQA();
  window.scrollTo({ top: prevScroll, behavior: 'instant' });
  showToast('💬 提問已發佈至留言串！賣家回覆後將即時顯示於下方。');

  const db = FirebaseManager.getDb();
  if (db && item.id) {
    db.ref(`auction/items/${item.id}/qa/${qKey}`).set(newQ).catch(() => {});

    const key = AppState.userProfile.phone.replace(/[^0-9]/g, '');
    const bData = {
      name: AppState.userProfile.name,
      phone: AppState.userProfile.phone,
      line: AppState.userProfile.line || '',
      ig: AppState.userProfile.ig || '',
      fb: AppState.userProfile.fb || '',
      updatedAt: now,
      lastQuestion: text,
      lastQuestionItem: item.id
    };
    db.ref('settings/buyers/' + key).update(bData).catch(() => {});
    db.ref('buyers/' + key).update(bData).catch(() => {});
  }
  syncToFirebase();
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    syncToLocalServer();
  }
}

/** 提交提問回覆 (同步雲端 Firebase - 最高權限管理者專屬，回覆後自動收合面板並保持捲軸鎖定) */
function submitQAReply(itemId, qKey, replyText) {
  if (!requireAdminAuth()) return;
  const prevScroll = window.scrollY;
  const item = AppState.items.find(i => i.id === itemId) || getActiveItem();
  if (!item || !item.qa || !item.qa[qKey]) return;
  const now = typeof getServerNow === 'function' ? getServerNow() : Date.now();
  item.qa[qKey].reply = replyText;
  item.qa[qKey].replyTime = now;

  // 送出回覆後自動收合該題的罐頭回覆面板，避免畫面過長
  if (AppState.expandedAdminReplyMap) {
    AppState.expandedAdminReplyMap[qKey] = false;
  }

  renderQA(true, qKey);
  renderAdminAllQA();
  window.scrollTo({ top: prevScroll, behavior: 'instant' });
  showToast('🛡️ 賣家官方回覆已送出並即時同步雲端！');

  const db = FirebaseManager.getDb();
  if (db && item.id) {
    db.ref(`auction/items/${item.id}/qa/${qKey}`).set(item.qa[qKey]).catch(() => {});
  }
  syncToFirebase();
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    syncToLocalServer();
  }
}

/** 刪除整筆提問留言 (從雲端與本地同步移除 - 最高權限管理者專屬，保持捲軸鎖定) */
function deleteQuestion(itemId, qKey) {
  if (!requireAdminAuth()) return;
  const prevScroll = window.scrollY;
  const item = AppState.items.find(i => i.id === itemId) || getActiveItem();
  if (item && item.qa && item.qa[qKey]) {
    delete item.qa[qKey];
  }
  renderQA(true, null);
  renderAdminAllQA();
  window.scrollTo({ top: prevScroll, behavior: 'instant' });
  showToast('🗑️ 已成功刪除該則提問！');

  const db = FirebaseManager.getDb();
  if (db && itemId) {
    db.ref(`auction/items/${itemId}/qa/${qKey}`).remove().catch(() => {});
  }
  syncToFirebase();
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    syncToLocalServer();
  }
}

/** 渲染管理者後台「💬 各商品買家提問即時總覽」（支援單則回覆獨立刪除與收合式罐頭快回） */
function renderAdminAllQA() {
  const container = el('admin-all-qa-list');
  if (!container) return;

  const allQAs = [];
  (AppState.items || []).forEach(item => {
    if (item.qa) {
      Object.keys(item.qa).forEach(k => {
        if (item.qa[k] && typeof item.qa[k] === 'object') {
          allQAs.push({
            itemId: item.id,
            itemName: item.name,
            qaKey: k,
            qa: item.qa[k]
          });
        }
      });
    }
  });

  const unansweredList = allQAs.filter(entry => isQuestionUnanswered(entry.qa));
  if (el('admin-qa-count-all')) el('admin-qa-count-all').textContent = String(allQAs.length);
  if (el('admin-qa-count-unanswered')) {
    el('admin-qa-count-unanswered').textContent = String(unansweredList.length);
    el('admin-qa-count-unanswered').classList.toggle('has-pending', unansweredList.length > 0);
  }
  if (el('admin-qa-count-hot')) el('admin-qa-count-hot').textContent = String(allQAs.length);

  const adminFilter = AppState.adminQaFilterMode || 'all';
  document.querySelectorAll('#admin-qa-filter-bar .qa-admin-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.adminQaFilter === adminFilter);
  });

  let displayList = [];
  if (adminFilter === 'unanswered') {
    displayList = unansweredList.slice().sort((a, b) => Number(b.qa.time || 0) - Number(a.qa.time || 0));
  } else if (adminFilter === 'hot') {
    displayList = allQAs.slice().sort((a, b) => getQuestionHeatScore(b.qa) - getQuestionHeatScore(a.qa));
  } else {
    displayList = allQAs.slice().sort((a, b) => Number(b.qa.time || 0) - Number(a.qa.time || 0));
  }

  if (!displayList.length) {
    const msg = (allQAs.length > 0 && adminFilter === 'unanswered')
      ? '🎉 目前所有商品的買家提問皆已回覆完畢！'
      : '目前尚無任何商品買家提問。';
    container.innerHTML = `
      <div style="font-size:.82rem;color:var(--c-text-3);text-align:center;padding:14px;background:rgba(255,255,255,0.02);border-radius:10px;">
        ${msg}
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  displayList.forEach((entry) => {
    const q = entry.qa;
    const isUnans = isQuestionUnanswered(q);
    const authorRaw = String(q.user || '買家').trim();
    const isBlack = isBuyerBlacklisted(q.phone, authorRaw);
    const avatarChar = authorRaw ? authorRaw.charAt(0).toUpperCase() : '買';
    const isAdminBoxOpen = Boolean(AppState.expandedAdminReplyMap && AppState.expandedAdminReplyMap[entry.qaKey]);

    const card = document.createElement('div');
    card.className = `qa-stream-item ${isUnans ? 'is-unanswered' : ''}`;

    const lineTag = q.line ? `<button type="button" class="buyer-contact-badge badge-line" data-line="${escapeHtml(q.line)}" title="點擊複製 Line ID 並開啟 Line" style="font-size:.64rem;padding:0 5px;">💬 Line: ${escapeHtml(q.line)}</button>` : '';
    const igTag = q.ig ? `<span class="buyer-contact-badge badge-ig" style="font-size:.64rem;padding:0 5px;">IG: ${escapeHtml(q.ig)}</span>` : '';
    const fbTag = q.fb ? `<span class="buyer-contact-badge badge-fb" style="font-size:.64rem;padding:0 5px;">FB</span>` : '';

    // 組合樓層回覆（每層皆具備獨立「🗑️ 刪除此回覆」按鈕）
    const floors = [];
    if (q.reply && String(q.reply).trim()) {
      floors.push({ floorType: 'main', replyIdx: -1, isSeller: true, author: AppState.studioName || '賣家官方回覆', text: q.reply, time: q.replyTime || q.time });
    }
    if (Array.isArray(q.replies)) {
      q.replies.forEach((r, rIdx) => {
        if (r && r.text) floors.push({ floorType: 'sub', replyIdx: rIdx, isSeller: Boolean(r.isSeller), author: r.author || authorRaw, text: r.text, time: r.time });
      });
    }
    const repliesHtml = floors.length
      ? `<div class="qa-thread-replies">${floors.map((fl, fIdx) => `
          <div class="qa-reply-floor ${fl.isSeller ? 'is-seller' : 'is-buyer'}">
            <div class="qa-reply-floor-hd">
              <span class="${fl.isSeller ? 'qa-seller-badge' : 'qa-buyer-floor-badge'}">${fl.isSeller ? '🛡️ 賣家官方回覆（建生工坊） ✓' : '💬 買家追問'} #${fIdx + 1}</span>
              <div class="qa-reply-floor-meta-right">
                <span class="qa-stream-time">${formatQAStreamTime(fl.time)}</span>
                <button type="button" class="btn-del-single-reply"
                  data-item-id="${escapeHtml(entry.itemId)}"
                  data-qa-key="${escapeHtml(entry.qaKey)}"
                  data-floor-type="${fl.floorType}"
                  data-reply-idx="${fl.replyIdx}"
                  title="刪除此筆回覆記錄">
                  🗑️ 刪除此回覆
                </button>
              </div>
            </div>
            <div class="qa-reply-floor-text">${escapeHtml(fl.text)}</div>
          </div>
        `).join('')}</div>`
      : '';

    const draftAdminKey = `inp-admin-reply-${entry.qaKey}`;
    const savedAdminDraft = (AppState.qaDraftTextMap && AppState.qaDraftTextMap[draftAdminKey]) ? AppState.qaDraftTextMap[draftAdminKey] : '';
    const cannedBtns = buildCannedChipsHtml(entry.itemId, entry.qaKey, 'inp-admin-reply-');

    card.innerHTML = `
      <div class="qa-avatar-col">
        <div class="qa-avatar ${isBlack ? 'is-blacklisted' : ''}">${escapeHtml(avatarChar)}</div>
        <div class="qa-timeline-line"></div>
      </div>
      <div class="qa-stream-main">
        <div class="qa-stream-header">
          <div class="qa-stream-user-group">
            <span class="item-tab-badge badge-live" style="font-size:.65rem;padding:0 6px;">📦 ${escapeHtml(entry.itemName.slice(0, 20))}</span>
            <span class="qa-author-name">👤 ${escapeHtml(authorRaw)}</span>
            <span class="qa-role-badge ${isUnans ? 'role-pending' : 'role-replied'}">${isUnans ? '⏳ 待回覆' : '✅ 已回覆'}</span>
          </div>
          <span class="qa-stream-time">${formatQAStreamTime(q.time)}</span>
        </div>
        <div class="qa-admin-contact-strip">
          ${q.phone ? `<a href="tel:${escapeHtml(q.phone)}" class="buyer-phone-link" data-phone="${escapeHtml(q.phone)}" title="點擊複製並撥打電話" style="padding:0 5px;font-size:.68rem;">📞 ${escapeHtml(q.phone)}</a>
          <button type="button" class="tbtn tbtn-ghost tbtn-xs btn-copy-phone" data-phone="${escapeHtml(q.phone)}" style="padding:0 4px;font-size:.64rem;">📋</button>` : '<span style="color:var(--c-text-3);">未留電話</span>'}
          ${lineTag}
          ${q.line ? `<button type="button" class="tbtn tbtn-ghost tbtn-xs btn-copy-line" data-line="${escapeHtml(q.line)}" style="padding:0 4px;font-size:.64rem;">📋</button>` : ''}
          ${igTag}
          ${fbTag}
          ${q.phone ? `<button type="button" class="tbtn ${isBlack ? 'tbtn-gold' : 'tbtn-danger'} tbtn-xs btn-toggle-blacklist" data-phone="${escapeHtml(q.phone)}" data-name="${escapeHtml(authorRaw)}" style="padding:0 5px;font-size:.64rem;">${isBlack ? '🔓 解封' : '🚫 封鎖'}</button>` : ''}
          <button type="button" class="btn-del-qa" data-item-id="${entry.itemId}" data-qa-key="${entry.qaKey}" style="margin-left:auto;font-size:.65rem;padding:0 5px;">🗑️ 刪除提問</button>
        </div>
        <div class="qa-stream-question-body">${escapeHtml(q.question)}</div>
        <div class="qa-stream-actions">
          <button type="button" class="qa-action-btn btn-qa-admin-reply-toggle ${isUnans ? 'is-unanswered-btn' : ''} ${isAdminBoxOpen ? 'active' : ''}" data-qa-key="${entry.qaKey}" data-box-prefix="qa-admin-overview-box-" data-input-prefix="inp-admin-reply-">
            <span>💬</span>
            <span>${isAdminBoxOpen ? '收合回覆面板 ▲' : (isUnans ? '回覆此提問 ▼' : '回覆 / 罐頭快答 ▼')}</span>
          </button>
        </div>
        ${repliesHtml}
        <div class="qa-admin-reply-box ${isAdminBoxOpen ? 'show' : ''}" id="qa-admin-overview-box-${entry.qaKey}">
          <div class="qa-canned-toolbar">
            <span class="qa-canned-title">⚡ 賣家一鍵罐頭快答（可複選智慧組合）：</span>
            <label class="qa-instant-send-lbl">
              <input type="checkbox" class="chk-qa-instant-canned" ${AppState.qaInstantCannedSend ? 'checked' : ''} style="accent-color:var(--c-gold-1);" />
              <span>⚡ 點擊罐頭句立即送出</span>
            </label>
          </div>
          <div class="qa-canned-chips-row">
            ${cannedBtns}
          </div>
          <div class="qa-admin-input-row">
            <textarea class="qa-admin-textarea" placeholder="${q.reply ? '輸入新內容以覆蓋主回覆，或點選上方多組快答自動組句…' : '點選上方快答標籤自動組合回覆，或手動輸入補充說明…'}" maxlength="600" id="inp-admin-reply-${entry.qaKey}">${escapeHtml(savedAdminDraft)}</textarea>
            <div class="qa-admin-btn-group">
              <button type="button" class="btn-clear-qa-draft" data-qa-key="${entry.qaKey}" data-input-prefix="inp-admin-reply-" title="一鍵取消所有已選快答標籤並清空文字">🧹 清空重選</button>
              <button type="button" class="tbtn tbtn-purple tbtn-xs btn-submit-qa-reply btn-admin-submit-reply" data-item-id="${entry.itemId}" data-qa-key="${entry.qaKey}" data-input-prefix="inp-admin-reply-" style="height:34px;padding:0 11px;font-weight:800;">
                ${q.reply ? '✏️ 覆蓋主回覆' : '🚀 送出回覆'}
              </button>
              ${q.reply ? `<button type="button" class="tbtn tbtn-gold tbtn-xs btn-append-qa-floor" data-item-id="${entry.itemId}" data-qa-key="${entry.qaKey}" data-input-prefix="inp-admin-reply-" style="height:34px;padding:0 9px;font-weight:800;">➕ 加蓋樓層</button>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  bindQAStreamItemEvents(container, null);
}

/** 渲染管理者後台「👥 已登入/註冊買家即時名冊（最高權限總覽）」 */
function renderAdminBuyersRoster() {
  const container = el('admin-buyers-list');
  const countBadge = el('admin-buyers-count');
  if (!container) return;

  const buyers = AppState.registeredBuyers || [];
  if (countBadge) {
    countBadge.textContent = `${buyers.length} 位買家`;
  }

  if (!buyers.length) {
    container.innerHTML = `
      <div style="font-size:.84rem;color:var(--c-text-3);padding:18px;text-align:center;background:rgba(255,255,255,0.02);border-radius:10px;">
        目前尚無任何買家登入資料。<br>當訪客在手機或前台填寫身分時，將即時解碼顯示於此！
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  buyers.forEach((b, idx) => {
    const card = document.createElement('div');
    card.className = 'admin-buyer-card';

    const timeStr = formatRelTime(b.updatedAt || b.createdAt || Date.now());
    const lineBadge = b.line
      ? `<button type="button" class="buyer-contact-badge badge-line" data-line="${escapeHtml(b.line)}" title="點擊複製 Line ID 並開啟 Line">💬 Line: ${escapeHtml(b.line)}</button>
         <button type="button" class="tbtn tbtn-ghost tbtn-xs btn-copy-line" data-line="${escapeHtml(b.line)}" title="複製 Line ID" style="padding:2px 6px;font-size:.7rem;">📋 複製</button>`
      : '';
    const igBadge = b.ig
      ? `<span class="buyer-contact-badge badge-ig">IG: ${escapeHtml(b.ig)}</span>`
      : '';
    const fbBadge = b.fb
      ? `<a href="${escapeHtml(b.fb.startsWith('http') ? b.fb : 'https://' + b.fb)}" target="_blank" rel="noopener" class="buyer-contact-badge badge-fb" style="text-decoration:none;">FB 連結 ↗</a>`
      : '';

    const isPerm = isPermanentRetention(b.retentionDays) || Boolean(b.isPermanent);
    const retDays = isPerm ? 'forever' : ([7, 10, 15].includes(Number(b.retentionDays)) ? Number(b.retentionDays) : 7);
    const expStr = (!isPerm && b.retentionExpiresAt)
      ? new Date(Number(b.retentionExpiresAt)).toLocaleDateString('zh-TW')
      : `${retDays}天內有效`;
    const retentionBadgeHtml = isPerm
      ? `<span class="buyer-status-chip chip-retention chip-retention-forever">♾️ 永久保留</span>`
      : `<span class="buyer-status-chip chip-retention">📅 保留 ${retDays} 天（至 ${expStr}）</span>`;
    const lockCheck = checkBuyerHighBidderLock(b.phone, b.name);
    const lockChipHtml = lockCheck.locked
      ? `<span class="buyer-status-chip chip-locked" title="目前領先商品：${escapeHtml(lockCheck.itemName)}">🔒 最高出價鎖定中（${escapeHtml(lockCheck.itemName.slice(0, 10))}…）</span>`
      : `<span class="buyer-status-chip chip-unlocked">🟢 可自由登出</span>`;
    const isBlocked = isBuyerBlacklisted(b.phone);
    const blacklistChipHtml = isBlocked
      ? `<span class="buyer-status-chip chip-blacklisted">🚫 黑名單已封鎖</span>`
      : '';

    card.innerHTML = `
      <div class="admin-buyer-header" style="flex-wrap:wrap;gap:6px;">
        <div class="admin-buyer-name" style="flex-wrap:wrap;gap:6px;">
          <span style="font-family:monospace;font-size:.78rem;background:rgba(255,215,0,0.15);color:var(--c-gold-1);padding:1px 6px;border-radius:4px;">#${String(idx + 1).padStart(2, '0')}</span>
          <span>👤 ${escapeHtml(b.name || '訪客買家')}</span>
          ${retentionBadgeHtml}
          ${lockChipHtml}
          ${blacklistChipHtml}
        </div>
        <div class="admin-buyer-time">🕒 最後更新/上線：${timeStr}</div>
      </div>
      <div class="admin-buyer-contacts" style="flex-wrap:wrap;gap:6px;">
        <a href="tel:${escapeHtml(b.phone || '')}" class="buyer-phone-link" data-phone="${escapeHtml(b.phone || '')}" title="點擊複製並撥打手機">
          📞 <strong>${escapeHtml(b.phone || '無電話')}</strong>（撥號）
        </a>
        ${b.phone ? `<button type="button" class="tbtn tbtn-ghost tbtn-xs btn-copy-phone" data-phone="${escapeHtml(b.phone)}" title="複製電話號碼" style="padding:2px 6px;font-size:.7rem;">📋 複製電話</button>` : ''}
        ${lineBadge}
        ${igBadge}
        ${fbBadge}
        ${b.phone ? `<button type="button" class="tbtn ${isBlocked ? 'tbtn-success' : 'tbtn-danger'} tbtn-xs btn-toggle-blacklist" data-phone="${escapeHtml(b.phone)}" data-name="${escapeHtml(b.name || '')}" style="margin-left:auto;padding:2px 8px;font-size:.7rem;">${isBlocked ? '✅ 解除黑名單' : '🚫 列入黑名單'}</button>` : ''}
      </div>
    `;

    container.appendChild(card);
  });

  container.querySelectorAll('.btn-copy-phone').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const phoneNum = btn.dataset.phone;
      if (!phoneNum) return;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(phoneNum).then(() => {
          showToast(`📋 已複製手機號碼: ${phoneNum}`);
        });
      } else {
        showToast(`📋 手機號碼: ${phoneNum}`);
      }
    });
  });

  container.querySelectorAll('.btn-copy-line').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const lineId = btn.dataset.line;
      if (!lineId) return;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(lineId).then(() => {
          showToast(`📋 已複製 Line ID: ${lineId}`);
        });
      } else {
        const t = document.createElement('textarea');
        t.value = lineId;
        document.body.appendChild(t);
        t.select();
        document.execCommand('copy');
        document.body.removeChild(t);
        showToast(`📋 已複製 Line ID: ${lineId}`);
      }
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   9. 嚴格出價檢驗與送出 (Strict Bidding Validation)
   ───────────────────────────────────────────────────────────── */

// === 出價送出與 Firebase Transaction 原子交易 + 防壓標機制 ===
let isSubmittingBid = false;

async function submitBidTransaction(itemId, bidAmountTWD, buyerProfile) {
  if (isSubmittingBid) return;

  const submitBtn = document.getElementById('btn-submit-bid');
  const submitText = document.getElementById('btn-submit-text');
  const bidInput = document.getElementById('inp-bid-val');

  // 1. 立即鎖定按鈕防止重複點擊
  isSubmittingBid = true;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.dataset.submitting = 'true';
  }
  if (submitText) submitText.textContent = '出標同步中…';

  try {
    const itemRef = firebase.database().ref(`auction/items/${itemId}`);
    let extendMessage = '';

    const result = await itemRef.transaction((item) => {
      if (!item) {
        const local = AppState.items.find(i => i.id === itemId);
        if (local) {
          item = {
            id: local.id,
            name: local.name,
            startPrice: Number(local.startPrice || 0),
            increment: Number(local.increment || 10),
            currentPrice: Number(local.currentPrice || local.currentBid || local.startPrice || 0),
            endTime: Number(local.endTime || 0),
            status: local.status || 'active',
            timeMode: local.timeMode || 'fixed',
            antiSnipeEnable: local.antiSnipeEnable !== false && local.antiSnipeEnabled !== false,
            antiSnipeMins: Number(local.antiSnipeMins || 3),
            antiSnipeExt: Number(local.antiSnipeExt || local.antiSnipeExtMins || 3),
            bids: local.bids || {}
          };
        } else {
          return item; // 節點尚未載入時返回原值
        }
      }

      const now = getServerNow();
      const endTime = Number(item.endTime || 0);

      // 檢查是否已經結標
      if (item.status === 'ended' || (endTime > 0 && now >= endTime)) {
        return; // 中止 Transaction
      }

      const startPrice = Number(item.startPrice || 0);
      const increment = Number(item.increment || 10);
      const currentPrice = Number(item.currentPrice || 0);
      const hasBids = item.bids && Object.keys(item.bids).length > 0;

      // 計算最低合法出價金額
      const minRequiredBid = hasBids ? (currentPrice + increment) : Math.max(startPrice, increment);
      if (bidAmountTWD < minRequiredBid) {
        return; // 出價低於最新門檻，中止 Transaction
      }

      // 更新最高價與領先買家資訊
      item.currentPrice = bidAmountTWD;
      item.topBidder = {
        name: buyerProfile.name,
        phone: buyerProfile.phone,
        line: buyerProfile.line || '',
        ig: buyerProfile.ig || '',
        fb: buyerProfile.fb || '',
        timestamp: now
      };

      // 新增出價歷史紀錄 (完整記錄買家聯絡資訊以供管理者後台解碼)
      if (!item.bids) item.bids = {};
      const newBidKey = `bid_${now}_${Math.random().toString(36).slice(2, 7)}`;
      item.bids[newBidKey] = {
        bidderName: buyerProfile.name,
        bidderPhone: buyerProfile.phone,
        bidderPhoneMasked: maskPhone(buyerProfile.phone),
        bidderLine: buyerProfile.line || '',
        bidderIg: buyerProfile.ig || '',
        bidderFb: buyerProfile.fb || '',
        amount: bidAmountTWD,
        timestamp: now
      };

      // 處理競標時間模式（選項 A 固定期限防壓標 vs 選項 B 24小時動態重置）
      if (item.timeMode === 'reset24') {
        item.endTime = now + (24 * 60 * 60 * 1000);
        extendMessage = '⚡ 已觸發 24 小時動態重置，倒數計時重新計算！';
      } else if (item.antiSnipeEnable !== false) {
        const triggerMs = Number(item.antiSnipeMins || 3) * 60 * 1000;
        const extMs = Number(item.antiSnipeExt || 3) * 60 * 1000;
        const remainingMs = endTime - now;

        // 若進入結標前 N 分鐘防壓標區間，自動延長結束時間
        if (remainingMs > 0 && remainingMs <= triggerMs) {
          item.endTime = endTime + extMs;
          extendMessage = `🛡️ 觸發防壓標保護！結標時間已自動延長 ${item.antiSnipeExt || 3} 分鐘。`;
        }
      }

      return item;
    });

    if (!result.committed) {
      showToast('⚠️ 出價失敗：可能已有其他買家搶先出更高價，或競標已結束！');
    } else {
      showToast(extendMessage || '🎉 出價成功！您目前已成為最高出價領先者！');
      if (bidInput) {
        const nextIncrement = Number(result.snapshot.val()?.increment || 10);
        bidInput.value = bidAmountTWD + nextIncrement;
      }
      // 鏡像更新至 auction/items 與 settings/buyers
      try {
        const valSnap = result.snapshot.val();
        if (valSnap) {
          firebase.database().ref(`auction/items/${itemId}`).update(valSnap).catch(() => {});
        }
        const key = buyerProfile.phone.replace(/[^0-9]/g, '');
        const bSync = {
          name: buyerProfile.name,
          phone: buyerProfile.phone,
          line: buyerProfile.line || '',
          ig: buyerProfile.ig || '',
          fb: buyerProfile.fb || '',
          updatedAt: getServerNow(),
          lastBidItem: itemId,
          lastBidAmount: bidAmountTWD
        };
        firebase.database().ref('settings/buyers/' + key).update(bSync).catch(() => {});
        firebase.database().ref('buyers/' + key).update(bSync).catch(() => {});
      } catch (e) {}
      const val = result.snapshot.val();
      const localItem = AppState.items.find(i => i.id === itemId);
      if (localItem && val) {
        localItem.currentPrice = val.currentPrice;
        localItem.currentBid = val.currentPrice;
        localItem.endTime = val.endTime;
        localItem.topBidder = buyerProfile.name;
        localItem.topBidderContact = JSON.parse(JSON.stringify(buyerProfile));
        localItem.topBidTime = getServerNow();
        if (val.bids) localItem.bids = val.bids;
        if (!localItem.bidHistory) localItem.bidHistory = [];
        localItem.bidHistory.push({
          user: buyerProfile.name,
          amount: bidAmountTWD,
          time: getServerNow(),
          contact: JSON.parse(JSON.stringify(buyerProfile)),
          phoneMasked: maskPhone(buyerProfile.phone)
        });
      }
      renderActiveItemDisplay();
      renderItemTabs();
      renderBidHistory();
      renderWinnerStatus();
      triggerConfetti();
      syncToFirebase();
    }
  } catch (err) {
    console.error('Bid transaction error:', err);
    // 展示/離線模式保底容錯
    const localItem = AppState.items.find(i => i.id === itemId);
    if (localItem && (!firebase.apps || !firebase.apps.length || !FirebaseManager.isReady())) {
      const now = getServerNow();
      localItem.currentPrice = bidAmountTWD;
      localItem.currentBid = bidAmountTWD;
      localItem.topBidder = buyerProfile.name;
      localItem.topBidderContact = JSON.parse(JSON.stringify(buyerProfile));
      localItem.topBidTime = now;
      if (!localItem.bidHistory) localItem.bidHistory = [];
      localItem.bidHistory.push({
        user: buyerProfile.name,
        amount: bidAmountTWD,
        time: now,
        contact: JSON.parse(JSON.stringify(buyerProfile)),
        phoneMasked: maskPhone(buyerProfile.phone)
      });
      if (localItem.timeMode === 'reset24') {
        localItem.endTime = now + (24 * 60 * 60 * 1000);
      }
      renderActiveItemDisplay();
      renderItemTabs();
      renderBidHistory();
      renderWinnerStatus();
      triggerConfetti();
      showToast(localItem.timeMode === 'reset24' ? '⚡ 已觸發 24 小時動態重置，倒數重新起算！' : '🎉 出價成功！您目前已成為最高出價領先者！');
      if (bidInput) {
        bidInput.value = bidAmountTWD + Number(localItem.increment || 10);
      }
    } else {
      showToast('❌ 網路連線異常，請稍後再試。');
    }
  } finally {
    // 2. 解鎖按鈕狀態
    isSubmittingBid = false;
    if (submitBtn) {
      delete submitBtn.dataset.submitting;
      submitBtn.disabled = false;
    }
    if (submitText) submitText.textContent = '立即出標';
    updateAuctionTimerUI();
  }
}

function maskPhone(phone = '') {
  const clean = String(phone).replace(/\D/g, '');
  if (clean.length < 7) return clean;
  return clean.slice(0, 4) + '***' + clean.slice(-3);
}

async function handleBidSubmit() {
  const item = getActiveItem();
  if (!item) {
    showToast('⚠️ 目前尚無可出標之商品！');
    return;
  }

  if (item.status === 'ended' || item.status === 'picked_up') {
    showToast('⚠️ 本商品拍賣已結束，無法再出價！');
    return;
  }

  // 🛡️ 模式 A 防誤觸出價保護：當管理員處於「🛡️ 官方管理者」身分時，攔截出價並引導切換為「🧪 測試買家分身」
  if (AppState.isAdmin && AppState.isAdminAuthenticated && AppState.activeIdentityRole === 'seller') {
    showToast('🛡️ 您目前處於「官方管理者」身分（防誤觸出價保護中）！請先選擇一組「🧪 測試買家分身」再進行競標測試。', 4200);
    openBuyerProfileModal();
    return;
  }

  if (!AppState.userProfile.name || !AppState.userProfile.phone) {
    openBuyerProfileModal();
    return;
  }

  const inpBid = el('inp-bid-val');
  const bidAmt = Number(inpBid ? inpBid.value : 0);

  const curPrice = Number(item.currentPrice ?? item.currentBid ?? 0);
  const inc = Number(item.increment || 10);
  const hasPriorBids = !!item.topBidder || (item.bids && Object.keys(item.bids).length > 0) || (item.bidHistory && item.bidHistory.length > 0);
  const minRequired = hasPriorBids ? (curPrice + inc) : Math.max(Number(item.startPrice || 0), inc);

  if (bidAmt <= curPrice && curPrice > 0) {
    alert(`❌ 出價無效！\n您的出價（${formatMoney(bidAmt)}）必須「嚴格大於」目前最高價（${formatMoney(curPrice)}）。\n腳本已攔截並阻止出價！`);
    if (inpBid) inpBid.value = minRequired;
    return;
  }

  if (bidAmt < minRequired) {
    alert(`❌ 出價未達加價門檻！\n目前下一口最低出價必須為 ${formatMoney(minRequired)}（每口加價 ${formatMoney(inc)}）。\n腳本已阻止出價！`);
    if (inpBid) inpBid.value = minRequired;
    return;
  }

  const phoneCheck = validatePhoneNumber(AppState.userProfile.phone, AppState.userProfile.name);
  if (!phoneCheck.valid) {
    alert(phoneCheck.message);
    openBuyerProfileModal();
    return;
  }

  await submitBidTransaction(item.id, bidAmt, AppState.userProfile);
}

/* ─────────────────────────────────────────────────────────────
   10. 出價超越通知監聽 (Outbid Alert - 核心功能 5)
   ───────────────────────────────────────────────────────────── */
function checkOutbidNotice(itemId, newTopBidder, newAmount) {
  const myName = AppState.userProfile.name;
  if (!myName) return;

  const topName = getBidderName(newTopBidder);
  const prev = AppState.prevTopBidders[itemId];
  if (prev && prev === myName && topName !== myName) {
    const modal = el('modal-outbid-alert');
    const msg = el('outbid-alert-msg');
    const price = el('outbid-new-price');
    if (msg) msg.textContent = `買家「${maskBuyerName(topName)}」剛剛提出了更高金額，超越了您的領先地位！`;
    if (price) price.textContent = formatMoney(newAmount, AppState.activeCurrency);
    if (modal) modal.classList.add('show');

    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200, 100]);
  }

  AppState.prevTopBidders[itemId] = topName;
}

/* ─────────────────────────────────────────────────────────────
   11. 最高權限管理者驗證與全站控制模組 (Super Admin Auth & Actions)
   ───────────────────────────────────────────────────────────── */

/** 檢查本機或當次瀏覽階段是否已通過最高權限管理者驗證 */
function checkSavedAdminAuth() {
  try {
    if (sessionStorage.getItem('agy_admin_explicit_logout') === '1') return false;
    if (SafeStorage.get(ADMIN_AUTH_STORAGE_KEY) === ADMIN_TOKEN_VAL) return true;
    if (sessionStorage.getItem(ADMIN_AUTH_SESSION_KEY) === ADMIN_TOKEN_VAL) return true;
    // 若本機已儲存之買家資料為最高管理者本人建立之測試帳號（小建 0931849482 / Line: guess_chen1981），自動識別並解鎖切換器
    const savedBuyer = SafeStorage.get('agy_buyer_profile') || AppState.userProfile;
    if (savedBuyer && typeof savedBuyer === 'object') {
      const bPhone = String(savedBuyer.phone || '').replace(/[^0-9]/g, '');
      const bLine = String(savedBuyer.line || '').trim();
      if (bPhone === '0931849482' || bLine === SUPER_ADMIN_ACCOUNT) {
        SafeStorage.set(ADMIN_AUTH_STORAGE_KEY, ADMIN_TOKEN_VAL);
        return true;
      }
    }
    const backupBuyer = SafeStorage.get('agy_test_buyer_backup');
    if (backupBuyer && typeof backupBuyer === 'object') {
      const bkPhone = String(backupBuyer.phone || '').replace(/[^0-9]/g, '');
      const bkLine = String(backupBuyer.line || '').trim();
      if (bkPhone === '0931849482' || bkLine === SUPER_ADMIN_ACCOUNT) {
        SafeStorage.set(ADMIN_AUTH_STORAGE_KEY, ADMIN_TOKEN_VAL);
        return true;
      }
    }
  } catch (e) {}
  return false;
}

/** 同步全站最高權限管理者 UI 狀態（導覽列按鈕、下拉選單、前台管理控制項與個資解碼） */
function syncAdminUIState() {
  const isAuth = !!(AppState.isAdmin && AppState.isAdminAuthenticated);
  const pageAdmin = el('page-admin');
  const pageAuction = el('page-auction');
  const isViewingAdminPage = pageAdmin?.classList.contains('active');

  // 若未通過最高權限驗證卻處於後台頁面，強制退回前台拍賣頁
  if (!isAuth && isViewingAdminPage) {
    if (pageAdmin) {
      pageAdmin.classList.remove('active');
      pageAdmin.style.display = 'none';
    }
    if (pageAuction) {
      pageAuction.classList.add('active');
      pageAuction.style.display = 'block';
    }
  }

  const switchBtn = el('btn-switch-mode');
  const switchIcon = el('switch-mode-icon');
  const switchText = el('switch-mode-text');
  const nowInAdmin = pageAdmin?.classList.contains('active');

  if (switchBtn) {
    switchBtn.classList.toggle('admin-unlocked', isAuth);
  }
  if (switchIcon) {
    switchIcon.textContent = !isAuth ? '🔒' : (nowInAdmin ? '👁️' : '👑');
  }
  if (switchText) {
    switchText.textContent = nowInAdmin ? '前台' : '後台';
  }

  // 導覽列更多選單與後台頂部之 Firebase 設定按鈕顯隱控制（僅限已登入最高管理者）
  const navFbBtn = el('btn-nav-fb-config');
  if (navFbBtn) navFbBtn.style.display = isAuth ? 'flex' : 'none';
  const adminFbBtn = el('btn-fb-config');
  if (adminFbBtn) adminFbBtn.style.display = isAuth ? 'inline-flex' : 'none';
  const navIdSwitcher = el('nav-dropdown-identity-switcher');
  if (navIdSwitcher) navIdSwitcher.style.display = isAuth ? 'block' : 'none';
  const navUnlockBtn = el('btn-nav-unlock-admin-switcher');
  if (navUnlockBtn) navUnlockBtn.style.display = isAuth ? 'none' : 'flex';
  const buyerModalUnlockBar = el('buyer-modal-admin-unlock-bar');
  if (buyerModalUnlockBar) buyerModalUnlockBar.style.display = isAuth ? 'none' : 'flex';
  if (!isAuth) {
    el('modal-fb-setup')?.classList.remove('show');
  }
  const navLogoutBtn = el('btn-nav-admin-logout');
  if (navLogoutBtn) navLogoutBtn.style.display = isAuth ? 'flex' : 'none';

  // 前台倒數卡片下方之管理者應變控制列
  const adminItemControls = el('admin-item-controls');
  if (adminItemControls) {
    adminItemControls.style.display = isAuth ? 'flex' : 'none';
  }

  try { syncIdentityDisplayUI(); } catch (e) {}
  // 重新渲染前台與後台組件以即時套用個資解碼或隱私遮罩
  try { renderActiveItemDisplay(); } catch (e) {}
  try { renderBidHistory(); } catch (e) {}
  try { renderQA(); } catch (e) {}
  try { renderWinnerStatus(); } catch (e) {}
  if (isAuth) {
    try { renderAdminItemsList(); } catch (e) {}
    try { renderAdminBuyersRoster(); } catch (e) {}
    try { renderAdminAllQA(); } catch (e) {}
  }
}

/** 開啟最高權限管理者登入視窗 */
function openAdminLoginModal(onSuccessCallback = null) {
  AppState.pendingAdminAction = (typeof onSuccessCallback === 'function') ? onSuccessCallback : null;
  const modal = el('modal-admin-login');
  const errBox = el('admin-login-error');
  const accInp = el('inp-admin-account');
  const pwdInp = el('inp-admin-password');
  const pwdIcon = el('toggle-pwd-icon');
  const pwdText = el('toggle-pwd-text');

  if (errBox) errBox.style.display = 'none';
  if (pwdInp) {
    pwdInp.type = 'password';
    pwdInp.value = '';
  }
  if (pwdIcon) pwdIcon.textContent = '👁️';
  if (pwdText) pwdText.textContent = '顯示';

  if (modal) modal.classList.add('show');
  setTimeout(() => {
    if (accInp && !accInp.value.trim()) {
      accInp.focus();
    } else if (pwdInp) {
      pwdInp.focus();
    }
  }, 80);
}

/** 關閉最高權限管理者登入視窗 */
function closeAdminLoginModal() {
  const modal = el('modal-admin-login');
  const errBox = el('admin-login-error');
  if (modal) modal.classList.remove('show');
  if (errBox) errBox.style.display = 'none';
  AppState.pendingAdminAction = null;
}

/** 切換顯示/隱藏管理者密碼（支援手機好按大按鈕） */
function toggleAdminPasswordVisibility() {
  const pwdInp = el('inp-admin-password');
  const pwdIcon = el('toggle-pwd-icon');
  const pwdText = el('toggle-pwd-text');
  if (!pwdInp) return;

  const isHidden = pwdInp.type === 'password';
  pwdInp.type = isHidden ? 'text' : 'password';
  if (pwdIcon) pwdIcon.textContent = isHidden ? '🙈' : '👁️';
  if (pwdText) pwdText.textContent = isHidden ? '隱藏' : '顯示';
  pwdInp.focus();
}

/** 切換至後台管理控制中心（需先通過最高權限驗證） */
function switchToAdminPage() {
  if (!requireAdminAuth(() => switchToAdminPage())) return;

  const pageAuction = el('page-auction');
  const pageAdmin = el('page-admin');
  if (pageAuction) {
    pageAuction.classList.remove('active');
    pageAuction.style.display = 'none';
  }
  if (pageAdmin) {
    pageAdmin.classList.add('active');
    pageAdmin.style.display = 'block';
  }
  try {
    sessionStorage.setItem('auction_active_page', 'admin');
  } catch (e) {}

  syncAdminUIState();
  try {
    if (AppState.activeItemId) {
      loadItemIntoEditForm(AppState.activeItemId);
    }
  } catch (e) { console.error('loadItemIntoEditForm 錯誤:', e); }
  showToast('👑 已進入【最高權限管理者後台控制中心】');
}

/** 切換至前台拍賣頁面 */
function switchToAuctionPage() {
  const pageAuction = el('page-auction');
  const pageAdmin = el('page-admin');
  if (pageAdmin) {
    pageAdmin.classList.remove('active');
    pageAdmin.style.display = 'none';
  }
  if (pageAuction) {
    pageAuction.classList.add('active');
    pageAuction.style.display = 'block';
  }
  try {
    sessionStorage.setItem('auction_active_page', 'auction');
  } catch (e) {}

  syncAdminUIState();
  try { renderItemTabs(); } catch (e) { console.error('renderItemTabs 錯誤:', e); }
  showToast('👁️ 已切換至【前台競標頁面】');
}

/** 執行最高權限管理者帳號密碼驗證 */
function handleAdminLoginSubmit() {
  const accInp = el('inp-admin-account');
  const pwdInp = el('inp-admin-password');
  const remChk = el('chk-admin-remember');
  const errBox = el('admin-login-error');

  const account = accInp ? accInp.value.trim() : '';
  const password = pwdInp ? pwdInp.value.trim() : '';
  const remember = remChk ? !!remChk.checked : true;

  if (account !== SUPER_ADMIN_ACCOUNT || password !== SUPER_ADMIN_PASS) {
    if (errBox) {
      errBox.style.display = 'block';
      errBox.style.animation = 'none';
      void errBox.offsetWidth;
      errBox.style.animation = 'adminShake .35s ease';
    }
    if ('vibrate' in navigator) {
      try { navigator.vibrate([100, 50, 100]); } catch (e) {}
    }
    showToast('❌ 管理者帳號或密碼錯誤，請重新確認！');
    return;
  }

  // 驗證通過：解鎖最高管理者完整控制權
  AppState.isAdminAuthenticated = true;
  AppState.isAdmin = true;

  try {
    sessionStorage.removeItem('agy_admin_explicit_logout');
    sessionStorage.setItem(ADMIN_AUTH_SESSION_KEY, ADMIN_TOKEN_VAL);
  } catch (e) {}

  if (remember) {
    SafeStorage.set(ADMIN_AUTH_STORAGE_KEY, ADMIN_TOKEN_VAL);
  } else {
    SafeStorage.remove(ADMIN_AUTH_STORAGE_KEY);
  }

  if (pwdInp) pwdInp.value = '';
  const pendingCb = AppState.pendingAdminAction;
  closeAdminLoginModal();
  syncAdminUIState();
  applyRoleBasedQADefaults(false);
  renderQA(true, null);

  if (typeof pendingCb === 'function') {
    pendingCb();
  } else {
    switchToAdminPage();
  }
  showToast('👑 最高權限管理者登入成功！已解鎖全站控制與買家完整聯絡資訊！');
}

/** 安全登出並鎖定管理後台 */
function handleAdminLogout() {
  AppState.isAdminAuthenticated = false;
  AppState.isAdmin = false;
  AppState.pendingAdminAction = null;

  SafeStorage.remove(ADMIN_AUTH_STORAGE_KEY);
  try {
    sessionStorage.setItem('agy_admin_explicit_logout', '1');
    sessionStorage.removeItem(ADMIN_AUTH_SESSION_KEY);
    sessionStorage.setItem('auction_active_page', 'auction');
  } catch (e) {}

  el('modal-fb-setup')?.classList.remove('show');
  el('nav-more-dropdown')?.classList.remove('show');

  applyRoleBasedQADefaults(false);
  switchToAuctionPage();
  renderQA(true, null);
  showToast('🔒 已安全登出並鎖定管理後台！目前恢復為一般買家隱私保護模式。');
}

/** 最高權限管理者門禁檢查（未登入時自動攔截並彈出驗證視窗） */
function requireAdminAuth(onSuccessCallback = null) {
  if (AppState.isAdmin && AppState.isAdminAuthenticated) {
    return true;
  }
  showToast('🔒 此功能僅限最高權限管理者使用，請先輸入帳號密碼驗證！');
  openAdminLoginModal(onSuccessCallback);
  return false;
}

/** 手動提前結標按鈕 */
function handleAdminEndEarly() {
  if (!requireAdminAuth(() => handleAdminEndEarly())) return;
  const item = getActiveItem();
  if (!item || item.status === 'ended') return;

  if (!confirm(`🛑 確定要立即手動提前結束【${item.name}】的競標嗎？\n結標後將鎖定當前最高出價者為得標人，並向全員廣播通知。`)) {
    return;
  }

  item.status = 'ended';
  item.endTime = getServerNow();
  renderWinnerStatus();
  renderItemTabs();
  if (typeof updateAuctionTimerUI === 'function') {
    updateAuctionTimerUI();
  }

  sendBroadcast(`📢 賣家公告：商品【${item.name}】已手動提前結標！恭喜得標買家 ${maskBuyerName(item.topBidder || '無人出標')}！`);
  syncToFirebase();
}

/** 確認客人已取貨 */
function handleAdminMarkPickedUp() {
  if (!requireAdminAuth(() => handleAdminMarkPickedUp())) return;
  const item = getActiveItem();
  if (!item) return;

  item.status = 'picked_up';
  renderWinnerStatus();
  renderItemTabs();
  showToast(`✅ 商品【${item.name}】已成功標記為「已取貨完成」歸檔！`);
  syncToFirebase();
}

/**
 * 徹底移除商品刪除限制 (核心功能 1 修復)：
 * 允許刪除全部商品！當最後一個商品被刪除時，資料庫允許清空，
 * 前台自動切換為「目前尚無競標商品」的乾淨提示版面。
 */
function handleAdminDeleteItem(targetItemId) {
  if (!requireAdminAuth(() => handleAdminDeleteItem(targetItemId))) return;
  const item = targetItemId
    ? AppState.items.find(i => i.id === targetItemId)
    : getActiveItem();
  if (!item) return;

  if (!confirm(`🗑️ 確定要刪除拍賣品項【${item.name}】嗎？\n此動作將同步從雲端資料庫移除！`)) {
    return;
  }

  // 移除指定商品，無任何保留一個之限制
  AppState.items = AppState.items.filter(i => i.id !== item.id);
  AppState.activeItemId = AppState.items.length ? AppState.items[0].id : null;

  renderItemTabs();
  renderActiveItemDisplay();
  renderBidHistory();
  renderQA();
  renderWinnerStatus();
  renderAdminItemsList();

  if (AppState.activeItemId) {
    loadItemIntoEditForm(AppState.activeItemId);
  } else {
    // 全部清空時，重置編輯表單預覽
    if (el('edit-item-name-preview')) el('edit-item-name-preview').textContent = '尚無品項';
    if (el('edit-item-name')) el('edit-item-name').value = '';
    if (el('edit-item-subtitle')) el('edit-item-subtitle').value = '';
    if (el('edit-item-desc')) el('edit-item-desc').value = '';
    if (el('edit-item-video-url')) el('edit-item-video-url').value = '';
    if (el('edit-item-images')) el('edit-item-images').value = '';
    AppState.currentEditImages = [];
    if (el('edit-thumbs-grid')) el('edit-thumbs-grid').innerHTML = '';
  }

  showToast(`🗑️ 已成功刪除品項【${item.name}】！`);
  syncToFirebase();
}

/** 手動輸入公告並廣播給所有買家 */
function sendBroadcast(text) {
  const msg = text || (el('admin-broadcast-input') ? el('admin-broadcast-input').value.trim() : '');
  if (!msg) {
    showToast('請輸入廣播內容！');
    return;
  }

  const bObj = { msg: msg, time: Date.now() };
  AppState.broadcasts.push(bObj);

  showTopBroadcastBanner(msg);

  if (el('admin-broadcast-input')) el('admin-broadcast-input').value = '';
  renderBroadcastHistory();
  showToast('📢 全員廣播公告已成功發送！');

  syncToFirebase();
}

function showTopBroadcastBanner(msg) {
  const b = el('broadcast-banner');
  const txt = el('broadcast-text');
  if (!b || !txt) return;
  txt.textContent = msg;
  b.classList.add('show');
  clearTimeout(b._timer);
  b._timer = setTimeout(() => b.classList.remove('show'), 15000);
}

function renderBroadcastHistory() {
  const box = el('admin-broadcast-history');
  if (!box) return;
  box.innerHTML = '';
  AppState.broadcasts.slice().reverse().slice(0, 5).forEach(b => {
    box.innerHTML += `
      <div style="background:rgba(255,255,255,0.05);padding:4px 8px;border-radius:6px;font-size:.74rem;">
        <span style="color:var(--c-text-3);">${formatRelTime(b.time)}</span>：${escapeHtml(b.msg)}
      </div>
    `;
  });
}

/* ─────────────────────────────────────────────────────────────
   12. 圖片拖曳上傳與管理模組 (Drag & Drop Images - 核心功能 2)
   ───────────────────────────────────────────────────────────── */
function renderEditThumbs() {
  const box = el('edit-thumbs-grid');
  if (!box) return;
  box.innerHTML = '';

  if (!AppState.currentEditImages.length) {
    box.innerHTML = '<div style="font-size:.74rem;color:var(--c-text-3);padding:6px;">尚未上傳或設定圖片</div>';
    return;
  }

  AppState.currentEditImages.forEach((src, idx) => {
    const itemEl = document.createElement('div');
    itemEl.className = 'edit-thumb-item';
    itemEl.title = '點擊設為封面首圖';

    const coverTag = idx === 0 ? '<span class="edit-thumb-cover-tag">封面</span>' : '';
    const moveBtn = idx > 0 ? `<button class="edit-thumb-move" type="button" title="設為封面" data-action="make-cover" data-idx="${idx}">👑</button>` : '';

    itemEl.innerHTML = `
      <img src="${src}" class="edit-thumb-img" alt="圖片 ${idx + 1}" />
      ${coverTag}
      <button class="edit-thumb-del" type="button" title="刪除圖片" data-action="del" data-idx="${idx}">✕</button>
      ${moveBtn}
    `;

    // 刪除單張圖片
    itemEl.querySelector('[data-action="del"]').addEventListener('click', (e) => {
      e.stopPropagation();
      AppState.currentEditImages.splice(idx, 1);
      renderEditThumbs();
      showToast('已移除該張圖片');
    });

    // 設為封面
    itemEl.querySelector('[data-action="make-cover"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const img = AppState.currentEditImages.splice(idx, 1)[0];
      AppState.currentEditImages.unshift(img);
      renderEditThumbs();
      showToast('已將該圖片設為封面主圖！');
    });

    // 點擊本體直接設為封面
    itemEl.addEventListener('click', () => {
      if (idx !== 0) {
        const img = AppState.currentEditImages.splice(idx, 1)[0];
        AppState.currentEditImages.unshift(img);
        renderEditThumbs();
        showToast('已將該圖片設為封面主圖！');
      }
    });

    box.appendChild(itemEl);
  });

  if (el('edit-item-images')) {
    el('edit-item-images').value = AppState.currentEditImages.join('\n');
  }
}

function handleImageFiles(fileList) {
  let loaded = 0;
  const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
  if (!files.length) {
    showToast('請選取有效的圖檔 (JPG, PNG, WEBP, GIF)！');
    return;
  }

  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      AppState.currentEditImages.push(ev.target.result);
      loaded++;
      renderEditThumbs();
      if (loaded === files.length) {
        showToast(`📷 已成功載入 ${loaded} 張圖片！點選任一張可設為封面。`);
      }
    };
    reader.readAsDataURL(file);
  });
}

function setupImageDropzone() {
  const dropzone = el('img-dropzone');
  const fileInput = el('edit-img-file-input');
  const browseBtn = el('btn-browse-images');
  const applyUrlsBtn = el('btn-apply-img-urls');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    browseBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });

    // 拖曳進入 / 懸停樣式
    ['dragenter', 'dragover'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('drag-over');
      });
    });

    ['dragleave', 'dragend', 'drop'].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('drag-over');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length) {
        handleImageFiles(files);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length) {
        handleImageFiles(fileInput.files);
        fileInput.value = '';
      }
    });
  }

  // 套用備用圖片網址
  applyUrlsBtn?.addEventListener('click', () => {
    const urls = el('edit-item-images')?.value.split(/[\n,]/).map(s => s.trim()).filter(Boolean) || [];
    if (!urls.length) {
      showToast('請先輸入圖片網址！');
      return;
    }
    urls.forEach(u => {
      if (!AppState.currentEditImages.includes(u)) {
        AppState.currentEditImages.push(u);
      }
    });
    renderEditThumbs();
    showToast(`✅ 已成功套用 ${urls.length} 張圖片網址！`);
  });
}

/* ─────────────────────────────────────────────────────────────
   13. 後台多商品管理渲染 (Admin Item Manager - 俐落折疊與卡片化)
   ───────────────────────────────────────────────────────────── */
function renderAdminItemsList() {
  const container = el('admin-items-list-container');
  if (!container) return;
  container.innerHTML = '';

  const countSpan = el('admin-items-count');
  if (countSpan) countSpan.textContent = AppState.items ? AppState.items.length : 0;

  if (!AppState.items || !AppState.items.length) {
    container.innerHTML = `
      <div style="font-size:.84rem;color:var(--c-text-3);padding:20px;text-align:center;background:rgba(255,255,255,0.02);border-radius:12px;">
        目前無任何拍賣商品品項。<br>請點擊上方「➕ 新增商品品項」開始上架！
      </div>
    `;
    return;
  }

  AppState.items.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'item-manage-card';
    card.style.flexDirection = 'column';
    card.style.alignItems = 'stretch';
    const coverSrc = (item.images && item.images.length) ? item.images[0] : 'icon-512.png';
    const isLive = item.status === 'active' || item.status === 'live';
    const statusBadge = isLive
      ? '<span class="item-tab-badge badge-live" style="font-size:.7rem;padding:2px 6px;">競標中</span>'
      : (item.status === 'picked_up'
          ? '<span class="item-tab-badge badge-picked" style="font-size:.7rem;padding:2px 6px;">已取貨</span>'
          : '<span class="item-tab-badge badge-ended" style="font-size:.7rem;padding:2px 6px;">已結標</span>');
    const itemNum = String(index + 1).padStart(2, '0');

    card.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;width:100%;gap:10px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">
          <span style="background:rgba(255,215,0,0.15);color:var(--c-gold-1);border:1px solid rgba(255,215,0,0.3);font-family:monospace;font-weight:900;font-size:.8rem;padding:2px 7px;border-radius:6px;flex-shrink:0;">#${itemNum}</span>
          <img src="${coverSrc}" style="width:48px;height:48px;border-radius:8px;object-fit:cover;flex-shrink:0;background:#000;border:1px solid var(--c-border);" alt="" />
          <div class="item-manage-info" style="min-width:0;flex:1;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span class="item-manage-title" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;">${escapeHtml(item.name)}</span>
              ${statusBadge}
            </div>
            <div class="item-manage-meta">起標：${formatMoney(item.startPrice)} ｜ 最高：${formatMoney(item.currentBid)}</div>
          </div>
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0;align-items:center;flex-wrap:wrap;">
          <button class="tbtn tbtn-purple tbtn-xs btn-clear-item-test" data-id="${item.id}" title="一鍵清除此商品的測試出價與測試問答，恢復為初始起標價">🧹 清除測試出價／問答並重置起標價</button>
          <button class="tbtn tbtn-gold tbtn-xs btn-relist-toggle" data-id="${item.id}" title="重新開啟此商品競標">🔄 重開</button>
          <button class="tbtn tbtn-ghost tbtn-xs btn-edit-item" data-id="${item.id}">✏️ 編輯</button>
          <button class="tbtn tbtn-danger tbtn-xs btn-del-item" data-id="${item.id}" title="刪除此商品">🗑️</button>
        </div>
      </div>

      <!-- 單品專屬發布工具列 (手機優先 RWD 排版) -->
      <div class="admin-item-share-bar" style="margin-top:10px;padding-top:8px;border-top:1px dashed rgba(255,255,255,0.08);">
        <span style="font-size:.74rem;color:var(--c-text-3);font-weight:600;">單品發布：</span>
        <button type="button" class="tbtn tbtn-ghost tbtn-xs btn-admin-copy-url" data-id="${item.id}" title="複製此商品專屬單品連結">🔗 複製單品網址</button>
        <button type="button" class="tbtn tbtn-purple tbtn-xs btn-admin-qr-card" data-id="${item.id}" title="下載帶有品名標籤的專屬 QR 圖卡">📱 下載專屬 QR 圖卡</button>
        <button type="button" class="tbtn tbtn-ghost tbtn-xs btn-admin-preview-item" data-id="${item.id}" title="另開分頁以買家單品專屬模式預覽">👁️ 預覽</button>
      </div>

      <!-- 快捷重開競標迷你控制台 -->
      <div class="admin-relist-shelf" id="admin-relist-shelf-${item.id}" style="display:none;margin-top:10px;padding:10px;background:rgba(255,215,0,0.06);border-radius:8px;border:1px dashed rgba(255,215,0,0.3);width:100%;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
          <span style="font-size:.76rem;color:var(--c-gold-1);font-weight:700;">💰 重開起標價：</span>
          <input type="number" class="form-input shelf-price-input" value="${item.startPrice || 100}" style="width:110px;height:28px;padding:2px 8px;font-size:.82rem;font-weight:800;color:var(--c-gold-1);font-family:var(--f-num);" />
          <span style="font-size:.72rem;color:var(--c-text-3);">TWD</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(100px, 1fr));gap:6px;">
          <button type="button" class="tbtn tbtn-gold tbtn-xs btn-shelf-do-relist" data-id="${item.id}" data-mode="reset24" data-hours="24">⚡ 24H 動態</button>
          <button type="button" class="tbtn tbtn-ghost tbtn-xs btn-shelf-do-relist" data-id="${item.id}" data-mode="fixed" data-hours="24">🕒 24H 固定</button>
          <button type="button" class="tbtn tbtn-ghost tbtn-xs btn-shelf-do-relist" data-id="${item.id}" data-mode="fixed" data-hours="72">📅 重開 3 天</button>
          <button type="button" class="tbtn tbtn-ghost tbtn-xs btn-shelf-do-relist" data-id="${item.id}" data-mode="fixed" data-hours="168">📅 重開 7 天</button>
        </div>
      </div>
    `;

    // 綁定清除測試數據、編輯與刪除
    card.querySelector('.btn-clear-item-test')?.addEventListener('click', () => handleAdminClearTestData(item.id));
    card.querySelector('.btn-edit-item').addEventListener('click', () => openEditFormForItem(item.id));
    card.querySelector('.btn-del-item').addEventListener('click', () => handleAdminDeleteItem(item.id));

    // 綁定單品專屬快捷發布工具
    card.querySelector('.btn-admin-copy-url').addEventListener('click', () => {
      const url = getItemShareUrl(item, 'single');
      navigator.clipboard.writeText(url).then(() => {
        showToast(`📋 已複製【${item.name.substring(0, 12)}...】專屬單品連結！`);
      }).catch(() => {
        showToast('📋 連結：' + url);
      });
    });

    card.querySelector('.btn-admin-qr-card').addEventListener('click', () => {
      downloadItemQrCard(item);
    });

    card.querySelector('.btn-admin-preview-item').addEventListener('click', () => {
      const url = getItemShareUrl(item, 'single');
      window.open(url, '_blank');
    });

    const shelf = card.querySelector(`#admin-relist-shelf-${item.id}`);
    card.querySelector('.btn-relist-toggle').addEventListener('click', () => {
      shelf.style.display = (shelf.style.display === 'none') ? 'block' : 'none';
    });

    card.querySelectorAll('.btn-shelf-do-relist').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode || 'reset24';
        const hours = Number(btn.dataset.hours || 24);
        const priceInp = card.querySelector('.shelf-price-input');
        const price = priceInp ? Number(priceInp.value) : item.startPrice;
        restartAuctionItem(item.id, mode, hours, price);
      });
    });

    container.appendChild(card);
  });
}

/** 展開並滾動至特定商品的編輯面板 (單一頁面平滑滾動) */
function openEditFormForItem(itemId) {
  loadItemIntoEditForm(itemId);
  const sec = el('admin-item-edit-section');
  if (sec) {
    sec.classList.remove('folded');
    if (el('btn-toggle-edit-fold')) el('btn-toggle-edit-fold').textContent = '收合 ▲';
    sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function loadItemIntoEditForm(itemId) {
  const item = AppState.items.find(i => i.id === itemId) || getActiveItem();
  if (!item) return;

  AppState.editingItemId = item.id;
  if (el('edit-item-name-preview')) el('edit-item-name-preview').textContent = item.name;
  if (el('edit-item-seller-name')) el('edit-item-seller-name').value = item.sellerName || '建生工坊';
  if (el('edit-item-seller-logo')) el('edit-item-seller-logo').value = item.sellerLogo || 'icon-192.png';
  if (el('seller-logo-preview-img')) el('seller-logo-preview-img').src = item.sellerLogo || 'icon-192.png';
  if (el('edit-item-name')) el('edit-item-name').value = item.name;
  if (el('edit-item-subtitle')) el('edit-item-subtitle').value = item.subtitle || '';
  if (el('edit-item-desc')) el('edit-item-desc').value = item.desc || '';
  if (el('edit-item-start-price')) el('edit-item-start-price').value = item.startPrice;
  if (el('edit-item-increment')) el('edit-item-increment').value = (item.increment !== undefined && item.increment !== null) ? item.increment : 10;
  if (el('edit-item-video-url')) el('edit-item-video-url').value = item.videoUrl || '';

  // 倒數時間剩餘天/時/分動態計算並完整帶入
  const remainingMs = Math.max(0, (item.endTime || getServerNow()) - getServerNow());
  const remSecs = Math.floor(remainingMs / 1000);
  const remDays = Math.floor(remSecs / 86400);
  const remHours = Math.floor((remSecs % 86400) / 3600);
  const remMins = Math.floor((remSecs % 3600) / 60);
  if (el('edit-item-days')) el('edit-item-days').value = remDays;
  if (el('edit-item-hours')) el('edit-item-hours').value = remHours;
  if (el('edit-item-mins')) el('edit-item-mins').value = remMins;

  // 載入競標時間模式 (選項 A / 選項 B)
  const isReset24 = item.timeMode === 'reset24';
  if (el('mode-radio-reset24')) el('mode-radio-reset24').checked = isReset24;
  if (el('mode-radio-fixed')) el('mode-radio-fixed').checked = !isReset24;
  if (el('card-mode-reset24')) el('card-mode-reset24').classList.toggle('selected', isReset24);
  if (el('card-mode-fixed')) el('card-mode-fixed').classList.toggle('selected', !isReset24);
  if (el('panel-mode-reset24')) el('panel-mode-reset24').classList.toggle('active', isReset24);
  if (el('panel-mode-fixed')) el('panel-mode-fixed').classList.toggle('active', !isReset24);

  // 載入防最後一秒壓標設定
  const antiEnable = el('edit-antisnipe-enable');
  if (antiEnable) antiEnable.checked = item.antiSnipeEnabled !== false;
  if (el('edit-antisnipe-mins')) el('edit-antisnipe-mins').value = item.antiSnipeMins || 3;
  if (el('edit-antisnipe-ext')) el('edit-antisnipe-ext').value = item.antiSnipeExtMins || 3;
  const antiRow = el('antisnipe-inputs-row');
  if (antiRow) {
    antiRow.style.opacity = (item.antiSnipeEnabled !== false) ? '1' : '0.4';
    antiRow.style.pointerEvents = (item.antiSnipeEnabled !== false) ? 'auto' : 'none';
  }

  // 載入無人出標自動續拍設定
  if (el('edit-item-auto-relist')) {
    el('edit-item-auto-relist').checked = item.autoRelistIfNoBids !== false;
  }

  // 載入取貨方式設定 (自取/宅配/超商/自訂說明) 與得標保留期限規則
  const opts = item.pickupOptions || { self: true, delivery: false, cvs: false };
  if (el('edit-pickup-self')) el('edit-pickup-self').checked = opts.self !== false;
  if (el('edit-pickup-delivery')) el('edit-pickup-delivery').checked = !!opts.delivery;
  if (el('edit-pickup-cvs')) el('edit-pickup-cvs').checked = !!opts.cvs;
  if (el('edit-item-pickup-custom')) el('edit-item-pickup-custom').value = item.pickupCustom || '';
  if (el('edit-pickup-deadline-mode')) {
    el('edit-pickup-deadline-mode').value = item.pickupDeadlineMode || 'hours';
    const isWeekday = (item.pickupDeadlineMode === 'weekday');
    if (el('pickup-deadline-hours-box')) el('pickup-deadline-hours-box').style.display = isWeekday ? 'none' : 'block';
    if (el('pickup-deadline-weekday-box')) el('pickup-deadline-weekday-box').style.display = isWeekday ? 'block' : 'none';
  }
  if (el('edit-item-pickup-hours')) el('edit-item-pickup-hours').value = item.pickupDeadlineHours || 48;
  if (el('edit-pickup-weekday')) el('edit-pickup-weekday').value = item.pickupDeadlineWeekday !== undefined ? item.pickupDeadlineWeekday : 6;
  if (el('edit-pickup-deadline-custom')) el('edit-pickup-deadline-custom').value = item.pickupDeadlineCustomText || '';

  // 載入額外備註欄
  if (el('edit-item-extra-notes')) el('edit-item-extra-notes').value = item.extraNotes || '';

  // 載入保固說明
  if (el('edit-item-warranty-days')) el('edit-item-warranty-days').value = item.warrantyDays ?? 0;
  if (el('edit-item-warranty-text')) el('edit-item-warranty-text').value = item.warrantyText || '原件現況出售';

  // 載入當前商品圖片並渲染縮圖預覽列
  AppState.currentEditImages = [...(item.images || [])];
  renderEditThumbs();

  if (el('edit-item-images')) {
    el('edit-item-images').value = AppState.currentEditImages.join('\n');
  }
}

function saveCurrentItemEdits() {
  if (!requireAdminAuth(() => saveCurrentItemEdits())) return;
  let item = AppState.items.find(i => i.id === AppState.editingItemId);
  if (!item) {
    item = AppState.items.find(i => i.id === AppState.activeItemId);
  }
  if (!item) {
    item = getActiveItem();
  }

  // 若目前無品項，絕不使用預設名稱覆蓋，而是使用使用者當前輸入的內容建立
  if (!item) {
    const formName = el('edit-item-name')?.value.trim();
    const newId = 'item-' + Date.now();
    item = normalizeItem({
      id: newId,
      name: formName || '拍賣商品',
      sellerName: el('edit-item-seller-name')?.value.trim() || '建生工坊',
      sellerLogo: el('edit-item-seller-logo')?.value.trim() || 'icon-192.png',
      startPrice: Number(el('edit-item-start-price')?.value) || 100,
      increment: Number(el('edit-item-increment')?.value) || 10
    }, newId);
    AppState.items.push(item);
    AppState.activeItemId = newId;
    AppState.editingItemId = newId;
  }

  // 欄位安全更新，保留原始未修改之珍貴資料
  const inSellerName = el('edit-item-seller-name')?.value.trim();
  if (inSellerName) item.sellerName = inSellerName;
  const inSellerLogo = el('edit-item-seller-logo')?.value.trim();
  if (inSellerLogo) item.sellerLogo = inSellerLogo;

  const inName = el('edit-item-name')?.value.trim();
  if (inName) item.name = inName;
  item.subtitle = el('edit-item-subtitle')?.value.trim() ?? item.subtitle;
  item.desc = el('edit-item-desc')?.value.trim() ?? item.desc;

  const inStartPrice = Number(el('edit-item-start-price')?.value);
  if (!isNaN(inStartPrice) && inStartPrice >= 0) {
    item.startPrice = inStartPrice;
    if (!item.topBidder) item.currentBid = inStartPrice;
  }

  const inIncrement = Number(el('edit-item-increment')?.value);
  if (!isNaN(inIncrement) && inIncrement > 0) {
    item.increment = inIncrement;
  }

  item.videoUrl = el('edit-item-video-url')?.value.trim() ?? item.videoUrl;

  // 整合拖曳圖片與備用手動網址輸入
  const extraUrls = el('edit-item-images')?.value.split(/[\n,]/).map(s => s.trim()).filter(Boolean) || [];
  extraUrls.forEach(u => {
    if (!AppState.currentEditImages.includes(u)) {
      AppState.currentEditImages.push(u);
    }
  });

  if (AppState.currentEditImages && AppState.currentEditImages.length > 0) {
    item.images = [...AppState.currentEditImages];
  }

  // 取貨方式設定 (自取/寄送/超商/自訂說明) 與得標保留期限規則
  item.pickupOptions = {
    self: !!el('edit-pickup-self')?.checked,
    delivery: !!el('edit-pickup-delivery')?.checked,
    cvs: !!el('edit-pickup-cvs')?.checked
  };
  item.pickupCustom = el('edit-item-pickup-custom')?.value.trim() ?? '';
  item.pickupDeadlineMode = el('edit-pickup-deadline-mode')?.value || 'hours';
  item.pickupDeadlineHours = Number(el('edit-item-pickup-hours')?.value) || 48;
  item.pickupDeadlineWeekday = Number(el('edit-pickup-weekday')?.value ?? 6);
  item.pickupDeadlineCustomText = el('edit-pickup-deadline-custom')?.value.trim() || '';

  // 額外備註欄
  item.extraNotes = el('edit-item-extra-notes')?.value.trim() ?? '';

  // 保固天數與條款說明
  item.warrantyDays = Number(el('edit-item-warranty-days')?.value) || 0;
  item.warrantyText = el('edit-item-warranty-text')?.value.trim() || '原件現況出售';

  // 競標時間模式與倒數計時計算
  const chosenMode = document.querySelector('input[name="admin-time-mode"]:checked')?.value || 'fixed';
  item.timeMode = chosenMode;

  if (chosenMode === 'reset24') {
    // 選項 B：24 小時動態重置模式（自動將結束時間設為當前時間 + 24 小時）
    item.endTime = getServerNow() + 24 * 3600 * 1000;
    item.status = 'live';
  } else {
    // 選項 A：固定期限模式
    item.antiSnipeEnable = !!el('edit-antisnipe-enable')?.checked;
    item.antiSnipeEnabled = item.antiSnipeEnable;
    item.antiSnipeMins = Number(el('edit-antisnipe-mins')?.value) || 3;
    item.antiSnipeExt = Number(el('edit-antisnipe-ext')?.value) || 3;
    item.antiSnipeExtMins = item.antiSnipeExt;

    const days = Number(el('edit-item-days')?.value) || 0;
    const hours = Number(el('edit-item-hours')?.value) || 0;
    const mins = Number(el('edit-item-mins')?.value) || 0;
    const totalSecs = days * 86400 + hours * 3600 + mins * 60;
    if (totalSecs > 0) {
      item.endTime = getServerNow() + totalSecs * 1000;
    }
  }

  // 無人出標自動續拍 24H 設定
  item.autoRelistIfNoBids = el('edit-item-auto-relist') ? !!el('edit-item-auto-relist').checked : true;

  renderAdminItemsList();
  renderItemTabs();
  renderActiveItemDisplay();
  if (typeof updateAuctionTimerUI === 'function') {
    updateAuctionTimerUI();
  }
  showToast(`💾 商品【${item.name}】設定（含取貨與額外備註）已安全更新並同步至雲端！`);
  syncToFirebase();
  syncToLocalServer();
}

function addNewItem() {
  if (!requireAdminAuth(() => addNewItem())) return;
  const newId = 'item-' + (getServerNow());
  const newItem = {
    id: newId,
    name: `新增商品品項 #${AppState.items.length + 1}`,
    subtitle: '請於下方編輯商品特色說明',
    desc: '填寫詳細商品描述、尺寸與現況說明…',
    images: ['icon-512.png'],
    videoUrl: '',
    sellerName: '建生工坊',
    sellerLogo: 'icon-192.png',
    startPrice: 500,
    increment: 10,
    currentPrice: 500,
    currentBid: 500,
    topBidder: '',
    topBidderContact: null,
    topBidTime: null,
    bids: {},
    bidHistory: [],
    endTime: getServerNow() + 86400000,
    status: 'active',
    timeMode: 'fixed',
    antiSnipeEnable: true,
    antiSnipeEnabled: true,
    antiSnipeMins: 3,
    antiSnipeExt: 3,
    antiSnipeExtMins: 3,
    pickupDeadlineHours: 48,
    pickupDeadline: null,
    pickupOptions: { self: true, delivery: false, cvs: false },
    pickupCustom: '實體門市面交・原件現況出售',
    extraNotes: '',
    warrantyDays: 0,
    warrantyText: '原件現況出售',
    qa: {},
    winnerMsgs: []
  };

  AppState.items.push(newItem);
  AppState.activeItemId = newId;
  loadItemIntoEditForm(newId);
  renderAdminItemsList();
  renderItemTabs();
  renderActiveItemDisplay();
  if (typeof updateAuctionTimerUI === 'function') {
    updateAuctionTimerUI();
  }
  showToast('➕ 已新增商品品項！請於右側表單填寫詳細資訊並上傳圖片。');
  syncToFirebase();
}

/* ─────────────────────────────────────────────────────────────
   14. 倒數計時器排程迴圈 (Timer Loop & Cloud Time Offset)
   ───────────────────────────────────────────────────────────── */

// === 1. Firebase 雲端時間偏移量校正模組 ===
let serverTimeOffset = 0;
let timerIntervalId = null;

function initServerTimeSync(db) {
  if (!db) return;
  const offsetRef = db.ref('.info/serverTimeOffset');
  offsetRef.on('value', (snap) => {
    serverTimeOffset = snap.val() || 0;
    // 取得最新偏移量後立即更新一次倒數計時畫面
    updateAuctionTimerUI();
  });
}

// 取得對齊雲端伺服器的當前精準毫秒時間戳
function getServerNow() {
  return Date.now() + serverTimeOffset;
}

// 對齊專案內取得當前選中商品的函式
function getActiveItemData() {
  return getActiveItem();
}

function handleAuctionEndedState(currentItem, forceEnd = false) {
  if (!currentItem) return;
  if (!forceEnd && typeof isItemRelistLocked === 'function' && isItemRelistLocked(currentItem.id)) {
    return;
  }

  const now = getServerNow();
  const endTime = Number(currentItem.endTime || 0);
  const hasValidEndTime = Number.isFinite(endTime) && endTime > 1000000000000;
  const hasBids = hasItemBids(currentItem);

  if (currentItem.status === 'active' || currentItem.status === 'live') {
    if (!forceEnd && (!hasValidEndTime || now < endTime)) {
      return;
    }
    currentItem.status = 'ended';
    currentItem.auctionDone = true;
    currentItem.auctionLive = false;
    renderWinnerStatus();
    renderItemTabs();
    if (hasBids) {
      showToast(`🏆 商品【${currentItem.name}】競標時間截止！圓滿結標！`);
      triggerConfetti();
    } else {
      showToast(`⏳ 商品【${currentItem.name}】本檔期競標結束（尚無人出標）`);
    }
    syncToFirebase();
    syncToLocalServer();
  } else {
    renderWinnerStatus();
  }
}

// === 2. 精準倒數計時器渲染邏輯（每 250ms 校正刷新，防止掉幀與時間漂移） ===
function startAuctionTimer() {
  if (timerIntervalId) clearInterval(timerIntervalId);
  updateAuctionTimerUI();
  timerIntervalId = setInterval(updateAuctionTimerUI, 250);
}

const _autoRelistCooldownUntil = {};

function updateAuctionTimerUI() {
  const currentItem = getActiveItemData(); // 請對應專案內取得當前選中商品的函式
  if (!currentItem) return;

  const daysEl = document.getElementById('t-days');
  const hoursEl = document.getElementById('t-hours');
  const minsEl = document.getElementById('t-mins');
  const secsEl = document.getElementById('t-secs');
  const statusChip = document.getElementById('timer-status-chip');
  const statusText = document.getElementById('timer-status-text');
  const antiSnipePill = document.getElementById('anti-snipe-pill');
  const submitBidBtn = document.getElementById('btn-submit-bid');

  const now = getServerNow();
  const endTime = Number(currentItem.endTime || 0);
  const hasValidEndTime = Number.isFinite(endTime) && endTime > 1000000000000;
  const diff = hasValidEndTime ? Math.max(0, endTime - now) : 0;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / 1000 / 60) % 60);
  const secs = Math.floor((diff / 1000) % 60);

  if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
  if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
  if (minsEl) minsEl.textContent = String(mins).padStart(2, '0');
  if (secsEl) secsEl.textContent = String(secs).padStart(2, '0');

  const isRelistProtected = typeof isItemRelistLocked === 'function' && isItemRelistLocked(currentItem.id);
  const isExplicitlyEnded = (currentItem.status === 'ended' || currentItem.status === 'picked_up' || currentItem.endedEarly === true || currentItem.manualEnd === true);

  // 狀態顯示與防壓標提示切換（重開鎖定期間且 endTime > now 時，嚴禁誤觸結標）
  if ((isExplicitlyEnded || (hasValidEndTime && diff <= 0)) && !(isRelistProtected && hasValidEndTime && diff > 0)) {
    const hasBids = hasItemBids(currentItem);

    // 檢查是否符合「無人出標自動續拍 24H」（加入冷卻保護，防止雲端權限不足或回彈造成無窮迴圈）
    if (hasValidEndTime && diff <= 0 && !isExplicitlyEnded) {
      const nowMs = Date.now();
      const cooldownUntil = _autoRelistCooldownUntil[currentItem.id] || 0;
      if (!hasBids && currentItem.autoRelistIfNoBids !== false && nowMs >= cooldownUntil) {
        _autoRelistCooldownUntil[currentItem.id] = nowMs + 60000;
        setItemRelistLock(currentItem.id, 8000);
        console.log('🔄 商品【' + currentItem.name + '】競標時間到且無人出價，自動延長 24 小時續拍！');
        currentItem.relistSeq = Number(currentItem.relistSeq || 0) + 1;
        currentItem.reopenedAt = getServerNow();
        currentItem.endTime = getServerNow() + 24 * 3600 * 1000;
        currentItem.status = 'live';
        SafeStorage.set('agy_items', AppState.items);
        syncToFirebase();
        syncToLocalServer();
        showToast('🔄 商品競標時間到無人出標，已自動延長 24 小時繼續競標！');
        updateAuctionTimerUI();
        return;
      }
    }

    if (statusChip) statusChip.className = 'timer-status-chip ended';
    if (statusText) statusText.textContent = hasBids ? '競標已結束' : '本檔競標結束（無人出標）';
    if (submitBidBtn) submitBidBtn.disabled = true;
    // 觸發結標卡片 #winner-card 顯示邏輯
    handleAuctionEndedState(currentItem);
  } else {
    if (statusChip) statusChip.className = 'timer-status-chip live';
    if (statusText) {
      statusText.textContent = currentItem.timeMode === 'reset24'
        ? '24H 動態重置競標中'
        : '競標進行中';
    }
    const winnerCardEl = document.getElementById('winner-card');
    if (winnerCardEl && winnerCardEl.classList.contains('show')) {
      renderWinnerStatus();
    }
    if (submitBidBtn && !submitBidBtn.dataset.submitting) {
      submitBidBtn.disabled = false;
    }
    if (antiSnipePill) {
      if (currentItem.timeMode === 'reset24') {
        antiSnipePill.textContent = '⚡ 24H 動態重置：有人出價即重置 24 小時';
        antiSnipePill.style.display = 'inline-flex';
      } else if (currentItem.antiSnipeEnable) {
        antiSnipePill.textContent = '🛡️ 防壓標保護機制生效中';
        antiSnipePill.style.display = 'inline-flex';
      } else {
        antiSnipePill.style.display = 'none';
      }
    }
  }
}

function startTimerLoop() {
  startAuctionTimer();
}

/* ─────────────────────────────────────────────────────────────
   15. 買家 7/10/15 天資料保留、最高出價者防棄標鎖定、黑名單與後台「遞補優惠價」彈性成交腳本
   ───────────────────────────────────────────────────────────── */

/**
 * 檢查指定手機號碼是否位於棄標黑名單
 */
function isBuyerBlacklisted(rawPhone) {
  if (!rawPhone) return false;
  const key = String(rawPhone).replace(/[^0-9]/g, '');
  if (!key) return false;
  return !!(AppState.blacklist && AppState.blacklist[key]);
}

/**
 * 管理員切換買家黑名單封鎖狀態
 */
function toggleBuyerBlacklist(rawPhone, buyerName = '買家') {
  if (!requireAdminAuth()) return;
  const key = String(rawPhone || '').replace(/[^0-9]/g, '');
  if (!key) return;

  if (!AppState.blacklist) AppState.blacklist = {};
  const currentlyBlocked = !!AppState.blacklist[key];

  if (currentlyBlocked) {
    delete AppState.blacklist[key];
    showToast(`✅ 已解除買家「${buyerName} (${rawPhone})」的黑名單封鎖！`);
  } else {
    if (!confirm(`🚫 確定要將買家「${buyerName} (${rawPhone})」列入棄標封鎖黑名單嗎？\n列入後該門號將無法參與任何商品競標！`)) {
      return;
    }
    AppState.blacklist[key] = {
      name: buyerName,
      phone: rawPhone,
      blockedAt: getServerNow()
    };
    showToast(`🚫 已將買家「${buyerName} (${rawPhone})」列入棄標封鎖黑名單！`);
  }

  SafeStorage.set('agy_blacklist', AppState.blacklist);
  const db = FirebaseManager.getDb();
  if (db) {
    if (currentlyBlocked) {
      db.ref('settings/blacklist/' + key).remove().catch(() => {});
    } else {
      db.ref('settings/blacklist/' + key).set(AppState.blacklist[key]).catch(() => {});
    }
  }
  renderAdminBuyersRoster();
  syncToLocalServer();
}

/**
 * 核心規則：檢查買家目前是否在任一競標中商品為「最高出價領先者」或「已得標但尚未完成取貨」
 * @param {string} phone 買家電話
 * @param {string} name 買家稱呼
 * @returns {{locked: boolean, itemName?: string, itemId?: string, status?: string, amount?: number}}
 */
function checkBuyerHighBidderLock(phone, name) {
  const cleanPhone = String(phone || '').replace(/[^0-9]/g, '');
  const cleanName = String(name || '').trim();
  if (!cleanPhone && !cleanName) return { locked: false };

  const items = AppState.items || [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it || it.status === 'picked_up') continue;
    if (!hasItemBids(it)) continue;

    const topName = getBidderName(it.topBidder).trim();
    const topPhone = String(
      (it.topBidderContact && it.topBidderContact.phone) ||
      (typeof it.topBidder === 'object' && it.topBidder ? it.topBidder.phone : '') ||
      ''
    ).replace(/[^0-9]/g, '');

    const matchByPhone = cleanPhone && topPhone && cleanPhone === topPhone;
    const matchByName = cleanName && topName && cleanName === topName;

    if (matchByPhone || matchByName) {
      return {
        locked: true,
        itemName: it.name,
        itemId: it.id,
        status: it.status,
        amount: Number(it.finalDealPrice || it.currentPrice || it.currentBid || it.startPrice || 0)
      };
    }
  }
  return { locked: false };
}

/**
 * 更新買家保留天數選擇器 UI 與預計到期時間顯示（支援 7 / 10 / 15 天 與 ∞ 永久保留）
 */
function updateBuyerRetentionUI(days, existingExpiresAt = null) {
  const isForever = isPermanentRetention(days);
  const normKey = isForever
    ? 'forever'
    : ([7, 10, 15].includes(Number(days)) ? String(Number(days)) : '7');

  ['7', '10', '15', 'forever'].forEach(key => {
    const rad = el(`retention-radio-${key}`);
    const card = el(`ret-card-${key}`);
    if (rad) rad.checked = (key === normKey);
    if (card) card.classList.toggle('selected', key === normKey);
  });

  const expEl = el('buyer-retention-expiry-text');
  if (!expEl) return;

  if (isForever) {
    expEl.textContent = '♾️ 永久有效（將持續保留，直到您主動點擊立即登出為止）';
  } else {
    const d = Number(normKey);
    const now = typeof getServerNow === 'function' ? getServerNow() : Date.now();
    const targetTs = existingExpiresAt || (now + d * 86400000);
    const dt = new Date(targetTs);
    expEl.textContent = `${dt.toLocaleString('zh-TW', { hour12: false })}（保留 ${d} 天）`;
  }
}

/**
 * 當買家輸入手機號碼時，自動與本機/雲端買家名冊比對：
 * 若尚在保留期限內（或設定為永久保留），自動帶入已儲存的稱呼、Line ID、IG、FB 與保留期限設定
 */
function lookupCloudBuyerByPhone(rawPhone) {
  const clean = String(rawPhone || '').replace(/[^0-9]/g, '');
  const hint = el('buyer-cloud-match-hint');
  if (hint) hint.style.display = 'none';
  if (clean.length < 9) return;

  if (isBuyerBlacklisted(clean)) {
    if (hint) {
      hint.style.display = 'block';
      hint.style.color = '#f87171';
      hint.textContent = '🚫 此門號因歷史棄標紀錄已被列入系統封鎖黑名單！';
    }
    return;
  }

  const now = typeof getServerNow === 'function' ? getServerNow() : Date.now();
  const applyMatchedBuyer = (b) => {
    if (!b || !b.name) return false;
    const isPerm = isPermanentRetention(b.retentionDays) || Boolean(b.isPermanent);
    if (!isPerm && b.retentionExpiresAt && Number(b.retentionExpiresAt) < now) {
      // 若已過期且非最高出價鎖定者則不自動帶入
      const lockInfo = checkBuyerHighBidderLock(b.phone, b.name);
      if (!lockInfo.locked) return false;
    }
    const nameInp = el('inp-buyer-name');
    const lineInp = el('inp-buyer-line');
    const igInp = el('inp-buyer-ig');
    const fbInp = el('inp-buyer-fb');
    if (nameInp && !nameInp.value.trim()) nameInp.value = b.name || '';
    if (lineInp && !lineInp.value.trim()) lineInp.value = b.line || '';
    if (igInp && !igInp.value.trim()) igInp.value = b.ig || '';
    if (fbInp && !fbInp.value.trim()) fbInp.value = b.fb || '';
    if (isPerm) {
      updateBuyerRetentionUI('forever', null);
    } else if (b.retentionDays) {
      updateBuyerRetentionUI(b.retentionDays, b.retentionExpiresAt);
    }
    if (hint) {
      hint.style.display = 'block';
      hint.style.color = '#34d399';
      hint.textContent = `✨ 已從雲端保留記憶自動帶入【${b.name}】的聯絡資料！`;
    }
    return true;
  };

  const localMatch = (AppState.registeredBuyers || []).find(
    b => String(b.phone || '').replace(/[^0-9]/g, '') === clean
  );
  if (localMatch && applyMatchedBuyer(localMatch)) return;

  const db = FirebaseManager.getDb();
  if (db) {
    db.ref('buyers/' + clean).once('value').then(snap => {
      if (snap.exists()) {
        applyMatchedBuyer(snap.val());
      }
    }).catch(() => {});
  }
}

/**
 * 預設多組測試買家分身清單（完整保留「小建 0931849482」，並提供測試買家 B、測試買家 C 供超標與順位遞補測試）
 */
const DEFAULT_TEST_BUYER_PERSONAS = [
  {
    id: 'persona_a',
    label: '🧪 測試買家 A - 小建',
    name: '小建',
    phone: '0931849482',
    line: 'guess_chen1981',
    ig: '',
    fb: '',
    retentionDays: 'forever',
    isPermanent: true
  },
  {
    id: 'persona_b',
    label: '🧪 測試買家 B - 阿豪（虛擬測試 2 號）',
    name: '阿豪',
    phone: '0911222333',
    line: 'test_ahao88',
    ig: '',
    fb: '',
    retentionDays: 'forever',
    isPermanent: true
  },
  {
    id: 'persona_c',
    label: '🧪 測試買家 C - 小美（虛擬測試 3 號）',
    name: '小美',
    phone: '0922333444',
    line: 'test_xiaomei99',
    ig: '',
    fb: '',
    retentionDays: 'forever',
    isPermanent: true
  }
];

/**
 * 取得目前已儲存的多組測試買家分身清單（自動合併預設 A 小建 / B 阿豪 / C 小美 與使用者自訂輸入的測試帳號）
 */
function getTestBuyerPersonas() {
  let list = [];
  const legacyPhones = ['0922168888', '0955168999'];
  try {
    const saved = SafeStorage.get('agy_test_buyer_personas');
    if (Array.isArray(saved) && saved.length > 0) {
      list = saved.filter(p => {
        if (!p || !p.name || !p.phone) return false;
        const cleanP = String(p.phone).replace(/[^0-9]/g, '');
        return !legacyPhones.includes(cleanP);
      });
    }
  } catch (e) {}

  // 確保預設三組測試買家（小建 0931849482、阿豪 0911222333、小美 0922333444）皆存在且資料同步更新
  DEFAULT_TEST_BUYER_PERSONAS.forEach(defP => {
    const cleanDefPhone = String(defP.phone).replace(/[^0-9]/g, '');
    const existingIdx = list.findIndex(p => String(p.phone || '').replace(/[^0-9]/g, '') === cleanDefPhone);
    if (existingIdx >= 0) {
      list[existingIdx] = Object.assign({}, list[existingIdx], defP);
    } else {
      list.push(Object.assign({}, defP));
    }
  });

  // 若目前登入中的買家帳號不在清單中，自動保留進測試分身庫
  const cur = AppState.userProfile;
  if (cur && cur.name && cur.phone) {
    const cleanCur = String(cur.phone).replace(/[^0-9]/g, '');
    if (cleanCur.length >= 9 && !legacyPhones.includes(cleanCur) && !list.some(p => String(p.phone || '').replace(/[^0-9]/g, '') === cleanCur)) {
      list.push({
        id: 'persona_' + cleanCur,
        label: `自訂測試買家（${cur.name}）`,
        name: cur.name,
        phone: cur.phone,
        line: cur.line || '',
        ig: cur.ig || '',
        fb: cur.fb || '',
        retentionDays: cur.retentionDays || 'forever',
        isPermanent: true
      });
    }
  }

  SafeStorage.set('agy_test_buyer_personas', list);
  return list;
}

/**
 * 新增或更新一組自訂測試買家分身至分身庫
 */
function upsertTestBuyerPersona(profileObj) {
  if (!profileObj || !profileObj.name || !profileObj.phone) return;
  const cleanPhone = String(profileObj.phone).replace(/[^0-9]/g, '');
  if (!cleanPhone) return;

  const list = getTestBuyerPersonas();
  const idx = list.findIndex(p => String(p.phone || '').replace(/[^0-9]/g, '') === cleanPhone);
  const entry = {
    id: idx >= 0 ? list[idx].id : ('persona_' + cleanPhone),
    label: `測試買家（${profileObj.name}）`,
    name: profileObj.name,
    phone: profileObj.phone,
    line: profileObj.line || '',
    ig: profileObj.ig || '',
    fb: profileObj.fb || '',
    retentionDays: profileObj.retentionDays || 'forever',
    isPermanent: true
  };

  if (idx >= 0) {
    list[idx] = Object.assign({}, list[idx], entry);
  } else {
    list.push(entry);
  }
  SafeStorage.set('agy_test_buyer_personas', list);
}

/**
 * 渲染右上角「⋯ 更多選單」與「👤 買家身分設定視窗」內的 4 組預設身分高亮狀態與額外自訂測試買家分身清單
 */
function renderTestBuyerPersonasUI() {
  const personas = getTestBuyerPersonas();
  const isSellerMode = Boolean(AppState.isAdmin && AppState.activeIdentityRole === 'seller');
  const curPhone = String(AppState.userProfile?.phone || '').replace(/[^0-9]/g, '');
  const curName = String(AppState.userProfile?.name || '').trim();

  const isPersonaA = !isSellerMode && (curPhone === '0931849482' || curName === '小建');
  const isPersonaB = !isSellerMode && (curPhone === '0911222333' || curName === '阿豪');
  const isPersonaC = !isSellerMode && (curPhone === '0922333444' || curName === '小美');

  // A. 同步【位置 1：⋯ 更多選單】4 個預設身分按鈕的高亮邊框與狀態文字
  const navBtnSeller = el('btn-nav-role-seller');
  const navBtnA = el('btn-nav-gen-buyer-a');
  const navBtnB = el('btn-nav-gen-buyer-b');
  const navBtnC = el('btn-nav-gen-buyer-c');
  if (navBtnSeller) navBtnSeller.classList.toggle('active-role', isSellerMode);
  if (navBtnA) navBtnA.classList.toggle('active-role', isPersonaA);
  if (navBtnB) navBtnB.classList.toggle('active-role', isPersonaB);
  if (navBtnC) navBtnC.classList.toggle('active-role', isPersonaC);

  if (el('nav-status-seller')) el('nav-status-seller').textContent = isSellerMode ? '✓ 使用中' : '切換 ›';
  if (el('nav-status-buyer-a')) el('nav-status-buyer-a').textContent = isPersonaA ? '✓ 使用中' : '切換 ›';
  if (el('nav-status-buyer-b')) el('nav-status-buyer-b').textContent = isPersonaB ? '✓ 使用中' : '切換 ›';
  if (el('nav-status-buyer-c')) el('nav-status-buyer-c').textContent = isPersonaC ? '✓ 使用中' : '切換 ›';

  // B. 同步【位置 2：👤 買家身分設定視窗】4 個預設大按鈕的高亮邊框與狀態文字
  const modalBtnSeller = el('btn-switch-to-seller-identity');
  const modalBtnA = el('btn-quick-persona-a');
  const modalBtnB = el('btn-quick-persona-b');
  const modalBtnC = el('btn-quick-persona-c');
  if (modalBtnSeller) modalBtnSeller.classList.toggle('active-preset-identity', isSellerMode);
  if (modalBtnA) modalBtnA.classList.toggle('active-preset-identity', isPersonaA);
  if (modalBtnB) modalBtnB.classList.toggle('active-preset-identity', isPersonaB);
  if (modalBtnC) modalBtnC.classList.toggle('active-preset-identity', isPersonaC);

  if (el('modal-status-seller')) el('modal-status-seller').textContent = isSellerMode ? '✓ 目前使用中' : '一鍵切換';
  if (el('modal-status-buyer-a')) el('modal-status-buyer-a').textContent = isPersonaA ? '✓ 目前使用中' : '一鍵切換';
  if (el('modal-status-buyer-b')) el('modal-status-buyer-b').textContent = isPersonaB ? '✓ 目前使用中' : '一鍵切換';
  if (el('modal-status-buyer-c')) el('modal-status-buyer-c').textContent = isPersonaC ? '✓ 目前使用中' : '一鍵切換';

  // C. 若管理員有透過「✏️ 自訂其他買家資料」新增額外測試門號，動態渲染於下方
  const builtinPhones = ['0931849482', '0911222333', '0922333444'];
  const customPersonas = personas.filter(p => !builtinPhones.includes(String(p.phone || '').replace(/[^0-9]/g, '')));

  const modalListEl = el('test-buyer-personas-list');
  if (modalListEl) {
    modalListEl.innerHTML = '';
    modalListEl.style.display = customPersonas.length ? 'grid' : 'none';
    customPersonas.forEach((p, idx) => {
      const pPhone = String(p.phone || '').replace(/[^0-9]/g, '');
      const isCurrent = !isSellerMode && ((pPhone && pPhone === curPhone) || (p.name === curName));
      const card = document.createElement('div');
      card.className = `persona-card-item ${isCurrent ? 'active' : ''}`;

      card.innerHTML = `
        <div class="persona-card-main" title="點擊立即切換為【${escapeHtml(p.name)} (${escapeHtml(p.phone)})】">
          <div class="persona-card-name">${isCurrent ? '🟢 ' : '🧪 '}自訂 #${idx + 1} ${escapeHtml(p.name)}</div>
          <div class="persona-card-phone">📞 ${escapeHtml(p.phone)}${p.line ? ' · Line: ' + escapeHtml(p.line) : ''}</div>
        </div>
        <div class="persona-card-actions">
          <button type="button" class="tbtn ${isCurrent ? 'tbtn-success' : 'tbtn-gold'} tbtn-xs btn-select-persona" style="padding:4px 8px;font-size:.72rem;">
            ${isCurrent ? '✓ 使用中' : '⚡ 切換'}
          </button>
          <button type="button" class="tbtn tbtn-danger tbtn-xs btn-del-persona" title="刪除此自訂分身" style="padding:4px 6px;font-size:.7rem;">✕</button>
        </div>
      `;

      card.querySelector('.persona-card-main')?.addEventListener('click', () => {
        switchToTestBuyerPersona(p);
      });
      card.querySelector('.btn-select-persona')?.addEventListener('click', (e) => {
        e.stopPropagation();
        switchToTestBuyerPersona(p);
      });
      card.querySelector('.btn-del-persona')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const filtered = getTestBuyerPersonas().filter(item => String(item.phone).replace(/[^0-9]/g, '') !== pPhone);
        SafeStorage.set('agy_test_buyer_personas', filtered);
        renderTestBuyerPersonasUI();
        showToast(`🗑️ 已移除自訂測試買家「${p.name}」`);
      });

      modalListEl.appendChild(card);
    });
  }

  const navListEl = el('nav-dropdown-personas-list');
  if (navListEl) {
    navListEl.innerHTML = '';
    navListEl.style.display = customPersonas.length ? 'flex' : 'none';
    customPersonas.forEach((p) => {
      const pPhone = String(p.phone || '').replace(/[^0-9]/g, '');
      const isCurrent = !isSellerMode && ((pPhone && pPhone === curPhone) || (p.name === curName));
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `nav-persona-item-btn ${isCurrent ? 'active-persona' : ''}`;
      btn.innerHTML = `
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
          ${isCurrent ? '🟢' : '🧪'} 自訂：<strong>${escapeHtml(p.name)}</strong> (${escapeHtml(p.phone)})
        </span>
        <span style="font-size:.68rem;flex-shrink:0;color:${isCurrent ? '#6ee7b7' : '#fde68a'};">
          ${isCurrent ? '✓ 使用中' : '切換 ›'}
        </span>
      `;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        el('nav-more-dropdown')?.classList.remove('show');
        switchToTestBuyerPersona(p);
      });
      navListEl.appendChild(btn);
    });
  }
}

/**
 * ⚡ 最高管理者專屬：一鍵切換為指定的「🧪 測試買家分身」（完全不受最高出價者防棄標鎖定限制！）
 */
function switchToTestBuyerPersona(personaObj) {
  if (!requireAdminAuth(() => switchToTestBuyerPersona(personaObj))) return;
  if (!personaObj || !personaObj.name || !personaObj.phone) return;

  // 備份切換前之買家資料
  if (AppState.userProfile && (AppState.userProfile.name || AppState.userProfile.phone)) {
    SafeStorage.set('agy_test_buyer_backup', JSON.parse(JSON.stringify(AppState.userProfile)));
    upsertTestBuyerPersona(AppState.userProfile);
  }

  const now = typeof getServerNow === 'function' ? getServerNow() : Date.now();
  const cleanPhone = String(personaObj.phone).replace(/[^0-9]/g, '');

  AppState.activeIdentityRole = 'buyer';
  SafeStorage.set('agy_active_identity_role', 'buyer');

  AppState.userProfile = {
    name: String(personaObj.name).trim(),
    phone: cleanPhone,
    line: personaObj.line || '',
    ig: personaObj.ig || '',
    fb: personaObj.fb || '',
    retentionDays: 'forever',
    retentionExpiresAt: null,
    isPermanent: true
  };

  SafeStorage.set('agy_buyer_profile', AppState.userProfile);
  upsertTestBuyerPersona(AppState.userProfile);

  // 更新手機號碼綁定表，避免防偽檢驗誤判衝突
  try {
    const boundPhones = SafeStorage.get('agy_registered_users', {}) || {};
    boundPhones[cleanPhone] = AppState.userProfile.name;
    SafeStorage.set('agy_registered_users', boundPhones);
  } catch (e) {}

  // 同步寫入買家名冊與 Firebase，確保順位遞補清單中具備完整聯絡方式
  const buyerData = {
    name: AppState.userProfile.name,
    phone: cleanPhone,
    line: AppState.userProfile.line || '',
    ig: AppState.userProfile.ig || '',
    fb: AppState.userProfile.fb || '',
    retentionDays: 'forever',
    retentionExpiresAt: null,
    isPermanent: true,
    updatedAt: now,
    createdAt: now
  };
  const existingIdx = (AppState.registeredBuyers || []).findIndex(
    b => String(b.phone || '').replace(/[^0-9]/g, '') === cleanPhone
  );
  if (existingIdx >= 0) {
    AppState.registeredBuyers[existingIdx] = Object.assign({}, AppState.registeredBuyers[existingIdx], buyerData);
  } else {
    AppState.registeredBuyers.unshift(buyerData);
  }
  const db = FirebaseManager.getDb();
  if (db) {
    db.ref('settings/buyers/' + cleanPhone).update(buyerData).catch(() => {});
    db.ref('buyers/' + cleanPhone).update(buyerData).catch(() => {});
  }

  // 同步更新彈窗輸入框與全站顯示
  if (el('inp-buyer-name')) el('inp-buyer-name').value = AppState.userProfile.name;
  if (el('inp-buyer-phone')) {
    el('inp-buyer-phone').readOnly = false;
    el('inp-buyer-phone').style.opacity = '1';
    el('inp-buyer-phone').value = AppState.userProfile.phone;
  }
  if (el('inp-buyer-line')) el('inp-buyer-line').value = AppState.userProfile.line;
  if (el('inp-buyer-ig')) el('inp-buyer-ig').value = AppState.userProfile.ig;
  if (el('inp-buyer-fb')) el('inp-buyer-fb').value = AppState.userProfile.fb;

  // 自動將前台出價輸入框帶入下一口最低可出價金額，方便立即超標測試
  const activeItem = getActiveItem();
  if (activeItem && el('inp-bid-val')) {
    const curP = Number(activeItem.currentPrice ?? activeItem.currentBid ?? activeItem.startPrice ?? 10000);
    const inc = Number(activeItem.increment || 10);
    const hasBids = hasItemBids(activeItem);
    el('inp-bid-val').value = hasBids ? (curP + inc) : Math.max(Number(activeItem.startPrice || 10000), inc);
  }

  updateBuyerRetentionUI('forever', null);
  refreshBuyerLockModalUI();
  syncIdentityDisplayUI();
  renderActiveItemDisplay();
  renderBidHistory();
  renderQA(true, null);
  renderWinnerStatus();
  renderAdminBuyersRoster();
  closeBuyerProfileModal();
  el('nav-more-dropdown')?.classList.remove('show');

  showToast(`🧪 已一鍵切換為測試買家分身【${AppState.userProfile.name} (${AppState.userProfile.phone})】！可立即測試超標出價或順位遞補同意。`, 3800);
}

/**
 * ⚡ 一鍵產生並切換為預設測試買家 A（小建） / B（阿明） / C（大華）
 */
function quickSwitchPresetPersona(slotKey) {
  const map = {
    a: DEFAULT_TEST_BUYER_PERSONAS[0],
    b: DEFAULT_TEST_BUYER_PERSONAS[1],
    c: DEFAULT_TEST_BUYER_PERSONAS[2]
  };
  const target = map[slotKey] || DEFAULT_TEST_BUYER_PERSONAS[0];
  switchToTestBuyerPersona(target);
}

/**
 * 同步買家防棄標鎖定橫幅與電話欄位唯讀保護狀態
 * ★ 關鍵特權：只要裝置具備最高管理者權限 (AppState.isAdmin && AppState.isAdminAuthenticated)，完全不受最高出價者防棄標鎖定限制！
 */
function refreshBuyerLockModalUI() {
  const banner = el('buyer-lock-status-banner');
  const bannerTxt = el('buyer-lock-status-text');
  const phoneInp = el('inp-buyer-phone');
  const logoutBtn = el('btn-logout-profile');
  const unlockBar = el('buyer-modal-admin-unlock-bar');

  const isSuperAdmin = Boolean(AppState.isAdmin && AppState.isAdminAuthenticated);
  const hasLoggedBuyer = !!(AppState.userProfile.phone || AppState.userProfile.name);
  const lockInfo = checkBuyerHighBidderLock(AppState.userProfile.phone, AppState.userProfile.name);

  if (unlockBar) {
    unlockBar.style.display = isSuperAdmin ? 'none' : 'flex';
  }

  if (banner && bannerTxt) {
    banner.style.display = 'block';
    if (lockInfo.locked && isSuperAdmin) {
      banner.className = 'buyer-lock-banner admin-bypass';
      bannerTxt.textContent = `👑 最高管理者免鎖定特權生效中：雖然「${AppState.userProfile.name}」目前是【${lockInfo.itemName.slice(0, 18)}…】的最高出價者，但您具備管理員權限，可無限制自由切換為「🛡️ 官方管理者」或「🧪 測試買家 B / C」進行超標與遞補測試！（一般真實買家則維持嚴格防棄標鎖定）`;
    } else if (lockInfo.locked) {
      banner.className = 'buyer-lock-banner locked';
      bannerTxt.textContent = `🔒 防棄標保護生效中：您目前是【${lockInfo.itemName}】的最高出價領先者，在有人超過您的競標價格前無法登出！（若您是管理員，請點上方「🔑 驗證管理員解鎖」即可自由切換分身）`;
    } else if (hasLoggedBuyer) {
      banner.className = 'buyer-lock-banner unlocked';
      bannerTxt.textContent = '🟢 目前無領先標案鎖定，您可隨時變更保留期限（含永久保留）、修改聯絡資料或點擊下方「立即登出」。';
    } else {
      banner.className = 'buyer-lock-banner unlocked';
      bannerTxt.textContent = '👋 歡迎參與競標！請填寫聯絡資料並選擇資料保留期限（7 / 10 / 15 天 或 ∞ 永久保留）。';
    }
  }

  if (phoneInp) {
    // 最高管理者永遠不鎖死電話輸入框
    if (lockInfo.locked && !isSuperAdmin) {
      phoneInp.readOnly = true;
      phoneInp.style.opacity = '0.78';
      phoneInp.title = `您目前是【${lockInfo.itemName}】最高出價領先者，防棄標保護期間禁止竄改聯絡電話`;
    } else {
      phoneInp.readOnly = false;
      phoneInp.style.opacity = '1';
      phoneInp.title = '';
    }
  }

  if (logoutBtn) {
    logoutBtn.style.opacity = (lockInfo.locked && !isSuperAdmin) ? '0.65' : '1';
  }
}

/**
 * 同步更新右上角身分按鈕 (#btn-user-profile)、右上角「⋯ 選單」身分切換器、問答區官方模式橫幅與買家彈窗雙軌切換面板
 */
function syncIdentityDisplayUI() {
  const userBtn = el('btn-user-profile');
  const userIcon = el('user-profile-icon');
  const userNameEl = el('user-profile-name');
  const qaSellerBanner = el('qa-seller-mode-banner');
  const askInput = el('qa-ask-input');
  const sendQBtn = el('btn-send-question');
  const dualPanel = el('admin-dual-identity-panel');
  const unlockBar = el('buyer-modal-admin-unlock-bar');
  const dualBadge = el('dual-identity-current-badge');
  const btnSellerRole = el('btn-switch-to-seller-identity');
  const btnRestoreBuyer = el('btn-restore-backup-buyer');
  const restoreBuyerTxt = el('restore-backup-buyer-text');

  // 右上角「⋯ 更多選單」內之切換器元件
  const navIdBox = el('nav-dropdown-identity-switcher');
  const navIdPill = el('nav-id-active-pill');
  const navSellerBtn = el('btn-nav-role-seller');
  const navSellerTxt = el('nav-role-seller-text');
  const navUnlockBtn = el('btn-nav-unlock-admin-switcher');

  const isSuperAdmin = Boolean(AppState.isAdmin && AppState.isAdminAuthenticated);

  // 若未通過最高管理者驗證，強制維持一般買家模式
  if (!isSuperAdmin) {
    AppState.activeIdentityRole = 'buyer';
  }

  const isSellerMode = Boolean(isSuperAdmin && AppState.activeIdentityRole === 'seller');

  if (userBtn) {
    userBtn.classList.toggle('is-seller-identity', isSellerMode);
  }
  if (userIcon) {
    userIcon.textContent = isSellerMode ? '🛡️' : '👤';
  }
  if (userNameEl) {
    if (isSellerMode) {
      userNameEl.textContent = '官方管理員';
    } else {
      userNameEl.textContent = AppState.userProfile?.name ? AppState.userProfile.name : '登入';
    }
  }

  if (qaSellerBanner) {
    qaSellerBanner.style.display = isSellerMode ? 'flex' : 'none';
  }
  if (askInput) {
    askInput.placeholder = isSellerMode
      ? '🛡️ 目前為【官方管理者（建生工坊）】：在此輸入可針對最新提問直接發佈藍色標章官方回覆…'
      : '對本商品有疑問嗎？歡迎在此留言提問（Ctrl + Enter 快速送出）…';
  }
  if (sendQBtn) {
    sendQBtn.innerHTML = isSellerMode ? '🛡️ 官方管理者回覆' : '💬 送出提問';
  }

  if (dualPanel) {
    dualPanel.style.display = isSuperAdmin ? 'block' : 'none';
  }
  if (unlockBar) {
    unlockBar.style.display = isSuperAdmin ? 'none' : 'flex';
  }
  if (navIdBox) {
    navIdBox.style.display = isSuperAdmin ? 'block' : 'none';
  }
  if (navUnlockBtn) {
    navUnlockBtn.style.display = isSuperAdmin ? 'none' : 'flex';
  }

  if (dualBadge) {
    if (isSellerMode) {
      dualBadge.textContent = '🛡️ 目前：官方管理者（建生工坊）';
      dualBadge.className = 'dual-identity-badge mode-seller';
    } else {
      const bName = AppState.userProfile?.name ? `測試買家（${AppState.userProfile.name}）` : '尚未選擇測試買家';
      dualBadge.textContent = `🧪 目前：${bName}`;
      dualBadge.className = 'dual-identity-badge mode-buyer';
    }
  }
  if (navIdPill) {
    if (isSellerMode) {
      navIdPill.textContent = '🛡️ 官方管理員';
      navIdPill.className = 'nav-id-active-pill is-seller';
    } else {
      navIdPill.textContent = `🧪 ${AppState.userProfile?.name || '測試買家'}`;
      navIdPill.className = 'nav-id-active-pill';
    }
  }

  if (btnSellerRole) {
    btnSellerRole.classList.toggle('is-active-role', isSellerMode);
    btnSellerRole.classList.toggle('active-preset-identity', isSellerMode);
  }
  if (navSellerBtn) {
    navSellerBtn.classList.toggle('active-role', isSellerMode);
  }

  // 檢查是否有備份之測試買家可供一鍵切回
  const backupBuyer = SafeStorage.get('agy_test_buyer_backup');
  if (btnRestoreBuyer && restoreBuyerTxt) {
    if (backupBuyer && backupBuyer.name && (isSellerMode || !AppState.userProfile?.name || AppState.userProfile.name !== backupBuyer.name)) {
      btnRestoreBuyer.style.display = 'inline-flex';
      restoreBuyerTxt.textContent = `切回已儲存測試買家（${backupBuyer.name}）`;
    } else {
      btnRestoreBuyer.style.display = 'none';
    }
  }

  // 同步渲染多組測試買家分身按鈕列表
  try {
    renderTestBuyerPersonasUI();
  } catch (e) {}
}

/**
 * 🛡️ 最高管理者專屬：一鍵切換為「模式 A：🛡️ 官方管理者身分（建生工坊）」
 * 自動將現有測試買家（如小建）完整保存至分身庫，右上角直接顯示「🛡️ 官方管理者」，並開啟防誤觸出價保護
 */
function switchToOfficialSellerIdentity() {
  if (!requireAdminAuth(() => switchToOfficialSellerIdentity())) return;

  // 若目前有登入測試買家資料，先完整備份至 agy_test_buyer_backup 與多組測試分身庫
  if (AppState.userProfile && (AppState.userProfile.name || AppState.userProfile.phone)) {
    SafeStorage.set('agy_test_buyer_backup', JSON.parse(JSON.stringify(AppState.userProfile)));
    upsertTestBuyerPersona(AppState.userProfile);
  }

  AppState.activeIdentityRole = 'seller';
  SafeStorage.set('agy_active_identity_role', 'seller');

  syncIdentityDisplayUI();
  renderQA(true, null);
  renderWinnerStatus();
  closeBuyerProfileModal();
  el('nav-more-dropdown')?.classList.remove('show');
  showToast('🛡️ 已切換為「官方管理者（建生工坊）」身分！右上角已標示為「🛡️ 官方管理員」，問答回覆鎖定為官方藍標，並啟用防誤觸出價保護。', 4000);
}

/**
 * ➕ 最高管理者專屬：清空下方表單欄位以輸入/新增自訂測試買家分身（完全不受最高出價防棄標鎖定限制）
 */
function resetTestBuyerAndLoginNew() {
  if (!requireAdminAuth(() => resetTestBuyerAndLoginNew())) return;

  // 將前一個測試買家備份並存入測試分身庫，方便隨時一鍵切回
  if (AppState.userProfile && (AppState.userProfile.name || AppState.userProfile.phone)) {
    SafeStorage.set('agy_test_buyer_backup', JSON.parse(JSON.stringify(AppState.userProfile)));
    upsertTestBuyerPersona(AppState.userProfile);
  }

  AppState.activeIdentityRole = 'buyer';
  SafeStorage.set('agy_active_identity_role', 'buyer');
  SafeStorage.remove('agy_buyer_profile');

  AppState.userProfile = {
    name: '',
    phone: '',
    line: '',
    ig: '',
    fb: '',
    retentionDays: 'forever',
    retentionExpiresAt: null,
    isPermanent: true
  };

  if (el('inp-buyer-phone')) {
    el('inp-buyer-phone').readOnly = false;
    el('inp-buyer-phone').style.opacity = '1';
    el('inp-buyer-phone').value = '';
  }
  if (el('inp-buyer-name')) el('inp-buyer-name').value = '';
  if (el('inp-buyer-line')) el('inp-buyer-line').value = '';
  if (el('inp-buyer-ig')) el('inp-buyer-ig').value = '';
  if (el('inp-buyer-fb')) el('inp-buyer-fb').value = '';
  if (el('buyer-cloud-match-hint')) el('buyer-cloud-match-hint').style.display = 'none';

  updateBuyerRetentionUI('forever', null);
  refreshBuyerLockModalUI();
  syncIdentityDisplayUI();
  renderQA(true, null);
  renderWinnerStatus();

  setTimeout(() => {
    el('inp-buyer-phone')?.focus();
  }, 60);
  showToast('➕ 已解鎖並清空下方表單！請輸入新測試買家的電話與稱呼，儲存後將自動加入上方測試分身清單。', 3800);
}

/**
 * 🧪 最高管理者專屬：一鍵切回先前儲存的測試買家身分（如：小建）
 */
function restoreBackupTestBuyer() {
  const backup = SafeStorage.get('agy_test_buyer_backup') || DEFAULT_TEST_BUYER_PERSONAS[0];
  if (!backup || !backup.name) {
    showToast('目前尚無已備份的測試買家資料');
    return;
  }
  switchToTestBuyerPersona(backup);
}

/**
 * 🧹 管理員專屬：「一鍵清除測試出價與測試問答」功能
 * 清除測試買家（如小建、買家 B、買家 C）的測試出價紀錄、棄標遞補邀請、測試問答與黑名單，並將商品恢復為初始起標價
 */
function handleAdminClearTestData(targetItemId = null) {
  el('nav-more-dropdown')?.classList.remove('show');
  if (!requireAdminAuth(() => handleAdminClearTestData(targetItemId))) return;

  const targetItem = targetItemId
    ? AppState.items.find(i => i.id === targetItemId)
    : getActiveItem();
  if (!targetItem) {
    showToast('⚠️ 目前無商品可清理');
    return;
  }

  const startP = Number(targetItem.startPrice || 10000);
  const confirmMsg = `🧹 確定要一鍵清除【${targetItem.name.slice(0, 28)}…】的所有測試出價紀錄、遞補測試狀態與測試問答，並將商品恢復為初始起標價（NT$ ${startP.toLocaleString()}）嗎？

✅ 清除後將同步更新雲端與本機資料庫，方便隨時清理乾淨給真實客人競標！`;
  if (!confirm(confirmMsg)) return;

  const now = getServerNow();
  const itemsToReset = targetItemId ? [targetItem] : AppState.items;

  itemsToReset.forEach(it => {
    if (!it) return;
    const initPrice = Number(it.startPrice || 10000);
    it.currentPrice = initPrice;
    it.currentBid = initPrice;
    it.topBidder = '';
    it.topBidderContact = null;
    it.topBidTime = null;
    it.bids = {};
    it.bidHistory = [];
    it.backupOffer = null;
    it.finalDealPrice = null;
    it.defaultedBidders = [];
    it.qa = {};
    it.winnerMsgs = [];
    it.status = 'live';
    if (it.timeMode === 'reset24' || it.endTime <= now) {
      it.endTime = now + 24 * 3600 * 1000;
    }
  });

  // 清除測試過程產生的黑名單封鎖與門號衝突綁定快取
  AppState.blacklist = {};
  AppState.prevTopBidders = {};
  SafeStorage.remove('agy_blacklist');
  SafeStorage.remove('agy_registered_users');
  SafeStorage.set('agy_items', AppState.items);

  // 重置前台出價輸入框為起標價
  if (el('inp-bid-val')) {
    el('inp-bid-val').value = startP;
  }

  // 即時同步清除雲端 Firebase 節點（明確將 bids / qa / topBidder / backupOffer 設為 null 移除）
  const db = FirebaseManager.getDb();
  if (db) {
    db.ref('settings/blacklist').remove().catch(() => {});
    itemsToReset.forEach(it => {
      if (it && it.id) {
        db.ref(`auction/items/${it.id}`).update({
          currentPrice: Number(it.startPrice || 10000),
          currentBid: Number(it.startPrice || 10000),
          topBidder: null,
          topBidderContact: null,
          bids: null,
          bidHistory: null,
          backupOffer: null,
          finalDealPrice: null,
          defaultedBidders: null,
          qa: null,
          winnerMsgs: null,
          status: 'live',
          endTime: it.endTime
        }).catch(() => {});
      }
    });
  }
  syncToFirebase();
  syncToLocalServer(true);

  refreshBuyerLockModalUI();
  syncIdentityDisplayUI();
  renderItemTabs();
  renderActiveItemDisplay();
  renderBidHistory();
  renderQA(true, null);
  renderWinnerStatus();
  renderAdminItemsList();
  renderAdminAllQA();
  renderAdminBuyersRoster();
  updateAuctionTimerUI();

  showToast(`🧹 已成功清除測試出價紀錄與測試問答！商品已恢復為初始起標價 NT$ ${startP.toLocaleString()}。`, 4200);
}

function openBuyerProfileModal() {
  if (el('inp-buyer-name')) el('inp-buyer-name').value = AppState.userProfile.name || '';
  if (el('inp-buyer-phone')) el('inp-buyer-phone').value = AppState.userProfile.phone || '';
  if (el('inp-buyer-line')) el('inp-buyer-line').value = AppState.userProfile.line || '';
  if (el('inp-buyer-ig')) el('inp-buyer-ig').value = AppState.userProfile.ig || '';
  if (el('inp-buyer-fb')) el('inp-buyer-fb').value = AppState.userProfile.fb || '';
  if (el('buyer-cloud-match-hint')) el('buyer-cloud-match-hint').style.display = 'none';

  const isPerm = isPermanentRetention(AppState.userProfile.retentionDays) || Boolean(AppState.userProfile.isPermanent);
  const savedDays = isPerm ? 'forever' : (AppState.userProfile.retentionDays || 7);
  updateBuyerRetentionUI(savedDays, isPerm ? null : AppState.userProfile.retentionExpiresAt);
  refreshBuyerLockModalUI();
  syncIdentityDisplayUI();

  el('modal-buyer-profile')?.classList.add('show');
}

function closeBuyerProfileModal() {
  el('modal-buyer-profile')?.classList.remove('show');
}

function saveBuyerProfile() {
  const name = el('inp-buyer-name')?.value.trim() || '';
  const phone = el('inp-buyer-phone')?.value.trim() || '';

  if (!name) {
    alert('請填寫買家稱呼 / 暱稱！');
    return;
  }

  // 防棄標鎖定檢查：一般買家若為最高出價領先者，禁止更改或刪除原綁定之手機號碼；最高管理者則完全不受此限制！
  const isSuperAdmin = Boolean(AppState.isAdmin && AppState.isAdminAuthenticated);
  const currentLock = checkBuyerHighBidderLock(AppState.userProfile.phone, AppState.userProfile.name);
  const oldCleanPhone = String(AppState.userProfile.phone || '').replace(/[^0-9]/g, '');
  const newCleanPhone = String(phone || '').replace(/[^0-9]/g, '');
  if (!isSuperAdmin && currentLock.locked && oldCleanPhone && oldCleanPhone !== newCleanPhone) {
    alert(`🔒 防棄標保護生效中：您目前是【${currentLock.itemName}】的最高出價領先者，在有人超過您的競標價格前無法登出或更改聯絡電話！`);
    if (el('inp-buyer-phone')) el('inp-buyer-phone').value = AppState.userProfile.phone;
    return;
  }

  const phoneCheck = validatePhoneNumber(phone, name);
  if (!phoneCheck.valid) {
    alert(phoneCheck.message);
    return;
  }

  const chosenDaysRadio = document.querySelector('input[name="buyer-retention-days"]:checked');
  const rawVal = chosenDaysRadio ? chosenDaysRadio.value : '7';
  const isForever = isPermanentRetention(rawVal);
  const retentionDays = isForever
    ? 'forever'
    : ([7, 10, 15].includes(Number(rawVal)) ? Number(rawVal) : 7);
  const now = typeof getServerNow === 'function' ? getServerNow() : Date.now();
  const retentionExpiresAt = isForever ? null : (now + retentionDays * 86400000);

  AppState.userProfile = {
    name: name,
    phone: phoneCheck.phone,
    line: el('inp-buyer-line')?.value.trim() || '',
    ig: el('inp-buyer-ig')?.value.trim() || '',
    fb: el('inp-buyer-fb')?.value.trim() || '',
    retentionDays: retentionDays,
    retentionExpiresAt: retentionExpiresAt,
    isPermanent: isForever
  };

  AppState.activeIdentityRole = 'buyer';
  SafeStorage.set('agy_active_identity_role', 'buyer');
  SafeStorage.set('agy_buyer_profile', AppState.userProfile);
  SafeStorage.set('agy_test_buyer_backup', AppState.userProfile);
  if (isSuperAdmin) {
    upsertTestBuyerPersona(AppState.userProfile);
  }

  syncIdentityDisplayUI();

  // 即時寫入雲端 buyers（買家註冊名冊）節點，同步保留天數/永久保留狀態與到期時間戳記
  const key = phoneCheck.phone.replace(/[^0-9]/g, '');
  const buyerData = {
    name: name,
    phone: phoneCheck.phone,
    line: AppState.userProfile.line || '',
    ig: AppState.userProfile.ig || '',
    fb: AppState.userProfile.fb || '',
    retentionDays: retentionDays,
    retentionExpiresAt: retentionExpiresAt,
    isPermanent: isForever,
    updatedAt: now,
    createdAt: now
  };

  const existingIdx = (AppState.registeredBuyers || []).findIndex(
    b => String(b.phone || '').replace(/[^0-9]/g, '') === key
  );
  if (existingIdx >= 0) {
    AppState.registeredBuyers[existingIdx] = Object.assign({}, AppState.registeredBuyers[existingIdx], buyerData);
  } else {
    AppState.registeredBuyers.unshift(buyerData);
  }
  renderAdminBuyersRoster();

  const db = FirebaseManager.getDb();
  if (db) {
    db.ref('settings/buyers/' + key).update(buyerData).catch(() => {});
    db.ref('buyers/' + key).update(buyerData).catch(() => {});
  }
  syncToLocalServer();

  closeBuyerProfileModal();
  renderWinnerStatus();
  const retLabel = isForever ? '♾️ 永久保留（免重複登入）' : `資料保留 ${retentionDays} 天`;
  showToast(`✅ 買家身分「${name}」已儲存（${retLabel}）並同步至雲端名冊！`);
}

/**
 * 買家點擊「🚪 立即登出（清除本機保留資料）」
 * ★ 關鍵特權：最高管理者 (guess_chen1981) 完全不受最高出價者防棄標鎖定限制，即使小建是最高出價者也能隨時登出或切換分身！
 */
function handleBuyerLogout() {
  const isSuperAdmin = Boolean(AppState.isAdmin && AppState.isAdminAuthenticated);
  const lockInfo = checkBuyerHighBidderLock(AppState.userProfile.phone, AppState.userProfile.name);
  if (!isSuperAdmin && lockInfo.locked) {
    const lockMsg = `🔒 防棄標保護生效中：您目前是【${lockInfo.itemName}】的最高出價領先者，在有人超過您的競標價格前無法登出！（若您是管理員，請先點選視窗上方「🔑 驗證管理員解鎖」即可免除限制）`;
    refreshBuyerLockModalUI();
    alert(lockMsg);
    showToast(lockMsg, 4200);
    return;
  }

  if (!AppState.userProfile.name && !AppState.userProfile.phone) {
    closeBuyerProfileModal();
    showToast('您目前尚未登入買家資料');
    return;
  }

  // 若為管理員登出測試買家，自動先將該測試買家存入分身庫方便日後一鍵切回
  if (isSuperAdmin && (AppState.userProfile.name || AppState.userProfile.phone)) {
    SafeStorage.set('agy_test_buyer_backup', JSON.parse(JSON.stringify(AppState.userProfile)));
    upsertTestBuyerPersona(AppState.userProfile);
  }

  SafeStorage.remove('agy_buyer_profile');
  AppState.userProfile = {
    name: '',
    phone: '',
    line: '',
    ig: '',
    fb: '',
    retentionDays: 7,
    retentionExpiresAt: null,
    isPermanent: false
  };

  if (el('user-profile-name')) {
    el('user-profile-name').textContent = (isSuperAdmin && AppState.activeIdentityRole === 'seller') ? '官方管理者' : '登入';
  }
  if (el('inp-buyer-name')) el('inp-buyer-name').value = '';
  if (el('inp-buyer-phone')) {
    el('inp-buyer-phone').readOnly = false;
    el('inp-buyer-phone').style.opacity = '1';
    el('inp-buyer-phone').value = '';
  }
  if (el('inp-buyer-line')) el('inp-buyer-line').value = '';
  if (el('inp-buyer-ig')) el('inp-buyer-ig').value = '';
  if (el('inp-buyer-fb')) el('inp-buyer-fb').value = '';

  syncIdentityDisplayUI();
  closeBuyerProfileModal();
  renderWinnerStatus();
  showToast('🚪 已成功登出並清除目前買家綁定狀態！');
}

/**
 * 啟動與商品資料載入後之買家保留期限與防棄標自動延長檢查：
 * 若買家選擇「∞ 永久保留」，系統取消到期清除限制，永久維持其登入狀態直到主動登出；
 * 若買家為一般天數且到期，但當下仍處於「最高出價領先者」狀態，腳本自動延長保留其登入鎖定狀態！
 */
function enforceBuyerRetentionAndLock() {
  try {
    const savedBlack = SafeStorage.get('agy_blacklist');
    if (savedBlack && typeof savedBlack === 'object') {
      AppState.blacklist = Object.assign({}, savedBlack, AppState.blacklist || {});
    }

    const p = AppState.userProfile;
    if (!p || (!p.name && !p.phone)) return;

    const isPerm = isPermanentRetention(p.retentionDays) || Boolean(p.isPermanent);
    if (isPerm) {
      p.retentionDays = 'forever';
      p.retentionExpiresAt = null;
      p.isPermanent = true;
      if (el('user-profile-name') && p.name) {
        el('user-profile-name').textContent = p.name;
      }
      return;
    }

    const now = typeof getServerNow === 'function' ? getServerNow() : Date.now();
    const lockInfo = checkBuyerHighBidderLock(p.phone, p.name);

    if (p.retentionExpiresAt && now > Number(p.retentionExpiresAt)) {
      if (lockInfo.locked) {
        // 自動延長保留期限，維持最高出價領先者鎖定狀態
        const extDays = [7, 10, 15].includes(Number(p.retentionDays)) ? Number(p.retentionDays) : 7;
        p.retentionExpiresAt = now + extDays * 86400000;
        SafeStorage.set('agy_buyer_profile', p);
        console.log(`🔒 買家【${p.name}】仍為【${lockInfo.itemName}】最高出價領先者，腳本已自動延長保留鎖定狀態！`);
      } else {
        // 已到期且無領先標案鎖定，自動清除過期資料
        SafeStorage.remove('agy_buyer_profile');
        AppState.userProfile = { name: '', phone: '', line: '', ig: '', fb: '', retentionDays: 7, retentionExpiresAt: null, isPermanent: false };
        if (el('user-profile-name')) el('user-profile-name').textContent = '登入';
        return;
      }
    }

    if (el('user-profile-name') && p.name) {
      el('user-profile-name').textContent = p.name;
    }
  } catch (e) {}
}

function restoreSavedProfile() {
  try {
    const savedBlack = SafeStorage.get('agy_blacklist');
    if (savedBlack && typeof savedBlack === 'object') {
      AppState.blacklist = savedBlack;
    }

    const saved = SafeStorage.get('agy_buyer_profile');
    if (saved) {
      const p = (typeof saved === 'object') ? saved : JSON.parse(saved);
      const isPerm = isPermanentRetention(p.retentionDays) || Boolean(p.isPermanent);
      if (isPerm) {
        p.retentionDays = 'forever';
        p.retentionExpiresAt = null;
        p.isPermanent = true;
      } else {
        if (!p.retentionDays) p.retentionDays = 7;
        if (!p.retentionExpiresAt) p.retentionExpiresAt = Date.now() + Number(p.retentionDays) * 86400000;
      }
      AppState.userProfile = Object.assign({}, AppState.userProfile, p);
      if (el('user-profile-name') && AppState.userProfile.name) {
        el('user-profile-name').textContent = AppState.userProfile.name;
      }
    }
    const savedRole = SafeStorage.get('agy_active_identity_role');
    if (savedRole === 'seller' || savedRole === 'buyer') {
      AppState.activeIdentityRole = savedRole;
    }
    const savedCur = SafeStorage.get('agy_active_currency');
    if (savedCur && CURRENCY_RATES[savedCur]) {
      AppState.activeCurrency = savedCur;
      if (el('currency-select')) el('currency-select').value = savedCur;
    }
  } catch (e) {}
}

/* ─────────────────────────────────────────────────────────────
   15.5 得標取貨期限格式化 ＆ 棄標後第 2、第 3 順位「遞補優惠價」彈性成交模組
   ───────────────────────────────────────────────────────────── */

/**
 * 格式化顯示得標後取貨保留期限（支援依保留小時數、指定星期幾、或自訂文字）
 */
function formatPickupDeadlineDisplay(item) {
  if (!item) return '48 小時內';
  const mode = item.pickupDeadlineMode || 'hours';
  const customNote = item.pickupDeadlineCustomText ? `（${item.pickupDeadlineCustomText}）` : '';

  if (mode === 'custom' && item.pickupDeadlineCustomText) {
    return item.pickupDeadlineCustomText;
  }

  if (mode === 'weekday') {
    const weekNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const targetDay = Number(item.pickupDeadlineWeekday ?? 6);
    const baseTs = Number(item.endTime || Date.now());
    const d = new Date(baseTs);
    let diffDays = (targetDay - d.getDay() + 7) % 7;
    if (diffDays === 0) diffDays = 7;
    const deadlineDate = new Date(baseTs + diffDays * 86400000);
    deadlineDate.setHours(21, 0, 0, 0);
    return `指定 ${weekNames[targetDay]} 21:00 前（預計至 ${deadlineDate.toLocaleDateString('zh-TW')} 21:00 止）${customNote}`;
  }

  const deadlineHours = Number(item.pickupDeadlineHours || 48);
  const daysPart = (deadlineHours >= 24 && deadlineHours % 24 === 0)
    ? `${deadlineHours / 24} 天（${deadlineHours} 小時）內`
    : `${deadlineHours} 小時內`;
  const endTs = Number(item.endTime || Date.now()) + deadlineHours * 3600000;
  return `${daysPart}（預計至 ${new Date(endTs).toLocaleString('zh-TW', { hour12: false })} 止）${customNote}`;
}

/**
 * 從商品出價紀錄中整理依最高出價金額排序的候選買家清單（第 1 順位、第 2 順位、第 3 順位...）
 */
function getSortedUniqueBidders(item) {
  if (!item) return [];
  const map = new Map();

  const addRecord = (name, phone, line, ig, fb, amount, time) => {
    const cleanName = String(name || '').trim() || '買家';
    const cleanPhone = String(phone || '').replace(/[^0-9]/g, '');
    const key = cleanPhone || cleanName;
    if (!key) return;

    // 嘗試從已註冊買家名冊補齊完整聯絡資訊
    const rosterMatch = (AppState.registeredBuyers || []).find(
      rb => (cleanPhone && String(rb.phone || '').replace(/[^0-9]/g, '') === cleanPhone) || (rb.name === cleanName)
    );

    const finalPhone = phone || (rosterMatch ? rosterMatch.phone : '');
    const finalLine = line || (rosterMatch ? rosterMatch.line : '');
    const finalIg = ig || (rosterMatch ? rosterMatch.ig : '');
    const finalFb = fb || (rosterMatch ? rosterMatch.fb : '');
    const numAmt = Number(amount || 0);

    if (!map.has(key) || numAmt > map.get(key).amount) {
      map.set(key, {
        name: cleanName,
        phone: finalPhone,
        line: finalLine,
        ig: finalIg,
        fb: finalFb,
        amount: numAmt,
        time: time || Date.now()
      });
    }
  };

  if (item.topBidder) {
    const tName = getBidderName(item.topBidder);
    const tContact = item.topBidderContact || (typeof item.topBidder === 'object' ? item.topBidder : {});
    addRecord(tName, tContact?.phone, tContact?.line, tContact?.ig, tContact?.fb, item.currentPrice ?? item.currentBid, item.topBidTime);
  }

  if (item.bids && typeof item.bids === 'object') {
    Object.values(item.bids).forEach(b => {
      if (!b) return;
      addRecord(b.bidderName || b.user, b.bidderPhone || b.phone, b.bidderLine || b.line, b.bidderIg || b.ig, b.bidderFb || b.fb, b.amount, b.timestamp || b.time);
    });
  }

  if (Array.isArray(item.bidHistory)) {
    item.bidHistory.forEach(bh => {
      if (!bh) return;
      addRecord(bh.user || bh.bidderName, bh.phone || bh.bidderPhone, bh.line, bh.ig, bh.fb, bh.amount, bh.time);
    });
  }

  const list = Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  return list.map((entry, idx) => Object.assign({}, entry, { rank: idx + 1 }));
}

/**
 * 根據所選範本與最新「💰 遞補優惠調整價」動態生成賣家遞補邀請話術
 */
function generateBackupInviteMessage(tplType, itemName, buyerName, rankText, origBid, offerPrice) {
  const cleanBuyer = buyerName || '買家';
  const cleanItem = itemName || '拍賣商品';
  const cleanRank = rankText || '第 2 順位';
  const origStr = Number(origBid || 0).toLocaleString();
  const offerStr = Number(offerPrice || origBid || 0).toLocaleString();
  const diff = Number(origBid || 0) - Number(offerPrice || 0);

  if (tplType === 'standard') {
    return `您好 ${cleanBuyer}！感謝您參與【${cleanItem}】競標。因前順位買家放棄得標資格，您為本商品【${cleanRank}】候選得標人（您當初最高出價為 NT$ ${origStr}），請問您是否願意依優惠價 NT$ ${offerStr} 遞補購買呢？`;
  }
  if (tplType === 'selfpickup') {
    return `您好 ${cleanBuyer}！感謝您參與【${cleanItem}】競標。目前開放【${cleanRank}】遞補購買，若您方便現場自取交割，賣家特別提供您自取專屬優惠，請問您是否願意依優惠價 NT$ ${offerStr}（您原出價 NT$ ${origStr}）遞補購買呢？`;
  }
  // 預設 discount (專屬折價優惠邀請)
  const saveHint = diff > 0 ? `（特別為您折讓優惠 NT$ ${diff.toLocaleString()}）` : '';
  return `您好 ${cleanBuyer}！感謝您支持【${cleanItem}】競標。因前順位買家未完成取貨，您為【${cleanRank}】候選買家（原最高出價 NT$ ${origStr}），賣家特別提供遞補專屬優惠${saveHint}，請問您是否願意依優惠價 NT$ ${offerStr} 遞補購買呢？`;
}

/**
 * 當管理員修改「💰 遞補優惠調整價」或點選候選買家時，即時同步更新邀請話術內之價格
 */
function syncBackupSellerMsgWithOfferPrice(forceRegenerate = false) {
  const item = getActiveItem();
  if (!item) return;

  const rankText = el('inp-backup-target-rank')?.value.trim() || '第 2 順位';
  const buyerName = el('inp-backup-target-name')?.value.trim() || '買家';
  const origBid = Number(el('inp-backup-orig-bid')?.value || item.currentBid || item.startPrice || 10000);
  const offerPrice = Number(el('inp-backup-offer-price')?.value || origBid);
  const msgInp = el('inp-backup-seller-msg');
  if (!msgInp) return;

  if (forceRegenerate || !msgInp.value.trim()) {
    msgInp.value = generateBackupInviteMessage(
      AppState.activeBackupTemplate || 'discount',
      item.name,
      buyerName,
      rankText,
      origBid,
      offerPrice
    );
  } else {
    // 智慧將現有話術中的「優惠價 NT$ X,XXX」即時替換為最新設定之遞補優惠價
    const formattedOffer = offerPrice.toLocaleString();
    if (/優惠價\s*NT\$\s*[\d,]+/.test(msgInp.value)) {
      msgInp.value = msgInp.value.replace(/優惠價\s*NT\$\s*[\d,]+/g, `優惠價 NT$ ${formattedOffer}`);
    } else {
      msgInp.value = generateBackupInviteMessage(
        AppState.activeBackupTemplate || 'discount',
        item.name,
        buyerName,
        rankText,
        origBid,
        offerPrice
      );
    }
  }
}

/**
 * 渲染管理員後台「🔄 棄標處理與次高價順位遞補優惠控制台 (#winner-backup-panel)」
 */
function renderAdminBackupPanel(item) {
  const panel = el('winner-backup-panel');
  if (!panel) return;

  if (!AppState.isAdmin || !item || (item.status !== 'ended' && item.status !== 'picked_up')) {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = 'block';
  const listBox = el('backup-candidates-list');
  const candidates = getSortedUniqueBidders(item);

  // 若出價紀錄中僅有 1 位或尚無次高價買家，亦將已註冊買家名冊列入候選參考，方便管理員隨時點選測試或發送遞補邀請
  const backupCandidates = candidates.filter(c => c.rank >= 2);
  if (backupCandidates.length === 0 && AppState.registeredBuyers && AppState.registeredBuyers.length > 0) {
    AppState.registeredBuyers.forEach((rb, idx) => {
      if (rb && rb.name && rb.name !== getBidderName(item.topBidder)) {
        backupCandidates.push({
          rank: idx + 2,
          name: rb.name,
          phone: rb.phone || '',
          line: rb.line || '',
          amount: Number(item.currentPrice || item.currentBid || item.startPrice || 10000)
        });
      }
    });
  }

  if (listBox) {
    listBox.innerHTML = '';
    if (backupCandidates.length === 0) {
      listBox.innerHTML = `
        <div style="font-size:.76rem;color:var(--c-text-3);padding:8px 10px;background:rgba(255,255,255,0.02);border-radius:8px;">
          💡 目前出價紀錄尚無第 2 順位買家，您可直接於下方表單手動填入候選買家與「💰 遞補優惠調整價」產生專屬邀請連結！
        </div>
      `;
    } else {
      backupCandidates.forEach((cand, idx) => {
        const row = document.createElement('div');
        row.className = `backup-candidate-item ${idx === 0 ? 'active' : ''}`;
        const blockedTag = isBuyerBlacklisted(cand.phone)
          ? '<span class="buyer-status-chip chip-blacklisted">🚫 黑名單</span>'
          : '';
        row.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span class="item-tab-badge badge-live" style="font-size:.72rem;">第 ${cand.rank} 順位</span>
            <strong style="color:#fff;font-size:.84rem;">👤 ${escapeHtml(cand.name)}</strong>
            <span style="font-size:.76rem;color:var(--c-gold-1);font-family:var(--f-num);font-weight:800;">原最高出價：NT$ ${Number(cand.amount || 0).toLocaleString()}</span>
            ${cand.phone ? `<span style="font-size:.74rem;color:var(--c-text-2);">📞 ${escapeHtml(cand.phone)}</span>` : ''}
            ${cand.line ? `<span style="font-size:.72rem;color:#34d399;">Line: ${escapeHtml(cand.line)}</span>` : ''}
            ${blockedTag}
          </div>
          <button type="button" class="tbtn tbtn-gold tbtn-xs">🎯 選取並帶入原出價</button>
        `;
        row.addEventListener('click', () => {
          listBox.querySelectorAll('.backup-candidate-item').forEach(elItem => elItem.classList.remove('active'));
          row.classList.add('active');
          if (el('inp-backup-target-rank')) el('inp-backup-target-rank').value = `第 ${cand.rank} 順位`;
          if (el('inp-backup-target-name')) el('inp-backup-target-name').value = cand.name || '';
          if (el('inp-backup-target-phone')) el('inp-backup-target-phone').value = cand.phone || '';
          if (el('inp-backup-target-line')) el('inp-backup-target-line').value = cand.line || '';
          if (el('inp-backup-orig-bid')) el('inp-backup-orig-bid').value = cand.amount || item.startPrice || 10000;
          // ★ 自動預先帶入該買家當初的最高出價金額至「遞補優惠調整價」欄位
          if (el('inp-backup-offer-price')) el('inp-backup-offer-price').value = cand.amount || item.startPrice || 10000;
          syncBackupSellerMsgWithOfferPrice(true);
          showToast(`🎯 已帶入【第 ${cand.rank} 順位：${cand.name}】原出價 NT$ ${Number(cand.amount).toLocaleString()}，可於右側調整遞補優惠價！`);
        });
        listBox.appendChild(row);
      });
    }
  }

  // 初次渲染或表單尚未填入時，預先帶入已存在的 backupOffer 或第一位次高價候選買家
  const nameInp = el('inp-backup-target-name');
  if (nameInp && !nameInp.dataset.initializedForItem || nameInp?.dataset.initializedForItem !== item.id) {
    nameInp.dataset.initializedForItem = item.id;
    if (item.backupOffer) {
      if (el('inp-backup-target-rank')) el('inp-backup-target-rank').value = item.backupOffer.rankLabel || '第 2 順位';
      if (el('inp-backup-target-name')) el('inp-backup-target-name').value = item.backupOffer.buyerName || '';
      if (el('inp-backup-target-phone')) el('inp-backup-target-phone').value = item.backupOffer.buyerPhone || '';
      if (el('inp-backup-target-line')) el('inp-backup-target-line').value = item.backupOffer.buyerLine || '';
      if (el('inp-backup-orig-bid')) el('inp-backup-orig-bid').value = item.backupOffer.originalBid || item.currentBid || item.startPrice || 10000;
      if (el('inp-backup-offer-price')) el('inp-backup-offer-price').value = item.backupOffer.offerPrice || item.backupOffer.originalBid || item.currentBid || item.startPrice || 10000;
      if (el('inp-backup-seller-msg')) el('inp-backup-seller-msg').value = item.backupOffer.sellerMessage || '';
    } else if (backupCandidates.length > 0) {
      const firstCand = backupCandidates[0];
      if (el('inp-backup-target-rank')) el('inp-backup-target-rank').value = `第 ${firstCand.rank} 順位`;
      if (el('inp-backup-target-name')) el('inp-backup-target-name').value = firstCand.name || '';
      if (el('inp-backup-target-phone')) el('inp-backup-target-phone').value = firstCand.phone || '';
      if (el('inp-backup-target-line')) el('inp-backup-target-line').value = firstCand.line || '';
      if (el('inp-backup-orig-bid')) el('inp-backup-orig-bid').value = firstCand.amount || item.startPrice || 10000;
      if (el('inp-backup-offer-price')) el('inp-backup-offer-price').value = firstCand.amount || item.startPrice || 10000;
      syncBackupSellerMsgWithOfferPrice(true);
    } else {
      const baseAmt = Number(item.currentPrice || item.currentBid || item.startPrice || 10000);
      if (el('inp-backup-orig-bid')) el('inp-backup-orig-bid').value = baseAmt;
      if (el('inp-backup-offer-price')) el('inp-backup-offer-price').value = baseAmt;
      syncBackupSellerMsgWithOfferPrice(true);
    }
  }

  // 顯示目前已發送之遞補邀請即時狀態
  const statusBox = el('admin-backup-offer-status-box');
  if (statusBox) {
    if (item.backupOffer) {
      const bo = item.backupOffer;
      statusBox.style.display = 'block';
      let statusLabel = '⏳ 等待買家確認意願中';
      let statusColor = '#fbbf24';
      if (bo.status === 'accepted') {
        statusLabel = `✅ 買家【${bo.buyerName}】已同意依遞補優惠價 NT$ ${Number(bo.offerPrice).toLocaleString()} 正式成交！`;
        statusColor = '#34d399';
      } else if (bo.status === 'declined') {
        statusLabel = `❌ 買家【${bo.buyerName}】已婉拒此次遞補，請點選下一順位買家發送邀請。`;
        statusColor = '#f87171';
      }
      statusBox.innerHTML = `
        <div style="font-weight:800;color:${statusColor};margin-bottom:4px;">${statusLabel}</div>
        <div style="font-size:.76rem;color:var(--c-text-2);">
          受邀對象：<strong>${escapeHtml(bo.buyerName || '—')}</strong>（${escapeHtml(bo.rankLabel || '第 2 順位')}）｜
          原出價：NT$ ${Number(bo.originalBid || 0).toLocaleString()} ➔
          <strong style="color:var(--c-gold-1);">遞補優惠價：NT$ ${Number(bo.offerPrice || 0).toLocaleString()}</strong>
        </div>
        ${bo.buyerReplyNote ? `<div style="margin-top:4px;padding:6px 8px;background:rgba(0,0,0,0.35);border-radius:6px;color:#fff;font-size:.78rem;">💬 買家回覆備註：${escapeHtml(bo.buyerReplyNote)}</div>` : ''}
      `;
    } else {
      statusBox.style.display = 'none';
    }
  }
}

/**
 * 渲染買家端「🎁 賣家專屬遞補購買意願確認卡 (#backup-offer-confirm-card)」
 */
function renderBackupOfferConfirmCard(item) {
  const card = el('backup-offer-confirm-card');
  if (!card) return;

  if (!item || !item.backupOffer) {
    card.style.display = 'none';
    return;
  }

  const bo = item.backupOffer;
  const params = new URLSearchParams(window.location.search);
  const urlOfferId = params.get('offer');
  const myCleanPhone = String(AppState.userProfile.phone || '').replace(/[^0-9]/g, '');
  const targetCleanPhone = String(bo.buyerPhone || '').replace(/[^0-9]/g, '');
  const isMatchedBuyer =
    (urlOfferId && (urlOfferId === bo.offerId || urlOfferId === '1' || urlOfferId === 'true')) ||
    (myCleanPhone && targetCleanPhone && myCleanPhone === targetCleanPhone) ||
    (AppState.userProfile.name && bo.buyerName && AppState.userProfile.name.trim() === bo.buyerName.trim()) ||
    AppState.isAdmin;

  if (!isMatchedBuyer) {
    card.style.display = 'none';
    return;
  }

  card.style.display = 'block';
  if (el('backup-card-buyer-name')) el('backup-card-buyer-name').textContent = bo.buyerName || '受邀買家';
  if (el('backup-card-rank-label')) el('backup-card-rank-label').textContent = bo.rankLabel || '第 2 順位';

  const origBid = Number(bo.originalBid || item.currentBid || item.startPrice || 0);
  const offerPrice = Number(bo.offerPrice || origBid);
  if (el('backup-card-orig-price')) {
    el('backup-card-orig-price').textContent = formatMoney(origBid, AppState.activeCurrency);
  }
  if (el('backup-card-offer-price')) {
    el('backup-card-offer-price').textContent = formatMoney(offerPrice, AppState.activeCurrency);
  }

  const discountTag = el('backup-card-discount-tag');
  if (discountTag) {
    if (offerPrice < origBid) {
      discountTag.style.display = 'inline-block';
      discountTag.textContent = `🎉 賣家已為您折減優惠 NT$ ${(origBid - offerPrice).toLocaleString()}`;
    } else {
      discountTag.style.display = 'none';
    }
  }

  if (el('backup-card-seller-msg')) {
    el('backup-card-seller-msg').textContent = bo.sellerMessage || `您好！請問您是否願意依遞補優惠價 NT$ ${offerPrice.toLocaleString()} 遞補購買本商品呢？`;
  }

  const acceptBtn = el('btn-accept-backup-offer');
  if (acceptBtn) {
    acceptBtn.textContent = `✅ 我願意依遞補優惠價 NT$ ${offerPrice.toLocaleString()} 購買`;
  }

  const statusBadge = el('backup-card-status-badge');
  const actionBtns = el('backup-card-action-btns');
  const replyBox = el('backup-buyer-reply-box');
  const summaryBox = el('backup-responded-summary');

  if (bo.status === 'accepted') {
    if (statusBadge) {
      statusBadge.className = 'item-tab-badge badge-picked';
      statusBadge.textContent = '✅ 已同意遞補成交';
    }
    if (actionBtns) actionBtns.style.display = 'none';
    if (replyBox) replyBox.style.display = 'none';
    if (summaryBox) {
      summaryBox.style.display = 'block';
      summaryBox.innerHTML = `🎉 <strong>恭喜您已確認遞補得標！</strong><br>正式成交價已鎖定為遞補優惠價 <strong>NT$ ${offerPrice.toLocaleString()}</strong>。${bo.buyerReplyNote ? `<br>您的回覆備註：「${escapeHtml(bo.buyerReplyNote)}」` : ''}`;
    }
  } else if (bo.status === 'declined') {
    if (statusBadge) {
      statusBadge.className = 'item-tab-badge badge-ended';
      statusBadge.textContent = '❌ 已婉拒遞補';
    }
    if (actionBtns) actionBtns.style.display = 'none';
    if (replyBox) replyBox.style.display = 'none';
    if (summaryBox) {
      summaryBox.style.display = 'block';
      summaryBox.innerHTML = `您已婉拒本次遞補邀請，系統將通知賣家依序詢問下一順位買家。${bo.buyerReplyNote ? `<br>您的回覆備註：「${escapeHtml(bo.buyerReplyNote)}」` : ''}`;
    }
  } else {
    if (statusBadge) {
      statusBadge.className = 'item-tab-badge badge-live';
      statusBadge.textContent = '⏳ 待確認意願';
    }
    if (actionBtns) actionBtns.style.display = 'flex';
    if (replyBox) replyBox.style.display = 'block';
    if (summaryBox) summaryBox.style.display = 'none';
  }
}

/**
 * 後台管理員點擊「🚫 判定當前得標者棄標（列入黑名單並啟動順位遞補）」
 */
function handleMarkWinnerDefaultAndBlacklist() {
  if (!requireAdminAuth()) return;
  const item = getActiveItem();
  if (!item) return;

  const winnerName = getBidderName(item.topBidder) || '原得標買家';
  const winnerContact = item.topBidderContact || (typeof item.topBidder === 'object' ? item.topBidder : {});
  const winnerPhone = winnerContact?.phone || '';

  if (!confirm(`🚫 確定要判定【${winnerName} ${winnerPhone ? '(' + winnerPhone + ')' : ''}】棄標嗎？\n\n執行後：\n1. 該買家門號將自動列入封鎖黑名單\n2. 自動為您帶入下一順位次高價買家與原出價，供您設定「💰 遞補優惠調整價」發送遞補邀請！`)) {
    return;
  }

  if (winnerPhone) {
    const key = String(winnerPhone).replace(/[^0-9]/g, '');
    if (key) {
      if (!AppState.blacklist) AppState.blacklist = {};
      AppState.blacklist[key] = {
        name: winnerName,
        phone: winnerPhone,
        reason: `商品【${item.name}】得標後棄標`,
        blockedAt: getServerNow()
      };
      SafeStorage.set('agy_blacklist', AppState.blacklist);
      const db = FirebaseManager.getDb();
      if (db) {
        db.ref('settings/blacklist/' + key).set(AppState.blacklist[key]).catch(() => {});
      }
    }
  }

  if (!Array.isArray(item.defaultedBidders)) item.defaultedBidders = [];
  item.defaultedBidders.push({
    name: winnerName,
    phone: winnerPhone,
    amount: item.currentPrice ?? item.currentBid,
    time: getServerNow()
  });

  renderAdminBuyersRoster();
  renderAdminBackupPanel(item);
  syncToFirebase();
  syncToLocalServer();
  showToast(`🚫 已將棄標買家【${winnerName}】列入黑名單！請於下方確認「遞補優惠調整價」並複製遞補邀請連結。`, 4200);
}

/**
 * 後台管理員點擊「📋 複製邀請文案與專屬連結（同步送出遞補優惠邀請卡）」
 */
function handleCopyAndSendBackupInvite() {
  if (!requireAdminAuth()) return;
  const item = getActiveItem();
  if (!item) return;

  const rankLabel = el('inp-backup-target-rank')?.value.trim() || '第 2 順位';
  const buyerName = el('inp-backup-target-name')?.value.trim() || '候選買家';
  const buyerPhone = el('inp-backup-target-phone')?.value.trim() || '';
  const buyerLine = el('inp-backup-target-line')?.value.trim() || '';
  const origBid = Number(el('inp-backup-orig-bid')?.value || item.currentBid || item.startPrice || 10000);
  const offerPrice = Number(el('inp-backup-offer-price')?.value || origBid);

  if (offerPrice <= 0) {
    alert('請輸入有效的「遞補優惠調整價」金額！');
    return;
  }

  // 確保邀請話術內的價格與最新的「遞補優惠調整價」一致
  syncBackupSellerMsgWithOfferPrice(false);
  const sellerMsg = el('inp-backup-seller-msg')?.value.trim() ||
    generateBackupInviteMessage(AppState.activeBackupTemplate || 'discount', item.name, buyerName, rankLabel, origBid, offerPrice);

  const offerId = 'offer_' + Date.now();
  item.backupOffer = {
    offerId: offerId,
    rankLabel: rankLabel,
    buyerName: buyerName,
    buyerPhone: buyerPhone,
    buyerLine: buyerLine,
    originalBid: origBid,
    offerPrice: offerPrice, // ★ 後續買家同意後的正式成交價以此「遞補優惠價」為準
    sellerMessage: sellerMsg,
    status: 'pending',
    buyerReplyNote: '',
    createdAt: getServerNow(),
    respondedAt: null
  };

  SafeStorage.set('agy_items', AppState.items);
  syncToFirebase();
  syncToLocalServer();

  const base = getBaseUrl();
  const confirmUrl = `${base}/index.html?id=${encodeURIComponent(item.id)}&mode=single&offer=${encodeURIComponent(offerId)}`;
  const studio = AppState.studioName || '建生工坊';
  const diff = origBid - offerPrice;
  const discountLine = diff > 0
    ? `💰 賣家專屬遞補優惠價：NT$ ${offerPrice.toLocaleString()}（較您原出價 NT$ ${origBid.toLocaleString()} 再省 NT$ ${diff.toLocaleString()}！）`
    : `💰 遞補優惠成交價：NT$ ${offerPrice.toLocaleString()}`;

  const fullInviteText = [
    `🎉【${studio}】拍賣次高價遞補購買專屬邀請 🎉`,
    `📦 拍賣商品：${item.name}`,
    `👤 受邀買家：${buyerName}（${rankLabel}）`,
    discountLine,
    `💌 賣家邀請留言：`,
    sellerMsg,
    ``,
    `👇 請點擊下方專屬確認連結，查看遞補優惠價並點選「同意遞補購買」或填寫回覆備註：`,
    confirmUrl
  ].join('\n');

  navigator.clipboard.writeText(fullInviteText).then(() => {
    showToast(`📋 已成功複製【${buyerName}】專屬遞補邀請文案（遞補優惠價 NT$ ${offerPrice.toLocaleString()}）與連結！`, 4200);
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = fullInviteText;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast(`📋 已成功複製遞補邀請文案（遞補優惠價 NT$ ${offerPrice.toLocaleString()}）！`, 4200);
  });

  renderWinnerStatus();
}

/**
 * 買家於專屬確認卡點擊「✅ 我願意依此遞補優惠價購買」或「❌ 婉拒此次遞補邀請」
 */
function handleBuyerRespondBackupOffer(isAccept) {
  const item = getActiveItem();
  if (!item || !item.backupOffer) return;

  const bo = item.backupOffer;
  const replyNote = el('inp-backup-buyer-note')?.value.trim() || '';
  const offerPrice = Number(bo.offerPrice || bo.originalBid || item.currentBid || item.startPrice);
  const now = getServerNow();

  if (isAccept) {
    bo.status = 'accepted';
    bo.buyerReplyNote = replyNote;
    bo.respondedAt = now;

    // ★ 核心機制：正式成交價與得標買家立即以管理員設定的「遞補優惠價 (offerPrice)」為準！
    item.finalDealPrice = offerPrice;
    item.currentPrice = offerPrice;
    item.currentBid = offerPrice;
    item.topBidder = bo.buyerName || AppState.userProfile.name || '遞補得標買家';
    item.topBidderContact = {
      name: bo.buyerName || AppState.userProfile.name || '遞補得標買家',
      phone: bo.buyerPhone || AppState.userProfile.phone || '',
      line: bo.buyerLine || AppState.userProfile.line || '',
      ig: AppState.userProfile.ig || '',
      fb: AppState.userProfile.fb || ''
    };
    item.endTime = now; // 重新起算得標取貨期限

    if (!Array.isArray(item.winnerMsgs)) item.winnerMsgs = [];
    item.winnerMsgs.push({
      sender: item.topBidder,
      isSeller: false,
      text: `🎉 【已確認同意遞補購買】我願意依賣家提供的遞補優惠價 NT$ ${offerPrice.toLocaleString()} 購買！${replyNote ? '（備註：' + replyNote + '）' : ''}`,
      time: now
    });

    triggerConfetti();
    showToast(`🎉 恭喜您已確認依遞補優惠價 NT$ ${offerPrice.toLocaleString()} 正式得標！`, 4500);
  } else {
    if (!confirm('確定要婉拒此次遞補購買邀請嗎？婉拒後賣家將依序詢問下一順位買家。')) {
      return;
    }
    bo.status = 'declined';
    bo.buyerReplyNote = replyNote;
    bo.respondedAt = now;
    showToast('已送出婉拒回覆，感謝您的參與！');
  }

  SafeStorage.set('agy_items', AppState.items);
  const db = FirebaseManager.getDb();
  if (db && item.id) {
    db.ref(`auction/items/${item.id}`).update({
      currentPrice: item.currentPrice,
      finalDealPrice: item.finalDealPrice || null,
      topBidder: item.topBidderContact || item.topBidder,
      backupOffer: item.backupOffer,
      winnerMsgs: item.winnerMsgs || []
    }).catch(() => {});
  }
  syncToFirebase();
  syncToLocalServer();
  renderWinnerStatus();
  renderActiveItemDisplay();
  renderItemTabs();
}

/* ─────────────────────────────────────────────────────────────
   16. 雲端同步與監聽 (Firebase Sync & Realtime Listeners - 舊資料保護與安全寫入)
   ───────────────────────────────────────────────────────────── */
function syncToFirebase() {
  const db = FirebaseManager.getDb();
  if (!db || !AppState.auctionId) return;

  const ref = db.ref('auctions/' + AppState.auctionId);

  // 採用合併更新 (update) 而非整筆覆蓋 (set)，防止其他欄位與舊資料流失
  const payload = {
    studioName: AppState.studioName,
    items: AppState.items,
    broadcasts: AppState.broadcasts,
    lastUpdated: getServerNow()
  };

  // 向下相容支援：若當前有商品，將首項商品的舊版頂層欄位一併安全合併寫入
  if (AppState.items && AppState.items.length > 0) {
    const main = AppState.items[0];
    payload.itemName = main.name;
    payload.itemSubtitle = main.subtitle || '';
    payload.itemDesc = main.desc || '';
    payload.startPrice = main.startPrice;
    payload.increment = main.increment;
    payload.videoUrl = main.videoUrl || '';
    payload.imageList = (main.images || []).map((src, i) => ({
      src: src,
      name: `img_${i + 1}`,
      isCover: i === 0
    }));

    // 同步更新至 auction/items 節點以支援跨客戶端 Transaction、問答與防壓標（空欄位必須顯式送 null 才會清除雲端舊值）
    AppState.items.forEach(it => {
      if (it && it.id) {
        const hasBidsMap = it.bids && Object.keys(it.bids).length > 0;
        const hasHistoryArr = Array.isArray(it.bidHistory) && it.bidHistory.length > 0;
        const hasWinnerMsgs = Array.isArray(it.winnerMsgs) && it.winnerMsgs.length > 0;
        const hasDefaulted = Array.isArray(it.defaultedBidders) && it.defaultedBidders.length > 0;
        const isClosed = (it.status === 'ended' || it.status === 'picked_up');
        db.ref(`auction/items/${it.id}`).update({
          id: it.id,
          name: it.name,
          startPrice: Number(it.startPrice || 0),
          increment: Number(it.increment || 10),
          currentPrice: Number(it.currentPrice ?? it.currentBid ?? it.startPrice ?? 0),
          currentBid: Number(it.currentBid ?? it.currentPrice ?? it.startPrice ?? 0),
          topBidder: it.topBidder ? it.topBidder : null,
          topBidderContact: it.topBidderContact || null,
          topBidTime: it.topBidTime || null,
          endTime: Number(it.endTime || 0),
          status: it.status || 'live',
          auctionLive: !isClosed,
          auctionDone: isClosed,
          endedEarly: it.endedEarly ? true : null,
          manualEnd: it.manualEnd ? true : null,
          isEnded: it.isEnded ? true : null,
          relistSeq: Number(it.relistSeq || 0),
          reopenedAt: it.reopenedAt || null,
          pickedUpAt: it.pickedUpAt || null,
          pickupDeadline: it.pickupDeadline || null,
          backupState: it.backupState || null,
          timeMode: it.timeMode || 'fixed',
          antiSnipeEnable: it.antiSnipeEnable !== false && it.antiSnipeEnabled !== false,
          antiSnipeMins: Number(it.antiSnipeMins || 3),
          antiSnipeExt: Number(it.antiSnipeExt || it.antiSnipeExtMins || 3),
          qa: (it.qa && Object.keys(it.qa).length > 0) ? it.qa : null,
          bids: hasBidsMap ? it.bids : null,
          bidHistory: hasHistoryArr ? it.bidHistory : null,
          backupOffer: it.backupOffer || null,
          finalDealPrice: it.finalDealPrice || null,
          defaultedBidders: hasDefaulted ? it.defaultedBidders : null,
          winnerMsgs: hasWinnerMsgs ? it.winnerMsgs : null,
          pickupDeadlineHours: Number(it.pickupDeadlineHours || 48),
          pickupDeadlineMode: it.pickupDeadlineMode || 'hours',
          pickupDeadlineWeekday: Number(it.pickupDeadlineWeekday ?? 6),
          pickupDeadlineCustomText: it.pickupDeadlineCustomText || ''
        }).catch(() => {});
      }
    });
  }

  ref.update(payload).catch(err => {
    console.warn('Firebase 安全合併更新失敗：', err);
  });
}

function listenFirebase(auctionId) {
  const db = FirebaseManager.getDb();
  if (!db || !auctionId) return;

  AppState.auctionId = auctionId;
  SafeStorage.set('agy_last_auction_id', auctionId);
  initServerTimeSync(db);

  db.ref('auctions/' + auctionId).on('value', snap => {
    if (!snap.exists()) {
      console.log('Firebase 雲端拍賣節點不存在：', auctionId);
      return;
    }
    const data = snap.val();
    if (!data) return;

    if (data.studioName) {
      if (data.studioName === 'JianSheng Boutique') {
        updateStudioName('建生工坊', true);
      } else {
        updateStudioName(data.studioName, false);
      }
    }
    if (data.studioLogo) {
      updateStudioLogo(data.studioLogo, false);
    }
    if (data.logoConfig) {
      applyLogoConfig(data.logoConfig, false);
    }
    if (data.baseCurrency) AppState.baseCurrency = data.baseCurrency;

    let incomingItems = [];

    // 1. 判斷多商品結構 (items 陣列或物件)
    if (data.items) {
      const rawList = (Array.isArray(data.items) ? data.items : Object.values(data.items)).filter(it => {
        if (!it || typeof it !== 'object') return false;
        const nm = String(it.name || it.itemName || it.title || '').trim();
        if (!nm || (nm === '拍賣商品' && Number(it.startPrice) === 100 && (!it.images || it.images[0] === 'icon-512.png'))) return false;
        return true;
      });
      incomingItems = rawList.map((it, idx) => normalizeItem(it, it.id || `item-${idx + 1}`));
    }
    // 2. 舊版單一商品頂層結構自動相容遷移 (itemName / startPrice / imageList 等舊格式)
    else if (data.itemName || data.name || data.startPrice !== undefined || data.imageList || data.imgUrl || data.imageUrls || data.currentBid !== undefined) {
      console.log('🔄 偵測到舊版 Firebase 拍賣資料結構，執行自動相容遷移…');
      const legacyItem = normalizeItem(data, data.auctionId || 'item-legacy-1');
      incomingItems = [legacyItem];
    }

    if (incomingItems.length > 0) {
      // 比對即時出價超越警示與重開競態防護 (防止剛重開的商品被延遲快照覆蓋回已結標)
      const mergedItems = incomingItems.map(remoteItem => {
        const localItem = AppState.items.find(i => i.id === remoteItem.id);
        if (localItem && shouldIgnoreStaleRemoteUpdate(localItem, remoteItem)) {
          return localItem;
        }
        if (localItem && remoteItem.currentBid > localItem.currentBid) {
          checkOutbidNotice(remoteItem.id, remoteItem.topBidder, remoteItem.currentBid);
        }
        return remoteItem;
      });

      // 保留僅存於本機重開鎖定中的項目
      AppState.items = mergedItems;

      // 依據網址 ?id= 參數鎖定商品
      applyUrlRouteParams();

      // 保持 activeItemId 與 editingItemId 有效指向
      if (!AppState.items.some(i => i.id === AppState.activeItemId)) {
        AppState.activeItemId = AppState.items[0].id;
      }
      if (!AppState.editingItemId || !AppState.items.some(i => i.id === AppState.editingItemId)) {
        AppState.editingItemId = AppState.activeItemId;
      }

      // 同步更新編輯面板各項資料
      loadItemIntoEditForm(AppState.editingItemId);

      renderItemTabs();
      renderActiveItemDisplay();
      renderBidHistory();
      renderQA();
      renderWinnerStatus();
      renderAdminItemsList();
      updateShareUrl();
    }

    if (data.broadcasts && Array.isArray(data.broadcasts)) {
      if (data.broadcasts.length > AppState.broadcasts.length) {
        const latest = data.broadcasts[data.broadcasts.length - 1];
        showTopBroadcastBanner(latest.msg);
      }
      AppState.broadcasts = data.broadcasts;
      renderBroadcastHistory();
    }
  });
}

/* ─────────────────────────────────────────────────────────────
   17. PWA 與彩帶動畫 (PWA Install & Confetti Animation)
   ───────────────────────────────────────────────────────────── */
let _deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  _deferredPrompt = e;
  if (el('btn-pwa-install')) el('btn-pwa-install').style.display = 'inline-flex';
});

function handlePwaInstall() {
  if (_deferredPrompt) {
    _deferredPrompt.prompt();
    _deferredPrompt.userChoice.then(() => { _deferredPrompt = null; });
  } else {
    alert('📱 欲將本拍賣系統加入手機主畫面：\n1. iPhone Safari：點擊瀏覽器下方「分享」按鈕 ➔ 選擇「加入主畫面」。\n2. Android Chrome：點擊右上角三點選單 ➔ 選擇「安裝應用程式」或「加到主畫面」。');
  }
}

function triggerConfetti() {
  const canvas = el('fx-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = [];
  const colors = ['#f59e0b', '#fbbf24', '#a855f7', '#7c3aed', '#ec4899', '#22c55e'];
  for (let i = 0; i < 90; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 8 + 4,
      d: Math.random() * 80 + 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 10,
      tiltAngle: 0,
      tiltAngleInc: Math.random() * 0.08 + 0.05
    });
  }

  let animFrame;
  let start = Date.now();
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.tiltAngle += p.tiltAngleInc;
      p.y += (Math.cos(p.d) + 3 + p.r / 2) / 1.5;
      p.x += Math.sin(p.d);
      ctx.beginPath();
      ctx.lineWidth = p.r / 2;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
      ctx.stroke();
    });
    if (Date.now() - start < 4500) {
      animFrame = requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animFrame);
    }
  }
  draw();
}

/* ─────────────────────────────────────────────────────────────
   18. 事件監聽綁定與初始化 (Event Listeners & Init)
   ───────────────────────────────────────────────────────────── */
/**
 * ☁️ 自動將目前生效中（或系統內建預設）的 Firebase 參數填入設定視窗，並更新即時連線狀態標籤
 * 嚴格保證開啟視窗時三個輸入框絕不呈現空白！
 */
function populateFbSetupModal() {
  const defCfg = FirebaseManager.getDefaultConfig();
  const activeCfg = FirebaseManager.getActiveConfig();

  const apiKey = (activeCfg.apiKey && activeCfg.apiKey.trim()) ? activeCfg.apiKey.trim() : defCfg.apiKey;
  const dbUrl = (activeCfg.databaseURL && activeCfg.databaseURL.trim()) ? activeCfg.databaseURL.trim() : defCfg.databaseURL;
  const projId = (activeCfg.projectId && activeCfg.projectId.trim()) ? activeCfg.projectId.trim() : defCfg.projectId;

  const inpKey = el('fb-api-key');
  const inpUrl = el('fb-db-url');
  const inpProj = el('fb-project-id');

  if (inpKey) {
    inpKey.value = apiKey;
    inpKey.setAttribute('value', apiKey);
  }
  if (inpUrl) {
    inpUrl.value = dbUrl;
    inpUrl.setAttribute('value', dbUrl);
  }
  if (inpProj) {
    inpProj.value = projId;
    inpProj.setAttribute('value', projId);
  }

  const banner = el('fb-connection-status-banner');
  const dot = el('fb-connection-status-dot');
  const title = el('fb-connection-status-text');
  const sub = el('fb-connection-status-sub');

  const isReady = FirebaseManager.isReady();
  const isDefaultNode = (projId === defCfg.projectId && dbUrl === defCfg.databaseURL);

  if (banner) {
    banner.classList.toggle('connected', isReady);
    banner.classList.toggle('fallback', !isReady);
  }
  if (dot) {
    dot.textContent = isReady ? '🟢' : '🟡';
  }
  if (title) {
    if (isReady) {
      title.textContent = `🟢 目前已正常連線至雲端資料庫（${projId}）`;
    } else {
      title.textContent = `預設綁定 ${projId} 雲端資料庫（本機安全同步模式就緒）`;
    }
  }
  if (sub) {
    sub.textContent = isDefaultNode
      ? '系統內建預設連線生效中・全球買家開啟網頁皆自動連線同步，無須手動設定'
      : `目前使用自訂節點（${dbUrl}）・可隨時點擊下方按鈕恢復系統內建預設連線`;
  }
}

/**
 * 開啟「☁️ Firebase 雲端資料庫設定」視窗（僅限最高權限管理者 guess_chen1981）
 */
function openFbSetupModal() {
  if (!requireAdminAuth(() => openFbSetupModal())) return;
  populateFbSetupModal();
  el('modal-fb-setup')?.classList.add('show');
}

/**
 * 儲存 Firebase 雲端連線設定（具備防呆保護：若任一欄位為空白或格式不完整，自動還原為系統內建預設參數，絕不寫入空值導致斷線）
 */
function handleSaveFbConfig() {
  if (!requireAdminAuth(() => handleSaveFbConfig())) return;

  const defCfg = FirebaseManager.getDefaultConfig();
  const rawKey = el('fb-api-key')?.value.trim() || '';
  const rawUrl = el('fb-db-url')?.value.trim() || '';
  const rawProj = el('fb-project-id')?.value.trim() || '';

  const candidate = {
    apiKey: rawKey,
    databaseURL: rawUrl,
    projectId: rawProj
  };

  // 防呆保護：若使用者不小心把欄位清空或網址格式不完整，自動攔截並還原為系統內建預設參數
  if (!FirebaseManager.isValidFirebaseConfig(candidate)) {
    SafeStorage.remove('agy_fb_config');
    populateFbSetupModal();
    el('modal-fb-setup')?.classList.remove('show');
    showToast('🛡️ 偵測到空白或未完整填寫之欄位，腳本已自動保護並維持系統內建 chien-sheng-auction 預設雲端連線！', 4200);
    return;
  }

  // 若填寫的值與系統內建預設完全相同，無須重複刷新頁面，直接保持連線並提示
  if (
    candidate.apiKey === defCfg.apiKey &&
    candidate.databaseURL === defCfg.databaseURL &&
    candidate.projectId === defCfg.projectId
  ) {
    SafeStorage.remove('agy_fb_config');
    populateFbSetupModal();
    el('modal-fb-setup')?.classList.remove('show');
    showToast('🟢 目前已成功連線至 chien-sheng-auction 雲端即時資料庫（系統內建預設參數生效中）！', 3800);
    return;
  }

  SafeStorage.set('agy_fb_config', candidate);
  el('modal-fb-setup')?.classList.remove('show');
  showToast('💾 Firebase 自訂連線設定已更新，正在重新連線…');
  setTimeout(() => location.reload(), 300);
}

/**
 * 🔄 一鍵恢復系統內建預設連線（清除本機自訂覆蓋並重新載入 chien-sheng-auction 預設參數）
 */
function handleRestoreDefaultFbConfig() {
  if (!requireAdminAuth(() => handleRestoreDefaultFbConfig())) return;

  const hadCustom = !!SafeStorage.get('agy_fb_config');
  SafeStorage.remove('agy_fb_config');
  populateFbSetupModal();

  if (hadCustom) {
    showToast('🔄 已清除自訂覆蓋並恢復系統內建 chien-sheng-auction 預設雲端連線，正在重新載入…', 3500);
    setTimeout(() => location.reload(), 450);
  } else {
    showToast('🟢 已為您重新帶入系統內建 chien-sheng-auction 預設連線參數，目前雲端連線正常運作中！', 3600);
  }
}

function bindEvents() {
  // 1. 貨幣切換
  el('currency-select')?.addEventListener('change', e => {
    AppState.activeCurrency = e.target.value;
    SafeStorage.set('agy_active_currency', e.target.value);
    renderActiveItemDisplay();
    renderItemTabs();
    renderBidHistory();
    renderWinnerStatus();
    showToast(`💱 幣別已切換為：${CURRENCY_RATES[e.target.value].name} (${e.target.value})`);
  });

  // 1-1. 空狀態重新整理頁面綁定
  el('btn-empty-reload')?.addEventListener('click', () => {
    window.location.reload();
  });

  // 2. 圖片輪播箭頭與全螢幕滿版放大預覽
  el('btn-gallery-prev')?.addEventListener('click', (e) => {
    e.stopPropagation();
    switchGalleryImage(AppState.galleryIndex - 1);
  });
  el('btn-gallery-next')?.addEventListener('click', (e) => {
    e.stopPropagation();
    switchGalleryImage(AppState.galleryIndex + 1);
  });
  el('gallery-main-img')?.addEventListener('click', openGalleryLightbox);
  el('btn-gallery-zoom')?.addEventListener('click', (e) => {
    e.stopPropagation();
    openGalleryLightbox();
  });
  el('btn-lightbox-close')?.addEventListener('click', closeGalleryLightbox);
  el('btn-lightbox-prev')?.addEventListener('click', (e) => {
    e.stopPropagation();
    switchGalleryImage(AppState.galleryIndex - 1);
  });
  el('btn-lightbox-next')?.addEventListener('click', (e) => {
    e.stopPropagation();
    switchGalleryImage(AppState.galleryIndex + 1);
  });
  el('modal-gallery-lightbox')?.addEventListener('click', (e) => {
    if (e.target === el('modal-gallery-lightbox') || e.target === el('lightbox-stage')) {
      closeGalleryLightbox();
    }
  });
  document.addEventListener('keydown', (e) => {
    const lb = el('modal-gallery-lightbox');
    if (lb && lb.style.display !== 'none') {
      if (e.key === 'Escape') closeGalleryLightbox();
      if (e.key === 'ArrowLeft') switchGalleryImage(AppState.galleryIndex - 1);
      if (e.key === 'ArrowRight') switchGalleryImage(AppState.galleryIndex + 1);
    }
  });

  // 3. 快速加價按鈕
  el('quick-chips-row')?.querySelectorAll('.quick-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const addTwd = Number(btn.dataset.add || 100);
      const inp = el('inp-bid-val');
      if (inp) {
        inp.value = Number(inp.value || 0) + addTwd;
        if (el('btn-submit-text') && !isSubmittingBid) {
          el('btn-submit-text').textContent = '立即出標';
        }
      }
    });
  });

  // 4. 金額微調按鈕
  el('btn-bid-minus')?.addEventListener('click', () => {
    const item = getActiveItem();
    const inp = el('inp-bid-val');
    if (inp && item) {
      inp.value = Math.max(item.startPrice, Number(inp.value || 0) - item.increment);
      if (el('btn-submit-text') && !isSubmittingBid) {
        el('btn-submit-text').textContent = '立即出標';
      }
    }
  });
  el('btn-bid-plus')?.addEventListener('click', () => {
    const item = getActiveItem();
    const inp = el('inp-bid-val');
    if (inp && item) {
      inp.value = Number(inp.value || 0) + item.increment;
      if (el('btn-submit-text') && !isSubmittingBid) {
        el('btn-submit-text').textContent = '立即出標';
      }
    }
  });

  // 出價輸入框純數字防呆過濾
  const bidInputEl = document.getElementById('inp-bid-val');
  if (bidInputEl) {
    bidInputEl.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^\d]/g, '');
      if (el('btn-submit-text') && !isSubmittingBid) {
        el('btn-submit-text').textContent = '立即出標';
      }
    });
  }

  // 5. 立即出價按鈕
  el('btn-submit-bid')?.addEventListener('click', handleBidSubmit);

  // 6. 出價歷史清單折疊
  el('history-toggle-bar')?.addEventListener('click', () => {
    const list = el('history-list');
    const arrow = el('history-arrow');
    if (list) {
      const isHidden = list.style.display === 'none';
      list.style.display = isHidden ? 'flex' : 'none';
      if (arrow) arrow.textContent = isHidden ? '▼' : '▲';
    }
  });

  // 7. Q&A 提問送出、快速提問引導膠囊、四維度排序過濾切換與快捷鍵綁定
  loadSavedCustomCannedReplies();
  const savedInstantCanned = SafeStorage.get('agy_qa_instant_canned');
  if (typeof savedInstantCanned === 'boolean') {
    AppState.qaInstantCannedSend = savedInstantCanned;
  }

  // 7-1. 自訂罐頭快答詞庫管理彈窗綁定
  el('btn-save-custom-canned')?.addEventListener('click', saveCustomCannedReply);
  el('btn-cancel-edit-custom-canned')?.addEventListener('click', resetCustomCannedForm);
  el('btn-close-canned-modal')?.addEventListener('click', closeCustomCannedModal);
  el('modal-canned-replies')?.addEventListener('click', e => {
    if (e.target === el('modal-canned-replies')) closeCustomCannedModal();
  });

  el('btn-send-question')?.addEventListener('click', submitQuestion);
  el('qa-ask-input')?.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      submitQuestion();
    }
  });

  // 買家快速提問引導膠囊點擊自動填入
  document.querySelectorAll('#qa-buyer-quick-prompts .qa-prompt-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const promptText = chip.dataset.prompt || '';
      const askInp = el('qa-ask-input');
      if (askInp && promptText) {
        askInp.value = promptText;
        askInp.focus();
        showToast('💡 已帶入提問範例，可直接按「💬 送出提問」或自行修改！');
      }
    });
  });

  // 前台問答區 4 維度排序與篩選按鈕列 (最新留言 / 最熱門 / 待回覆專區 / 我的發問)
  document.querySelectorAll('#qa-filter-bar .qa-filter-tab, #qa-wb-filter-bar .qa-filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.qaFilter || 'latest';
      setQAFilterMode(mode);
    });
  });

  // 問答區高度尺寸模式切換（固定捲軸 / 加長框體 / 無限延伸）、放大工作台、一鍵展開/收合全部與底部拖曳把手
  document.querySelectorAll('#qa-view-controls .qa-view-btn[data-qa-size]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sizeMode = btn.dataset.qaSize || 'compact';
      setQAContainerHeightMode(sizeMode, true);
    });
  });
  el('btn-qa-open-workbench')?.addEventListener('click', openQAWorkbench);
  el('btn-close-qa-workbench')?.addEventListener('click', closeQAWorkbench);
  el('modal-qa-workbench')?.addEventListener('click', (e) => {
    if (e.target === el('modal-qa-workbench')) closeQAWorkbench();
  });
  el('btn-qa-toggle-all-groups')?.addEventListener('click', toggleAllQABuyerGroups);
  el('btn-wb-toggle-all-groups')?.addEventListener('click', toggleAllQABuyerGroups);
  initQAHeightPreferences();
  initQAResizeDrag();

  // 後台問答總覽篩選按鈕列 (全部最新 / 待回覆專區 / 最熱門)
  document.querySelectorAll('#admin-qa-filter-bar .qa-admin-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.adminQaFilter || 'all';
      setAdminQAFilterMode(mode);
    });
  });

  // 8. 得標留言板送出
  el('btn-send-winner-msg')?.addEventListener('click', () => {
    const inp = el('winner-msg-input');
    const text = inp ? inp.value.trim() : '';
    if (!text) return;
    if (!AppState.userProfile.name) {
      openBuyerProfileModal();
      return;
    }
    const item = getActiveItem();
    if (!item) return;
    if (!item.winnerMsgs) item.winnerMsgs = [];
    item.winnerMsgs.push({
      sender: AppState.userProfile.name,
      isSeller: AppState.isAdmin,
      text: text,
      time: Date.now()
    });
    inp.value = '';
    renderWinnerMessages(item);
    syncToFirebase();
  });

  // 9. 管理者動作按鈕 (手動提前結標、確認已取貨、刪除品項)
  el('btn-admin-end-early')?.addEventListener('click', handleAdminEndEarly);
  el('btn-mark-picked-up')?.addEventListener('click', handleAdminMarkPickedUp);
  el('btn-admin-delete-item')?.addEventListener('click', () => handleAdminDeleteItem());

  // 9-1. 重新開啟競標快捷面板按鈕 (支援改價重開 + 多種時段)
  document.querySelectorAll('.btn-relist-action').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const currentItem = getActiveItem();
      if (!currentItem) return;
      const mode = btn.dataset.mode || 'reset24';
      const hours = Number(btn.dataset.hours || 24);
      const priceInput = el('winner-relist-price');
      const newPrice = priceInput ? Number(priceInput.value.trim()) : null;
      restartAuctionItem(currentItem.id, mode, hours, newPrice);
    });
  });

  // 9-2. 全站電話撥打與 Line ID 加好友事件委派 (確保得標卡、出價紀錄、問答與名冊按鈕點擊 100% 即時響應)
  document.addEventListener('click', e => {
    const phoneBtn = e.target.closest('a[href^="tel:"]:not([data-bypass-contact-intercept]), .contact-btn.phone, .buyer-phone-link');
    if (phoneBtn) {
      e.preventDefault();
      e.stopPropagation();
      const rawPhone = phoneBtn.dataset.phone
        || (phoneBtn.getAttribute('href') || '').replace(/^tel:/i, '')
        || phoneBtn.textContent.replace(/[^\d+\-]/g, '');
      if (rawPhone) triggerPhoneContact(rawPhone);
      return;
    }

    const lineBtn = e.target.closest('.contact-btn.line, .badge-line, [data-line]:not(.btn-copy-line)');
    if (lineBtn) {
      e.preventDefault();
      e.stopPropagation();
      let rawLine = lineBtn.dataset.line || '';
      if (!rawLine) {
        const href = lineBtn.getAttribute('href') || '';
        const m = href.match(/ti\/p\/~?([^/?#]+)/i);
        if (m) rawLine = decodeURIComponent(m[1]);
      }
      if (!rawLine) {
        rawLine = lineBtn.textContent.replace(/💬/g, '').replace(/Line\s*ID\s*[:：]?/i, '').replace(/Line\s*[:：]?/i, '').trim();
      }
      if (rawLine) triggerLineContact(rawLine);
    }
  });

  // 10. 管理者廣播公告（受最高權限保護）
  el('btn-admin-broadcast')?.addEventListener('click', () => {
    if (!requireAdminAuth(() => sendBroadcast())) return;
    sendBroadcast();
  });

  // 11. 前後台模式切換與最高權限管理者驗證事件綁定
  el('btn-switch-mode')?.addEventListener('click', () => {
    try {
      const pageAdmin = el('page-admin');
      const isCurrentlyOnAdminPage = pageAdmin?.classList.contains('active');

      if (!isCurrentlyOnAdminPage) {
        if (!AppState.isAdmin || !AppState.isAdminAuthenticated) {
          openAdminLoginModal(() => switchToAdminPage());
          return;
        }
        switchToAdminPage();
      } else {
        switchToAuctionPage();
      }
    } catch (err) {
      console.error('前後台切換錯誤:', err);
    }
  });

  // 11-1. 最高權限管理者登入視窗、密碼顯示切換與登出/鎖定後台按鈕綁定
  el('btn-toggle-admin-pwd')?.addEventListener('click', toggleAdminPasswordVisibility);
  el('btn-submit-admin-login')?.addEventListener('click', handleAdminLoginSubmit);
  el('btn-cancel-admin-login')?.addEventListener('click', closeAdminLoginModal);
  el('modal-admin-login')?.addEventListener('click', e => {
    if (e.target === el('modal-admin-login')) closeAdminLoginModal();
  });
  ['inp-admin-account', 'inp-admin-password'].forEach(inpId => {
    el(inpId)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAdminLoginSubmit();
      }
    });
  });
  el('btn-admin-logout')?.addEventListener('click', handleAdminLogout);
  el('btn-nav-admin-logout')?.addEventListener('click', handleAdminLogout);
  el('btn-admin-to-front')?.addEventListener('click', switchToAuctionPage);

  // 12. 買家身分彈窗、官方管理者 ⇄ 多組測試買家分身切換器、自選保留期限與防棄標登出檢驗
  el('btn-user-profile')?.addEventListener('click', openBuyerProfileModal);
  el('btn-cancel-profile')?.addEventListener('click', closeBuyerProfileModal);
  el('btn-save-profile')?.addEventListener('click', saveBuyerProfile);
  el('btn-logout-profile')?.addEventListener('click', handleBuyerLogout);

  // 12-0. 👑 身分與測試分身切換器（買家視窗與右上角 ⋯ 選單雙向同步綁定）
  el('btn-switch-to-seller-identity')?.addEventListener('click', switchToOfficialSellerIdentity);
  el('btn-reset-test-buyer-identity')?.addEventListener('click', resetTestBuyerAndLoginNew);
  el('btn-restore-backup-buyer')?.addEventListener('click', restoreBackupTestBuyer);
  el('btn-qa-quick-to-buyer')?.addEventListener('click', () => {
    openBuyerProfileModal();
  });

  // 彈窗內一鍵切換測試買家 A（小建）/ B（阿明）/ C（大華）
  el('btn-quick-persona-a')?.addEventListener('click', () => quickSwitchPresetPersona('a'));
  el('btn-quick-persona-b')?.addEventListener('click', () => quickSwitchPresetPersona('b'));
  el('btn-quick-persona-c')?.addEventListener('click', () => quickSwitchPresetPersona('c'));

  // 右上角「⋯ 更多選單」內之身分與測試分身一鍵切換綁定
  el('btn-nav-role-seller')?.addEventListener('click', (e) => {
    e.stopPropagation();
    switchToOfficialSellerIdentity();
  });
  el('btn-nav-gen-buyer-a')?.addEventListener('click', (e) => {
    e.stopPropagation();
    quickSwitchPresetPersona('a');
  });
  el('btn-nav-gen-buyer-b')?.addEventListener('click', (e) => {
    e.stopPropagation();
    quickSwitchPresetPersona('b');
  });
  el('btn-nav-gen-buyer-c')?.addEventListener('click', (e) => {
    e.stopPropagation();
    quickSwitchPresetPersona('c');
  });
  el('btn-nav-manage-personas')?.addEventListener('click', (e) => {
    e.stopPropagation();
    el('nav-more-dropdown')?.classList.remove('show');
    openBuyerProfileModal();
    resetTestBuyerAndLoginNew();
  });

  // 未登入管理員時，從買家視窗或 ⋯ 選單一鍵開啟管理員驗證解鎖分身切換器
  el('btn-unlock-admin-from-buyer')?.addEventListener('click', () => {
    closeBuyerProfileModal();
    openAdminLoginModal(() => {
      syncAdminUIState();
      openBuyerProfileModal();
      showToast('👑 已驗證最高管理者身分！已為您解鎖「官方管理者 ⇄ 多組測試買家分身切換器」與免防棄標鎖定特權！', 4200);
    });
  });
  el('btn-nav-unlock-admin-switcher')?.addEventListener('click', () => {
    el('nav-more-dropdown')?.classList.remove('show');
    openAdminLoginModal(() => {
      syncAdminUIState();
      openBuyerProfileModal();
      showToast('👑 已驗證最高管理者身分！已為您解鎖「官方管理者 ⇄ 多組測試買家分身切換器」！', 4200);
    });
  });

  // 🧹 一鍵清除測試出價與測試問答並重置起標價按鈕綁定（後台頂部、後台商品管理區、前台管理列、⋯ 更多選單、買家彈窗）
  el('btn-admin-clear-test-data')?.addEventListener('click', () => handleAdminClearTestData(null));
  el('btn-admin-sec-clear-test')?.addEventListener('click', () => handleAdminClearTestData(null));
  el('btn-front-clear-test-data')?.addEventListener('click', () => handleAdminClearTestData(AppState.activeItemId));
  el('btn-nav-clear-test-data')?.addEventListener('click', () => handleAdminClearTestData(null));
  el('btn-modal-clear-test-data')?.addEventListener('click', () => {
    closeBuyerProfileModal();
    handleAdminClearTestData(null);
  });

  // 點選 7 / 10 / 15 天 或 ∞ 永久保留 即時更新預計到期時間
  document.querySelectorAll('input[name="buyer-retention-days"]').forEach(rad => {
    rad.addEventListener('change', e => {
      const val = e.target.value;
      updateBuyerRetentionUI(isPermanentRetention(val) ? 'forever' : Number(val), null);
    });
  });
  ['7', '10', '15', 'forever'].forEach(d => {
    el(`ret-card-${d}`)?.addEventListener('click', () => {
      updateBuyerRetentionUI(d === 'forever' ? 'forever' : Number(d), null);
    });
  });

  // 買家輸入手機號碼時，即時比對雲端保留名冊並檢查是否處於防棄標鎖定
  el('inp-buyer-phone')?.addEventListener('input', e => {
    lookupCloudBuyerByPhone(e.target.value);
  });
  el('inp-buyer-phone')?.addEventListener('click', () => {
    const isSuperAdmin = Boolean(AppState.isAdmin && AppState.isAdminAuthenticated);
    const lockInfo = checkBuyerHighBidderLock(AppState.userProfile.phone, AppState.userProfile.name);
    if (lockInfo.locked && !isSuperAdmin) {
      showToast(`🔒 防棄標保護生效中：您目前是【${lockInfo.itemName}】最高出價領先者，無法更改聯絡電話！`);
    }
  });

  // 12-1. 後台得標取貨保留期限模式切換（依保留小時/天數 vs 指定星期幾）
  el('edit-pickup-deadline-mode')?.addEventListener('change', e => {
    const isWeekday = (e.target.value === 'weekday');
    if (el('pickup-deadline-hours-box')) el('pickup-deadline-hours-box').style.display = isWeekday ? 'none' : 'block';
    if (el('pickup-deadline-weekday-box')) el('pickup-deadline-weekday-box').style.display = isWeekday ? 'block' : 'none';
  });

  // 12-2. 後台「棄標處理 ＆ 第 2、第 3 順位遞補優惠調整價」與買家意願確認卡事件綁定
  el('btn-mark-winner-default')?.addEventListener('click', handleMarkWinnerDefaultAndBlacklist);

  // 當管理員修改「💰 遞補優惠調整價」或受邀買家資訊時，即時連動更新邀請話術內之價格
  ['inp-backup-offer-price', 'inp-backup-orig-bid', 'inp-backup-target-name', 'inp-backup-target-rank'].forEach(idStr => {
    el(idStr)?.addEventListener('input', () => {
      syncBackupSellerMsgWithOfferPrice(false);
    });
  });

  // 遞補優惠價快捷微調按鈕
  el('btn-offer-price-reset')?.addEventListener('click', () => {
    const orig = Number(el('inp-backup-orig-bid')?.value || 10000);
    if (el('inp-backup-offer-price')) el('inp-backup-offer-price').value = orig;
    syncBackupSellerMsgWithOfferPrice(false);
    showToast(`🔄 遞補優惠價已恢復為買家原出價：NT$ ${orig.toLocaleString()}`);
  });
  el('btn-offer-price-trim')?.addEventListener('click', () => {
    const cur = Number(el('inp-backup-offer-price')?.value || el('inp-backup-orig-bid')?.value || 10000);
    const trimmed = cur >= 1000 ? Math.floor(cur / 100) * 100 : Math.floor(cur / 10) * 10;
    if (el('inp-backup-offer-price')) el('inp-backup-offer-price').value = Math.max(1, trimmed);
    syncBackupSellerMsgWithOfferPrice(false);
    showToast(`✂️ 已去尾數調整遞補優惠價為：NT$ ${Math.max(1, trimmed).toLocaleString()}`);
  });
  el('btn-offer-price-minus100')?.addEventListener('click', () => {
    const cur = Number(el('inp-backup-offer-price')?.value || el('inp-backup-orig-bid')?.value || 10000);
    const nextVal = Math.max(1, cur - 100);
    if (el('inp-backup-offer-price')) el('inp-backup-offer-price').value = nextVal;
    syncBackupSellerMsgWithOfferPrice(false);
    showToast(`➖ 遞補優惠價已折減 100 元：NT$ ${nextVal.toLocaleString()}`);
  });
  el('btn-offer-price-minus500')?.addEventListener('click', () => {
    const cur = Number(el('inp-backup-offer-price')?.value || el('inp-backup-orig-bid')?.value || 10000);
    const nextVal = Math.max(1, cur - 500);
    if (el('inp-backup-offer-price')) el('inp-backup-offer-price').value = nextVal;
    syncBackupSellerMsgWithOfferPrice(false);
    showToast(`➖ 遞補優惠價已折減 500 元：NT$ ${nextVal.toLocaleString()}`);
  });

  // 賣家遞補邀請話術快捷範本切換
  document.querySelectorAll('.btn-backup-msg-tpl').forEach(btn => {
    btn.addEventListener('click', () => {
      AppState.activeBackupTemplate = btn.dataset.tpl || 'discount';
      syncBackupSellerMsgWithOfferPrice(true);
      showToast('💌 已套用遞補邀請話術範本並自動帶入最新「遞補優惠價」！');
    });
  });

  // 複製邀請文案與專屬連結
  el('btn-copy-backup-invite')?.addEventListener('click', handleCopyAndSendBackupInvite);

  // 買家端確認同意或婉拒遞補優惠價購買
  el('btn-accept-backup-offer')?.addEventListener('click', () => handleBuyerRespondBackupOffer(true));
  el('btn-decline-backup-offer')?.addEventListener('click', () => handleBuyerRespondBackupOffer(false));

  // 13. 出價超越彈窗關閉並跳回出價
  el('btn-outbid-rebid')?.addEventListener('click', () => {
    el('modal-outbid-alert')?.classList.remove('show');
    const item = getActiveItem();
    const inp = el('inp-bid-val');
    if (inp && item) {
      inp.value = item.currentBid + item.increment;
      inp.focus();
    }
  });

  // 14. 後台編輯商品儲存與新增
  el('btn-save-current-item')?.addEventListener('click', saveCurrentItemEdits);
  el('btn-add-new-item')?.addEventListener('click', addNewItem);

  // 15. 全面發布拍賣 (統一發布至主節點 auctions/item-local-recovered 與鏡像節點 - 最高權限專屬)
  el('btn-publish-all')?.addEventListener('click', () => {
    if (!requireAdminAuth()) return;
    const db = FirebaseManager.getDb();
    if (!db) {
      showToast('請先連線 Firebase 雲端資料庫！');
      el('modal-fb-setup')?.classList.add('show');
      return;
    }

    AppState.auctionId = UNIFIED_AUCTION_ID;
    SafeStorage.set('agy_last_auction_id', UNIFIED_AUCTION_ID);

    const payload = {
      studioName: AppState.studioName,
      baseCurrency: AppState.baseCurrency,
      items: AppState.items,
      broadcasts: AppState.broadcasts,
      lastUpdated: getServerNow()
    };

    db.ref('auctions/' + UNIFIED_AUCTION_ID).update(payload).then(() => {
      // 鏡像更新至 auction/items
      (AppState.items || []).forEach(it => {
        if (it && it.id) {
          db.ref(`auction/items/${it.id}`).update(it).catch(() => {});
        }
      });
      showToast('🚀 拍賣已全面正式發布並同步至統一雲端節點！');
      updateShareUrl();
      el('btn-switch-mode')?.click();
    }).catch(err => {
      showToast('⚠️ 發布至雲端失敗：' + err.message);
    });
  });

  // 16. 強制清除快取按鈕 (徹底杜絕舊版快取卡死問題)
  el('btn-force-refresh')?.addEventListener('click', async () => {
    showToast('🔄 正在清除全體快取並重新載入最新版本…');
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      } catch (e) {}
    }
    if ('serviceWorker' in navigator) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      } catch (e) {}
    }
    setTimeout(() => {
      window.location.reload(true);
    }, 350);
  });

  // 17. PWA 安裝按鈕
  el('btn-pwa-install')?.addEventListener('click', handlePwaInstall);

  // 17. 複製分享連結 (同時支援導覽列更多選單與分享區塊，智慧單品/賣場雙模式)
  const handleCopyShare = () => {
    const item = getActiveItem();
    const isSingle = el('share-mode-single') ? el('share-mode-single').checked : true;
    const mode = isSingle ? 'single' : 'all';
    const url = getItemShareUrl(item, mode);
    navigator.clipboard.writeText(url).then(() => {
      showToast(mode === 'single' ? '📋 單品專屬競標連結已成功複製到剪貼簿！' : '📋 賣場總覽分享連結已成功複製到剪貼簿！');
      el('nav-more-dropdown')?.classList.remove('show');
    }).catch(() => {
      const inp = el('share-url-input');
      if (inp) {
        inp.select();
        document.execCommand('copy');
        showToast('📋 分享連結已複製！');
      }
    });
  };
  el('btn-copy-share')?.addEventListener('click', handleCopyShare);
  el('btn-nav-copy-share')?.addEventListener('click', handleCopyShare);

  // 下載此商品專屬帶品名 QR 圖卡
  el('btn-download-qr-card')?.addEventListener('click', () => {
    downloadItemQrCard(getActiveItem());
  });

  // 分享模式切換 (單品專屬 / 賣場總覽)
  document.querySelectorAll('input[name="share-link-mode"]').forEach(radio => {
    radio.addEventListener('change', () => {
      updateShareUrl();
    });
  });

  // 後台：一鍵複製全部商品獨立網址清單
  el('btn-copy-all-urls')?.addEventListener('click', copyAllItemsUrls);

  // 18. Firebase 雲端資料庫設定彈窗 (僅限最高權限管理者檢視與操作，自動帶入內建預設參數與防空白覆蓋保護)
  const handleOpenFbConfig = () => {
    el('nav-more-dropdown')?.classList.remove('show');
    if (!requireAdminAuth(() => openFbSetupModal())) return;
    openFbSetupModal();
  };
  el('btn-fb-config')?.addEventListener('click', handleOpenFbConfig);
  el('btn-nav-fb-config')?.addEventListener('click', handleOpenFbConfig);
  el('btn-fb-close')?.addEventListener('click', () => el('modal-fb-setup')?.classList.remove('show'));
  el('btn-fb-save')?.addEventListener('click', handleSaveFbConfig);
  el('btn-fb-restore-default')?.addEventListener('click', handleRestoreDefaultFbConfig);
  el('modal-fb-setup')?.addEventListener('click', e => {
    if (e.target === el('modal-fb-setup')) el('modal-fb-setup')?.classList.remove('show');
  });
  const fbModalEl = el('modal-fb-setup');
  if (fbModalEl && typeof MutationObserver !== 'undefined') {
    const obs = new MutationObserver(() => {
      if (fbModalEl.classList.contains('show')) {
        populateFbSetupModal();
      }
    });
    obs.observe(fbModalEl, { attributes: true, attributeFilter: ['class'] });
  }

  // 18-1. 📱 手機觀看模式 / 💻 電腦觀看模式 直覺雙按鈕與單鍵切換綁定
  el('btn-view-desktop')?.addEventListener('click', () => {
    applyViewMode('desktop', true);
    showToast('💻 已切換為「電腦觀看模式」（1380px 黃金雙欄儀表板）');
  });
  el('btn-view-mobile')?.addEventListener('click', () => {
    applyViewMode('mobile', true);
    showToast('📱 已切換為「手機觀看模式」（精緻直式視窗預覽）');
  });
  el('btn-toggle-view-mode')?.addEventListener('click', () => {
    toggleViewMode();
  });
  el('btn-dropdown-view-mode')?.addEventListener('click', () => {
    el('nav-more-dropdown')?.classList.remove('show');
    toggleViewMode();
  });
  el('btn-admin-view-mode')?.addEventListener('click', () => {
    toggleViewMode();
  });
  el('btn-sim-to-desktop')?.addEventListener('click', () => {
    applyViewMode('desktop', true);
    showToast('💻 已切換為「電腦觀看模式」（寬螢幕左右雙欄介面）');
  });
  window.addEventListener('resize', () => {
    const simBanner = el('mobile-sim-banner');
    if (simBanner) {
      simBanner.style.display = (AppState.viewMode === 'mobile' && window.innerWidth >= 600) ? 'flex' : 'none';
    }
  });

  // 19. 頂部導覽列更多功能選單 (⋯ 下拉開關與外部點擊關閉)
  const btnNavMore = el('btn-nav-more');
  const navMoreDropdown = el('nav-more-dropdown');
  if (btnNavMore && navMoreDropdown) {
    btnNavMore.addEventListener('click', e => {
      e.stopPropagation();
      navMoreDropdown.classList.toggle('show');
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('#nav-more-wrap')) {
        navMoreDropdown.classList.remove('show');
      }
    });
  }

  // 20. 後台商品編輯面板折疊/展開按鈕
  el('btn-toggle-edit-fold')?.addEventListener('click', () => {
    const editSec = el('admin-item-edit-section');
    const toggleBtn = el('btn-toggle-edit-fold');
    if (!editSec) return;
    const isFolded = editSec.classList.toggle('folded');
    if (toggleBtn) {
      toggleBtn.textContent = isFolded ? '展開 ▼' : '收合 ▲';
    }
  });

  // 21. 後台起標價與加價步進微調 (+/-) 與快捷預設值
  const spInp = el('edit-item-start-price');
  el('btn-admin-sp-minus')?.addEventListener('click', () => {
    if (!spInp) return;
    const cur = Number(spInp.value) || 0;
    spInp.value = Math.max(0, cur - 50);
  });
  el('btn-admin-sp-plus')?.addEventListener('click', () => {
    if (!spInp) return;
    const cur = Number(spInp.value) || 0;
    spInp.value = cur + 50;
  });

  const incInp = el('edit-item-increment');
  el('btn-admin-inc-minus')?.addEventListener('click', () => {
    if (!incInp) return;
    const cur = Number(incInp.value) || 10;
    incInp.value = Math.max(1, cur - 10);
  });
  el('btn-admin-inc-plus')?.addEventListener('click', () => {
    if (!incInp) return;
    const cur = Number(incInp.value) || 0;
    incInp.value = cur + 10;
  });

  // 快捷加價預設值 (+10, +50, +100, +150, +200)
  el('admin-inc-quick-chips')?.querySelectorAll('.admin-inc-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = Number(btn.dataset.inc || 10);
      if (incInp) {
        incInp.value = val;
        showToast(`⚡ 每口加價單位已快速填入：${val}`);
      }
    });
  });

  // 22. 競標時間模式（二選一）切換事件
  const radFixed = el('mode-radio-fixed');
  const radReset24 = el('mode-radio-reset24');
  const cardFixed = el('card-mode-fixed');
  const cardReset24 = el('card-mode-reset24');
  const panelFixed = el('panel-mode-fixed');
  const panelReset24 = el('panel-mode-reset24');

  function updateTimeModeUI(mode) {
    const isReset = (mode === 'reset24');
    if (radReset24) radReset24.checked = isReset;
    if (radFixed) radFixed.checked = !isReset;
    if (cardReset24) cardReset24.classList.toggle('selected', isReset);
    if (cardFixed) cardFixed.classList.toggle('selected', !isReset);
    if (panelReset24) panelReset24.classList.toggle('active', isReset);
    if (panelFixed) panelFixed.classList.toggle('active', !isReset);
  }

  cardFixed?.addEventListener('click', () => updateTimeModeUI('fixed'));
  cardReset24?.addEventListener('click', () => updateTimeModeUI('reset24'));
  radFixed?.addEventListener('change', () => updateTimeModeUI('fixed'));
  radReset24?.addEventListener('change', () => updateTimeModeUI('reset24'));

  el('edit-antisnipe-enable')?.addEventListener('change', e => {
    const row = el('antisnipe-inputs-row');
    if (row) {
      row.style.opacity = e.target.checked ? '1' : '0.4';
      row.style.pointerEvents = e.target.checked ? 'auto' : 'none';
    }
  });

  // 24. 賣家/店鋪設定（名稱與全域 Logo 名片）
  const cfgStudioName = el('cfg-studio-name');
  if (cfgStudioName) {
    // 即時打字響應頂端標題、分頁 Title 與後台標題
    cfgStudioName.addEventListener('input', e => {
      updateStudioName(e.target.value, false);
    });
    // 輸入框失焦或按 Enter 儲存並同步至 Firebase
    cfgStudioName.addEventListener('change', e => {
      const val = e.target.value.trim();
      if (val) {
        updateStudioName(val, true);
        showToast(`💾 店鋪名稱已成功更新為【${val}】，並同步至雲端！`);
      }
    });
  }

  el('btn-save-studio-name')?.addEventListener('click', () => {
    if (!requireAdminAuth()) return;
    const val = el('cfg-studio-name')?.value.trim();
    if (val) {
      updateStudioName(val, true);
      showToast(`💾 店鋪名稱已成功更新為【${val}】，並同步至雲端！`);
    }
  });

  // 後台商品基本資料內之「💾 儲存店名」快捷按鈕連動全站店名與當前商品
  el('btn-save-seller-name-quick')?.addEventListener('click', () => {
    if (!requireAdminAuth()) return;
    const val = el('edit-item-seller-name')?.value.trim();
    if (!val) {
      showToast('請輸入賣家 / 店家名稱！');
      return;
    }
    const item = AppState.items.find(i => i.id === AppState.editingItemId) || getActiveItem();
    if (item) item.sellerName = val;
    updateStudioName(val, true);
    renderActiveItemDisplay();
    syncToFirebase();
    syncToLocalServer();
    showToast(`💾 賣家/店鋪名稱已更新為【${val}】並同步至全站！`);
  });

  // 全域賣家 Logo / 名片貼圖上傳與網址
  el('btn-upload-shop-logo')?.addEventListener('click', () => {
    el('input-shop-logo-file')?.click();
  });

  el('input-shop-logo-file')?.addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target.result;
      updateStudioLogo(dataUrl, true);
      showToast('📷 賣家 Logo / 名片貼圖已成功更新並同步至全站！');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });

  el('cfg-studio-logo')?.addEventListener('input', e => {
    const url = e.target.value.trim() || 'icon-192.png';
    if (el('shop-logo-preview-img')) el('shop-logo-preview-img').src = url;
  });

  el('cfg-studio-logo')?.addEventListener('change', e => {
    const url = e.target.value.trim() || 'icon-192.png';
    updateStudioLogo(url, true);
    showToast('💾 賣家 Logo / 名片貼圖已更新並同步至全站！');
  });

  // 儲存賣家店鋪設定 (全域設定一鍵儲存)
  el('btn-save-shop-settings')?.addEventListener('click', () => {
    const sName = el('cfg-studio-name')?.value.trim() || '建生工坊';
    const sLogo = el('cfg-studio-logo')?.value.trim() || 'icon-192.png';
    const baseCur = el('cfg-base-currency')?.value || 'TWD';
    const pickupH = Number(el('cfg-pickup-hours')?.value) || 48;

    updateStudioName(sName, true);
    updateStudioLogo(sLogo, true);
    AppState.baseCurrency = baseCur;
    SafeStorage.set('agy_base_currency', baseCur);
    SafeStorage.set('agy_pickup_hours', pickupH);

    const db = FirebaseManager.getDb();
    if (db) {
      db.ref('settings/shop').update({
        studioName: sName,
        studioLogo: sLogo,
        baseCurrency: baseCur,
        pickupHours: pickupH,
        updatedAt: Date.now()
      }).catch(() => {});
    }
    showToast('💾 賣家 / 店鋪設定已全面儲存並同步至全站！');
  });

  // 25. 賣家/店家 Logo 上傳與網址即時預覽（商品專屬自訂）
  el('btn-upload-seller-logo')?.addEventListener('click', () => {
    el('input-seller-logo-file')?.click();
  });

  el('input-seller-logo-file')?.addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target.result;
      if (el('edit-item-seller-logo')) el('edit-item-seller-logo').value = dataUrl;
      if (el('seller-logo-preview-img')) el('seller-logo-preview-img').src = dataUrl;
      showToast('📷 店家 Logo 已載入，請儲存商品以生效！');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });

  el('edit-item-seller-logo')?.addEventListener('input', e => {
    const url = e.target.value.trim() || 'icon-192.png';
    if (el('seller-logo-preview-img')) el('seller-logo-preview-img').src = url;
  });

  // 23. 圖片拖曳上傳功能綁定 (核心功能 2)
  setupImageDropzone();
}

// GitHub Pages 官方正式全球公開網址
const GITHUB_PAGES_BASE_URL = 'https://guesschen1981-cmd.github.io/chien-sheng-auction';

/**
 * 取得適用於手機掃描與對外分享的永久公開基準 URL
 * 優先使用 GitHub Pages 正式全球網址，確保 QR Code 印出或發送後全世界手機隨掃即連！
 */
function getBaseUrl() {
  // 1. 若有自訂獨立網域，優先採用
  const customPublicUrl = SafeStorage.get('agy_public_url');
  if (customPublicUrl && customPublicUrl.startsWith('http')) {
    return customPublicUrl.replace(/\/+$/, '');
  }

  // 2. 官方正式全球 GitHub Pages 網址（即使在本機 localhost:8080 運作，分享與 QR 碼也一律優先產生此全球正式網址）
  if (GITHUB_PAGES_BASE_URL) {
    return GITHUB_PAGES_BASE_URL.replace(/\/+$/, '');
  }

  // 3. 若當前直接在線上伺服器瀏覽
  if (location.protocol.startsWith('http') && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    return `${location.protocol}//${location.host}${location.pathname.substring(0, location.pathname.lastIndexOf('/'))}`;
  }

  // 4. 本機備用 LAN IP (保證本機測試時手機掃碼可連)
  if (serverLanUrl) {
    return serverLanUrl.replace(/\/+$/, '');
  }

  return location.origin || 'http://192.168.1.110:8080';
}

/**
 * 取得指定商品專屬分享網址
 * @param {Object} item 拍賣品項
 * @param {'single'|'all'} mode 分享模式 ('single' = 單品鎖定, 'all' = 賣場總覽)
 */
function getItemShareUrl(item, mode = null) {
  if (!item) item = getActiveItem();
  if (!item) return `${getBaseUrl()}/index.html`;

  if (!mode) {
    const singleRadio = el('share-mode-single');
    mode = (singleRadio && singleRadio.checked) ? 'single' : 'all';
  }

  const base = getBaseUrl();
  const url = new URL(`${base}/index.html`);
  url.searchParams.set('id', item.id);
  if (mode === 'single') {
    url.searchParams.set('mode', 'single');
  }
  return url.toString();
}

/**
 * 更新分享卡片與 QR Code
 */
function updateShareUrl() {
  const item = getActiveItem();
  if (!item) return;

  const isSingle = el('share-mode-single') ? el('share-mode-single').checked : true;
  const mode = isSingle ? 'single' : 'all';
  const url = getItemShareUrl(item, mode);

  if (el('share-url-input')) {
    el('share-url-input').value = url;
    el('share-url-input').setAttribute('value', url);
  }

  const badge = el('share-item-badge');
  if (badge) {
    badge.textContent = mode === 'single' ? '🎯 專屬單品獨立連結' : '🏬 全商品賣場總覽連結';
  }

  const qrBox = el('qr-container');
  if (qrBox && typeof QRCode !== 'undefined') {
    qrBox.innerHTML = '';
    new QRCode(qrBox, {
      text: url,
      width: 130,
      height: 130,
      colorDark: '#09091e',
      colorLight: '#ffffff',
      correctLevel: (QRCode.CorrectLevel && QRCode.CorrectLevel.M) ? QRCode.CorrectLevel.M : 0
    });
  }
}

/**
 * 使用 QRCode.js 在記憶體中產生 QR Code Image 物件
 */
function generateQrCodeImage(text, size = 320) {
  return new Promise((resolve, reject) => {
    try {
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      document.body.appendChild(container);

      new QRCode(container, {
        text: text,
        width: size,
        height: size,
        colorDark: '#0a0a1e',
        colorLight: '#ffffff',
        correctLevel: (typeof QRCode !== 'undefined' && QRCode.CorrectLevel && QRCode.CorrectLevel.H !== undefined) ? QRCode.CorrectLevel.H : 2
      });

      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        const cvs = container.querySelector('canvas');
        const img = container.querySelector('img');

        if (cvs && cvs.width > 0) {
          clearInterval(checkInterval);
          const resImg = new Image();
          resImg.onload = () => {
            document.body.removeChild(container);
            resolve(resImg);
          };
          resImg.onerror = (e) => {
            document.body.removeChild(container);
            reject(e);
          };
          resImg.src = cvs.toDataURL('image/png');
          return;
        }

        if (img && img.src && img.src.startsWith('data:image')) {
          clearInterval(checkInterval);
          const resImg = new Image();
          resImg.onload = () => {
            document.body.removeChild(container);
            resolve(resImg);
          };
          resImg.onerror = (e) => {
            document.body.removeChild(container);
            reject(e);
          };
          resImg.src = img.src;
          return;
        }

        if (attempts > 30) {
          clearInterval(checkInterval);
          document.body.removeChild(container);
          reject(new Error('QR Code 產生逾時'));
        }
      }, 100);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * 下載帶有完整品名標籤、價格與掃描提示的專屬 QR Code 圖卡
 */
async function downloadItemQrCard(item) {
  if (!item) item = getActiveItem();
  if (!item) {
    showToast('⚠️ 未找到商品資料，無法生成 QR 圖卡');
    return;
  }

  showToast('🎨 正在生成帶品名專屬 QR 圖卡...');
  try {
    const singleUrl = getItemShareUrl(item, 'single');
    const qrImage = await generateQrCodeImage(singleUrl, 320);

    const canvas = document.createElement('canvas');
    const width = 600;
    const height = 840;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 1. 背景深色尊榮漸層
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0e0e26');
    bgGrad.addColorStop(0.5, '#121232');
    bgGrad.addColorStop(1, '#070714');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. 金色微光外框
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(22, 22, width - 44, height - 44);

    // 3. 上方拍賣名稱
    const studio = AppState.studioName || '建生工坊';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 24px "Noto Sans TC", sans-serif';
    ctx.fillText(`🔨  ${studio}  🔨`, width / 2, 65);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '14px "Noto Sans TC", sans-serif';
    ctx.fillText('掃描條碼・即刻鎖定本品項競價', width / 2, 95);

    // 4. 中間 QR Code 白底卡片 (360x360)
    const qrBoxSize = 360;
    const qrBoxX = (width - qrBoxSize) / 2;
    const qrBoxY = 118;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = '#ffffff';
    drawRoundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 20);
    ctx.fill();
    ctx.restore();

    // 繪製 QR Code (留 20px 內縮白邊)
    ctx.drawImage(qrImage, qrBoxX + 20, qrBoxY + 20, qrBoxSize - 40, qrBoxSize - 40);

    // 5. 下方品名 (自動折行，大字醒目)
    const textStartY = 524;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 21px "Noto Sans TC", sans-serif';
    const maxTextWidth = 520;
    const lines = wrapCanvasText(ctx, item.name, maxTextWidth, 2);
    let curY = textStartY;
    lines.forEach(line => {
      ctx.fillText(line, width / 2, curY);
      curY += 32;
    });

    // 6. 價格與狀態標籤膠囊 (Pill badge)
    const isEnded = item.status === 'ended' || item.status === 'picked_up';
    const curBid = (item.bids && item.bids.length) ? item.currentBid : item.startPrice;
    const priceText = `${(item.bids && item.bids.length) ? '目前最高價' : '起標價'}：NT$ ${curBid.toLocaleString()} ｜ ${isEnded ? '已結標' : '🔥 競標倒數中'}`;

    const pillY = Math.max(curY + 10, 600);
    const pillWidth = 480;
    const pillHeight = 44;
    const pillX = (width - pillWidth) / 2;

    ctx.fillStyle = 'rgba(212, 175, 55, 0.16)';
    drawRoundRect(ctx, pillX, pillY, pillWidth, pillHeight, 22);
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 18px "Noto Sans TC", sans-serif';
    ctx.fillText(priceText, width / 2, pillY + 28);

    // 7. 底部掃碼提示與網址標示
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '14px "Noto Sans TC", sans-serif';
    ctx.fillText('📱 請使用手機相機或 LINE 內建掃描器掃描參與競標', width / 2, 695);

    ctx.fillStyle = 'rgba(212, 175, 55, 0.75)';
    ctx.font = '12px monospace';
    const displayUrl = singleUrl.length > 55 ? singleUrl.substring(0, 52) + '...' : singleUrl;
    ctx.fillText(displayUrl, width / 2, 725);

    // 8. 觸發自動下載
    const cleanName = (item.name || '拍賣商品').replace(/[\\/:*?"<>|]/g, '_');
    const fileName = `QR_${cleanName}.png`;

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`✅ 已成功下載【${item.name.substring(0, 15)}...】專屬 QR 圖卡！`);
  } catch (err) {
    console.error('Download QR card failed:', err);
    showToast('❌ 生成 QR 圖卡失敗，請稍後再試');
  }
}

/** 輔助繪製圓角矩形 */
function drawRoundRect(ctx, x, y, width, height, radius) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/** 輔助 Canvas 文字折行 */
function wrapCanvasText(ctx, text, maxWidth, maxLines = 2) {
  const characters = Array.from(text || '');
  const lines = [];
  let currentLine = '';

  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;
      if (lines.length === maxLines - 1) {
        let remaining = characters.slice(i).join('');
        while (ctx.measureText(remaining + '...').width > maxWidth && remaining.length > 0) {
          remaining = remaining.slice(0, -1);
        }
        lines.push(remaining + '...');
        return lines;
      }
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine.length > 0 && lines.length < maxLines) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * 後台：一鍵複製全部商品獨立網址清單
 */
function copyAllItemsUrls() {
  if (!AppState.items || AppState.items.length === 0) {
    showToast('⚠️ 目前拍賣清單中無任何商品！');
    return;
  }

  const studio = AppState.studioName || '建生工坊';
  const lines = [
    `✨【${studio}】精選拍賣商品清單 ✨`,
    `📅 競標進行中，點擊專屬連結立即參與出標！\n`
  ];

  AppState.items.forEach((item, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    const isEnded = item.status === 'ended' || item.status === 'picked_up';
    const statusTag = isEnded ? '【已結標】' : '【競標中】';
    const curBid = (item.bids && item.bids.length) ? item.currentBid : item.startPrice;
    const priceLabel = (item.bids && item.bids.length) ? '最高出價' : '起標價';
    const url = getItemShareUrl(item, 'single');

    lines.push(`${num}. 【${item.name}】${statusTag}`);
    lines.push(`💰 ${priceLabel}：NT$ ${curBid.toLocaleString()}`);
    lines.push(`🔗 專屬競標網址：${url}\n`);
  });

  lines.push(`🏪 實體自取地點：請參考各商品得標說明頁`);
  lines.push(`✦ 歡迎點擊上方專屬網址參與競標 ✦`);

  const fullText = lines.join('\n');
  navigator.clipboard.writeText(fullText).then(() => {
    showToast(`📋 已成功複製全部 ${AppState.items.length} 件商品專屬網址清單！`);
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = fullText;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast(`📋 已成功複製全部 ${AppState.items.length} 件商品專屬網址清單！`);
  });
}

/**
 * 套用單品獨立模式 UI 視覺呈現
 * @param {boolean} isSingle 是否鎖定為單品模式
 */
function applySingleModeUI(isSingle) {
  const tabsSec = el('item-tabs-section');
  const banner = el('single-mode-banner');

  if (isSingle && !AppState.isTabsManuallyExpanded) {
    if (tabsSec) tabsSec.style.display = 'none';
    if (banner) {
      const totalCount = (AppState.items && AppState.items.length) ? AppState.items.length : 1;
      const studio = AppState.studioName || '建生工坊';
      banner.style.display = 'flex';
      banner.innerHTML = `
        <button type="button" class="single-mode-pill" id="btn-expand-all-tabs">
          <span>🏬 查看賣場其他拍賣品（共 ${totalCount} 件）</span>
          <span style="font-size:1.1rem;line-height:1;margin-left:8px;">›</span>
        </button>
      `;
      const expandBtn = el('btn-expand-all-tabs');
      if (expandBtn) {
        expandBtn.addEventListener('click', () => {
          showAllItemsTabs();
        });
      }
    }
  } else {
    if (tabsSec && AppState.items && AppState.items.length > 0) {
      tabsSec.style.display = 'block';
    }
    if (banner) banner.style.display = 'none';
  }
}

/**
 * 展開全部商品切換列
 */
function showAllItemsTabs() {
  AppState.isTabsManuallyExpanded = true;
  const tabsSec = el('item-tabs-section');
  const banner = el('single-mode-banner');
  if (tabsSec) {
    tabsSec.style.display = 'block';
    tabsSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (banner) {
    banner.style.display = 'none';
  }
  showToast('🏬 已展開全賣場商品切換選單');
}

/**
 * 根據網址參數 (?id=xxx&mode=single) 解析路由與鎖定商品
 */
function applyUrlRouteParams() {
  if (!AppState.items || AppState.items.length === 0) return;

  const params = new URLSearchParams(window.location.search);
  const targetId = params.get('id');
  const mode = params.get('mode');

  if (targetId) {
    const matched = AppState.items.find(it => it.id === targetId);
    if (matched) {
      AppState.activeItemId = matched.id;
      AppState.editingItemId = matched.id;
    }
  }

  const currentItem = getActiveItem();
  if (currentItem) {
    const isEnded = currentItem.status === 'ended' || currentItem.status === 'picked_up';
    const studio = AppState.studioName || '建生工坊';
    const statusPrefix = isEnded ? '【已結標】' : '【競標中】';
    document.title = `${statusPrefix} ${currentItem.name}｜${studio}`;
    const pageTitle = el('page-title');
    if (pageTitle) pageTitle.textContent = document.title;
  }

  if (mode === 'single') {
    applySingleModeUI(true);
  } else {
    applySingleModeUI(false);
  }
}

/* ─────────────────────────────────────────────────────────────
   18. 智慧同步與本機資料搬移橋接模組 (Local Server & file:// Bridge)
   ───────────────────────────────────────────────────────────── */

/**
 * 跨協定自動資料同步機制：
 * 若使用者於 file:/// 協定開啟且本機儲存有拍賣商品資料，自動將其 POST 給本機伺服器
 */
function checkAndBridgeFileToLocalServer() {
  if (location.protocol !== 'file:') return;
  if (!isInitialDataLoaded) {
    console.warn('🛑 初始資料尚未載入完畢，阻擋 checkAndBridgeFileToLocalServer() 避免覆蓋！');
    return;
  }
  try {
    const dump = {};
    let hasData = false;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      dump[k] = localStorage.getItem(k);
      if (k.startsWith('agy_') || k.startsWith('auctionSect_')) {
        hasData = true;
      }
    }
    if (AppState.items && AppState.items.length > 0) {
      dump['items'] = AppState.items;
      dump['studioName'] = AppState.studioName;
      hasData = true;
    }
    if (hasData) {
      fetch('http://localhost:8080/__save_my_data__', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dump)
      }).then(res => res.json()).then(result => {
        showToast('✅ 已將您的個人拍賣資料同步至本機 .bat 伺服器！');
        console.log('✅ 已成功將 file:// 資料推送到本機伺服器 my_auction_data.json');
      }).catch(err => {
        // 本機伺服器未啟動時靜默略過
      });
    }
  } catch (e) {
    console.warn('Bridge file to local server error:', e);
  }
}

/**
 * 本機伺服器拍賣資料自動載入：
 * 當透過本機伺服器 (http://localhost:8080) 開啟時，自動從 my_auction_data.json 載入真實商品與圖片
 */
/**
 * 本機伺服器與 GitHub Pages 拍賣資料非同步安全載入：
 * 採用 async/await 載入 my_auction_data.json，設定 isInitialDataLoaded = true，
 * 嚴格阻擋載入前的 premature POST /__save_my_data__，徹底解決先存後讀的覆蓋漏洞。
 */
async function checkAndLoadMyAuctionData() {
  // 嘗試取得伺服器回報的 LAN IP (供手機掃碼 QR Code 使用)
  fetch('./__server_info__')
    .then(r => r.json())
    .then(inf => {
      if (inf && inf.lan_url) {
        serverLanUrl = inf.lan_url;
        updateShareUrl();
      }
    })
    .catch(() => {});

  // 相對路徑載入 my_auction_data.json，支援本機伺服器與 GitHub Pages 全球託管
  let targetUrl = './my_auction_data.json?t=' + Date.now();
  if (location.protocol === 'file:') {
    targetUrl = 'http://localhost:8080/my_auction_data.json?t=' + Date.now();
  }

  try {
    const res = await fetch(targetUrl);
    if (!res.ok) throw new Error('my_auction_data.json not found (HTTP ' + res.status + ')');
    const data = await res.json();
    if (data) {
      if (data.studioName) {
        AppState.studioName = data.studioName;
        SafeStorage.set('agy_studio_name', data.studioName);
        updateStudioName(data.studioName, false);
      }
      if (data.studioLogo) {
        SafeStorage.set('agy_studio_logo', data.studioLogo);
        updateStudioLogo(data.studioLogo, false);
      }
      if (data.logoConfig) {
        SafeStorage.set('agy_studio_logo_cfg', data.logoConfig);
        applyLogoConfig(data.logoConfig, false);
      }
      if (data.baseCurrency) {
        AppState.baseCurrency = data.baseCurrency;
        SafeStorage.set('agy_base_currency', data.baseCurrency);
      }
      if (data.agy_last_auction_id) {
        AppState.auctionId = data.agy_last_auction_id;
        SafeStorage.set('agy_last_auction_id', data.agy_last_auction_id);
      }

      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        // 過濾假範例商品
        const filtered = data.items.filter(it => {
          if (!it || typeof it !== 'object') return false;
          const n = String(it.name || '').trim();
          if (!n || (n === '拍賣商品' && Number(it.startPrice) === 100 && (!it.images || it.images[0] === 'icon-512.png'))) return false;
          return !n.includes('樟木箱') && !n.includes('茶盤') && !n.includes('官帽椅');
        });
        if (filtered.length > 0) {
          const normalized = filtered.map((it, idx) => {
            const item = normalizeItem(it, it.id || `item-${idx + 1}`);
            if (item.timeMode === 'reset24' && (item.status === 'live' || item.status === 'active')) {
              if (item.endTime <= getServerNow()) {
                item.endTime = getServerNow() + 24 * 3600 * 1000;
              }
            }
            return item;
          });
          AppState.items = normalized;
          SafeStorage.set('agy_items', normalized);
        }
      }
      console.log('✅ 已成功從 my_auction_data.json 載入商品資料！商品數量:', AppState.items.length, '首項圖片數:', AppState.items[0]?.images?.length);
    }
  } catch (err) {
    console.warn('載入 my_auction_data.json 提示：', err.message);
  } finally {
    // ★ 核心關鍵：標記初始資料讀取完成，才允許後續的使用者操作存檔
    isInitialDataLoaded = true;
    try { enforceBuyerRetentionAndLock(); } catch (e) { console.error('enforceBuyerRetentionAndLock 錯誤:', e); }
    try { applyUrlRouteParams(); } catch (e) { console.error('applyUrlRouteParams 錯誤:', e); }
    try {
      if (AppState.activeItemId) {
        loadItemIntoEditForm(AppState.activeItemId);
      }
    } catch (e) { console.error('loadItemIntoEditForm 錯誤:', e); }
    try { renderItemTabs(); } catch (e) { console.error('renderItemTabs 錯誤:', e); }
    try { renderActiveItemDisplay(); } catch (e) { console.error('renderActiveItemDisplay 錯誤:', e); }
    try { renderBidHistory(); } catch (e) { console.error('renderBidHistory 錯誤:', e); }
    try { renderQA(); } catch (e) { console.error('renderQA 錯誤:', e); }
    try { renderWinnerStatus(); } catch (e) { console.error('renderWinnerStatus 錯誤:', e); }
    try { renderAdminItemsList(); } catch (e) { console.error('renderAdminItemsList 錯誤:', e); }
    try { renderAdminAllQA(); } catch (e) { console.error('renderAdminAllQA 錯誤:', e); }
    try { renderAdminBuyersRoster(); } catch (e) { console.error('renderAdminBuyersRoster 錯誤:', e); }
    try { updateAuctionTimerUI(); } catch (e) { console.error('updateAuctionTimerUI 錯誤:', e); }
    try { updateShareUrl(); } catch (e) { console.error('updateShareUrl 錯誤:', e); }
    if (AppState.auctionId && typeof listenFirebase === 'function') {
      try { listenFirebase(AppState.auctionId); } catch (e) { console.error('listenFirebase 錯誤:', e); }
    }
  }
}

/**
 * 同步拍賣全域資料至本機伺服器 my_auction_data.json
 * 加入 isInitialDataLoaded 門禁保護與空商品防呆，絕不覆蓋有效商品
 */
function syncToLocalServer(force = false) {
  if (!isInitialDataLoaded && !force) {
    console.warn('🛑 初始資料尚未載入完成，已阻止 premature syncToLocalServer()，防止覆蓋檔案！');
    return;
  }
  if (!AppState.items || AppState.items.length === 0) {
    console.warn('🛑 商品清單為空，阻止同步空資料至本機伺服器！');
    return;
  }

  const payload = {
    studioName: AppState.studioName,
    baseCurrency: AppState.baseCurrency,
    studioLogo: SafeStorage.get('agy_studio_logo') || 'icon-192.png',
    logoConfig: SafeStorage.get('agy_studio_logo_cfg') || getLogoConfig(),
    items: AppState.items,
    buyers: AppState.registeredBuyers || [],
    agy_studio_name: AppState.studioName,
    agy_active_currency: AppState.activeCurrency,
    agy_last_auction_id: AppState.auctionId
  };

  fetch('http://localhost:8080/__save_my_data__', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(res => res.json()).then(data => {
    console.log('✅ 本機伺服器 my_auction_data.json 已同步更新');
  }).catch(err => {
    // 伺服器未啟動或連線失敗時靜默略過
  });
}

/* ─────────────────────────────────────────────────────────────
   19. 系統啟動初始化入口 (Init on DOM Ready)
   ───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  // 先還原已儲存買家資料，再執行最高權限管理者驗證狀態檢查（確保小建 0931849482 / guess_chen1981 裝置自動解鎖切換器）
  restoreSavedProfile();
  const initialAdminVerified = checkSavedAdminAuth();
  AppState.isAdminAuthenticated = initialAdminVerified;
  AppState.isAdmin = initialAdminVerified;

  // 📱/💻 啟動時自動偵測或還原「手機觀看模式 / 電腦觀看模式」
  applyViewMode(detectInitialViewMode(), false);
  restoreSavedLegacyLocalStorage(); // 舊版本機設定與歷史資料還原保護

  // 嚴格確保系統預設為「建生工坊」
  let cachedStudioName = SafeStorage.get('agy_studio_name');
  if (!cachedStudioName || cachedStudioName === 'JianSheng Boutique') {
    cachedStudioName = '建生工坊';
    SafeStorage.set('agy_studio_name', '建生工坊');
  }
  updateStudioName(cachedStudioName, true);

  let cachedStudioLogo = SafeStorage.get('agy_studio_logo') || 'icon-192.png';
  updateStudioLogo(cachedStudioLogo, false);

  setupLogoFitModal();
  setupLogoDragAndDrop();
  applyLogoConfig(getLogoConfig(), false);

  FirebaseManager.init();
  try { populateFbSetupModal(); } catch (e) {}
  bindEvents();

  // ★ 核心防禦：先完成 await checkAndLoadMyAuctionData() 載入真實商品並渲染完畢！
  await checkAndLoadMyAuctionData();

  // 待初始真實資料讀取完畢後，才正式啟動倒數計時定時器，杜絕未載入前觸發逾時結標存檔
  startAuctionTimer();

  const p = new URLSearchParams(location.search);
  AppState.auctionId = UNIFIED_AUCTION_ID;

  // 恢復重新整理前的選定商品 (若網址未帶 ?id=)
  const savedItem = sessionStorage.getItem('auction_active_item');
  if (savedItem && !p.get('id')) {
    if (AppState.items.some(i => i.id === savedItem)) {
      AppState.activeItemId = savedItem;
    }
  }

  // 👑 驗證並恢復最高權限管理者登入狀態（嚴格隔離一般買家與最高管理者）
  const isVerifiedAdmin = checkSavedAdminAuth();
  AppState.isAdminAuthenticated = isVerifiedAdmin;
  AppState.isAdmin = isVerifiedAdmin;

  const savedPage = sessionStorage.getItem('auction_active_page');
  if (isVerifiedAdmin && savedPage === 'admin' && !p.get('id')) {
    const pageAuction = el('page-auction');
    const pageAdmin = el('page-admin');
    if (pageAuction) {
      pageAuction.classList.remove('active');
      pageAuction.style.display = 'none';
    }
    if (pageAdmin) {
      pageAdmin.classList.add('active');
      pageAdmin.style.display = 'block';
    }
  } else {
    const pageAuction = el('page-auction');
    const pageAdmin = el('page-admin');
    if (pageAdmin) {
      pageAdmin.classList.remove('active');
      pageAdmin.style.display = 'none';
    }
    if (pageAuction) {
      pageAuction.classList.add('active');
      pageAuction.style.display = 'block';
    }
  }
  syncAdminUIState();
  initQAHeightPreferences();
  renderQA(true, null);

  // 初始渲染後精準恢復捲軸位置
  restoreScrollPosition();

  // 若為 file:// 協定，在初始資料完全載入後才執行橋接防護
  checkAndBridgeFileToLocalServer();
});
