import os

ws_path = "workflow-core/src/main/java/com/fh_wedel/workflow/service/WorkflowService.java"
with open(ws_path, "r") as f:
    ws_content = f.read()

ws_content = ws_content.replace(
    "    public WorkflowService(ReviewTypeRegistry typeRegistry, ReviewTemplateRegistry templateRegistry, DefaultApi configurationApi) {",
    "    public WorkflowService(ReviewTypeRegistry typeRegistry, ReviewTemplateRegistry templateRegistry, DefaultApi configurationApi, com.fh_wedel.workflow.repository.ReviewRepository reviewRepository, com.fasterxml.jackson.databind.ObjectMapper objectMapper) {"
)
ws_content = ws_content.replace(
    "        this.configurationApi = configurationApi;\n    }",
    "        this.configurationApi = configurationApi;\n        this.reviewRepository = reviewRepository;\n        this.objectMapper = objectMapper;\n    }"
)
with open(ws_path, "w") as f:
    f.write(ws_content)

rs_path = "workflow-core/src/main/java/com/fh_wedel/workflow/model/ReviewSession.java"
with open(rs_path, "r") as f:
    rs_content = f.read()

rs_content = rs_content.replace("public boolean getComplete()", "public boolean isComplete()")

with open(rs_path, "w") as f:
    f.write(rs_content)

