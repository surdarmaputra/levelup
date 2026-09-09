---
title: Deliberate Omissions
description: Topics left out on purpose, and the reasoning for each.
sidebar:
  order: 2
---

Things a browser-automation roadmap usually includes that were left out on purpose:

| Omitted | Reason |
|---|---|
| Automating a real third-party site | Not an omission so much as a rule. Every step runs against the portal this material ships. It is the only way to stage a vendor update, and it means nobody's terms of service are tested by a learning exercise. |
| A commercial RPA suite | Step 2 covers what they sell and when they are the right answer, which for a large organisation with a governance requirement they often are. Learning one teaches their product; learning this teaches the problem underneath it. |
| A model that drives the whole browser | Slow, expensive, non-deterministic, and it hides the interface changes you most need to see. Step 7 explains the trade in full. It is a real and improving technique for exploration; it is the wrong default for a nightly production job. |
| Captcha solving and access-control circumvention | Out of scope, and on the refusal list at step 3. If a system does not want automated access, that is an answer. |
| Desktop application automation | A genuine part of the RPA world — the accounting package with no web interface at all. Different tooling, different failure modes, and it deserves its own material rather than a chapter. |
| Mobile application automation | Same reasoning. |
| A hosted browser grid | Step 13 covers when it is worth it. For three flows on one host it rarely is, and a bigger VPS is usually cheaper and simpler. |
| Parallel execution at scale | Two flows at once needs two browsers' worth of memory to save minutes on a job nobody is waiting for. Step 14 states the signal that would change the answer. |
| A visual regression suite over the target system | Tempting, and it detects changes you have no control over and cannot act on until they break something. The rung-3 rate is the cheaper leading indicator and you already record it. |
| A managed observability platform | There are barely any model calls to observe. Playwright's own trace viewer plus your ledger covers one developer well. |
| Kubernetes | Step 15 deploys to one host. The constraint is memory for browsers, not orchestration. |

If someone tells you this roadmap is incomplete without one of these, ask them what their bot
does the morning after the vendor ships a redesign.
