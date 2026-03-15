PEG_PLAN.md

PEG Plan for Professional Evening Gaming
Date: 2026-03-15

Executive Summary
This plan documents the Cass-driven requirements, cross-channel memory inputs (Discord and other channels), deployment constraints, and the four-phase execution plan to transform the PEG site into a modern professional showcase. The plan prioritizes preserving the existing cloudflared-to-TrueNAS deployment and live domain while introducing a modular component library, a multi-demo experience, and a content strategy.

High-Level Objectives
- Modernize the PEG site with a scalable, component-based architecture (Vite-based build, modular components, theming).
- Build a multi-demo showcase (4+ interactive demos beyond the bouncing ball).
- Introduce a Blog/News section and a polished Portfolio/Showcase landing.
- Implement a reusable UI component library with design tokens and accessibility basics.
- Provide comprehensive in-repo documentation (PEG_PLAN.md companion, PEG_README.md).
- Preserve current deployment workflow (cloudflared to TrueNAS) with no changes to Chris email/DM policies.

Cross-Channel Memory & Cass-Driven Requirements (synthesized from Discord history and PEG work)
- A modern tech stack and clean architecture.
- A four-phase plan: Foundation Enhancement, Feature Expansion, Polish & Production, Community & Growth.
- Pages: Home, Demos/Projects, Blog/News, About, Contact; 4+ interactive demos.
- Component Library: UI primitives, tokens, theming, accessible components.
- Documentation: README + library docs + PEG_PLAN.md (this file).
- Memory signal integration: incorporate Discord branding cues and design preferences into tokens and components.
- Deployment: retain cloudflared/TrueNAS deployment; no email automation or DM policy changes.

Current State Snapshot (in-repo references)
- Live domain: https://professional-evening-gaming.dilger.dev
- Repo: cdilga/professional-evening-gaming
- Working files in repo: peg-site.html, peg-full.html, professional-evening-gaming/ with index.html, script.js, style.css
- Deployment path and hosting: cloudflared to TrueNAS; no changes planned to deployment scripts without explicit approval.

Target Architecture & Folder Layout (proposed)
- /PEG_PLAN.md (this file)
- /PEG_README.md (project overview and conventions)
- /src/ (source for app, components, pages, demos)
- /src/components/ (UI primitives and tokens)
- /src/pages/ (Home, Demos, Blog, About, Contact)
- /src/demos/ (4+ interactive demos)
- /src/docs/ (library docs, API usage)
- /memory-bridges/ (appendix for Cass-driven memory notes and cross-channel anchors)
- /scripts/ (build/deploy scripts; adapted to Vite where applicable)

Phase Plan (4 Phases)
Phase 1 — Foundation Enhancement (2–3 weeks)
- Scaffold Vite-based project; establish modular folder structure.
- Build a basic component library: buttons, cards, nav, grid, typography tokens, theming.
- Implement Home and Demos pages skeleton plus routing hooks.
Phase 2 — Feature Expansion (3–4 weeks)
- Implement 4+ interactive demos (Canvas, SVG, data viz, small playgrounds).
- Add Blog/News skeleton; static posts or markdown-driven content.
- Enhance navigation, responsive behavior, and typography.
Phase 3 — Polish & Production (2–3 weeks)
- Accessibility hardening, SEO basics, and production optimizations.
- Complete documentation: PEG_README.md and component docs.
Phase 4 — Community & Growth (ongoing)
- Add contributor guidelines, issue templates, roadmap.
- Define blog cadence and onboarding docs for new contributors.

Deliverables
- PEG_PLAN.md (this file) and PEG_README.md at repo root.
- src/ with components/, pages/, demos/.
- memory-bridges/ appendix with Cass-derived constraints.
- Deployment runbook aligned with current cloudflared/TrueNAS workflow.

Memory Annex (Discord & Cass references)
- A concise appendix with key memory snippets used to inform tokens, typography, layout choices, and branding cues; references to source memory files for traceability.

Validation & Sign-off
- This plan requires your confirmation of high-level points before proceeding with the big changes (scaffold, memory bridging, and deployment tweaks).
- Reply with OK to proceed, or indicate changes needed.

End of Plan
