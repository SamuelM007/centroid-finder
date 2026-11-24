# Robot Improvements

## Refactoring Code
- Move the `/api/health` route out of `ApiApplication` into its own controller so the main class only starts the app.
- Pick one job status route. `/api/jobcheck/{jobId}` and `/api/process/{jobId}/status` do the same thing; keep the one the frontend uses and remove the other.
- Replace the status strings ("processing", "done", "error") with an enum so typos can't slip in.
- Remove dead files: `server/bin/` (old Eclipse files and an outdated duplicate `pom.xml`), committed `.DS_Store` files, and `ImageSummaryApp` if the image-only app is no longer used.

## Adding Tests
- The server has no tests at all. Add Spring Boot tests (MockMvc) for each route, especially the error cases: missing params, unknown video, unknown job ID, result not ready.
- Add tests for `JobRepository` (create, update, find, startup reset of "processing" jobs) using a temporary database.
- Add a processor test for the exit code when processing fails, once the exit code bug below is fixed.
- The GitHub Actions workflow runs `mvn test` from the repo root, but there is no `pom.xml` there. Point it at `processor/` (and later `server/`) so the tests actually run on PRs.

## Improving Error Handling
- `VideoProcessorApp` catches every `Exception` and then exits normally, so the process returns exit code 0 even when it fails. The server then marks the job "done". Catch specific exceptions (`IOException`, `FrameGrabber.Exception`) and exit with a non-zero code on failure or bad arguments.
- Validate inputs on the server before starting a job: `targetColor` should be exactly 6 hex characters, `threshold` should be in a sensible range (0 to about 442, the max RGB distance).
- `getThumbnail` can throw a `NullPointerException` if the video has no frames (`grabImage()` returns null). Check for that and return an error response.
- The processor's output and errors are discarded (`Redirect.DISCARD`). Send them to a log file per job so failed jobs can be debugged.

## Writing Documentation
- The server classes (`VideoController`, `JobRepository`, `ApiApplication`) have no Javadoc. Document each route: path, params, possible responses and status codes.
- Add a short API reference to the README listing every endpoint and its JSON response shape.
- Explain the non-standard server layout (`sourceDirectory` set to `.`) in the README, or move the code to `src/main/java` so it doesn't need explaining.
- Document where things are read from and written to (`videos/`, `metadata/`, `jobs.db`, the processor jar path) and which folder the server must be started from.

## Improving Performance
- `DfsBinaryGroupFinder` uses a `HashSet<Coordinate>` and a `Stack` for visited pixels, which is slow when run on every frame. A `boolean[][]` visited array and `ArrayDeque` would be much faster.
- `imageChecker` rescans every pixel each frame even though the binarizer always produces valid 0/1 arrays.
- `javacv-platform` pulls in native libraries for every OS, making the jar very large. Consider depending only on the platforms you actually run on.

## Hardening Security
- File names from the URL are joined straight into `new File("videos/" + fileName)`. Validate that the resolved path stays inside the `videos` folder to block path traversal.
- There is no limit on how many processing jobs can run at once. Each request starts a new JVM, so a flood of requests could take the server down. Limit concurrent jobs.
- `getAllVideos` returns every file in the folder, including non-video files like `.DS_Store`. Filter to video extensions.

## Bug Fixes
- Exit code 0 on failure (see Error Handling) means failed jobs show as "done".
- `jobs.create` runs after `builder.start()`. If the process exits very fast, `updateStatus` can run before the row exists and the status is lost. Create the job row before starting the process.
- Every job writes `firstFrameBinarized.png` to the same working directory, so concurrent jobs overwrite each other. Write it per job or remove it if unused.
- `getVideo` always sends `video/mp4` as the content type, even for `.mov` files.

## Other
- Hardcoded values (anomaly max jump of 50, folder paths, jar path) should move to `application.properties` or constants.
