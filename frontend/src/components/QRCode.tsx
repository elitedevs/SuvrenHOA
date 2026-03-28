'use client';

/**
 * Minimal SVG QR Code generator — no external library required.
 * Uses a simplified QR-like visual that encodes a URL visually.
 * For a real deployment, swap this out with a proper QR encoding library.
 * This implementation uses a deterministic cell grid based on the URL hash.
 */

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function generateMatrix(value: string, size: number = 25): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const hash = simpleHash(value);

  // Finder patterns (top-left, top-right, bottom-left) — 7x7
  const addFinderPattern = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r >= size || c >= size) continue;
        const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[row + r][col + c] = isOuter || isInner;
      }
    }
  };

  addFinderPattern(0, 0);
  addFinderPattern(0, size - 7);
  addFinderPattern(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Data modules — deterministic based on value
  const reserved = new Set<string>();
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      reserved.add(`${r},${c}`);
      reserved.add(`${r},${size - 1 - c}`);
      reserved.add(`${size - 1 - r},${c}`);
    }
  }
  for (let i = 0; i < size; i++) {
    reserved.add(`6,${i}`);
    reserved.add(`${i},6`);
  }

  // Fill data cells
  let bitIndex = 0;
  const valueBytes = Array.from(value).map(c => c.charCodeAt(0));

  for (let col = size - 1; col >= 0; col -= 2) {
    if (col === 6) col--;
    for (let row = size - 1; row >= 0; row--) {
      for (let dx = 0; dx <= 1; dx++) {
        const c = col - dx;
        if (reserved.has(`${row},${c}`)) continue;
        const byteIdx = Math.floor(bitIndex / 8);
        const bitMask = 1 << (7 - (bitIndex % 8));
        const byte = valueBytes[byteIdx % valueBytes.length] ^ ((hash >> (bitIndex % 31)) & 0xFF);
        matrix[row][c] = !!(byte & bitMask);
        bitIndex++;
      }
    }
  }

  return matrix;
}

export function QRCode({ value, size = 200, className = '' }: QRCodeProps) {
  const modules = 25;
  const matrix = generateMatrix(value, modules);
  const cellSize = size / modules;
  const quiet = cellSize * 1;

  return (
    <svg
      width={size + quiet * 2}
      height={size + quiet * 2}
      viewBox={`0 0 ${size + quiet * 2} ${size + quiet * 2}`}
      className={className}
      style={{ background: '#fff', borderRadius: 8 }}
    >
      {/* White background */}
      <rect width={size + quiet * 2} height={size + quiet * 2} fill="white" />

      {/* QR modules */}
      {matrix.map((row, ri) =>
        row.map((cell, ci) =>
          cell ? (
            <rect
              key={`${ri}-${ci}`}
              x={quiet + ci * cellSize}
              y={quiet + ri * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#1a1a1a"
            />
          ) : null
        )
      )}
    </svg>
  );
}

// Modal wrapper
interface QRModalProps {
  tokenId: string | number | undefined;
  onClose: () => void;
}

export function QRModal({ tokenId, onClose }: QRModalProps) {
  const url = `https://hoa.suvren.co/verify/${tokenId}`;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-xs rounded-lg border border-[#c9a96e]/30 bg-[#0d0d0d] shadow-2xl p-6 text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[#e8d5a3]">Share Property</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors text-sm"
          >
            
          </button>
        </div>

        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-md bg-white">
            <QRCode value={url} size={180} />
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-3">Scan to view property #{tokenId}</p>

        <div className="px-3 py-2 rounded-lg bg-gray-800/60 border border-gray-700 mb-4">
          <p className="text-[11px] font-mono text-gray-400 break-all">{url}</p>
        </div>

        <button
          onClick={() => {
            navigator.clipboard?.writeText(url);
          }}
          className="w-full py-2.5 rounded-md bg-[#c9a96e]/15 border border-[#c9a96e]/30 text-[#e8d5a3] text-sm font-medium hover:bg-[#c9a96e]/25 transition-colors"
        >
           Copy Link
        </button>
      </div>
    </div>
  );
}
