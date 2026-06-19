import os

test_file = "workflow-core/src/test/java/com/fh_wedel/workflow/controller/WorkflowControllerTest.java"
with open(test_file, "r") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "setNumberOfReviewers(" in line or "setNumberOfAuthors(" in line or "setFeedbackFormTemplate(" in line:
        continue
    new_lines.append(line)

with open(test_file, "w") as f:
    f.writelines(new_lines)
