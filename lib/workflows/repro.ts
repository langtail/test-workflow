import { getStepMetadata, getWritable } from "workflow";

/**
 * Step 1: Should work - releases writer lock
 * 
 * BUG: This step hangs despite correctly releasing the writer lock.
 * Releasing the lock should be sufficient for the step to complete,
 * but the request handler waits indefinitely.
 */
const openStep = async () => {
  "use step";

  const metadata = getStepMetadata();
  console.log("[openStep] Starting", { stepId: metadata.stepId });

  const writable = getWritable<string>();
  const writer = writable.getWriter();

  try {
    await writer.write(JSON.stringify({ step: "open" }) + "\n");
    console.log("[openStep] Wrote data");
  } finally {
    writer.releaseLock(); // This should be enough, but request handler hangs
  }

  return "done";
};

/**
 * Step 2: Works - releases writer lock AND closes writable
 * 
 * This step request works fine because it also closes the writable.
 * But closing should NOT be required - releasing the lock should suffice.
 */
const closeStep = async () => {
  "use step";

  const metadata = getStepMetadata();
  console.log("[closeStep] Starting", { stepId: metadata.stepId });

  const writable = getWritable<string>();
  const writer = writable.getWriter();

  try {
    await writer.write(JSON.stringify({ step: "close" }) + "\n");
    console.log("[closeStep] Wrote data");
  } finally {
    writer.releaseLock();
  }

  await writable.close();
  console.log("[closeStep] Writable closed");

  return "done";
};

/**
 * Minimal repro: request handler hangs despite releasing writer lock
 * 
 * Expected: Response for both steps should complete after releasing writer lock
 * Actual: openStep hangs, closeStep works (because it also closes writable)
 */
export const reproWorkflow = async () => {
  "use workflow";

  console.log("[reproWorkflow] Starting");

  await openStep();
  console.log("[reproWorkflow] openStep done");

  await closeStep();
  console.log("[reproWorkflow] closeStep done");

  console.log("[reproWorkflow] All done");
};