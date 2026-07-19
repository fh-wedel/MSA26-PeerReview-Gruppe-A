# Configuration Service Learnings

- **Plugin boundary:** Review types implement `ReviewTypePlugin`; submission templates implement `ReviewTemplatePlugin`. Keep workflow behavior out of the core service.
- **Plugin discovery:** Runtime plugin JARs must provide the corresponding `META-INF/services/` registration and are loaded through `ServiceLoader` from `configuration.plugins.directory`.
- **OpenAPI separation:** Creation requests and returned configuration objects are distinct schemas. Keep the API contract aligned with plugin-derived fields and validation rules.
- **Frontend synchronization:** After changing `configuration.json`, run `npm run generate:api:config` in `web-ui/`.
