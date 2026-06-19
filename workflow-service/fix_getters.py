import os
import re

files = [
    "workflow-core/src/main/java/com/fh_wedel/workflow/model/SubmissionReadyEvent.java",
    "workflow-core/src/main/java/com/fh_wedel/workflow/model/SubmittedReview.java",
    "workflow-core/src/main/java/com/fh_wedel/workflow/model/ReviewSession.java"
]

for file_path in files:
    if not os.path.exists(file_path): continue
    with open(file_path, "r") as f:
        content = f.read()

    # remove @Data
    content = content.replace("@Data\n", "")

    # fix "is" getters
    content = re.sub(r"public\s+([\w<>]+)\s+is([A-Z]\w+)\s*\(\)\s*\{\s*return\s+(\w+);\s*\}", r"public \1 get\2() { return \3; }", content)

    # remove multiple getPk()
    # It might have generated multiple getPk(). Let's remove the ones that my script generated at the top
    content = re.sub(r"public\s+String\s+getPk\(\)\s*\{\s*return\s+pk;\s*\}\s*\n\s*public\s+void\s+setPk\(String\s+pk\)\s*\{\s*this\.pk\s*=\s*pk;\s*\}\s*\n", "", content)
    content = re.sub(r"public\s+String\s+getSk\(\)\s*\{\s*return\s+sk;\s*\}\s*\n\s*public\s+void\s+setSk\(String\s+sk\)\s*\{\s*this\.sk\s*=\s*sk;\s*\}\s*\n", "", content)

    with open(file_path, "w") as f:
        f.write(content)
