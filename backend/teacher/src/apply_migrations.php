<?php
require_once __DIR__ . '/config.php';

// migrations directory
$migrationsDir = __DIR__ . '/../migrations';
if (!is_dir($migrationsDir)) {
    echo "Migrations directory not found: $migrationsDir\n";
    exit(1);
}

$files = scandir($migrationsDir);
$migrations = array_filter($files, function($f) { return preg_match('/^\d+_.*\.sql$/', $f); });
sort($migrations, SORT_NATURAL);

// Ensure migrations table exists
$createMigrationsTable = "CREATE TABLE IF NOT EXISTS migrations (\n    id INT AUTO_INCREMENT PRIMARY KEY,\n    filename VARCHAR(255) NOT NULL UNIQUE,\n    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n) ENGINE=InnoDB;";
if (!$conn->query($createMigrationsTable)) {
    echo "Failed to ensure migrations table: " . $conn->error . "\n";
    exit(1);
}

foreach ($migrations as $migration) {
    $migrationPath = $migrationsDir . '/' . $migration;
    // skip if already applied
    $stmt = $conn->prepare('SELECT COUNT(*) as cnt FROM migrations WHERE filename = ?');
    $stmt->bind_param('s', $migration);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res->fetch_assoc();
    if ($row && intval($row['cnt']) > 0) {
        echo "Skipping already-applied migration: $migration\n";
        continue;
    }

    echo "Applying migration: $migration\n";
    $sql = file_get_contents($migrationPath);
    if ($sql === false) {
        echo "Failed to read migration file: $migrationPath\n";
        exit(1);
    }

    // execute SQL; assume file contains valid statements
    if ($conn->multi_query($sql)) {
        // consume remaining results
        do {
            if ($result = $conn->store_result()) {
                $result->free();
            }
        } while ($conn->more_results() && $conn->next_result());

        // record migration
        $ins = $conn->prepare('INSERT INTO migrations (filename) VALUES (?)');
        $ins->bind_param('s', $migration);
        if (!$ins->execute()) {
            echo "Failed to record migration $migration: " . $ins->error . "\n";
            exit(1);
        }
        echo "Applied: $migration\n";
    } else {
        echo "Failed to apply migration $migration: " . $conn->error . "\n";
        exit(1);
    }
}

echo "All migrations applied.\n";
