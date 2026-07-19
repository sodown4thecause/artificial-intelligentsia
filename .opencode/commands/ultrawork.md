---
description: Fire-and-forget dynamic workflow that runs until completion
agent: plan
subtask: false
---

Run a self-driving dynamic workflow that plans, delegates to specialist agents, verifies results, and synthesizes a final report. It does not stop until the objective is complete.

Objective: $ARGUMENTS

Use the dynamic_workflow_run tool with:
- objective: the user's goal
- background: true
- effort: "high"
- adversarial_review: true
- planner_model: "openai/gpt-5.6-sol"
- worker_model: "openai/gpt-5.6-terra"
- verifier_model: "openai/gpt-5.6-sol"
- Set a clear stopping_condition.

This is the "just do it" command. Start the workflow and return immediately so the user knows it is running in the background.
