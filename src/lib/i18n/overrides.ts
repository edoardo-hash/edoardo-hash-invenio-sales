import type { Lang } from ".";

/**
 * Hand corrections on top of DeepSeek's translations, by dictionary key ("section.key"). They win over the model
 * and need no re-translation: add a line, deploy. Keep {placeholders} as in English.
 */
export const OVERRIDES: Partial<Record<Lang, Record<string, string>>> = {
  it: {
    // 30 Oct 2026: the model wrote the plural "Vendete la vostra villa"; the site uses Lei throughout.
    "sell.title": "Venda la Sua villa con il team che la conosce già",
  },
};
