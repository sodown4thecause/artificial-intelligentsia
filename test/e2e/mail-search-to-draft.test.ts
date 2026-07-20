import assert from "node:assert/strict";
import test from "node:test";

type Draft = { id: string; threadId: string; body: string };

class MockGmail {
  readonly externalActions: string[] = [];
  readonly drafts: Draft[] = [];

  async search(query: string): Promise<Array<{ id: string; messages: string[] }>> {
    assert.equal(query, "from:customer subject:renewal");
    return [{ id: "thread-1", messages: ["Can we renew for another year?", "Yes, please send terms."] }];
  }

  async createDraft(threadId: string, body: string): Promise<Draft> {
    const draft = { id: "draft-1", threadId, body };
    this.drafts.push(draft);
    return draft;
  }

  async send(draft: Draft, approved: boolean): Promise<void> {
    if (!approved) throw new Error("Approval is required before sending email");
    this.externalActions.push(`send:${draft.id}`);
  }
}

test("searches Gmail, summarizes a thread, and drafts without sending before approval", async () => {
  const gmail = new MockGmail();
  const [thread] = await gmail.search("from:customer subject:renewal");
  assert.ok(thread);
  const summary = `Customer requested renewal terms: ${thread.messages.join(" ")}`;
  const draft = await gmail.createDraft(thread.id, `${summary}\n\nWe will send the renewal terms shortly.`);

  assert.equal(gmail.drafts.length, 1);
  assert.match(draft.body, /requested renewal terms/i);
  await assert.rejects(() => gmail.send(draft, false), /Approval is required/);
  assert.deepEqual(gmail.externalActions, []);

  await gmail.send(draft, true);
  assert.deepEqual(gmail.externalActions, ["send:draft-1"]);
});
