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
 * Creates a job in the database, then runs the processor jar as a separate process.
 * When that process exits, the job is marked {@code done} (exit code 0) or {@code error}.
 *
 * @param fileName    the name of a file in the {@code videos/} folder
 * @param targetColor the color to track, as a hex string like {@code FF0000}
 * @param threshold   the color distance threshold for binarizing
 * @return 202 with {@code {"jobId": "..."}}, 400 if a param is missing, 404 if the video
 *         doesn't exist, or 500 if the processor couldn't be started
 */
 @PostMapping("/api/process/{fileName}")
public ResponseEntity<Map<String, String>> startProcess(@PathVariable String fileName,
                                           @RequestParam(required = false) String targetColor,
                                           @RequestParam(required = false) Integer threshold) {
    if (targetColor == null || threshold == null) {
        return ResponseEntity.badRequest()
            .body(Map.of("error", "Missing targetColor or threshold query parameter."));
    }
    File video = new File("videos/" + fileName);
    if (!video.isFile()) {
        return ResponseEntity.status(404).body(Map.of("error", "Video not found: " + fileName));
    }
   String jobId = UUID.randomUUID().toString();
    ProcessBuilder builder = new ProcessBuilder("java", "-jar", "../processor/target/videoprocessor.jar",
        "videos/" + fileName,
        "metadata/" + jobId + ".csv",
        targetColor,
        String.valueOf(threshold));
    builder.redirectOutput(ProcessBuilder.Redirect.DISCARD);
    builder.redirectError(ProcessBuilder.Redirect.DISCARD);
    // create the job row before starting, so a fast exit can't update a row that doesn't exist yet
    jobs.create(jobId, fileName, targetColor, threshold);
    try {
        Process process = builder.start();
        process.onExit().thenAccept(p ->
            jobs.updateStatus(jobId, p.exitValue() == 0 ? JobStatus.DONE : JobStatus.ERROR));
    } catch (IOException e) {
        jobs.updateStatus(jobId, JobStatus.ERROR);
        return ResponseEntity.internalServerError().body(Map.of("error", "Error starting job"));
    }
    //Express version: res.status(202).send(jobId)
    return ResponseEntity.accepted().body(Map.of("jobId", jobId));

}

/**
 * Returns the current status of a job. Handles {@code GET /api/process/{jobId}/status}.
 *
 * @param jobId the ID returned when the job was started
 * @return 200 with {@code {"status": ...}}. A {@code done} job also includes a {@code result} link
 *         to its CSV, and an {@code error} job includes an {@code error} message.
 *         Returns 404 if no job has this ID.
 */
@GetMapping("/api/process/{jobId}/status")
public ResponseEntity<Map<String, String>> jobStatus(@PathVariable String jobId){
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
 * @return 200 with the job, or 404 if no job has this ID
 */
@GetMapping("/api/jobs/{jobId}")
public ResponseEntity<?> getJob(@PathVariable String jobId) {
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
 * @return 200 with the CSV as {@code text/csv}, or 404 if no job has this ID,
 *         the job isn't done, or its CSV file is missing
 */
@GetMapping("/api/result/{jobId}")
public ResponseEntity<?> getResult(@PathVariable String jobId) {
    // look the id up first so only real job ids are ever turned into a file path
    JobStatus status = jobs.findStatus(jobId);
    if (status == null) {
        return ResponseEntity.status(404).body(Map.of("error", "Job ID not found"));
    }
    File csv = new File("metadata/" + jobId + ".csv");
    if (status != JobStatus.DONE || !csv.isFile()) {
        return ResponseEntity.status(404).body(Map.of("error", "Result not available for this job"));
    }
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType("text/csv"))
        .body(new FileSystemResource(csv));
}
}
