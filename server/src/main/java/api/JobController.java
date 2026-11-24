package api;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.core.io.FileSystemResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST routes for video processing jobs: starting a job, checking its status,
 * listing past jobs, and downloading a finished job's CSV.
 * Jobs are stored in the database through {@link JobRepository}.
 */
@RestController
public class JobController {

private final JobRepository jobs;

/**
 * Creates the controller. Spring passes in the {@link JobRepository} automatically.
 *
 * @param jobs the repository used to save and look up jobs
 */
public JobController(JobRepository jobs) {
    this.jobs = jobs;
}

/**
 * Starts processing a video in the background. Handles
 * {@code POST /api/process/{fileName}?targetColor=RRGGBB&threshold=N}.
 *
 * Checks every input first, then creates a job in the database and runs the processor jar
 * as a separate process. When that process exits, the job is marked {@code done}
 * (exit code 0) or {@code error}.
 *
 * @param fileName    the name of a video file in the {@code videos/} folder
 * @param targetColor the color to track, as 6 hex digits like {@code FF0000} (any case)
 * @param threshold   the color distance threshold for binarizing, 0 to 441
 * @return 202 with {@code {"jobId": "..."}}, 400 if a param is missing or invalid,
 *         404 if the video doesn't exist, or 500 if the processor couldn't be started
 */
 @PostMapping("/api/process/{fileName}")
public ResponseEntity<Map<String, String>> startProcess(@PathVariable String fileName,
                                           @RequestParam String targetColor,
                                           @RequestParam Integer threshold) {
    // validate everything before touching the file system or starting a process.
    // a bad value throws InvalidInputException, which ApiExceptionHandler turns into a 400
    String color = InputValidator.requireHexColor(targetColor);
    int checkedThreshold = InputValidator.requireThreshold(threshold);
    File video = InputValidator.requireVideoFile(fileName);
    // make sure the video actually exists before starting a job for it
    if (!video.isFile()) {
        return ResponseEntity.status(404).body(Map.of("error", "Video not found: " + fileName));
    }
   // random unique id for this job, also used as the name of its output csv
   String jobId = UUID.randomUUID().toString();
    // runs the processor jar as its own process:
    // java -jar videoprocessor.jar <input video> <output csv> <target color> <threshold>
    ProcessBuilder builder = new ProcessBuilder("java", "-jar", "../processor/target/videoprocessor.jar",
        video.getPath(),
        "metadata/" + jobId + ".csv",
        color,
        String.valueOf(checkedThreshold));
    // throw away the processor's console output so it doesn't fill up the server log
    builder.redirectOutput(ProcessBuilder.Redirect.DISCARD);
    builder.redirectError(ProcessBuilder.Redirect.DISCARD);
    // create the job row before starting, so a fast exit can't update a row that doesn't exist yet
    jobs.create(jobId, fileName, color, checkedThreshold);
    try {
        // start the processor in the background. this doesn't wait for it to finish
        Process process = builder.start();
        // when the processor exits, mark the job done if it succeeded (exit code 0), otherwise error
        process.onExit().thenAccept(p ->
            jobs.updateStatus(jobId, p.exitValue() == 0 ? JobStatus.DONE : JobStatus.ERROR));
    } catch (IOException e) {
        // the processor couldn't be started at all (for example java isn't on the PATH)
        jobs.updateStatus(jobId, JobStatus.ERROR);
        return ResponseEntity.internalServerError().body(Map.of("error", "Error starting job"));
    }
    // 202 Accepted: the job was started but isn't finished yet. the frontend uses the id to poll its status
    //Express version: res.status(202).send(jobId)
    return ResponseEntity.accepted().body(Map.of("jobId", jobId));

}

/**
 * Returns the current status of a job. Handles {@code GET /api/process/{jobId}/status}.
 *
 * @param jobId the ID returned when the job was started
 * @return 200 with {@code {"status": ...}}. A {@code done} job also includes a {@code result} link
 *         to its CSV, and an {@code error} job includes an {@code error} message.
 *         Returns 400 if the ID isn't a valid UUID, or 404 if no job has this ID.
 */
@GetMapping("/api/process/{jobId}/status")
public ResponseEntity<Map<String, String>> jobStatus(@PathVariable String jobId){
    InputValidator.requireJobId(jobId);
    JobStatus status = jobs.findStatus(jobId);
    if (status == null) {
        return ResponseEntity.status(404).body(Map.of("error", "Job ID not found"));
    }
    if (status == JobStatus.DONE) {
        return ResponseEntity.ok(Map.of("status", status.value(), "result", "/api/result/" + jobId));
    }
    if (status == JobStatus.ERROR) {
        return ResponseEntity.ok(Map.of("status", status.value(), "error", "Error processing video"));
    }
    return ResponseEntity.ok(Map.of("status", status.value()));
}

/**
 * Lists every job, newest first. Handles {@code GET /api/jobs}.
 *
 * @return 200 with a JSON array of jobs, each with {@code id, fileName, targetColor,
 *         threshold, status, createdAt}
 */
@GetMapping("/api/jobs")
public ResponseEntity<List<Map<String, Object>>> getAllJobs() {
    return ResponseEntity.ok(jobs.findAll());
}

/**
 * Returns one job with its settings and status. Handles {@code GET /api/jobs/{jobId}}.
 *
 * @param jobId the job's ID
 * @return 200 with the job, 400 if the ID isn't a valid UUID, or 404 if no job has this ID
 */
@GetMapping("/api/jobs/{jobId}")
public ResponseEntity<?> getJob(@PathVariable String jobId) {
    InputValidator.requireJobId(jobId);
    Map<String, Object> job = jobs.findById(jobId);
    if (job == null) {
        return ResponseEntity.status(404).body(Map.of("error", "Job ID not found"));
    }
    return ResponseEntity.ok(job);
}

/**
 * Returns the CSV output of a finished job. Handles {@code GET /api/result/{jobId}}.
 * Each row is {@code seconds,x,y} for one frame.
 *
 * @param jobId the job's ID
 * @return 200 with the CSV as {@code text/csv}, 400 if the ID isn't a valid UUID,
 *         404 if no job has this ID, the job failed, or its CSV file is missing,
 *         or 409 if the job is still processing
 */
@GetMapping("/api/result/{jobId}")
public ResponseEntity<?> getResult(@PathVariable String jobId) {
    // only well-formed, real job ids are ever turned into a file path
    InputValidator.requireJobId(jobId);
    JobStatus status = jobs.findStatus(jobId);
    if (status == null) {
        return ResponseEntity.status(404).body(Map.of("error", "Job ID not found"));
    }
    if (status == JobStatus.PROCESSING) {
        return ResponseEntity.status(409).body(Map.of("error", "Result not ready yet; the job is still processing"));
    }
    // each job writes its output to metadata/<jobId>.csv
    File csv = new File("metadata/" + jobId + ".csv");
    // only send the csv once the job finished successfully and the file is actually there
    if (status != JobStatus.DONE || !csv.isFile()) {
        return ResponseEntity.status(404).body(Map.of("error", "Result not available for this job"));
    }
    // send the csv file as text/csv so the browser can show or download it
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType("text/csv"))
        .body(new FileSystemResource(csv));
}
}
