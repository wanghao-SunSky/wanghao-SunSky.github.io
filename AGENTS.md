# Repository Instructions

## Language

Use Chinese for articles and project documents unless the task asks for another language.

## Content Rules

- Keep public content in this repository; keep X bookmarks, interview notes, private drafts, analytics exports, and credentials outside it.
- Verify technical claims against primary sources, code, tests, or recorded experiments.
- Mark opinion, inference, unknowns, and unverified code clearly.
- Do not publish, submit, message, or post externally without explicit approval for that specific action.
- Do not change a published slug unless a redirect plan is approved.

## Article Workflow

Follow `docs/pipeline.md` for the overall order and `docs/sop.md` for details. Before marking an article ready, complete `templates/publish-checklist.md`.

For drafting, use `.agents/skills/tech-article-writer/SKILL.md`. Start with search-keyword research (`docs/seo-distribution.md`); the main keyword must appear in the title, H1, description, and first paragraph. Write for developers and tech enthusiasts who use AI coding tools (Claude Code, Cursor, Copilot) but have not read agent framework source code. Use common developer terms without explanation; give project-specific concepts a Chinese name plus the original name and one sentence of explanation. Use real examples from the source, docs, or GitHub workflows instead of unrelated everyday analogies. Read `docs/style-reference.md` before drafting. An article is not ready until a no-context reader-test sub-agent can restate its main point and does not flag the main sections as too shallow.

| Step | Tool or skill |
| --- | --- |
| Style and structure | `docs/style-reference.md` |
| Pitch menu, titles, cover text, opening | `docs/title-cover-intro.md` (adapted from `~/.gemini/dbskill/skills/dbs-title-cover-intro`) |
| Site layout and OG images | `docs/site-design.md` |
| X version | `~/.codex/skills/x-native-writer` |
| Copy rules | `python3 /tmp/fenng-style/scripts/lint_copy_rules.py` (Fenng/tech-doc-style-chinese; ignore corner-quote hints) |
| AI-pattern checklist | `~/.gemini/dbskill/skills/dbs-ai-check` (checklist only) |
| Publish risk | `~/.gemini/dbskill/skills/dbs-content-risk-check` |

Check platform rules in `docs/platforms.md` before writing a platform version. Run `npx -y autocorrect-node --lint` and `npx -y @lint-md/cli` on changed Markdown outside `templates/`.

Do not write "verified" or "checked" unless a tool result in the current session supports it.

## Repository Changes

Keep site code, content, examples, and docs separated. Add dependencies only when they solve a current requirement.

公开文章不添加“本文由 AI 辅助研究与撰写”等制作声明、核查过程或检查通过报告；这些记录留在私有工作区。来源链接、影响结论的局限和示例性质照常保留。
