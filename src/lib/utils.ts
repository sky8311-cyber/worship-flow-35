import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateResponsive(
  date: Date | string,
  language: string,
  isMobile: boolean = false
) {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const locale = language === "ko" ? ko : enUS;

  if (isMobile) {
    return format(dateObj, language === "ko" ? "M/d (EEE)" : "M/d (EEE)", {
      locale,
    });
  }
  return format(
    dateObj,
    language === "ko" ? "yyyy년 M월 d일 (EEE)" : "MMM d, yyyy (EEE)",
    { locale }
  );
}
