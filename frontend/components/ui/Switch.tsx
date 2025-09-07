"use client";

import * as React from "react";

type Props = {
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel?: string;
  className?: string;
};

export default function Switch({ checked, onChange, ariaLabel, className }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={[
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors ring-1 ring-black/5",
        checked ? "bg-neutral-900" : "bg-neutral-300",
        className || "",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
          checked ? "translate-x-5" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}
