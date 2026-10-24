# Acme Procure

A fictional purchase request and approval web app, used in a hands-on agentic testing lab. All data is synthetic. Static HTML and JavaScript, no server; state is kept in the browser.

## Branches

| Branch | What it is |
| --- | --- |
| `main` | This README, the landing page and the Pages workflow |
| `release/2.3` | The app, release 2.3 |
| `release/2.4` | The app, release 2.4: **Submit** renamed **Send for approval** and moved to the form header |

## Sites

| Path | Release |
| --- | --- |
| `/acme-procure/` | Always `release/2.3` (participants) |
| `/acme-procure-demo/` | The release picked when the workflow runs (facilitator); `none` leaves it unpublished |

## Switching the facilitator's copy

Actions → **Deploy Pages** → **Run workflow** → `demo_release` = 2.3 or 2.4. From a terminal:

```
gh workflow run deploy-pages.yml -R CustomerSuccessAmer/acme-procure-lab -f demo_release=2.4
```

The app is generated from the lab's source kit; edit it there, not here.
