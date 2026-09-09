---
title: Deliberate Omissions
description: Topics left out on purpose, and the reasoning for each.
sidebar:
  order: 2
---

Things a voice-agent roadmap usually includes that were left out on purpose:

| Omitted | Reason |
|---|---|
| Writing the audio transport | Real-time audio over an unreliable network — jitter buffers, packet loss, echo cancellation, codec negotiation — is a specialist discipline, and none of it is what this material teaches. Use the framework's transport and spend your attention on the conversation. |
| Training or fine-tuning speech models | A different discipline with a different cost structure. A hosted recogniser and synthesiser are better than anything you will train, and the interesting problems here are turn-taking, confirmation and escalation. |
| A managed voice agent platform | Step 2 covers when it is the right answer, and for a standard flow it often is. It removes the pipeline; it does not remove your call policy, escalation, confirmation strategy or evaluation. |
| Outbound calling campaigns | Technically a small change and legally a large one — nuisance-call regulation is real, varies by jurisdiction, and carries penalties. It belongs on step 3's refusal list, not in a chapter. |
| Voice cloning of a real person | Consent, disclosure and impersonation risk that this material is not the place to work through. The disclosure at step 3 exists partly because a synthetic voice can be mistaken for a person. |
| Multilingual and code-switching calls | Genuinely valuable and it multiplies the evaluation problem before the single-language one is solved. Add it after step 12 exists, with recorded callers in each language. |
| Emotion detection and sentiment scoring | Frequently sold, weakly evidenced, and it invites decisions about a caller based on how they sounded. Escalating because a caller asked, or because the policy says so, is better grounded. |
| Payment capture over the phone | Card details spoken aloud is a compliance domain of its own. Step 6 says explicitly that this is a moment to handle deliberately rather than to store. |
| A managed observability platform | Step 14 covers when to adopt one. Four provider consoles plus your own ledger is what answers the client's question at this size. |
| Kubernetes and autoscaling | Step 16 sizes one host in concurrent calls and falls back to the human line at the limit, which is a better failure than a slow scale-up on a live call. |

If someone tells you this roadmap is incomplete without one of these, ask them what their agent
does when the caller says they can smell gas.
