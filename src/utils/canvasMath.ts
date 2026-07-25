import React from 'react';
import { AnchorType } from '../types';

export function calculateAnchorStyle(params: {
  anchor?: AnchorType;
  top?: number;
  left?: number;
  bottom?: number;
  width?: number;
  height?: number;
  scale?: number;
  rotation?: number;
  opacity?: number;
  zIndex?: number;
}): React.CSSProperties {
  const {
    anchor = 'top-left',
    top,
    left = 0,
    bottom,
    width,
    height,
    scale = 100,
    rotation = 0,
    opacity = 100,
    zIndex = 10,
  } = params;

  const style: React.CSSProperties = {
    position: 'absolute',
    opacity: opacity / 100,
    zIndex,
  };

  if (width !== undefined) style.width = `${width}%`;
  if (height !== undefined) style.height = `${height}%`;

  const scaleFactor = scale / 100;
  let transformBase = `scale(${scaleFactor}) rotate(${rotation || 0}deg)`;
  let transformOrigin = 'center center';

  switch (anchor) {
    case 'center':
      style.top = `${top ?? 50}%`;
      style.left = `${left}%`;
      transformBase = `translate(-50%, -50%) ` + transformBase;
      transformOrigin = 'center center';
      break;

    case 'top':
      style.top = `${top ?? 0}%`;
      style.left = `${left}%`;
      transformBase = `translateX(-50%) ` + transformBase;
      transformOrigin = 'top center';
      break;

    case 'bottom':
      if (top !== undefined) {
        style.top = `${top}%`;
      } else {
        style.bottom = `${bottom ?? 0}%`;
      }
      style.left = `${left}%`;
      transformBase = `translateX(-50%) ` + transformBase;
      transformOrigin = 'bottom center';
      break;

    case 'left':
      style.top = `${top ?? 50}%`;
      style.left = `${left}%`;
      transformBase = `translateY(-50%) ` + transformBase;
      transformOrigin = 'center left';
      break;

    case 'right':
      style.top = `${top ?? 50}%`;
      style.left = `${left}%`;
      transformBase = `translate(-50%, -50%) ` + transformBase;
      transformOrigin = 'center right';
      break;

    case 'top-left':
      style.top = `${top ?? 0}%`;
      style.left = `${left}%`;
      transformOrigin = 'top left';
      break;

    case 'top-right':
      style.top = `${top ?? 0}%`;
      style.left = `${left}%`;
      transformBase = `translateX(-100%) ` + transformBase;
      transformOrigin = 'top right';
      break;

    case 'bottom-left':
      if (top !== undefined) {
        style.top = `${top}%`;
      } else {
        style.bottom = `${bottom ?? 0}%`;
      }
      style.left = `${left}%`;
      transformBase = `translateY(-100%) ` + transformBase;
      transformOrigin = 'bottom left';
      break;

    case 'bottom-right':
      if (top !== undefined) {
        style.top = `${top}%`;
      } else {
        style.bottom = `${bottom ?? 0}%`;
      }
      style.left = `${left}%`;
      transformBase = `translate(-100%, -100%) ` + transformBase;
      transformOrigin = 'bottom right';
      break;
  }

  style.transform = transformBase;
  style.transformOrigin = transformOrigin;

  return style;
}
