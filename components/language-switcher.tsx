"use client"

import { useId } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useI18n, type Locale } from "@/lib/i18n"

const languages: Array<{ code: Locale; label: string; flag: string }> = [
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "bs", label: "Bosanski", flag: "🇧🇦" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fi", label: "Suomi", flag: "🇫🇮" },
  { code: "da", label: "Dansk", flag: "🇩🇰" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
]

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n()
  const selectId = useId()

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Label htmlFor={selectId} className="hidden sm:block text-xs font-medium uppercase tracking-tight whitespace-nowrap">
        {t("common.language")}
      </Label>
      <Select value={locale} onValueChange={(val) => setLocale(val as Locale)}>
        <SelectTrigger id={selectId} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <span className="mr-2">{lang.flag}</span>
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
