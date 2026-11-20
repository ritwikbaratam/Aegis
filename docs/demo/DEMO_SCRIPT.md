# AEGIS 15-20 minute demonstration script

This is a rehearsal guide, not a claim that a video already exists. Replace `[Team member]` placeholders before presenting.

## Suggested timing and speaker split

| Minutes | Speaker | Show / explain |
| --- | --- | --- |
| 0-2 | [Team member 1] | Problem, stakeholders, architecture, local stack |
| 2-7 | [Team member 2] | Demo 1: employee critical report and automation |
| 7-12 | [Team member 3] | Demo 2: technician resolution and employee verification |
| 12-16 | [Team member 4] | Demo 3: duplicate intelligence, SLA risk, escalation, admin view |
| 16-19 | [Team member 5 / shared] | OOP patterns, tests, limitations, questions |

## Before the presentation

1. Run `./scripts/start.ps1`, wait for the local URL, and log out of any prior account.
2. Confirm demo data is available. Avoid deleting the database immediately before a live demo unless the seeded reset flow is known to work.
3. Keep these accounts ready. Use `employee@aegis.local` / `Employee@12345`, `jamie.apps@aegis.local` / `Technician@12345`, and `admin@aegis.local` / `Admin@12345`. Start with the skill-based strategy for the payment scenario.
4. Open `docs/diagrams/CLASS_DIAGRAM.md` and `docs/OOP_DESIGN_EXPLAINED.md` in another tab for the architecture section.

## Demo 1 - employee reports a critical payment incident (about 5 minutes)

1. Sign in as **Riya Shah**, the employee.
2. Open **Report incident**.
3. Enter `Payment application unavailable` and `Payment transactions are failing for students and staff. The payment application is unavailable.` Select **Suggest category**, **Payment Application**, impact 3, urgency 3, and 650 affected users.
4. Point out the category suggestion (Payment/Software or configured rule), duplicate suggestion if an active related report exists, and **Why this priority?** explanation.
5. Submit. Open its details page.
6. Explain the calculated P1, response/resolution deadlines, selected technician/assignment explanation, and new audit events.
7. Open notifications: show the generated event. Switch to the admin later to show the matching simulated email outbox row.

## Demo 2 - technician resolves; employee verifies (about 5 minutes)

1. Sign out and sign in as the technician shown on the incident. On the initial skill-based dataset this is **Jamie Chen**.
2. Open **My queue** and choose the public incident code from Demo 1.
3. Acknowledge it, start investigation, add an investigation note, and request additional information.
4. Switch to Riya and submit a reply in the investigation tab. Return to Jamie and refresh the incident.
5. Explain current SLA countdown/risk and add a concise resolution such as `Restarted payment gateway worker and confirmed successful transaction`.
6. Mark as resolved.
7. Sign in as Riya, read the resolution, verify it, close the incident, and submit feedback.
8. Show the incident timeline: creation, assignment, acknowledgement, note, request/reply, resolve, verify, close, feedback.

## Demo 3 - intelligence, escalation, and administration (about 4 minutes)

1. As Riya, fill a similar payment report. Leave the seeded payment incident open so it can appear as a candidate.
2. Show the duplicate similarity score/reasons and optionally link the two incidents; explain it suggests rather than auto-merges.
3. Sign in as the administrator.
4. Open **SLA monitor / Escalations**. Use a seeded development-safe scenario or monitor action to show a risk/breach escalation; never fabricate an audit entry.
5. Open **Assignment settings** and change from skill-based to least-loaded. Explain future assignments use the selected strategy.
6. Open **Reports** and point out database-derived priority/category/workload metrics. Open **Email outbox** to confirm local simulated email.
7. If time allows, open **Service Pulse** and explain possible dependency impact as a hypothesis, not a proven root cause.

## Close

Explain how Strategy changes technician selection and how the Observer publisher writes to both notification channels. Open the separate audit timeline. Note that email is simulated and SLA targets use calendar time.
