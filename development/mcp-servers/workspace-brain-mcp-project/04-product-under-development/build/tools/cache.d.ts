/**
 * Cache Tools
 * Manage cached data with TTL (Time To Live)
 */
/**
 * Cache Set
 * Store a value in cache with TTL
 */
export declare function cacheSet(args: any, brainPath: string): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError?: undefined;
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
}>;
/**
 * Cache Get
 * Retrieve cached value (returns null if expired or not found)
 */
export declare function cacheGet(args: any, brainPath: string): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError?: undefined;
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
}>;
/**
 * Cache Invalidate
 * Remove cached entries matching pattern
 */
export declare function cacheInvalidate(args: any, brainPath: string): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError?: undefined;
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
}>;
//# sourceMappingURL=cache.d.ts.map