#!/usr/bin/env node
'use strict';
/**
 * Stop hook: the claim check. When Claude is about to finish with a message that claims success
 * ("all tests pass", "fixed", "done", "ready to merge") after changing code in this session, it looks
 * at the activity ledger for a test, lint, typecheck, or build command that ran after the last code
 * edit. If there is none, or the last such check failed while the message says it passed, it sends
 * Claude back once to run the check or to label the result NOT VERIFIED (core policy 1).
 *
 * Quiet when: no code was edited this session (questions, docs-only edits), the message already says
 * NOT VERIFIED / BLOCKED / untested, the ledger is off, or Claude was already sent back once for this
 * stop (stop_hook_active). Fails open. Turn off with hooks.claim_check: false.
 */
const { readStdin, failOpen, emit, projectRootFrom, loadConfig } = require('../lib/hookio');
const ledger = require('../lib/ledger');

const CLAIM = /\b(all (the )?tests (now )?pass(ed|ing)?|tests? (now |all )?pass(es|ed|ing)?|(are|is) (now )?(passing|green)|(build|lint|typecheck|type check|ci) (now )?(passes|passed|succeeds|succeeded|is clean|is green)|(it|this|that|everything|the (fix|change|bug|issue|feature)) (now )?works|works (now|correctly|as expected)|(is|are|has been|have been) (now )?(fixed|resolved)|fixed (the|this|it)\b|all done|(is|are) (now )?(done|complete)|ready (to|for) (merge|ship|review|production|deploy))/i;
const HONEST = /\bNOT VERIFIED\b|\bBLOCKED\b|\b(not|n't|never|wasn't|weren't|haven't|hasn't|couldn't|could not|did not|didn't) (been |be )?(run|ran|tested|verified|executed)\b|\bunverified\b|\buntested\b/i;
// edits that need no test run to be "done": prose and docs
const DOC_ONLY = /(\.(md|mdx|markdown|txt|rst|adoc)$|(^|\/)(docs?|documentation)\/|(^|\/)(CHANGELOG|README|LICENSE|NOTICE|CONTRIBUTING)(\.[a-z]+)?$)/i;

function main() {
  const { data, error } = readStdin();
  if (error) return failOpen(error);
  if (data.hook_event_name && data.hook_event_name !== 'Stop') return failOpen(`unexpected event ${data.hook_event_name}`);
  if (data.stop_hook_active) return process.exit(0); // already sent back once for this stop: never loop
  const message = typeof data.last_assistant_message === 'string' ? data.last_assistant_message : null;
  if (!message) return process.exit(0);
  const root = ledger.projectOf(projectRootFrom(data));
  const cfg = loadConfig(root);
  if (cfg && (cfg.effective.hooks.claim_check === false || cfg.effective.hooks.ledger === false)) return process.exit(0);

  const claim = message.match(CLAIM);
  if (!claim || HONEST.test(message)) return process.exit(0);
  const entries = ledger.read(root, { session: data.session_id || null });
  let lastEdit = -1;
  for (let i = entries.length - 1; i >= 0; i--) if (entries[i].kind === 'edit' && entries[i].ok !== false && !DOC_ONLY.test(String(entries[i].file || '').replace(/\\/g, '/'))) { lastEdit = i; break; }
  if (lastEdit === -1) return process.exit(0); // no code changed in this session
  const checks = entries.slice(lastEdit + 1).filter((e) => e.kind === 'command' && e.check);
  // quote the whole sentence that makes the claim, not just the matched words
  const from = Math.max(message.lastIndexOf('.', claim.index), message.lastIndexOf('\n', claim.index), message.lastIndexOf('!', claim.index)) + 1;
  const ends = ['.', '!', '\n'].map((c) => message.indexOf(c, claim.index)).filter((i) => i !== -1);
  const said = message.slice(from, ends.length ? Math.min(...ends) : undefined).trim().slice(0, 120);
  const file = entries[lastEdit].file;
  let reason = null;
  if (!checks.length) {
    reason = `vz-skills claim check: your reply says "${said}", but no test, lint, typecheck, or build command ran after the last code edit (${file}). Run the narrowest relevant check now and report the command and its result, or state plainly that the change is NOT VERIFIED and why.`;
  } else {
    const last = checks[checks.length - 1];
    if (last.ok === false && /pass|green|succeed|clean|works/i.test(said)) reason = `vz-skills claim check: your reply says "${said}", but the last check after the edit failed: \`${last.command}\`. Report the failure, fix it, or label the result NOT VERIFIED.`;
  }
  if (!reason) return process.exit(0);
  try { ledger.append(root, { session: data.session_id || null, kind: 'claim-check', claim: said.slice(0, 80) }); } catch { /* the record is optional */ }
  return emit({ decision: 'block', reason });
}

try { main(); } catch (e) { failOpen(`internal error: ${e.message}`); }
