/**
 * Maintenance Tools
 * Archive, export, and storage management
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, renameSync } from "fs";
import { join } from "path";

interface Event {
  id: string;
  type: string;
  timestamp: string;
  data: Record<string, any>;
}

// Ensure directory exists
function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true, mode: 0o700 });
  }
}

// Get directory size recursively
function getDirectorySize(dirPath: string): number {
  if (!existsSync(dirPath)) return 0;

  let totalSize = 0;

  try {
    const files = readdirSync(dirPath);

    for (const file of files) {
      const filePath = join(dirPath, file);
      const stats = statSync(filePath);

      if (stats.isDirectory()) {
        totalSize += getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }
  } catch (error) {
    // Ignore errors
  }

  return totalSize;
}

// Count files in directory
function countFiles(dirPath: string): number {
  if (!existsSync(dirPath)) return 0;

  let count = 0;

  try {
    const files = readdirSync(dirPath);

    for (const file of files) {
      const filePath = join(dirPath, file);
      const stats = statSync(filePath);

      if (stats.isFile()) {
        count++;
      }
    }
  } catch (error) {
    // Ignore errors
  }

  return count;
}

/**
 * Archive Old Data
 * Move old telemetry data to archives (Phase 1: just move, no compression yet)
 */
export async function archiveOldData(args: any, brainPath: string) {
  try {
    const beforeDate = new Date(args.before_date);
    const dataType = args.data_type || "all";

    let archivedCount = 0;
    const archiveDir = join(brainPath, "telemetry", "archives");
    ensureDir(archiveDir);

    // Process telemetry files
    if (dataType === "telemetry" || dataType === "all") {
      const telemetryFiles = ["task-log.jsonl", "mcp-usage.jsonl"];

      for (const filename of telemetryFiles) {
        const filePath = join(brainPath, "telemetry", filename);
        if (!existsSync(filePath)) continue;

        const content = readFileSync(filePath, "utf-8");
        const lines = content.trim().split("\n").filter(line => line.length > 0);

        const recentLines: string[] = [];
        const oldLines: string[] = [];

        for (const line of lines) {
          try {
            const event = JSON.parse(line);
            const eventDate = new Date(event.timestamp);

            if (eventDate < beforeDate) {
              oldLines.push(line);
            } else {
              recentLines.push(line);
            }
          } catch (e) {
            // Keep malformed lines in recent
            recentLines.push(line);
          }
        }

        if (oldLines.length > 0) {
          // Save old data to archive
          const archiveFilename = `${filename.replace(".jsonl", "")}-${beforeDate.toISOString().split("T")[0]}.jsonl`;
          const archivePath = join(archiveDir, archiveFilename);
          writeFileSync(archivePath, oldLines.join("\n") + "\n", { mode: 0o600 });

          // Update active file with only recent data
          writeFileSync(filePath, recentLines.join("\n") + (recentLines.length > 0 ? "\n" : ""), { mode: 0o600 });

          archivedCount += oldLines.length;
        }
      }
    }

    // Get archive size
    const archiveSize = getDirectorySize(archiveDir) / (1024 * 1024); // Convert to MB

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              archived_count: archivedCount,
              compressed_size_mb: Math.round(archiveSize * 100) / 100,
              archive_path: archiveDir,
              note: "Phase 1: Files moved to archives/ without compression. Compression will be added in Phase 2."
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: false,
            error: `Failed to archive old data: ${error.message}`
          }, null, 2)
        }
      ],
      isError: true
    };
  }
}

/**
 * Export Data
 * Export data to specified format
 */
export async function exportData(args: any, brainPath: string) {
  try {
    const dataType = args.data_type;
    const format = args.format;
    const outputPath = args.output_path || join(brainPath, "backups", "manual-exports");

    ensureDir(outputPath);

    let exportData: any[] = [];
    let recordCount = 0;

    // Collect data based on type
    switch (dataType) {
      case "telemetry": {
        const telemetryFiles = ["task-log.jsonl", "mcp-usage.jsonl"];
        for (const filename of telemetryFiles) {
          const filePath = join(brainPath, "telemetry", filename);
          if (existsSync(filePath)) {
            const content = readFileSync(filePath, "utf-8");
            const lines = content.trim().split("\n").filter(line => line.length > 0);

            for (const line of lines) {
              try {
                exportData.push(JSON.parse(line));
              } catch (e) {
                // Skip malformed lines
              }
            }
          }
        }
        break;
      }

      case "learning": {
        const learningFiles = ["issue-patterns.json", "solution-library.json", "preventive-checks.json"];
        for (const filename of learningFiles) {
          const filePath = join(brainPath, "learning", filename);
          if (existsSync(filePath)) {
            const content = readFileSync(filePath, "utf-8");
            const data = JSON.parse(content);
            if (data.patterns) exportData.push(...data.patterns);
            if (data.solutions) exportData.push(...data.solutions);
            if (data.checks) exportData.push(...data.checks);
          }
        }
        break;
      }

      case "analytics": {
        const summariesDir = join(brainPath, "analytics", "weekly-summaries");
        if (existsSync(summariesDir)) {
          const files = readdirSync(summariesDir);
          for (const file of files) {
            const filePath = join(summariesDir, file);
            const content = readFileSync(filePath, "utf-8");
            exportData.push({
              filename: file,
              content: content
            });
          }
        }
        break;
      }

      case "all": {
        // For "all" type, just return a placeholder
        // Full implementation would recursively export all types
        exportData = [{
          note: "Export all types separately using data_type: 'telemetry', 'learning', or 'analytics'"
        }];
        break;
      }
    }

    recordCount = exportData.length;

    // Format and save
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    let filename: string;
    let fileContent: string;

    switch (format) {
      case "json":
        filename = `${dataType}-export-${timestamp}.json`;
        fileContent = JSON.stringify(exportData, null, 2);
        break;

      case "jsonl":
        filename = `${dataType}-export-${timestamp}.jsonl`;
        fileContent = exportData.map(item => JSON.stringify(item)).join("\n");
        break;

      case "csv":
        filename = `${dataType}-export-${timestamp}.csv`;
        // Simple CSV conversion (flatten first object for headers)
        if (exportData.length > 0) {
          const headers = Object.keys(exportData[0]);
          const csvLines = [headers.join(",")];

          for (const item of exportData) {
            const values = headers.map(h => {
              const val = item[h];
              if (typeof val === "object") return JSON.stringify(val);
              return String(val);
            });
            csvLines.push(values.join(","));
          }

          fileContent = csvLines.join("\n");
        } else {
          fileContent = "";
        }
        break;

      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    const exportFilePath = join(outputPath, filename);
    writeFileSync(exportFilePath, fileContent, { mode: 0o600 });

    const fileSize = Buffer.byteLength(fileContent, "utf-8") / (1024 * 1024); // MB

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              export_path: exportFilePath,
              record_count: recordCount,
              file_size_mb: Math.round(fileSize * 100) / 100
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: false,
            error: `Failed to export data: ${error.message}`
          }, null, 2)
        }
      ],
      isError: true
    };
  }
}

/**
 * Get Storage Stats
 * Calculate storage usage for external brain
 */
export async function getStorageStats(args: any, brainPath: string) {
  try {
    const includeBreakdown = args.include_breakdown !== false; // Default true

    // Calculate sizes
    const telemetrySize = getDirectorySize(join(brainPath, "telemetry"));
    const analyticsSize = getDirectorySize(join(brainPath, "analytics"));
    const learningSize = getDirectorySize(join(brainPath, "learning"));
    const cacheSize = getDirectorySize(join(brainPath, "cache"));
    const backupsSize = getDirectorySize(join(brainPath, "backups"));

    const totalSize = telemetrySize + analyticsSize + learningSize + cacheSize + backupsSize;

    // Count files
    const telemetryCount = countFiles(join(brainPath, "telemetry"));
    const analyticsCount = countFiles(join(brainPath, "analytics", "weekly-summaries"));
    const cacheCount = countFiles(join(brainPath, "cache", "computed-metrics")) +
                      countFiles(join(brainPath, "cache", "project-indexes")) +
                      countFiles(join(brainPath, "cache", "mcp-responses"));

    // Find oldest and newest events
    let oldestEvent: string | null = null;
    let newestEvent: string | null = null;

    const telemetryFiles = ["task-log.jsonl", "mcp-usage.jsonl"];
    for (const filename of telemetryFiles) {
      const filePath = join(brainPath, "telemetry", filename);
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, "utf-8");
        const lines = content.trim().split("\n").filter(line => line.length > 0);

        for (const line of lines) {
          try {
            const event = JSON.parse(line);
            const eventTime = event.timestamp;

            if (!oldestEvent || eventTime < oldestEvent) {
              oldestEvent = eventTime;
            }
            if (!newestEvent || eventTime > newestEvent) {
              newestEvent = eventTime;
            }
          } catch (e) {
            // Skip malformed lines
          }
        }
      }
    }

    const stats: any = {
      success: true,
      total_size_mb: Math.round((totalSize / (1024 * 1024)) * 100) / 100
    };

    if (includeBreakdown) {
      stats.breakdown = {
        telemetry_mb: Math.round((telemetrySize / (1024 * 1024)) * 100) / 100,
        analytics_mb: Math.round((analyticsSize / (1024 * 1024)) * 100) / 100,
        learning_mb: Math.round((learningSize / (1024 * 1024)) * 100) / 100,
        cache_mb: Math.round((cacheSize / (1024 * 1024)) * 100) / 100,
        backups_mb: Math.round((backupsSize / (1024 * 1024)) * 100) / 100
      };

      stats.file_counts = {
        telemetry: telemetryCount,
        analytics: analyticsCount,
        cache: cacheCount
      };
    }

    if (oldestEvent) stats.oldest_event = oldestEvent;
    if (newestEvent) stats.newest_event = newestEvent;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(stats, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: false,
            error: `Failed to get storage stats: ${error.message}`
          }, null, 2)
        }
      ],
      isError: true
    };
  }
}
