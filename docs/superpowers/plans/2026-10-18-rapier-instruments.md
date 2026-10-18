# Rapier instruments implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this approved work inline, task by task.

**Goal:** Replace staged beam, cart and spring reactions with measured Rapier motion while preserving the existing room and cart art.

**Architecture:** A local, pinned Rapier 0.21.0 module owns one active instrument in SI units at 120 Hz. A measurement adapter derives render poses, scale readings, plots and saved observations from the same sampled state. Existing analytic solutions remain the theoretical reference and old records retain their provenance.

**Tech stack:** Existing buildless Three.js, local Rapier compat ESM, Node assertion scripts and native browser pointer QA.

**Spec:** `docs/physics-feedback-research-2026-10-18.md`, approved by the user's 2026-10-18 implementation request.

## Constraints and review focus

- Preserve background, cart materials and mesh design. No object-covering tutorial overlays.
- SI units; fixed 1/120 s steps; quality changes only rendering. Cart distance uses a common 0.35 scene units/metre.
- Active pilots: cart courses, numbered balance, hanging beam, gravity/elastic spring and elementary spring scale. Other apparatus retain their current models.
- Beam travel stops and damping are apparatus approximations; no forced result angles. Spring damping is explicit. The mouse sets a calibrated simulation input, not measured hand force.
- Motion is sampled at 1.2 simulated seconds. Static observations wait for settling with a bounded timeout, and store the settling status.
- Review cancellation, rapid course changes, nonzero initial velocity, zero load, extreme inputs and imported old records.

## Tasks

1. [x] Add failing physics invariants, vendor official Rapier plus license, implement `instrument-physics.js` (world lifecycle, fixed step, snapshots, measured result and validated observation).
2. [x] Wire `index.html`, `teaching-ui.js`, `curriculum-model.js` to authoritative measurements; retain old record compatibility; add trace plot and clear observation timing.
3. [x] Drive existing apparatus poses, spring pitch, pointer and ruler from snapshots. Preserve direct manipulation and cancel behavior.
4. [x] Run numerical and curriculum regression suites; manually drag all three instrument families in desktop/mobile low quality; compare scene, displayed values, traces and saved observations. Write evidence and reviewer brief.
5. [x] Review diff, commit and push `force-equilibrium-lab`; verify GitHub branch SHA equals local HEAD.

## Execution ledger

- Baseline: clean dedicated branch `force-equilibrium-lab`, HEAD `b7961d3`; origin is `gomigoya/labs`. User has already authorized implementation, testing and pushing. No redundant design approval is needed.
- Official npm registry verified Rapier compat 0.21.0, Apache-2.0. No application framework migration.

- Implementation and read-only fresh code review complete. Review findings fixed with regression coverage. Native pointer scene/plot/record audit passed for all three families and the high-school hanging beam; 390px iframe spring drag passed. Current full browser report: 533/533, 37 activities/117 conditions. Implementation commit adcf9c05b087ad6f744a8eb241fd07c4ba00dbd4 was pushed to origin/force-equilibrium-lab and verified with git ls-remote.
