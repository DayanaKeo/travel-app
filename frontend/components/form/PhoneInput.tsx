"use client";
import { useEffect, useMemo, useState } from "react";
import {
  AsYouType,
  parsePhoneNumberFromString,
  CountryCode,
} from "libphonenumber-js";

type PhoneChange = {
  e164: string | null;
  raw: string; 
  valid: boolean;
};

export default function PhoneInput({
  valueE164 = "",
  country = "FR",
  onChange,
  onBlur,
}: {
  valueE164?: string;
  country?: string; 
  onChange: (v: PhoneChange) => void;
  onBlur?: () => void;
}) {
  const [raw, setRaw] = useState<string>("");

  useEffect(() => {
    if (!valueE164) {
      setRaw("");
      return;
    }
    const parsed = parsePhoneNumberFromString(valueE164);
    if (parsed?.isValid()) {
      const cc = (country?.toUpperCase() as CountryCode) || "FR";
      setRaw(parsed.country === cc ? parsed.formatNational() : parsed.formatInternational());
    } else {
      setRaw(valueE164);
    }
  }, [valueE164, country]);

  function handleChange(v: string) {
    // format progressif local
    const cc = (country?.toUpperCase() as CountryCode) || "FR";
    const formatter = new AsYouType(cc);
    const formatted = formatter.input(v);
    setRaw(formatted);

    const parsed = parsePhoneNumberFromString(formatted, cc);
    const valid = !!parsed?.isValid();
    const e164 = valid ? parsed!.number : null;

    onChange({ e164, raw: formatted, valid });
  }

  function handleBlur() {
    onBlur?.();
  }

  return (
    <div className="grid gap-1">
      <input
        className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-400"
        placeholder="06 12 34 56 78"
        value={raw}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        inputMode="tel"
        autoComplete="tel"
      />
    </div>
  );
}
