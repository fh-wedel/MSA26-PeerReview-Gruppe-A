import os

file_path = "workflow-core/src/main/java/com/fh_wedel/workflow/controller/WorkflowController.java"
with open(file_path, "r") as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if line.strip() == "return ResponseEntity.ok(workflowService.getReviewTypeRules(typeName));":
        # Check if the previous line is @Override, if so, we need to insert the method signature
        if "@Override" in new_lines[-1]:
            new_lines.append("    public ResponseEntity<WorkflowRulesDto> getReviewTypeRules(String typeName) {\n")
    
    # Check for empty @Override which was double override
    if line.strip() == "@Override" and i+1 < len(lines) and lines[i+1].strip() == "@Override":
        continue
    
    if line.strip() == "@Override" and i+1 < len(lines) and lines[i+1].strip() == "":
        continue

    new_lines.append(line)

with open(file_path, "w") as f:
    f.writelines(new_lines)

