import React, { useState, useRef } from 'react';
import { 
  Shield, X, DollarSign, Activity, Percent, Flame, RefreshCw, Key, 
  AlertTriangle, Image as ImageIcon, Move, LayoutGrid, Upload, Trash2, 
  RotateCcw, Sliders, Eye, Coins, Minus, Plus, Cpu, Layers, Gift, FileText, Check, PlusCircle, Settings, Palette, Play,
  Lock, Unlock, Grid, Maximize2, EyeOff, Crosshair, Ruler, Film
} from 'lucide-react';
import { AdminConfig, GameState, SymbolType, Payline, BonusConfig, ReelPosition, AnchorType } from '../types';
import { SlotSymbol } from './SlotSymbol';
import { SlotMachine } from './SlotMachine';
import { BackgroundMedia } from './BackgroundMedia';
import { SpinButton } from './SpinButton';
import { GameStage } from './GameStage';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminConfig: AdminConfig;
  onUpdateAdminConfig: (newConfig: Partial<AdminConfig>) => void;
  gameState: GameState;
  onUpdateBalance: (newBalance: number) => void;
  onResetStats: () => void;
}

const SYMBOL_NAMES: { type: SymbolType; label: string }[] = [
  { type: 'Crown', label: 'Coroa Imperial' },
  { type: 'Dragon', label: 'Dragão do Reino' },
  { type: 'King', label: 'Rei Supremo' },
  { type: 'Queen', label: 'Rainha das Armas' },
  { type: 'Lion', label: 'Leão Guardião' },
  { type: 'Castle', label: 'Castelo Fortificado' },
  { type: 'Sword', label: 'Espada Mágica' },
  { type: 'Shield', label: 'Escudo Real' },
  { type: 'Diamond', label: 'Diamante Ancentral' },
  { type: 'Coin', label: 'Moeda de Ouro' },
];

const PAYLINE_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#a855f7', '#6366f1'];

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  adminConfig,
  onUpdateAdminConfig,
  gameState,
  onUpdateBalance,
  onResetStats,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [pinInput, setPinInput] = useState<string>('');
  const [customBalanceInput, setCustomBalanceInput] = useState<string>('');
  const [customBetInput, setCustomBetInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'engine' | 'layout' | 'symbols'>('engine');
  const [viewMode, setViewMode] = useState<'tools' | 'split' | 'preview_full'>('tools');
  const [previewScale, setPreviewScale] = useState<number>(100);
  const [selectedElement, setSelectedElement] = useState<'slot' | 'spin' | 'turbo' | 'balance' | 'bet' | 'winBox' | 'winOverlay' | 'bg'>('slot');
  const [testSpinning, setTestSpinning] = useState<boolean>(false);
  const [mediaUrlInput, setMediaUrlInput] = useState<string>('');
  
  // Motor do Jogo sub-tabs
  const [engineSubTab, setEngineSubTab] = useState<'grid' | 'paylines' | 'bonus' | 'rules'>('grid');
  const [selectedPaylineId, setSelectedPaylineId] = useState<string | null>(null);

  // Dragging state for layout preview
  const [isDraggingBg, setIsDraggingBg] = useState<boolean>(false);
  const [isDraggingSlot, setIsDraggingSlot] = useState<boolean>(false);
  const [isResizingSlot, setIsResizingSlot] = useState<boolean>(false);
  const [isDraggingSpin, setIsDraggingSpin] = useState<boolean>(false);
  const [isDraggingBalance, setIsDraggingBalance] = useState<boolean>(false);
  const [isDraggingBet, setIsDraggingBet] = useState<boolean>(false);
  const [draggingReelIndex, setDraggingReelIndex] = useState<number | null>(null);

  const dragStartRef = useRef<{ 
    x: number; 
    y: number; 
    initialX: number; 
    initialY: number; 
    initialWidth: number; 
    initialHeight: number;
  }>({ x: 0, y: 0, initialX: 0, initialY: 0, initialWidth: 40, initialHeight: 40 });
  const previewCanvasRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '777' || pinInput === '1234' || pinInput === '0000' || pinInput === '') {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const calculatedRtp = adminConfig.totalWagered > 0
    ? ((adminConfig.totalPayout / adminConfig.totalWagered) * 100).toFixed(2)
    : '96.50';

  const houseProfit = adminConfig.totalWagered - adminConfig.totalPayout;

  // Background image file upload
  const handleBgFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUpdateAdminConfig({ bgImage: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Widget background image file upload
  const handleWidgetBgFileUpload = (
    key: 'balanceBgImage' | 'betBgImage' | 'winBoxBgImage' | 'winOverlayBgImage' | 'slotBgImage' | 'spinBgImage',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUpdateAdminConfig({ [key]: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Custom symbol image file upload
  const handleSymbolFileUpload = (type: SymbolType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const url = event.target.result as string;
          const updatedSymbols = { ...adminConfig.customSymbols, [type]: url };
          const updatedConfigs = {
            ...(adminConfig.customSymbolConfigs || {}),
            [type]: {
              url,
              objectFit: 'cover' as const,
              offsetX: 0,
              offsetY: 0,
              scale: 100,
            }
          };
          onUpdateAdminConfig({ customSymbols: updatedSymbols, customSymbolConfigs: updatedConfigs });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Update symbol image config
  const handleUpdateSymbolConfig = (type: SymbolType, updates: Partial<{ objectFit: 'cover' | 'contain'; offsetX: number; offsetY: number; scale: number }>) => {
    const currentConfig = adminConfig.customSymbolConfigs?.[type] || {
      url: adminConfig.customSymbols?.[type] || '',
      objectFit: 'cover',
      offsetX: 0,
      offsetY: 0,
      scale: 100,
    };
    const updatedConfigs = {
      ...(adminConfig.customSymbolConfigs || {}),
      [type]: { ...currentConfig, ...updates }
    };
    onUpdateAdminConfig({ customSymbolConfigs: updatedConfigs });
  };

  // Remove custom symbol
  const handleRemoveSymbol = (type: SymbolType) => {
    const updatedSymbols = { ...adminConfig.customSymbols };
    delete updatedSymbols[type];
    const updatedConfigs = { ...(adminConfig.customSymbolConfigs || {}) };
    delete updatedConfigs[type];
    onUpdateAdminConfig({ customSymbols: updatedSymbols, customSymbolConfigs: updatedConfigs });
  };

  // Snap coordinate helper according to engine grid settings
  const snapCoord = (val: number) => {
    if (!adminConfig.snapToGrid) return val;
    const step = adminConfig.gridSize || 2;
    return Math.round(val / step) * step;
  };

  // Reset layout positioning and styles
  const handleResetLayout = () => {
    onUpdateAdminConfig({
      bgImage: '/background.jpg',
      bgPosX: 0,
      bgPosY: 0,
      bgZoom: 100,
      bgFit: 'cover',
      bgAnchor: 'center',

      slotTop: 28,
      slotLeft: 5,
      slotWidth: 90,
      slotHeight: 48,
      slotRotation: 0,
      slotOpacity: 100,
      slotZIndex: 10,
      slotLocked: false,
      slotVisible: true,

      spinBottom: 4,
      spinLeft: 50,
      spinTop: undefined,
      spinScale: 100,
      spinRotation: 0,
      spinOpacity: 100,
      spinZIndex: 20,
      spinLocked: false,
      spinVisible: true,

      turboTop: 88,
      turboLeft: 80,
      turboScale: 100,
      turboRotation: 0,
      turboOpacity: 100,
      turboZIndex: 20,
      turboLocked: false,
      turboVisible: true,

      balanceTop: 3,
      balanceLeft: 3,
      balanceScale: 100,
      balanceRotation: 0,
      balanceOpacity: 100,
      balanceZIndex: 30,
      balanceLocked: false,
      balanceVisible: true,
      balanceBgColor: 'rgba(0, 0, 0, 0.7)',
      balanceTextColor: '#ffffff',
      balanceBorderColor: 'rgba(212, 175, 55, 0.4)',

      betTop: 3,
      betLeft: 55,
      betScale: 100,
      betRotation: 0,
      betOpacity: 100,
      betZIndex: 30,
      betLocked: false,
      betVisible: true,
      betBgColor: 'rgba(0, 0, 0, 0.7)',
      betTextColor: '#fde073',
      betBorderColor: 'rgba(139, 105, 20, 0.4)',

      showReelBorders: false,
      showReelBg: false,
      individualReelPositions: {},
      gridEnabled: true,
      gridSize: 2,
      snapToGrid: true,
      editorZoom: 100,
    });
  };

  // Paylines Management Functions
  const handleAddPayline = () => {
    const currentPaylines = adminConfig.paylines || [];
    const numReels = adminConfig.numReels || 5;
    const numRows = adminConfig.numRows || 3;
    const defaultPos = Array(numReels).fill(Math.floor(numRows / 2));
    const newId = String(Date.now());
    const newPayline: Payline = {
      id: newId,
      name: `Linha #${currentPaylines.length + 1}`,
      positions: defaultPos,
      payoutMultiplier: 5,
      color: PAYLINE_COLORS[currentPaylines.length % PAYLINE_COLORS.length],
      active: true,
    };
    onUpdateAdminConfig({ paylines: [...currentPaylines, newPayline] });
    setSelectedPaylineId(newId);
  };

  const handleUpdatePayline = (id: string, updates: Partial<Payline>) => {
    const updated = (adminConfig.paylines || []).map(p => p.id === id ? { ...p, ...updates } : p);
    onUpdateAdminConfig({ paylines: updated });
  };

  const handleDeletePayline = (id: string) => {
    const updated = (adminConfig.paylines || []).filter(p => p.id !== id);
    onUpdateAdminConfig({ paylines: updated });
    if (selectedPaylineId === id) setSelectedPaylineId(null);
  };

  const handleSetPaylinePosition = (id: string, colIndex: number, rowIndex: number) => {
    const currentPaylines = adminConfig.paylines || [];
    const updated = currentPaylines.map(p => {
      if (p.id !== id) return p;
      const newPos = [...p.positions];
      newPos[colIndex] = rowIndex;
      return { ...p, positions: newPos };
    });
    onUpdateAdminConfig({ paylines: updated });
  };

  // Bonus Config Update
  const handleUpdateBonusConfig = (updates: Partial<BonusConfig>) => {
    const current = adminConfig.bonusConfig || {
      enabled: true,
      scatterSymbol: 'Crown',
      triggerScatterCount: 3,
      freeSpinsCount: 10,
      bonusMultiplier: 3,
      bonusGameType: 'free_spins',
      bonusProbabilityPct: 5,
    };
    onUpdateAdminConfig({ bonusConfig: { ...current, ...updates } });
  };

  // Symbol Payout Update
  const handleUpdateSymbolPayout = (type: SymbolType, val: number) => {
    const current = adminConfig.symbolPayouts || {
      Dragon: 100, Crown: 50, Castle: 25, Lion: 15, Diamond: 10, Sword: 8, Shield: 5, Coin: 4, King: 3, Queen: 2
    };
    onUpdateAdminConfig({ symbolPayouts: { ...current, [type]: Math.max(1, val) } });
  };

  // Individual Reel Position Updates
  const handleUpdateIndividualReelPos = (reelIdx: number, updates: Partial<ReelPosition>) => {
    const currentMap = adminConfig.individualReelPositions || {};
    const currentReel = currentMap[reelIdx] || { offsetX: 0, offsetY: 0, scale: 100 };
    onUpdateAdminConfig({
      individualReelPositions: {
        ...currentMap,
        [reelIdx]: { ...currentReel, ...updates }
      }
    });
  };

  // Mouse Down Handlers
  const handleBgMouseDown = (e: React.MouseEvent) => {
    if (isDraggingSlot || isResizingSlot || isDraggingSpin || isDraggingBalance || isDraggingBet || draggingReelIndex !== null) return;
    setSelectedElement('bg');
    setIsDraggingBg(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: adminConfig.bgPosX || 0,
      initialY: adminConfig.bgPosY || 0,
      initialWidth: adminConfig.slotWidth ?? 90,
      initialHeight: adminConfig.slotHeight ?? 48,
    };
  };

  const handleSlotMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedElement('slot');
    if (adminConfig.slotLocked) return;
    setIsDraggingSlot(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: adminConfig.slotLeft ?? 5,
      initialY: adminConfig.slotTop ?? 28,
      initialWidth: adminConfig.slotWidth ?? 90,
      initialHeight: adminConfig.slotHeight ?? 48,
    };
  };

  const handleSlotResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedElement('slot');
    if (adminConfig.slotLocked) return;
    setIsResizingSlot(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: adminConfig.slotLeft ?? 5,
      initialY: adminConfig.slotTop ?? 28,
      initialWidth: adminConfig.slotWidth ?? 90,
      initialHeight: adminConfig.slotHeight ?? 48,
    };
  };

  const handleSpinMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedElement('spin');
    if (adminConfig.spinLocked) return;
    setIsDraggingSpin(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: adminConfig.spinLeft ?? 50,
      initialY: adminConfig.spinBottom ?? 4,
      initialWidth: 0,
      initialHeight: 0,
    };
  };

  const handleBalanceMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedElement('balance');
    if (adminConfig.balanceLocked) return;
    setIsDraggingBalance(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: adminConfig.balanceLeft ?? 3,
      initialY: adminConfig.balanceTop ?? 3,
      initialWidth: 0,
      initialHeight: 0,
    };
  };

  const handleBetMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedElement('bet');
    if (adminConfig.betLocked) return;
    setIsDraggingBet(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: adminConfig.betLeft ?? 55,
      initialY: adminConfig.betTop ?? 3,
      initialWidth: 0,
      initialHeight: 0,
    };
  };

  const handleReelMouseDown = (reelIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedElement('slot');
    setDraggingReelIndex(reelIdx);
    const current = adminConfig.individualReelPositions?.[reelIdx] || { offsetX: 0, offsetY: 0, scale: 100 };
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: current.offsetX || 0,
      initialY: current.offsetY || 0,
      initialWidth: current.scale || 100,
      initialHeight: 0,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!previewCanvasRef.current) return;
    const rect = previewCanvasRef.current.getBoundingClientRect();

    if (draggingReelIndex !== null) {
      const deltaX = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;
      const newOffsetX = Math.max(-100, Math.min(100, Math.round(dragStartRef.current.initialX + deltaX * 2.5)));
      const newOffsetY = Math.max(-100, Math.min(100, Math.round(dragStartRef.current.initialY + deltaY * 2.5)));
      
      const currentMap = adminConfig.individualReelPositions || {};
      const currentReel = currentMap[draggingReelIndex] || { offsetX: 0, offsetY: 0, scale: 100 };
      onUpdateAdminConfig({
        individualReelPositions: {
          ...currentMap,
          [draggingReelIndex]: { ...currentReel, offsetX: newOffsetX, offsetY: newOffsetY }
        }
      });
      return;
    }

    if (isDraggingBg) {
      const deltaX = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;
      const newX = snapCoord(Math.max(-100, Math.min(100, Math.round(dragStartRef.current.initialX + deltaX))));
      const newY = snapCoord(Math.max(-100, Math.min(100, Math.round(dragStartRef.current.initialY + deltaY))));
      onUpdateAdminConfig({ bgPosX: newX, bgPosY: newY });
    } else if (isDraggingSlot && !adminConfig.slotLocked) {
      const deltaX = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;
      const newLeft = snapCoord(Math.max(0, Math.min(100 - (adminConfig.slotWidth ?? 90), Math.round(dragStartRef.current.initialX + deltaX))));
      const newTop = snapCoord(Math.max(0, Math.min(100 - (adminConfig.slotHeight ?? 48), Math.round(dragStartRef.current.initialY + deltaY))));
      onUpdateAdminConfig({ slotLeft: newLeft, slotTop: newTop });
    } else if (isResizingSlot && !adminConfig.slotLocked) {
      const deltaX = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;
      const newWidth = snapCoord(Math.max(15, Math.min(95, Math.round(dragStartRef.current.initialWidth + deltaX))));
      const newHeight = snapCoord(Math.max(15, Math.min(95, Math.round(dragStartRef.current.initialHeight + deltaY))));
      onUpdateAdminConfig({ slotWidth: newWidth, slotHeight: newHeight });
    } else if (isDraggingSpin && !adminConfig.spinLocked) {
      const deltaX = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
      const deltaY = ((dragStartRef.current.y - e.clientY) / rect.height) * 100;
      const newLeft = snapCoord(Math.max(10, Math.min(90, Math.round(dragStartRef.current.initialX + deltaX))));
      const newBottom = snapCoord(Math.max(0, Math.min(80, Math.round(dragStartRef.current.initialY + deltaY))));
      onUpdateAdminConfig({ spinLeft: newLeft, spinBottom: newBottom });
    } else if (isDraggingBalance && !adminConfig.balanceLocked) {
      const deltaX = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;
      const newLeft = snapCoord(Math.max(0, Math.min(80, Math.round(dragStartRef.current.initialX + deltaX))));
      const newTop = snapCoord(Math.max(0, Math.min(85, Math.round(dragStartRef.current.initialY + deltaY))));
      onUpdateAdminConfig({ balanceLeft: newLeft, balanceTop: newTop });
    } else if (isDraggingBet && !adminConfig.betLocked) {
      const deltaX = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;
      const newLeft = snapCoord(Math.max(0, Math.min(80, Math.round(dragStartRef.current.initialX + deltaX))));
      const newTop = snapCoord(Math.max(0, Math.min(85, Math.round(dragStartRef.current.initialY + deltaY))));
      onUpdateAdminConfig({ betLeft: newLeft, betTop: newTop });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingBg(false);
    setIsDraggingSlot(false);
    setIsResizingSlot(false);
    setIsDraggingSpin(false);
    setIsDraggingBalance(false);
    setIsDraggingBet(false);
    setDraggingReelIndex(null);
  };

  const numReels = adminConfig.numReels || 5;
  const numRows = adminConfig.numRows || 3;
  const paylines = adminConfig.paylines || [];
  const bonusConfig = adminConfig.bonusConfig || {
    enabled: true,
    scatterSymbol: 'Crown',
    triggerScatterCount: 3,
    freeSpinsCount: 10,
    bonusMultiplier: 3,
    bonusGameType: 'free_spins',
    bonusProbabilityPct: 5,
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-0 bg-black/95 backdrop-blur-md animate-in fade-in duration-200 w-screen h-screen overflow-hidden">
      <div className="relative w-full h-full max-w-none max-h-none bg-gradient-to-b from-[#1a0505] via-[#0f0a14] to-[#050914] border-0 rounded-none shadow-none flex flex-col overflow-hidden text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-red-900/40 bg-red-950/40 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-lg font-black text-red-100 tracking-wider uppercase">
                  Painel Administrativo OddsBet
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold hidden sm:inline-block">
                  Motor do Jogo v3.0 (Tela Cheia)
                </span>
              </div>
              <p className="text-[11px] text-gray-400 hidden md:block">
                Controle total do RTP, rolagens dos slots, linhas de pagamento, multiplicadores e posicionamento do layout
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-red-900/50">
              <button
                type="button"
                onClick={() => setViewMode('tools')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
                  viewMode === 'tools'
                    ? 'bg-gradient-to-r from-red-700 to-amber-600 text-white shadow-lg border border-amber-400/50'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Exibir ferramentas de configuração em tela cheia"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Ferramentas ADM</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-gradient-to-r from-red-700 to-amber-600 text-white shadow-lg border border-amber-400/50'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Exibir ferramentas e pré-visualização lado a lado"
              >
                <Grid className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Modo Dividido</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('preview_full')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
                  viewMode === 'preview_full'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-lg border border-yellow-300 font-extrabold'
                    : 'text-amber-400 hover:text-amber-200'
                }`}
                title="Aumentar para ver somente a pré-visualização do jogo em tela cheia"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>👁️ Pré-Visualização</span>
              </button>
            </div>

            <button 
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-lg border border-red-400/40 active:scale-95 shrink-0"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Sair do ADM</span>
            </button>
          </div>
        </div>

        {!isAuthenticated ? (
          /* PIN LOGIN LOCK SCREEN */
          <div className="p-8 flex flex-col items-center justify-center space-y-4 text-center">
            <Key className="w-12 h-12 text-red-500" />
            <h3 className="text-lg font-bold text-red-200">Acesso Restrito ao Operador</h3>
            <p className="text-xs text-gray-400 max-w-sm">
              Digite o PIN de administrador para acessar o Motor do Jogo, linhas de pagamento, RTP e layout (Padrão: 777 ou deixe em branco).
            </p>

            <form onSubmit={handlePinSubmit} className="space-y-3 w-full max-w-xs">
              <input
                type="password"
                placeholder="PIN Administrativo"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-black/60 border border-red-900/50 rounded-xl text-center text-sm text-white focus:outline-none focus:border-red-500 font-mono tracking-widest"
              />
              {pinError && (
                <div className="text-xs text-red-400 flex items-center justify-center gap-1 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" /> PIN Incorreto
                </div>
              )}
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-red-700 to-amber-600 hover:from-red-600 hover:to-amber-500 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-lg cursor-pointer"
              >
                Desbloquear Painel
              </button>
            </form>
          </div>
        ) : viewMode === 'preview_full' ? (
          /* FULL SCREEN PREVIEW MODE WITH FLOATING ADMIN TOOLBAR */
          <div className="flex-1 relative flex flex-col items-center justify-between p-2 sm:p-4 overflow-hidden bg-black/95">
            
            {/* FLOATING ADMIN TOOLBAR ON TOP OF PREVIEW */}
            <div className="w-full max-w-5xl bg-black/85 backdrop-blur-xl border border-amber-500/50 rounded-2xl p-2.5 sm:p-3 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-wrap items-center justify-between gap-2.5 z-50 shrink-0">
              
              {/* Mode Switching */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setViewMode('tools')}
                  className="px-3 py-1.5 bg-black/80 hover:bg-red-950/80 border border-red-500/40 rounded-xl text-xs font-bold text-gray-200 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>Voltar às Ferramentas ADM</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  className="px-3 py-1.5 bg-black/80 hover:bg-amber-950/80 border border-amber-500/40 rounded-xl text-xs font-bold text-amber-300 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Grid className="w-3.5 h-3.5 text-amber-400" />
                  <span>Dividir Tela</span>
                </button>
              </div>

              {/* Force Win Selector */}
              <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
                <span className="text-[10px] font-bold text-gray-400 px-1.5">Forçar Resultado:</span>
                {[
                  { id: 'none', label: '🎲 Padrão' },
                  { id: 'win', label: '🏆 Vitória' },
                  { id: 'bigwin', label: '🔥 Mega Win' },
                  { id: 'loss', label: '❌ Derrota' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onUpdateAdminConfig({ forceWinType: opt.id as any })}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                      (adminConfig.forceWinType || 'none') === opt.id
                        ? 'bg-amber-500 text-black border-yellow-300 font-extrabold shadow'
                        : 'bg-black/60 text-gray-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Test Spin, Balance & Zoom */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setTestSpinning(true);
                    setTimeout(() => setTestSpinning(false), 2000);
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 rounded-xl text-xs font-black text-white flex items-center gap-1.5 shadow-lg border border-amber-400/50 cursor-pointer active:scale-95 transition"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Girar Teste</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateBalance(gameState.balance + 1000)}
                  className="px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 rounded-xl text-xs font-bold text-emerald-300 flex items-center gap-1 cursor-pointer transition"
                  title="Adicionar +R$ 1.000 para testes"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>+R$ 1k</span>
                </button>

                {/* Zoom Scale Selector */}
                <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-xl border border-white/10">
                  <span className="text-[10px] text-gray-400 font-bold">Zoom:</span>
                  {[80, 100, 120, 140].map(sc => (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => setPreviewScale(sc)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition cursor-pointer ${
                        previewScale === sc ? 'bg-amber-400 text-black font-extrabold' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {sc}%
                    </button>
                  ))}
                </div>

                {/* Metrics Overlay Toggle */}
                <button
                  type="button"
                  onClick={() => onUpdateAdminConfig({ showMetrics: !adminConfig.showMetrics })}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border transition cursor-pointer ${
                    adminConfig.showMetrics
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow'
                      : 'bg-black/60 text-gray-400 border-white/10'
                  }`}
                  title="Ativar/Desativar réguas e métricas visuais da tela"
                >
                  <Ruler className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Métricas</span>
                </button>
              </div>

            </div>

            {/* ENLARGED CENTER STAGE FRAME */}
            <div className="flex-1 w-full flex items-center justify-center overflow-hidden my-2 relative">
              <div 
                className="relative w-full h-full max-h-[85vh] aspect-[9/16] max-w-[540px] rounded-3xl bg-black border-4 border-amber-500/40 shadow-[0_0_90px_rgba(0,0,0,0.95)] overflow-hidden transition-all duration-300 flex items-center justify-center"
                style={{ transform: `scale(${previewScale / 100})`, transformOrigin: 'center center' }}
              >
                <GameStage 
                  adminConfig={adminConfig}
                  gameState={gameState}
                  grid={[
                    ['Castle', 'Sword', 'Diamond', 'Crown', 'Lion'],
                    ['Shield', 'Queen', 'Dragon', 'King', 'Coin'],
                    ['Lion', 'Diamond', 'Castle', 'Sword', 'Crown'],
                    ['Dragon', 'Castle', 'Shield', 'Queen', 'King'],
                    ['Sword', 'Coin', 'Lion', 'Diamond', 'Crown'],
                    ['Crown', 'Dragon', 'King', 'Shield', 'Castle'],
                  ].slice(0, adminConfig.numReels || 5).map(col => col.slice(0, adminConfig.numRows || 3))}
                  onSpin={() => {
                    setTestSpinning(true);
                    setTimeout(() => setTestSpinning(false), 2000);
                  }}
                  onBetChange={(delta) => {
                    const current = gameState.bet;
                    const allowed = adminConfig.allowedBets || [1, 2, 5, 10, 20, 50, 100, 250, 500];
                    const sorted = [...allowed].sort((a,b) => a - b);
                    let nextBet = current;
                    if (delta > 0) {
                      const nxt = sorted.find(v => v > current);
                      nextBet = nxt !== undefined ? nxt : sorted[sorted.length - 1];
                    } else {
                      const prv = [...sorted].reverse().find(v => v < current);
                      nextBet = prv !== undefined ? prv : sorted[0];
                    }
                  }}
                  onOpenMenu={() => {}}
                  onOpenAdmin={() => {}}
                  onOpenAutoModal={() => {}}
                  onStopAutoSpin={() => {}}
                  onClearWin={() => {}}
                  onAllReelsStopped={() => {}}
                  onToggleTurbo={() => onUpdateAdminConfig({ turboMode: !adminConfig.turboMode })}
                  onUpdateAdminConfig={onUpdateAdminConfig}
                />
              </div>
            </div>

            {/* BOTTOM QUICK TOOLBAR */}
            <div className="w-full max-w-5xl bg-black/85 backdrop-blur-xl border border-red-900/40 rounded-2xl p-2.5 shadow-lg flex flex-wrap items-center justify-between gap-2 shrink-0">
              
              {/* Spin Style Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-amber-300">Estilo de Rolagem:</span>
                <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
                  {[
                    { id: 'smooth', label: '1. De Cima pra Baixo (Padrão)' },
                    { id: 'cascade', label: '2. Slots Caindo' },
                    { id: 'random', label: '3. Aleatório' },
                    { id: 'zoom', label: '4. Zoom Effect' },
                    { id: 'turbo', label: '5. Ultra Turbo' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => onUpdateAdminConfig({ spinStyle: mode.id as any })}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                        (adminConfig.spinStyle || 'smooth') === mode.id
                          ? 'bg-amber-500 text-black border-yellow-300 font-extrabold shadow'
                          : 'bg-black/60 text-gray-400 border-white/10 hover:text-white'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bet Presets Display */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-amber-300">Apostas Disponíveis:</span>
                <div className="flex items-center gap-1 overflow-x-auto max-w-md no-scrollbar">
                  {(adminConfig.allowedBets || [1, 2, 5, 10, 20, 50, 100, 250, 500]).map((bVal) => (
                    <span
                      key={bVal}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        gameState.bet === bVal
                          ? 'bg-amber-500 text-black border-amber-300 font-extrabold'
                          : 'bg-black/60 text-gray-300 border-white/10'
                      }`}
                    >
                      R${bVal}
                    </span>
                  ))}
                </div>
              </div>

            </div>

          </div>
        ) : (
          <>
            {/* Admin Sub-Tabs */}
            <div className="flex border-b border-red-900/40 bg-black/50 overflow-x-auto no-scrollbar shrink-0">
              <button
                onClick={() => setActiveTab('metrics')}
                className={`flex-1 min-w-[110px] py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
                  activeTab === 'metrics'
                    ? 'border-red-500 text-red-400 bg-red-950/30'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Activity className="w-4 h-4 text-red-400" />
                <span>Métricas & RTP</span>
              </button>

              <button
                onClick={() => setActiveTab('engine')}
                className={`flex-1 min-w-[130px] py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
                  activeTab === 'engine'
                    ? 'border-amber-500 text-amber-300 bg-amber-950/40 shadow-inner'
                    : 'border-transparent text-amber-400/80 hover:text-amber-200'
                }`}
              >
                <Cpu className="w-4 h-4 text-amber-400" />
                <span>⚙️ Motor do Jogo</span>
              </button>

              <button
                onClick={() => setActiveTab('layout')}
                className={`flex-1 min-w-[110px] py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
                  activeTab === 'layout'
                    ? 'border-red-500 text-red-400 bg-red-950/30'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>Layout & Fundo</span>
              </button>

              <button
                onClick={() => setActiveTab('symbols')}
                className={`flex-1 min-w-[110px] py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition cursor-pointer ${
                  activeTab === 'symbols'
                    ? 'border-red-500 text-red-400 bg-red-950/30'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4 text-red-400" />
                <span>Símbolos</span>
              </button>
            </div>

            {/* TAB CONTENTS */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
              
              {/* TAB 1: METRICS & RTP */}
              {activeTab === 'metrics' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-black/50 p-3 rounded-xl border border-red-900/30">
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Giros Totais</div>
                      <div className="text-base font-black text-white font-mono mt-0.5">{adminConfig.totalSpins}</div>
                    </div>
                    <div className="bg-black/50 p-3 rounded-xl border border-red-900/30">
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Total Apostado</div>
                      <div className="text-base font-black text-amber-400 font-mono mt-0.5">R$ {adminConfig.totalWagered.toFixed(2)}</div>
                    </div>
                    <div className="bg-black/50 p-3 rounded-xl border border-red-900/30">
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Total Pago</div>
                      <div className="text-base font-black text-emerald-400 font-mono mt-0.5">R$ {adminConfig.totalPayout.toFixed(2)}</div>
                    </div>
                    <div className="bg-black/50 p-3 rounded-xl border border-red-900/30">
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Lucro da Casa</div>
                      <div className={`text-base font-black font-mono mt-0.5 ${houseProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        R$ {houseProfit.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* RTP & VOLATILITY CONTROLS */}
                  <div className="bg-black/40 p-3.5 rounded-xl border border-red-900/40 space-y-4">
                    <span className="text-xs font-bold text-red-300 uppercase tracking-widest flex items-center gap-1.5">
                      <Percent className="w-4 h-4 text-red-400" />
                      Configuração de Retorno (RTP) & Volatilidade
                    </span>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-300 font-semibold">Alvo de RTP Teórico:</span>
                        <span className="text-yellow-400 font-bold">{adminConfig.targetRtp}%</span>
                      </div>
                      <input
                        type="range"
                        min="80"
                        max="99"
                        step="0.5"
                        value={adminConfig.targetRtp}
                        onChange={(e) => onUpdateAdminConfig({ targetRtp: parseFloat(e.target.value) })}
                        className="w-full accent-red-500 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-xs text-gray-300 font-semibold">Perfil de Volatilidade:</div>
                      <div className="grid grid-cols-3 gap-2">
                        {(['low', 'medium', 'high'] as const).map((vol) => (
                          <button
                            key={vol}
                            onClick={() => onUpdateAdminConfig({ volatility: vol })}
                            className={`py-2 px-3 rounded-lg text-xs font-bold border transition capitalize cursor-pointer ${
                              adminConfig.volatility === vol
                                ? 'bg-red-900/80 border-red-500 text-white shadow-md'
                                : 'bg-black/60 border-white/10 text-gray-400 hover:border-red-500/50'
                            }`}
                          >
                            {vol === 'low' ? 'Baixa' : vol === 'medium' ? 'Média' : 'Alta'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* FORCED OUTCOME */}
                  <div className="bg-black/40 p-3.5 rounded-xl border border-red-900/40 space-y-3">
                    <span className="text-xs font-bold text-red-300 uppercase tracking-widest flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-red-400" />
                      Forçar Resultado Próximo Giro (Modo Demonstração)
                    </span>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'none', label: 'RNG Normal' },
                        { id: 'normal_win', label: 'Forçar Vitória' },
                        { id: 'big_win', label: 'Forçar Big Win' },
                        { id: 'loss', label: 'Forçar Derrota' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => onUpdateAdminConfig({ forcedOutcome: item.id as any })}
                          className={`py-2 px-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
                            adminConfig.forcedOutcome === item.id
                              ? 'bg-amber-600 border-amber-300 text-black font-extrabold shadow-md'
                              : 'bg-black/60 border-white/10 text-gray-300 hover:border-amber-500/50'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* PLAYER BALANCE */}
                  <div className="bg-black/40 p-3.5 rounded-xl border border-red-900/40 space-y-3">
                    <span className="text-xs font-bold text-red-300 uppercase tracking-widest flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-red-400" />
                      Gestão de Saldo do Jogador
                    </span>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-300">
                        Saldo Atual: <span className="text-yellow-400 font-bold text-sm">R$ {gameState.balance.toFixed(2)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onUpdateBalance(gameState.balance + 1000)}
                          className="px-3 py-1.5 bg-green-900/60 border border-green-500/50 rounded-lg text-xs font-bold text-green-300 hover:bg-green-800 transition cursor-pointer"
                        >
                          + R$ 1.000
                        </button>
                        <button
                          onClick={() => onUpdateBalance(gameState.balance + 10000)}
                          className="px-3 py-1.5 bg-green-900/60 border border-green-500/50 rounded-lg text-xs font-bold text-green-300 hover:bg-green-800 transition cursor-pointer"
                        >
                          + R$ 10.000
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <input
                        type="number"
                        placeholder="Definir Saldo exato"
                        value={customBalanceInput}
                        onChange={(e) => setCustomBalanceInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-black/60 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
                      />
                      <button
                        onClick={() => {
                          const val = parseFloat(customBalanceInput);
                          if (!isNaN(val) && val >= 0) {
                            onUpdateBalance(val);
                            setCustomBalanceInput('');
                          }
                        }}
                        className="px-4 py-1.5 bg-red-800 hover:bg-red-700 rounded-lg text-xs font-bold transition text-white cursor-pointer"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>

                  {/* CONFIGURAÇÃO DE VALORES DE APOSTA (BET PRESETS & LIMITES) */}
                  <div className="bg-black/40 p-3.5 rounded-xl border border-amber-500/40 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-amber-400" />
                        Configuração de Apostas Disponíveis
                      </span>
                      <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 font-mono font-bold">
                        {(adminConfig.allowedBets || [1, 2, 5, 10, 20, 50, 100, 250, 500]).length} Opções Ativas
                      </span>
                    </div>

                    {/* Min & Max Bet limits */}
                    <div className="grid grid-cols-2 gap-3 bg-black/50 p-3 rounded-xl border border-white/10">
                      <div>
                        <label className="text-[11px] font-bold text-gray-300 block mb-1">Aposta Mínima (R$):</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.01"
                          value={adminConfig.minBet}
                          onChange={(e) => onUpdateAdminConfig({ minBet: Math.max(0.01, parseFloat(e.target.value) || 0.01) })}
                          className="w-full px-3 py-1.5 bg-black/80 border border-white/20 rounded-lg text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-gray-300 block mb-1">Aposta Máxima (R$):</label>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={adminConfig.maxBet}
                          onChange={(e) => onUpdateAdminConfig({ maxBet: Math.max(1, parseFloat(e.target.value) || 1) })}
                          className="w-full px-3 py-1.5 bg-black/80 border border-white/20 rounded-lg text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    {/* Active Bet Value Chips */}
                    <div>
                      <span className="text-[11px] font-extrabold text-gray-200 block mb-2 uppercase tracking-wider">
                        Valores de Aposta Disponíveis no Jogo:
                      </span>
                      <div className="flex flex-wrap gap-2 p-2.5 bg-black/60 rounded-xl border border-white/10 min-h-[50px] items-center">
                        {(adminConfig.allowedBets || [1, 2, 5, 10, 20, 50, 100, 250, 500]).map((betVal) => (
                          <div
                            key={betVal}
                            className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/60 px-3 py-1 rounded-lg text-xs font-mono font-black text-amber-200 shadow-sm"
                          >
                            <span>R$ {betVal.toFixed(betVal % 1 === 0 ? 0 : 2)}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const current = adminConfig.allowedBets || [1, 2, 5, 10, 20, 50, 100, 250, 500];
                                const updated = current.filter(b => b !== betVal);
                                onUpdateAdminConfig({ allowedBets: updated });
                              }}
                              className="text-amber-400 hover:text-red-400 transition cursor-pointer p-0.5"
                              title="Remover este valor de aposta"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Add Custom Bet Value */}
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.5"
                        placeholder="Novo valor de aposta (ex: 15.00)"
                        value={customBetInput}
                        onChange={(e) => setCustomBetInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-black/70 border border-white/15 rounded-xl text-xs text-amber-200 font-mono font-bold focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = parseFloat(customBetInput);
                          if (!isNaN(val) && val > 0) {
                            const current = adminConfig.allowedBets || [1, 2, 5, 10, 20, 50, 100, 250, 500];
                            if (!current.includes(val)) {
                              const updated = [...current, val].sort((a, b) => a - b);
                              onUpdateAdminConfig({ allowedBets: updated });
                            }
                            setCustomBetInput('');
                          }
                        }}
                        className="px-4 py-1.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar Aposta</span>
                      </button>
                    </div>

                    {/* Quick Package Presets */}
                    <div className="pt-1">
                      <span className="text-[11px] font-bold text-gray-400 block mb-1.5">Pacotes Rápidos de Apostas:</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        <button
                          type="button"
                          onClick={() => onUpdateAdminConfig({ allowedBets: [1, 2, 5, 10, 20, 50, 100, 250, 500] })}
                          className="px-2.5 py-1.5 bg-black/60 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-[10px] font-bold text-amber-300 transition cursor-pointer text-left"
                        >
                          ⚡ Padrão (1-500)
                        </button>

                        <button
                          type="button"
                          onClick={() => onUpdateAdminConfig({ allowedBets: [0.5, 1, 2, 5, 10, 25, 50, 100] })}
                          className="px-2.5 py-1.5 bg-black/60 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-[10px] font-bold text-amber-300 transition cursor-pointer text-left"
                        >
                          🔥 Popular (0.50-100)
                        </button>

                        <button
                          type="button"
                          onClick={() => onUpdateAdminConfig({ allowedBets: [10, 20, 50, 100, 250, 500, 1000, 2500, 5000] })}
                          className="px-2.5 py-1.5 bg-black/60 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-[10px] font-bold text-amber-300 transition cursor-pointer text-left"
                        >
                          💎 Alta / VIP (10-5000)
                        </button>

                        <button
                          type="button"
                          onClick={() => onUpdateAdminConfig({ allowedBets: [0.1, 0.2, 0.5, 1, 2, 5, 10] })}
                          className="px-2.5 py-1.5 bg-black/60 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-[10px] font-bold text-amber-300 transition cursor-pointer text-left"
                        >
                          🪙 Micro (0.10-10)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MOTOR DO JOGO (ENGINE) */}
              {activeTab === 'engine' && (
                <div className="space-y-4">
                  {/* Engine Sub-Navigation Pills */}
                  <div className="flex gap-2 p-1 bg-black/60 rounded-xl border border-amber-500/30 overflow-x-auto no-scrollbar">
                    <button
                      onClick={() => setEngineSubTab('grid')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        engineSubTab === 'grid'
                          ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-black shadow-md'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>1. Grade & Dimensões</span>
                    </button>

                    <button
                      onClick={() => setEngineSubTab('paylines')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        engineSubTab === 'paylines'
                          ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-black shadow-md'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>2. Linhas de Pagamento</span>
                    </button>

                    <button
                      onClick={() => setEngineSubTab('bonus')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        engineSubTab === 'bonus'
                          ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-black shadow-md'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>3. Bônus do Jogo</span>
                    </button>

                    <button
                      onClick={() => setEngineSubTab('rules')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        engineSubTab === 'rules'
                          ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-black shadow-md'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>4. Regras & Payouts</span>
                    </button>
                  </div>

                  {/* SUB-TAB 1: GRID & DIMENSIONS */}
                  {engineSubTab === 'grid' && (
                    <div className="space-y-4 bg-black/40 p-4 rounded-xl border border-amber-500/30">
                      <div>
                        <h3 className="text-xs font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                          <LayoutGrid className="w-4 h-4 text-amber-400" />
                          Configuração de Colunas (Slots) e Linhas
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Ajuste o número de rolos/colunas e linhas horizontais exibidos na matriz principal do slot.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        {/* Reels / Columns Count */}
                        <div className="bg-black/50 p-3 rounded-xl border border-white/10 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-200 font-bold">Quantidade de Colunas (Reels):</span>
                            <span className="text-amber-400 font-mono font-black text-sm">{numReels} Reels</span>
                          </div>
                          <input
                            type="range"
                            min="3"
                            max="6"
                            step="1"
                            value={numReels}
                            onChange={(e) => {
                              const newNum = parseInt(e.target.value);
                              // Resize paylines positions arrays if needed
                              const updatedPaylines = paylines.map(p => {
                                let newPos = [...p.positions];
                                if (newPos.length < newNum) {
                                  while (newPos.length < newNum) newPos.push(Math.floor(numRows / 2));
                                } else if (newPos.length > newNum) {
                                  newPos = newPos.slice(0, newNum);
                                }
                                return { ...p, positions: newPos };
                              });
                              onUpdateAdminConfig({ numReels: newNum, paylines: updatedPaylines });
                            }}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                          <div className="text-[10px] text-gray-400 flex justify-between">
                            <span>3 Reels (Clássico)</span>
                            <span>5 Reels (Padrão)</span>
                            <span>6 Reels (Megaways)</span>
                          </div>
                        </div>

                        {/* Rows Count */}
                        <div className="bg-black/50 p-3 rounded-xl border border-white/10 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-200 font-bold">Quantidade de Linhas (Rows):</span>
                            <span className="text-amber-400 font-mono font-black text-sm">{numRows} Linhas</span>
                          </div>
                          <input
                            type="range"
                            min="3"
                            max="5"
                            step="1"
                            value={numRows}
                            onChange={(e) => {
                              const newRows = parseInt(e.target.value);
                              // Clamp existing paylines positions to new row bounds
                              const updatedPaylines = paylines.map(p => ({
                                ...p,
                                positions: p.positions.map(pos => Math.min(pos, newRows - 1))
                              }));
                              onUpdateAdminConfig({ numRows: newRows, paylines: updatedPaylines });
                            }}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                          <div className="text-[10px] text-gray-400 flex justify-between">
                            <span>3 Linhas</span>
                            <span>4 Linhas</span>
                            <span>5 Linhas</span>
                          </div>
                        </div>
                      </div>

                      {/* Spin Style Modes Selector */}
                      <div className="p-3.5 bg-black/60 rounded-xl border border-amber-500/40 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                            <RotateCcw className="w-4 h-4 text-amber-400" />
                            Modos de Rolagem dos Slots (Animação Ativa)
                          </label>
                          <span className="text-[11px] text-amber-400 font-bold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                            Ativo: {
                              adminConfig.spinStyle === 'cascade' ? 'Opção 2 (Cascata)' :
                              adminConfig.spinStyle === 'random' ? 'Opção 3 (Aleatório)' :
                              adminConfig.spinStyle === 'zoom' ? 'Opção 4 (Zoom Pulso)' :
                              adminConfig.spinStyle === 'turbo' ? 'Opção 5 (Super Turbo)' : 'Opção 1 (Padrão)'
                            }
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {/* Mode 1 */}
                          <button
                            type="button"
                            onClick={() => onUpdateAdminConfig({ spinStyle: 'smooth' })}
                            className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                              adminConfig.spinStyle === 'smooth' || !adminConfig.spinStyle
                                ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                                : 'bg-black/50 border-white/10 text-gray-400 hover:border-amber-400/40 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-extrabold uppercase text-amber-300">1. Padrão (Cima/Baixo)</span>
                              {(adminConfig.spinStyle === 'smooth' || !adminConfig.spinStyle) && <Check className="w-4 h-4 text-amber-400" />}
                            </div>
                            <p className="text-[10px] text-gray-300 leading-tight">
                              Roda cada coluna de cima para baixo, da esquerda para a direita em sequência.
                            </p>
                          </button>

                          {/* Mode 2 */}
                          <button
                            type="button"
                            onClick={() => onUpdateAdminConfig({ spinStyle: 'cascade' })}
                            className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                              adminConfig.spinStyle === 'cascade'
                                ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                                : 'bg-black/50 border-white/10 text-gray-400 hover:border-amber-400/40 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-extrabold uppercase text-amber-300">2. Cascata (Avalanche)</span>
                              {adminConfig.spinStyle === 'cascade' && <Check className="w-4 h-4 text-amber-400" />}
                            </div>
                            <p className="text-[10px] text-gray-300 leading-tight">
                              Os símbolos caem do topo como em cascata com física de impacto mola.
                            </p>
                          </button>

                          {/* Mode 3 */}
                          <button
                            type="button"
                            onClick={() => onUpdateAdminConfig({ spinStyle: 'random' })}
                            className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                              adminConfig.spinStyle === 'random'
                                ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                                : 'bg-black/50 border-white/10 text-gray-400 hover:border-amber-400/40 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-extrabold uppercase text-amber-300">3. Direções Alternadas</span>
                              {adminConfig.spinStyle === 'random' && <Check className="w-4 h-4 text-amber-400" />}
                            </div>
                            <p className="text-[10px] text-gray-300 leading-tight">
                              Rola com direções alternadas (cima-baixo e baixo-cima aleatório).
                            </p>
                          </button>

                          {/* Mode 4 */}
                          <button
                            type="button"
                            onClick={() => onUpdateAdminConfig({ spinStyle: 'zoom' })}
                            className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                              adminConfig.spinStyle === 'zoom'
                                ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                                : 'bg-black/50 border-white/10 text-gray-400 hover:border-amber-400/40 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-extrabold uppercase text-amber-300">4. Zoom & Pulso Glow</span>
                              {adminConfig.spinStyle === 'zoom' && <Check className="w-4 h-4 text-amber-400" />}
                            </div>
                            <p className="text-[10px] text-gray-300 leading-tight">
                              Giro com pulso expansivo de zoom e revelação com efeito luminoso.
                            </p>
                          </button>

                          {/* Mode 5 */}
                          <button
                            type="button"
                            onClick={() => onUpdateAdminConfig({ spinStyle: 'turbo' })}
                            className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                              adminConfig.spinStyle === 'turbo'
                                ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                                : 'bg-black/50 border-white/10 text-gray-400 hover:border-amber-400/40 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-extrabold uppercase text-amber-300">5. Super Turbo Snap</span>
                              {adminConfig.spinStyle === 'turbo' && <Check className="w-4 h-4 text-amber-400" />}
                            </div>
                            <p className="text-[10px] text-gray-300 leading-tight">
                              Giro ultra rápido com parada imediata e sem atrasos.
                            </p>
                          </button>
                        </div>
                      </div>

                      {/* Presets */}
                      <div className="pt-2">
                        <span className="text-[11px] font-bold text-gray-300 block mb-2">Presets Rápidos do Motor:</span>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => onUpdateAdminConfig({ numReels: 3, numRows: 3 })}
                            className="py-2 px-3 bg-black/60 border border-amber-500/30 hover:border-amber-400 rounded-lg text-xs font-bold text-amber-300 transition cursor-pointer"
                          >
                            3x3 Clássico
                          </button>
                          <button
                            onClick={() => onUpdateAdminConfig({ numReels: 5, numRows: 3 })}
                            className="py-2 px-3 bg-amber-950/60 border border-amber-500 text-amber-200 font-black rounded-lg text-xs transition cursor-pointer shadow"
                          >
                            5x3 Padrão (Favorito)
                          </button>
                          <button
                            onClick={() => onUpdateAdminConfig({ numReels: 6, numRows: 4 })}
                            className="py-2 px-3 bg-black/60 border border-amber-500/30 hover:border-amber-400 rounded-lg text-xs font-bold text-amber-300 transition cursor-pointer"
                          >
                            6x4 Expandido
                          </button>
                        </div>
                      </div>

                      {/* Visual Matrix Preview */}
                      <div className="pt-3 border-t border-white/10">
                        <span className="text-[11px] font-bold text-gray-300 block mb-2">
                          Visualização da Grade do Jogo ({numReels} x {numRows}):
                        </span>
                        <div className="p-3 bg-black/70 rounded-xl border border-amber-500/30 flex justify-center">
                          <div 
                            style={{ 
                              gridTemplateColumns: `repeat(${numReels}, minmax(0, 1fr))`,
                            }}
                            className="grid gap-2 w-full max-w-md"
                          >
                            {Array.from({ length: numReels }).map((_, colIdx) => (
                              <div key={colIdx} className="space-y-1.5 flex flex-col items-center">
                                <span className="text-[9px] text-amber-400 font-mono font-bold">R{colIdx + 1}</span>
                                {Array.from({ length: numRows }).map((_, rowIdx) => (
                                  <div 
                                    key={rowIdx}
                                    className="w-full h-10 rounded-lg bg-gradient-to-b from-[#2a1a00] to-black border border-amber-500/40 flex items-center justify-center text-[10px] font-mono text-amber-200/60 shadow-inner"
                                  >
                                    [{colIdx},{rowIdx}]
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* SUB-TAB 2: PAYLINES & CONNECTION MATRIX */}
                  {engineSubTab === 'paylines' && (
                    <div className="space-y-4 bg-black/40 p-4 rounded-xl border border-amber-500/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-amber-400" />
                            Gestão de Linhas de Pagamento & Payouts
                          </h3>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Crie, remova e conecte o caminho das posições para cada linha. Defina quanto cada linha paga.
                          </p>
                        </div>

                        <button
                          onClick={handleAddPayline}
                          className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-black rounded-lg text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>Nova Linha</span>
                        </button>
                      </div>

                      {/* Payline Selector Pills */}
                      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {paylines.map((line) => (
                          <button
                            key={line.id}
                            onClick={() => setSelectedPaylineId(line.id)}
                            style={{ borderColor: line.color }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 border flex items-center gap-1.5 transition cursor-pointer ${
                              selectedPaylineId === line.id || (!selectedPaylineId && paylines[0]?.id === line.id)
                                ? 'bg-amber-500/20 text-white shadow-md'
                                : 'bg-black/60 text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: line.color }} />
                            <span>{line.name}</span>
                            <span className="text-[10px] text-amber-400 font-mono">({line.payoutMultiplier}x)</span>
                          </button>
                        ))}
                      </div>

                      {/* Selected Payline Configurator */}
                      {(() => {
                        const activePayline = paylines.find(p => p.id === selectedPaylineId) || paylines[0];
                        if (!activePayline) {
                          return (
                            <div className="text-center py-6 text-gray-400 text-xs">
                              Nenhuma linha cadastrada. Clique em "Nova Linha" para criar a primeira.
                            </div>
                          );
                        }

                        return (
                          <div className="p-3.5 bg-black/60 rounded-xl border border-white/10 space-y-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={activePayline.active}
                                    onChange={(e) => handleUpdatePayline(activePayline.id, { active: e.target.checked })}
                                    className="w-4 h-4 rounded accent-amber-500"
                                  />
                                  <span className="text-xs font-bold text-gray-200">Ativa</span>
                                </label>

                                <input
                                  type="text"
                                  value={activePayline.name}
                                  onChange={(e) => handleUpdatePayline(activePayline.id, { name: e.target.value })}
                                  className="px-2 py-1 bg-black/80 border border-white/20 rounded text-xs font-bold text-white focus:outline-none focus:border-amber-400 flex-1 sm:w-48"
                                />
                              </div>

                              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] text-gray-300 font-bold">Multiplicador:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    max="500"
                                    value={activePayline.payoutMultiplier}
                                    onChange={(e) => handleUpdatePayline(activePayline.id, { payoutMultiplier: Math.max(1, parseFloat(e.target.value) || 1) })}
                                    className="w-16 px-2 py-1 bg-black/80 border border-amber-500/50 rounded text-xs font-mono font-bold text-amber-300 text-center"
                                  />
                                  <span className="text-xs text-amber-400 font-bold">x</span>
                                </div>

                                <div className="flex items-center gap-1.5 bg-black/50 px-2 py-1 rounded-lg border border-white/10">
                                  <span className="text-[11px] text-gray-300 font-bold">Cor:</span>
                                  <input
                                    type="color"
                                    value={activePayline.color || '#f59e0b'}
                                    onChange={(e) => handleUpdatePayline(activePayline.id, { color: e.target.value })}
                                    className="w-6 h-6 rounded cursor-pointer border border-gray-600 bg-transparent"
                                  />
                                </div>

                                <div className="flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-lg border border-white/10">
                                  <span className="text-[11px] text-gray-300 font-bold">Espessura:</span>
                                  <input
                                    type="range"
                                    min="2"
                                    max="30"
                                    value={activePayline.strokeWidth || 10}
                                    onChange={(e) => handleUpdatePayline(activePayline.id, { strokeWidth: parseInt(e.target.value) })}
                                    className="w-20 accent-amber-500 cursor-pointer"
                                  />
                                  <span className="text-xs font-mono font-bold text-amber-300 w-8">{activePayline.strokeWidth || 10}px</span>
                                </div>

                                <button
                                  onClick={() => handleDeletePayline(activePayline.id)}
                                  className="p-1.5 bg-red-950/80 border border-red-500/40 hover:bg-red-900 text-red-300 rounded-lg transition cursor-pointer"
                                  title="Remover Linha"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Interactive Matrix Path Connector */}
                            <div className="space-y-2">
                              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                                <Palette className="w-3.5 h-3.5" />
                                Conexão de Posições (Clique na célula para definir o caminho da linha):
                              </span>

                              <div className="p-3 bg-black/80 rounded-xl border border-amber-500/20 relative overflow-hidden">
                                <div 
                                  style={{ gridTemplateColumns: `repeat(${numReels}, minmax(0, 1fr))` }}
                                  className="grid gap-2 relative z-10"
                                >
                                  {Array.from({ length: numReels }).map((_, colIdx) => {
                                    const selectedRow = activePayline.positions[colIdx] ?? 0;

                                    return (
                                      <div key={colIdx} className="space-y-1.5 flex flex-col items-center">
                                        <span className="text-[10px] font-bold text-amber-400 font-mono">Coluna {colIdx + 1}</span>
                                        {Array.from({ length: numRows }).map((_, rowIdx) => {
                                          const isSelected = selectedRow === rowIdx;

                                          return (
                                            <button
                                              key={rowIdx}
                                              type="button"
                                              onClick={() => handleSetPaylinePosition(activePayline.id, colIdx, rowIdx)}
                                              style={{
                                                backgroundColor: isSelected ? activePayline.color : 'rgba(0,0,0,0.6)',
                                                borderColor: isSelected ? '#ffffff' : 'rgba(255,255,255,0.1)',
                                              }}
                                              className={`w-full h-11 rounded-lg border flex flex-col items-center justify-center transition cursor-pointer ${
                                                isSelected
                                                  ? 'text-white font-extrabold shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-105'
                                                  : 'text-gray-400 hover:border-amber-400/50 hover:text-white'
                                              }`}
                                            >
                                              <span className="text-[10px] font-mono">Linha {rowIdx + 1}</span>
                                              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* SEÇÃO DE MÍDIA E ANIMAÇÃO DE VITÓRIA DA LINHA (Foto ou Vídeo MP4/WebM) */}
                            <div className="p-3.5 bg-black/80 rounded-xl border border-amber-500/30 space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                                <span className="text-xs font-black text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                                  <Film className="w-4 h-4 text-amber-400" />
                                  Mídia & Animação de Vitória
                                </span>
                                <div className="flex items-center gap-1">
                                  {[
                                    { id: 'none', label: 'Sem Mídia' },
                                    { id: 'image', label: '🖼️ Foto/Imagem' },
                                    { id: 'video', label: '🎬 Vídeo MP4/WebM' },
                                  ].map(mType => (
                                    <button
                                      key={mType.id}
                                      type="button"
                                      onClick={() => handleUpdatePayline(activePayline.id, { winMediaType: mType.id as any })}
                                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                        (activePayline.winMediaType || 'none') === mType.id
                                          ? 'bg-amber-500 text-black border-yellow-300 font-extrabold shadow'
                                          : 'bg-black/60 text-gray-400 border-white/10 hover:text-white'
                                      }`}
                                    >
                                      {mType.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {activePayline.winMediaType && activePayline.winMediaType !== 'none' && (
                                <div className="space-y-3 pt-1">
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-gray-300 flex items-center justify-between">
                                      <span>URL da Mídia ({activePayline.winMediaType === 'video' ? 'Vídeo MP4/WebM' : 'Imagem PNG/JPG/GIF'}):</span>
                                      <span className="text-[10px] text-amber-400 font-mono">Link público</span>
                                    </label>
                                    <input
                                      type="text"
                                      placeholder={activePayline.winMediaType === 'video' ? 'https://exemplo.com/efeito-vitoria.mp4' : 'https://exemplo.com/imagem.png'}
                                      value={activePayline.winMediaUrl || ''}
                                      onChange={(e) => handleUpdatePayline(activePayline.id, { winMediaUrl: e.target.value })}
                                      className="w-full px-3 py-1.5 bg-black border border-white/20 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                                    />

                                    {/* Quick Preset Samples */}
                                    <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                                      <span className="text-[10px] text-gray-400 shrink-0 font-bold">Exemplos:</span>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdatePayline(activePayline.id, {
                                          winMediaType: 'video',
                                          winMediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-golden-particles-explosion-41543-large.mp4',
                                          winAnimationType: 'bounce',
                                          winMediaFit: 'cover'
                                        })}
                                        className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/50 rounded text-[10px] text-amber-300 font-bold shrink-0 cursor-pointer"
                                      >
                                        🎬 Ouro em Partículas
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdatePayline(activePayline.id, {
                                          winMediaType: 'image',
                                          winMediaUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
                                          winAnimationType: 'pulse',
                                          winMediaFit: 'contain'
                                        })}
                                        className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/50 rounded text-[10px] text-amber-300 font-bold shrink-0 cursor-pointer"
                                      >
                                        🖼️ Troféu Néon
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdatePayline(activePayline.id, {
                                          winMediaType: 'image',
                                          winMediaUrl: 'https://images.unsplash.com/photo-1533158307587-828f0a76ef46?auto=format&fit=crop&w=400&q=80',
                                          winAnimationType: 'shake',
                                          winMediaFit: 'cover'
                                        })}
                                        className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/50 rounded text-[10px] text-amber-300 font-bold shrink-0 cursor-pointer"
                                      >
                                        🖼️ Chuva Dourada
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    <div className="space-y-1">
                                      <span className="text-[11px] font-bold text-gray-300 block">Estilo da Animação:</span>
                                      <select
                                        value={activePayline.winAnimationType || 'pulse'}
                                        onChange={(e) => handleUpdatePayline(activePayline.id, { winAnimationType: e.target.value as any })}
                                        className="w-full px-2.5 py-1.5 bg-black border border-white/20 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                                      >
                                        <option value="pulse">⚡ Pulsar Néon</option>
                                        <option value="bounce">🏀 Bounce Saltitante</option>
                                        <option value="glow">🔥 Glow Flamejante</option>
                                        <option value="shake">📳 Shake Terremoto</option>
                                      </select>
                                    </div>

                                    <div className="space-y-1">
                                      <span className="text-[11px] font-bold text-gray-300 block">Ajuste da Mídia:</span>
                                      <select
                                        value={activePayline.winMediaFit || 'cover'}
                                        onChange={(e) => handleUpdatePayline(activePayline.id, { winMediaFit: e.target.value as any })}
                                        className="w-full px-2.5 py-1.5 bg-black border border-white/20 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                                      >
                                        <option value="cover">Preencher (Cover)</option>
                                        <option value="contain">Conter Completo (Contain)</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* SEÇÃO DE POSIÇÃO DO VALOR DO GANHO (ARRASTÁVEL) */}
                            <div className="p-3.5 bg-black/80 rounded-xl border border-amber-500/30 space-y-3">
                              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                <span className="text-xs font-black text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                                  <Move className="w-4 h-4 text-amber-400" />
                                  Posição do Valor do Ganho (Badge)
                                </span>
                                <span className="text-[10px] text-cyan-300 font-bold bg-cyan-950/80 border border-cyan-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <Move className="w-3 h-3" />
                                  <span>Arrastável com o Mouse/Toque</span>
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[11px] font-bold text-gray-300">
                                    <span>Posição X (% Horizontal):</span>
                                    <span className="font-mono text-amber-300">{activePayline.winBadgePosX ?? 50}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={activePayline.winBadgePosX ?? 50}
                                    onChange={(e) => handleUpdatePayline(activePayline.id, { winBadgePosX: parseInt(e.target.value) })}
                                    className="w-full accent-amber-500 cursor-pointer"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <div className="flex justify-between text-[11px] font-bold text-gray-300">
                                    <span>Posição Y (% Vertical):</span>
                                    <span className="font-mono text-amber-300">{activePayline.winBadgePosY ?? 50}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={activePayline.winBadgePosY ?? 50}
                                    onChange={(e) => handleUpdatePayline(activePayline.id, { winBadgePosY: parseInt(e.target.value) })}
                                    className="w-full accent-amber-500 cursor-pointer"
                                  />
                                </div>
                              </div>

                              {/* Presets de Posição Rápida */}
                              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                <span className="text-[10px] text-gray-400 font-bold">Atalhos:</span>
                                {[
                                  { label: '📌 Centro', x: 50, y: 50 },
                                  { label: '🔝 Topo', x: 50, y: 15 },
                                  { label: '🔻 Base', x: 50, y: 85 },
                                  { label: '⬅️ Esquerda', x: 20, y: 50 },
                                  { label: '➡️ Direita', x: 80, y: 50 },
                                ].map(preset => (
                                  <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => handleUpdatePayline(activePayline.id, { winBadgePosX: preset.x, winBadgePosY: preset.y })}
                                    className="px-2 py-1 bg-black/60 hover:bg-amber-500/20 border border-white/10 hover:border-amber-400/50 rounded-lg text-[10px] font-bold text-gray-300 hover:text-white transition cursor-pointer"
                                  >
                                    {preset.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* SUB-TAB 3: BONUS CONFIGURATION */}
                  {engineSubTab === 'bonus' && (
                    <div className="space-y-4 bg-black/40 p-4 rounded-xl border border-amber-500/30">
                      <div>
                        <h3 className="text-xs font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                          <Gift className="w-4 h-4 text-amber-400" />
                          Criação & Regras do Bônus do Jogo
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Configure o símbolo acionador (Scatter), número de Rodadas Grátis e multiplicadores do modo bônus.
                        </p>
                      </div>

                      {/* Enable / Disable Bonus Toggle */}
                      <div className="p-3 bg-black/60 rounded-xl border border-white/10 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-white block">Ativar Modo Bônus no Slot:</span>
                          <span className="text-[10px] text-gray-400 block">Permite que combinações de Scatter liberem o modo especial</span>
                        </div>
                        <button
                          onClick={() => handleUpdateBonusConfig({ enabled: !bonusConfig.enabled })}
                          className={`px-4 py-1.5 rounded-lg text-xs font-black border transition cursor-pointer ${
                            bonusConfig.enabled
                              ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                              : 'bg-red-950 border-red-600 text-red-300'
                          }`}
                        >
                          {bonusConfig.enabled ? 'SISTEMA ATIVO' : 'DESATIVADO'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {/* Scatter Symbol Selector */}
                        <div className="p-3 bg-black/50 rounded-xl border border-white/10 space-y-2">
                          <label className="text-xs font-bold text-amber-300 block">
                            Símbolo Gatilho do Bônus (Scatter):
                          </label>
                          <select
                            value={bonusConfig.scatterSymbol}
                            onChange={(e) => handleUpdateBonusConfig({ scatterSymbol: e.target.value as SymbolType })}
                            className="w-full px-3 py-2 bg-black/80 border border-amber-500/50 rounded-lg text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                          >
                            {SYMBOL_NAMES.map(s => (
                              <option key={s.type} value={s.type}>{s.label} ({s.type})</option>
                            ))}
                          </select>
                        </div>

                        {/* Trigger Scatter Count */}
                        <div className="p-3 bg-black/50 rounded-xl border border-white/10 space-y-2">
                          <label className="text-xs font-bold text-amber-300 block">
                            Mínimo de Símbolos para Ativar Bônus:
                          </label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {[2, 3, 4, 5].map((cnt) => (
                              <button
                                key={cnt}
                                onClick={() => handleUpdateBonusConfig({ triggerScatterCount: cnt })}
                                className={`py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                                  bonusConfig.triggerScatterCount === cnt
                                    ? 'bg-amber-600 border-amber-300 text-black font-extrabold shadow'
                                    : 'bg-black/60 border-white/10 text-gray-300 hover:border-amber-400/50'
                                }`}
                              >
                                {cnt} Scatters
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Free Spins Count */}
                        <div className="p-3 bg-black/50 rounded-xl border border-white/10 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-200 font-bold">Qtd. de Rodadas Grátis (Free Spins):</span>
                            <span className="text-amber-400 font-bold">{bonusConfig.freeSpinsCount} Giros</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="30"
                            step="5"
                            value={bonusConfig.freeSpinsCount}
                            onChange={(e) => handleUpdateBonusConfig({ freeSpinsCount: parseInt(e.target.value) })}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                        </div>

                        {/* Bonus Multiplier */}
                        <div className="p-3 bg-black/50 rounded-xl border border-white/10 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-200 font-bold">Multiplicador do Bônus:</span>
                            <span className="text-amber-400 font-bold">{bonusConfig.bonusMultiplier}x</span>
                          </div>
                          <input
                            type="range"
                            min="2"
                            max="10"
                            step="1"
                            value={bonusConfig.bonusMultiplier}
                            onChange={(e) => handleUpdateBonusConfig({ bonusMultiplier: parseInt(e.target.value) })}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Probability Slider */}
                      <div className="p-3 bg-black/50 rounded-xl border border-white/10 space-y-2 pt-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-200 font-bold">Probabilidade Teórica do Bônus Ocorrer (% por giro):</span>
                          <span className="text-amber-400 font-mono font-bold text-sm">{bonusConfig.bonusProbabilityPct}%</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          step="1"
                          value={bonusConfig.bonusProbabilityPct}
                          onChange={(e) => handleUpdateBonusConfig({ bonusProbabilityPct: parseInt(e.target.value) })}
                          className="w-full accent-amber-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 4: RULES & SYMBOL PAYOUTS */}
                  {engineSubTab === 'rules' && (
                    <div className="space-y-4 bg-black/40 p-4 rounded-xl border border-amber-500/30">
                      <div>
                        <h3 className="text-xs font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-amber-400" />
                          Regras do Jogo e Tabela de Multiplicadores
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Edite o texto de regras oficiais exibido no menu do jogador e quanto paga cada símbolo individual.
                        </p>
                      </div>

                      {/* Editable Game Rules */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-200 block">
                          Texto das Regras do Jogo (Exibido aos Jogadores):
                        </label>
                        <textarea
                          rows={5}
                          value={adminConfig.gameRulesText || ''}
                          onChange={(e) => onUpdateAdminConfig({ gameRulesText: e.target.value })}
                          className="w-full p-3 bg-black/80 border border-white/20 rounded-xl text-xs text-gray-200 font-sans focus:outline-none focus:border-amber-400 leading-relaxed"
                          placeholder="Digite as regras e instruções do jogo..."
                        />
                      </div>

                      {/* Symbol Payouts Multipliers Table */}
                      <div className="space-y-2 pt-2 border-t border-white/10">
                        <span className="text-xs font-bold text-amber-300 block">
                          Multiplicador Base de Pagamento por Símbolo (x Aposta por linha):
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {SYMBOL_NAMES.map(({ type, label }) => {
                            const currentPayout = adminConfig.symbolPayouts?.[type] ?? 10;

                            return (
                              <div key={type} className="p-2.5 bg-black/60 border border-white/10 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-black border border-amber-500/40 flex items-center justify-center overflow-hidden shrink-0">
                                    <SlotSymbol type={type} customImage={adminConfig.customSymbols?.[type]} symbolConfig={adminConfig.customSymbolConfigs?.[type]} />
                                  </div>
                                  <span className="text-xs font-bold text-white">{label}</span>
                                </div>

                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="1"
                                    max="1000"
                                    value={currentPayout}
                                    onChange={(e) => handleUpdateSymbolPayout(type, parseFloat(e.target.value) || 1)}
                                    className="w-16 px-2 py-1 bg-black/80 border border-amber-500/50 rounded-lg text-xs font-mono font-bold text-amber-300 text-center"
                                  />
                                  <span className="text-xs text-amber-400 font-bold">x</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              )}

              {/* TAB 3: GAME ENGINE LAYOUT & STAGE INSPECTOR */}
              {activeTab === 'layout' && (
                <div className="space-y-4">
                  {/* Top Engine Control Bar */}
                  <div className="p-3 bg-black/60 rounded-xl border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-amber-400 animate-pulse" />
                      <div>
                        <h3 className="text-xs font-black text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                          Inspetor de Layout (Engine Mobile 9:16)
                        </h3>
                        <p className="text-[10px] text-gray-400">
                          Edição em tempo real com precisão de pixel. Selecione e arraste na tela ou use os controles numéricos.
                        </p>
                      </div>
                    </div>

                    {/* Engine Toolbar Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Grid Toggle */}
                      <button
                        type="button"
                        onClick={() => onUpdateAdminConfig({ gridEnabled: !adminConfig.gridEnabled })}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border transition cursor-pointer ${
                          adminConfig.gridEnabled
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                            : 'bg-black/40 text-gray-400 border-white/10'
                        }`}
                      >
                        <Grid className="w-3.5 h-3.5" />
                        <span>Gradil ({adminConfig.gridEnabled ? 'ON' : 'OFF'})</span>
                      </button>

                      {/* Screen Metrics Toggle */}
                      <button
                        type="button"
                        onClick={() => onUpdateAdminConfig({ showMetrics: !adminConfig.showMetrics })}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border transition cursor-pointer ${
                          adminConfig.showMetrics
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.3)] font-black'
                            : 'bg-black/40 text-gray-400 border-white/10'
                        }`}
                        title="Ativar métricas visuais e réguas de medida da tela"
                      >
                        <Ruler className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Métricas 100% ({adminConfig.showMetrics ? 'Ativas' : 'Off'})</span>
                      </button>

                      {/* Snap to Grid Toggle */}
                      <button
                        type="button"
                        onClick={() => onUpdateAdminConfig({ snapToGrid: !adminConfig.snapToGrid })}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border transition cursor-pointer ${
                          adminConfig.snapToGrid
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                            : 'bg-black/40 text-gray-400 border-white/10'
                        }`}
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                        <span>Snap Alinhamento ({adminConfig.snapToGrid ? 'Ativo' : 'Livre'})</span>
                      </button>

                      {/* Grid Size Step Selector */}
                      <div className="flex items-center gap-1 bg-black/80 px-2 py-1 rounded-lg border border-white/10">
                        <span className="text-[10px] text-gray-400 font-bold">Passo:</span>
                        {[1, 2, 5, 10].map(step => (
                          <button
                            key={step}
                            type="button"
                            onClick={() => onUpdateAdminConfig({ gridSize: step })}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black font-mono transition cursor-pointer ${
                              (adminConfig.gridSize || 2) === step
                                ? 'bg-amber-400 text-black'
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            {step}%
                          </button>
                        ))}
                      </div>

                      {/* Spin Test Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setTestSpinning(true);
                          setTimeout(() => setTestSpinning(false), 2000);
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 rounded-lg text-xs font-extrabold text-white flex items-center gap-1.5 shadow cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Testar Giro</span>
                      </button>

                      {/* Reset Layout */}
                      <button
                        type="button"
                        onClick={handleResetLayout}
                        className="px-2.5 py-1.5 bg-black/60 border border-red-800/40 hover:bg-red-950/60 rounded-lg text-xs font-bold text-gray-300 flex items-center gap-1 transition cursor-pointer"
                        title="Restaurar Posicionamento Padrão"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>

                  {/* Main Inspector Grid Layout: Left Canvas Stage Preview, Right Numeric Inspector */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    
                    {/* LEFT COLUMN: 100% Faithful Virtual Canvas Stage Preview */}
                    <div className="lg:col-span-5 flex flex-col items-center space-y-2">
                      <div className="text-xs font-bold text-gray-300 flex items-center justify-between w-full max-w-[340px] px-1">
                        <span className="flex items-center gap-1">
                          <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Pré-visualização do Canvas Base</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateAdminConfig({ showMetrics: !adminConfig.showMetrics })}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold flex items-center gap-1 border transition cursor-pointer ${
                            adminConfig.showMetrics
                              ? 'bg-cyan-400 text-black border-cyan-300 font-extrabold shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                              : 'bg-black/60 text-cyan-400 border-cyan-500/40 hover:bg-cyan-950'
                          }`}
                          title="Ativar/Desativar réguas e métricas da tela"
                        >
                          <Ruler className="w-3 h-3" />
                          <span>{adminConfig.showMetrics ? '📏 Métricas ON' : '📏 Métricas OFF'}</span>
                        </button>
                      </div>

                      {/* Canvas Container */}
                      <div className="relative w-full aspect-[9/16] max-w-[340px] mx-auto rounded-2xl bg-black overflow-hidden select-none shadow-[0_0_35px_rgba(0,0,0,0.9)] border-2 border-amber-500/40">
                        <GameStage 
                          adminConfig={adminConfig}
                          gameState={gameState}
                          grid={[
                            ['Castle', 'Sword', 'Diamond', 'Crown', 'Lion'],
                            ['Shield', 'Queen', 'Dragon', 'King', 'Coin'],
                            ['Lion', 'Diamond', 'Castle', 'Sword', 'Crown'],
                            ['Dragon', 'Castle', 'Shield', 'Queen', 'King'],
                            ['Sword', 'Coin', 'Lion', 'Diamond', 'Crown'],
                            ['Crown', 'Dragon', 'King', 'Shield', 'Castle'],
                          ].slice(0, numReels).map(col => col.slice(0, numRows))}
                          onSpin={() => {
                            setTestSpinning(true);
                            setTimeout(() => setTestSpinning(false), 2000);
                          }}
                          onBetChange={() => {}}
                          onOpenMenu={() => {}}
                          onOpenAdmin={() => {}}
                          isEditing={true}
                          selectedElement={selectedElement}
                          onSelectElement={setSelectedElement}
                          onUpdateAdminConfig={onUpdateAdminConfig}
                        />
                      </div>

                      <p className="text-[10px] text-gray-400 text-center italic">
                        Dica: Selecione qualquer elemento para editar posição, tamanho e âncora no painel ao lado.
                      </p>
                    </div>

                    {/* RIGHT COLUMN: Numeric Engine Inspector Panel */}
                    <div className="lg:col-span-7 bg-black/50 p-4 rounded-2xl border border-white/10 space-y-4">
                      {/* Element Inspector Tabs */}
                      <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-3 gap-2">
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Sliders className="w-4 h-4 text-amber-400" />
                          <span>Inspetor do Elemento:</span>
                        </span>

                        <div className="flex flex-wrap gap-1">
                          {[
                            { id: 'slot', label: '🎰 Slot Machine' },
                            { id: 'spin', label: '🎯 Botão Girar' },
                            { id: 'turbo', label: '⚡ Botão Turbo' },
                            { id: 'balance', label: '💰 Saldo' },
                            { id: 'bet', label: '💵 Aposta' },
                            { id: 'winBox', label: '🏆 Ganho (Fixo)' },
                            { id: 'winOverlay', label: '🎉 Ganho (Overlay)' },
                            { id: 'bg', label: '🖼️ Fundo da Tela' },
                          ].map(tab => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setSelectedElement(tab.id as any)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                selectedElement === tab.id
                                  ? 'bg-amber-500 text-black shadow-md font-black'
                                  : 'bg-black/60 text-gray-300 hover:bg-white/10 border border-white/5'
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* INSPECTOR CONTROLS ACCORDING TO SELECTED ELEMENT */}

                      {/* A. SLOT MACHINE INSPECTOR */}
                      {selectedElement === 'slot' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30">
                            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                              <span>Configurações Numéricas do Quadro de Slots</span>
                            </span>
                            
                            <div className="flex items-center gap-2">
                              {/* Lock Toggle */}
                              <button
                                type="button"
                                onClick={() => onUpdateAdminConfig({ slotLocked: !adminConfig.slotLocked })}
                                className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 border transition cursor-pointer ${
                                  adminConfig.slotLocked ? 'bg-red-500/20 text-red-300 border-red-500/50' : 'bg-black/40 text-gray-300 border-white/10'
                                }`}
                              >
                                {adminConfig.slotLocked ? <Lock className="w-3 h-3 text-red-400" /> : <Unlock className="w-3 h-3 text-gray-400" />}
                                <span>{adminConfig.slotLocked ? 'Trava Ativa' : 'Livre'}</span>
                              </button>

                              {/* Visible Toggle */}
                              <button
                                type="button"
                                onClick={() => onUpdateAdminConfig({ slotVisible: adminConfig.slotVisible === false })}
                                className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 border transition cursor-pointer ${
                                  adminConfig.slotVisible !== false ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : 'bg-red-500/20 text-red-300 border-red-500/50'
                                }`}
                              >
                                {adminConfig.slotVisible !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                <span>{adminConfig.slotVisible !== false ? 'Visível' : 'Oculto'}</span>
                              </button>
                            </div>
                          </div>

                          {/* Transform Coordinates Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {/* Left X */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Posição X (Left):</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={adminConfig.slotLeft ?? 5}
                                  onChange={(e) => onUpdateAdminConfig({ slotLeft: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
                                  className="w-14 px-1 py-0.5 bg-black border border-amber-500/50 rounded text-right text-amber-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="80"
                                value={adminConfig.slotLeft ?? 5}
                                onChange={(e) => onUpdateAdminConfig({ slotLeft: parseInt(e.target.value) })}
                                className="w-full accent-amber-500 cursor-pointer"
                              />
                            </div>

                            {/* Top Y */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Posição Y (Top):</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={adminConfig.slotTop ?? 28}
                                  onChange={(e) => onUpdateAdminConfig({ slotTop: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
                                  className="w-14 px-1 py-0.5 bg-black border border-amber-500/50 rounded text-right text-amber-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="80"
                                value={adminConfig.slotTop ?? 28}
                                onChange={(e) => onUpdateAdminConfig({ slotTop: parseInt(e.target.value) })}
                                className="w-full accent-amber-500 cursor-pointer"
                              />
                            </div>

                            {/* Width % */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Largura (Width %):</span>
                                <input
                                  type="number"
                                  min="15"
                                  max="95"
                                  value={adminConfig.slotWidth ?? 90}
                                  onChange={(e) => onUpdateAdminConfig({ slotWidth: Math.max(15, Math.min(95, parseInt(e.target.value) || 90)) })}
                                  className="w-14 px-1 py-0.5 bg-black border border-amber-500/50 rounded text-right text-amber-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="15"
                                max="95"
                                value={adminConfig.slotWidth ?? 90}
                                onChange={(e) => onUpdateAdminConfig({ slotWidth: parseInt(e.target.value) })}
                                className="w-full accent-amber-500 cursor-pointer"
                              />
                            </div>

                            {/* Height % */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Altura (Height %):</span>
                                <input
                                  type="number"
                                  min="15"
                                  max="95"
                                  value={adminConfig.slotHeight ?? 48}
                                  onChange={(e) => onUpdateAdminConfig({ slotHeight: Math.max(15, Math.min(95, parseInt(e.target.value) || 48)) })}
                                  className="w-14 px-1 py-0.5 bg-black border border-amber-500/50 rounded text-right text-amber-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="15"
                                max="95"
                                value={adminConfig.slotHeight ?? 48}
                                onChange={(e) => onUpdateAdminConfig({ slotHeight: parseInt(e.target.value) })}
                                className="w-full accent-amber-500 cursor-pointer"
                              />
                            </div>

                            {/* Scale % */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Escala / Zoom (%):</span>
                                <input
                                  type="number"
                                  min="50"
                                  max="200"
                                  value={adminConfig.slotScale ?? 100}
                                  onChange={(e) => onUpdateAdminConfig({ slotScale: parseInt(e.target.value) || 100 })}
                                  className="w-14 px-1 py-0.5 bg-black border border-amber-500/50 rounded text-right text-amber-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="50"
                                max="200"
                                value={adminConfig.slotScale ?? 100}
                                onChange={(e) => onUpdateAdminConfig({ slotScale: parseInt(e.target.value) })}
                                className="w-full accent-amber-500 cursor-pointer"
                              />
                            </div>

                            {/* Rotation deg */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Rotação (º):</span>
                                <input
                                  type="number"
                                  min="-180"
                                  max="180"
                                  value={adminConfig.slotRotation || 0}
                                  onChange={(e) => onUpdateAdminConfig({ slotRotation: parseInt(e.target.value) || 0 })}
                                  className="w-14 px-1 py-0.5 bg-black border border-amber-500/50 rounded text-right text-amber-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="-180"
                                max="180"
                                value={adminConfig.slotRotation || 0}
                                onChange={(e) => onUpdateAdminConfig({ slotRotation: parseInt(e.target.value) })}
                                className="w-full accent-amber-500 cursor-pointer"
                              />
                            </div>

                            {/* Opacity % */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Opacidade (%):</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={adminConfig.slotOpacity ?? 100}
                                  onChange={(e) => onUpdateAdminConfig({ slotOpacity: parseInt(e.target.value) || 100 })}
                                  className="w-14 px-1 py-0.5 bg-black border border-amber-500/50 rounded text-right text-amber-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={adminConfig.slotOpacity ?? 100}
                                onChange={(e) => onUpdateAdminConfig({ slotOpacity: parseInt(e.target.value) })}
                                className="w-full accent-amber-500 cursor-pointer"
                              />
                            </div>

                            {/* Z-Index */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Camada (Z-Index):</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="50"
                                  value={adminConfig.slotZIndex ?? 10}
                                  onChange={(e) => onUpdateAdminConfig({ slotZIndex: parseInt(e.target.value) || 10 })}
                                  className="w-14 px-1 py-0.5 bg-black border border-amber-500/50 rounded text-right text-amber-300 font-mono text-xs"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Spin Style Selector & Options */}
                          <div className="space-y-2 pt-2 border-t border-white/10">
                            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                              Estilo de Animação de Giro dos Slots
                            </span>

                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { id: 'smooth', name: 'Suave Standard', badge: 'Smooth' },
                                { id: 'turbo', name: 'Hyper Turbo', badge: 'Fast' },
                                { id: 'cascade', name: 'Cascata Queda', badge: 'Gravity' },
                              ].map(s => (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => onUpdateAdminConfig({ spinStyle: s.id as any })}
                                  className={`p-2 rounded-xl border text-left cursor-pointer transition ${
                                    (adminConfig.spinStyle || 'smooth') === s.id
                                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-extrabold'
                                      : 'bg-black/60 border-white/10 text-gray-400 hover:bg-white/5'
                                  }`}
                                >
                                  <div className="text-xs">{s.name}</div>
                                  <div className="text-[9px] text-gray-400 uppercase font-mono">{s.badge}</div>
                                </button>
                              ))}
                            </div>

                            <div className="flex flex-wrap gap-4 pt-1">
                              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-200">
                                <input
                                  type="checkbox"
                                  checked={!!adminConfig.showReelBorders}
                                  onChange={(e) => onUpdateAdminConfig({ showReelBorders: e.target.checked })}
                                  className="w-4 h-4 accent-amber-500 rounded"
                                />
                                <span>Bordas nas Colunas</span>
                              </label>

                              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-200">
                                <input
                                  type="checkbox"
                                  checked={!!adminConfig.showReelBg}
                                  onChange={(e) => onUpdateAdminConfig({ showReelBg: e.target.checked })}
                                  className="w-4 h-4 accent-amber-500 rounded"
                                />
                                <span>Fundo Escuro nas Colunas</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* B. SPIN BUTTON INSPECTOR */}
                      {selectedElement === 'spin' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between bg-red-500/10 p-2.5 rounded-xl border border-red-500/30">
                            <span className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                              <span>Configurações do Botão Girar</span>
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onUpdateAdminConfig({ spinLocked: !adminConfig.spinLocked })}
                                className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 border transition cursor-pointer ${
                                  adminConfig.spinLocked ? 'bg-red-500/20 text-red-300 border-red-500/50' : 'bg-black/40 text-gray-300 border-white/10'
                                }`}
                              >
                                {adminConfig.spinLocked ? <Lock className="w-3 h-3 text-red-400" /> : <Unlock className="w-3 h-3 text-gray-400" />}
                                <span>{adminConfig.spinLocked ? 'Trava Ativa' : 'Livre'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onUpdateAdminConfig({ spinVisible: adminConfig.spinVisible === false })}
                                className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 border transition cursor-pointer ${
                                  adminConfig.spinVisible !== false ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : 'bg-red-500/20 text-red-300 border-red-500/50'
                                }`}
                              >
                                {adminConfig.spinVisible !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                <span>{adminConfig.spinVisible !== false ? 'Visível' : 'Oculto'}</span>
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {/* X Left */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Posição X (Left %):</span>
                                <input
                                  type="number"
                                  min="10"
                                  max="90"
                                  value={adminConfig.spinLeft ?? 50}
                                  onChange={(e) => onUpdateAdminConfig({ spinLeft: Math.max(10, Math.min(90, parseInt(e.target.value) || 50)) })}
                                  className="w-14 px-1 py-0.5 bg-black border border-red-500/50 rounded text-right text-red-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="10"
                                max="90"
                                value={adminConfig.spinLeft ?? 50}
                                onChange={(e) => onUpdateAdminConfig({ spinLeft: parseInt(e.target.value) })}
                                className="w-full accent-red-500 cursor-pointer"
                              />
                            </div>

                            {/* Y Bottom */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Posição Y (Bottom %):</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="80"
                                  value={adminConfig.spinBottom ?? 4}
                                  onChange={(e) => onUpdateAdminConfig({ spinBottom: Math.max(0, Math.min(80, parseInt(e.target.value) || 0)) })}
                                  className="w-14 px-1 py-0.5 bg-black border border-red-500/50 rounded text-right text-red-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="80"
                                value={adminConfig.spinBottom ?? 4}
                                onChange={(e) => onUpdateAdminConfig({ spinBottom: parseInt(e.target.value) })}
                                className="w-full accent-red-500 cursor-pointer"
                              />
                            </div>

                            {/* Scale % */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Escala (%):</span>
                                <input
                                  type="number"
                                  min="50"
                                  max="200"
                                  value={adminConfig.spinScale ?? 100}
                                  onChange={(e) => onUpdateAdminConfig({ spinScale: parseInt(e.target.value) || 100 })}
                                  className="w-14 px-1 py-0.5 bg-black border border-red-500/50 rounded text-right text-red-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="50"
                                max="200"
                                value={adminConfig.spinScale ?? 100}
                                onChange={(e) => onUpdateAdminConfig({ spinScale: parseInt(e.target.value) })}
                                className="w-full accent-red-500 cursor-pointer"
                              />
                            </div>

                            {/* Rotation deg */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Rotação (º):</span>
                                <input
                                  type="number"
                                  min="-180"
                                  max="180"
                                  value={adminConfig.spinRotation || 0}
                                  onChange={(e) => onUpdateAdminConfig({ spinRotation: parseInt(e.target.value) || 0 })}
                                  className="w-14 px-1 py-0.5 bg-black border border-red-500/50 rounded text-right text-red-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="-180"
                                max="180"
                                value={adminConfig.spinRotation || 0}
                                onChange={(e) => onUpdateAdminConfig({ spinRotation: parseInt(e.target.value) })}
                                className="w-full accent-red-500 cursor-pointer"
                              />
                            </div>

                            {/* Opacity % */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Opacidade (%):</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={adminConfig.spinOpacity ?? 100}
                                  onChange={(e) => onUpdateAdminConfig({ spinOpacity: parseInt(e.target.value) || 100 })}
                                  className="w-14 px-1 py-0.5 bg-black border border-red-500/50 rounded text-right text-red-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={adminConfig.spinOpacity ?? 100}
                                onChange={(e) => onUpdateAdminConfig({ spinOpacity: parseInt(e.target.value) })}
                                className="w-full accent-red-500 cursor-pointer"
                              />
                            </div>

                            {/* Z-Index */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Camada (Z-Index):</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="50"
                                  value={adminConfig.spinZIndex ?? 20}
                                  onChange={(e) => onUpdateAdminConfig({ spinZIndex: parseInt(e.target.value) || 20 })}
                                  className="w-14 px-1 py-0.5 bg-black border border-red-500/50 rounded text-right text-red-300 font-mono text-xs"
                                />
                              </div>
                            </div>

                            {/* Formato / Shape Selector */}
                            <div className="space-y-1.5 bg-black/40 p-2.5 rounded-xl border border-white/5 col-span-2 sm:col-span-3">
                              <span className="text-xs font-bold text-gray-300 block">Formato do Botão (Shape):</span>
                              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                                {[
                                  { id: 'circle', label: '⚪ Círculo' },
                                  { id: 'pill', label: '💊 Cápsula' },
                                  { id: 'rounded', label: '⬛ Arredondado' },
                                  { id: 'square', label: '🔲 Quadrado' },
                                  { id: 'octagon', label: '🛑 Octágono' },
                                  { id: 'diamond', label: '🔷 Diamante' },
                                ].map((opt) => (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => onUpdateAdminConfig({ spinShape: opt.id as any })}
                                    className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                      (adminConfig.spinShape || 'circle') === opt.id
                                        ? 'bg-red-500 text-white border-red-300 shadow-[0_0_10px_rgba(239,68,68,0.6)] font-extrabold'
                                        : 'bg-black/60 text-gray-400 border-white/10 hover:bg-white/10'
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* B2. TURBO BUTTON INSPECTOR */}
                      {selectedElement === 'turbo' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30">
                            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                              <span>⚡ Configurações do Botão Turbo</span>
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onUpdateAdminConfig({ turboLocked: !adminConfig.turboLocked })}
                                className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 border transition cursor-pointer ${
                                  adminConfig.turboLocked ? 'bg-red-500/20 text-red-300 border-red-500/50' : 'bg-black/40 text-gray-300 border-white/10'
                                }`}
                              >
                                {adminConfig.turboLocked ? <Lock className="w-3 h-3 text-red-400" /> : <Unlock className="w-3 h-3 text-gray-400" />}
                                <span>{adminConfig.turboLocked ? 'Trava Ativa' : 'Livre'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onUpdateAdminConfig({ turboVisible: adminConfig.turboVisible === false })}
                                className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 border transition cursor-pointer ${
                                  adminConfig.turboVisible !== false ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : 'bg-red-500/20 text-red-300 border-red-500/50'
                                }`}
                              >
                                {adminConfig.turboVisible !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                <span>{adminConfig.turboVisible !== false ? 'Visível' : 'Oculto'}</span>
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {/* X Left */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Posição X (Left %):</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={adminConfig.turboLeft ?? 80}
                                  onChange={(e) => onUpdateAdminConfig({ turboLeft: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
                                  className="w-14 px-1 py-0.5 bg-black border border-amber-500/50 rounded text-right text-amber-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={adminConfig.turboLeft ?? 80}
                                onChange={(e) => onUpdateAdminConfig({ turboLeft: parseInt(e.target.value) })}
                                className="w-full accent-amber-500 cursor-pointer"
                              />
                            </div>

                            {/* Y Top */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Posição Y (Top %):</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={adminConfig.turboTop ?? 88}
                                  onChange={(e) => onUpdateAdminConfig({ turboTop: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
                                  className="w-14 px-1 py-0.5 bg-black border border-amber-500/50 rounded text-right text-amber-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={adminConfig.turboTop ?? 88}
                                onChange={(e) => onUpdateAdminConfig({ turboTop: parseInt(e.target.value) })}
                                className="w-full accent-amber-500 cursor-pointer"
                              />
                            </div>

                            {/* Scale % */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Escala (%):</span>
                                <input
                                  type="number"
                                  min="30"
                                  max="200"
                                  value={adminConfig.turboScale ?? 100}
                                  onChange={(e) => onUpdateAdminConfig({ turboScale: parseInt(e.target.value) || 100 })}
                                  className="w-14 px-1 py-0.5 bg-black border border-amber-500/50 rounded text-right text-amber-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="30"
                                max="200"
                                value={adminConfig.turboScale ?? 100}
                                onChange={(e) => onUpdateAdminConfig({ turboScale: parseInt(e.target.value) })}
                                className="w-full accent-amber-500 cursor-pointer"
                              />
                            </div>

                            {/* Rotation deg */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Rotação (º):</span>
                                <input
                                  type="number"
                                  min="-180"
                                  max="180"
                                  value={adminConfig.turboRotation || 0}
                                  onChange={(e) => onUpdateAdminConfig({ turboRotation: parseInt(e.target.value) || 0 })}
                                  className="w-14 px-1 py-0.5 bg-black border border-amber-500/50 rounded text-right text-amber-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="-180"
                                max="180"
                                value={adminConfig.turboRotation || 0}
                                onChange={(e) => onUpdateAdminConfig({ turboRotation: parseInt(e.target.value) })}
                                className="w-full accent-amber-500 cursor-pointer"
                              />
                            </div>

                            {/* Opacity % */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Opacidade (%):</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={adminConfig.turboOpacity ?? 100}
                                  onChange={(e) => onUpdateAdminConfig({ turboOpacity: parseInt(e.target.value) || 100 })}
                                  className="w-14 px-1 py-0.5 bg-black border border-amber-500/50 rounded text-right text-amber-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={adminConfig.turboOpacity ?? 100}
                                onChange={(e) => onUpdateAdminConfig({ turboOpacity: parseInt(e.target.value) })}
                                className="w-full accent-amber-500 cursor-pointer"
                              />
                            </div>

                            {/* Z-Index */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Camada (Z-Index):</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="50"
                                  value={adminConfig.turboZIndex ?? 20}
                                  onChange={(e) => onUpdateAdminConfig({ turboZIndex: parseInt(e.target.value) || 20 })}
                                  className="w-14 px-1 py-0.5 bg-black border border-amber-500/50 rounded text-right text-amber-300 font-mono text-xs"
                                />
                              </div>
                            </div>

                            {/* Formato / Shape Selector */}
                            <div className="space-y-1.5 bg-black/40 p-2.5 rounded-xl border border-white/5 col-span-2 sm:col-span-3">
                              <span className="text-xs font-bold text-amber-300 block">Formato do Botão (Shape):</span>
                              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                                {[
                                  { id: 'circle', label: '⚪ Círculo' },
                                  { id: 'pill', label: '💊 Cápsula' },
                                  { id: 'rounded', label: '⬛ Arredondado' },
                                  { id: 'square', label: '🔲 Quadrado' },
                                  { id: 'octagon', label: '🛑 Octágono' },
                                  { id: 'diamond', label: '🔷 Diamante' },
                                ].map((opt) => (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => onUpdateAdminConfig({ turboShape: opt.id as any })}
                                    className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                      (adminConfig.turboShape || 'pill') === opt.id
                                        ? 'bg-amber-400 text-black border-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.6)] font-extrabold'
                                        : 'bg-black/60 text-gray-400 border-white/10 hover:bg-white/10'
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* C. BALANCE BOX INSPECTOR */}
                      {selectedElement === 'balance' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between bg-yellow-500/10 p-2.5 rounded-xl border border-yellow-500/30">
                            <span className="text-xs font-bold text-yellow-300 flex items-center gap-1.5">
                              <span>Configurações do Bloco de Saldo</span>
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onUpdateAdminConfig({ balanceLocked: !adminConfig.balanceLocked })}
                                className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 border transition cursor-pointer ${
                                  adminConfig.balanceLocked ? 'bg-red-500/20 text-red-300 border-red-500/50' : 'bg-black/40 text-gray-300 border-white/10'
                                }`}
                              >
                                {adminConfig.balanceLocked ? <Lock className="w-3 h-3 text-red-400" /> : <Unlock className="w-3 h-3 text-gray-400" />}
                                <span>{adminConfig.balanceLocked ? 'Trava Ativa' : 'Livre'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onUpdateAdminConfig({ balanceVisible: adminConfig.balanceVisible === false })}
                                className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 border transition cursor-pointer ${
                                  adminConfig.balanceVisible !== false ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : 'bg-red-500/20 text-red-300 border-red-500/50'
                                }`}
                              >
                                {adminConfig.balanceVisible !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                <span>{adminConfig.balanceVisible !== false ? 'Visível' : 'Oculto'}</span>
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {/* Left X */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Posição X (Left %):</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="80"
                                  value={adminConfig.balanceLeft ?? 3}
                                  onChange={(e) => onUpdateAdminConfig({ balanceLeft: Math.max(0, Math.min(80, parseInt(e.target.value) || 0)) })}
                                  className="w-14 px-1 py-0.5 bg-black border border-yellow-500/50 rounded text-right text-yellow-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="80"
                                value={adminConfig.balanceLeft ?? 3}
                                onChange={(e) => onUpdateAdminConfig({ balanceLeft: parseInt(e.target.value) })}
                                className="w-full accent-yellow-400 cursor-pointer"
                              />
                            </div>

                            {/* Top Y */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Posição Y (Top %):</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="85"
                                  value={adminConfig.balanceTop ?? 3}
                                  onChange={(e) => onUpdateAdminConfig({ balanceTop: Math.max(0, Math.min(85, parseInt(e.target.value) || 0)) })}
                                  className="w-14 px-1 py-0.5 bg-black border border-yellow-500/50 rounded text-right text-yellow-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="85"
                                value={adminConfig.balanceTop ?? 3}
                                onChange={(e) => onUpdateAdminConfig({ balanceTop: parseInt(e.target.value) })}
                                className="w-full accent-yellow-400 cursor-pointer"
                              />
                            </div>

                            {/* Scale % */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Escala (%):</span>
                                <input
                                  type="number"
                                  min="50"
                                  max="180"
                                  value={adminConfig.balanceScale ?? 100}
                                  onChange={(e) => onUpdateAdminConfig({ balanceScale: parseInt(e.target.value) || 100 })}
                                  className="w-14 px-1 py-0.5 bg-black border border-yellow-500/50 rounded text-right text-yellow-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="50"
                                max="180"
                                value={adminConfig.balanceScale ?? 100}
                                onChange={(e) => onUpdateAdminConfig({ balanceScale: parseInt(e.target.value) })}
                                className="w-full accent-yellow-400 cursor-pointer"
                              />
                            </div>
                          </div>

                          {/* Colors Customizer */}
                          <div className="pt-2 border-t border-white/10 space-y-3">
                            <span className="text-xs font-bold text-yellow-300 uppercase tracking-wider block">Cores e Imagem de Fundo</span>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] text-gray-400 block">Cor Fundo</label>
                                <input
                                  type="color"
                                  value={adminConfig.balanceBgColor && adminConfig.balanceBgColor.startsWith('#') ? adminConfig.balanceBgColor : '#000000'}
                                  onChange={(e) => onUpdateAdminConfig({ balanceBgColor: e.target.value })}
                                  className="w-full h-8 rounded bg-transparent border border-gray-600 cursor-pointer"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-gray-400 block">Cor Texto</label>
                                <input
                                  type="color"
                                  value={adminConfig.balanceTextColor && adminConfig.balanceTextColor.startsWith('#') ? adminConfig.balanceTextColor : '#ffffff'}
                                  onChange={(e) => onUpdateAdminConfig({ balanceTextColor: e.target.value })}
                                  className="w-full h-8 rounded bg-transparent border border-gray-600 cursor-pointer"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-gray-400 block">Cor Borda</label>
                                <input
                                  type="color"
                                  value={adminConfig.balanceBorderColor && adminConfig.balanceBorderColor.startsWith('#') ? adminConfig.balanceBorderColor : '#d4af37'}
                                  onChange={(e) => onUpdateAdminConfig({ balanceBorderColor: e.target.value })}
                                  className="w-full h-8 rounded bg-transparent border border-gray-600 cursor-pointer"
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5 pt-1">
                              <label className="text-[10px] text-gray-300 font-bold block">Imagem de Fundo do Bloco de Saldo:</label>
                              <div className="flex gap-2 items-center">
                                <label className="px-2.5 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 transition">
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Upload Imagem</span>
                                  <input type="file" accept="image/*" onChange={(e) => handleWidgetBgFileUpload('balanceBgImage', e)} className="hidden" />
                                </label>
                                {adminConfig.balanceBgImage && (
                                  <button
                                    type="button"
                                    onClick={() => onUpdateAdminConfig({ balanceBgImage: undefined })}
                                    className="px-2.5 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 text-xs font-bold rounded-lg transition"
                                  >
                                    Remover Imagem
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* D. BET BOX INSPECTOR */}
                      {selectedElement === 'bet' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30">
                            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                              <span>Configurações do Bloco de Aposta</span>
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onUpdateAdminConfig({ betLocked: !adminConfig.betLocked })}
                                className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 border transition cursor-pointer ${
                                  adminConfig.betLocked ? 'bg-red-500/20 text-red-300 border-red-500/50' : 'bg-black/40 text-gray-300 border-white/10'
                                }`}
                              >
                                {adminConfig.betLocked ? <Lock className="w-3 h-3 text-red-400" /> : <Unlock className="w-3 h-3 text-gray-400" />}
                                <span>{adminConfig.betLocked ? 'Trava Ativa' : 'Livre'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onUpdateAdminConfig({ betVisible: adminConfig.betVisible === false })}
                                className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 border transition cursor-pointer ${
                                  adminConfig.betVisible !== false ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : 'bg-red-500/20 text-red-300 border-red-500/50'
                                }`}
                              >
                                {adminConfig.betVisible !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                <span>{adminConfig.betVisible !== false ? 'Visível' : 'Oculto'}</span>
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {/* Left X */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Posição X (Left %):</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="80"
                                  value={adminConfig.betLeft ?? 55}
                                  onChange={(e) => onUpdateAdminConfig({ betLeft: Math.max(0, Math.min(80, parseInt(e.target.value) || 0)) })}
                                  className="w-14 px-1 py-0.5 bg-black border border-amber-500/50 rounded text-right text-amber-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="80"
                                value={adminConfig.betLeft ?? 55}
                                onChange={(e) => onUpdateAdminConfig({ betLeft: parseInt(e.target.value) })}
                                className="w-full accent-amber-500 cursor-pointer"
                              />
                            </div>

                            {/* Top Y */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Posição Y (Top %):</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="85"
                                  value={adminConfig.betTop ?? 3}
                                  onChange={(e) => onUpdateAdminConfig({ betTop: Math.max(0, Math.min(85, parseInt(e.target.value) || 0)) })}
                                  className="w-14 px-1 py-0.5 bg-black border border-amber-500/50 rounded text-right text-amber-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="85"
                                value={adminConfig.betTop ?? 3}
                                onChange={(e) => onUpdateAdminConfig({ betTop: parseInt(e.target.value) })}
                                className="w-full accent-amber-500 cursor-pointer"
                              />
                            </div>

                            {/* Scale % */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Escala (%):</span>
                                <input
                                  type="number"
                                  min="50"
                                  max="180"
                                  value={adminConfig.betScale ?? 100}
                                  onChange={(e) => onUpdateAdminConfig({ betScale: parseInt(e.target.value) || 100 })}
                                  className="w-14 px-1 py-0.5 bg-black border border-amber-500/50 rounded text-right text-amber-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="50"
                                max="180"
                                value={adminConfig.betScale ?? 100}
                                onChange={(e) => onUpdateAdminConfig({ betScale: parseInt(e.target.value) })}
                                className="w-full accent-amber-500 cursor-pointer"
                              />
                            </div>
                          </div>

                          {/* Colors & Custom Background Image */}
                          <div className="pt-2 border-t border-white/10 space-y-3">
                            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">Cores e Imagem de Fundo</span>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] text-gray-400 block">Cor Fundo</label>
                                <input
                                  type="color"
                                  value={adminConfig.betBgColor && adminConfig.betBgColor.startsWith('#') ? adminConfig.betBgColor : '#000000'}
                                  onChange={(e) => onUpdateAdminConfig({ betBgColor: e.target.value })}
                                  className="w-full h-8 rounded bg-transparent border border-gray-600 cursor-pointer"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-gray-400 block">Cor Texto</label>
                                <input
                                  type="color"
                                  value={adminConfig.betTextColor && adminConfig.betTextColor.startsWith('#') ? adminConfig.betTextColor : '#fde073'}
                                  onChange={(e) => onUpdateAdminConfig({ betTextColor: e.target.value })}
                                  className="w-full h-8 rounded bg-transparent border border-gray-600 cursor-pointer"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-gray-400 block">Cor Borda</label>
                                <input
                                  type="color"
                                  value={adminConfig.betBorderColor && adminConfig.betBorderColor.startsWith('#') ? adminConfig.betBorderColor : '#8b6914'}
                                  onChange={(e) => onUpdateAdminConfig({ betBorderColor: e.target.value })}
                                  className="w-full h-8 rounded bg-transparent border border-gray-600 cursor-pointer"
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5 pt-1">
                              <label className="text-[10px] text-gray-300 font-bold block">Imagem de Fundo do Bloco de Aposta:</label>
                              <div className="flex gap-2 items-center">
                                <label className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 transition">
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Upload Imagem</span>
                                  <input type="file" accept="image/*" onChange={(e) => handleWidgetBgFileUpload('betBgImage', e)} className="hidden" />
                                </label>
                                {adminConfig.betBgImage && (
                                  <button
                                    type="button"
                                    onClick={() => onUpdateAdminConfig({ betBgImage: undefined })}
                                    className="px-2.5 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 text-xs font-bold rounded-lg transition"
                                  >
                                    Remover Imagem
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* E. WIN BOX (FIXED) INSPECTOR */}
                      {selectedElement === 'winBox' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30">
                            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                              <span>Configurações do Quadro de Ganho Fixo</span>
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onUpdateAdminConfig({ winBoxLocked: !adminConfig.winBoxLocked })}
                                className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 border transition cursor-pointer ${
                                  adminConfig.winBoxLocked ? 'bg-red-500/20 text-red-300 border-red-500/50' : 'bg-black/40 text-gray-300 border-white/10'
                                }`}
                              >
                                {adminConfig.winBoxLocked ? <Lock className="w-3 h-3 text-red-400" /> : <Unlock className="w-3 h-3 text-gray-400" />}
                                <span>{adminConfig.winBoxLocked ? 'Trava Ativa' : 'Livre'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onUpdateAdminConfig({ winBoxVisible: adminConfig.winBoxVisible === false })}
                                className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 border transition cursor-pointer ${
                                  adminConfig.winBoxVisible !== false ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : 'bg-red-500/20 text-red-300 border-red-500/50'
                                }`}
                              >
                                {adminConfig.winBoxVisible !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                <span>{adminConfig.winBoxVisible !== false ? 'Visível' : 'Oculto'}</span>
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {/* Left X */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Posição X (Left %):</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="80"
                                  value={adminConfig.winBoxLeft ?? 30}
                                  onChange={(e) => onUpdateAdminConfig({ winBoxLeft: Math.max(0, Math.min(80, parseInt(e.target.value) || 0)) })}
                                  className="w-14 px-1 py-0.5 bg-black border border-emerald-500/50 rounded text-right text-emerald-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="80"
                                value={adminConfig.winBoxLeft ?? 30}
                                onChange={(e) => onUpdateAdminConfig({ winBoxLeft: parseInt(e.target.value) })}
                                className="w-full accent-emerald-500 cursor-pointer"
                              />
                            </div>

                            {/* Top Y */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Posição Y (Top %):</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="85"
                                  value={adminConfig.winBoxTop ?? 3}
                                  onChange={(e) => onUpdateAdminConfig({ winBoxTop: Math.max(0, Math.min(85, parseInt(e.target.value) || 0)) })}
                                  className="w-14 px-1 py-0.5 bg-black border border-emerald-500/50 rounded text-right text-emerald-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="85"
                                value={adminConfig.winBoxTop ?? 3}
                                onChange={(e) => onUpdateAdminConfig({ winBoxTop: parseInt(e.target.value) })}
                                className="w-full accent-emerald-500 cursor-pointer"
                              />
                            </div>

                            {/* Scale % */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Escala (%):</span>
                                <input
                                  type="number"
                                  min="50"
                                  max="180"
                                  value={adminConfig.winBoxScale ?? 100}
                                  onChange={(e) => onUpdateAdminConfig({ winBoxScale: parseInt(e.target.value) || 100 })}
                                  className="w-14 px-1 py-0.5 bg-black border border-emerald-500/50 rounded text-right text-emerald-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="50"
                                max="180"
                                value={adminConfig.winBoxScale ?? 100}
                                onChange={(e) => onUpdateAdminConfig({ winBoxScale: parseInt(e.target.value) })}
                                className="w-full accent-emerald-500 cursor-pointer"
                              />
                            </div>
                          </div>

                          {/* Colors & Custom Background Image */}
                          <div className="pt-2 border-t border-white/10 space-y-3">
                            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">Cores e Imagem de Fundo</span>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] text-gray-400 block">Cor Fundo</label>
                                <input
                                  type="color"
                                  value={adminConfig.winBoxBgColor && adminConfig.winBoxBgColor.startsWith('#') ? adminConfig.winBoxBgColor : '#10b981'}
                                  onChange={(e) => onUpdateAdminConfig({ winBoxBgColor: e.target.value })}
                                  className="w-full h-8 rounded bg-transparent border border-gray-600 cursor-pointer"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-gray-400 block">Cor Texto</label>
                                <input
                                  type="color"
                                  value={adminConfig.winBoxTextColor && adminConfig.winBoxTextColor.startsWith('#') ? adminConfig.winBoxTextColor : '#34d399'}
                                  onChange={(e) => onUpdateAdminConfig({ winBoxTextColor: e.target.value })}
                                  className="w-full h-8 rounded bg-transparent border border-gray-600 cursor-pointer"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-gray-400 block">Cor Borda</label>
                                <input
                                  type="color"
                                  value={adminConfig.winBoxBorderColor && adminConfig.winBoxBorderColor.startsWith('#') ? adminConfig.winBoxBorderColor : '#10b981'}
                                  onChange={(e) => onUpdateAdminConfig({ winBoxBorderColor: e.target.value })}
                                  className="w-full h-8 rounded bg-transparent border border-gray-600 cursor-pointer"
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5 pt-1">
                              <label className="text-[10px] text-gray-300 font-bold block">Imagem de Fundo do Quadro (Custom BG Image):</label>
                              <div className="flex gap-2 items-center">
                                <label className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 transition">
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Upload Imagem</span>
                                  <input type="file" accept="image/*" onChange={(e) => handleWidgetBgFileUpload('winBoxBgImage', e)} className="hidden" />
                                </label>
                                {adminConfig.winBoxBgImage && (
                                  <button
                                    type="button"
                                    onClick={() => onUpdateAdminConfig({ winBoxBgImage: undefined })}
                                    className="px-2.5 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 text-xs font-bold rounded-lg transition"
                                  >
                                    Remover Imagem
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* F. WIN OVERLAY (POPUP) INSPECTOR */}
                      {selectedElement === 'winOverlay' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30">
                            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                              <span>Configurações do Quadro de Ganho (Overlay Animado)</span>
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onUpdateAdminConfig({ winOverlayLocked: !adminConfig.winOverlayLocked })}
                                className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 border transition cursor-pointer ${
                                  adminConfig.winOverlayLocked ? 'bg-red-500/20 text-red-300 border-red-500/50' : 'bg-black/40 text-gray-300 border-white/10'
                                }`}
                              >
                                {adminConfig.winOverlayLocked ? <Lock className="w-3 h-3 text-red-400" /> : <Unlock className="w-3 h-3 text-gray-400" />}
                                <span>{adminConfig.winOverlayLocked ? 'Trava Ativa' : 'Livre'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onUpdateAdminConfig({ winOverlayVisible: adminConfig.winOverlayVisible === false })}
                                className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 border transition cursor-pointer ${
                                  adminConfig.winOverlayVisible !== false ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : 'bg-red-500/20 text-red-300 border-red-500/50'
                                }`}
                              >
                                {adminConfig.winOverlayVisible !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                <span>{adminConfig.winOverlayVisible !== false ? 'Visível' : 'Oculto'}</span>
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {/* Left X */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Posição X (Left %):</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="80"
                                  value={adminConfig.winOverlayLeft ?? 25}
                                  onChange={(e) => onUpdateAdminConfig({ winOverlayLeft: Math.max(0, Math.min(80, parseInt(e.target.value) || 0)) })}
                                  className="w-14 px-1 py-0.5 bg-black border border-amber-500/50 rounded text-right text-amber-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="80"
                                value={adminConfig.winOverlayLeft ?? 25}
                                onChange={(e) => onUpdateAdminConfig({ winOverlayLeft: parseInt(e.target.value) })}
                                className="w-full accent-amber-500 cursor-pointer"
                              />
                            </div>

                            {/* Top Y */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Posição Y (Top %):</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="85"
                                  value={adminConfig.winOverlayTop ?? 40}
                                  onChange={(e) => onUpdateAdminConfig({ winOverlayTop: Math.max(0, Math.min(85, parseInt(e.target.value) || 0)) })}
                                  className="w-14 px-1 py-0.5 bg-black border border-amber-500/50 rounded text-right text-amber-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="85"
                                value={adminConfig.winOverlayTop ?? 40}
                                onChange={(e) => onUpdateAdminConfig({ winOverlayTop: parseInt(e.target.value) })}
                                className="w-full accent-amber-500 cursor-pointer"
                              />
                            </div>

                            {/* Scale % */}
                            <div className="space-y-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Escala (%):</span>
                                <input
                                  type="number"
                                  min="50"
                                  max="200"
                                  value={adminConfig.winOverlayScale ?? 100}
                                  onChange={(e) => onUpdateAdminConfig({ winOverlayScale: parseInt(e.target.value) || 100 })}
                                  className="w-14 px-1 py-0.5 bg-black border border-amber-500/50 rounded text-right text-amber-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="50"
                                max="200"
                                value={adminConfig.winOverlayScale ?? 100}
                                onChange={(e) => onUpdateAdminConfig({ winOverlayScale: parseInt(e.target.value) })}
                                className="w-full accent-amber-500 cursor-pointer"
                              />
                            </div>
                          </div>

                          {/* Colors & Custom Background Image */}
                          <div className="pt-2 border-t border-white/10 space-y-3">
                            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">Cores e Imagem de Fundo</span>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] text-gray-400 block">Cor Fundo</label>
                                <input
                                  type="color"
                                  value={adminConfig.winOverlayBgColor && adminConfig.winOverlayBgColor.startsWith('#') ? adminConfig.winOverlayBgColor : '#000000'}
                                  onChange={(e) => onUpdateAdminConfig({ winOverlayBgColor: e.target.value })}
                                  className="w-full h-8 rounded bg-transparent border border-gray-600 cursor-pointer"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-gray-400 block">Cor Texto</label>
                                <input
                                  type="color"
                                  value={adminConfig.winOverlayTextColor && adminConfig.winOverlayTextColor.startsWith('#') ? adminConfig.winOverlayTextColor : '#fbbf24'}
                                  onChange={(e) => onUpdateAdminConfig({ winOverlayTextColor: e.target.value })}
                                  className="w-full h-8 rounded bg-transparent border border-gray-600 cursor-pointer"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] text-gray-400 block">Cor Borda</label>
                                <input
                                  type="color"
                                  value={adminConfig.winOverlayBorderColor && adminConfig.winOverlayBorderColor.startsWith('#') ? adminConfig.winOverlayBorderColor : '#f59e0b'}
                                  onChange={(e) => onUpdateAdminConfig({ winOverlayBorderColor: e.target.value })}
                                  className="w-full h-8 rounded bg-transparent border border-gray-600 cursor-pointer"
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5 pt-1">
                              <label className="text-[10px] text-gray-300 font-bold block">Imagem de Fundo do Overlay de Ganho:</label>
                              <div className="flex gap-2 items-center">
                                <label className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 transition">
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Upload Imagem</span>
                                  <input type="file" accept="image/*" onChange={(e) => handleWidgetBgFileUpload('winOverlayBgImage', e)} className="hidden" />
                                </label>
                                {adminConfig.winOverlayBgImage && (
                                  <button
                                    type="button"
                                    onClick={() => onUpdateAdminConfig({ winOverlayBgImage: undefined })}
                                    className="px-2.5 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 text-xs font-bold rounded-lg transition"
                                  >
                                    Remover Imagem
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* E. BACKGROUND / SCREEN INSPECTOR */}
                      {selectedElement === 'bg' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30">
                            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                              <span>Controle Avançado da Mídia de Fundo</span>
                            </span>

                            <label className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black rounded-lg cursor-pointer flex items-center gap-1 transition">
                              <Upload className="w-3 h-3" />
                              <span>Upload Imagem/Vídeo</span>
                              <input type="file" accept="image/*,video/*" onChange={handleBgFileUpload} className="hidden" />
                            </label>
                          </div>

                          {/* Direct URL Input */}
                          <div className="space-y-1">
                            <label className="text-[10px] text-gray-300 font-bold block">URL Direta (Cloudinary, YouTube, MP4, PNG, JPG):</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="https://..."
                                value={mediaUrlInput}
                                onChange={(e) => setMediaUrlInput(e.target.value)}
                                className="flex-1 px-2.5 py-1.5 bg-black/80 border border-white/10 rounded-lg text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-400 font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (mediaUrlInput.trim()) {
                                    onUpdateAdminConfig({ bgImage: mediaUrlInput.trim() });
                                    setMediaUrlInput('');
                                  }
                                }}
                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-black transition cursor-pointer"
                              >
                                Aplicar
                              </button>
                            </div>
                          </div>

                          {/* Display Fit Mode Options */}
                          <div className="space-y-2 pt-2 border-t border-white/10">
                            <span className="text-xs font-bold text-gray-200 uppercase tracking-wider block">
                              Modo de Exibição (Fit)
                            </span>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { id: 'contain', name: 'Contain (Ajustar)', desc: 'Imagem inteira sem cortes' },
                                { id: 'cover', name: 'Cover (Preencher)', desc: 'Preenche toda a tela 9:16' },
                                { id: 'stretch', name: 'Stretch (Esticar)', desc: 'Estica para cobrir 100%' },
                              ].map(f => (
                                <button
                                  key={f.id}
                                  type="button"
                                  onClick={() => onUpdateAdminConfig({ bgFit: f.id as any })}
                                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                                    (adminConfig.bgFit || 'cover') === f.id
                                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-extrabold shadow'
                                      : 'bg-black/60 border-white/10 text-gray-400 hover:bg-white/5'
                                  }`}
                                >
                                  <div className="text-xs font-bold">{f.name}</div>
                                  <div className="text-[9px] text-gray-400 leading-tight">{f.desc}</div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Anchor Position Options */}
                          <div className="space-y-2 pt-2 border-t border-white/10">
                            <span className="text-xs font-bold text-gray-200 uppercase tracking-wider block">
                              Ponto de Âncora (Anchor Position)
                            </span>
                            <div className="grid grid-cols-3 gap-1.5">
                              {[
                                { id: 'top-left', label: '↖ Topo-Esq' },
                                { id: 'top', label: '↑ Topo-Centro' },
                                { id: 'top-right', label: '↗ Topo-Dir' },
                                { id: 'left', label: '← Centro-Esq' },
                                { id: 'center', label: '• Centro' },
                                { id: 'right', label: '→ Centro-Dir' },
                                { id: 'bottom-left', label: '↙ Baixo-Esq' },
                                { id: 'bottom', label: '↓ Baixo-Centro' },
                                { id: 'bottom-right', label: '↘ Baixo-Dir' },
                              ].map(a => (
                                <button
                                  key={a.id}
                                  type="button"
                                  onClick={() => onUpdateAdminConfig({ bgAnchor: a.id as any })}
                                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition cursor-pointer text-center ${
                                    (adminConfig.bgAnchor || 'center') === a.id
                                      ? 'bg-amber-400 text-black border-amber-300 font-black'
                                      : 'bg-black/60 border-white/10 text-gray-300 hover:bg-white/10'
                                  }`}
                                >
                                  {a.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Zoom & Reposition Sliders */}
                          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10">
                            {/* Offset X */}
                            <div className="space-y-1 bg-black/40 p-2 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Offset X (%):</span>
                                <input
                                  type="number"
                                  min="-100"
                                  max="100"
                                  value={adminConfig.bgPosX || 0}
                                  onChange={(e) => onUpdateAdminConfig({ bgPosX: parseInt(e.target.value) || 0 })}
                                  className="w-12 px-1 py-0.5 bg-black border border-amber-500/50 rounded text-right text-amber-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="-100"
                                max="100"
                                value={adminConfig.bgPosX || 0}
                                onChange={(e) => onUpdateAdminConfig({ bgPosX: parseInt(e.target.value) })}
                                className="w-full accent-amber-500 cursor-pointer"
                              />
                            </div>

                            {/* Offset Y */}
                            <div className="space-y-1 bg-black/40 p-2 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Offset Y (%):</span>
                                <input
                                  type="number"
                                  min="-100"
                                  max="100"
                                  value={adminConfig.bgPosY || 0}
                                  onChange={(e) => onUpdateAdminConfig({ bgPosY: parseInt(e.target.value) || 0 })}
                                  className="w-12 px-1 py-0.5 bg-black border border-amber-500/50 rounded text-right text-amber-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="-100"
                                max="100"
                                value={adminConfig.bgPosY || 0}
                                onChange={(e) => onUpdateAdminConfig({ bgPosY: parseInt(e.target.value) })}
                                className="w-full accent-amber-500 cursor-pointer"
                              />
                            </div>

                            {/* Zoom % */}
                            <div className="space-y-1 bg-black/40 p-2 rounded-xl border border-white/5">
                              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                                <span>Zoom Manual (%):</span>
                                <input
                                  type="number"
                                  min="100"
                                  max="300"
                                  value={adminConfig.bgZoom || 100}
                                  onChange={(e) => onUpdateAdminConfig({ bgZoom: parseInt(e.target.value) || 100 })}
                                  className="w-12 px-1 py-0.5 bg-black border border-amber-500/50 rounded text-right text-amber-300 font-mono text-xs"
                                />
                              </div>
                              <input
                                type="range"
                                min="100"
                                max="300"
                                value={adminConfig.bgZoom || 100}
                                onChange={(e) => onUpdateAdminConfig({ bgZoom: parseInt(e.target.value) })}
                                className="w-full accent-amber-500 cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: CUSTOM SYMBOL IMAGES */}
              {activeTab === 'symbols' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-red-300 uppercase tracking-widest flex items-center gap-1.5">
                        <LayoutGrid className="w-4 h-4 text-red-400" />
                        Imagens dos Lots (Símbolos Sem Margens & Posicionamento)
                      </h3>
                      <p className="text-[11px] text-gray-400">
                        Cada lot possui um tamanho padrão padronizado. Preencha sem margens ou ajuste a posição e zoom de cada imagem.
                      </p>
                    </div>

                    <button
                      onClick={() => onUpdateAdminConfig({ customSymbols: {}, customSymbolConfigs: {} })}
                      className="px-2.5 py-1.5 bg-black/60 border border-red-800/40 hover:bg-red-950/60 rounded-lg text-xs font-bold text-gray-300 flex items-center gap-1 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                      <span>Restaurar Símbolos Padrão</span>
                    </button>
                  </div>

                  {/* SYMBOLS LIST */}
                  <div className="space-y-3">
                    {SYMBOL_NAMES.map(({ type, label }) => {
                      const customImg = adminConfig.customSymbols?.[type];
                      const symConfig = adminConfig.customSymbolConfigs?.[type];

                      return (
                        <div
                          key={type}
                          className="p-3 bg-black/50 border border-red-900/30 rounded-xl hover:border-red-600/50 transition flex flex-col sm:flex-row gap-3 items-start sm:items-center"
                        >
                          {/* Standardized Tile Box Preview (Strict 64x64px standard lot square tile) */}
                          <div className="w-16 h-16 shrink-0 rounded-xl bg-gradient-to-br from-[#2a1a00] to-black border-2 border-[#8b6914] flex items-center justify-center relative shadow-inner overflow-hidden">
                            <SlotSymbol type={type} customImage={customImg} symbolConfig={symConfig} />
                          </div>

                          <div className="flex-1 min-w-0 space-y-2 w-full">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white truncate">{label}</span>
                              <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                                {type}
                              </span>
                            </div>

                            {/* Upload Button or Remove */}
                            <div className="flex items-center gap-2">
                              <label className="flex-1 py-1.5 px-3 bg-black/60 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-300 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition">
                                <Upload className="w-3.5 h-3.5 text-amber-400" />
                                <span>{customImg ? 'Alterar Imagem do Lot' : 'Carregar Imagem para este Lot'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleSymbolFileUpload(type, e)}
                                  className="hidden"
                                />
                              </label>

                              {customImg && (
                                <button
                                  onClick={() => handleRemoveSymbol(type)}
                                  className="p-1.5 bg-red-950/60 border border-red-500/40 hover:bg-red-900 text-red-400 rounded-lg transition cursor-pointer"
                                  title="Remover Imagem Customizada"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            {/* Fine tuning per-symbol position & scale if custom image exists */}
                            {customImg && (
                              <div className="pt-2 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div>
                                  <div className="text-[10px] text-gray-400 font-bold mb-1">Preenchimento:</div>
                                  <button
                                    onClick={() => handleUpdateSymbolConfig(type, { objectFit: symConfig?.objectFit === 'contain' ? 'cover' : 'contain' })}
                                    className={`w-full py-1 px-2 rounded text-[10px] font-bold border ${
                                      symConfig?.objectFit !== 'contain' 
                                        ? 'bg-amber-900/80 border-amber-500 text-amber-200' 
                                        : 'bg-black/60 border-white/10 text-gray-400'
                                    }`}
                                  >
                                    {symConfig?.objectFit === 'contain' ? 'Centralizado' : 'Sem Margens (Cover)'}
                                  </button>
                                </div>

                                <div>
                                  <div className="text-[10px] text-gray-400 font-bold mb-0.5">Offset X: {symConfig?.offsetX || 0}%</div>
                                  <input
                                    type="range"
                                    min="-50"
                                    max="50"
                                    value={symConfig?.offsetX || 0}
                                    onChange={(e) => handleUpdateSymbolConfig(type, { offsetX: parseInt(e.target.value) })}
                                    className="w-full accent-amber-500 cursor-pointer h-1"
                                  />
                                </div>

                                <div>
                                  <div className="text-[10px] text-gray-400 font-bold mb-0.5">Offset Y: {symConfig?.offsetY || 0}%</div>
                                  <input
                                    type="range"
                                    min="-50"
                                    max="50"
                                    value={symConfig?.offsetY || 0}
                                    onChange={(e) => handleUpdateSymbolConfig(type, { offsetY: parseInt(e.target.value) })}
                                    className="w-full accent-amber-500 cursor-pointer h-1"
                                  />
                                </div>

                                <div>
                                  <div className="text-[10px] text-gray-400 font-bold mb-0.5">Zoom Lot: {symConfig?.scale || 100}%</div>
                                  <input
                                    type="range"
                                    min="50"
                                    max="200"
                                    value={symConfig?.scale || 100}
                                    onChange={(e) => handleUpdateSymbolConfig(type, { scale: parseInt(e.target.value) })}
                                    className="w-full accent-amber-500 cursor-pointer h-1"
                                  />
                                </div>
                              </div>
                            )}

                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </>
        )}

      </div>
    </div>
  );
};
