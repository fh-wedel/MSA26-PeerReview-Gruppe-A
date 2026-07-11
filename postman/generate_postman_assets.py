#!/usr/bin/env python3
"""Generate Postman local-files YAML assets from external OpenAPI specs."""

from __future__ import annotations

import json
import re
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Any


METHOD_ORDER = ["get", "post", "put", "patch", "delete", "options", "head"]
SERVICE_SPECS: list[tuple[str, str]] = [
    ("User Service", "userService/src/main/resources/openapi/user.json"),
    ("Response Service", "responseService/src/main/resources/openapi/response.json"),
    ("Submission Service", "submission-service/src/main/resources/openapi/submission.json"),
    ("Matching Service", "matchingService/src/main/resources/openapi/matching.json"),
    ("Communication Service", "communicationService/src/main/resources/openapi/communication.json"),
    ("Notification Service", "notificationService/src/main/resources/openapi/notification.json"),
    (
        "Configuration Service",
        "configuration-service/configuration-core/src/main/resources/openapi/configuration.json",
    ),
]
PLACEHOLDER_DEFAULTS: list[tuple[str, str]] = [
    ("ClientId", ""),
    ("base_url", "https://www.msa26-peer-review.fh-wedel.dev"),
    ("access_token", ""),
    ("id_token", ""),
    ("refresh_token", ""),
    ("token_expires_at", ""),
    ("current_user_sub", ""),
    ("sub", "00000000-0000-4000-8000-000000000000"),
    ("current_username", ""),
    ("username", "sample-user"),
    ("current_user_groups", ""),
    ("submissionId", "submission-123"),
    ("documentId", "document-123"),
    ("chatId", "chat-123"),
    ("groupName", "Reviewer"),
    ("tagName", "SampleTag"),
    ("typeName", "SIMPLE"),
    ("templateName", "default-template"),
    ("notificationId", "notification-123"),
    ("authorId", "00000000-0000-4000-8000-000000000000"),
    ("recipientId", "00000000-0000-4000-8000-000000000000"),
    ("nextToken", ""),
    ("limit", "50"),
]
SAMPLE_BY_NAME: dict[str, str] = {
    "id": "00000000-0000-4000-8000-000000000000",
    "submissionid": "{{submissionId}}",
    "documentid": "{{documentId}}",
    "chatid": "{{chatId}}",
    "groupname": "{{groupName}}",
    "username": "{{username}}",
    "sub": "{{sub}}",
    "tagname": "{{tagName}}",
    "typename": "{{typeName}}",
    "templatename": "{{templateName}}",
    "notificationid": "{{notificationId}}",
    "authorid": "{{authorId}}",
    "recipientid": "{{recipientId}}",
    "nexttoken": "{{nextToken}}",
    "limit": "{{limit}}",
}
TOKEN_AUTH_ID = "031c2224-4445-4501-934a-b91723d88727"
COLLECTION_NAME = "PeerReview External APIs"


@dataclass
class QueryParam:
    key: str
    value: str
    disabled: bool
    description: str


@dataclass
class RequestSpec:
    name: str
    description: str
    url: str
    method: str
    order: int
    headers: dict[str, str]
    query_params: list[QueryParam]
    body_json: str | None
    auth_noauth: bool
    script: str | None


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def single_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def write_text(path: Path, lines: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_multiline(lines: list[str], key: str, value: str, indent: int) -> None:
    pad = " " * indent
    lines.append(f"{pad}{key}: |-")
    for row in value.splitlines():
        lines.append(f"{pad}  {row}")


def deref(schema: dict[str, Any], components: dict[str, Any]) -> dict[str, Any]:
    ref = schema.get("$ref")
    if not isinstance(ref, str):
        return schema
    if not ref.startswith("#/components/schemas/"):
        return schema
    schema_name = ref.split("/")[-1]
    return components.get("schemas", {}).get(schema_name, schema)


def example_string(name: str, schema: dict[str, Any]) -> str:
    if isinstance(schema.get("example"), str):
        return schema["example"]
    enum = schema.get("enum")
    if isinstance(enum, list) and enum:
        return str(enum[0])

    lowered = name.lower()
    if lowered in SAMPLE_BY_NAME:
        return SAMPLE_BY_NAME[lowered]

    if schema.get("format") == "date-time":
        return "2026-01-01T00:00:00Z"
    if schema.get("format") == "date":
        return "2026-01-01"
    if schema.get("format") == "uuid":
        return "00000000-0000-4000-8000-000000000000"
    if lowered.endswith("id"):
        return "00000000-0000-4000-8000-000000000000"
    if lowered in {"email", "mail"}:
        return "user@example.com"

    return f"sample-{name or 'value'}"


def schema_example(
    schema: dict[str, Any],
    components: dict[str, Any],
    prop_name: str = "",
    depth: int = 0,
) -> Any:
    if depth > 5:
        return None

    resolved = deref(schema, components)
    if "example" in resolved:
        return resolved["example"]
    if "default" in resolved:
        return resolved["default"]

    enum = resolved.get("enum")
    if isinstance(enum, list) and enum:
        return enum[0]

    for option_key in ("oneOf", "anyOf"):
        option_values = resolved.get(option_key)
        if isinstance(option_values, list) and option_values:
            return schema_example(option_values[0], components, prop_name, depth + 1)

    all_of = resolved.get("allOf")
    if isinstance(all_of, list) and all_of:
        merged: dict[str, Any] = {}
        for part in all_of:
            part_value = schema_example(part, components, prop_name, depth + 1)
            if isinstance(part_value, dict):
                merged.update(part_value)
        if merged:
            return merged
        return schema_example(all_of[0], components, prop_name, depth + 1)

    schema_type = resolved.get("type")
    if schema_type == "object" or (schema_type is None and "properties" in resolved):
        result: dict[str, Any] = {}
        properties = resolved.get("properties", {})
        required = set(resolved.get("required", []))
        names = sorted(properties.keys(), key=lambda value: (value not in required, value))
        for name in names:
            sub_value = schema_example(properties[name], components, name, depth + 1)
            if sub_value is not None:
                result[name] = sub_value
        return result
    if schema_type == "array":
        item_schema = resolved.get("items", {})
        return [schema_example(item_schema, components, prop_name, depth + 1)]
    if schema_type == "integer":
        return 1
    if schema_type == "number":
        return 1.0
    if schema_type == "boolean":
        return True
    if schema_type == "string" or schema_type is None:
        return example_string(prop_name, resolved)

    return None


def sanitize_filename(name: str) -> str:
    normalized = re.sub(r"[\\/:*?\"<>|]", " ", name)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    normalized = normalized.rstrip(".")
    if not normalized:
        normalized = "request"
    if len(normalized) > 90:
        normalized = normalized[:90].rstrip()
    return normalized


def operation_description(operation: dict[str, Any], is_sse: bool, is_download_hint: bool) -> str:
    parts: list[str] = []
    summary = operation.get("summary")
    if isinstance(summary, str) and summary.strip():
        parts.append(f"Summary: {summary.strip()}")

    description = operation.get("description")
    if isinstance(description, str) and description.strip():
        parts.append(description.strip())

    operation_id = operation.get("operationId")
    if isinstance(operation_id, str) and operation_id.strip():
        parts.append(f"operationId: {operation_id.strip()}")

    if is_sse:
        parts.append(
            "Note: This endpoint uses Server-Sent Events (streaming). In Postman, keep the request open to receive events."
        )
    if is_download_hint:
        parts.append(
            "Note: This endpoint returns a download URL or binary response. Use the returned URL in a browser or a follow-up request."
        )

    return "\n\n".join(parts)


def normalized_base_path(spec: dict[str, Any]) -> str:
    servers = spec.get("servers")
    if not isinstance(servers, list) or not servers:
        return ""
    first = servers[0]
    if not isinstance(first, dict):
        return ""
    raw_url = str(first.get("url", "")).strip()
    if not raw_url:
        return ""
    if raw_url.startswith("http://") or raw_url.startswith("https://"):
        try:
            after_scheme = raw_url.split("//", 1)[1]
            slash_index = after_scheme.find("/")
            raw_url = "" if slash_index < 0 else after_scheme[slash_index:]
        except IndexError:
            raw_url = ""
    if not raw_url:
        return ""
    if not raw_url.startswith("/"):
        raw_url = "/" + raw_url
    return raw_url.rstrip("/")


def parameter_key(parameter: dict[str, Any]) -> str:
    return f"{parameter.get('in','')}::{parameter.get('name','')}"


def merged_parameters(path_item: dict[str, Any], operation: dict[str, Any]) -> list[dict[str, Any]]:
    merged: dict[str, dict[str, Any]] = {}
    for raw in path_item.get("parameters", []):
        if isinstance(raw, dict):
            merged[parameter_key(raw)] = raw
    for raw in operation.get("parameters", []):
        if isinstance(raw, dict):
            merged[parameter_key(raw)] = raw
    return list(merged.values())


def request_for_operation(
    base_path: str,
    path_template: str,
    method: str,
    path_item: dict[str, Any],
    operation: dict[str, Any],
    components: dict[str, Any],
    request_order: int,
) -> RequestSpec:
    operation_name = operation.get("summary")
    if not isinstance(operation_name, str) or not operation_name.strip():
        operation_name = f"{method.upper()} {path_template}"
    operation_name = operation_name.strip()

    path_with_vars = re.sub(r"\{([^{}]+)\}", r"{{\1}}", path_template)
    url = f"{{{{base_url}}}}{base_path}{path_with_vars}"

    query_params: list[QueryParam] = []
    for parameter in merged_parameters(path_item, operation):
        if parameter.get("in") != "query":
            continue
        key = str(parameter.get("name", "param"))
        query_params.append(
            QueryParam(
                key=key,
                value=f"{{{{{key}}}}}",
                disabled=not bool(parameter.get("required", False)),
                description=str(parameter.get("description", "")).strip(),
            )
        )

    request_body = operation.get("requestBody", {})
    content = request_body.get("content", {}) if isinstance(request_body, dict) else {}
    body_schema: dict[str, Any] | None = None
    if isinstance(content, dict) and content:
        if "application/json" in content and isinstance(content["application/json"], dict):
            body_schema = content["application/json"].get("schema", {})
        else:
            first_content = next(iter(content.values()))
            if isinstance(first_content, dict):
                body_schema = first_content.get("schema", {})

    body_json = None
    headers: dict[str, str] = {}
    if body_schema is not None:
        headers["Content-Type"] = "application/json"
        body_example = schema_example(body_schema, components)
        if body_example is None:
            body_example = {}
        body_json = json.dumps(body_example, indent=2, ensure_ascii=True)

    responses = operation.get("responses", {})
    is_sse = False
    is_download_hint = "download" in path_template.lower() or "document" in path_template.lower()
    if isinstance(responses, dict):
        for response in responses.values():
            if not isinstance(response, dict):
                continue
            response_content = response.get("content", {})
            if not isinstance(response_content, dict):
                continue
            if "text/event-stream" in response_content:
                is_sse = True
            if "application/octet-stream" in response_content:
                is_download_hint = True

    return RequestSpec(
        name=operation_name,
        description=operation_description(operation, is_sse, is_download_hint),
        url=url,
        method=method.upper(),
        order=request_order,
        headers=headers,
        query_params=query_params,
        body_json=body_json,
        auth_noauth=False,
        script=None,
    )


def render_request_yaml(request: RequestSpec) -> str:
    lines: list[str] = ["$kind: http-request"]
    if request.name:
        lines.append(f"name: {single_quote(request.name)}")

    if "\n" in request.description:
        write_multiline(lines, "description", request.description, indent=0)
    elif request.description:
        lines.append(f"description: {single_quote(request.description)}")

    lines.append(f"url: {single_quote(request.url)}")
    lines.append(f"method: {request.method}")

    if request.headers:
        lines.append("headers:")
        for key, value in request.headers.items():
            lines.append(f"  {key}: {single_quote(value)}")

    if request.query_params:
        lines.append("queryParams:")
        for param in request.query_params:
            lines.append("  - key: " + single_quote(param.key))
            lines.append("    value: " + single_quote(param.value))
            lines.append("    disabled: " + ("true" if param.disabled else "false"))
            if param.description:
                lines.append("    description: " + single_quote(param.description))

    if request.body_json is not None:
        lines.append("body:")
        lines.append("  type: json")
        write_multiline(lines, "content", request.body_json, indent=2)

    if request.auth_noauth:
        lines.append("auth:")
        lines.append("  type: noauth")

    if request.script is not None:
        lines.append("scripts:")
        lines.append("  - type: afterResponse")
        write_multiline(lines, "code", request.script, indent=4)
        lines.append("    language: text/javascript")

    lines.append(f"order: {request.order}")
    return "\n".join(lines) + "\n"


def render_collection_definition_yaml() -> str:
    return "\n".join(
        [
            "$kind: collection",
            "description: Manual API testing collection generated from external OpenAPI specs.",
            "auth:",
            f"  - id: {TOKEN_AUTH_ID}",
            "    type: bearer",
            "    name: bearer auth",
            "    credentials:",
            "      token: \"{{access_token}}\"",
            "",
        ]
    )


def render_folder_definition_yaml(description: str, order: int) -> str:
    return "\n".join(
        [
            "$kind: collection",
            f"description: {single_quote(description)}",
            f"order: {order}",
            "",
        ]
    )


def auth_login_request() -> RequestSpec:
    body = json.dumps(
        {
            "AuthFlow": "USER_PASSWORD_AUTH",
            "ClientId": "{{ClientId}}",
            "AuthParameters": {
                "USERNAME": "{{vault:AWS_Cognito_User}}",
                "PASSWORD": "{{vault:AWS_Cognito_Password}}",
            },
        },
        indent=2,
        ensure_ascii=True,
    )
    script = """
function decodeJwtPayload(token) {
  if (!token || token.split('.').length < 2) {
    return null;
  }
  const payloadPart = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = payloadPart + '='.repeat((4 - (payloadPart.length % 4)) % 4);
  const decoded = atob(padded);
  const uriEncoded = decoded.split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join('');
  return JSON.parse(decodeURIComponent(uriEncoded));
}

const data = pm.response.json();
const authResult = data.AuthenticationResult || {};

if (authResult.AccessToken) {
  pm.environment.set('access_token', authResult.AccessToken);
}
if (authResult.IdToken) {
  pm.environment.set('id_token', authResult.IdToken);
}
if (authResult.RefreshToken) {
  pm.environment.set('refresh_token', authResult.RefreshToken);
}
if (authResult.ExpiresIn) {
  const expiresAt = new Date(Date.now() + (Number(authResult.ExpiresIn) * 1000)).toISOString();
  pm.environment.set('token_expires_at', expiresAt);
}

const tokenForClaims = authResult.IdToken || authResult.AccessToken;
const claims = decodeJwtPayload(tokenForClaims);
if (claims) {
  if (claims.sub) {
    pm.environment.set('current_user_sub', claims.sub);
    pm.environment.set('sub', claims.sub);
  }
  const username = claims['cognito:username'] || claims.username || '';
  pm.environment.set('current_username', username);
  pm.environment.set('username', username);

  const groups = claims['cognito:groups'];
  if (Array.isArray(groups)) {
    pm.environment.set('current_user_groups', groups.join(','));
  } else if (typeof groups === 'string') {
    pm.environment.set('current_user_groups', groups);
  }
}
""".strip()
    return RequestSpec(
        name="Login (Cognito USER_PASSWORD_AUTH)",
        description="Exchange username/password for Cognito tokens. Saves token variables into the selected environment.",
        url="https://cognito-idp.eu-north-1.amazonaws.com/",
        method="POST",
        order=1000,
        headers={
            "Content-Type": "application/x-amz-json-1.1",
            "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
        },
        query_params=[],
        body_json=body,
        auth_noauth=True,
        script=script,
    )


def auth_refresh_request() -> RequestSpec:
    body = json.dumps(
        {
            "AuthFlow": "REFRESH_TOKEN_AUTH",
            "ClientId": "{{ClientId}}",
            "AuthParameters": {
                "REFRESH_TOKEN": "{{refresh_token}}",
            },
        },
        indent=2,
        ensure_ascii=True,
    )
    script = """
const data = pm.response.json();
const authResult = data.AuthenticationResult || {};

if (authResult.AccessToken) {
  pm.environment.set('access_token', authResult.AccessToken);
}
if (authResult.IdToken) {
  pm.environment.set('id_token', authResult.IdToken);
}
if (authResult.ExpiresIn) {
  const expiresAt = new Date(Date.now() + (Number(authResult.ExpiresIn) * 1000)).toISOString();
  pm.environment.set('token_expires_at', expiresAt);
}
""".strip()
    return RequestSpec(
        name="Refresh (Cognito REFRESH_TOKEN_AUTH)",
        description="Request new access/id tokens using refresh token.",
        url="https://cognito-idp.eu-north-1.amazonaws.com/",
        method="POST",
        order=2000,
        headers={
            "Content-Type": "application/x-amz-json-1.1",
            "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
        },
        query_params=[],
        body_json=body,
        auth_noauth=True,
        script=script,
    )


def collect_placeholders_from_text(text: str) -> set[str]:
    return {
        match
        for match in re.findall(r"\{\{\s*([^{}]+?)\s*\}\}", text)
        if not match.lower().startswith("vault:")
    }


def write_environment_yaml(path: Path, placeholders: set[str]) -> None:
    default_map = {key: value for key, value in PLACEHOLDER_DEFAULTS}
    ordered_keys = [key for key, _ in PLACEHOLDER_DEFAULTS]
    for key in sorted(placeholders):
        if key not in default_map:
            ordered_keys.append(key)
            default_map[key] = ""

    lines: list[str] = ["name: default", "values:"]
    for key in ordered_keys:
        lines.append(f"  - key: {key}")
        lines.append(f"    value: {single_quote(default_map[key])}")
    write_text(path, lines)


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    postman_dir = repo_root / "postman"
    collections_dir = postman_dir / "collections"
    environment_dir = postman_dir / "environments"

    root_collection_dir = collections_dir / COLLECTION_NAME
    if root_collection_dir.exists():
        shutil.rmtree(root_collection_dir)
    root_collection_dir.mkdir(parents=True, exist_ok=True)
    environment_dir.mkdir(parents=True, exist_ok=True)

    placeholders: set[str] = set()

    collection_definition = render_collection_definition_yaml()
    write_text(root_collection_dir / ".resources/definition.yaml", collection_definition.splitlines())
    placeholders |= collect_placeholders_from_text(collection_definition)

    auth_dir = root_collection_dir / "00 Auth"
    write_text(
        auth_dir / ".resources/definition.yaml",
        render_folder_definition_yaml("Authenticate with AWS Cognito before calling service APIs.", 1000).splitlines(),
    )

    for auth_request in (auth_login_request(), auth_refresh_request()):
        auth_content = render_request_yaml(auth_request)
        write_text(auth_dir / f"{sanitize_filename(auth_request.name)}.request.yaml", auth_content.splitlines())
        placeholders |= collect_placeholders_from_text(auth_content)

    for service_index, (service_name, rel_spec_path) in enumerate(SERVICE_SPECS, start=2):
        spec_path = repo_root / rel_spec_path
        spec = load_json(spec_path)
        components = spec.get("components", {}) if isinstance(spec.get("components", {}), dict) else {}
        base_path = normalized_base_path(spec)

        folder_order = service_index * 1000
        service_dir = root_collection_dir / service_name
        folder_description = f"Requests generated from `{rel_spec_path}`."
        write_text(
            service_dir / ".resources/definition.yaml",
            render_folder_definition_yaml(folder_description, folder_order).splitlines(),
        )

        request_order = 1000
        paths = spec.get("paths", {})
        for path_template in sorted(paths.keys()):
            path_item = paths[path_template]
            if not isinstance(path_item, dict):
                continue
            for method in METHOD_ORDER:
                if method not in path_item:
                    continue
                operation = path_item[method]
                if not isinstance(operation, dict):
                    continue
                request = request_for_operation(
                    base_path=base_path,
                    path_template=path_template,
                    method=method,
                    path_item=path_item,
                    operation=operation,
                    components=components,
                    request_order=request_order,
                )
                request_content = render_request_yaml(request)
                file_name = f"{sanitize_filename(request.name)}.request.yaml"
                write_text(service_dir / file_name, request_content.splitlines())
                placeholders |= collect_placeholders_from_text(request_content)
                request_order += 1000

    write_environment_yaml(environment_dir / "default.environment.yaml", placeholders)

    obsolete_json = environment_dir / "peerreview-external-apis.environment.json"
    if obsolete_json.exists():
        obsolete_json.unlink()

    print(f"Generated YAML collection assets in: {root_collection_dir.relative_to(repo_root)}")
    print(f"Generated YAML environment: {(environment_dir / 'default.environment.yaml').relative_to(repo_root)}")


if __name__ == "__main__":
    main()
