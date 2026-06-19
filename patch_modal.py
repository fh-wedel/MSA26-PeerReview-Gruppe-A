import re

with open('web-ui/src/components/SubmissionModal.tsx', 'r') as f:
    content = f.read()

# Replace useWorkflowPlugins call and states
content = content.replace('const { plugins, loading, error } = useWorkflowPlugins();',
'''const { types, templates, loading, error } = useWorkflowPlugins();
  const [reviewTemplateType, setReviewTemplateType] = useState<string>("INDIVIDUAL_WORK");
  const [numberOfReviewers, setNumberOfReviewers] = useState<number>(2);
  const [submissionDeadline, setSubmissionDeadline] = useState<Date>(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));
  const [reviewDeadline, setReviewDeadline] = useState<Date>(new Date(Date.now() + 28 * 24 * 60 * 60 * 1000));''')

# Replace onSubmit type
content = content.replace('''  onSubmit: (
    title: string,
    reviewType: string,
    authorIds: string[],
  ) => Promise<void>;''',
'''  onSubmit: (
    title: string,
    reviewType: string,
    authorIds: string[],
    reviewTemplateType: string,
    numberOfReviewers: number,
    submissionDeadline: Date,
    reviewDeadline: Date
  ) => Promise<void>;''')

# Remove validation block
content = re.sub(r'const selectedPlugin = plugins\.find\(p => p\.name === reviewType\);.*?if \(selectedPlugin && authorIds\.length !== selectedPlugin\.numberOfAuthors\) \{.*?return;\s*\}', 
    '// User defines authors directly now\n        const isAuthorsEnabled = isAdminOrOfficer || true;', content, flags=re.DOTALL)

# Update onSubmit call
content = content.replace('await onSubmit(title, reviewType, authorIds);',
    'await onSubmit(title, reviewType, authorIds, reviewTemplateType, numberOfReviewers, submissionDeadline, reviewDeadline);')

# Fix isAuthorsEnabled inside the return
content = content.replace('const selectedPlugin = plugins.find(p => p.name === reviewType);\n                  const isAuthorsEnabled = isAdminOrOfficer || (selectedPlugin && selectedPlugin.numberOfAuthors > 1);',
    'const isAuthorsEnabled = true;')

# Remove helper text about expected authors
content = content.replace('helperText={validationError || (isAuthorsEnabled ? `Expected number of authors: ${selectedPlugin?.numberOfAuthors || 1}` : "")}',
    'helperText={validationError || "Select one or more authors"}')

# Update Select for types and templates
content = content.replace('plugins.length > 0 ? (', 'types.length > 0 ? (')
content = content.replace('plugins.map((plugin)', 'types.map((plugin)')

content = re.sub(r'\{plugins\.length > 0 && \(\s*<Box sx=\{\{mt: 1, p: 2, bgcolor: "background\.default", borderRadius: 1\}\}>.*?</Box>\s*\)\}',
r'''
            <FormControl fullWidth>
                <InputLabel id="review-template-label">Review Template</InputLabel>
              <Select
                  labelId="review-template-label"
                  value={reviewTemplateType}
                  label="Review Template"
                  onChange={(e) => setReviewTemplateType(e.target.value as string)}
                disabled={loading || submitting}
              >
                {templates.length > 0 ? (
                  templates.map((template) => (
                    <MenuItem key={template.name} value={template.name || ""}>
                      {template.title}
                    </MenuItem>
                  ))
                ) : (
                  <>
                    <MenuItem value="INDIVIDUAL_WORK">Individual Work</MenuItem>
                  </>
                )}
              </Select>
            </FormControl>

            <TextField
              label="Number of Reviewers"
              type="number"
              variant="outlined"
              fullWidth
              value={numberOfReviewers}
              onChange={(e) => setNumberOfReviewers(parseInt(e.target.value) || 0)}
              disabled={submitting}
              inputProps={{ min: 1 }}
            />
            
            <TextField
              label="Submission Deadline"
              type="date"
              variant="outlined"
              fullWidth
              value={submissionDeadline.toISOString().split('T')[0]}
              onChange={(e) => setSubmissionDeadline(new Date(e.target.value))}
              disabled={submitting}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Review Deadline"
              type="date"
              variant="outlined"
              fullWidth
              value={reviewDeadline.toISOString().split('T')[0]}
              onChange={(e) => setReviewDeadline(new Date(e.target.value))}
              disabled={submitting}
              InputLabelProps={{ shrink: true }}
            />
''', content, flags=re.DOTALL)

with open('web-ui/src/components/SubmissionModal.tsx', 'w') as f:
    f.write(content)
