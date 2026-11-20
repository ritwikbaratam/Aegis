# Presentation preparation checklist

## Technical

- [ ] Node 24 is installed and `node --version` is visible.
- [ ] `node --test backend/test` was run and its exact result is documented.
- [ ] Server starts at `http://localhost:8080`.
- [ ] Browser opens the local UI and all three demo accounts log in.
- [ ] Seeded data includes an active incident, a historical resolved incident, at least four technicians, and an administrator.
- [ ] Notification inbox/outbox and audit timeline are populated by actual actions.
- [ ] A backup copy of `backend/data/aegis.db` exists if the team wants to preserve a rehearsed state.

## Academic

- [ ] Each team member understands priority scoring, SLA targets, and the lifecycle preconditions.
- [ ] One team member can explain Strategy with the two concrete assignment implementations.
- [ ] One team member can explain Observer/event publisher and the two notification mechanisms.
- [ ] One team member can point to the class, use-case, sequence, and ER diagrams.
- [ ] The team can distinguish a duplicate suggestion from an automatic merge and SLA risk from a recorded breach.
- [ ] The technology rationale and known limitations are rehearsed.

## Presentation roles

| Placeholder | Suggested responsibility |
| --- | --- |
| [Team member 1] | Problem statement, architecture, data model |
| [Team member 2] | Employee experience / incident creation |
| [Team member 3] | Technician workflow / lifecycle and SLA |
| [Team member 4] | Admin, analytics, intelligence, configuration |
| [Team member 5] | OOP/design patterns, testing, limitations, Q&A |

Do not invent team-member names or make unsupported claims about individual implementation ownership.
