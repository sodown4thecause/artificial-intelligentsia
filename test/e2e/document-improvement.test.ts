import assert from "node:assert/strict";
import test from "node:test";

type Suggestion = { id: string; severity: "high" | "low"; category: "clarity" | "tone"; replacement: string };

class DocumentImprovementFixture {
  readonly telemetry: string[] = [];
  private versions: string[];

  constructor(initial: string) { this.versions = [initial]; }

  suggestions(): Suggestion[] {
    return [
      { id: "clarity-1", severity: "high", category: "clarity", replacement: "The renewal decision is due Friday." },
      { id: "tone-1", severity: "low", category: "tone", replacement: "Please review the renewal decision by Friday." },
    ];
  }

  groupedSuggestions(): Map<string, Suggestion[]> {
    const groups = new Map<string, Suggestion[]>();
    for (const suggestion of this.suggestions()) {
      const key = `${suggestion.severity}:${suggestion.category}`;
      groups.set(key, [...(groups.get(key) ?? []), suggestion]);
    }
    return groups;
  }

  accept(suggestion: Suggestion): void {
    this.versions.push(suggestion.replacement);
    this.telemetry.push("suggestion.accepted");
  }

  rewrite(content: string): void {
    this.versions.push(content);
    this.telemetry.push("document.rewritten");
  }

  editableLatest(): { version: number; content: string; editable: true } {
    return { version: this.versions.length, content: this.versions.at(-1)!, editable: true };
  }
}

test("document improvement groups suggestions and preserves editable accepted and rewritten versions", () => {
  const document = new DocumentImprovementFixture("Renewal soon.");
  const groups = document.groupedSuggestions();
  assert.deepEqual([...groups.keys()], ["high:clarity", "low:tone"]);

  document.accept(groups.get("high:clarity")![0]!);
  document.rewrite("The renewal decision is due Friday. Please confirm the owner.");

  assert.deepEqual(document.editableLatest(), {
    version: 3,
    content: "The renewal decision is due Friday. Please confirm the owner.",
    editable: true,
  });
  assert.deepEqual(document.telemetry, ["suggestion.accepted", "document.rewritten"]);
});
