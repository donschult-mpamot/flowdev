---
contract: 'flowdev-webhook'
contractVersion: 1
status: 'v1'
audience: 'sender' # implementers of monitored apps in the MPAMOT portfolio
date: '2026-04-28'
---

# FlowDev Webhook Contract — v1

This is the contract every monitored app uses to push events into FlowDev. It is versioned via the `X-FlowDev-Webhook-Version` header so future contract revisions can co-exist with v1 senders.

The contract is split into two halves:

- **Part A — Specification** (sections 1–7): the normative rules the receiver enforces. Architects and reviewers read this part.
- **Part B — Sender's Guide** (sections 8–11): how to implement against the contract from the sending side, with worked examples and a verifiable fixture. Implementers read this part.

---

# Part A — Specification

## 1. Endpoint

```
POST https://flowdev.<host>/webhooks/<app-token>
```

- `<app-token>` is opaque, ~24 characters, base32 (`A–Z2–7`). It is non-secret — its sole purpose is routing the request to the correct app. Authenticity is established by HMAC, not by token possession.
- The route is **not** wrapped in any session-auth middleware. There is no cookie, no CSRF token, no Authorization header. HMAC is the entire authentication.

## 2. Request headers

| Header | Required | Notes |
|---|---|---|
| `Content-Type: application/json` | Yes | Body is JSON. Charset assumed UTF-8. |
| `Content-Length` | Yes | Required. Receiver rejects any body where `Content-Length > 16384` with 413 before reading the body. |
| `X-FlowDev-Webhook-Version: 1` | Yes | Contract version. Senders MUST send `1` for this contract. Receiver rejects mismatched versions with 400. |
| `X-FlowDev-Signature` | Yes | Hex-encoded HMAC-SHA256 of the signing input (see §4). Lowercase. No `sha256=` prefix. |

## 3. Request body — envelope

```json
{
  "event_id":  "01HF0V5J9YXC4XAPMG3RY6ZM4S",
  "event":     "login",
  "timestamp": 1714291200,
  "app_id":    "f0a1b2c3-d4e5-6789-abcd-ef0123456789",
  "version":   1,
  "data":      { "user_id": "u_42", "success": true }
}
```

| Field | Type | Notes |
|---|---|---|
| `event_id` | string | Sender-generated UUID v4 **or** ULID. Stable across retries — same logical event reuses the same `event_id`. Used for idempotency. |
| `event` | string | Event type. v1 reserved values: `login`, `integration_call`, `custom_metric`. Receiver MUST NOT 4xx on unknown values — forward compatibility. |
| `timestamp` | integer | Unix seconds. Used for replay-protection skew check. |
| `app_id` | string | Receiver's internal UUID for the app. Senders are given this value at app registration. Must match the app resolved from `<app-token>`; mismatch → 400. |
| `version` | integer | Contract version. Currently `1`. Mirrored in the `X-FlowDev-Webhook-Version` header. |
| `data` | object | Event-typed payload. See §6 for per-event-type schemas. |

**Maximum body size: 16 KB pre-decompression.** The receiver does not accept compressed request bodies in v1.

## 4. Authentication & integrity (HMAC)

### Signing input — canonical string

```
<version>.<timestamp>.<raw_body>
```

- `<version>` is the integer from the `X-FlowDev-Webhook-Version` header rendered as ASCII (e.g. `1`).
- `<timestamp>` is the integer from the payload `timestamp` field rendered as ASCII (e.g. `1714291200`).
- `<raw_body>` is the **raw bytes of the request body**, byte-for-byte as transmitted over the wire. Not a re-serialised form. This is critical: re-serialising the JSON to "tidy it up" before signing will produce a signature that does not match what the receiver computes.
- Separators are literal ASCII period (`.`, 0x2E) characters.
- The signing input is concatenated as bytes — UTF-8 encoded for the version and timestamp prefixes, raw for the body.

### Signature

```
HMAC-SHA256(secret = <per-app-secret>, message = <signing input>) → 32-byte digest → hex-encoded lowercase
```

### Verification (receiver-side)

1. Receiver reads the raw body bytes (does not parse JSON yet).
2. Receiver reads `version` from the `X-FlowDev-Webhook-Version` header and `timestamp` from somewhere it can trust *before* HMAC — for v1 this is the `timestamp` field embedded in the body, after a minimal length-and-shape validation. (See §11 for why this is safe.)
3. Receiver constructs the signing input.
4. Receiver computes HMAC-SHA256 with the per-app secret.
5. Receiver compares to `X-FlowDev-Signature` using a **constant-time comparison** (`crypto.timingSafeEqual` in Node).
6. Mismatch → 401, return immediately.

### Per-app secret

- Generated server-side at app registration. Format: `whsec_<base32>`, length ~32 chars after the prefix.
- Shown to the registering admin **once**. There is no API to retrieve plaintext later.
- Rotation generates a new secret and shows that one once. Both old and new are accepted during a 24-hour overlap window; after the window, only the new secret verifies.
- Stored encrypted at rest using FlowDev's envelope-encryption pattern (see Architecture §7).

## 5. Replay protection & idempotency

### Replay window

- Receiver computes `now - payload.timestamp`; absolute value must be `≤ 5 minutes` (300 seconds).
- Outside the window → **400 with reason** `replay_window_exceeded`. Sender must NOT retry — the cause is clock drift.
- Senders MUST run NTP. A clock more than 5 minutes off the wall will see all events rejected.

### Idempotency

- Receiver maintains a `(event_id, app_id)` UNIQUE constraint on `webhook_events_raw`.
- First successful insert → 202.
- Duplicate `event_id` (any reason: network retry, sender-side retry, outright replay attack within window) → 202 + drop. The sender cannot tell the two apart, and that is intentional.
- Senders MUST generate the `event_id` *before* the first send and reuse it for every retry of the same logical event. Generating a fresh UUID per retry attempt defeats idempotency and produces duplicates in FlowDev.

## 6. Per-event-type `data` schemas

Each event type has a strict JSON shape. Senders MUST conform; the worker that drains `webhook_events_raw` will record schema-validation failures into `webhook_events_raw.processError` for sender debugging visibility.

### 6.1 `event: "login"`

```json
{
  "user_id":         "u_42",
  "user_email_hash": "sha256:9b8a...",
  "ip":              "203.0.113.42",
  "user_agent":      "Mozilla/5.0 ...",
  "success":         true
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `user_id` | string | Yes | Stable identifier within the sending app. Treated as PII. |
| `user_email_hash` | string | No | SHA-256 hex of the lowercased email address, prefixed `sha256:`. Senders SHOULD send this for adoption-analytics joins; never send the plaintext email. |
| `ip` | string | No | IPv4 or IPv6. |
| `user_agent` | string | No | UA header from the originating request. |
| `success` | boolean | Yes | `true` on successful auth, `false` on auth failure. |

### 6.2 `event: "integration_call"`

```json
{
  "integration": "stripe",
  "endpoint":    "POST /v1/charges",
  "latency_ms":  412,
  "success":     true,
  "status_code": 200,
  "error":       null
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `integration` | string | Yes | Lowercase identifier. Senders pick one consistent value per integration. |
| `endpoint` | string | Yes | Method + path or method + URL fragment. |
| `latency_ms` | integer | Yes | Wall-clock latency including network. |
| `success` | boolean | Yes | Sender-defined success. |
| `status_code` | integer | No | HTTP status if applicable. |
| `error` | string | No | Brief error string when `success: false`. |

### 6.3 `event: "custom_metric"`

```json
{
  "metric":     "queue_depth",
  "value":      42,
  "unit":       "items",
  "dimensions": { "queue": "outbound_email" }
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `metric` | string | Yes | Lowercase, snake_case, unique per app. |
| `value` | number | Yes | Numeric value. Decimal allowed. |
| `unit` | string | No | Free-form, e.g. `items`, `ms`, `bytes`. |
| `dimensions` | object | No | Flat key→string map for slicing. Max 8 dimensions. |

### 6.4 Forward compatibility

- Receiver does not 4xx on unknown `event` values.
- Receiver does not 4xx on additional fields inside `data`.
- Senders SHOULD reserve field names with a `_` prefix for sender-private metadata (the receiver discards `_`-prefixed fields at the typed-event boundary).

## 7. Error responses & retry semantics

| Outcome | HTTP | Body | Sender retry |
|---|---|---|---|
| Accepted (first time) | 202 | `{"accepted": true}` | No |
| Accepted (idempotent replay) | 202 | `{"accepted": true, "duplicate": true}` | No |
| Bad signature | 401 | `{"error": "hmac_invalid"}` | **No — fix the signing logic** |
| Unknown app token | 404 | `{"error": "unknown_app"}` | **No — registration error** |
| Replay window exceeded | 400 | `{"error": "replay_window_exceeded"}` | **No — fix sender clock** |
| Version mismatch | 400 | `{"error": "version_mismatch"}` | **No — upgrade sender** |
| Malformed body / schema fail | 400 | `{"error": "malformed", "detail": "..."}` | **No — fix payload** |
| Body too large | 413 | `{"error": "body_too_large"}` | **No — split or reduce payload** |
| Server fault | 5xx | varies | **Yes — exponential backoff** |

### Recommended retry policy (for 5xx only)

- Initial backoff: 30 seconds.
- Backoff factor: 2 (`30s → 60s → 120s → 240s → 480s`).
- Maximum backoff: 30 minutes (cap).
- Maximum attempts: 5 (including the first attempt).
- Reuse the **same `event_id`** across all attempts — this is what makes idempotency work.

After 5 failed attempts, senders SHOULD log the event to their own dead-letter store and continue. FlowDev does not provide a sender-side replay endpoint for events older than the 5-minute replay window.

## 8. Receiver SLOs (informational, for sender capacity planning)

| Concern | Target |
|---|---|
| Valid request → 202 | < 50ms p95 at 50 RPS sustained per receiver instance |
| Invalid HMAC → 401 | < 50ms p99 at the same load |
| Persistence | Out-of-band on the worker; receiver does not block on typed-event DB writes |

These targets do not bound sender behaviour — they are stated so senders can plan retry budgets against realistic receiver latency.

---

# Part B — Sender's Guide

## 9. Worked HMAC fixture (canonical, verifiable)

This fixture is committed to FlowDev's repository as `packages/shared/__fixtures__/webhook/login.json`. It is generated by `scripts/webhook-fixture.ts` against the literal inputs below. **Senders SHOULD reproduce the HMAC value in their own implementation as a unit test; mismatching this fixture means the sender's signing logic is broken.**

### Fixture inputs

```
secret  = "whsec_test_M5R6F4UBCFYP43T3FLQ"
version = "1"
header  X-FlowDev-Webhook-Version = "1"
ts      = "1714291200"
```

### Fixture body (raw bytes, byte-for-byte)

```
{"event_id":"01HF0V5J9YXC4XAPMG3RY6ZM4S","event":"login","timestamp":1714291200,"app_id":"f0a1b2c3-d4e5-6789-abcd-ef0123456789","version":1,"data":{"user_id":"u_42","success":true}}
```

- Body length: **181 bytes**.
- No trailing newline. No whitespace inside the JSON. No re-ordering of keys.

### Fixture signing input

```
1.1714291200.{"event_id":"01HF0V5J9YXC4XAPMG3RY6ZM4S","event":"login","timestamp":1714291200,"app_id":"f0a1b2c3-d4e5-6789-abcd-ef0123456789","version":1,"data":{"user_id":"u_42","success":true}}
```

### Fixture expected signature

```
X-FlowDev-Signature: 26bd8d88de5bcf5ffda14f765e45d7cf420615566bb184eb82f677439cc280a8
```

Reproduce in any language and confirm a byte-equal match to the hex above before going to production.

### Second fixture — `integration_call`

```
secret = "whsec_test_M5R6F4UBCFYP43T3FLQ"
ts     = "1714291260"
body   = {"event_id":"01HF0V6KAXM50PVCNAQE7Z3TYN","event":"integration_call","timestamp":1714291260,"app_id":"f0a1b2c3-d4e5-6789-abcd-ef0123456789","version":1,"data":{"integration":"stripe","endpoint":"POST /v1/charges","latency_ms":412,"success":true,"status_code":200}}
body length = 263 bytes
expected X-FlowDev-Signature: c0851b419ed0fbaa380427d3edcf177f69b860a193d09c4e70e9cc1a4609585b
```

## 10. Reference implementations

### TypeScript (Node 20+)

```ts
import crypto from 'node:crypto';

interface FlowDevWebhookOptions {
  url: string;            // https://flowdev.<host>/webhooks/<app-token>
  secret: string;         // whsec_...
  appId: string;          // FlowDev's internal UUID for this app
}

export async function sendFlowDevEvent(
  opts: FlowDevWebhookOptions,
  event: 'login' | 'integration_call' | 'custom_metric',
  data: unknown,
  eventId: string = crypto.randomUUID(),
): Promise<void> {
  const ts = Math.floor(Date.now() / 1000);
  const payload = {
    event_id:  eventId,
    event,
    timestamp: ts,
    app_id:    opts.appId,
    version:   1,
    data,
  };
  // CRITICAL: serialise once and use the exact bytes for both the body and the HMAC.
  const body = JSON.stringify(payload);
  const signingInput = `1.${ts}.${body}`;
  const signature = crypto
    .createHmac('sha256', opts.secret)
    .update(signingInput)
    .digest('hex');

  const res = await fetch(opts.url, {
    method: 'POST',
    headers: {
      'Content-Type':              'application/json',
      'X-FlowDev-Webhook-Version': '1',
      'X-FlowDev-Signature':       signature,
    },
    body,
  });

  if (!res.ok && res.status >= 500) {
    throw new RetryableError(`FlowDev 5xx: ${res.status}`);
  }
  if (!res.ok) {
    // 4xx — fix the sender; do not retry. Log loudly.
    throw new NonRetryableError(`FlowDev ${res.status}: ${await res.text()}`);
  }
}

class RetryableError    extends Error {}
class NonRetryableError extends Error {}
```

### Python (3.11+)

```python
import hmac, hashlib, json, time, uuid, requests

def send_flowdev_event(url: str, secret: str, app_id: str, event: str, data: dict, event_id: str | None = None) -> None:
    event_id = event_id or str(uuid.uuid4())
    ts = int(time.time())
    payload = {
        "event_id":  event_id,
        "event":     event,
        "timestamp": ts,
        "app_id":    app_id,
        "version":   1,
        "data":      data,
    }
    # CRITICAL: serialise once and use the exact bytes for both the body and the HMAC.
    body = json.dumps(payload, separators=(",", ":"))  # no whitespace, deterministic
    signing_input = f"1.{ts}.{body}".encode("utf-8")
    signature = hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).hexdigest()

    res = requests.post(
        url,
        headers={
            "Content-Type":               "application/json",
            "X-FlowDev-Webhook-Version":  "1",
            "X-FlowDev-Signature":        signature,
        },
        data=body,  # NOT json= — that re-serialises and breaks the signature
        timeout=10,
    )
    if res.status_code >= 500:
        raise RetryableError(f"FlowDev 5xx: {res.status_code}")
    if not res.ok:
        raise NonRetryableError(f"FlowDev {res.status_code}: {res.text}")
```

> **Watch out:** in Python `requests`, passing `json=payload` re-serialises with different whitespace than your `json.dumps(payload, separators=(",", ":"))`. Always pass `data=body` with the exact bytes you signed.

### curl (for ad-hoc testing — uses the canonical fixture)

```bash
SECRET='whsec_test_M5R6F4UBCFYP43T3FLQ'
TS=1714291200
BODY='{"event_id":"01HF0V5J9YXC4XAPMG3RY6ZM4S","event":"login","timestamp":1714291200,"app_id":"f0a1b2c3-d4e5-6789-abcd-ef0123456789","version":1,"data":{"user_id":"u_42","success":true}}'
SIG=$(printf '1.%s.%s' "$TS" "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -hex | awk '{print $2}')

curl -i -X POST "https://flowdev.example.com/webhooks/<app-token>" \
  -H "Content-Type: application/json" \
  -H "X-FlowDev-Webhook-Version: 1" \
  -H "X-FlowDev-Signature: $SIG" \
  --data-binary "$BODY"

# Expect: HTTP/1.1 202
# Expect: SIG = 26bd8d88de5bcf5ffda14f765e45d7cf420615566bb184eb82f677439cc280a8
```

## 11. Common implementer mistakes

These are the signing/replay/idempotency failure modes we expect to see most often. Read this list before debugging.

1. **Signing a re-serialised body.** The signature is over the exact bytes you put on the wire. Some HTTP clients re-serialise JSON between "I have an object" and "I am putting bytes on the wire" — and they won't necessarily preserve key order or whitespace. Always serialise to bytes once, then sign and send those same bytes.
2. **Generating a new `event_id` per retry.** You will produce duplicate events in FlowDev. The `event_id` MUST be sticky across retries of the same logical event.
3. **Sending `timestamp` as a string or as a millisecond value.** It is **Unix seconds, integer**. The number `1714291200`. Not `"1714291200"`. Not `1714291200000`.
4. **Skipping `X-FlowDev-Webhook-Version: 1`.** It is required; missing → 400.
5. **Clock drift.** If your container has no NTP, your clock will drift. The 5-minute replay window is generous, but only on a clock that is approximately right. We've seen sender clocks 30+ minutes off in containers without NTP — every event will 400 with `replay_window_exceeded`.
6. **Wrapping the route in session auth on the receiver side.** This is a receiver-side mistake — flagged here for the architects of the receiver, not for senders. Webhook routes are explicitly excluded from `auth()` middleware.
7. **Logging the `secret`.** It is a credential. Treat it like one. FlowDev's diagnostic view will show you the *outcome* of HMAC validation; you never need to see the secret to debug.

## 12. Diagnostic view

ADMIN-role users in FlowDev can view the last 50 webhook deliveries per app at:

```
https://flowdev.<host>/apps/<id>/webhook-deliveries
```

The view shows, for each delivery: `received_at`, `status_code`, HMAC validation outcome (valid / invalid), idempotency outcome (first / replay), body size, and any `processError` recorded by the worker. **This is the first place to look when debugging a sender integration** — it reveals whether the signature was right, the timestamp was within the window, and whether the typed-event schema validated.

---

## Versioning policy

- This contract is **v1**. The `X-FlowDev-Webhook-Version: 1` header pins it.
- Future versions (v2, v3) will be additive contracts with their own header value. Receivers will support multiple contract versions concurrently for an overlap window.
- v1 will not change in a breaking way without a version bump. Reserved-field discipline (§6.4) means new optional fields can be added inside `data` schemas without touching the contract version.
