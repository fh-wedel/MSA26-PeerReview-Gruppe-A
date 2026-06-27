# Postman Learnings

- Postman sources in this repo are YAML local files (`postman/collections/**` and `postman/environments/default.environment.yaml`). Treat root-level Postman JSON exports as obsolete artifacts, and do not reintroduce them as source-of-truth.
- Collection generation must consume only externally exposed service OpenAPI specs. Exclude `template*.json` and any `openapi/client/*` specs, otherwise internal/non-manual endpoints leak into the generated collection.
- Cognito auth requests intentionally depend on three aligned inputs: `{{ClientId}}` from the environment, credentials from Postman Vault (`{{vault:...}}`), and a hardcoded region `eu-north-1`. Keep all three in sync when touching auth requests/docs.
- Generated environment files must define every `{{variable}}` used by YAML requests (except `{{vault:...}}`). Regeneration must also remove stale request YAML files so deleted endpoints do not leave orphaned requests.
