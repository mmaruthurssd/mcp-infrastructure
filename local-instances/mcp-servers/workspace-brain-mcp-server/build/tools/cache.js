/**
 * Cache Tools
 * Manage cached data with TTL (Time To Live)
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from "fs";
import { join } from "path";
// Ensure directory exists
function ensureDir(dirPath) {
    if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true, mode: 0o700 });
    }
}
// Get cache file path
function getCacheFilePath(brainPath, key, category) {
    const cacheDir = category
        ? join(brainPath, "cache", category)
        : join(brainPath, "cache", "computed-metrics");
    ensureDir(cacheDir);
    // Sanitize key for filename
    const sanitizedKey = key.replace(/[^a-zA-Z0-9-_]/g, "_");
    return join(cacheDir, `${sanitizedKey}.json`);
}
/**
 * Cache Set
 * Store a value in cache with TTL
 */
export async function cacheSet(args, brainPath) {
    try {
        const ttlSeconds = args.ttl_seconds || 3600; // Default 1 hour
        const now = new Date();
        const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
        const entry = {
            key: args.key,
            value: args.value,
            cached_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
            category: args.category
        };
        const filePath = getCacheFilePath(brainPath, args.key, args.category);
        writeFileSync(filePath, JSON.stringify(entry, null, 2), { mode: 0o600 });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        key: args.key,
                        expires_at: expiresAt.toISOString(),
                        file_path: filePath
                    }, null, 2),
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: `Failed to cache value: ${error.message}`
                    }, null, 2)
                }
            ],
            isError: true
        };
    }
}
/**
 * Cache Get
 * Retrieve cached value (returns null if expired or not found)
 */
export async function cacheGet(args, brainPath) {
    try {
        // Determine cache directories to search
        let cacheDirs;
        if (args.category) {
            // If category provided, search only that directory
            cacheDirs = [join(brainPath, "cache", args.category)];
        }
        else {
            // Search all known cache directories
            cacheDirs = [
                join(brainPath, "cache", "computed-metrics"),
                join(brainPath, "cache", "project-indexes"),
                join(brainPath, "cache", "project-index"),
                join(brainPath, "cache", "mcp-responses")
            ];
        }
        const sanitizedKey = args.key.replace(/[^a-zA-Z0-9-_]/g, "_");
        for (const cacheDir of cacheDirs) {
            if (!existsSync(cacheDir))
                continue;
            const filePath = join(cacheDir, `${sanitizedKey}.json`);
            if (existsSync(filePath)) {
                const content = readFileSync(filePath, "utf-8");
                const entry = JSON.parse(content);
                // Check if expired
                const now = new Date();
                const expiresAt = new Date(entry.expires_at);
                const expired = now > expiresAt;
                if (expired) {
                    // Delete expired cache file
                    try {
                        unlinkSync(filePath);
                    }
                    catch (e) {
                        // Ignore delete errors
                    }
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    success: true,
                                    value: null,
                                    expired: true
                                }, null, 2),
                            },
                        ],
                    };
                }
                // Return valid cached value
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                success: true,
                                value: entry.value,
                                cached_at: entry.cached_at,
                                expires_at: entry.expires_at,
                                expired: false
                            }, null, 2),
                        },
                    ],
                };
            }
        }
        // Not found in any cache directory
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        value: null,
                        expired: false
                    }, null, 2),
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: `Failed to get cached value: ${error.message}`
                    }, null, 2)
                }
            ],
            isError: true
        };
    }
}
/**
 * Cache Invalidate
 * Remove cached entries matching pattern
 */
export async function cacheInvalidate(args, brainPath) {
    try {
        const pattern = args.pattern;
        const category = args.category;
        // Determine which directories to search
        let cacheDirs;
        if (category) {
            cacheDirs = [join(brainPath, "cache", category)];
        }
        else {
            // Search all known cache directories
            cacheDirs = [
                join(brainPath, "cache", "computed-metrics"),
                join(brainPath, "cache", "project-indexes"),
                join(brainPath, "cache", "project-index"),
                join(brainPath, "cache", "mcp-responses")
            ];
        }
        let invalidatedCount = 0;
        const keysRemoved = [];
        for (const cacheDir of cacheDirs) {
            if (!existsSync(cacheDir))
                continue;
            const files = readdirSync(cacheDir);
            for (const file of files) {
                if (!file.endsWith(".json"))
                    continue;
                const filePath = join(cacheDir, file);
                // Read cache entry to get original key
                try {
                    const content = readFileSync(filePath, "utf-8");
                    const entry = JSON.parse(content);
                    // Check if matches pattern
                    let matches = false;
                    if (pattern === "*" || pattern === "**/*") {
                        matches = true; // Match all
                    }
                    else if (pattern.includes("*")) {
                        // Simple glob matching
                        const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
                        matches = regex.test(entry.key);
                    }
                    else {
                        // Exact match
                        matches = entry.key === pattern;
                    }
                    if (matches) {
                        unlinkSync(filePath);
                        invalidatedCount++;
                        keysRemoved.push(entry.key);
                    }
                }
                catch (e) {
                    // Skip files that can't be read or parsed
                    console.error(`Failed to process ${filePath}`);
                }
            }
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: true,
                        invalidated_count: invalidatedCount,
                        keys_removed: keysRemoved
                    }, null, 2),
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: `Failed to invalidate cache: ${error.message}`
                    }, null, 2)
                }
            ],
            isError: true
        };
    }
}
//# sourceMappingURL=cache.js.map