# The two typefaces

Self-hosted, because the atlas loads nothing from anybody else's server: no
CDN, no Google Fonts, no third party told which reader opened which page. The
files are here in the repository and `python3 -m http.server 8000` serves them
like everything else.

## What they are, and why these two

**EB Garamond** for titles, summaries and every piece of prose the atlas is
responsible for. It is a revival of the roman Claude Garamont cut in Paris in
the 1540s, which is inside the period this project was started to describe —
1415 to 1580 — and it is the letter the documents of that expansion were
actually printed in. That is not decoration: the atlas asks to be read as
history, and the type says so before a word is. Practically it is a humanist
old-style with a small x-height and a lot of colour on the page, which is
right for paragraphs and wrong for a control, which is why there is a second
one.

**Public Sans** for the interface: labels, buttons, axes, counts, badges,
tables. A neutral grotesque with open apertures and unambiguous figures,
drawn for public-sector screens, and legible at eleven pixels on an axis,
which is where most of it is used. It is a fork of Libre Franklin, so the two
have a shared ancestry with the nineteenth-century grotesques rather than
being a serif and a sans that merely happen to be in the same file.

Both have real italics rather than a slant, and both carry `tnum` figures, so
dates and counts line up in a column.

## The files, and where they came from

| File | Source |
| --- | --- |
| `EBGaramond-Regular.woff2`, `EBGaramond-Italic.woff2` | github.com/octaviopardo/EBGaramond12, `fonts/webfonts/`, commit `106a4a6d3779` |
| `PublicSans-Regular.woff2`, `PublicSans-Italic.woff2`, `PublicSans-SemiBold.woff2` | github.com/uswds/public-sans, `fonts/webfonts/`, commit `d3df3455fb94` |

Copied unmodified. No subsetting: subsetting needs a tool this repository does
not have and will not add, so the whole character set ships — 425 KB for the
two Garamonds and 103 KB for the three Public Sans, against the 4.4 MB of
outlines the map already loads.

Bold Garamond is deliberately absent. Nothing in the design sets a serif in
bold — headings are large and normal-weight, the way the azulejo direction
wants them — and a weight nothing uses is 240 KB nobody downloads.

## Licences

Both are under the SIL Open Font License 1.1: `EBGaramond-OFL.txt` and
`PublicSans-OFL.txt`, copied from their repositories. Public Sans also carries
`PublicSans-LICENSE.md`, which explains that the GSA's own modifications to
Libre Franklin are released into the public domain under CC0 while the
original remains under the OFL.

The OFL is not the MIT licence that covers `src/`. These files are the
upstream projects' work, they are redistributed under their own terms, and
neither the atlas's MIT nor `data/LICENSE` extends to them. Nothing here is
renamed: the OFL's reserved-name clause is only a problem for a modified
copy, and these are not modified.
