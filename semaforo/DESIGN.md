---
name: Semáforo de Polivalência
description: A station departures board for skill coverage — every task is a live row with a time, a destination and a situation, and a printed timetable is the same board on paper.
colors:
  flap: "#0d0d0f"
  flap-sombra: "#1b1b1e"
  flap-alto: "#26262b"
  flap-borda: "#000000"
  tinta: "#f2f2f2"
  tinta-fraca: "#9a9aa2"
  ambar: "#ffb400"
  ambar-chapa: "#3d2900"
  vermelho: "#d32f2f"
  vermelho-tinta: "#ff5a52"
  verde: "#3fbf6f"
  aco: "#b6bbc2"
  aco-escuro: "#7d838c"
  aco-fundo: "#2a2c31"
  claro-flap: "#eeeeea"
  claro-flap-sombra: "#e3e3de"
  claro-flap-alto: "#f8f8f6"
  claro-flap-borda: "#c6c6c0"
  claro-tinta: "#16171a"
  claro-tinta-fraca: "#56585d"
  claro-ambar: "#8a5500"
  claro-vermelho: "#b3261e"
  claro-vermelho-tinta: "#9c1f18"
  claro-verde: "#146b3f"
  claro-aco: "#4a4d53"
  claro-aco-escuro: "#6b6e75"
  claro-aco-fundo: "#d8d8d3"
  claro-tarja: "#23262b"
  claro-tarja-tinta: "#f2f2ef"
  claro-regua: "#dcdcd6"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "0.22em"
    fontVariation: "'wdth' 70"
  display-menor:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "0.22em"
    fontVariation: "'wdth' 70"
  destaque:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "normal"
    fontVariation: "'wdth' 70"
    fontFeature: "tabular-nums"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.22em"
    fontVariation: "'wdth' 70"
  data:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "normal"
    fontVariation: "'wdth' 70"
    fontFeature: "tabular-nums"
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
    fontVariation: "'wdth' 100"
  body-lead:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
    fontVariation: "'wdth' 100"
  nota:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
    fontVariation: "'wdth' 100"
  campo:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
    fontVariation: "'wdth' 100"
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.16em"
    fontVariation: "'wdth' 70"
  label-strong:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.16em"
    fontVariation: "'wdth' 70"
  estado:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.22em"
    fontVariation: "'wdth' 70"
  tag:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.5625rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.16em"
    fontVariation: "'wdth' 70"
rounded:
  palheta: "2px"
  celula: "3px"
  lampada: "9999px"
spacing:
  linha: "2.125rem"
  celula-y: "0.125rem"
  campo: "0.625rem"
  regiao: "1.25rem"
  moldura: "2.25rem"
components:
  palheta:
    backgroundColor: "{colors.flap-alto}"
    textColor: "{colors.tinta}"
    typography: "{typography.data}"
    rounded: "{rounded.palheta}"
    width: "30px"
    height: "34px"
  palheta-vazia:
    backgroundColor: "{colors.flap}"
    textColor: "{colors.aco-escuro}"
    typography: "{typography.data}"
    rounded: "{rounded.palheta}"
    width: "30px"
    height: "34px"
  placa-situacao-verde:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    typography: "{typography.label-strong}"
    rounded: "0"
    padding: "4px 8px"
  placa-situacao-amarela:
    backgroundColor: "{colors.ambar}"
    textColor: "{colors.flap}"
    typography: "{typography.estado}"
    rounded: "0"
    padding: "4px 8px"
  placa-situacao-vermelha:
    backgroundColor: "{colors.vermelho}"
    textColor: "{colors.tinta}"
    typography: "{typography.estado}"
    rounded: "0"
    padding: "4px 8px"
  placa-situacao-vermelha-vazada:
    backgroundColor: "transparent"
    textColor: "{colors.vermelho-tinta}"
    typography: "{typography.estado}"
    rounded: "0"
    padding: "4px 8px"
  nav-modo:
    backgroundColor: "{colors.aco-fundo}"
    textColor: "{colors.aco-escuro}"
    typography: "{typography.label}"
    rounded: "0"
    padding: "12px 16px"
  nav-modo-ativo:
    backgroundColor: "{colors.flap}"
    textColor: "{colors.ambar}"
    typography: "{typography.label-strong}"
    rounded: "0"
    padding: "12px 16px"
  botao-alternar:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    typography: "{typography.label-strong}"
    rounded: "0"
    padding: "10px 14px"
  botao-alternar-ativo:
    backgroundColor: "{colors.flap-sombra}"
    textColor: "{colors.vermelho-tinta}"
    typography: "{typography.label-strong}"
    rounded: "0"
    padding: "10px 14px"
  botao:
    backgroundColor: "{colors.ambar}"
    textColor: "{colors.flap}"
    typography: "{typography.tag}"
    rounded: "{rounded.palheta}"
    padding: "0.5rem 0.9375rem"
  botao-fantasma:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    typography: "{typography.label}"
    rounded: "{rounded.palheta}"
    padding: "0.5rem 0.9375rem"
  botao-perigo:
    backgroundColor: "transparent"
    textColor: "{colors.vermelho-tinta}"
    typography: "{typography.label}"
    rounded: "{rounded.palheta}"
    padding: "0.5rem 0.9375rem"
  botao-texto-fantasma:
    backgroundColor: "transparent"
    textColor: "{colors.aco-escuro}"
    typography: "{typography.label}"
    rounded: "0"
    padding: "10px 12px"
  campo:
    backgroundColor: "{colors.flap-sombra}"
    textColor: "{colors.tinta}"
    typography: "{typography.campo}"
    rounded: "{rounded.palheta}"
    padding: "0.5rem 0.625rem"
  rotulo-campo:
    backgroundColor: "transparent"
    textColor: "{colors.aco-escuro}"
    typography: "{typography.label}"
    rounded: "0"
    padding: "0 0 0.5rem 0"
  aviso-servico:
    backgroundColor: "{colors.aco-fundo}"
    textColor: "{colors.aco}"
    typography: "{typography.body}"
    rounded: "0"
    padding: "10px 20px"
  aviso-alerta:
    backgroundColor: "{colors.vermelho}"
    textColor: "{colors.vermelho-tinta}"
    typography: "{typography.body}"
    rounded: "0"
    padding: "10px 20px"
  explicacao-painel:
    backgroundColor: "{colors.flap-sombra}"
    textColor: "{colors.tinta}"
    typography: "{typography.body}"
    rounded: "0"
    padding: "12px"
    width: "15rem"
  troca-tema:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    typography: "{typography.tag}"
    rounded: "0"
    padding: "4px 8px"
---

# Design System: Semáforo de Polivalência

## Overview

**Creative North Star: "The Concourse Departures Board"**

This is a split-flap station board rendered as an operations tool. Every task in the department is a row on the board: it has a time (`prazo`), a destination (the task), a platform (the sector) and a situation that changes in front of everyone standing in the hall. The whole interface is built from one atom — the flap, a two-tone plate with a hinge line across its middle — and from one frame: a brushed-steel masthead carrying the wordmark, the cycle and the modes. The six routes are not six pages; they are modes of the same board.

One law runs through the stylesheet and holds in the shipped code: **each visual property carries exactly one fact**. A flipped flap is a level. A lamp is a farol. Steel is confidence in the data. Nothing is present because it looked better with it. That law is why the world can be this dark and this dense without becoming decorative noise — density is the point, since a single screen holds 64 task rows, five people and four level columns, and the manager reads it for an hour under office light.

The board now ships in two materials. The dark board is the default and the identity. Its second theme is not the board inverted: it is **the printed timetable** — the same station's other artefact, where the flap becomes a cell ruled on paper, the brushed masthead becomes a solid ink band with reversed type, and every risk pigment is remixed for paper. Lightening the departures board itself would dissolve the world; printing its timetable does not.

The scaffold it replaced (create-next-app) is the declared anti-reference, and so is the genre default this category always ships: sidebar, a row of KPI cards, a paginated table, a donut chart. A departures board does not report; it warns. The black ground is a user-pinned commitment, mitigated by craft rather than diluted — flap black (`#0d0d0f`) instead of pure black, painted ink (`#f2f2f2`) instead of pure white, and a generous 2.125rem line rhythm.

**Key Characteristics:**
- One atom (the flap) and one frame (the steel plate) generate nearly every surface.
- Two colour channels that never mix by hue: risk (amber/red) and confidence (steel); severity, not category, decides which one a message gets.
- Two materials, not a theme and its negative: the lit board and the printed timetable, each with its own pigments.
- One typeface, Archivo, in two width axes — narrow for chrome and data, normal for prose.
- Rectangular by law; the only round things are lamps and rivets, which are round objects.
- One authored motion moment (the flap cascade); everything else is static by intent.
- Charts are achromatic; direction is carried by slope, sign, arrow and hatch.
- Every count is answerable: the number carries the names behind it.

## Colors

A near-black field with painted ink on it, banded by brushed steel and pierced by warning colour only where a rule fires — and, on the other side of the theme switch, the same law printed as ink on paper.

### Primary
- **Signal Amber** (`ambar`): The warning half of the risk channel. It appears where the farol returns *amarelo* (exactly two people can do a task) as a filled situation plate, on the active navigation mode, on the primary button, on the focus ring, on the text selection, on the input caret, and on hover for ghost text actions. It is never used for a caution *message* about data quality.
- **Plate Amber** (`ambar-chapa`): The same channel translated for the light steel masthead, where signal amber measures below the contrast floor. Identical role, darker pigment; the channel does not change identity because the material changed. It is defined identically in both themes.
- **Signal Red** (`vermelho`) and **Legible Red** (`vermelho-tinta`): The critical half of the risk channel — fewer than two people, and now also the alert tone of a service warning. The solid `vermelho` fills the situation plate only for the worst case (nobody at all), draws the outline of the hollow plate for the one-person case, and supplies the 2px left rule and the 12% wash of an alert band. `vermelho-tinta` is the text-weight red used for numerals, inline deltas, alert prose and error copy where the solid red would fail on the dark ground. Critical rows also take a 7% red wash behind the whole row.

### Secondary
- **Lamp Green** (`verde`): A status lamp only. It never fills a row, a plate or a cell. See The Green Lamp Rule.

### Tertiary
- **Brushed Steel** (`aco`) and **Shadow Steel** (`aco-escuro`), over **Steel Ground** (`aco-fundo`): The confidence channel and the structural frame in one material. Steel means *this number is soft*: unevaluated cells, inherited levels, the unvalidated criticidade ordering, closed cycles, and every informative service band. Structurally, steel is also the masthead, the mode nav, the sector bands, the column header and the footer.

### Neutral
- **Flap Black** (`flap`): The board ground and the page background.
- **Flap Shadow** (`flap-sombra`) and **Flap Highlight** (`flap-alto`): The two halves of a flap — the lit upper face and the shaded lower face. Also the form-field ground, the popover ground, the drawer interior, the code-inline background and the row hover wash.
- **Hinge Black** (`flap-borda`): Every hairline between rows, cells and regions, and the scrollbar track.
- **Painted Ink** (`tinta`): All primary text and numerals. Never pure white; pure white blooms on this ground.
- **Weak Ink** (`tinta-fraca`): Secondary text, chart reference lines, the decimal comma and percent sign on counters.

### The Printed Timetable (`:root[data-tema="claro"]`)

The second theme is a full repigmentation, not a filter. Dark is the default; the choice persists in `localStorage` under `semaforo:tema` and is applied to `<html data-tema>` by a synchronous script that is the **first child of `<body>`**, before first paint.

- **Paper** (`claro-flap`) with **Printed Cell** (`claro-flap-alto`) and **Cell Shade** (`claro-flap-sombra`): The sheet and the two halves of a ruled cell. The body carries a 1px-in-3px horizontal repeating gradient at 1.2% black — a grain fine enough to be felt, not seen, whose only job is to keep the sheet from reading as a blank document.
- **Rule Grey** (`claro-flap-borda`): Every hairline on paper.
- **Press Ink** (`claro-tinta`) and **Faded Ink** (`claro-tinta-fraca`): Text on paper. The hinge drops from 90% black to 16% — on paper a fold is a crease, not a shadow.
- **Printed Amber** (`claro-ambar`), **Printed Red** (`claro-vermelho`), **Body Red** (`claro-vermelho-tinta`), **Printed Green** (`claro-verde`): The risk channel remixed. Every one darkens, because the pigment that reads on black disappears on paper.
- **Printed Steel** (`claro-aco`, `claro-aco-escuro`) over **Grey Ground** (`claro-aco-fundo`): The confidence channel on paper.
- **Masthead Band** (`claro-tarja`) with **Reversed Type** (`claro-tarja-tinta`): What the brushed plate becomes in print — a solid dark ink band with knocked-out type. A printed timetable does not have brushed steel; it has a masthead.
- **Printed Rule Band** (`claro-regua`): What the dark steel band becomes — a light grey ruled band at an 18% black border, carrying the mode nav and the column headers.
- Lamp blooms halve (5px at 35–40%) and gain a 30% black seat, because a lamp on paper is printed, not lit. Empty cells lose the gradient entirely and become flat `#e9e9e4` inside a 45% shadow-steel hairline.

### Named Rules

**The Two Channels Rule.** Amber and red belong to the farol and say *this is the risk*. Steel says something else entirely: *this number is soft*. The two channels are separated by hue **and** by form — risk arrives as a filled or outlined plate on a row, or as a red-ruled band; confidence arrives as a full-width brushed band or an un-flipped flap.

**The Severity Amendment** (amends The Two Channels Rule). Severity, not category, picks the channel. A caveat that merely qualifies a number is steel: `AvisoDeServico` at `tom="servico"`, `role="status"`. A caveat that could make someone *decide wrongly* — a simulation running over an incomplete matrix, a panel computed over missing cells — is the same component raised into the risk channel: `tom="alerta"`, a 2px red left rule, a 12% red wash, legible-red prose and `role="alert"`. There is no third visual system for it; one component carries both tones so no screen invents its own dialect. Everything the original rule bans still holds — a merely informative data-quality note is never amber and never red, and a farol risk is never steel.

**The Green Lamp Rule.** Green exists and is nameable, but it is a 6–7px lamp with a soft bloom, never a fill. On a board where most rows are healthy, a field of glowing green rows reads as nothing at all. Amber and red get the full plate treatment; green gets an outlined plate with a lamp in it.

**The Steel Remap Rule.** `.aco` and `.aco-escura` redefine `--color-tinta`, `--color-tinta-fraca`, `--color-aco` and `--color-aco-escuro` for everything inside them. This is the system's contrast mechanism, not an implementation detail: anything dropped onto a steel plate is legible by default, and new components inherit that for free. Without it, shadow steel on light steel measures 1.7:1 and shadow steel on dark steel measures 3.66:1. The light theme re-runs the same mechanism with print values on the ink band and the rule band. Never hard-code a text colour on a steel surface — let the remap do it.

**The Two Artefacts Rule.** The light theme is not the board inverted; it is the station's other artefact. Any new surface must land in both materials as *itself*: on the board it is lit (gradient, bloom, brushed sheen), in print it is ruled (hairline box, flat fill, crease). **The artefact names live in this record, not in the toolbar.** The toggle says "Claro" and "Escuro" with a drawn sun and moon, because that is what a person reaching for a theme switch looks for. Naming the buttons "Painel" and "Impresso" was tried and rejected by the product owner: it asked the reader to learn the designer's metaphor before they could change a setting. The metaphor still governs how each theme is *built* — it just stopped being a label.

**The Channel Crossing Rule.** Both channels survive the crossing, repigmented and never reassigned. Amber stays the warning, red stays the critical, steel stays the confidence channel, green stays a lamp — every one darkened for paper. Never solve a print contrast problem by moving a fact to a different channel.

**The Achromatic Chart Rule.** Charts in this system carry no hue. Green×red scored ΔE 4.2 under deuteranopia — below the floor — so direction is carried by four channels that survive colour blindness, a meeting-room projector and a black-and-white print: the slope of the line itself, a signed number, a drawn arrow, and a 45° hatch fill over the panel of anyone who regressed. Any future chart in this system inherits this rule; do not reintroduce colour as a direction channel.

## Typography

**Display / Body / Label Font:** Archivo variable (with `ui-sans-serif, system-ui, sans-serif`)

**Character:** One family, two width axes. Archivo Narrow (`wdth 70`) is the board's stencil voice: uppercase, widely tracked, heavy, used for all chrome, states, labels and numerals. Archivo at normal width (`wdth 100`) in sentence case carries the 64 long Portuguese task descriptions. The pairing reads as a single lettering system in two jobs, which is what a real station board does — not as two fonts.

### Hierarchy

The ramp is a 1px (0.0625rem) grid; every step below is reused across surfaces in the shipped build. Narrow steps are legitimate here because the chrome is uppercase, tracked and one or two words long.

- **Placa / Display** (weight 800, `wdth 70`, 0.22em tracking, uppercase, 1.75rem): The index page title inside the `.letreiro` material. One screen only; it is the front door.
- **Placa Menor / Display Small** (weight 800, `wdth 70`, 0.22em, 1.375rem): Every other page title, also inside `.letreiro`. This is the working title size.
- **Destaque** (weight 600, `wdth 70`, tabular, 1.25rem): A single number or item name that must be read across a room — the risk panel's headline count, a task's own heading on its detail page.
- **Placa Chrome / Title** (weight 800, `wdth 70`, 0.22em, 0.9375rem): Section headings, the masthead wordmark, and the cycle label. Also the size of a lead paragraph in body voice.
- **Dado / Data** (weight 600, `wdth 70`, tabular, 1.0625rem): Every numeral outside a flap, including chart end labels. Tabular figures are set on `body` for the whole application: a column of levels that dances horizontally is a column nobody reads.
- **Conteúdo / Body** (weight 400, `wdth 100`, sentence case, 0.8125rem, 1.625 leading): Task descriptions, warning prose, explanatory paragraphs.
- **Campo / Field** (weight 400, `wdth 100`, 0.875rem, 1.4 leading): Text typed into an input. The one step that exists for editing rather than reading — typed text sits one step above reading prose because the person is aiming at it.
- **Nota / Note** (weight 400, `wdth 100`, 0.75rem): Subordinate prose in shadow steel — helper text under a field, an explanatory footnote under a table, a secondary line under a name.
- **Rótulo Forte / Label Strong** (weight 700, `wdth 70`, 0.16em, 0.6875rem): Names that must hold — person column headings, department, active nav mode, chip labels, chart panel names.
- **Rótulo / Label** (weight 600, `wdth 70`, 0.16em, 0.6875rem, shadow steel): The board's quiet chrome — field names, units, legends, inactive nav, ghost actions.
- **Estado / State** (weight 800, `wdth 70`, 0.22em, 0.625rem, uppercase): The type inside a situation plate and the micro column legends over a data group. It is a state word, never a sentence.
- **Tag** (weight 700, `wdth 70`, 0.16em, 0.5625rem, uppercase): The smallest step, and the only one with a hard usage limit — a bordered one-or-two-word status tag ("Fechado", "Claro", "Escuro", "aberto", a count unit). Never prose, never a link, never the only carrier of a fact.

Measure is capped at 34rem in the grid, 46–92ch in prose depending on column, and 110ch in warning bands.

### Named Rules

**The Two Widths Rule.** Never add a second family. When something needs to feel different, move it along the width axis, not across families. Narrow + caps + tracking owns chrome, labels, states and data; normal width + sentence case owns content.

**The Sentence Case Content Rule.** Uppercase spaced lettering stops where content begins. An 80-character Portuguese task description in tracked caps is unreadable, and this was the declared translation when the world was chosen: the board's voice keeps the chrome, the reader keeps the prose.

**The Floor of the Ramp Rule.** 0.5625rem is the bottom of this system and it is a tag step, not a text step. Anything smaller is out of the ramp. If new chrome does not fit at 0.5625rem in one or two tracked words, it is not a tag — give it label size and less text.

## Layout

The spatial model is a board, and the board lives **in normal page flow**. `Painel` is a `min-h-dvh` column: masthead, mode nav, optional indicator strip, `<main>`, optional footer. There is no fixed viewport height, no `overflow-hidden` and no internal scrolling region anywhere in the shell.

That is a correction with a recorded cause. The previous shell locked the frame at `h-dvh` and scrolled `<main>` internally; the document stayed scrollable anyway (`documentElement.scrollHeight` 6203 against a 788px viewport), so scrolling the page lifted the entire fixed-height app off-screen and left the body's flap black filling the window. On a world this dark the failure is invisible until it happens — there is nothing to see, so nothing looks broken. The fix also returned more than a third of the usable height on every screen.

The frame stacks in a fixed order: the 64px brushed-steel masthead (wordmark, department, theme toggle, cycle, closed-cycle tag) with a rivet at each end; the dark-steel mode nav with six modes; an optional indicator strip on flap black; the scrolling field; and an optional dark-steel footer above a 10px riveted steel rail (`Trilho`). Both the masthead and the nav are `flex-wrap`, so narrow viewports wrap them into more rows instead of clipping.

The rhythm unit is one board line, `--spacing-linha: 2.125rem` (34px) — the flap height. Everything in the field is a multiple or a divisor of it: cells are 30×34 or 28×30, row padding is 0.125rem vertical, and the counter's digits are 40px, 34px or 28px tall depending on how much chrome the screen can afford. Region padding is 1.25rem horizontal on content areas and 2.25rem on the masthead.

The matriz grid is a real table at a 980px minimum width with `border-separate` and zero spacing, so hairlines belong to cells. Its header rows scroll with the document like everything else; there is no sticky header and no runtime-measured offset. A sticky header here bought a fixed reference at the cost of the shell that produced the black-void failure, and it went with it.

Desktop is the design target. Mobile and projector are declared v2.

### Named Rules

**The Whole Document Scrolls Rule.** The shell never locks the viewport. No `h-dvh` container with an internally scrolling region, no `overflow-hidden` on the app root, no `position: sticky` header depending on a measured shell height. The frame is a band at the top of a document, and the document is what scrolls. On a black ground a scrolled-away app is an empty screen, not a visible bug; this constraint is what keeps that failure from returning.

## Elevation & Depth

There is no ambient elevation and no card shadow in this system by design. Depth is **material**, not atmosphere: a flap is deep because its upper half catches light and its lower half sits in shade with a hard hinge between them; the board is deep because rows are separated by a 1px black hairline with a 3.5% white lift under it; steel is raised because it has a vertical sheen gradient and rivets with their own dome. In the printed theme depth is subtracted entirely: gradients flatten, blooms halve, the hinge becomes a 16% crease, and the empty cell becomes a flat fill in a hairline box. Paper is not lit.

### Shadow Vocabulary
- **Flap relief** (`inset 0 1px 0 rgba(255,255,255,0.07), 0 1px 2px rgba(0,0,0,0.6)`): The lit lip and contact shadow of a flap at rest. In print it becomes `inset 0 0 0 1px rgba(0,0,0,0.14), 0 1px 0 rgba(0,0,0,0.05)` — a ruled box, not a lit plate.
- **Empty flap outline** (`inset 0 0 0 1px rgba(125,131,140,0.34)`; print `rgba(107,110,117,0.45)`): A flap that has never been flipped — a steel-channel outline instead of a lit lip. The print value is the same shadow-steel hue at a higher alpha, because a hairline on paper needs more ink to survive.
- **Hinge** (`linear-gradient` band of `rgba(0,0,0,0.9)` at 48.5–51.5%; print `rgba(0,0,0,0.16)`): The fold line across every flap and across the `.letreiro` material.
- **Junta** (`border-bottom: 1px solid #000; box-shadow: 0 1px 0 rgba(255,255,255,0.035)`): The seam between two rows of flaps. In print the lift is dropped and the border becomes 14% black.
- **Lamp bloom** (`0 0 0 1px rgba(0,0,0,0.8), 0 0 7–8px <lamp colour>`; print `0 0 0 1px rgba(0,0,0,0.3), 0 0 5px <lamp colour at 35–40%>`): A lamp emitting light, or a lamp printed.
- **Rivet** (`0 1px 2px rgba(0,0,0,.5), inset 0 -1px 1px rgba(0,0,0,.25)`): The dome of a steel fastener.

### Named Rules

**The Material Shadow Rule.** A shadow is allowed only when it states a physical fact about the material it is on: the fold of a hinge, the lip of a flap, the bloom of a lamp, the dome of a rivet, the seam between rows. No hover lift, no elevation ramp, no offset shadow to separate a container from its background. If a new element wants separation, give it a hairline or a steel band — that is how the drawer panel and the popover are bounded.

## Shapes

Rectangular by law. Corners are square everywhere except three radii, each of which is an object that is physically round or physically softened: the flap's 2px corner (`rounded.palheta`), shared by every form control so that a field reads as a blank flap waiting to be written; the 3px wrapper that carries focus and hover around an editable flap (`rounded.celula`); and the fully round lamps and rivets. Nothing else receives radius; there are no pills, no rounded cards, no rounded panels.

Gradients are similarly restricted. Every gradient in the build renders a material fact: the vertical sheen and 4px brushed striation of steel, the light/shade split of a flap either side of its hinge, the cell divisions and hinge of the `.letreiro` title material, the radial highlight on a rivet dome, the two 5px triangles that draw the select arrow, and — in print — the 1-in-3px paper grain. There are no decorative gradients, no brand blends, no glows behind content.

The recurring silhouette is the cell grid: a run of narrow plates separated by hairlines, at 2.15rem pitch. It appears literally in the matriz, in the coverage counter, in the digits of a cycle's coverage on the index, and as the backing texture of the `.letreiro` page title — the one place the board's most identifiable trait is applied to words rather than digits.

## Components

### Flap (signature component)
The atomic unit. A 30×34 plate (28×30 in the matrix, 20–26 wide in counters) with the hinge across the middle, a 2px corner, tabular narrow figures at half the plate's height, and a tone drawn from a fixed set (`tinta`, `ambar`, `vermelho-tinta`, `verde`, `aco`). Two variants ship: the live flap (`Palheta`, client-side, animates) and the static flap (`PalhetaFixa`, no JavaScript) used on every read-only screen. Multi-digit numbers are always several flaps, one digit each — the board never paints "23" on one plate.

- **Empty state:** A flap that has never been flipped uses the `palheta-vazia` material: darker (flat grey in print), no lit lip, steel outline, and a `–` glyph in shadow steel. It is not a zero; it is the absence of an answer, and the interface says so.
- **Editable state (matriz cell):** A `spinbutton` wrapper with a 3px corner. Click advances one level and wraps at 4; shift-click reverses; keys 0–4 set directly; `+`/`-` step. Hover is `brightness(1.35)` on the plate; a write still in flight drops the cell to 55% opacity.

### The Cascade (motion)
The single authored motion moment in the system, and the only motion at all. Changing a level rolls the flap through every intermediate value — 1 to 4 passes through 2 and 3 — at **95ms per step**, each step running the `virar` keyframe for **120ms** on `cubic-bezier(0.32, 0, 0.67, 0)`: `rotateX(0 → -180deg)` on a `center bottom` origin, with a brightness spike at 49% and a drop at 50% as the face passes the hinge. Only the flap that changes animates. The simulator's absence ripple is the same mechanism run across the board. A secondary `acender` fade (260ms) lights newly revealed content, including the popover. Under `prefers-reduced-motion: reduce` both animations are dropped and the flap performs a dry swap; all transitions collapse to 0.01ms.

**The One Moment Rule.** This system has exactly one motion moment and it is the cascade. Everything else is static by intent. Colour/border state transitions on controls run at 120–150ms and are not moments. Do not add reveals, lifts or parallax; a departures board is still until a value changes.

### Situation Plate
The board's ON TIME / DELAYED / CANCELLED equivalent, and the only place risk colour reaches full strength on a row. Square corners, 4px/8px padding, 0.625rem state type. Four states: green is an outlined plate in strong label type with a lamp inside it; amber is a solid amber plate with flap-black state type; red-critical (nobody at all) is a solid red plate with painted ink; red-degraded (one person) is a hollow plate outlined in red with legible-red type. The words always speak about *people*, never about deadlines, because the row already carries a deadline column.

### Navigation
The mode nav is a dark-steel band (a light grey ruled band in print) of square tabs, each 12px/16px, separated by `rgba(0,0,0,0.6)` rules, each carrying a 16px line icon plus a tracked uppercase label. **Six modes ship:** matriz, painel de risco, simulador (cycle-scoped), evolução, gerenciar, and the cycle index reachable from the wordmark. Inactive is label type in shadow steel; hover washes 25% black and lifts the text to ink; active drops the tab to flap black and sets the text amber in strong label type — the tab reads as a flap that has flipped open onto the board behind it. When no cycle is selected the three cycle-scoped modes render as non-interactive spans at 45% opacity with an explanatory title. The band wraps rather than clips on narrow viewports.

### Buttons
The board still has few buttons — the matriz saves by itself, and its save state lives in the frame as a service lamp rather than as an action — but the management surface brought a real control set.
- **Shape:** Square or the flap's 2px corner; nothing rounder.
- **Primary (`.botao`):** Amber fill, flap-black text, tag-weight tracked caps, 0.5rem/0.9375rem padding, 2px corner. Hover is `brightness(1.12)`; disabled is 45% opacity with no filter. Amber is already this system's action colour, so the primary button needed no new pigment. In print the text knocks out to white over the darkened amber.
- **Ghost (`.botao-fantasma`):** Transparent over a 45% shadow-steel hairline, ink text; hover moves both border and text to amber. The `<summary>` of a disclosure drawer wears this exact material and turns amber while open.
- **Danger (`.botao-perigo`):** The ghost button in the risk channel — legible-red text on a 55% red border, hover deepening to solid red with a 12% wash. Destructive actions only.
- **Ghost text action:** Label type, no border, no background; hover shifts the text to amber. Used for "limpar", "simular" and inline row actions.
- **Toggle chip (simulator roster):** 10px/14px, 1px border. Off is a shadow-steel border at 45% with ink text, hovering to a full steel border over flap shadow. On is a red border over an 18% red wash with legible-red text plus a tracked "fora" tag — the only place the risk channel marks a *control*, because the control *is* the risk.
- **Outlined link row (cycle index):** Label type inside a 1px shadow-steel border at 45%; hover moves both border and text to amber.
- **Focus:** Global and uniform — a 2px amber outline at 2px offset. Never removed, never restyled per component.

### Inputs / Fields
A field is a blank flap waiting to be written: flap-shadow ground (white on paper), a 45% shadow-steel hairline, the flap's 2px corner, 0.5rem/0.625rem padding, and typed text one step above reading prose (0.875rem, normal width, sentence case). Hover raises the border to 70% brushed steel; focus drops the browser outline and moves the border to amber — on a field the amber border *is* the focus ring, and it is the only place the global ring is replaced rather than added to. Labels sit above in label type with 0.5rem of air. A `select` hides the native arrow, which is invisible on this ground, and draws its own from two 5px triangles in shadow steel. Placeholders are shadow steel; the caret is amber.

### Service Warning Band
The confidence channel's standard container, and — since The Severity Amendment — the risk channel's too. One component, two tones, both full-width with a black bottom rule, 10px/20px padding, a 16px outline warning icon, an optional tracked uppercase title, and body prose capped at 110ch.
- **`servico`:** Dark-steel band, brushed-steel prose, shadow-steel icon, `role="status"`.
- **`alerta`:** A 2px legible-red left rule over a 12% red wash, legible-red icon, title and prose, `role="alert"`. Reserved for a reading that could make someone decide wrongly.

### Explicação (signature component)
A count in this system is never a dead number. `Explicacao` hangs the list of names behind a figure off the figure itself: the trigger is the number in data type with a small round marker, and the panel is a 15rem minimum-width block on flap shadow inside a 60% shadow-steel hairline, opening with the `acender` fade, carrying a label-type heading and one `LinhaDePessoa` per person (name in body voice, note in label type, an "herdado" marker for a level carried over from the previous cycle). It is a `role="tooltip"` with `aria-expanded`/`aria-controls` on the trigger — never a modal: it does not block the page, does not trap focus, and closes on Escape or an outside pointer. A 120ms close delay covers the gap between trigger and panel.

**The Names Behind The Number Rule.** "3 pessoas operam sozinhas" is half an answer: without the names nobody can request help, plan training or decide a replacement. Any aggregate this system shows must be able to name its members in place. If a count cannot be opened, it should not be the thing on screen.

**The Three Ways In Rule.** Hover is never the only way in. Every disclosure opens on pointer hover *and* on click or touch *and* on focus, and closes on Escape and on an outside pointer. A treatment that only answers a mouse answers half the users.

### Disclosure Drawer (`Gaveta`)
Registration forms live behind a native `<details>` with the ghost button as its `<summary>` (marker hidden, border and text amber while open) and a bordered flap-shadow panel below at 1.25rem padding. No JavaScript, keyboard-operable by definition, announced correctly by screen readers, and a server component on purpose.

### Theme Switch
A two-button group in the masthead, bordered at 25% of the inherited colour, each button in tag type at 0.5625rem with a drawn 12px icon: a sun for "Claro", a moon for "Escuro". The selected side inverts to 90% of the current ink with flap-black text; the other sits at 60% opacity. `aria-pressed` carries the state, `title` gives the long form ("Tema claro"). The icons come from the project's own icon set — never a glyph, per the don't list. It reads the `data-tema` attribute through `useSyncExternalStore` and a `MutationObserver` — the theme lives in the DOM, never in React state, because duplicating it would create a second source of truth and a hydration mismatch the server cannot resolve.

### Coverage Counter
The goal as a container with visible capacity, not a percentage in a box. Four flaps carrying the digits with a weak-ink comma inserted before the last two and a small percent mark, over a 5px hairline track on hinge black filled with painted ink to the goal of three people per level — and the mark is labelled ("meta 3 pessoas") so no one assumes 100% means everybody knows everything. Three sizes ship (40px, 28px, 28px inline); the inline size exists because on the matriz every pixel of chrome costs a visible task.

### Chart Panel
A caption bar built from the flap material with its hinge, carrying the person's name in strong label type and, right-aligned, a trend arrow, a signed total in data type, and a unit label. Below it, an achromatic SVG on flap shadow: 2px ink polyline broken at gaps (a month without evaluation is a gap, not a straight line through missing data), a 1px weak-ink department average at 42% opacity, three hairline steel gridlines, ink dots with a flap-black ring at the surface colour instead of a drawn border, larger end dots, direct labels only at the two extremes, an 11px invisible touch target per point with a native title, and a 45° steel hatch over the whole plot area when the person lost points.

## Do's and Don'ts

### Do:
- **Do** make every visual property carry exactly one fact. A flipped flap is a level; a lamp is a farol; steel is confidence. If a treatment carries nothing, remove it.
- **Do** keep the two channels apart by hue **and** by form, and pick the channel by severity: steel for a caveat, red for a reading that could make someone decide wrongly.
- **Do** land every new surface in both artefacts — lit on the board, ruled in print — and repigment rather than rechannel when print contrast fails.
- **Do** put text on steel and let `.aco` / `.aco-escura` remap the ink tokens for you, rather than hard-coding a colour for that surface.
- **Do** build numbers out of one flap per digit, so multi-digit values roll correctly instead of swapping dry.
- **Do** keep field rhythm on the board line (2.125rem) and its divisors, and keep type on the shipped 1px ramp from 0.5625rem to 1.75rem.
- **Do** let every count open onto the names behind it, and open it by hover *and* click/touch *and* focus.
- **Do** keep the shell in normal page flow with `min-h-dvh`; let the document scroll.
- **Do** carry direction in charts with slope, a signed number, an arrow and a hatch — four channels, none of them hue.
- **Do** render icons as 16px SVG on a 1.5 stroke with square caps and mitred joins, and prefer a word to a pictogram: on a departures board almost everything is a word.
- **Do** cap content measure (34rem in the grid, 46–92ch in prose, 110ch in warning bands) and set it in sentence case at normal width.
- **Do** give a form control the flap's 2px corner and the flap-shadow ground, so a field reads as a plate waiting to be written.

### Don't:
- **Don't** lock the shell to the viewport. No `h-dvh` root with an internally scrolling `<main>`, no `overflow-hidden` app container, no sticky header measured off a fixed shell — that combination scrolled the whole app off-screen and left a full-viewport black void.
- **Don't** treat the light theme as an inversion. It has its own pigments, its own materials and its own name; a filter or a blanket lightening is not it.
- **Don't** use cards. Regions are separated by steel bands and hairlines; a panel that needs bounding gets a border, never a floating shadow.
- **Don't** add radius beyond the flap's 2px (shared by form controls), the 3px editable-cell wrapper, and objects that are physically round (lamps, rivets).
- **Don't** add a shadow that isn't a material fact — no elevation ramp, no hover lift, no offset or ambient drop shadow behind a panel or popover.
- **Don't** add a gradient that isn't a material: steel sheen, the flap's light/shade split at the hinge, a rivet dome, the select arrow, the paper grain. No decorative or brand gradients.
- **Don't** stand a Unicode glyph or a bare letter in a circle in for an icon. Every icon is a drawn SVG from the 16px set.
- **Don't** set type off the ramp. 1rem and 1.125rem are not steps in this system: a lead paragraph is 0.9375rem and a prominent numeral is 1.0625rem or 1.25rem. Nothing goes below 0.5625rem, and 0.5625rem is for tags only.
- **Don't** introduce a second display face. Archivo in two width axes is the whole lettering system.
- **Don't** use amber or red for a caveat that merely qualifies a number — that is the steel channel's job. Red is for a reading that could make someone decide wrongly.
- **Don't** fill anything with green. Green is a lamp.
- **Don't** let colour be the only channel for any state; the number, the word, or the shape must say it too.
- **Don't** make hover the only way to reveal anything.
- **Don't** add a second motion moment. The cascade is the only one.
- **Don't** hard-code a hex in a component. Material definitions in `globals.css` own the literal values; components reference tokens.
