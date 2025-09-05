"use client";

import * as React from "react";
import { Loader2, RotateCcw, Save } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  canSave: boolean;
  submitting: boolean;
  onReset: () => void;
  saveLabel?: string;
  resetLabel?: string;
  className?: string;
};

export default function StickyActions({
  title,
  subtitle,
  canSave,
  submitting,
  onReset,
  saveLabel = "Enregistrer",
  resetLabel = "Réinitialiser",
  className,
}: Props) {
  return (
    <header className={["sticky top-[68px] z-10 -mx-2 sm:-mx-0", className || ""].join(" ")}>
      <div className="mx-2 sm:mx-0 bg-white/90 backdrop-blur rounded-xl border border-orange-100 shadow px-2 sm:px-3 py-2 flex items-center justify-between">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-[#E63946] truncate">{title}</h2>
          {subtitle && <p className="hidden sm:block text-xs text-gray-500 truncate">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-xs sm:text-sm text-gray-700 hover:bg-orange-50"
            title={resetLabel}
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">{resetLabel}</span>
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium shadow-sm disabled:opacity-50"
            aria-disabled={!canSave}
            title={`${saveLabel} (⌘/Ctrl+S)`}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span className="hidden sm:inline">{submitting ? "Enregistrement…" : saveLabel}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
