import json

path = "configuration-service/src/main/resources/openapi/configuration.json"
with open(path, "r") as f:
    data = json.load(f)

# Update CreateConfigurationRequest
props = data["components"]["schemas"]["CreateConfigurationRequest"]["properties"]
props["numberOfExaminers"] = { "type": "integer", "minimum": 1 }
props["submissionDeadline"] = { "type": "string", "format": "date-time" }
props["reviewDeadline"] = { "type": "string", "format": "date-time" }
props["reviewTemplateType"] = { "type": "string" }

# Update Configuration
config_props = data["components"]["schemas"]["Configuration"]["properties"]
config_props["reviewTemplateType"] = { "type": "string" }

with open(path, "w") as f:
    json.dump(data, f, indent=2)

