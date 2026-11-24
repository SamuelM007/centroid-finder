package api;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "spring.datasource.url=jdbc:sqlite:target/test-jobs.db")
public class JobControllerTest {

    // only needs to exist for the "video not found" check, it doesn't have to be a real video
    private static final String TEST_VIDEO = "junit-job-video.mp4";
    private static final Path TEST_VIDEO_PATH = Path.of("videos", TEST_VIDEO);

    @Autowired
    private MockMvc mvc;

    @Autowired
    private JobRepository jobs;

    @BeforeAll
    static void makeTestFiles() throws Exception {
        Files.createDirectories(TEST_VIDEO_PATH.getParent());
        Files.writeString(TEST_VIDEO_PATH, "not a real video");
        Files.createDirectories(Path.of("metadata"));
    }

    @AfterAll
    static void deleteTestFiles() throws Exception {
        Files.deleteIfExists(TEST_VIDEO_PATH);
    }

    // adds a job straight to the db with the given status and returns its id
    private String createJob(JobStatus status) {
        String id = UUID.randomUUID().toString();
        jobs.create(id, TEST_VIDEO, "FF0000", 100);
        jobs.updateStatus(id, status);
        return id;
    }

    // POST /api/process/{fileName}

    @Test
    void startProcessReturnsJobId() throws Exception {
        MvcResult result = mvc.perform(post("/api/process/" + TEST_VIDEO)
                .param("targetColor", "FF0000")
                .param("threshold", "100"))
            .andExpect(status().isAccepted())
            .andExpect(jsonPath("$.jobId").exists())
            .andReturn();

        String jobId = com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(), "$.jobId");
        assertNotNull(jobs.findStatus(jobId));
    }

    @Test
    void startProcessMissingParamsReturns400() throws Exception {
        mvc.perform(post("/api/process/" + TEST_VIDEO))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void startProcessMissingThresholdReturns400() throws Exception {
        mvc.perform(post("/api/process/" + TEST_VIDEO)
                .param("targetColor", "FF0000"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void startProcessMissingTargetColorReturns400() throws Exception {
        mvc.perform(post("/api/process/" + TEST_VIDEO)
                .param("threshold", "100"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void startProcessNonNumberThresholdReturns400() throws Exception {
        mvc.perform(post("/api/process/" + TEST_VIDEO)
                .param("targetColor", "FF0000")
                .param("threshold", "abc"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void startProcessWithGetReturns405() throws Exception {
        mvc.perform(get("/api/process/" + TEST_VIDEO))
            .andExpect(status().isMethodNotAllowed());
    }

    @Test
    void startProcessUnknownVideoReturns404() throws Exception {
        mvc.perform(post("/api/process/does-not-exist.mp4")
                .param("targetColor", "FF0000")
                .param("threshold", "100"))
            .andExpect(status().isNotFound());
    }

    @Test
    void startProcessMissingParamsSaysWhichOne() throws Exception {
        mvc.perform(post("/api/process/" + TEST_VIDEO).param("targetColor", "FF0000"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("Missing threshold query parameter."));
    }

    @Test
    void startProcessNonNumberThresholdReturnsJsonError() throws Exception {
        mvc.perform(post("/api/process/" + TEST_VIDEO)
                .param("targetColor", "FF0000")
                .param("threshold", "abc"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("threshold has an invalid value: abc"));
    }

    @Test
    void startProcessInvalidColorsReturn400() throws Exception {
        for (String color : new String[] {"FFF", "#FF0000", "GG0000", "FF00000", "red"}) {
            mvc.perform(post("/api/process/" + TEST_VIDEO)
                    .param("targetColor", color)
                    .param("threshold", "100"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(containsString("targetColor")));
        }
    }

    @Test
    void startProcessThresholdOutOfRangeReturns400() throws Exception {
        for (String threshold : new String[] {"-1", "442", "99999"}) {
            mvc.perform(post("/api/process/" + TEST_VIDEO)
                    .param("targetColor", "FF0000")
                    .param("threshold", threshold))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(containsString("threshold")));
        }
    }

    @Test
    void startProcessAcceptsThresholdLimits() throws Exception {
        for (String threshold : new String[] {"0", "441"}) {
            mvc.perform(post("/api/process/" + TEST_VIDEO)
                    .param("targetColor", "ff0000")
                    .param("threshold", threshold))
                .andExpect(status().isAccepted());
        }
    }

    @Test
    void startProcessStoresColorInUpperCase() throws Exception {
        MvcResult result = mvc.perform(post("/api/process/" + TEST_VIDEO)
                .param("targetColor", "ffa200")
                .param("threshold", "100"))
            .andExpect(status().isAccepted())
            .andReturn();
        String jobId = com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(), "$.jobId");
        mvc.perform(get("/api/jobs/" + jobId))
            .andExpect(jsonPath("$.targetColor").value("FFA200"));
    }

    @Test
    void startProcessInvalidFileNamesReturn400() throws Exception {
        for (String name : new String[] {"notes.txt", "no-extension", "..evil.mp4"}) {
            mvc.perform(post("/api/process/" + name)
                    .param("targetColor", "FF0000")
                    .param("threshold", "100"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(containsString("Invalid video file name")));
        }
    }

    // GET /api/process/{jobId}/status

    @Test
    void jobStatusProcessing() throws Exception {
        String id = createJob(JobStatus.PROCESSING);
        mvc.perform(get("/api/process/" + id + "/status"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("processing"));
    }

    @Test
    void jobStatusDoneIncludesResultLink() throws Exception {
        String id = createJob(JobStatus.DONE);
        mvc.perform(get("/api/process/" + id + "/status"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("done"))
            .andExpect(jsonPath("$.result").value("/api/result/" + id));
    }

    @Test
    void jobStatusErrorIncludesMessage() throws Exception {
        String id = createJob(JobStatus.ERROR);
        mvc.perform(get("/api/process/" + id + "/status"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("error"))
            .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void jobStatusUnknownIdReturns404() throws Exception {
        mvc.perform(get("/api/process/" + UUID.randomUUID() + "/status"))
            .andExpect(status().isNotFound());
    }

    @Test
    void jobStatusMalformedIdReturns400() throws Exception {
        mvc.perform(get("/api/process/not-a-job/status"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("Invalid job ID: not-a-job"));
    }

    // GET /api/jobs

    @Test
    void getAllJobsIncludesCreatedJob() throws Exception {
        String id = createJob(JobStatus.PROCESSING);
        mvc.perform(get("/api/jobs"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[*].id", hasItem(id)));
    }

    // GET /api/jobs/{jobId}

    @Test
    void getJobReturnsJob() throws Exception {
        String id = createJob(JobStatus.DONE);
        mvc.perform(get("/api/jobs/" + id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(id))
            .andExpect(jsonPath("$.fileName").value(TEST_VIDEO))
            .andExpect(jsonPath("$.status").value("done"));
    }

    @Test
    void getJobUnknownIdReturns404() throws Exception {
        mvc.perform(get("/api/jobs/" + UUID.randomUUID()))
            .andExpect(status().isNotFound());
    }

    @Test
    void getJobMalformedIdReturns400() throws Exception {
        mvc.perform(get("/api/jobs/not-a-job"))
            .andExpect(status().isBadRequest());
    }

    // GET /api/result/{jobId}

    @Test
    void getResultReturnsCsv() throws Exception {
        String id = createJob(JobStatus.DONE);
        Path csv = Path.of("metadata", id + ".csv");
        Files.writeString(csv, "0.0,10,20");
        try {
            mvc.perform(get("/api/result/" + id))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/csv"))
                .andExpect(content().string("0.0,10,20"));
        } finally {
            Files.deleteIfExists(csv);
        }
    }

    @Test
    void getResultStillProcessingReturns409() throws Exception {
        String id = createJob(JobStatus.PROCESSING);
        mvc.perform(get("/api/result/" + id))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error").value(containsString("not ready")));
    }

    @Test
    void getResultErrorJobReturns404() throws Exception {
        String id = createJob(JobStatus.ERROR);
        mvc.perform(get("/api/result/" + id))
            .andExpect(status().isNotFound());
    }

    @Test
    void getResultDoneButCsvMissingReturns404() throws Exception {
        String id = createJob(JobStatus.DONE);
        mvc.perform(get("/api/result/" + id))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("Result not available for this job"));
    }

    @Test
    void getResultUnknownIdReturns404() throws Exception {
        mvc.perform(get("/api/result/" + UUID.randomUUID()))
            .andExpect(status().isNotFound());
    }

    @Test
    void getResultMalformedIdReturns400() throws Exception {
        mvc.perform(get("/api/result/not-a-job"))
            .andExpect(status().isBadRequest());
    }
}
