# Page-level Learnings

- **Submission details action buttons:** On `SubmissionDetails.tsx`, outlined secondary actions are too low-contrast in dark mode. Use `contained` in dark mode and `outlined` in light mode for the back/PDF buttons.
- **Document vs. review availability:** The uploaded PDF action is independent from review availability. Keep document metadata (`documentName`/`documentUrl`) separate from `review` state so one button can be enabled without the other.
- **Dynamic Plugin Rules:** The visibility of author/reviewer names and the availability of the chat feature in `SubmissionDetails.tsx` are dynamically controlled by the rules of the selected workflow plugin (`authorAnonymous`, `reviewerAnonymous`, `authorReviewerChatAllowed`), rather than hardcoded logic.
- **Submission UI state vs backend:** A submission may be "MATCHED" by the matching service, but not yet "SUBMITTED" in
  the submission service. UI components like `Assignments.tsx` and `Submissions.tsx` must explicitly fetch
  `submissionApiClient.submissions.getSubmission(id)` to correctly determine if the document has actually been uploaded.
- **Status rendering priority:** The submission service's status (e.g. `WAITING_FOR_SUBMISSION`, `SUBMITTED`) represents
  a further progressed state in the event-driven workflow than the matching service's status (`MATCHED`). UI elements
  must prioritize displaying the submission service's status over the matching service's status.
