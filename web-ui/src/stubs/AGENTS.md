# Stubs Learnings

- **Stub coupling for messaging UI:** Keep `messages.ts` (`threadId`, `timestamp`) and `chats.ts` (`id`, message timestamps) consistent; Navbar depends on this for opening the right thread and for newest-first slicing in dropdowns.
