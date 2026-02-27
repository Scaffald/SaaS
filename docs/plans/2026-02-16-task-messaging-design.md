# Task-Based Messaging System Design

**Date:** 2026-02-16
**Branch:** feature/task-messaging (based on forsured)
**Status:** Approved

## Overview

A conversation system attached to tasks that supports:
- Private contractor-broker threads (multiple per task, one per broker)
- Cross-party threads between contractor/broker and manager/broker
- Email integration via SendGrid inbound parse for bidirectional messaging
- Field-level encryption on messages and file-level encryption on attachments
- Attachment promotion to policy documents via the existing upload pipeline

## Key Requirements

- Brokers are linked at the org level; contractors pick which broker to bring into each task conversation
- Brokers without accounts (manual user records) participate via email; messages attributed to their manual user record
- Either side can initiate cross-party conversations
- New participants see full conversation history
- Org-level policy controls whether emails include full message content or just notification links
- Conversations are confidential between members, encrypted in flight and at rest

---

## Section 1: Data Model

### New Tables

#### `forsured.conversations`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| task_id | FK to forsured.tasks | Every conversation scoped to a task |
| organization_id | FK to forsured.organizations | For RLS |
| type | enum: `private_broker`, `cross_party` | Distinguishes channel types |
| created_by_user_id | FK to forsured.users | Who started the conversation |
| created_at | timestamptz | |
| updated_at | timestamptz | Auto via trigger |
| last_message_at | timestamptz | Denormalized for sort/display |
| inbound_email_address | text UNIQUE | Generated: `conv-{short_id}@chat.forsured.com` |
| status | enum: `active`, `archived` | |

#### `forsured.conversation_participants`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| conversation_id | FK | |
| user_id | FK to forsured.users | Can be a manual/shadow user |
| role_in_conversation | enum: `owner`, `participant` | Owner = creator/inviter |
| added_by_user_id | FK | Who added this participant |
| joined_at | timestamptz | |
| left_at | timestamptz | Nullable, for if they leave |

#### `forsured.conversation_messages`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| conversation_id | FK | |
| sender_user_id | FK | |
| encrypted_content | jsonb | EncryptedField format: `{ciphertext, iv, keyId, authTag, algorithm}` |
| source | enum: `app`, `email` | How message was sent |
| email_metadata | jsonb | Nullable; subject, message-id, in-reply-to for email-sourced |
| created_at | timestamptz | |
| edited_at | timestamptz | Nullable |

#### `forsured.conversation_attachments`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| message_id | FK to conversation_messages | |
| conversation_id | FK | Denormalized for RLS |
| storage_path | text | Path in Supabase storage |
| original_filename | text | |
| mime_type | text | |
| file_size_bytes | bigint | |
| encryption_metadata | jsonb | Encryption details for the stored file |
| promoted_to_document_id | FK to forsured.documents | Nullable; set when promoted to policy doc |
| created_at | timestamptz | |

### New Storage Bucket

**`conversation-attachments`** - private, encrypted at rest, RLS via conversation participant membership.
- Path format: `{conversation_id}/{message_id}/{filename}`
- Created via SQL migration (same pattern as all existing buckets)

### Organization Setting

New column on `forsured.organizations`:

| Column | Type | Default |
|--------|------|---------|
| conversation_email_policy | enum: `full_content`, `links_only` | `full_content` |

### Key Design Decisions

1. **Messages encrypted at field level** using existing AES-256-GCM `fieldEncryption` service, stored as `EncryptedField` JSONB.
2. **Attachments stored in dedicated bucket**, separate from policy docs. Promotion to policy doc goes through `taskDocumentService.uploadTaskDocument()` which uses `StorageRouter`/`IStorageBackend` - future-proof for storage provider changes.
3. **Sender verification on inbound email**: lookup conversation by inbound address, verify sender email against participant list, reject to `email_rejection_log` if not found.
4. **Full history access**: RLS on messages checks participant membership; new participants see everything.

---

## Section 2: Email Integration & Routing

### Inbound Parse Flow

```
Email arrives at conv-{short_id}@chat.forsured.com
       |
       v
SendGrid Inbound Parse webhook
       |
       v
Supabase Edge Function: inbound-conversation-email
       |
       +-- 1. Look up conversation by inbound_email_address
       |     -> 200 OK + log rejection if not found
       |
       +-- 2. Verify sender email against conversation_participants
       |     (join to forsured.users on email)
       |     -> 200 OK + log rejection if not a participant
       |
       +-- 3. Check conversation status = 'active'
       |     -> 200 OK + log rejection if archived
       |
       +-- 4. Extract message body (prefer text/plain, fallback HTML->text)
       |     -> Encrypt content via fieldEncryption service
       |     -> INSERT into conversation_messages (source: 'email')
       |
       +-- 5. Extract attachments (if any)
       |     -> Upload each to conversation-attachments bucket
       |     -> Encrypt file blob (AES-256-GCM)
       |     -> INSERT into conversation_attachments
       |
       +-- 6. Trigger outbound notifications to other participants
             (respecting org conversation_email_policy)
```

### Outbound Email Flow

When a message is sent (app or email), all other participants get notified:

**`full_content` policy:**
- Subject: `[Forsured] New message on {task_name} from {sender_name}`
- Body: sender name, message content, attachment list, link to app
- Reply-to: `conv-{id}@chat.forsured.com`
- Footer: confidentiality notice

**`links_only` policy:**
- Subject: `[Forsured] New message on {task_name}`
- Body: notification text + CTA button to view in app
- Reply-to: `conv-{id}@chat.forsured.com` (replies still work)
- Footer: confidentiality notice

### Email Address Generation

- Format: `conv-{nanoid(12)}@chat.forsured.com`
- Generated on conversation creation
- Separate subdomain from insurance uploads (`chat.` vs `inbound.`)

### SendGrid Configuration

- MX record for `chat.forsured.com` pointing to SendGrid
- Inbound parse rule: `chat.forsured.com` -> edge function URL

---

## Section 3: Conversation Lifecycle & Permissions

### Creating Conversations

**Private broker thread (contractor initiates):**
1. Contractor views task, clicks "Discuss with broker"
2. Picks broker from org-level broker list (`forsured.broker_contractor_relationships`)
3. Creates conversation with `type = private_broker`
4. Contractor = `owner`, broker = `participant`
5. If broker is manual user, first notification email includes upsell CTA

**Cross-party thread (either side initiates):**
1. Contractor/broker clicks "Contact manager" OR manager clicks "Contact contractor"
2. Creates conversation with `type = cross_party`
3. Initiator = `owner`, other party = `participant`
4. Either side can add their broker later

### Adding Participants

**Rules:**
- `private_broker`: only contractor can add, only from their broker list
- `cross_party`: contractor adds their brokers, manager adds their brokers
- System message posted: "{user} added {broker} to this conversation"
- New participant sees full history immediately

### Visibility & Privacy Enforcement

**RLS policies on `conversation_messages`:**
- SELECT: user in `conversation_participants` with `left_at IS NULL`
- INSERT: same + `sender_user_id` = authenticated user

**RLS policies on `conversation_attachments`:**
- SELECT/INSERT: participant check via `conversation_id`
- No UPDATE/DELETE (immutable)

**Application-level (tRPC):**
- Verify user has access to parent task
- Verify broker relationships before participant additions
- Cross-party: verify user is assigned contractor, project manager, or linked broker

### Promoting Attachments to Policy Documents

1. Download file from `conversation-attachments` bucket (decrypt)
2. Call `taskDocumentService.uploadTaskDocument()` -> `StorageRouter` -> `IStorageBackend`
3. Create `forsured.documents` record with proper metadata
4. Link to task via `forsured.task_documents`
5. Set `conversation_attachments.promoted_to_document_id`
6. UI shows badge: "Added to task as policy document"

Conversation attachment stays in conversation bucket; policy doc is a separate copy through canonical upload path.

### Confidentiality Notice

Persistent banner on every conversation thread:

> "Conversations are confidential between the members of this conversation, encrypted in flight and at rest within Forsured's systems."

Also included as footer in outbound email notifications.

---

## Section 4: Email Templates & Broker Upsell

### Template Types

**1. New message notification (full_content)**
- Subject: `[Forsured] New message on {task_name} from {sender_name}`
- Body: sender name, message content, attachment list, link to conversation
- Reply-to: conversation inbound address
- Footer: confidentiality notice

**2. New message notification (links_only)**
- Subject: `[Forsured] New message on {task_name}`
- Body: notification text + CTA button
- Reply-to: conversation inbound address
- Footer: confidentiality notice

**3. Broker-without-account variant (extends either above)**
- Top banner: "You're receiving this because {client_name} uses Forsured to manage insurance compliance."
- Bottom CTA: "Sign up for Forsured to see all your tasks, manage documents, and communicate with your clients in one place. [Create your free account]"
- Reply footer tip: "Tip: Sign up at forsured.com to see all your conversations and documents in one place."

**4. Participant added notification**
- Subject: `[Forsured] You've been added to a conversation on {task_name}`
- Body: "{adder_name} added you to a conversation about {task_name} on {project_name}."
- CTA: "View conversation" link

### System Messages (in-app)

Inline in conversation thread:
- "{user} started this conversation"
- "{user} added {participant} to this conversation"
- "{user} promoted {filename} to a policy document on this task"

---

## Section 5: UI Components & Interactions

### Task Detail View - Conversations Tab

**Conversation List Panel:**
- All conversations the current user participates in for this task
- Each card: participant names/avatars, last message preview (decrypted), timestamp, unread indicator
- `private_broker` conversations: lock icon + "Private - Broker"
- `cross_party` conversations: people icon + "Discussion with {other party}"
- "New Conversation" button:
  - "Discuss with my broker" -> broker picker
  - "Contact manager" / "Contact contractor" (role-dependent)

**Conversation Thread View:**
- Chat-like chronological display
- Messages: sender name/avatar, timestamp, source badge (app/email icon), content
- Attachments: inline previews, context menu with "Download" | "Use as policy document"
- Persistent confidentiality banner at top
- Collapsible participant list
- "Add broker" button (contextual)
- Message input with attachment upload + send

### Role-Specific Views

**Contractor:** private broker threads + cross-party threads; "Discuss with my broker" + "Contact manager"

**Manager:** cross-party threads only (never sees private broker threads); "Contact contractor" + "Add my broker"

**Broker:** threads they've been added to; can send messages but cannot add participants or promote attachments

### Organization Settings

Communications section in org settings:
- Toggle between "Include full message content in email notifications" and "Send notification links only"
- Descriptive text explaining privacy implications

### Non-Account Broker Experience

- Messages appear attributed to manual user record with "via email" indicator
- User merge preserves attribution when broker signs up

---

## Section 6: Security & Encryption

### Encryption Strategy

**Messages:** Field-level AES-256-GCM via existing `fieldEncryption` service. Encrypted before INSERT, decrypted on SELECT in tRPC layer. Key rotation supported via `keyId`.

**Attachments:** File-level AES-256-GCM. Blob encrypted before upload, `encryption_metadata` stored on record. Decrypted on download in tRPC/API layer.

**At rest:** Supabase database-level encryption + field-level encryption (messages) + file-level encryption (attachments).

**In transit:** HTTPS/TLS on all API calls, SendGrid API, inbound parse webhook, Supabase connections.

### Access Control Layers

| Layer | Mechanism |
|-------|-----------|
| Database | RLS: participant membership check |
| Application | tRPC: task access + participant membership |
| Storage | Supabase storage RLS: conversation_id path-based |
| Email inbound | Sender verified against participant list |
| Email outbound | Content only sent to verified participants |

### Threat Mitigations

| Threat | Mitigation |
|--------|------------|
| Non-participant reads messages | RLS + tRPC auth checks |
| Email spoofing | Sender email verified; rejections logged |
| Manager reads private broker thread | Type + participant list enforced at RLS; manager never participant on `private_broker` |
| Storage breach | Field-level + file-level encryption; keys in vault |
| Malicious attachments | MIME type validation, file size limits, virus scanning if available |

### Audit Trail

- Conversation operations logged via existing audit triggers
- Email rejections logged to `forsured.email_rejection_log`
- Attachment promotions logged to audit log + task history

---

## Section 7: Edge Function & Inbound Parse Webhook

### Edge Function: `inbound-conversation-email`

Location: `packages/supabase/functions/inbound-conversation-email/index.ts`

**Processing pipeline:**
1. Parse multipart form data (to, from, text, html, subject, attachments)
2. Look up conversation by `inbound_email_address` -> reject if not found (200 OK + log)
3. Verify sender email against `conversation_participants` -> reject if not participant (200 OK + log)
4. Check `conversation.status = 'active'` -> reject if archived (200 OK + log)
5. Clean email body (strip reply chains, signatures)
6. Encrypt message content via `fieldEncryption`
7. INSERT `conversation_messages` (source: 'email', email_metadata)
8. For each attachment: validate MIME/size, encrypt blob, upload to bucket, INSERT `conversation_attachments`
9. Trigger outbound notifications to other participants (per org policy)

**Note:** Always return 200 to SendGrid, even for rejections (non-200 causes retries).

### Existing Pattern Alignment

Follows same pattern as insurance upload inbound parse (migrations 305-307):
- Unique per-entity inbound address
- Sender verification
- Rejection logging
- Attachment extraction and storage

Difference: `inbound.forsured.com` -> insurance uploads, `chat.forsured.com` -> conversation messages.
