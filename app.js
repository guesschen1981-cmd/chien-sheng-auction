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
const AppState = {
  studioName: '建生工坊',
  baseCurrency: 'TWD',
  activeCurrency: 'TWD',
  activeItemId: 'item-1',
  items: JSON.parse(JSON.stringify(DEFAULT_ITEMS)),
  broadcasts: [],
  auctionId: null,
  isAdmin: false,
  isTabsManuallyExpanded: false, // 標記使用者是否已點擊展開全部商品
  userProfile: {
    name: '',
    phone: '',
    line: '',
    ig: '',
    fb: ''
  },
  prevTopBidders: {}, // 記錄每個品項的前任最高出價者，用於出價超越警示
  galleryIndex: 0,
  currentEditImages: [] // 編輯中的圖片陣列 (支援拖曳上傳預覽)
};

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
const SafeStorage = {
  get(key, fallback = null) {
    try {
      const val = localStorage.getItem(key);
      if (val === null) return fallback;
      try {
        return JSON.parse(val);
      } catch (_) {
        return val;
      }
    } catch (e) {
      console.warn('localStorage get blocked:', e);
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('localStorage set blocked:', e);
      return false;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
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
    antiSnipeEnable: raw.antiSnipeEnable !== false && raw.antiSnipeEnabled !== false,
    antiSnipeEnabled: raw.antiSnipeEnable !== false && raw.antiSnipeEnabled !== false,
    antiSnipeMins: Number(raw.antiSnipeMins || 3),
    antiSnipeExt: Number(raw.antiSnipeExt || raw.antiSnipeExtMins || 3),
    antiSnipeExtMins: Number(raw.antiSnipeExt || raw.antiSnipeExtMins || 3),
    pickupDeadlineHours: pickupDeadlineHours,
    pickupDeadline: raw.pickupDeadline || null,
    pickupOptions: pickupOptions,
    pickupCustom: pickupCustom,
    extraNotes: extraNotes,
    warrantyDays: warrantyDays,
    warrantyText: warrantyText,
    qa: qa,
    winnerMsgs: winnerMsgs
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

  // 重複帳號衝突檢驗
  try {
    const boundPhones = SafeStorage.get('agy_registered_users', {}) || {};
    if (boundPhones[clean] && userName && boundPhones[clean] !== userName.trim()) {
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

  return { valid: true, phone: clean };
}

/* ─────────────────────────────────────────────────────────────
   5.5 動態店鋪名稱核心管理 (Dynamic Store Name Management)
   ───────────────────────────────────────────────────────────── */

/**
 * 全域動態更新店鋪名稱（同步導覽列、分頁 Title、後台標題、輸入框與 Firebase）
 */
function updateStudioName(newName, shouldSync = true) {
  let trimmed = (newName || '').trim();
  if (!trimmed || trimmed === 'JianSheng Boutique') {
    trimmed = '建生工坊';
  }

  AppState.studioName = trimmed;
  SafeStorage.set('agy_studio_name', trimmed);

  // 1. 網頁最頂部的導覽列標題
  const navStudio = el('nav-studio-name');
  if (navStudio) navStudio.textContent = trimmed;

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
const FirebaseManager = (function () {
  let _app = null;
  let _db = null;

  const DEFAULT_CONFIG = {
    apiKey: "AIzaSyDemoAuctionKeyFake1234567890",
    databaseURL: "https://chien-sheng-auction-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "chien-sheng-auction"
  };

  function init() {
    let cfg = DEFAULT_CONFIG;
    try {
      const stored = SafeStorage.get('agy_fb_config');
      if (stored) cfg = typeof stored === 'object' ? stored : JSON.parse(stored);
    } catch (e) {}

    try {
      if (typeof firebase !== 'undefined' && !_app) {
        _app = firebase.initializeApp(cfg);
        _db = firebase.database();
        if (typeof initServerTimeSync === 'function') {
          initServerTimeSync(_db);
        }
        listenShopSettings();
        listenAuctionItems();
      }
    } catch (e) {
      console.warn('Firebase init fallback:', e);
    }
  }

  // 即時監聽 Firebase 全域設定節點（保證任何訪客與買家都能獲取最新店名與 Logo）
  function listenShopSettings() {
    if (!_db) return;
    _db.ref('settings/shop').on('value', snap => {
      if (snap.exists()) {
        const val = snap.val();
        if (val) {
          if (val.studioName) {
            if (val.studioName === 'JianSheng Boutique') {
              updateStudioName('建生工坊', true);
            } else {
              updateStudioName(val.studioName, false);
            }
          }
          if (val.studioLogo) {
            updateStudioLogo(val.studioLogo, false);
          }
          if (val.logoConfig) {
            applyLogoConfig(val.logoConfig, false);
          }
        }
      }
    });
  }

  function getDb() { return _db; }
  function isReady() { return !!_db; }

  return { init: init, getDb: getDb, isReady: isReady };
})();

/**
 * 即時監聽拍賣商品即時節點（支援高併發 Transaction 與多買家同步跳轉）
 */
function listenAuctionItems() {
  const db = FirebaseManager.getDb();
  if (!db) return;
  db.ref('auction/items').on('value', snap => {
    if (!snap.exists()) return;
    const remoteItems = snap.val();
    if (!remoteItems) return;
    let changed = false;
    Object.keys(remoteItems).forEach(key => {
      const rItem = remoteItems[key];
      if (!rItem) return;
      const id = rItem.id || key;
      const local = AppState.items.find(i => i.id === id);
      if (local) {
        if (rItem.currentPrice !== undefined && rItem.currentPrice > (local.currentPrice || local.currentBid || 0)) {
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
            phoneMasked: b.bidderPhoneMasked
          })).sort((a, b) => b.amount - a.amount);
          changed = true;
        }
      }
    });
    if (changed) {
      renderActiveItemDisplay();
      renderItemTabs();
      renderBidHistory();
      renderWinnerStatus();
      if (typeof updateAuctionTimerUI === 'function') {
        updateAuctionTimerUI();
      }
    }
  });
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
  if (container) container.style.display = 'flex';
  if (bidBar && (item.status === 'active' || item.status === 'live')) bidBar.style.display = 'block';

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

  // 2. 圖片輪播
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

  // 縮圖 (強制固定 60px x 60px，並水平平滑滾動)
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
        AppState.galleryIndex = idx;
        renderActiveItemDisplay();
      });
      thumbsBox.appendChild(th);
      if (isActive) {
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
}

/** 渲染出價歷史清單 */
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
    const phoneDisplay = AppState.isAdmin && b.contact && b.contact.phone ? ` (${b.contact.phone})` : '';

    d.innerHTML = `
      <div>
        ${isTopTag}
        <span class="history-user">${maskBuyerName(b.user)}${phoneDisplay}</span>
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
  const item = AppState.items.find(i => i.id === itemId) || getActiveItem();
  if (!item) return;

  const now = getServerNow();
  let price = Number(newStartPrice);
  if (isNaN(price) || price <= 0) {
    price = Number(item.startPrice || 100);
  }

  // 1. 更新商品競標數據
  item.startPrice = price;
  item.currentPrice = price;
  item.currentBid = price;
  item.topBidder = '';
  item.topBidderContact = null;
  item.topBidTime = null;
  item.bids = {};
  item.bidHistory = [];
  item.winnerMsgs = [];
  item.status = 'live';
  item.auctionDone = false;
  item.auctionLive = true;
  item.timeMode = (mode === 'reset24') ? 'reset24' : 'fixed';
  item.endTime = now + Number(durationHours) * 3600 * 1000;
  item.autoRelistIfNoBids = (item.autoRelistIfNoBids !== false);

  // 2. 本機快取更新
  SafeStorage.set('agy_items', AppState.items);
  if (AppState.editingItemId === item.id) {
    loadItemIntoEditForm(item.id);
  }

  // 3. 畫面刷新
  renderItemTabs();
  renderActiveItemDisplay();
  renderBidHistory();
  renderWinnerStatus();
  renderAdminItemsList();
  updateAuctionTimerUI();

  // 4. 解鎖底部出價按鈕
  const submitBidBtn = el('btn-submit-bid');
  if (submitBidBtn) {
    submitBidBtn.disabled = false;
    delete submitBidBtn.dataset.submitting;
  }
  const mobileBidBar = el('mobile-bid-bar');
  if (mobileBidBar) mobileBidBar.style.display = 'block';

  // 5. 跨端同步：更新本機伺服器 my_auction_data.json 與 Firebase
  syncToFirebase();
  syncToLocalServer();

  const durationLabel = (mode === 'reset24')
    ? '24 小時（動態重置模式）'
    : (Number(durationHours) >= 24 ? `${Number(durationHours) / 24} 天` : `${durationHours} 小時`);
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
      el('winner-subline').textContent = `得標商品：${item.name}`;
      el('winner-name-tag').textContent = `得標買家：${maskBuyerName(winnerName)}`;
      el('winner-amount-tag').textContent = `結標金額：${formatMoney(item.currentPrice ?? item.currentBid, AppState.activeCurrency)}`;

      if (deadlineAlert) {
        deadlineAlert.style.display = 'block';
        const deadlineHours = item.pickupDeadlineHours || 48;
        el('winner-deadline-time').textContent = `${deadlineHours} 小時內（預計至 ${new Date(item.endTime + deadlineHours * 3600000).toLocaleString('zh-TW', { hour12: false })} 止）`;
      }

      if (AppState.isAdmin) {
        if (adminContacts) adminContacts.style.display = 'block';
        if (adminActions) adminActions.style.display = 'block';
        renderWinnerContacts(item.topBidderContact || (typeof item.topBidder === 'object' ? item.topBidder : null));
      } else {
        if (adminContacts) adminContacts.style.display = 'none';
        if (adminActions) adminActions.style.display = 'none';
      }

      if (chatSection) chatSection.style.display = 'block';
      renderWinnerMessages(item);

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
      el('winner-subline').textContent = '可由下方快速重新開啟競標，或調整起標價後再次發布';
      el('winner-name-tag').textContent = '得標買家：無人出標（流標）';
      el('winner-amount-tag').textContent = `起標金額：${formatMoney(item.startPrice, AppState.activeCurrency)}`;

      // 強制隱藏取貨提醒、管理者聯絡、私訊留言板與取貨按鈕
      if (deadlineAlert) deadlineAlert.style.display = 'none';
      if (adminContacts) adminContacts.style.display = 'none';
      if (adminActions) adminActions.style.display = 'none';
      if (chatSection) chatSection.style.display = 'none';

      // 顯示「重新開啟競標控制面板」
      if (relistPanel) {
        relistPanel.style.display = 'block';
        if (el('winner-relist-price')) el('winner-relist-price').value = item.startPrice || 10000;
      }
    }
  } else {
    card.classList.remove('show');
    if (bidBar) bidBar.style.display = 'block';
    if (timerCard) {
      el('timer-status-text').textContent = '競標進行中';
      el('timer-status-chip').className = 'timer-status-chip live';
    }
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
    box.innerHTML += `<a href="tel:${escapeHtml(contact.phone)}" class="contact-btn phone">📞 撥打電話 (${escapeHtml(contact.phone)})</a>`;
  }
  if (contact.line) {
    box.innerHTML += `<a href="https://line.me/ti/p/~${escapeHtml(contact.line)}" target="_blank" rel="noopener" class="contact-btn line">💬 Line ID: ${escapeHtml(contact.line)}</a>`;
  }
  if (contact.ig) {
    box.innerHTML += `<a href="https://instagram.com/${escapeHtml(contact.ig)}" target="_blank" rel="noopener" class="contact-btn ig">📸 IG: ${escapeHtml(contact.ig)}</a>`;
  }
  if (contact.fb) {
    const fbHref = contact.fb.startsWith('http') ? contact.fb : `https://facebook.com/${contact.fb}`;
    box.innerHTML += `<a href="${escapeHtml(fbHref)}" target="_blank" rel="noopener" class="contact-btn fb">👤 FB 聯絡</a>`;
  }
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
   8. 樹狀 Q&A 問答模組 (Structured Threaded Q&A - 核心功能 8)
   ───────────────────────────────────────────────────────────── */
function renderQA() {
  const item = getActiveItem();
  const listEl = el('qa-list');
  const emptyHint = el('qa-empty-hint');
  if (!listEl) return;

  if (!item) {
    listEl.innerHTML = '<div style="font-size:.8rem;color:var(--c-text-3);text-align:center;padding:14px;">目前尚無商品</div>';
    return;
  }

  const qaData = item.qa || {};
  const keys = Object.keys(qaData);

  if (!keys.length) {
    if (emptyHint) emptyHint.style.display = 'block';
    Array.from(listEl.children).forEach(c => { if (c !== emptyHint) c.remove(); });
    return;
  }
  if (emptyHint) emptyHint.style.display = 'none';

  listEl.innerHTML = '';
  keys.forEach(k => {
    const q = qaData[k];
    const card = document.createElement('div');
    card.className = 'qa-card';
    card.dataset.qaKey = k;

    const displayUser = AppState.isAdmin
      ? `${escapeHtml(q.user)}${q.phone ? ' (' + escapeHtml(q.phone) + ')' : ''}`
      : maskBuyerName(q.user);

    let replyBlock = '';
    if (q.reply) {
      replyBlock = `
        <div class="qa-reply-block">
          <div class="qa-reply-header">
            <span>🛡️ 賣家官方回覆</span>
            <span style="font-size:.68rem;color:var(--c-text-3);">${formatRelTime(q.replyTime)}</span>
          </div>
          <div class="qa-reply-text">${escapeHtml(q.reply)}</div>
        </div>
      `;
    }

    let adminReplyForm = '';
    if (AppState.isAdmin) {
      adminReplyForm = `
        <div class="qa-admin-reply-box">
          <textarea class="qa-admin-textarea" placeholder="輸入此問題的賣家回覆..." maxlength="300" id="inp-reply-${k}">${q.reply ? escapeHtml(q.reply) : ''}</textarea>
          <div style="display:flex;justify-content:flex-end;">
            <button class="tbtn tbtn-purple tbtn-xs btn-submit-qa-reply" data-qa-key="${k}">
              ${q.reply ? '✏️ 更新回覆' : '💬 送出回覆'}
            </button>
          </div>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="qa-question-block">
        <div class="qa-meta-row">
          <span class="qa-user-tag">❓ ${displayUser}</span>
          <span>${formatRelTime(q.time)}</span>
        </div>
        <div class="qa-question-text">${escapeHtml(q.question)}</div>
      </div>
      ${replyBlock}
      ${adminReplyForm}
    `;

    listEl.appendChild(card);
  });

  listEl.querySelectorAll('.btn-submit-qa-reply').forEach(btn => {
    btn.addEventListener('click', () => {
      const qKey = btn.dataset.qaKey;
      const inp = el(`inp-reply-${qKey}`);
      if (!inp || !inp.value.trim()) {
        showToast('請輸入回覆內容！');
        return;
      }
      submitQAReply(qKey, inp.value.trim());
    });
  });
}

function submitQuestion() {
  const inp = el('qa-ask-input');
  const text = inp ? inp.value.trim() : '';
  if (!text) {
    showToast('請輸入提問內容！');
    return;
  }
  if (!AppState.userProfile.name || !AppState.userProfile.phone) {
    showToast('提問前請先填寫您的稱呼與聯絡手機！');
    openBuyerProfileModal();
    return;
  }

  const item = getActiveItem();
  if (!item) {
    showToast('目前尚無商品可供提問！');
    return;
  }

  const qKey = 'qa_' + Date.now();
  if (!item.qa) item.qa = {};
  item.qa[qKey] = {
    user: AppState.userProfile.name,
    phone: AppState.userProfile.phone,
    question: text,
    time: Date.now(),
    reply: null,
    replyTime: null
  };

  inp.value = '';
  renderQA();
  showToast('提問已送出！賣家回覆後將直接嵌套顯示於下方卡片。');
  syncToFirebase();
}

function submitQAReply(qKey, replyText) {
  const item = getActiveItem();
  if (!item || !item.qa || !item.qa[qKey]) return;
  item.qa[qKey].reply = replyText;
  item.qa[qKey].replyTime = Date.now();
  renderQA();
  showToast('回覆已送出並精準嵌入該買家問答區塊！');
  syncToFirebase();
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

      // 新增出價歷史紀錄
      if (!item.bids) item.bids = {};
      const newBidKey = `bid_${now}_${Math.random().toString(36).slice(2, 7)}`;
      item.bids[newBidKey] = {
        bidderName: buyerProfile.name,
        bidderPhoneMasked: maskPhone(buyerProfile.phone),
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
   11. 管理者操作與刪除全部商品 (Admin Actions - 核心功能 1 & 7)
   ───────────────────────────────────────────────────────────── */

/** 手動提前結標按鈕 */
function handleAdminEndEarly() {
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
        <div style="display:flex;gap:6px;flex-shrink:0;align-items:center;">
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

    // 綁定編輯與刪除
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

  // 載入取貨方式設定 (自取/宅配/超商/自訂說明)
  const opts = item.pickupOptions || { self: true, delivery: false, cvs: false };
  if (el('edit-pickup-self')) el('edit-pickup-self').checked = opts.self !== false;
  if (el('edit-pickup-delivery')) el('edit-pickup-delivery').checked = !!opts.delivery;
  if (el('edit-pickup-cvs')) el('edit-pickup-cvs').checked = !!opts.cvs;
  if (el('edit-item-pickup-custom')) el('edit-item-pickup-custom').value = item.pickupCustom || '';

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

  // 取貨方式設定 (自取/寄送/超商/自訂說明)
  item.pickupOptions = {
    self: !!el('edit-pickup-self')?.checked,
    delivery: !!el('edit-pickup-delivery')?.checked,
    cvs: !!el('edit-pickup-cvs')?.checked
  };
  item.pickupCustom = el('edit-item-pickup-custom')?.value.trim() ?? '';

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

function handleAuctionEndedState(currentItem) {
  if (!currentItem) return;
  const hasBids = hasItemBids(currentItem);

  if (currentItem.status === 'active' || currentItem.status === 'live') {
    currentItem.status = 'ended';
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
  const diff = Math.max(0, endTime - now);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / 1000 / 60) % 60);
  const secs = Math.floor((diff / 1000) % 60);

  if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
  if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
  if (minsEl) minsEl.textContent = String(mins).padStart(2, '0');
  if (secsEl) secsEl.textContent = String(secs).padStart(2, '0');

  // 狀態顯示與防壓標提示切換
  if (diff <= 0 || currentItem.status === 'ended' || currentItem.status === 'picked_up') {
    const hasBids = hasItemBids(currentItem);

    // 檢查是否符合「無人出標自動續拍 24H」
    if (diff <= 0 && currentItem.status !== 'ended' && currentItem.status !== 'picked_up') {
      if (!hasBids && currentItem.autoRelistIfNoBids !== false) {
        console.log('🔄 商品【' + currentItem.name + '】競標時間到且無人出價，自動延長 24 小時續拍！');
        currentItem.endTime = getServerNow() + 24 * 3600 * 1000;
        currentItem.status = 'active';
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
   15. 買家身分彈窗與 LocalStorage 存取
   ───────────────────────────────────────────────────────────── */
function openBuyerProfileModal() {
  el('inp-buyer-name').value = AppState.userProfile.name || '';
  el('inp-buyer-phone').value = AppState.userProfile.phone || '';
  el('inp-buyer-line').value = AppState.userProfile.line || '';
  el('inp-buyer-ig').value = AppState.userProfile.ig || '';
  el('inp-buyer-fb').value = AppState.userProfile.fb || '';
  el('modal-buyer-profile').classList.add('show');
}

function closeBuyerProfileModal() {
  el('modal-buyer-profile').classList.remove('show');
}

function saveBuyerProfile() {
  const name = el('inp-buyer-name').value.trim();
  const phone = el('inp-buyer-phone').value.trim();

  if (!name) {
    alert('請填寫買家稱呼 / 暱稱！');
    return;
  }

  const phoneCheck = validatePhoneNumber(phone, name);
  if (!phoneCheck.valid) {
    alert(phoneCheck.message);
    return;
  }

  AppState.userProfile = {
    name: name,
    phone: phoneCheck.phone,
    line: el('inp-buyer-line').value.trim(),
    ig: el('inp-buyer-ig').value.trim(),
    fb: el('inp-buyer-fb').value.trim()
  };

  SafeStorage.set('agy_buyer_profile', AppState.userProfile);

  if (el('user-profile-name')) {
    el('user-profile-name').textContent = name;
  }

  closeBuyerProfileModal();
  showToast(`✅ 買家身分「${name}」已驗證儲存！`);
}

function restoreSavedProfile() {
  try {
    const saved = SafeStorage.get('agy_buyer_profile');
    if (saved) {
      const p = (typeof saved === 'object') ? saved : JSON.parse(saved);
      AppState.userProfile = Object.assign({}, AppState.userProfile, p);
      if (el('user-profile-name') && AppState.userProfile.name) {
        el('user-profile-name').textContent = AppState.userProfile.name;
      }
    }
    const savedCur = SafeStorage.get('agy_active_currency');
    if (savedCur && CURRENCY_RATES[savedCur]) {
      AppState.activeCurrency = savedCur;
      if (el('currency-select')) el('currency-select').value = savedCur;
    }
  } catch (e) {}
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

    // 同步更新至 auction/items 節點以支援跨客戶端 Transaction 與防蓋標
    AppState.items.forEach(it => {
      if (it && it.id) {
        db.ref(`auction/items/${it.id}`).update({
          id: it.id,
          name: it.name,
          startPrice: Number(it.startPrice || 0),
          increment: Number(it.increment || 10),
          currentPrice: Number(it.currentPrice ?? it.currentBid ?? it.startPrice ?? 0),
          endTime: Number(it.endTime || 0),
          status: it.status || 'active',
          timeMode: it.timeMode || 'fixed',
          antiSnipeEnable: it.antiSnipeEnable !== false && it.antiSnipeEnabled !== false,
          antiSnipeMins: Number(it.antiSnipeMins || 3),
          antiSnipeExt: Number(it.antiSnipeExt || it.antiSnipeExtMins || 3)
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
      const rawList = Array.isArray(data.items) ? data.items : Object.values(data.items);
      incomingItems = rawList.map((it, idx) => normalizeItem(it, it.id || `item-${idx + 1}`));
    }
    // 2. 舊版單一商品頂層結構自動相容遷移 (itemName / startPrice / imageList 等舊格式)
    else if (data.itemName || data.name || data.startPrice !== undefined || data.imageList || data.imgUrl || data.imageUrls || data.currentBid !== undefined) {
      console.log('🔄 偵測到舊版 Firebase 拍賣資料結構，執行自動相容遷移…');
      const legacyItem = normalizeItem(data, data.auctionId || 'item-legacy-1');
      incomingItems = [legacyItem];
    }

    if (incomingItems.length > 0) {
      // 比對即時出價超越警示 (Outbid Alert)
      incomingItems.forEach(remoteItem => {
        const localItem = AppState.items.find(i => i.id === remoteItem.id);
        if (localItem && remoteItem.currentBid > localItem.currentBid) {
          checkOutbidNotice(remoteItem.id, remoteItem.topBidder, remoteItem.currentBid);
        }
      });

      // 替換為經過相容正規化處理之最新雲端商品資料
      AppState.items = incomingItems;

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

  // 2. 圖片輪播箭頭
  el('btn-gallery-prev')?.addEventListener('click', () => {
    const item = getActiveItem();
    if (!item) return;
    const imgs = item.images || [];
    AppState.galleryIndex = (AppState.galleryIndex - 1 + imgs.length) % imgs.length;
    renderActiveItemDisplay();
  });
  el('btn-gallery-next')?.addEventListener('click', () => {
    const item = getActiveItem();
    if (!item) return;
    const imgs = item.images || [];
    AppState.galleryIndex = (AppState.galleryIndex + 1) % imgs.length;
    renderActiveItemDisplay();
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

  // 7. Q&A 提問送出
  el('btn-send-question')?.addEventListener('click', submitQuestion);

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

  // 10. 管理者廣播公告
  el('btn-admin-broadcast')?.addEventListener('click', () => sendBroadcast());

  // 11. 前後台模式切換
  el('btn-switch-mode')?.addEventListener('click', () => {
    const pageAuction = el('page-auction');
    const pageAdmin = el('page-admin');
    const btnText = el('switch-mode-text');
    const isCurrentlyAdmin = pageAdmin?.classList.contains('active');

    if (!isCurrentlyAdmin) {
      AppState.isAdmin = true;
      pageAuction?.classList.remove('active');
      pageAdmin?.classList.add('active');
      if (btnText) btnText.textContent = '前台';
      renderAdminItemsList();
      if (AppState.activeItemId) {
        loadItemIntoEditForm(AppState.activeItemId);
      }
      showToast('🔧 已切換至【管理者後台控制中心】');
    } else {
      pageAdmin?.classList.remove('active');
      pageAuction?.classList.add('active');
      if (btnText) btnText.textContent = '後台';
      renderItemTabs();
      renderActiveItemDisplay();
      renderQA();
      renderWinnerStatus();
      showToast('👁️ 已切換至【買家前台競標視角】');
    }
  });

  // 12. 買家身分彈窗
  el('btn-user-profile')?.addEventListener('click', openBuyerProfileModal);
  el('btn-cancel-profile')?.addEventListener('click', closeBuyerProfileModal);
  el('btn-save-profile')?.addEventListener('click', saveBuyerProfile);

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

  // 15. 全面發布拍賣
  el('btn-publish-all')?.addEventListener('click', () => {
    const db = FirebaseManager.getDb();
    if (!db) {
      showToast('請先連線 Firebase 雲端資料庫！');
      el('modal-fb-setup')?.classList.add('show');
      return;
    }
    const newRef = db.ref('auctions').push();
    AppState.auctionId = newRef.key;
    SafeStorage.set('agy_last_auction_id', newRef.key);

    newRef.set({
      studioName: AppState.studioName,
      baseCurrency: AppState.baseCurrency,
      items: AppState.items,
      broadcasts: AppState.broadcasts,
      createdAt: Date.now()
    }).then(() => {
      showToast(`🚀 拍賣已全面正式發布至雲端！ID: ${AppState.auctionId}`);
      updateShareUrl();
      listenFirebase(AppState.auctionId);
      el('btn-switch-mode')?.click();
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

  // 18. Firebase 設定彈窗 (支援後台按鈕與導覽列選單)
  const handleOpenFbConfig = () => {
    el('modal-fb-setup')?.classList.add('show');
    el('nav-more-dropdown')?.classList.remove('show');
  };
  el('btn-fb-config')?.addEventListener('click', handleOpenFbConfig);
  el('btn-nav-fb-config')?.addEventListener('click', handleOpenFbConfig);
  el('btn-fb-close')?.addEventListener('click', () => el('modal-fb-setup')?.classList.remove('show'));
  el('btn-fb-save')?.addEventListener('click', () => {
    const cfg = {
      apiKey: el('fb-api-key')?.value.trim(),
      databaseURL: el('fb-db-url')?.value.trim(),
      projectId: el('fb-project-id')?.value.trim()
    };
    if (!cfg.apiKey || !cfg.databaseURL) {
      alert('請填寫完整 Firebase 設定資訊！');
      return;
    }
    SafeStorage.set('agy_fb_config', cfg);
    el('modal-fb-setup')?.classList.remove('show');
    showToast('💾 Firebase 設定已更新，重新連線中…');
    location.reload();
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
    const val = el('cfg-studio-name')?.value.trim();
    if (val) {
      updateStudioName(val, true);
      showToast(`💾 店鋪名稱已成功更新為【${val}】，並同步至雲端！`);
    }
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
          const n = String(it.name || '');
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
    applyUrlRouteParams();
    if (AppState.activeItemId) {
      loadItemIntoEditForm(AppState.activeItemId);
    }
    renderItemTabs();
    renderActiveItemDisplay();
    renderBidHistory();
    renderQA();
    renderWinnerStatus();
    renderAdminItemsList();
    updateAuctionTimerUI();
    updateShareUrl();
    if (AppState.auctionId && typeof listenFirebase === 'function') {
      listenFirebase(AppState.auctionId);
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
  restoreSavedProfile();
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
  bindEvents();

  // ★ 核心防禦：先完成 await checkAndLoadMyAuctionData() 載入真實商品並渲染完畢！
  await checkAndLoadMyAuctionData();

  // 待初始真實資料讀取完畢後，才正式啟動倒數計時定時器，杜絕未載入前觸發逾時結標存檔
  startAuctionTimer();

  const p = new URLSearchParams(location.search);
  const cloudId = p.get('id') || SafeStorage.get('agy_last_auction_id');

  if (cloudId) {
    AppState.auctionId = cloudId;
    listenFirebase(cloudId);
  }

  AppState.isAdmin = !p.get('id');

  // 若為 file:// 協定，在初始資料完全載入後才執行橋接防護
  checkAndBridgeFileToLocalServer();
});
