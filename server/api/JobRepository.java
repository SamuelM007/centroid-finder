package api;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JobRepository {
    private final JdbcTemplate db;

    public JobRepository(JdbcTemplate db) {
        this.db = db;
        db.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                id           TEXT PRIMARY KEY,
                file_name    TEXT NOT NULL,
                target_color TEXT NOT NULL,
                threshold    INTEGER NOT NULL,
                status       TEXT NOT NULL,
                created_at   TEXT DEFAULT CURRENT_TIMESTAMP
            )""");
        // Any job still marked 'processing' at startup was cut off by the last shutdown
        db.update("UPDATE jobs SET status = 'error' WHERE status = 'processing'");
    }

    public void create(String id, String fileName, String targetColor, int threshold) {
        db.update("INSERT INTO jobs (id, file_name, target_color, threshold, status) VALUES (?, ?, ?, ?, 'processing')",
                id, fileName, targetColor, threshold);
    }

    public void updateStatus(String id, String status) {
        db.update("UPDATE jobs SET status = ? WHERE id = ?", status, id);
    }

    public String findStatus(String id) {
        List<String> rows = db.queryForList("SELECT status FROM jobs WHERE id = ?", String.class, id);
        return rows.isEmpty() ? null : rows.get(0);
    }
}
