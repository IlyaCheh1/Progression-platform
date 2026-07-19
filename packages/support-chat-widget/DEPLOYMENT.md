# Live Chat Widget - Environment Variables

## Build Configuration

This widget uses environment variables during build time. Set these variables in your CI/CD pipeline:

### Required Environment Variables

| Variable            | Description          | Example                        |
| ------------------- | -------------------- | ------------------------------ |
| `VITE_API_BASE_URL` | Backend API base URL | `https://api.example.com/chat` |
| `VITE_WS_URL`       | WebSocket server URL | `wss://api.example.com/chat`   |
| `NODE_ENV`          | Build environment    | `production`                   |

## Prerequisites

- **Node.js**: v18+
- **Yarn**: v1.22+ (preferred) or npm
- **Git**: for source code management

### Production Build with Environment Variables

```bash
# Set environment variables and build
export VITE_API_BASE_URL="https://api.production.com/chat"
export VITE_WS_URL="wss://api.production.com/chat"
export NODE_ENV="production"
yarn build
```

## CDN Usage

Use the ES build for CDN distribution:

There are two versions of script - UMD and ES modules
For now lets use ES Modules version as browsers supports it well: (dist/og-chat.js)

```html
<script src="https://cdn.example.com/chat/og-chat.js"></script>
<og-chat
  position="bottom-right"
  theme="market"
  user-id="01987a8d-3484-7624-865e-238894c048de"
  user-name="cutomer"
  size-class="w-[342px] h-[600px]"
></og-chat>
```
