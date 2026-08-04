# chatbot-panel

Angular 18 admin panel for a multi-tenant chatbot SaaS: bot configuration, document management, live agent inbox, leads and usage quotas.

Part of a four-service platform: a
[Spring Boot backend](https://github.com/Miguel2219/chatbot-saas-backend),
a [Python RAG microservice](https://github.com/Miguel2219/chatbot-service-rag),
an embeddable Preact chat widget, and this panel.

## Stack

- **Angular 18** with standalone components
- **Angular Material** and **CDK** — UI components
- **RxJS** — reactive state and HTTP
- **ng-select** — searchable selects
- **ngx-toastr** — notifications
- **secure-ls** — encrypted browser storage
- **Karma** and **Jasmine** — testing

## Project structure

```
src/app
├── core/          # guards, HTTP interceptors, shared services, utils
├── modules/       # feature modules
│   ├── auth/
│   ├── dashboard/
│   ├── bots/
│   ├── documents/
│   ├── conversations/
│   ├── inbox/      # live agent inbox — human takeover from the bot
│   ├── leads/
│   ├── quotas/
│   ├── tenants/
│   ├── users/
│   ├── roles/
│   ├── whatsapp-config/
│   └── administration/
└── shared/        # reusable components, layouts, pipes, interfaces
```

Feature modules mirror the backend's domains one to one, so a change to a
backend module has an obvious counterpart on the frontend. Cross-cutting
concerns — authentication guards, token interceptors, session handling — live
in `core/` and are imported once.

## Design notes

**Credentials are not stored in plain text.** Session data is kept in encrypted
browser storage through `secure-ls` rather than raw `localStorage`, so a token
is not readable by anything with access to the browser's storage inspector.

**Sessions expire on inactivity.** The panel closes the session after 30 minutes
without user activity and warns the user 2 minutes before. Activity detection is
debounced so that tracking mouse and scroll events does not cost performance.

**Role-based UI.** The panel consumes the backend's role and permission model,
so administration features are only reachable by users whose role allows them —
the check is enforced server side, and the UI reflects it rather than defining
it.

**Human takeover.** Beyond browsing conversation history, the panel includes a
live inbox where a human agent can step into an ongoing conversation. The bot
cedes control when it escalates — the RAG service signals this explicitly in its
response contract — so the handoff is part of the system's design rather than
something bolted on.

## Running locally

Requirements: Node.js and the Angular CLI.

```bash
npm install
npm start
```

The app runs at `http://localhost:4200` and expects the backend at
`http://localhost:8080/app`.

Tests:

```bash
npm test
```

## Configuration

Environment values live in `src/environments/`:

| Key | Description |
|-----|-------------|
| `api` | Backend base URL |
| `widgetUrl` | Public URL of the embeddable chat widget, used in the install snippet shown to clients |
| `session.inactivityTimeoutMs` | Time before an idle session is closed |
| `session.inactivityWarningMs` | How long before closing the user is warned |
| `session.activityDebounceMs` | Debounce applied to activity detection |


## Notes

This panel was part of a larger platform I later stepped back from. The live
inbox is the clearest example of why: building agent handoff, conversation
assignment and a full admin layer took months, and it is precisely what tools
like Chatwoot already do well. The functionality works — it just was not the
part of the product worth building myself. Recognizing that led me to redesign
around a leaner architecture, which became Zolvion, where Chatwoot handles the
inbox and I build what is actually specific to my product.