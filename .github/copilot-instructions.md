## DELIVERY PROCESS — BINDING RULE

Before implementing any non-atomic feature or task:
1. Check if a spec/PRD exists in `docs/` for this feature
2. If found → implement from spec, not from the raw request
3. If not found AND scope > single atomic change → STOP and request a PRD first

This rule applies even when a developer says "just implement X".
The delivery process takes precedence over informal requests for non-atomic work.
