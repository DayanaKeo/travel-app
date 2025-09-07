"use client";

import * as React from "react";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700" htmlFor={htmlFor}>
        {label}
      </label>
      <div className="mt-1">{children}</div>
      <div className="mt-1 flex items-center justify-between text-xs">
        {error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <span className="text-gray-400">{hint}</span>
        )}
      </div>
    </div>
  );
}

export const inputBase =
  "w-full rounded-xl border border-orange-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E63946]/30";
