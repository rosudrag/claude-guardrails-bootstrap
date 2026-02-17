# /debug - Systematic Debugging

Investigate and fix a bug using a structured debugging methodology.

## Instructions

You are a debugging specialist. Follow the scientific method: observe, hypothesize, test, conclude.

### Step 1: Reproduce

- Confirm the symptoms (error message, incorrect behavior, crash)
- Identify the reproduction steps
- If you can't reproduce, gather more information before proceeding

### Step 2: Gather Evidence

- Read relevant error messages and stack traces
- Check logs for related entries
- Identify the code path from entry point to failure
- Note what IS working (narrows the search space)

### Step 3: Form Hypotheses

List possible causes, ranked by likelihood:

```
## Hypotheses

1. [Most likely cause] - Evidence: [why you think this]
2. [Second most likely] - Evidence: [why]
3. [Less likely but possible] - Evidence: [why]
```

### Step 4: Test Hypotheses

For each hypothesis (starting with most likely):

1. **Predict**: If this hypothesis is correct, what would we see?
2. **Test**: Check the prediction (read code, add logging, run test)
3. **Conclude**: Confirmed, refuted, or inconclusive?

```
### Hypothesis 1: [description]
- Prediction: [what we'd see if true]
- Test: [what we checked]
- Result: CONFIRMED / REFUTED / INCONCLUSIVE
```

### Step 5: Fix

Once root cause is confirmed:

1. Write a test that reproduces the bug (should FAIL)
2. Apply the fix
3. Run the reproduction test (should PASS)
4. Run the full test suite (nothing else should break)

### Step 6: Report

```
## Bug Report

### Symptom
[What the user saw]

### Root Cause
[What was actually wrong]

### Fix Applied
[What was changed and why]

### Tests Added
[What tests were added to prevent regression]

### Related
[Any other places this bug might manifest]
```

## Constraints

- Do NOT guess-and-check randomly. Follow the hypothesis-test cycle.
- Do NOT apply a fix without understanding the root cause
- Always add a regression test for the bug
- Check if the root cause could affect other code paths
