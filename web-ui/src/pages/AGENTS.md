# Page-level Learnings

- **Submission details action buttons:** On `SubmissionDetails.tsx`, outlined secondary actions are too low-contrast in dark mode. Use `contained` in dark mode and `outlined` in light mode for the back/PDF buttons.
- **Document vs. review availability:** The uploaded PDF action is independent from review availability. Keep document metadata (`documentName`/`documentUrl`) separate from `review` state so one button can be enabled without the other.
- **Dynamic Plugin Rules:** The visibility of author/reviewer names and the availability of the chat feature in `SubmissionDetails.tsx` are dynamically controlled by the rules of the selected workflow plugin (`authorAnonymous`, `reviewerAnonymous`, `authorReviewerChatAllowed`), rather than hardcoded logic.
