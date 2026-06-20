---
name: codebase-design
description: Shared vocabulary for designing deep modules. Use when the user wants to design or improve a module's interface, find deepening opportunities, decide where a seam goes, make code more testable or AI-navigable, or when another skill needs the deep-module vocabulary.
---

# Codebase Design

Design **deep modules**: a lot of behaviour behind a small interface, placed at a clean seam, testable through that interface.

## Glossary

- **Module** — anything with an interface and an implementation (function, class, package, or tier-spanning slice)
- **Interface** — everything a caller must know to use the module: type signature + invariants + error modes + performance characteristics
- **Depth** — leverage at the interface: amount of behaviour a caller can exercise per unit of interface they have to learn
- **Seam** — a place where you can alter behaviour without editing in that place; where a module's interface lives
- **Adapter** — a concrete thing that satisfies an interface at a seam

## Deep vs Shallow

**Deep module** = small interface + lots of implementation (good)
**Shallow module** = large interface + thin implementation (avoid)

When designing an interface, ask:
- Can I reduce the number of methods?
- Can I simplify the parameters?
- Can I hide more complexity inside?

## Principles

- **The interface is the test surface.** Callers and tests cross the same seam.
- **One adapter means a hypothetical seam. Two adapters means a real one.**
- **Accept dependencies, don't create them** — testable design uses dependency injection
- **Return results, don't produce side effects** — easier to verify
