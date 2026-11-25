# Acme Procure

A fictional purchase request and approval web app, used in a hands-on agentic testing lab. All data is synthetic. Static HTML and JavaScript, no server; state is kept in the browser.

## Branches

| Branch | What it is |
| --- | --- |
| `main` | This README, the landing page, the Pages workflow and the participants' source kit |
| `release/2.3` | The app, release 2.3 |
| `release/2.3.1` | Release 2.3.1: one line of the approval routing changed. For the facilitator's finale |
| `release/2.4` | Release 2.4: **Submit** renamed **Send for approval** and moved to the form header. For the facilitator's finale |

## Sites

| Path | Release |
| --- | --- |
| `/acme-procure/` | Always `release/2.3` (participants) |
| `/acme-procure-demo/` | The release picked when the workflow runs (facilitator); `none` leaves it unpublished |

## Source kit

The four documents participants work from, in [`source-kit/`](source-kit/). All fictional.

| File | What it is |
| --- | --- |
| [Acme-Procure-Source-Kit.zip](https://github.com/CustomerSuccessAmer/acme-procure-lab/raw/main/source-kit/Acme-Procure-Source-Kit.zip) | All four files in one download |
| [Acme_Procure_BRD_v1.2.pdf](source-kit/Acme_Procure_BRD_v1.2.pdf) | Business requirements document |
| [FIN-POL-007_Purchase_Approval_Policy.pdf](source-kit/FIN-POL-007_Purchase_Approval_Policy.pdf) | The signed purchase approval policy |
| [PROC_user_stories_export.csv](source-kit/PROC_user_stories_export.csv) | User stories PROC-101 to PROC-108 |
| [Vendor_master_list.csv](source-kit/Vendor_master_list.csv) | Vendors V-1001 to V-1025, three of them blocked |

## Switching the facilitator's copy

Actions → **Deploy Pages** → **Run workflow** → `demo_release` = 2.3, 2.3.1 or 2.4. From a terminal:

```
gh workflow run deploy-pages.yml -R CustomerSuccessAmer/acme-procure-lab -f demo_release=2.4
```

The app is generated from the lab's source kit; edit it there, not here.
