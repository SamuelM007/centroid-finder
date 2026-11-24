# Priority Improvements

## Refactoring Code
- Remove the duplicate `/api/jobcheck/{jobId}` route and keep `/api/process/{jobId}/status`, which the frontend uses.
- Break the large React pages and components into smaller components.

## Adding Tests
- Add MockMvc tests for the server routes, including error cases (missing params, unknown video, unknown job ID, result not ready).
- Fix the GitHub Actions workflow so it runs `mvn test` in `processor/` instead of the repo root, where there is no `pom.xml`.

## Improving Error Handling
- `VideoProcessorApp` catches every `Exception` and exits with code 0, so failed jobs are marked "done". Catch specific exceptions and exit with a non-zero code on failure or bad arguments.
- Validate `targetColor` (6 hex characters) and `threshold` (sensible range) on the server before starting a job.

## Writing Documentation
- Add Javadoc to `VideoController` and `JobRepository`, documenting each route's path, params, responses, and status codes.
- Add an API reference to the README listing every endpoint and its JSON response shape.

## Bug Fixes
- `jobs.create` runs after the process starts. If the process exits very fast, the status update runs before the job row exists and is lost. Create the job row before starting the process.
