# London Advanced Instagram scheduling run

Read the current `main` versions of `AGENTS.md`, `.agents/skills/la-instagram/SKILL.md`,
`content/social/settings.json`, `scripts/validate-social.mjs` and the social queue. Run the
scheduling mode against Metricool brand `5985082`. Schedule only eligible approved future
records, reconcile by stable UUID before creating anything, verify the stored planner
result and persist truthful metadata through the protected repository workflow. Do not
publish immediately, repost published content or retry an unchanged rejected request.
