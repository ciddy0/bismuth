# bismuth backend API documentation

**pages API**

overview

the pages API allows you to create, read, update, and delete pages in your bismuth application. each page has a unique ID, title, optional icon and cover image, and can be nested under parent pages.

**data models**

page

```typescript
interface Page {
  id: string; // UUID v4
  title: string;
  icon: string | null;
  cover: string | null;
  parent_id: string | null; // ID of parent page (for nesting)
  is_archived: boolean;
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
}
```

---

**commands**

**create page**

creates a new page with the given title.

command: `create_page`

parameters:

```typescript
{
  title: string;
}
```

returns: `Page`

example:

```typescript
import { invoke } from "@tauri-apps/api/core";

const page = await invoke<Page>("create_page", {
  title: "My New Page",
});
```

**error**: returns error string if database operation fails.

---

**get page**

retrieves a single page by its ID.

**command**: `get_page`

**parameters**:

```typescript
{
  pageId: string;
}
```

**returns**: `Page`
**example**:

```typescript
const page = await invoke<Page>("get_page", {
  pageId: "uuid-here",
});
```

**errors**:

- database error if query fails
- "page not found" if page doesn't exist

---

**list pages**

retrieves all pages in the database.

**command**: `list_pages`

**parameters**: none

**returns**: `Page[]`

**example**:

```typescript
const pages = await invoke<Page[]>("list_pages");
```

**error**: returns error string if database operation fails.

---

**update page title**

updates the title of an existing page.

**command**: `update_page_title`

**parameters**:

```typescript
{
  pageId: string,
  title: string
}
```

**returns**: `Page` (updated page)

**example**:

```typescript
const updatedPage = await invoke<Page>("update_page_title", {
  pageId: "uuid-here",
  title: "Updated Title",
});
```

**errors**:

- update error if operation fails
- "page not found" if page doesn't exist

---

**update page icon**

updates the icon of an existing page.

**command**: `update_page_icon`

**parameters**:

```typescript
{
  pageId: string,
  icon: string
}
```

**returns**: `Page` (updated page)

**example**:

```typescript
const updatedPage = await invoke<Page>("update_page_icon", {
  pageId: "uuid-here",
  icon: "📄",
});
```

**errors**:

- "failed to update icon" if fails
- "page not found" if page doesn't exist

---

**update page cover**

updates the cover image of an existing page.

**command**: `update_page_cover`

**parameters**:

```typescript
{
  pageId: string,
  cover: string  // url or path to cover image
}
```

**returns**: `Page` (updated page)

**example**:

```typescript
const updatedPage = await invoke<Page>("update_page_cover", {
  pageId: "uuid-here",
  cover: "https://example.com/cover.jpg",
});
```

**errors**:

- "failed to update cover" if operation fails
- "page not found" if page doesn't exist

---

**delete page**

deletes a page by its ID.

**command**: `delete_page`

**parameters**:

```typescript
{
  pageId: string;
}
```

**returns**: `void`

**_example_**:

```typescript
await invoke("delete_page", {
  pageId: "uuid-here",
});
```

**error**: returns error string if database operation fails.

---

**error handling**

all commands return errors as strings so like you can wrap your invoke calls in try-catch blocks:

```typescript
try {
  const page = await invoke<Page>("create_page", {
    title: "My Page",
  });
  console.log("Page created:", page);
} catch (error) {
  console.error("Failed to create page:", error);
  // error will be a string like "failed to create page D: <details>"
}
```

---

**notes**

- all page IDs are UUID v4 strings
- timestamps are in UTC and ISO 8601 format
- the `parent_id` field enables hierarchical page organization, i still need to create a command ot create a nested page :C
- the `is_archived` field is present but there's no command yet sorry :c
