# Components Learnings

- **Navbar unread counters vs. list window:** Dropdowns render only the 5 latest items (sorted newest-first), but badge counts are computed from the full `messages`/`notifications` state.
- **Message→chat linking contract:** `src/stubs/messages.ts` `threadId` values must match `src/stubs/chats.ts` thread IDs; otherwise clicking a dropdown message cannot open the intended conversation.
- **Chat identity flow:** `ChatModal` must receive `currentUserId` and `users` via props from `Navbar`/`AuthContext`; importing mock users directly in the modal breaks current-user exclusion and future backend wiring.
- **Formatting persistence path:** Message style toggles are persisted through `ChatMessage.format` (`src/stubs/chats.ts`), passed from `ChatModal` to `Navbar.handleSendMessage`; update both ends together when changing formatting behavior.
