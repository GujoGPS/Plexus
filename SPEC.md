# SPEC.md - Google Workspace Productivity Hub

## 1. Project Overview

**Project Name:** WorkspaceHub  
**Type:** Single Page Application (SPA)  
**Core Functionality:** Productivity application integrating Google Calendar, Notes, and To-Do with persistence via Google Drive (appDataFolder)  
**Target Users:** Professionals and teams using Google Workspace

---

## 2. Technical Architecture

### Stack
- **Framework:** React 18 + TypeScript + Vite
- **UI Library:** Material UI (MUI) v5
- **Calendar:** FullCalendar v6
- **State Management:** Zustand
- **Google APIs:** Google Identity Services (GIS) + Google APIs Client

### Module Structure
```
src/
├── modules/
│   ├── auth/           # OAuth2 authentication
│   ├── drive/         # Google Drive persistence
│   ├── calendar/      # Google Calendar integration
│   └── ui/            # React components
├── services/          # Business logic
├── stores/           # Zustand stores
├── types/            # TypeScript interfaces
└── utils/            # Helpers
```

---

## 3. UI/UX Specification

### Layout Structure
- **Sidebar (240px fixed):** Navigation menu with icons
- **Main Content:** Dashboard with responsive grid widgets
- **Header:** App title + user profile + sync status

### Color Palette
- **Primary:** #1a73e8 (Google Blue)
- **Secondary:** #34a853 (Google Green)
- **Background:** #f8f9fa (Light gray)
- **Surface:** #ffffff (White)
- **Text Primary:** #202124
- **Text Secondary:** #5f6368
- **Error:** #ea4335 (Google Red)
- **Warning:** #fbbc04 (Google Yellow)

### Typography
- **Font Family:** "Roboto", "Google Sans", system-ui
- **Headings:** 600 weight
- **Body:** 400 weight

### Responsive Breakpoints
- **Mobile:** < 600px (sidebar collapses to drawer)
- **Tablet:** 600px - 960px
- **Desktop:** > 960px

### Components
1. **Sidebar Navigation**
   - Calendar icon → Calendar view
   - Checkbox icon → To-Do list
   - Note icon → Notes
   - History icon → History/Time Travel

2. **Calendar Widget**
   - FullCalendar month/week/day views
   - Multi-calendar support (color-coded)
   - Event creation modal

3. **To-Do Widget**
   - Task list with checkboxes
   - Priority indicators (High/Medium/Low)
   - Due date picker
   - "Completed" tab for archived tasks

4. **Notes Widget**
   - Rich text editor (basic formatting)
   - Note list sidebar
   - Last modified timestamp

5. **History Panel**
   - Timeline of changes
   - Restore button per entry
   - Filter by type (notes/tasks)

---

## 4. Functionality Specification

### Authentication (OAuth2)
- Google Identity Services (Token Model)
- Scopes required:
  - `https://www.googleapis.com/auth/calendar`
  - `https://www.googleapis.com/auth/drive.appdata`
- Silent token refresh
- Logout functionality

### Google Calendar Integration
- Fetch user's calendar list
- Fetch events from selected calendars
- Display in FullCalendar grid
- Create/update/delete events (optional v1)

### Drive Persistence (appDataFolder)

**tasks.json schema:**
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "string",
      "completed": false,
      "priority": "high|medium|low",
      "dueDate": "ISO8601|null",
      "createdAt": "ISO8601",
      "updatedAt": "ISO8601"
    }
  ]
}
```

**notes.json schema:**
```json
{
  "notes": [
    {
      "id": "uuid",
      "title": "string",
      "content": "string",
      "createdAt": "ISO8601",
      "updatedAt": "ISO8601"
    }
  ]
}
```

**history_log.json schema:**
```json
{
  "history": [
    {
      "id": "uuid",
      "type": "note|task",
      "action": "create|update|delete|restore",
      "entityId": "uuid",
      "data": {},
      "timestamp": "ISO8601"
    }
  ]
}
```

### History & Time Travel
- Log every CRUD operation
- Notes: Full content snapshot per change
- Tasks: State snapshot per change
- Restore: Replace current with historical version
- Completed tasks moved to "Archived" tab

### Error Handling
- Connection failures: Show toast with retry option
- Auth errors: Redirect to login
- File not found: Create with defaults
- Rate limiting: Queue requests with backoff

---

## 5. Google Cloud Console Setup

### Required APIs
1. **Google Calendar API** - `calendar.googleapis.com`
2. **Google Drive API** - `drive.googleapis.com`

### OAuth Consent Screen
1. User Type: External
2. Scopes to add:
   - `.../auth/calendar`
   - `.../auth/drive.appdata`
3. Test users: Add email for development

### Credentials
1. Create OAuth 2.0 Client ID
2. Application type: Web application
3. Authorized redirect URIs: `http://localhost:5173`
4. Copy Client ID to `.env`

---

## 6. Acceptance Criteria

- [ ] User can sign in with Google
- [ ] User can view multiple calendars in grid
- [ ] Tasks persist to Drive and reload on refresh
- [ ] Notes persist to Drive and reload on refresh
- [ ] History log records all changes
- [ ] Time Travel restores note versions
- [ ] Completed tasks appear in archived tab
- [ ] Error toasts appear on Drive failures
- [ ] Responsive layout works on mobile