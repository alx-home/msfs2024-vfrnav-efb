/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright © 2026 Alexandre GARCIN
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If
 * not, see <https://gnu.org>.
 */

import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';

import en from './langs/en.json';
import fr from './langs/fr.json';
import de from './langs/de.json';
import it from './langs/it.json';
import es from './langs/es.json';
import ja from './langs/ja.json';
import nl from './langs/nl.json';
import pl from './langs/pl.json';
import pt from './langs/pt.json';
import ptBR from './langs/pt-BR.json';
import ru from './langs/ru.json';
import sv from './langs/sv.json';
import tr from './langs/tr.json';
import zhCN from './langs/zh-CN.json';
import { useEvent } from 'react-use-event-hook';

const translations = { de, en, es, fr, it, ja, nl, pl, pt, 'pt-BR': ptBR, ru, sv, tr, 'zh-CN': zhCN } as const;
export type Language = keyof typeof translations;

type NestedKeyOf<T> = T extends object
   ? { [K in keyof T & string]: T[K] extends object ? `${K}.${NestedKeyOf<T[K]>}` : K }[keyof T & string]
   : never;

export type TranslationKey = NestedKeyOf<typeof en>;

interface I18nContextType {
   lang: Language;
   setLang: (_lang: Language) => void;
   t: (_key: TranslationKey, _vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

const detectSystemLanguage = (): Language => {
   const rawLang = navigator.language || navigator.languages?.[0] || 'en';
   if (rawLang in translations) {
      return rawLang as Language;
   }

   const shortLang = rawLang.split('-')[0].toLowerCase();
   if (shortLang === 'zh') {
      return 'zh-CN';
   }

   return shortLang in translations ? (shortLang as Language) : 'en';
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
   const [langState, setLangState] = useState<Language>(detectSystemLanguage);

   const setLang = useEvent((newLang: Language) => {
      setLangState(newLang);
      window.setLang(newLang);
   });

   const t = useCallback((key: TranslationKey, vars?: Record<string, string | number>): string => {
      const parts = String(key).split('.');
      const currentDict: unknown = translations[langState];
      const fallbackDict: unknown = translations.en;

      const rawValue =
         parts.reduce<unknown>((obj, part) => (obj as Record<string, unknown>)?.[part], currentDict) ??
         parts.reduce<unknown>((obj, part) => (obj as Record<string, unknown>)?.[part], fallbackDict);

      const text = typeof rawValue === 'string' ? rawValue : String(key);

      if (!vars) {
         return text;
      }

      return Object.entries(vars).reduce(
         (acc, [k, v]) => acc.replace(new RegExp(String.raw`\{\{\s*${k}\s*\}\}`, 'g'), String(v)),
         text
      );
   }, [langState]);

   const provider = useMemo(() => ({ lang: langState, setLang, t }), [langState, setLang, t]);

   const fetchLang = useEvent(async () => {
      const saved = await window.getLang() as Language | null;

      if (saved && saved in translations) {
         setLangState(saved);
      } else {
         const systemLang = detectSystemLanguage();
         setLang(systemLang);
      }
   });

   useEffect(() => {
      fetchLang();
   }, [fetchLang]);

   return <I18nContext.Provider value={provider}>{children}</I18nContext.Provider>;
};

export const useTranslation = () => {
   const ctx = useContext(I18nContext);
   if (!ctx) {
      throw new Error('useTranslation must be used within I18nProvider');
   }

   return ctx;
};
