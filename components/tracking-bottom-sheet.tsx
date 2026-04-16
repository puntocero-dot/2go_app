"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface BottomSheetProps {
  children: React.ReactNode;
  className?: string;
}

type SnapPoint = "collapsed" | "half" | "full";

const SNAP_HEIGHTS: Record<SnapPoint, string> = {
  collapsed: "180px",
  half: "50vh",
  full: "85vh",
};

export function TrackingBottomSheet({ children, className = "" }: BottomSheetProps) {
  const [snap, setSnap] = useState<SnapPoint>("half");
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ startY: 0, startHeight: 0, isDragging: false });

  const handleToggle = useCallback(() => {
    setSnap((current) => {
      if (current === "collapsed") return "half";
      if (current === "half") return "full";
      return "collapsed";
    });
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!sheetRef.current) return;
    dragRef.current = {
      startY: e.touches[0].clientY,
      startHeight: sheetRef.current.getBoundingClientRect().height,
      isDragging: true,
    };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragRef.current.isDragging || !sheetRef.current) return;
    const deltaY = dragRef.current.startY - e.touches[0].clientY;
    const newHeight = Math.max(160, Math.min(window.innerHeight * 0.85, dragRef.current.startHeight + deltaY));
    sheetRef.current.style.height = `${newHeight}px`;
    sheetRef.current.style.transition = "none";
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!sheetRef.current) return;
    dragRef.current.isDragging = false;
    const height = sheetRef.current.getBoundingClientRect().height;
    const vh = window.innerHeight;

    // Snap to nearest point
    sheetRef.current.style.transition = "height 0.3s ease-out";
    if (height < vh * 0.25) {
      setSnap("collapsed");
    } else if (height < vh * 0.65) {
      setSnap("half");
    } else {
      setSnap("full");
    }
  }, []);

  useEffect(() => {
    if (sheetRef.current) {
      sheetRef.current.style.transition = "height 0.3s ease-out";
      sheetRef.current.style.height = SNAP_HEIGHTS[snap];
    }
  }, [snap]);

  return (
    <div
      ref={sheetRef}
      className={`bg-white dark:bg-slate-900 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden ${className}`}
      style={{ height: SNAP_HEIGHTS[snap], transition: "height 0.3s ease-out" }}
    >
      {/* Drag handle */}
      <div
        className="flex-shrink-0 flex flex-col items-center pt-2 pb-1 cursor-grab active:cursor-grabbing touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleToggle}
      >
        <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        <div className="mt-1">
          {snap === "full" ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {children}
      </div>
    </div>
  );
}
