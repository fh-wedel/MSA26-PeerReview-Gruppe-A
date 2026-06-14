# templateEcsService Learnings

- **Cognito User Proxy:** The `/api/communication/users?search=` endpoint acts as a proxy to AWS Cognito. It is
  currently the only backend workaround to retrieve a list of users (used for frontend caching) since a dedicated User
  Management Service does not yet exist.
