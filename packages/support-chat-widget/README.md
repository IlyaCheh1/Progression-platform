# OG Chat Widget

A customizable chat widget that can be embedded into any website to provide real-time customer support.

## Quick Start

### 1. Include the Script

Add the chat widget script to your HTML page. You can choose between two versions:

#### ES Module Version (Recommended)

```html
<script
  src="https://cdn.onlygames.ru/og-chat.js"
  defer
  type="module"
  data-hid="og-chat-widget"
></script>
```

#### UMD Version

```html
<script src="https://cdn.onlygames.ru/og-chat-umd.cjs" defer></script>
```

### 2. Initialize the Widget

After user authentication (SSO login), create and configure the chat widget:

```javascript
// Check if user is authenticated and has required data
if (!document.querySelector('og-chat') && userId && userName) {
  const chatWidget = document.createElement('og-chat');

  // Required attributes
  chatWidget.setAttribute('user-id', userId);
  chatWidget.setAttribute('user-name', userName);

  // Optional configuration
  chatWidget.setAttribute('position', 'bottom-right');
  chatWidget.setAttribute('theme', 'market');
  chatWidget.setAttribute('size-class', 'w-[342px] h-[600px]');

  // Add to page
  document.body.appendChild(chatWidget);
}
```

## Configuration

### Required Attributes

| Attribute   | Type   | Description                                  |
| ----------- | ------ | -------------------------------------------- |
| `user-id`   | string | Unique identifier for the authenticated user |
| `user-name` | string | Display name for the user in chat            |

### Optional Attributes

| Attribute    | Type   | Default               | Description                       |
| ------------ | ------ | --------------------- | --------------------------------- |
| `position`   | string | `bottom-right`        | Widget position on screen         |
| `theme`      | string | `market`              | Visual theme variant              |
| `size-class` | string | `w-[342px] h-[600px]` | CSS classes for widget dimensions |

### Theme Options

The widget supports three theme variants:

- **`market`** - Designed for marketplace/e-commerce sites
- **`news`** - Optimized for news and media websites
- **`streaming`** - Tailored for streaming and gaming platforms

### Position Options

- `bottom-right` - Fixed position in bottom-right corner
- `bottom-left` - Fixed position in bottom-left corner
- `top-right` - Fixed position in top-right corner
- `top-left` - Fixed position in top-left corner

## Implementation Examples

### Basic Implementation

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Website</title>
    <script
      src="https://cdn.onlygames.ru/og-chat.js"
      defer
      type="module"
      data-hid="og-chat-widget"
    ></script>
  </head>
  <body>
    <!-- Your website content -->

    <script>
      // After successful SSO authentication
      function initializeChat(user) {
        if (!document.querySelector('og-chat') && user.id) {
          const chatWidget = document.createElement('og-chat');
          chatWidget.setAttribute('user-id', user.id);
          chatWidget.setAttribute('user-name', user.name);
          chatWidget.setAttribute('theme', 'market');

          document.body.appendChild(chatWidget);
        }
      }

      // Call this after user login
      // initializeChat({ id: '12345', name: 'John Doe' })
    </script>
  </body>
</html>
```
