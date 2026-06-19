import os
import re

files = [
    "workflow-core/src/main/java/com/fh_wedel/workflow/service/MatchingServiceClient.java",
    "workflow-core/src/main/java/com/fh_wedel/workflow/service/WorkflowService.java",
    "workflow-core/src/main/java/com/fh_wedel/workflow/plugin/ReviewTemplateRegistry.java",
    "workflow-core/src/main/java/com/fh_wedel/workflow/plugin/ReviewTypeRegistry.java",
    "workflow-core/src/main/java/com/fh_wedel/workflow/controller/SqsRequestListener.java",
    "workflow-core/src/main/java/com/fh_wedel/workflow/controller/WorkflowController.java",
    "workflow-core/src/main/java/com/fh_wedel/workflow/model/SubmissionReadyEvent.java",
    "workflow-core/src/main/java/com/fh_wedel/workflow/model/SubmittedReview.java",
    "workflow-core/src/main/java/com/fh_wedel/workflow/model/ReviewSession.java",
    "workflow-core/src/main/java/com/fh_wedel/workflow/WorkflowApplication.java"
]

for file_path in files:
    if not os.path.exists(file_path): continue
    with open(file_path, "r") as f:
        content = f.read()

    # Find class name
    class_match = re.search(r"public\s+class\s+(\w+)", content)
    if not class_match: continue
    class_name = class_match.group(1)

    has_slf4j = "@Slf4j" in content
    has_req_args = "@RequiredArgsConstructor" in content
    has_all_args = "@AllArgsConstructor" in content
    has_no_args = "@NoArgsConstructor" in content
    has_class_getter = "@Getter" in content and ("@Getter\npublic class" in content or "@Getter\n@Setter" in content or "@Getter\n@" in content)
    has_class_setter = "@Setter" in content and ("@Setter\npublic class" in content or "@Setter\n@" in content)

    # remove lombok imports
    content = re.sub(r"import\s+lombok\..*;\n", "", content)
    
    # remove class level annotations
    content = re.sub(r"@Slf4j\s*\n", "", content)
    content = re.sub(r"@RequiredArgsConstructor\s*\n", "", content)
    content = re.sub(r"@AllArgsConstructor\s*\n", "", content)
    content = re.sub(r"@NoArgsConstructor\s*\n", "", content)
    if has_class_getter: content = re.sub(r"@Getter\s*\n", "", content, count=1)
    if has_class_setter: content = re.sub(r"@Setter\s*\n", "", content, count=1)

    # remove field level annotations
    content = re.sub(r"@Getter\s*\n", "", content)
    content = re.sub(r"@Setter\s*\n", "", content)

    # parse fields
    fields = re.findall(r"private\s+(?:final\s+)?([\w<>,\s]+)\s+(\w+)\s*;", content)
    req_fields = re.findall(r"private\s+final\s+([\w<>,\s]+)\s+(\w+)\s*;", content)
    non_static_fields = []
    for type_name, field_name in fields:
        if "static" not in type_name:
            non_static_fields.append((type_name.strip(), field_name.strip()))
    
    req_static_fields = []
    for type_name, field_name in req_fields:
        if "static" not in type_name:
            req_static_fields.append((type_name.strip(), field_name.strip()))

    insert_code = ""
    
    if has_slf4j:
        insert_code += f"    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger({class_name}.class);\n\n"

    if has_no_args:
        insert_code += f"    public {class_name}() {{}}\n\n"

    if has_req_args and req_static_fields:
        params = ", ".join([f"{t} {n}" for t, n in req_static_fields])
        assigns = "\n".join([f"        this.{n} = {n};" for t, n in req_static_fields])
        insert_code += f"    public {class_name}({params}) {{\n{assigns}\n    }}\n\n"

    if has_all_args and non_static_fields:
        params = ", ".join([f"{t} {n}" for t, n in non_static_fields])
        assigns = "\n".join([f"        this.{n} = {n};" for t, n in non_static_fields])
        insert_code += f"    public {class_name}({params}) {{\n{assigns}\n    }}\n\n"

    if class_name in ["ReviewSession", "SubmittedReview", "SubmissionReadyEvent"]:
        for t, n in non_static_fields:
            cap_n = n[0].upper() + n[1:]
            if not "boolean" in t.lower() and not "is" in n:
                insert_code += f"    public {t} get{cap_n}() {{ return {n}; }}\n"
            else:
                insert_code += f"    public {t} is{cap_n}() {{ return {n}; }}\n"
            insert_code += f"    public void set{cap_n}({t} {n}) {{ this.{n} = {n}; }}\n\n"

    # insert into class
    if insert_code:
        # find the start of the class body
        class_body_start = content.find("{", content.find(f"class {class_name}")) + 1
        content = content[:class_body_start] + "\n" + insert_code + content[class_body_start:]

    with open(file_path, "w") as f:
        f.write(content)
