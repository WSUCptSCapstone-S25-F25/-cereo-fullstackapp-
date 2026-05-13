# General Onboarding and What's New Features

## Scope

This document describes app-level onboarding and changelog flows accessible from the Home left sidebar.

Covered:
- What's New modal behavior
- General onboarding modal behavior
- General onboarding guided tour
- Sidebar triggers and persistence rules

---

## Left Sidebar Entry Points

In Home left sidebar:
- Bell button opens `What's New` modal
- Info button opens `General Onboarding` modal

These are global app-level guides (separate from panel-specific onboarding tutorials).

---

## What's New Modal

Component: `ChangelogModal`

### Triggering
- Auto-open condition: first load when localStorage key `changelog_seen_v14` is absent
- Manual open: click left sidebar bell button

### Close behavior
- Close button, overlay close, and footer dismiss all call `onClose`
- Close action sets `changelog_seen_v14 = true` to prevent auto-open next load

### Content role
The modal shows latest release highlights, including:
- chatbot availability note
- onboarding additions
- map and form feature updates

---

## General Onboarding Intro Modal

Component: `GeneralOnboardingModal`

### Purpose
Provides quick instructions for:
- how to start onboarding in each major panel
- difference between help button and tutorial button
- replaying app-wide onboarding tour

### Actions
- `Play General Onboarding` starts guided tour
- `Got it` or close icon dismisses modal

---

## General Onboarding Guided Tour

Component: `OnboardingGeneral`

### Tour target model
The tour is defined by step list using `data-onboarding-target` selectors.

Highlighted areas include:
- top navbar and each core nav link
- account/auth area
- left sidebar root
- sidebar buttons (search, cards, GIS, custom layers, basemap, changelog, onboarding)

### Runtime behavior
- Filters to only selectors that currently exist in DOM
- Highlights target element and shows contextual tooltip
- Tooltip auto-placement with viewport bounds handling
- Auto-scrolls target into view when step changes

### Navigation controls
- Previous / Next / Close buttons
- Last step button changes to `Finish`
- Keyboard support:
  - Left arrow -> previous
  - Right arrow -> next
  - Escape -> close

### Rendering model
The overlay is rendered via portal into `document.body`.

---

## Relationship to Panel-Specific Onboarding

General onboarding is an app shell tour.

Panel-level tutorials (Cards, ArcGIS, Custom Layers, Basemap) remain separate and are launched within each panel.
