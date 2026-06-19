# templateEcsService Learnings

- **Docker Build Target:** The `Dockerfile` dynamically targets this module using `ARG MODULE_DIR=templateEcsService` with Maven's `-pl` flag. When copying this template for a new service, this argument must be updated to the new directory name so Maven builds the correct child module from the root context.
