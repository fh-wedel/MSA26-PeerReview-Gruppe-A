# configuration-service Learnings

- **OpenAPI Schema Separation:** The POST `/` endpoint takes `CreateConfigurationRequest` while GET responses return
  `Configuration`. Do not reuse the `Configuration` schema for the POST request body in `configuration.json`. The
  service resolves fields like `numberOfExaminers` independently via workflow plugins and does not accept them from the
  client.
- **Frontend Code Sync:** Whenever `configuration.json` is modified, you must run `npm run generate:api:config` in the
  `web-ui` directory to regenerate the frontend TypeScript clients.
