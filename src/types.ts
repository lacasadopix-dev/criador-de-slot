export type SymbolType = 'King' | 'Queen' | 'Crown' | 'Lion' | 'Sword' | 'Shield' | 'Castle' | 'Diamond' | 'Coin' | 'Dragon';

export interface ReelState {
  symbols: SymbolType[];
  isSpinning: boolean;
  stopPosition: number;
}

export interface SymbolImageConfig {
  url: string;
  objectFit?: 'cover' | 'contain';
  offsetX?: number; // % offset (-50 to 50)
  offsetY?: number; // % offset (-50 to 50)
  scale?: number; // zoom % (50 to 200)
}

export interface Payline {
  id: string;
  name: string;
  positions: number[]; // row index for each reel (e.g. [1, 1, 1, 1, 1])
  payoutMultiplier: number; // e.g. 5.0
  color: string; // color for line rendering
  strokeWidth?: number; // line thickness in px
  active: boolean;

  // Media de Vitória (Foto ou Vídeo por URL)
  winMediaUrl?: string; // Image or Video URL (MP4, WebM, GIF, PNG, JPG)
  winMediaType?: 'none' | 'image' | 'video'; // Media type
  winMediaFit?: 'contain' | 'cover';
  winAnimationType?: 'pulse' | 'glow' | 'bounce' | 'shake' | 'sparkle' | 'banner';

  // Posicionamento do Valor do Ganho (Badge / Banner da Linha)
  winBadgePosX?: number; // X position in % (0 to 100)
  winBadgePosY?: number; // Y position in % (0 to 100)
}

export interface BonusConfig {
  enabled: boolean;
  scatterSymbol: SymbolType;
  triggerScatterCount: number; // e.g. 3
  freeSpinsCount: number; // e.g. 10
  bonusMultiplier: number; // e.g. 3
  bonusGameType: 'free_spins' | 'wheel_of_fortune' | 'chest_pick';
  bonusProbabilityPct: number; // e.g. 5%
}

export interface ReelPosition {
  offsetX: number; // % offset X (-50 to 50)
  offsetY: number; // % offset Y (-50 to 50)
  scale: number; // scale % (50 to 150)
}

export type AnchorType = 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface AdminConfig {
  targetRtp: number;
  volatility: 'low' | 'medium' | 'high';
  forcedOutcome: 'none' | 'normal_win' | 'big_win' | 'loss';
  minBet: number;
  maxBet: number;
  allowedBets?: number[]; // Available bet values set by admin
  totalSpins: number;
  totalWagered: number;
  totalPayout: number;
  autoWinBoost: boolean;

  // Base Virtual Canvas (Resolução do Canvas Base)
  canvasWidth?: number; // default 1080
  canvasHeight?: number; // default 1920
  canvasFit?: 'contain' | 'cover'; // default 'contain'

  // Custom Background and Layout Positioning
  bgImage: string;
  bgPosX: number; // X offset in % (-100 to 100)
  bgPosY: number; // Y offset in % (-100 to 100)
  bgZoom: number; // Zoom level (100 to 300%)
  bgFit?: 'cover' | 'contain' | 'stretch';
  bgAnchor?: AnchorType;

  // Slot Reel Box Frame Position & Engine Properties
  slotTop: number; // default 28
  slotLeft: number; // default 5
  slotWidth: number; // default 90
  slotHeight: number; // default 48
  slotRotation?: number; // degrees -180 to 180
  slotOpacity?: number; // 0 to 100
  slotZIndex?: number; // 0 to 50
  slotLocked?: boolean;
  slotVisible?: boolean;
  slotAnchor?: AnchorType;

  // Spin Button Positioning & Engine Properties
  spinBottom: number; // default 4
  spinLeft: number; // default 50
  spinTop?: number;
  spinScale: number; // default 100 (%)
  spinRotation?: number;
  spinOpacity?: number;
  spinZIndex?: number;
  spinLocked?: boolean;
  spinVisible?: boolean;
  spinAnchor?: AnchorType;
  spinShape?: 'circle' | 'pill' | 'rounded' | 'square' | 'octagon' | 'diamond';

  // Turbo Button Positioning & Customization
  turboTop?: number; // default 88
  turboLeft?: number; // default 80
  turboScale?: number; // default 100
  turboRotation?: number;
  turboOpacity?: number;
  turboZIndex?: number;
  turboLocked?: boolean;
  turboVisible?: boolean;
  turboAnchor?: AnchorType;
  turboBgImage?: string;
  turboShape?: 'circle' | 'pill' | 'rounded' | 'square' | 'octagon' | 'diamond';

  // Auto-Spin Button Positioning & Customization
  autoTop?: number; // default 88
  autoLeft?: number; // default 20
  autoScale?: number; // default 100
  autoRotation?: number;
  autoOpacity?: number;
  autoZIndex?: number;
  autoLocked?: boolean;
  autoVisible?: boolean;
  autoAnchor?: AnchorType;
  autoBgImage?: string;
  autoShape?: 'circle' | 'pill' | 'rounded' | 'square' | 'octagon' | 'diamond';

  // Balance Box Customization & Engine Properties
  balanceTop?: number; // default 3
  balanceLeft?: number; // default 3
  balanceScale?: number; // default 100
  balanceRotation?: number;
  balanceOpacity?: number;
  balanceZIndex?: number;
  balanceLocked?: boolean;
  balanceVisible?: boolean;
  balanceBgColor?: string; // default "#000000b3"
  balanceTextColor?: string; // default "#ffffff"
  balanceBorderColor?: string; // default "#d4af3766"
  balanceBgImage?: string; // Custom background image URL
  balanceAnchor?: AnchorType;

  // Bet Box Customization & Engine Properties
  betTop?: number; // default 3
  betLeft?: number; // default 55
  betScale?: number; // default 100
  betRotation?: number;
  betOpacity?: number;
  betZIndex?: number;
  betLocked?: boolean;
  betVisible?: boolean;
  betBgColor?: string; // default "#000000b3"
  betTextColor?: string; // default "#fde073"
  betBorderColor?: string; // default "#8b691466"
  betBgImage?: string; // Custom background image URL
  betAnchor?: AnchorType;

  // Win Box 1 (Persistent Win Banner Indicator)
  winBoxTop?: number; // default 3
  winBoxLeft?: number; // default 30
  winBoxScale?: number; // default 100
  winBoxRotation?: number;
  winBoxOpacity?: number;
  winBoxZIndex?: number;
  winBoxLocked?: boolean;
  winBoxVisible?: boolean;
  winBoxBgColor?: string; // default "rgba(16, 185, 129, 0.2)"
  winBoxTextColor?: string; // default "#34d399"
  winBoxBorderColor?: string; // default "#10b98188"
  winBoxBgImage?: string; // Custom background image URL
  winBoxAnchor?: AnchorType;

  // Win Box 2 (Animated Big Win Counter Overlay)
  winOverlayTop?: number; // default 20
  winOverlayLeft?: number; // default 50
  winOverlayScale?: number; // default 100
  winOverlayRotation?: number;
  winOverlayOpacity?: number;
  winOverlayZIndex?: number;
  winOverlayLocked?: boolean;
  winOverlayVisible?: boolean;
  winOverlayBgColor?: string;
  winOverlayTextColor?: string;
  winOverlayBorderColor?: string;
  winOverlayBgImage?: string; // Custom background image URL
  winOverlayAnchor?: AnchorType;

  // Additional Frame Background Images
  slotBgImage?: string;
  spinBgImage?: string;

  // Editor Helpers (Game Engine Mode)
  gridEnabled?: boolean;
  gridSize?: number; // 1, 2, 5, 10 (%)
  snapToGrid?: boolean;
  showMetrics?: boolean; // Toggles screen metrics and precise measurement rulers
  editorZoom?: number; // 50% to 150%

  // Reel Frame & Border options
  showReelBorders?: boolean; // default false
  showReelBg?: boolean; // default false
  spinStyle?: 'smooth' | 'cascade' | 'random' | 'zoom' | 'turbo'; // Slot rolling animation mode

  // Custom Symbol Images (SymbolType -> URL/DataURI)
  customSymbols: Partial<Record<SymbolType, string>>;
  customSymbolConfigs?: Partial<Record<SymbolType, SymbolImageConfig>>;

  // Motor do Jogo (Game Engine) Configuration
  numReels: number; // default 5
  numRows: number; // default 3
  paylines: Payline[];
  bonusConfig: BonusConfig;
  gameRulesText: string;
  symbolPayouts: Record<SymbolType, number>;
  individualReelPositions?: Record<number, ReelPosition>;
}

export interface SpinHistoryItem {
  id: string;
  time: string;
  bet: number;
  win: number;
  multiplier: number;
  symbols: SymbolType[];
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  turboMode: boolean;
  autoSpinCount: number;
  isAutoSpinning: boolean;
}

export interface GameState {
  balance: number;
  bet: number;
  win: number;
  isSpinning: boolean;
  progression: number; // 0 to 100
  bigWin: boolean;
  freeSpinsRemaining?: number;
  inBonusMode?: boolean;
}


