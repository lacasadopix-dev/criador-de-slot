import React, { useRef, useState, useEffect } from 'react';
import { Menu, ShieldAlert, Plus, Minus, Coins, Move, Lock, Eye, EyeOff, RotateCw, Scaling, Anchor, Trophy, Ruler, Crosshair, Activity, Zap, Maximize2 } from 'lucide-react';
import { SlotMachine } from './SlotMachine';
import { SpinButton } from './SpinButton';
import { BackgroundMedia } from './BackgroundMedia';
import { WinCounterOverlay } from './WinCounterOverlay';
import { GameState, SymbolType, AdminConfig, AnchorType, GameSettings } from '../types';
import { calculateAnchorStyle } from '../utils/canvasMath';

interface GameStageProps {
  adminConfig: AdminConfig;
  gameState: GameState;
  gameSettings?: GameSettings;
  grid: SymbolType[][];
  onSpin: () => void;
  onBetChange: (delta: number) => void;
  onOpenMenu: () => void;
  onOpenAdmin: () => void;
  onClearWin?: () => void;
  onAllReelsStopped?: () => void;
  onToggleTurbo?: () => void;
  isEditing?: boolean;
  selectedElement?: string | null;
  onSelectElement?: (elementId: string | null) => void;
  onUpdateAdminConfig?: (newConfig: Partial<AdminConfig>) => void;
}

interface QuickScaleToolbarProps {
  elementId: string;
  currentScale: number;
  onUpdateScale: (elementId: string, newScale: number) => void;
}

const QuickScaleToolbar: React.FC<QuickScaleToolbarProps> = ({
  elementId,
  currentScale,
  onUpdateScale,
}) => {
  return (
    <div 
      onClick={(e) => e.stopPropagation()} 
      onMouseDown={(e) => e.stopPropagation()}
      className="absolute -top-12 left-1/2 -translate-x-1/2 z-[130] flex items-center gap-1 bg-slate-950/95 border-2 border-amber-400 px-2.5 py-1 rounded-full shadow-[0_0_25px_rgba(245,158,11,0.95)] backdrop-blur-md pointer-events-auto select-none"
    >
      <span className="text-[10px] font-black text-amber-300 uppercase tracking-tight flex items-center gap-1 mr-0.5">
        <Maximize2 className="w-3 h-3 text-amber-400" />
        <span>Tam:</span>
      </span>

      {/* -10% button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onUpdateScale(elementId, currentScale - 10);
        }}
        className="w-6 h-6 rounded-full bg-amber-500/20 hover:bg-amber-400 text-amber-300 hover:text-black font-extrabold text-sm flex items-center justify-center border border-amber-400/50 transition cursor-pointer active:scale-90"
        title="Diminuir tamanho (-10%)"
      >
        -
      </button>

      {/* -2% button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onUpdateScale(elementId, currentScale - 2);
        }}
        className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/10 hover:bg-white/20 text-amber-200 border border-white/10 transition cursor-pointer active:scale-90"
        title="Ajuste fino -2%"
      >
        -2
      </button>

      {/* Current scale badge */}
      <span className="text-xs font-black text-amber-300 px-1 min-w-[38px] text-center font-mono">
        {currentScale}%
      </span>

      {/* +2% button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onUpdateScale(elementId, currentScale + 2);
        }}
        className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/10 hover:bg-white/20 text-amber-200 border border-white/10 transition cursor-pointer active:scale-90"
        title="Ajuste fino +2%"
      >
        +2
      </button>

      {/* +10% button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onUpdateScale(elementId, currentScale + 10);
        }}
        className="w-6 h-6 rounded-full bg-amber-500/20 hover:bg-amber-400 text-amber-300 hover:text-black font-extrabold text-sm flex items-center justify-center border border-amber-400/50 transition cursor-pointer active:scale-90"
        title="Aumentar tamanho (+10%)"
      >
        +
      </button>

      <div className="w-[1px] h-4 bg-white/20 mx-0.5" />

      {/* Reset to 100% button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onUpdateScale(elementId, 100);
        }}
        className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 hover:bg-amber-400 text-amber-300 hover:text-black border border-amber-400/40 transition cursor-pointer active:scale-90"
        title="Redefinir tamanho para 100%"
      >
        100%
      </button>
    </div>
  );
};

export const GameStage: React.FC<GameStageProps> = ({
  adminConfig,
  gameState,
  gameSettings,
  grid,
  onSpin,
  onBetChange,
  onOpenMenu,
  onOpenAdmin,
  onClearWin,
  onAllReelsStopped,
  onToggleTurbo,
  isEditing = false,
  selectedElement = null,
  onSelectElement,
  onUpdateAdminConfig,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({ width: 360, height: 640 });

  // Virtual Canvas Base Resolution (default 1080 x 1920)
  const VIRTUAL_WIDTH = adminConfig.canvasWidth || 1080;
  const VIRTUAL_HEIGHT = adminConfig.canvasHeight || 1920;

  // Measure parent container pixel dimensions
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setStageSize({ width: rect.width, height: rect.height });
        }
      }
    };

    updateSize();
    const observer = new ResizeObserver(() => updateSize());
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    window.addEventListener('resize', updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Compute global scale factor for Virtual Canvas
  const scaleX = stageSize.width / VIRTUAL_WIDTH;
  const scaleY = stageSize.height / VIRTUAL_HEIGHT;
  const canvasFit = adminConfig.canvasFit || 'contain';
  const scale = canvasFit === 'cover' 
    ? Math.max(scaleX, scaleY) 
    : Math.min(scaleX, scaleY);

  // Dragging & Resizing logic inside editor mode
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const justDraggedOrSelectedRef = useRef<boolean>(false);

  const dragStartRef = useRef<{ x: number; y: number; initialLeft: number; initialTop: number }>({
    x: 0,
    y: 0,
    initialLeft: 0,
    initialTop: 0,
  });

  const resizeStartRef = useRef<{ x: number; y: number; initialScale: number; elementId: string }>({
    x: 0,
    y: 0,
    initialScale: 100,
    elementId: '',
  });

  const handleMouseDown = (e: React.MouseEvent, elementId: string, currentLeft: number, currentTop: number) => {
    if (!isEditing || !onUpdateAdminConfig) return;
    e.stopPropagation();
    if (onSelectElement) onSelectElement(elementId);

    justDraggedOrSelectedRef.current = true;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialLeft: currentLeft,
      initialTop: currentTop,
    };
  };

  const handleResizeMouseDown = (e: React.MouseEvent, elementId: string, currentScale: number) => {
    if (!isEditing || !onUpdateAdminConfig) return;
    e.stopPropagation();
    e.preventDefault();
    if (onSelectElement) onSelectElement(elementId);

    justDraggedOrSelectedRef.current = true;
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialScale: currentScale || 100,
      elementId,
    };
  };

  const getScaleForElement = (elementId: string): number => {
    switch (elementId) {
      case 'slot': return adminConfig.slotScale ?? 100;
      case 'spin': return adminConfig.spinScale ?? 100;
      case 'turbo': return adminConfig.turboScale ?? 100;
      case 'balance': return adminConfig.balanceScale ?? 100;
      case 'bet': return adminConfig.betScale ?? 100;
      case 'winBox': return adminConfig.winBoxScale ?? 100;
      case 'winOverlay': return adminConfig.winOverlayScale ?? 100;
      case 'bg': return adminConfig.bgZoom ?? 100;
      default: return 100;
    }
  };

  const updateElementScale = (elementId: string, newScale: number) => {
    if (!onUpdateAdminConfig) return;
    const clampedScale = Math.min(300, Math.max(20, Math.round(newScale)));
    switch (elementId) {
      case 'slot': onUpdateAdminConfig({ slotScale: clampedScale }); break;
      case 'spin': onUpdateAdminConfig({ spinScale: clampedScale }); break;
      case 'turbo': onUpdateAdminConfig({ turboScale: clampedScale }); break;
      case 'balance': onUpdateAdminConfig({ balanceScale: clampedScale }); break;
      case 'bet': onUpdateAdminConfig({ betScale: clampedScale }); break;
      case 'winBox': onUpdateAdminConfig({ winBoxScale: clampedScale }); break;
      case 'winOverlay': onUpdateAdminConfig({ winOverlayScale: clampedScale }); break;
      case 'bg': onUpdateAdminConfig({ bgZoom: clampedScale }); break;
    }
  };

  useEffect(() => {
    if ((!isDragging && !isResizing) || !isEditing || !onUpdateAdminConfig) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && selectedElement) {
        const dxScreen = e.clientX - dragStartRef.current.x;
        const dyScreen = e.clientY - dragStartRef.current.y;

        // Convert screen delta to Virtual Canvas delta
        const dxVirtual = dxScreen / (scale || 1);
        const dyVirtual = dyScreen / (scale || 1);

        const dLeftPct = (dxVirtual / VIRTUAL_WIDTH) * 100;
        const dTopPct = (dyVirtual / VIRTUAL_HEIGHT) * 100;

        let newLeft = Math.round((dragStartRef.current.initialLeft + dLeftPct) * 10) / 10;
        let newTop = Math.round((dragStartRef.current.initialTop + dTopPct) * 10) / 10;

        // Snap to grid if enabled
        if (adminConfig.snapToGrid && adminConfig.gridSize) {
          const step = adminConfig.gridSize;
          newLeft = Math.round(newLeft / step) * step;
          newTop = Math.round(newTop / step) * step;
        }

        if (selectedElement === 'slot') {
          onUpdateAdminConfig({ slotLeft: newLeft, slotTop: newTop });
        } else if (selectedElement === 'spin') {
          onUpdateAdminConfig({ spinLeft: newLeft, spinTop: newTop });
        } else if (selectedElement === 'balance') {
          onUpdateAdminConfig({ balanceLeft: newLeft, balanceTop: newTop });
        } else if (selectedElement === 'bet') {
          onUpdateAdminConfig({ betLeft: newLeft, betTop: newTop });
        } else if (selectedElement === 'winBox') {
          onUpdateAdminConfig({ winBoxLeft: newLeft, winBoxTop: newTop });
        } else if (selectedElement === 'winOverlay') {
          onUpdateAdminConfig({ winOverlayLeft: newLeft, winOverlayTop: newTop });
        } else if (selectedElement === 'turbo') {
          onUpdateAdminConfig({ turboLeft: newLeft, turboTop: newTop });
        }
      } else if (isResizing && resizeStartRef.current.elementId) {
        const dx = e.clientX - resizeStartRef.current.x;
        const dy = e.clientY - resizeStartRef.current.y;
        const delta = (dx + dy) / 2;
        const scaleDelta = Math.round(delta / 1.5);
        const newScale = resizeStartRef.current.initialScale + scaleDelta;
        updateElementScale(resizeStartRef.current.elementId, newScale);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setTimeout(() => {
        justDraggedOrSelectedRef.current = false;
      }, 150);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, isEditing, selectedElement, scale, VIRTUAL_WIDTH, VIRTUAL_HEIGHT, adminConfig, onUpdateAdminConfig]);

  // Styles for individual elements on the Virtual Canvas
  const balanceStyle = calculateAnchorStyle({
    anchor: adminConfig.balanceAnchor || 'top-left',
    top: adminConfig.balanceTop ?? 3,
    left: adminConfig.balanceLeft ?? 3,
    scale: adminConfig.balanceScale ?? 100,
    rotation: adminConfig.balanceRotation || 0,
    opacity: adminConfig.balanceOpacity ?? 100,
    zIndex: adminConfig.balanceZIndex ?? 30,
  });

  const betStyle = calculateAnchorStyle({
    anchor: adminConfig.betAnchor || 'top-left',
    top: adminConfig.betTop ?? 3,
    left: adminConfig.betLeft ?? 55,
    scale: adminConfig.betScale ?? 100,
    rotation: adminConfig.betRotation || 0,
    opacity: adminConfig.betOpacity ?? 100,
    zIndex: adminConfig.betZIndex ?? 30,
  });

  const winBoxStyle = calculateAnchorStyle({
    anchor: adminConfig.winBoxAnchor || 'top-left',
    top: adminConfig.winBoxTop ?? 3,
    left: adminConfig.winBoxLeft ?? 30,
    scale: adminConfig.winBoxScale ?? 100,
    rotation: adminConfig.winBoxRotation || 0,
    opacity: adminConfig.winBoxOpacity ?? 100,
    zIndex: adminConfig.winBoxZIndex ?? 30,
  });

  const winOverlayStyle = calculateAnchorStyle({
    anchor: adminConfig.winOverlayAnchor || 'center',
    top: adminConfig.winOverlayTop ?? 20,
    left: adminConfig.winOverlayLeft ?? 50,
    scale: adminConfig.winOverlayScale ?? 100,
    rotation: adminConfig.winOverlayRotation || 0,
    opacity: adminConfig.winOverlayOpacity ?? 100,
    zIndex: adminConfig.winOverlayZIndex ?? 40,
  });

  const slotStyle = calculateAnchorStyle({
    anchor: adminConfig.slotAnchor || 'top-left',
    top: adminConfig.slotTop ?? 28,
    left: adminConfig.slotLeft ?? 5,
    width: adminConfig.slotWidth ?? 90,
    height: adminConfig.slotHeight ?? 48,
    rotation: adminConfig.slotRotation || 0,
    opacity: adminConfig.slotOpacity ?? 100,
    zIndex: adminConfig.slotZIndex ?? 10,
  });

  const spinStyle = calculateAnchorStyle({
    anchor: adminConfig.spinAnchor || 'bottom',
    top: adminConfig.spinTop !== undefined ? adminConfig.spinTop : undefined,
    bottom: adminConfig.spinTop === undefined ? (adminConfig.spinBottom ?? 4) : undefined,
    left: adminConfig.spinLeft ?? 50,
    scale: adminConfig.spinScale ?? 100,
    rotation: adminConfig.spinRotation || 0,
    opacity: adminConfig.spinOpacity ?? 100,
    zIndex: adminConfig.spinZIndex ?? 20,
  });

  const turboStyle = calculateAnchorStyle({
    anchor: adminConfig.turboAnchor || 'bottom',
    top: adminConfig.turboTop !== undefined ? adminConfig.turboTop : undefined,
    bottom: adminConfig.turboTop === undefined ? 8 : undefined,
    left: adminConfig.turboLeft ?? 80,
    scale: adminConfig.turboScale ?? 100,
    rotation: adminConfig.turboRotation || 0,
    opacity: adminConfig.turboOpacity ?? 100,
    zIndex: adminConfig.turboZIndex ?? 20,
  });

  const getTurboShapeClasses = (shape?: string) => {
    switch (shape) {
      case 'circle':
        return 'w-14 h-14 rounded-full p-0 flex flex-col items-center justify-center text-[10px]';
      case 'pill':
        return 'px-5 py-2.5 rounded-full flex items-center gap-2 font-black text-xs';
      case 'square':
        return 'w-14 h-14 rounded-xl p-0 flex flex-col items-center justify-center text-[10px]';
      case 'octagon':
        return 'px-4 py-2.5 [clip-path:polygon(20%_0%,80%_0%,100%_20%,100%_80%,80%_100%,20%_100%,0%_80%,0%_20%)] flex items-center gap-2 font-black text-xs';
      case 'diamond':
        return 'w-12 h-12 rotate-45 rounded-sm p-0 flex items-center justify-center text-[9px] my-2 mx-2';
      case 'rounded':
      default:
        return 'px-4 py-2.5 rounded-2xl flex items-center gap-2 font-black text-xs';
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden bg-[#020617] touch-none select-none"
    >
      {/* SCALED VIRTUAL CANVAS BASE CONTAINER */}
      <div
        style={{
          width: `${VIRTUAL_WIDTH}px`,
          height: `${VIRTUAL_HEIGHT}px`,
          transform: `scale(${scale || 1})`,
          transformOrigin: 'center center',
          position: 'absolute',
          top: '50%',
          left: '50%',
          marginTop: `-${VIRTUAL_HEIGHT / 2}px`,
          marginLeft: `-${VIRTUAL_WIDTH / 2}px`,
        }}
        className="relative overflow-hidden bg-[#050914] shadow-2xl"
        onClick={() => {
          if (isEditing && onSelectElement) onSelectElement(null);
        }}
      >
        {/* Background Media Layer */}
        <BackgroundMedia 
          src={adminConfig.bgImage}
          posX={adminConfig.bgPosX}
          posY={adminConfig.bgPosY}
          zoom={adminConfig.bgZoom}
          fit={adminConfig.bgFit}
          anchor={adminConfig.bgAnchor}
        />

        {/* Editor Grid Overlay */}
        {isEditing && adminConfig.gridEnabled && (
          <div 
            className="absolute inset-0 pointer-events-none z-50 opacity-25"
            style={{
              backgroundImage: `linear-gradient(to right, #d4af37 1px, transparent 1px), linear-gradient(to bottom, #d4af37 1px, transparent 1px)`,
              backgroundSize: `${adminConfig.gridSize || 5}% ${adminConfig.gridSize || 5}%`,
            }}
          />
        )}

        {/* Balance Widget */}
        {adminConfig.balanceVisible !== false && (
          <div 
            style={{
              ...balanceStyle,
              backgroundColor: adminConfig.balanceBgColor || 'rgba(0, 0, 0, 0.75)',
              borderColor: adminConfig.balanceBorderColor || 'rgba(212, 175, 55, 0.5)',
              backgroundImage: adminConfig.balanceBgImage ? `url(${adminConfig.balanceBgImage})` : undefined,
              backgroundSize: adminConfig.balanceBgImage ? 'cover' : undefined,
              backgroundPosition: adminConfig.balanceBgImage ? 'center' : undefined,
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (isEditing && onSelectElement) onSelectElement('balance');
            }}
            onMouseDown={(e) => handleMouseDown(e, 'balance', adminConfig.balanceLeft ?? 3, adminConfig.balanceTop ?? 3)}
            className={`flex items-center gap-3 backdrop-blur-md px-5 py-2.5 rounded-2xl border shadow-xl transition-shadow cursor-pointer ${
              isEditing && selectedElement === 'balance' ? 'ring-4 ring-amber-400 border-amber-300' : ''
            }`}
          >
            {isEditing && selectedElement === 'balance' && (
              <>
                <QuickScaleToolbar 
                  elementId="balance" 
                  currentScale={getScaleForElement('balance')} 
                  onUpdateScale={updateElementScale} 
                />
                <div
                  onMouseDown={(e) => handleResizeMouseDown(e, 'balance', getScaleForElement('balance'))}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute -bottom-2.5 -right-2.5 w-7 h-7 rounded-full bg-amber-400 text-black border-2 border-yellow-100 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.9)] cursor-nwse-resize z-[120] hover:scale-125 active:scale-110 transition-transform"
                  title="Arraste para redimensionar o tamanho diretamente na tela"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-black font-extrabold" />
                </div>
              </>
            )}
            <Coins className="w-7 h-7 text-yellow-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs text-yellow-500 font-bold uppercase tracking-wider">Saldo</span>
              <span 
                style={{ color: adminConfig.balanceTextColor || '#ffffff' }}
                className="text-2xl font-black"
              >
                R$ {gameState.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

        {/* Bet Controller Widget */}
        {adminConfig.betVisible !== false && (
          <div 
            style={{
              ...betStyle,
              backgroundColor: adminConfig.betBgColor || 'rgba(0, 0, 0, 0.75)',
              borderColor: adminConfig.betBorderColor || 'rgba(139, 105, 20, 0.5)',
              backgroundImage: adminConfig.betBgImage ? `url(${adminConfig.betBgImage})` : undefined,
              backgroundSize: adminConfig.betBgImage ? 'cover' : undefined,
              backgroundPosition: adminConfig.betBgImage ? 'center' : undefined,
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (isEditing && onSelectElement) onSelectElement('bet');
            }}
            onMouseDown={(e) => handleMouseDown(e, 'bet', adminConfig.betLeft ?? 55, adminConfig.betTop ?? 3)}
            className={`flex items-center backdrop-blur-md px-4 py-2 rounded-2xl border gap-3 transition-shadow cursor-pointer ${
              isEditing && selectedElement === 'bet' ? 'ring-4 ring-amber-400 border-amber-300' : ''
            }`}
          >
            {isEditing && selectedElement === 'bet' && (
              <>
                <QuickScaleToolbar 
                  elementId="bet" 
                  currentScale={getScaleForElement('bet')} 
                  onUpdateScale={updateElementScale} 
                />
                <div
                  onMouseDown={(e) => handleResizeMouseDown(e, 'bet', getScaleForElement('bet'))}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute -bottom-2.5 -right-2.5 w-7 h-7 rounded-full bg-amber-400 text-black border-2 border-yellow-100 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.9)] cursor-nwse-resize z-[120] hover:scale-125 active:scale-110 transition-transform"
                  title="Arraste para redimensionar o tamanho diretamente na tela"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-black font-extrabold" />
                </div>
              </>
            )}
            <button 
              onClick={(e) => {
                if (isEditing) return;
                e.stopPropagation();
                onBetChange(-5);
              }}
              disabled={gameState.isSpinning}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold disabled:opacity-50 cursor-pointer"
            >
              <Minus className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center px-2">
              <span className="text-xs text-gray-400 uppercase font-bold">Aposta</span>
              <span 
                style={{ color: adminConfig.betTextColor || '#fde073' }}
                className="text-xl font-bold"
              >
                R$ {gameState.bet.toFixed(2)}
              </span>
            </div>
            <button 
              onClick={(e) => {
                if (isEditing) return;
                e.stopPropagation();
                onBetChange(5);
              }}
              disabled={gameState.isSpinning}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Persistent Win Indicator Banner Badge (Quadro de Ganho 1 - Normal Win) */}
        {((!gameState.isSpinning && gameState.win > 0 && !gameState.bigWin) || (isEditing && selectedElement === 'winBox')) && adminConfig.winBoxVisible !== false && (
          <div 
            style={{
              ...winBoxStyle,
              backgroundColor: adminConfig.winBoxBgColor || 'rgba(16, 185, 129, 0.25)',
              borderColor: adminConfig.winBoxBorderColor || 'rgba(16, 185, 129, 0.6)',
              backgroundImage: adminConfig.winBoxBgImage ? `url(${adminConfig.winBoxBgImage})` : undefined,
              backgroundSize: adminConfig.winBoxBgImage ? 'cover' : undefined,
              backgroundPosition: adminConfig.winBoxBgImage ? 'center' : undefined,
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (isEditing && onSelectElement) onSelectElement('winBox');
            }}
            onMouseDown={(e) => handleMouseDown(e, 'winBox', adminConfig.winBoxLeft ?? 30, adminConfig.winBoxTop ?? 3)}
            className={`flex items-center gap-3 backdrop-blur-md px-5 py-2.5 rounded-2xl border shadow-xl transition-shadow cursor-pointer ${
              isEditing && selectedElement === 'winBox' ? 'ring-4 ring-amber-400 border-amber-300' : ''
            }`}
          >
            {isEditing && selectedElement === 'winBox' && (
              <>
                <QuickScaleToolbar 
                  elementId="winBox" 
                  currentScale={getScaleForElement('winBox')} 
                  onUpdateScale={updateElementScale} 
                />
                <div
                  onMouseDown={(e) => handleResizeMouseDown(e, 'winBox', getScaleForElement('winBox'))}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute -bottom-2.5 -right-2.5 w-7 h-7 rounded-full bg-amber-400 text-black border-2 border-yellow-100 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.9)] cursor-nwse-resize z-[120] hover:scale-125 active:scale-110 transition-transform"
                  title="Arraste para redimensionar o tamanho diretamente na tela"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-black font-extrabold" />
                </div>
              </>
            )}
            <Trophy className="w-7 h-7 text-emerald-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Ganho</span>
              <span 
                style={{ color: adminConfig.winBoxTextColor || '#34d399' }}
                className="text-2xl font-black"
              >
                R$ {(gameState.win > 0 ? gameState.win : 25.00).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Animated Big Win Counter Overlay (Quadro de Ganho 2 - Grande Ganho) */}
        {((!gameState.isSpinning && gameState.win > 0 && gameState.bigWin) || (isEditing && selectedElement === 'winOverlay')) && adminConfig.winOverlayVisible !== false && (
          <div
            style={winOverlayStyle}
            onClick={(e) => {
              e.stopPropagation();
              if (isEditing && onSelectElement) onSelectElement('winOverlay');
            }}
            onMouseDown={(e) => handleMouseDown(e, 'winOverlay', adminConfig.winOverlayLeft ?? 50, adminConfig.winOverlayTop ?? 20)}
            className={`cursor-pointer ${
              isEditing && selectedElement === 'winOverlay' ? 'ring-4 ring-amber-400 border-amber-300 rounded-2xl p-1' : ''
            }`}
          >
            {isEditing && selectedElement === 'winOverlay' && (
              <>
                <QuickScaleToolbar 
                  elementId="winOverlay" 
                  currentScale={getScaleForElement('winOverlay')} 
                  onUpdateScale={updateElementScale} 
                />
                <div
                  onMouseDown={(e) => handleResizeMouseDown(e, 'winOverlay', getScaleForElement('winOverlay'))}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute -bottom-2.5 -right-2.5 w-7 h-7 rounded-full bg-amber-400 text-black border-2 border-yellow-100 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.9)] cursor-nwse-resize z-[120] hover:scale-125 active:scale-110 transition-transform"
                  title="Arraste para redimensionar o tamanho diretamente na tela"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-black font-extrabold" />
                </div>
              </>
            )}
            <WinCounterOverlay 
              winAmount={gameState.win > 0 ? gameState.win : 1250.00} 
              isBigWin={gameState.bigWin || (isEditing && selectedElement === 'winOverlay')} 
              onClose={() => onClearWin?.()} 
              bgColor={adminConfig.winOverlayBgColor}
              textColor={adminConfig.winOverlayTextColor}
              borderColor={adminConfig.winOverlayBorderColor}
              bgImage={adminConfig.winOverlayBgImage}
            />
          </div>
        )}

        {/* Quick Menu & Admin Trigger Buttons */}
        <div className="absolute top-6 right-6 z-40 flex items-center gap-3 pointer-events-auto">
          {/* Menu Button */}
          <button
            onClick={onOpenMenu}
            className="p-3 bg-black/80 backdrop-blur-md hover:bg-white/10 rounded-2xl border border-[#d4af37]/50 text-[#d4af37] transition cursor-pointer shadow-lg"
            title="Menu Principal"
          >
            <Menu className="w-7 h-7" />
          </button>

          {/* Admin Quick Trigger */}
          <button
            onClick={onOpenAdmin}
            className="p-3 bg-red-950/90 backdrop-blur-md hover:bg-red-900 rounded-2xl border border-red-500/60 text-red-300 transition cursor-pointer shadow-lg"
            title="Painel de Administração"
          >
            <ShieldAlert className="w-7 h-7 text-red-400" />
          </button>
        </div>

        {/* Slot Machine Area */}
        {adminConfig.slotVisible !== false && (
          <div 
            style={{
              ...slotStyle,
              backgroundImage: adminConfig.slotBgImage ? `url(${adminConfig.slotBgImage})` : undefined,
              backgroundSize: adminConfig.slotBgImage ? 'cover' : undefined,
              backgroundPosition: adminConfig.slotBgImage ? 'center' : undefined,
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (isEditing && onSelectElement) onSelectElement('slot');
            }}
            onMouseDown={(e) => handleMouseDown(e, 'slot', adminConfig.slotLeft ?? 5, adminConfig.slotTop ?? 28)}
            className={`flex items-center justify-center transition-shadow cursor-pointer ${
              isEditing && selectedElement === 'slot' ? 'ring-4 ring-amber-400 border-amber-300 rounded-2xl' : ''
            }`}
          >
            {isEditing && selectedElement === 'slot' && (
              <>
                <QuickScaleToolbar 
                  elementId="slot" 
                  currentScale={getScaleForElement('slot')} 
                  onUpdateScale={updateElementScale} 
                />
                <div
                  onMouseDown={(e) => handleResizeMouseDown(e, 'slot', getScaleForElement('slot'))}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute -bottom-2.5 -right-2.5 w-7 h-7 rounded-full bg-amber-400 text-black border-2 border-yellow-100 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.9)] cursor-nwse-resize z-[120] hover:scale-125 active:scale-110 transition-transform"
                  title="Arraste para redimensionar o tamanho diretamente na tela"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-black font-extrabold" />
                </div>
              </>
            )}
            <SlotMachine 
              isSpinning={gameState.isSpinning} 
              grid={grid} 
              customSymbols={adminConfig.customSymbols}
              customSymbolConfigs={adminConfig.customSymbolConfigs}
              showReelBorders={adminConfig.showReelBorders}
              showReelBg={adminConfig.showReelBg}
              individualReelPositions={adminConfig.individualReelPositions}
              spinStyle={adminConfig.spinStyle}
              paylines={adminConfig.paylines}
              numReels={adminConfig.numReels}
              numRows={adminConfig.numRows}
              onAllReelsStopped={onAllReelsStopped}
            />
          </div>
        )}
        
        {/* Spin Button Area */}
        {adminConfig.spinVisible !== false && (
          <div 
            style={{
              ...spinStyle,
              backgroundImage: adminConfig.spinBgImage ? `url(${adminConfig.spinBgImage})` : undefined,
              backgroundSize: adminConfig.spinBgImage ? 'cover' : undefined,
              backgroundPosition: adminConfig.spinBgImage ? 'center' : undefined,
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (isEditing && onSelectElement) onSelectElement('spin');
            }}
            onMouseDown={(e) => handleMouseDown(e, 'spin', adminConfig.spinLeft ?? 50, adminConfig.spinTop ?? 88)}
            className={`cursor-pointer ${
              isEditing && selectedElement === 'spin' ? 'ring-4 ring-amber-400 border-amber-300 rounded-full' : ''
            }`}
          >
            {isEditing && selectedElement === 'spin' && (
              <>
                <QuickScaleToolbar 
                  elementId="spin" 
                  currentScale={getScaleForElement('spin')} 
                  onUpdateScale={updateElementScale} 
                />
                <div
                  onMouseDown={(e) => handleResizeMouseDown(e, 'spin', getScaleForElement('spin'))}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute -bottom-2.5 -right-2.5 w-7 h-7 rounded-full bg-amber-400 text-black border-2 border-yellow-100 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.9)] cursor-nwse-resize z-[120] hover:scale-125 active:scale-110 transition-transform"
                  title="Arraste para redimensionar o tamanho diretamente na tela"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-black font-extrabold" />
                </div>
              </>
            )}
            <SpinButton 
              shape={adminConfig.spinShape || 'circle'}
              onSpin={() => {
                if (!isEditing) onSpin();
              }} 
              isSpinning={gameState.isSpinning} 
            />
          </div>
        )}

        {/* Turbo Button Area */}
        {adminConfig.turboVisible !== false && (
          <div 
            style={{
              ...turboStyle,
              backgroundImage: adminConfig.turboBgImage ? `url(${adminConfig.turboBgImage})` : undefined,
              backgroundSize: adminConfig.turboBgImage ? 'cover' : undefined,
              backgroundPosition: adminConfig.turboBgImage ? 'center' : undefined,
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (isEditing && onSelectElement) onSelectElement('turbo');
            }}
            onMouseDown={(e) => handleMouseDown(e, 'turbo', adminConfig.turboLeft ?? 80, adminConfig.turboTop ?? 88)}
            className={`cursor-pointer ${
              isEditing && selectedElement === 'turbo' ? 'ring-4 ring-amber-400 border-amber-300 rounded-2xl p-1' : ''
            }`}
          >
            {isEditing && selectedElement === 'turbo' && (
              <>
                <QuickScaleToolbar 
                  elementId="turbo" 
                  currentScale={getScaleForElement('turbo')} 
                  onUpdateScale={updateElementScale} 
                />
                <div
                  onMouseDown={(e) => handleResizeMouseDown(e, 'turbo', getScaleForElement('turbo'))}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute -bottom-2.5 -right-2.5 w-7 h-7 rounded-full bg-amber-400 text-black border-2 border-yellow-100 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.9)] cursor-nwse-resize z-[120] hover:scale-125 active:scale-110 transition-transform"
                  title="Arraste para redimensionar o tamanho diretamente na tela"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-black font-extrabold" />
                </div>
              </>
            )}
            <button
              type="button"
              onClick={(e) => {
                if (isEditing) return;
                e.stopPropagation();
                const newSpinStyle = adminConfig.spinStyle === 'turbo' ? 'smooth' : 'turbo';
                if (onUpdateAdminConfig) {
                  onUpdateAdminConfig({ spinStyle: newSpinStyle });
                }
                if (onToggleTurbo) {
                  onToggleTurbo();
                }
              }}
              className={`border backdrop-blur-md uppercase tracking-wider transition-all shadow-xl cursor-pointer active:scale-95 ${getTurboShapeClasses(adminConfig.turboShape || 'pill')} ${
                adminConfig.spinStyle === 'turbo' || gameSettings?.turboMode
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-yellow-300 shadow-[0_0_25px_rgba(245,158,11,0.9)]'
                  : 'bg-black/80 text-amber-400 border-amber-500/40 hover:bg-amber-950/80 hover:border-amber-400'
              }`}
            >
              <div className={`flex items-center gap-1.5 ${adminConfig.turboShape === 'diamond' ? '-rotate-45' : ''}`}>
                <Zap className={`w-4 h-4 ${adminConfig.spinStyle === 'turbo' || gameSettings?.turboMode ? 'fill-black text-black animate-pulse' : 'text-amber-400'}`} />
                <span>TURBO</span>
              </div>
            </button>
          </div>
        )}

        {/* Quick Stage Metrics & Shape Bar Toggle Buttons */}
        {isEditing && (
          <div className="absolute top-3 left-3 right-3 z-[100] flex items-center justify-between pointer-events-auto gap-2 flex-wrap">
            {/* Quick Shape Switcher Bar */}
            <div className="bg-slate-950/90 border-2 border-amber-400/80 p-1.5 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.5)] backdrop-blur-md flex items-center gap-2">
              <span className="text-[10px] font-black text-amber-300 uppercase tracking-wide px-1 hidden sm:inline flex items-center gap-1">
                <span>✨ Formato do Botão:</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectElement) onSelectElement('spin');
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold border transition ${
                    selectedElement === 'spin' ? 'bg-amber-400 text-black border-amber-200 shadow' : 'bg-black/60 text-amber-300 border-amber-500/30'
                  }`}
                >
                  🎯 Girar
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectElement) onSelectElement('turbo');
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold border transition ${
                    selectedElement === 'turbo' ? 'bg-amber-400 text-black border-amber-200 shadow' : 'bg-black/60 text-amber-300 border-amber-500/30'
                  }`}
                >
                  ⚡ Turbo
                </button>
              </div>

              <div className="w-[1px] h-4 bg-white/20 my-auto" />

              <div className="flex items-center gap-1">
                {[
                  { id: 'circle', label: '⚪ Círculo' },
                  { id: 'pill', label: '💊 Cápsula' },
                  { id: 'rounded', label: '⬛ Arredondado' },
                  { id: 'square', label: '🔲 Quadrado' },
                  { id: 'octagon', label: '🛑 Octágono' },
                  { id: 'diamond', label: '🔷 Diamante' },
                ].map((shapeOpt) => {
                  const targetEl = selectedElement === 'turbo' ? 'turbo' : 'spin';
                  const currentShape = targetEl === 'turbo' ? (adminConfig.turboShape || 'pill') : (adminConfig.spinShape || 'circle');
                  const isActive = currentShape === shapeOpt.id;
                  return (
                    <button
                      key={shapeOpt.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onUpdateAdminConfig) {
                          if (targetEl === 'turbo') {
                            onUpdateAdminConfig({ turboShape: shapeOpt.id as any });
                          } else {
                            onUpdateAdminConfig({ spinShape: shapeOpt.id as any });
                          }
                        }
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-400 text-black border-yellow-200 font-black shadow-[0_0_10px_rgba(251,191,36,0.8)] scale-105'
                          : 'bg-white/10 text-gray-300 border-white/10 hover:bg-white/20'
                      }`}
                    >
                      {shapeOpt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onUpdateAdminConfig) {
                  onUpdateAdminConfig({ showMetrics: !adminConfig.showMetrics });
                }
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 border shadow-xl transition cursor-pointer ${
                adminConfig.showMetrics
                  ? 'bg-cyan-400 text-black border-cyan-300 font-extrabold shadow-[0_0_15px_rgba(6,182,212,0.8)]'
                  : 'bg-black/80 text-cyan-400 border-cyan-500/50 hover:bg-cyan-950'
              }`}
              title="Ativar/Desativar réguas e métricas de medida da tela"
            >
              <Ruler className="w-3.5 h-3.5 text-current" />
              <span>{adminConfig.showMetrics ? '📏 Métricas ON' : '📏 Medidas OFF'}</span>
            </button>
          </div>
        )}

        {/* 100% FAITHFUL SCREEN METRICS & RULERS OVERLAY LAYER */}
        {adminConfig.showMetrics && (
          <div className="absolute inset-0 pointer-events-none z-[80]">
            {/* 1. HUD Resolution Banner */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[95] bg-slate-950/95 border-2 border-cyan-400 text-cyan-300 px-3.5 py-1.5 rounded-full font-mono text-[10px] sm:text-xs font-black shadow-[0_0_20px_rgba(6,182,212,0.6)] flex items-center gap-2.5 backdrop-blur-md">
              <Ruler className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
              <span>Canvas Base: <strong className="text-white">{VIRTUAL_WIDTH}×{VIRTUAL_HEIGHT}px</strong></span>
              <span className="text-cyan-500">|</span>
              <span>Tela Real: <strong className="text-white">{Math.round(stageSize.width)}×{Math.round(stageSize.height)}px</strong></span>
              <span className="text-cyan-500">|</span>
              <span>Escala: <strong className="text-amber-400">{(scale || 1).toFixed(3)}x</strong></span>
            </div>

            {/* 2. Top Horizontal Ruler (X Axis) */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-black/90 text-cyan-300 border-b-2 border-cyan-400/80 font-mono text-[9px] flex justify-between items-end px-2 pb-0.5">
              {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((pct) => {
                const pxVal = Math.round((pct / 100) * VIRTUAL_WIDTH);
                return (
                  <div key={pct} className="flex flex-col items-center relative" style={{ left: `${pct}%`, position: pct === 0 || pct === 100 ? 'relative' : 'absolute', transform: pct > 0 && pct < 100 ? 'translateX(-50%)' : 'none' }}>
                    <span className="text-[8px] font-black text-cyan-300">{pct}%</span>
                    <span className="text-[7px] text-gray-400 leading-none">{pxVal}px</span>
                    <div className="w-[1px] h-2 bg-cyan-400 mt-0.5" />
                  </div>
                );
              })}
            </div>

            {/* 3. Left Vertical Ruler (Y Axis) */}
            <div className="absolute top-0 left-0 bottom-0 w-10 bg-black/90 text-cyan-300 border-r-2 border-cyan-400/80 font-mono text-[9px] flex flex-col justify-between py-2 pl-0.5">
              {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((pct) => {
                const pxVal = Math.round((pct / 100) * VIRTUAL_HEIGHT);
                return (
                  <div key={pct} className="flex items-center gap-1 relative" style={{ top: `${pct}%`, position: pct === 0 || pct === 100 ? 'relative' : 'absolute', transform: pct > 0 && pct < 100 ? 'translateY(-50%)' : 'none' }}>
                    <div className="h-[1px] w-2 bg-cyan-400" />
                    <div className="flex flex-col leading-tight">
                      <span className="text-[8px] font-black text-cyan-300">{pct}%</span>
                      <span className="text-[7px] text-gray-400">{pxVal}px</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 4. Center Crosshairs (50% X and 50% Y) */}
            <div className="absolute top-0 bottom-0 left-[50%] w-[1px] bg-cyan-400/60 border-l border-dashed border-cyan-300">
              <span className="absolute top-12 left-1 bg-cyan-950/90 border border-cyan-400 text-cyan-200 px-1.5 py-0.5 rounded font-mono text-[8px] font-bold">
                Centro X: 50% ({Math.round(0.5 * VIRTUAL_WIDTH)}px)
              </span>
            </div>
            <div className="absolute left-0 right-0 top-[50%] h-[1px] bg-cyan-400/60 border-t border-dashed border-cyan-300">
              <span className="absolute left-12 top-1 bg-cyan-950/90 border border-cyan-400 text-cyan-200 px-1.5 py-0.5 rounded font-mono text-[8px] font-bold">
                Centro Y: 50% ({Math.round(0.5 * VIRTUAL_HEIGHT)}px)
              </span>
            </div>

            {/* 5. Precise Element Measurement Badges & Bounding Outlines */}

            {/* Slot Machine Metric Badge */}
            {adminConfig.slotVisible !== false && (
              <div 
                style={{
                  top: `${adminConfig.slotTop ?? 28}%`,
                  left: `${adminConfig.slotLeft ?? 5}%`,
                  width: `${adminConfig.slotWidth ?? 90}%`,
                  height: `${adminConfig.slotHeight ?? 48}%`,
                }}
                className={`absolute border-2 border-dashed ${selectedElement === 'slot' ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 'border-cyan-400/80 bg-cyan-950/20'} rounded-xl transition-all pointer-events-none`}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/90 border border-cyan-400 text-cyan-300 px-2 py-0.5 rounded font-mono text-[9px] font-bold whitespace-nowrap shadow-lg flex items-center gap-1.5">
                  <span className="text-amber-400 font-extrabold">🎰 SLOT</span>
                  <span>X: {(adminConfig.slotLeft ?? 5)}% ({Math.round((adminConfig.slotLeft ?? 5) * VIRTUAL_WIDTH / 100)}px)</span>
                  <span>Y: {(adminConfig.slotTop ?? 28)}% ({Math.round((adminConfig.slotTop ?? 28) * VIRTUAL_HEIGHT / 100)}px)</span>
                  <span>W: {(adminConfig.slotWidth ?? 90)}% ({Math.round((adminConfig.slotWidth ?? 90) * VIRTUAL_WIDTH / 100)}px)</span>
                  <span>H: {(adminConfig.slotHeight ?? 48)}% ({Math.round((adminConfig.slotHeight ?? 48) * VIRTUAL_HEIGHT / 100)}px)</span>
                </div>
              </div>
            )}

            {/* Balance Metric Badge */}
            {adminConfig.balanceVisible !== false && (
              <div 
                style={{
                  top: `${adminConfig.balanceTop ?? 3}%`,
                  left: `${adminConfig.balanceLeft ?? 3}%`,
                }}
                className={`absolute border-2 border-dashed ${selectedElement === 'balance' ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 'border-cyan-400/80 bg-cyan-950/20'} rounded-xl transition-all pointer-events-none p-1`}
              >
                <div className="absolute -bottom-6 left-0 bg-black/90 border border-cyan-400 text-cyan-300 px-2 py-0.5 rounded font-mono text-[9px] font-bold whitespace-nowrap shadow-lg flex items-center gap-1.5">
                  <span className="text-yellow-400 font-extrabold">💰 SALDO</span>
                  <span>X: {(adminConfig.balanceLeft ?? 3)}% ({Math.round((adminConfig.balanceLeft ?? 3) * VIRTUAL_WIDTH / 100)}px)</span>
                  <span>Y: {(adminConfig.balanceTop ?? 3)}% ({Math.round((adminConfig.balanceTop ?? 3) * VIRTUAL_HEIGHT / 100)}px)</span>
                </div>
              </div>
            )}

            {/* Bet Metric Badge */}
            {adminConfig.betVisible !== false && (
              <div 
                style={{
                  top: `${adminConfig.betTop ?? 3}%`,
                  left: `${adminConfig.betLeft ?? 55}%`,
                }}
                className={`absolute border-2 border-dashed ${selectedElement === 'bet' ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 'border-cyan-400/80 bg-cyan-950/20'} rounded-xl transition-all pointer-events-none p-1`}
              >
                <div className="absolute -bottom-6 left-0 bg-black/90 border border-cyan-400 text-cyan-300 px-2 py-0.5 rounded font-mono text-[9px] font-bold whitespace-nowrap shadow-lg flex items-center gap-1.5">
                  <span className="text-amber-300 font-extrabold">💵 APOSTA</span>
                  <span>X: {(adminConfig.betLeft ?? 55)}% ({Math.round((adminConfig.betLeft ?? 55) * VIRTUAL_WIDTH / 100)}px)</span>
                  <span>Y: {(adminConfig.betTop ?? 3)}% ({Math.round((adminConfig.betTop ?? 3) * VIRTUAL_HEIGHT / 100)}px)</span>
                </div>
              </div>
            )}

            {/* Win Box (Fixed) Metric Badge */}
            {adminConfig.winBoxVisible !== false && (
              <div 
                style={{
                  top: `${adminConfig.winBoxTop ?? 3}%`,
                  left: `${adminConfig.winBoxLeft ?? 30}%`,
                }}
                className={`absolute border-2 border-dashed ${selectedElement === 'winBox' ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 'border-emerald-400/80 bg-emerald-950/20'} rounded-xl transition-all pointer-events-none p-1`}
              >
                <div className="absolute -bottom-6 left-0 bg-black/90 border border-emerald-400 text-emerald-300 px-2 py-0.5 rounded font-mono text-[9px] font-bold whitespace-nowrap shadow-lg flex items-center gap-1.5">
                  <span className="text-emerald-400 font-extrabold">🏆 GANHO FIXO</span>
                  <span>X: {(adminConfig.winBoxLeft ?? 30)}% ({Math.round((adminConfig.winBoxLeft ?? 30) * VIRTUAL_WIDTH / 100)}px)</span>
                  <span>Y: {(adminConfig.winBoxTop ?? 3)}% ({Math.round((adminConfig.winBoxTop ?? 3) * VIRTUAL_HEIGHT / 100)}px)</span>
                </div>
              </div>
            )}

            {/* Win Overlay Metric Badge */}
            {adminConfig.winOverlayVisible !== false && (
              <div 
                style={{
                  top: `${adminConfig.winOverlayTop ?? 20}%`,
                  left: `${adminConfig.winOverlayLeft ?? 50}%`,
                }}
                className={`absolute border-2 border-dashed ${selectedElement === 'winOverlay' ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 'border-amber-400/80 bg-amber-950/20'} rounded-xl transition-all pointer-events-none p-1`}
              >
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black/90 border border-amber-400 text-amber-300 px-2 py-0.5 rounded font-mono text-[9px] font-bold whitespace-nowrap shadow-lg flex items-center gap-1.5">
                  <span className="text-amber-400 font-extrabold">🎉 OVERLAY GANHO</span>
                  <span>X: {(adminConfig.winOverlayLeft ?? 50)}% ({Math.round((adminConfig.winOverlayLeft ?? 50) * VIRTUAL_WIDTH / 100)}px)</span>
                  <span>Y: {(adminConfig.winOverlayTop ?? 20)}% ({Math.round((adminConfig.winOverlayTop ?? 20) * VIRTUAL_HEIGHT / 100)}px)</span>
                </div>
              </div>
            )}

            {/* Spin Button Metric Badge */}
            {adminConfig.spinVisible !== false && (
              <div 
                style={{
                  top: `${adminConfig.spinTop ?? 88}%`,
                  left: `${adminConfig.spinLeft ?? 50}%`,
                }}
                className={`absolute border-2 border-dashed ${selectedElement === 'spin' ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 'border-red-400/80 bg-red-950/20'} rounded-full transition-all pointer-events-none p-1`}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/90 border border-red-400 text-red-300 px-2 py-0.5 rounded font-mono text-[9px] font-bold whitespace-nowrap shadow-lg flex items-center gap-1.5">
                  <span className="text-red-400 font-extrabold">🎯 GIRAR</span>
                  <span>X: {(adminConfig.spinLeft ?? 50)}% ({Math.round((adminConfig.spinLeft ?? 50) * VIRTUAL_WIDTH / 100)}px)</span>
                  <span>Y: {(adminConfig.spinTop ?? 88)}% ({Math.round((adminConfig.spinTop ?? 88) * VIRTUAL_HEIGHT / 100)}px)</span>
                </div>
              </div>
            )}

            {/* Turbo Button Metric Badge */}
            {adminConfig.turboVisible !== false && (
              <div 
                style={{
                  top: `${adminConfig.turboTop ?? 88}%`,
                  left: `${adminConfig.turboLeft ?? 80}%`,
                }}
                className={`absolute border-2 border-dashed ${selectedElement === 'turbo' ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 'border-amber-400/80 bg-amber-950/20'} rounded-2xl transition-all pointer-events-none p-1`}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/90 border border-amber-400 text-amber-300 px-2 py-0.5 rounded font-mono text-[9px] font-bold whitespace-nowrap shadow-lg flex items-center gap-1.5">
                  <span className="text-amber-400 font-extrabold">⚡ TURBO</span>
                  <span>X: {(adminConfig.turboLeft ?? 80)}% ({Math.round((adminConfig.turboLeft ?? 80) * VIRTUAL_WIDTH / 100)}px)</span>
                  <span>Y: {(adminConfig.turboTop ?? 88)}% ({Math.round((adminConfig.turboTop ?? 88) * VIRTUAL_HEIGHT / 100)}px)</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Editor Selection Handles Overlay */}
        {isEditing && selectedElement && (
          <div className="absolute top-4 left-4 z-50 bg-black/90 text-amber-300 border border-amber-500/60 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 shadow-2xl">
            <Move className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>
              Elemento Selecionado: <strong className="text-white uppercase">{selectedElement}</strong>
            </span>
          </div>
        )}

      </div>
    </div>
  );
};
