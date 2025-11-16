import { useLanguageContext } from "@/contexts/LanguageContext";
import { translations, TranslationKeys } from "@/lib/translations";

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

type TranslationPath = NestedKeyOf<TranslationKeys>;

export const useTranslation = () => {
  const { language } = useLanguageContext();

  const t = (path: TranslationPath, params?: Record<string, string | number>): string => {
    const keys = path.split(".");
    let value: any = translations[language];

    for (const key of keys) {
      value = value?.[key];
    }

    if (typeof value !== "string") {
      console.warn(`Translation missing for path: ${path}`);
      return path;
    }

    if (params) {
      return Object.entries(params).reduce(
        (acc, [key, val]) => acc.replace(`{${key}}`, String(val)),
        value
      );
    }

    return value;
  };

  return { t, language };
};
