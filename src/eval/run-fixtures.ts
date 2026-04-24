import { review } from "../reviewer.js";
import { reviewFixtures } from "./fixtures.js";

function includesAny(text: string, needles: string[]): boolean {
  const haystack = text.toLowerCase();
  return needles.some((needle) => haystack.includes(needle.toLowerCase()));
}

async function main(): Promise<void> {
  for (const fixture of reviewFixtures) {
    console.log(`\n=== ${fixture.id} ===`);
    console.log(fixture.description);

    const result = await review(fixture.request);
    const blob = JSON.stringify(result, null, 2);

    console.log(blob);

    const checks: string[] = [];

    if (fixture.expectations.minFindings !== undefined) {
      checks.push(
        result.findings.length >= fixture.expectations.minFindings
          ? `PASS minFindings >= ${fixture.expectations.minFindings}`
          : `FAIL minFindings >= ${fixture.expectations.minFindings} (got ${result.findings.length})`
      );
    }

    if (fixture.expectations.shouldMentionAny?.length) {
      checks.push(
        includesAny(blob, fixture.expectations.shouldMentionAny)
          ? `PASS mentionAny`
          : `FAIL mentionAny: ${fixture.expectations.shouldMentionAny.join(", ")}`
      );
    }

    if (fixture.expectations.shouldAvoidAny?.length) {
      checks.push(
        includesAny(blob, fixture.expectations.shouldAvoidAny)
          ? `FAIL avoidAny: ${fixture.expectations.shouldAvoidAny.join(", ")}`
          : "PASS avoidAny"
      );
    }

    if (fixture.expectations.expectedSeverities?.length) {
      const severities = result.findings.map((finding) => finding.severity);
      const matched = fixture.expectations.expectedSeverities.some((severity) => severities.includes(severity as typeof severities[number]));
      checks.push(
        matched
          ? `PASS expectedSeverities`
          : `FAIL expectedSeverities: ${fixture.expectations.expectedSeverities.join(", ")}`
      );
    }

    for (const check of checks) {
      console.log(check);
    }
  }
}

void main();
