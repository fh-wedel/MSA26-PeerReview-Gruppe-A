import re

# 1. SubmissionModal.tsx
with open('web-ui/src/components/SubmissionModal.tsx', 'r') as f:
    content = f.read()

content = content.replace(
'''// User defines authors directly now
        const isAuthorsEnabled = isAdminOrOfficer || true;

        await onSubmit(title, reviewType, authorIds, reviewTemplateType, numberOfReviewers, submissionDeadline, reviewDeadline);''',
'''const authorIds = selectedAuthors.map(u => u.id);
        await onSubmit(title, reviewType, authorIds, reviewTemplateType, numberOfReviewers, submissionDeadline, reviewDeadline);''')

content = content.replace('inputProps={{ min: 1 }}', 'slotProps={{ htmlInput: { min: 1 } }}')
content = content.replace('InputLabelProps={{ shrink: true }}', 'slotProps={{ inputLabel: { shrink: true } }}')

with open('web-ui/src/components/SubmissionModal.tsx', 'w') as f:
    f.write(content)


# 2. Assignments.tsx
with open('web-ui/src/pages/Assignments.tsx', 'r') as f:
    content = f.read()
content = content.replace('const {plugins} = useWorkflowPlugins();', 'const {types} = useWorkflowPlugins();')
content = content.replace('const plugin = plugins.find(p => p.name === assignment.reviewProcessType);', 'const plugin = types.find(p => p.name === assignment.reviewProcessType);')
with open('web-ui/src/pages/Assignments.tsx', 'w') as f:
    f.write(content)


# 3. SubmissionDetails.tsx
with open('web-ui/src/pages/SubmissionDetails.tsx', 'r') as f:
    content = f.read()
content = content.replace('const {plugins} = useWorkflowPlugins();', 'const {types} = useWorkflowPlugins();')
content = content.replace('plugins.find(p => p.name === reviewType)', 'types.find(p => p.name === reviewType)')
with open('web-ui/src/pages/SubmissionDetails.tsx', 'w') as f:
    f.write(content)


# 4. Submissions.tsx
with open('web-ui/src/pages/Submissions.tsx', 'r') as f:
    content = f.read()
content = content.replace('const {plugins} = useWorkflowPlugins();', 'const {types} = useWorkflowPlugins();')
content = content.replace('const plugin = plugins.find(p => p.name === submission.reviewProcessType);', 'const plugin = types.find(p => p.name === submission.reviewProcessType);')
with open('web-ui/src/pages/Submissions.tsx', 'w') as f:
    f.write(content)

