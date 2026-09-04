# The translation overlay: design constraints

Owner's decision, 4 September 2026: not built yet, but everything built
from now on must leave room for it, and it must extend to any language,
not only Portuguese.

- Records stay in English and stay the only place an assertion lives. A
  translation is an **overlay**: `data/i18n/<bcp47>/<kind>/<id>.json`
  carrying only the translatable fields of one record (`title`,
  `summary`, `body`, `names`, an edge's `explanation` and `dispute.text`,
  a narrative's step texts) and nothing structural — never dates, ids,
  sources, confidence or types. A missing overlay falls back to English
  field by field, never whole-record.
- Interface strings are separate from record translations:
  `src/i18n/<bcp47>.json`, keyed by string id, English the source of
  truth, missing keys falling back to English. No string of the interface
  is written inline in a module once this lands; they are today, and the
  overlay milestone extracts them.
- The language is state: `?lang=` in the URL, with the browser's
  language as the default and English as the last fallback. Search folds
  and ranks in every loaded language.
- An overlay is a record for the pipeline: validated against a schema that
  refuses any field not in the translatable list, signed like any other
  record, counted in the review queue, contributable through the same
  form with the source record beside it. A translation is never marked
  reviewed by the same person who signed the original in a language they
  do not read; the dashboard cannot know that, so the signature carries
  a `language` field.
- Language codes are BCP 47 (`pt-PT`, `pt-BR`, `es`, `zh-Hant`); direction
  (`rtl`) is a property of the language file, so the layout must not
  hard-code left-to-right in anything a language would flip.
- Numbers, dates and intervals format through one function in
  `src/util/dates.js` that takes the language, already the only place
  years are compared.
