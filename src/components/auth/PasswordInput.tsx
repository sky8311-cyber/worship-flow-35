import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  showStrength?: boolean;
  placeholder?: string;
}

const getStrength = (password: string) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return score; // 0-5
};

export const PasswordInput = ({
  id,
  value,
  onChange,
  required,
  showStrength = false,
  placeholder,
}: PasswordInputProps) => {
  const [visible, setVisible] = useState(false);
  const { language } = useTranslation();

  const strength = useMemo(() => getStrength(value), [value]);

  const strengthPercent = value.length === 0 ? 0 : Math.min(100, (strength / 5) * 100);
  const strengthColor =
    strength <= 1 ? "bg-destructive" : strength <= 3 ? "bg-yellow-500" : "bg-green-500";
  const strengthLabel =
    language === "ko"
      ? strength <= 1
        ? "약함"
        : strength <= 3
        ? "보통"
        : "강함"
      : strength <= 1
      ? "Weak"
      : strength <= 3
      ? "Fair"
      : "Strong";

  const checks = [
    {
      met: value.length >= 8,
      label: language === "ko" ? "8자 이상" : "8+ characters",
    },
    {
      met: /[0-9]/.test(value),
      label: language === "ko" ? "숫자 포함" : "Contains number",
    },
    {
      met: /[^a-zA-Z0-9]/.test(value),
      label: language === "ko" ? "특수문자 포함" : "Special character",
    },
  ];

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10"
          placeholder={placeholder}
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
          onClick={() => setVisible(!visible)}
          tabIndex={-1}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {showStrength && value.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-300", strengthColor)}
                style={{ width: `${strengthPercent}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground min-w-[32px]">{strengthLabel}</span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {checks.map((c) => (
              <span
                key={c.label}
                className={cn(
                  "text-xs flex items-center gap-1",
                  c.met ? "text-green-600" : "text-muted-foreground"
                )}
              >
                {c.met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                {c.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
