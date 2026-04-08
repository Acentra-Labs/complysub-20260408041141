# Discovery Brief: ComplySub

**Generated:** 2026-04-07_16-09

---

## App Overview
**App Name:** ComplySub
**Alternative Names:** ComplyBase, SubCert, ShieldTrack
**Domain Recommendation:** complysub.com (no brand conflicts found — verify with WHOIS before purchasing)

ComplySub is a SaaS platform that automates subcontractor insurance compliance tracking for construction consultants and general contractors. It replaces the current manual process of calling insurance agents, tracking certificates in spreadsheets, and hoping policies haven't lapsed — a process that can consume hours per draw cycle across 15-20 subcontractors per job. The platform manages the full lifecycle: onboarding subs via W-9 ingestion, requesting and storing certificates of insurance from agents, monitoring expiration dates, automating verification emails, and providing a compliance dashboard organized by general contractor.

## Target Users

**Primary Users:**
- **Insurance Compliance Consultants** (like Dawn) — The admin/operator tier. Manages multiple GC clients, onboards subcontractors, configures compliance rules, and oversees the entire verification workflow. This is the paying SaaS customer.
- **General Contractors** — View their subcontractors' compliance status, check insurance before processing draws, and enter new subcontractors into the system. Need quick mobile access on job sites.

**Secondary Users:**
- **Insurance Agents** — Receive automated verification requests and certificate upload links via email. Interact only through email links (no login required). Can confirm policy status (yes/no) or upload new certificates.
- **Subcontractors** — Minimal interaction. May receive notifications about lapsed coverage. Potentially upload certificates themselves in future versions. [INFERRED]

## Core Problem

General contractors in Idaho are legally and financially liable when their subcontractors lack proper insurance. Under Idaho Code 72-216, if an uninsured sub's employee is injured, the GC pays workers' compensation. During annual audits, uninsured sub labor is treated as GC payroll, routinely resulting in five- to six-figure surprise premium adjustments.

**Current workaround:** Dawn manually calls or emails up to 20 different insurance agents per job, tracks certificates in spreadsheets and OneDrive, and manually cross-references expiration dates before each payment draw. Subcontractors — especially sole proprietors — frequently cancel policies between jobs without notification. General liability lapses have no mandatory agent notification requirement (unlike workers' comp through Idaho Industrial Commission), creating a dangerous blind spot.

**Why existing solutions don't work:** Enterprise tools like Avetta ($800+/year per contractor, contractor-pays model, 1.6/5 on Capterra), myCOI (200+ certificate minimum, $6K-$10K/year), and TrustLayer ($1K+/year, enterprise-focused) are expensive, overly complex, and built for large organizations. Dawn's clients are small Idaho GCs who need a focused, affordable tool that solves one problem well.

## Platform Recommendation

**Both — Web App (primary) + Mobile Web/PWA (secondary)**

Reasoning:
- Consultants and admins need a full web dashboard for data entry, W-9 processing, email template management, and reporting — desktop-class work
- GCs specifically requested mobile access to pull subcontractor compliance data quickly on job sites
- Insurance agents interact solely via email links — no app needed
- A Progressive Web App (PWA) approach gives GCs mobile access without the cost and complexity of a native app store deployment, appropriate for a prototype/MVP
- [INFERRED] Native mobile can be a Phase 2 consideration if the SaaS scales beyond Idaho

## Recommended Tech Stack

**Next.js + TailwindCSS (SSR/SEO-capable full-stack framework)**

Reasoning:
- Next.js provides both the server-side API routes needed for email automation, file processing (W-9 parsing), and scheduled jobs (expiration monitoring) AND the React frontend — single deployable unit
- SSR is beneficial for the marketing/landing pages that will be needed to sell the SaaS
- API routes handle the email automation engine, agent verification links, and file upload endpoints without a separate backend
- TailwindCSS enables rapid prototyping within the 3-5 day build window
- Can be deployed cost-effectively on Vercel (free tier available) or Railway, keeping hosting costs low for a bootstrapped SaaS
- [INFERRED] Supabase or PostgreSQL for the database (multi-tenant data model with row-level security for consultant isolation)
- [INFERRED] Resend or SendGrid for transactional email (agent verification requests, expiration notifications, customizable templates)
- [INFERRED] PDF parsing library (pdf-parse or similar) for W-9 ingestion and certificate data extraction

## Key Requirements

### Account System & Multi-Tenancy
- **Consultant/Admin accounts** — Full access to all GCs and subs within their tenant. Dawn is the first consultant; the SaaS model means other consultants get their own isolated tenants [INFERRED]
- **General Contractor accounts** — Username/password login scoped to their subcontractors only. Cannot see other GCs' subs. Can see: sub name, insurance certificates, expiration dates, agent name/email, policy numbers, GL expiration, workers' comp expiration
- **GC self-service sub entry** — GCs can add a new subcontractor. If the sub already exists in the system (used by another GC), the system auto-populates the insurance agent info and can immediately send a certificate request — but the GC cannot see which other GCs use that sub
- **Insurance Agent interaction** — No login required. Agents receive emails with unique secure links to: upload new certificates, confirm policy is still valid (yes/no click), or indicate they are no longer that sub's agent
- [INFERRED] **Role-based access control** — Consultant sees everything in their tenant, GC sees only their subs, sub (if login added later) sees only their own info

### Subcontractor Onboarding
- GC or consultant enters new subcontractor information
- **W-9 ingestion and parsing** — Upload a W-9 PDF; system extracts what it can (name, EIN, address) and highlights missing fields for manual completion
- W-9s required annually — system tracks W-9 expiration and requests renewal [INFERRED]
- Capture: company name, contact info, phone, email, insurance agent name, agent email, agent phone
- [INFERRED] **Bulk import** capability (CSV) for initial migration from spreadsheets — critical given 100+ existing subs

### Insurance Certificate Management
- **Automated email to insurance agents** requesting certificates of insurance (both workers' comp and general liability)
- Agent uploads certificate via secure link (agent-submitted only to prevent fraud, per client requirement)
- System stores certificates with metadata: policy number, coverage type, limits, expiration date, additional insured status
- **Compliance rules:** Minimum $1,000,000 general liability per occurrence (industry standard, exceeds Idaho's $300,000 statutory minimum per Idaho Code 54-5204), state-statute workers' comp ($500,000 employers' liability — verify with client)
- **Additional insured checkbox** — configurable per GC; some GCs require it, some don't. When enabled, adds to the verification workflow
- [INFERRED] **Ghost policy notation** — ability to flag a sub as having a ghost policy (workers' comp policy with no employees, common for sole proprietors)
- Certificates organized and viewable per GC

### Verification & Monitoring
- **Expiration tracking** — 30-day advance notification when any certificate is approaching expiration
- Notifications sent to: consultant, GC, and insurance agent (auto-email or one-click send)
- **Pre-draw compliance check** — Dashboard view showing all subs for a GC with current compliance status (green/yellow/red) so someone can manually verify before processing a draw externally
- **Periodic re-verification** — Auto-email to agent to confirm policy is still active (certificates can say "good for a year" but policy may have been cancelled). Monthly cadence recommended [INFERRED]
- Idaho-specific: Workers' comp lapses are reported by Idaho Industrial Commission, but general liability lapses have NO mandatory agent notification — making proactive verification critical
- [INFERRED] **Audit readiness** — Exportable compliance report per GC showing all subs, their coverage status, and verification history (needed for annual audits)

### Email Automation
- **Customizable email templates** per General Contractor (with their company information/branding)
- Template types: new certificate request, verification request, expiration warning, lapse notification, W-9 renewal request [INFERRED]
- Agent email includes: secure link for upload/verification, ability to indicate "I am no longer this sub's agent"
- Lapse notification template: automated email with details of the insurance holder whose coverage has lapsed
- [INFERRED] **Email activity log** — track which emails were sent, opened, and actioned for audit trail

### Notifications
- Insurance expiring in 30 days → notify consultant + GC + auto-email agent
- Insurance lapsed → escalated notification to consultant and GC
- New subcontractor added by GC → triggers onboarding workflow for consultant
- [INFERRED] Verification response received from agent → notify consultant
- [INFERRED] W-9 approaching annual renewal → notify consultant

### Data & Storage
- Centralized document storage for all certificates, W-9s, and correspondence
- Subcontractors linked to multiple GCs (shared sub database within a consultant's tenant)
- Agent information stored centrally — when a sub is added by a new GC and the sub already exists, agent info is pre-populated
- [INFERRED] **Document versioning** — retain historical certificates for audit purposes, not just the current one

### Nice-to-Haves (Not MVP)
- **Subcontract agreement tracking** — Annual agreement that subs sign; track signing status. Client confirmed this is not MVP but "nice to have"
- **Endorsement tracking** — Track specific policy endorsements beyond additional insured
- **Subcontractor login portal** — Allow subs to view their own compliance status and upload documents
- [INFERRED] **Multi-state support** — Expand compliance rules beyond Idaho when Dawn takes on out-of-state GCs
- [INFERRED] **Payment/billing module** — Stripe integration for SaaS subscription management as the consultant base grows

## Competitive Landscape

### Direct Competitors

| Product | Pricing | Target | Strengths | Weaknesses | Opportunity |
|---------|---------|--------|-----------|------------|-------------|
| **myCOI** | $6K-$10K/yr, 200+ cert minimum | Mid-market (100-500 employees) | Established (since 2009), G2 4.7/5, Procore integration, human + AI review | Dated UI, slow reviews during peak, bulk operations painful, 200-cert minimum excludes small GCs | Too expensive and complex for Dawn's clients |
| **TrustLayer** | $1K+/yr, contact sales | Mid-market to enterprise | Modern UI, G2 4.8/5, no vendor login needed, Pulse carrier network, 298K+ vendor network | OCR errors, no real-time policy monitoring (improving), opaque methodology | Better UX but still priced for larger organizations |
| **Avetta** | ~$800/yr per contractor (contractor pays) | Enterprise (450+ clients, 130K+ businesses) | Comprehensive compliance platform, continuous monitoring | Capterra 1.6/5, contractor-pays model creates resentment, poor support, billing issues | Terrible user experience — clear anti-pattern to avoid |
| **bcs** | Free up to 25 vendors, then $0.95/vendor/mo | Small to mid construction | Only freemium COI tool, 78K+ vendor network, OSHA integration | Newer entrant, limited brand recognition | Closest competitor for small GCs; ComplySub differentiates with consultant-first model and Idaho-specific compliance |
| **SubInsure** | Unknown | Small GCs | Daily workers' comp tracking, focused on uninsured subs | Small/newer, limited feature info available | Direct competitor in the same niche — study their approach |
| **Certificial** | Free tier available | Broad | Real-time policy monitoring (not static certs), agent-verified | Requires agent adoption of their platform | Innovative approach but adoption barrier |
| **Billy** | ~$100-300/mo | Construction GCs | Built for construction, W9 + lien waivers + prequal, Procore integration | Not consultant-focused | Feature-rich but not designed for the consultant-as-middleman model |

### Competitive Positioning
ComplySub's opportunity is in the **underserved small GC market** with a **consultant-first model**:
- Enterprise tools (myCOI, Avetta, TrustLayer) are too expensive and complex
- bcs's freemium model is the closest competition, but it's a self-service tool without the consultant workflow
- No existing tool is built around the **consultant-as-operator** model where a compliance consultant manages multiple GC clients
- Idaho-specific compliance knowledge (sole proprietor exemptions, Idaho Industrial Commission integration, Code 72-216 liability rules) is a niche differentiator
- The agent-email-link approach (no agent login required) mirrors TrustLayer's best-rated feature and avoids Avetta's most-hated friction point

## Idaho Regulatory Context

| Requirement | Details |
|-------------|---------|
| Workers' Comp | Mandatory for any employer with 1+ employees (Idaho Code 72-301). Sole proprietors personally exempt but must cover all non-exempt employees (Idaho Code 72-223) |
| GC Liability for Uninsured Subs | GC pays workers' comp for uninsured sub's injured employees (Idaho Code 72-216). Audit treats uninsured sub labor as GC payroll |
| General Liability | $300,000 single limit minimum for contractor registration (Idaho Code 54-5204). Industry standard is $1M per occurrence / $2M aggregate |
| Sole Proprietor Exemption | Personally exempt from workers' comp. Family members in household also exempt. Others require filed declaration with Idaho Industrial Commission |
| Contractor Registration | Idaho Code Title 54, Chapter 52 — must show proof of GL and workers' comp (or exemption) |
| Key Risk | GL policy lapses have NO mandatory agent notification requirement — unlike workers' comp. This is the primary blind spot ComplySub addresses |

## UX Considerations

### Primary Flows

**1. Consultant Onboarding a Sub (Core Flow)**
Login → Select GC → Add New Sub → Upload W-9 (auto-parse) → Review/complete extracted fields → Enter insurance agent info → System auto-sends email to agent requesting GL cert + workers' comp cert → Agent receives email with secure link → Agent uploads certs OR confirms status → Consultant reviews certs against compliance rules → Sub marked compliant/non-compliant → Dashboard updates

**2. GC Adding a Sub**
GC Login → "Add Subcontractor" → Enter sub name/info → System checks if sub exists → If yes: pre-populate agent info, send auto-request → If no: consultant notified to complete onboarding → GC sees sub appear in their dashboard once compliant

**3. Pre-Draw Compliance Check**
GC or Consultant Login → Select GC → View compliance dashboard → All subs listed with green (compliant) / yellow (expiring within 30 days) / red (expired/non-compliant) status → Click any sub to see detail → One-click to re-verify or send reminder email

**4. Agent Verification (No Login)**
Agent receives email → Clicks secure unique link → Sees: sub name, GC name, what's needed → Options: Upload new certificate, Confirm policy still active (yes/no), Mark "I am no longer this sub's agent" → Done

### Design Notes
- **Dashboard-first design** — Compliance status at a glance is the hero screen. Think traffic-light system: green/yellow/red per sub, per GC [INFERRED]
- **Mobile-responsive for GCs** — The GC dashboard must work well on phones (job-site use). Large tap targets, quick-scan compliance status, no complex data entry on mobile [INFERRED]
- **Minimal agent friction** — Agents interact via email links only. No account creation, no login, no app download. One-click actions where possible
- **Progressive disclosure** — Don't show GCs the full complexity. Their view is simple: my subs, their status, take action. Consultant view has full admin capabilities
- **Construction-industry aesthetic** — Clean, professional, no-nonsense. Avoid overly "techy" design. Dawn's clients are construction professionals, not software people [INFERRED]
- **Accessibility** — WCAG 2.1 AA compliance for the web app [INFERRED]

## Technical Considerations

### Integrations
- **Email service** (Resend/SendGrid) — Transactional emails are the backbone of the system. Must support custom templates per GC, tracking (sent/opened/clicked), and high deliverability [INFERRED]
- **PDF parsing** — W-9 extraction and certificate data extraction (policy numbers, dates, limits). Consider OCR for scanned documents [INFERRED]
- **Idaho Industrial Commission** — Research whether they have an API or public database for workers' comp verification. If not, manual verification via email remains the process [INFERRED]
- **File storage** — S3-compatible storage (Supabase Storage, AWS S3, or Cloudflare R2) for certificates, W-9s, and documents [INFERRED]
- [INFERRED] **Cron/scheduled jobs** — For expiration monitoring (daily check for 30-day-out expirations), periodic re-verification triggers, and W-9 annual renewal reminders

### Data Model (High-Level)
- **Tenants** (consultants) → **GCs** → **Subs** (many-to-many within tenant)
- **Subs** → **Insurance Agents** (one-to-one per policy type)
- **Subs** → **Certificates** (versioned, per coverage type)
- **Subs** → **W-9s** (versioned, annual)
- **Email Log** — all outbound communications with status tracking
- [INFERRED] Row-level security ensuring tenant isolation (consultant A cannot see consultant B's data)

### Constraints
- **Cost-sensitive deployment** — Dawn has no existing infrastructure. Hosting must be affordable ($0-50/month for early stage). Vercel free tier + Supabase free tier is viable for prototype [INFERRED]
- **No existing domain** — Need to purchase domain and set up DNS, email sending domain (SPF/DKIM) for deliverability [INFERRED]
- **First-time software client** — Never worked with a dev team before. Prototype should be highly polished and self-explanatory to build confidence [INFERRED]
- **Agent email deliverability** — Automated emails to insurance agents must not land in spam. Proper domain authentication (SPF, DKIM, DMARC) is critical from day one [INFERRED]

## Open Questions

1. **Coverage limits to enforce:** The notes mention $1M GL and $500K workers' comp as "maybe" thresholds. Need Dawn to confirm the exact minimum limits the system should enforce, or whether these should be configurable per GC.
2. **Ghost policies:** How should ghost policies (workers' comp with no covered employees) be handled in the compliance workflow? Auto-flag? Allow? Block?
3. **Endorsement requirements:** The notes mention "something about endorsement but missed it." Beyond additional insured, are there other specific endorsements the system needs to track?
4. **SaaS pricing model:** What does Dawn envision charging other consultants? Per-GC, per-sub, flat monthly? This affects how we build the billing system.
5. **Existing data migration:** With 15 GCs and 100+ subs already tracked in spreadsheets/OneDrive, does Dawn need a bulk import for the prototype, or will she re-enter data manually?
6. **Subcontract agreement:** Confirmed as non-MVP, but what does this document look like? Is it a standard form or custom per GC? (For future phase planning)
7. **Brand identity preferences:** No existing branding — does Dawn have color preferences, or should we propose a complete brand identity with the prototype?
