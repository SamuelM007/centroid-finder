package api;

// the states a processing job can be in. value is what's stored in the db and sent to the frontend
public enum JobStatus {
    PROCESSING("processing"),
    DONE("done"),
    ERROR("error");

    private final String value;

    JobStatus(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }

    // turns a value from the db back into a JobStatus
    public static JobStatus fromValue(String value) {
        for (JobStatus status : values()) {
            if (status.value.equals(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown job status: " + value);
    }
}
