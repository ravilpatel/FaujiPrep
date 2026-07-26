# FaujiPrep News & Feed

`data/news.json` is regenerated every day by `.github/workflows/daily-news.yml`.
The generated feed contains the newest India-focused defence, armed-forces, SSB,
CDS and NDA items from PIB and Google News RSS. Five eligible stories per run
are expanded into source-attributed articles under `news/articles/`.

## Required GitHub secrets

Add these under **Repository settings → Secrets and variables → Actions**:

- `GEMINI_API_KEY` — API key for the Gemini API.

Optional repository variable:

- `GEMINI_MODEL` — defaults to `gemini-2.0-flash`.

The workflow can be started manually from the Actions tab. It runs daily at
08:00 IST (02:30 UTC). Generated files are committed by `github-actions[bot]`;
GitHub Pages will publish them through the repository's normal branch-based
deployment.
