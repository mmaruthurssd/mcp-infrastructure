import fs from 'fs/promises';
import path from 'path';
export class ContentAnalyzer {
    maxContentSize = 100000; // 100KB max for content analysis
    folderMap;
    constructor(folderMap) {
        this.folderMap = folderMap;
    }
    /**
     * Analyze a file's content to determine its purpose and placement
     */
    async analyzeFile(filePath) {
        const metadata = await this.getFileMetadata(filePath);
        const analysis = {
            fileType: 'unknown',
            purpose: '',
            keywords: [],
            isSecret: false,
            isTemplate: false,
            isTemporary: false,
            isPlanningDoc: false,
            confidence: 0,
            reasoning: []
        };
        // Step 1: Analyze file extension
        const extensionAnalysis = this.analyzeExtension(metadata.extension);
        analysis.fileType = extensionAnalysis.type;
        analysis.reasoning.push(extensionAnalysis.reason);
        // Step 2: Analyze file name patterns
        const nameAnalysis = this.analyzeFileName(metadata.name);
        if (nameAnalysis.isSecret) {
            analysis.isSecret = true;
            analysis.reasoning.push(nameAnalysis.reason);
        }
        if (nameAnalysis.isTemplate) {
            analysis.isTemplate = true;
            analysis.reasoning.push(nameAnalysis.reason);
        }
        if (nameAnalysis.isTemporary) {
            analysis.isTemporary = true;
            analysis.reasoning.push(nameAnalysis.reason);
        }
        if (nameAnalysis.isPlanningDoc) {
            analysis.isPlanningDoc = true;
            analysis.reasoning.push(nameAnalysis.reason);
        }
        // If name analysis found a strong match with naming convention, use it
        if (nameAnalysis.suggestedLocation && nameAnalysis.confidence) {
            analysis.suggestedLocation = nameAnalysis.suggestedLocation;
            analysis.confidence = nameAnalysis.confidence;
            // We'll still analyze content to potentially improve confidence
        }
        // Step 3: Analyze file content (if text file and not too large)
        if (this.isTextFile(metadata.extension) && metadata.size < this.maxContentSize) {
            try {
                const content = await fs.readFile(filePath, 'utf-8');
                metadata.content = content;
                // Extract structured metadata first
                const extractedMetadata = this.extractAllMetadata(content, metadata.extension);
                if (extractedMetadata) {
                    analysis.metadata = extractedMetadata;
                    analysis.reasoning.push(`Found structured metadata in file`);
                    // Use metadata to enhance analysis
                    if (extractedMetadata.type) {
                        analysis.reasoning.push(`Metadata type: ${extractedMetadata.type}`);
                    }
                    if (extractedMetadata.project) {
                        analysis.projectAffiliation = extractedMetadata.project;
                        analysis.reasoning.push(`Metadata indicates project: ${extractedMetadata.project}`);
                    }
                    if (extractedMetadata.tags && Array.isArray(extractedMetadata.tags)) {
                        analysis.keywords.push(...extractedMetadata.tags);
                    }
                }
                // Then do regular content analysis
                const contentAnalysis = this.analyzeContent(content, metadata.name);
                analysis.keywords.push(...contentAnalysis.keywords);
                if (!analysis.purpose)
                    analysis.purpose = contentAnalysis.purpose;
                if (!analysis.projectAffiliation)
                    analysis.projectAffiliation = contentAnalysis.projectAffiliation;
                analysis.reasoning.push(...contentAnalysis.reasoning);
                // Override type if content suggests something different
                if (contentAnalysis.isSecret)
                    analysis.isSecret = true;
                if (contentAnalysis.isTemplate)
                    analysis.isTemplate = true;
                if (contentAnalysis.isPlanningDoc)
                    analysis.isPlanningDoc = true;
            }
            catch (error) {
                analysis.reasoning.push(`Could not read file content: ${error}`);
            }
        }
        // Step 4: Determine suggested location
        const locationSuggestion = this.suggestLocation(analysis, metadata);
        analysis.suggestedLocation = locationSuggestion.location;
        analysis.confidence = locationSuggestion.confidence;
        analysis.reasoning.push(locationSuggestion.reason);
        return analysis;
    }
    /**
     * Get file metadata
     */
    async getFileMetadata(filePath) {
        const stats = await fs.stat(filePath);
        const name = path.basename(filePath);
        const extension = path.extname(filePath);
        return {
            name,
            extension,
            size: stats.size,
            path: filePath,
            modifiedTime: stats.mtime
        };
    }
    /**
     * Analyze file extension to determine type
     */
    analyzeExtension(extension) {
        const ext = extension.toLowerCase();
        const fileTypes = this.folderMap.fileTypes;
        // Check against defined file types
        for (const [typeName, typeInfo] of Object.entries(fileTypes)) {
            const info = typeInfo;
            if (info.extensions && info.extensions.includes(ext)) {
                return {
                    type: typeName,
                    reason: `Extension ${ext} matches ${typeName} file type`
                };
            }
        }
        return {
            type: 'unknown',
            reason: `Extension ${ext} not recognized`
        };
    }
    /**
     * Analyze file name for patterns
     */
    analyzeFileName(fileName) {
        const lower = fileName.toLowerCase();
        const result = {
            isSecret: false,
            isTemplate: false,
            isTemporary: false,
            isPlanningDoc: false,
            reason: ''
        };
        // Check against naming convention patterns from folder-map
        if (this.folderMap.organizationRules?.nameBased?.patterns) {
            const patterns = this.folderMap.organizationRules.nameBased.patterns;
            for (const [pattern, location] of Object.entries(patterns)) {
                // Convert glob pattern to regex
                const regexPattern = pattern
                    .replace(/\./g, '\\.')
                    .replace(/\*/g, '.*')
                    .replace(/\?/g, '.');
                const regex = new RegExp(`^${regexPattern}$`, 'i');
                if (regex.test(fileName)) {
                    // Determine what type based on pattern
                    if (pattern.includes('GOAL_') || pattern.includes('ROADMAP_') ||
                        pattern.includes('PLAN_') || pattern.includes('IDEA_')) {
                        result.isPlanningDoc = true;
                    }
                    result.suggestedLocation = location;
                    result.confidence = 0.85; // High confidence for name-based matching
                    result.reason = `Filename matches pattern '${pattern}' → ${location}`;
                    return result;
                }
            }
        }
        // Fallback to traditional patterns
        // Check for secrets
        const secretPatterns = ['credential', 'token', 'secret', 'key', 'password', 'api-key', '.env'];
        if (secretPatterns.some(pattern => lower.includes(pattern))) {
            result.isSecret = true;
            result.reason = 'Filename suggests this contains secrets';
            return result;
        }
        // Check for templates
        const templatePatterns = ['template', '-template.', 'template-'];
        if (templatePatterns.some(pattern => lower.includes(pattern))) {
            result.isTemplate = true;
            result.reason = 'Filename suggests this is a template';
            return result;
        }
        // Check for temporary files
        const tempPatterns = ['temp', 'tmp', 'scratch', 'test-', 'draft'];
        if (tempPatterns.some(pattern => lower.includes(pattern))) {
            result.isTemporary = true;
            result.reason = 'Filename suggests this is temporary';
            return result;
        }
        // Check for planning documents
        const planningPatterns = ['plan', 'idea', 'roadmap', 'proposal', 'brainstorm'];
        if (planningPatterns.some(pattern => lower.includes(pattern))) {
            result.isPlanningDoc = true;
            result.reason = 'Filename suggests this is a planning document';
            return result;
        }
        return result;
    }
    /**
     * Analyze file content
     */
    analyzeContent(content, fileName) {
        const keywords = [];
        const reasoning = [];
        let purpose = '';
        let isSecret = false;
        let isTemplate = false;
        let isPlanningDoc = false;
        let projectAffiliation;
        const lower = content.toLowerCase();
        const lines = content.split('\n');
        // Check for secrets in content
        const secretKeywords = ['api_key', 'secret_key', 'password', 'credential', 'bearer', 'oauth'];
        for (const keyword of secretKeywords) {
            if (lower.includes(keyword)) {
                keywords.push(keyword);
                isSecret = true;
            }
        }
        if (isSecret) {
            reasoning.push('Content contains sensitive keywords (API keys, credentials, etc.)');
        }
        // Check for template indicators
        const templateKeywords = ['{{', '${', '<template>', '[template]', 'REPLACE_ME', 'TODO: Fill'];
        for (const keyword of templateKeywords) {
            if (content.includes(keyword)) {
                keywords.push('template-placeholder');
                isTemplate = true;
                break;
            }
        }
        if (isTemplate) {
            reasoning.push('Content contains template placeholders');
        }
        // Check for planning document indicators
        const planningKeywords = ['# idea', '# proposal', '# plan', 'future enhancement', 'roadmap'];
        for (const keyword of planningKeywords) {
            if (lower.includes(keyword)) {
                keywords.push(keyword);
                isPlanningDoc = true;
            }
        }
        if (isPlanningDoc) {
            reasoning.push('Content suggests this is a planning or ideation document');
        }
        // Try to detect project affiliation
        // Look for project names in first 20 lines
        const projectIndicators = ['# project:', 'project name:', '## project:', 'belongs to:'];
        for (let i = 0; i < Math.min(20, lines.length); i++) {
            const line = lines[i].toLowerCase();
            for (const indicator of projectIndicators) {
                if (line.includes(indicator)) {
                    const parts = lines[i].split(':');
                    if (parts.length > 1) {
                        projectAffiliation = parts[1].trim();
                        reasoning.push(`File indicates it belongs to project: ${projectAffiliation}`);
                        break;
                    }
                }
            }
            if (projectAffiliation)
                break;
        }
        // Determine purpose from headings (markdown)
        if (fileName.endsWith('.md')) {
            const headings = lines.filter(line => line.startsWith('#'));
            if (headings.length > 0) {
                purpose = headings[0].replace(/^#+\s*/, '').trim();
                reasoning.push(`Document purpose from heading: ${purpose}`);
            }
        }
        // Look for common code patterns
        if (lower.includes('function') || lower.includes('class') || lower.includes('def ')) {
            keywords.push('code');
            reasoning.push('Contains code constructs (functions/classes)');
        }
        // Look for documentation patterns
        if (lower.includes('## installation') || lower.includes('## usage') || lower.includes('## api')) {
            keywords.push('documentation');
            reasoning.push('Contains documentation structure');
        }
        return {
            keywords,
            purpose,
            isSecret,
            isTemplate,
            isPlanningDoc,
            projectAffiliation,
            reasoning
        };
    }
    /**
     * Suggest location based on analysis
     */
    suggestLocation(analysis, metadata) {
        let location = '';
        let confidence = 0;
        let reason = '';
        // Priority 1: Use metadata if available (highest confidence)
        if (analysis.metadata) {
            const meta = analysis.metadata;
            // Check metadata.type for location hints
            if (meta.type) {
                const type = meta.type.toLowerCase();
                if (type === 'goal' || type === 'roadmap' || type === 'plan') {
                    location = 'planning-and-roadmap/';
                    confidence = 0.95;
                    reason = `Metadata type '${meta.type}' indicates planning document`;
                    return { location, confidence, reason };
                }
                if (type === 'spec' || type === 'specification' || type === 'design') {
                    location = meta.project ? `projects/${meta.project}/docs/` : '<project>/docs/';
                    confidence = 0.9;
                    reason = `Metadata type '${meta.type}' indicates project specification`;
                    return { location, confidence, reason };
                }
                if (type === 'guide' || type === 'tutorial' || type === 'reference') {
                    location = 'reference/docs/';
                    confidence = 0.9;
                    reason = `Metadata type '${meta.type}' indicates reference material`;
                    return { location, confidence, reason };
                }
            }
            // Check metadata.phase
            if (meta.phase) {
                const phase = meta.phase.toLowerCase();
                if (phase === 'planning' || phase === 'idea') {
                    location = 'future-ideas/';
                    confidence = 0.9;
                    reason = `Metadata phase '${meta.phase}' indicates planning stage`;
                    return { location, confidence, reason };
                }
                if (phase === 'active' || phase === 'in-progress' || phase === 'wip') {
                    location = 'active-work/<task-name>/';
                    confidence = 0.85;
                    reason = `Metadata phase '${meta.phase}' indicates active work`;
                    return { location, confidence, reason };
                }
                if (phase === 'development') {
                    location = 'projects-in-development/';
                    confidence = 0.85;
                    reason = `Metadata phase '${meta.phase}' indicates development stage`;
                    return { location, confidence, reason };
                }
                if (phase === 'stable' || phase === 'production') {
                    location = 'projects/';
                    confidence = 0.85;
                    reason = `Metadata phase '${meta.phase}' indicates stable/production stage`;
                    return { location, confidence, reason };
                }
            }
            // Use metadata.project if available
            if (meta.project && !location) {
                location = `projects/${meta.project}/`;
                confidence = 0.8;
                reason = `Metadata indicates project: ${meta.project}`;
                return { location, confidence, reason };
            }
        }
        // Priority 2: High confidence rules based on analysis
        if (analysis.isSecret) {
            location = 'config/';
            confidence = 0.95;
            reason = 'Secrets and credentials should be in config/';
            return { location, confidence, reason };
        }
        if (analysis.isTemplate) {
            location = 'reference/templates/';
            confidence = 0.9;
            reason = 'Templates belong in reference/templates/';
            return { location, confidence, reason };
        }
        if (analysis.isTemporary) {
            location = 'temp/';
            confidence = 0.85;
            reason = 'Temporary files belong in temp/';
            return { location, confidence, reason };
        }
        if (analysis.isPlanningDoc) {
            location = 'future-ideas/';
            confidence = 0.8;
            reason = 'Planning documents belong in future-ideas/';
            return { location, confidence, reason };
        }
        // Project affiliation
        if (analysis.projectAffiliation) {
            location = `projects/${analysis.projectAffiliation}/`;
            confidence = 0.75;
            reason = `File indicates it belongs to project: ${analysis.projectAffiliation}`;
            return { location, confidence, reason };
        }
        // Medium confidence rules based on file type
        if (analysis.fileType === 'documentation') {
            if (metadata.name.toLowerCase() === 'readme.md') {
                location = 'context-dependent';
                confidence = 0.5;
                reason = 'README files need context to determine location';
            }
            else {
                location = 'reference/docs/';
                confidence = 0.6;
                reason = 'Documentation files typically belong in reference/docs/';
            }
            return { location, confidence, reason };
        }
        if (analysis.fileType === 'code') {
            location = 'active-work/<task-name>/ or projects/<project-name>/';
            confidence = 0.5;
            reason = 'Code files should be in a project or active work folder';
            return { location, confidence, reason };
        }
        if (analysis.fileType === 'config') {
            location = 'config/ or <project-root>/';
            confidence = 0.6;
            reason = 'Config files belong in config/ or project root';
            return { location, confidence, reason };
        }
        // Low confidence fallback
        location = 'Cannot determine - needs human decision';
        confidence = 0.2;
        reason = 'Unable to determine appropriate location from analysis';
        return { location, confidence, reason };
    }
    /**
     * Check if file is a text file that can be analyzed
     */
    isTextFile(extension) {
        const textExtensions = [
            '.md', '.txt', '.js', '.ts', '.py', '.java', '.cpp', '.c', '.go', '.rs',
            '.rb', '.php', '.swift', '.kt', '.json', '.yaml', '.yml', '.toml', '.ini',
            '.env', '.config', '.xml', '.html', '.css', '.scss', '.sql', '.sh'
        ];
        return textExtensions.includes(extension.toLowerCase());
    }
    /**
     * Parse YAML frontmatter from markdown files
     * Format: ---\nkey: value\n---
     */
    parseYAMLFrontmatter(content) {
        const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
        const match = content.match(frontmatterRegex);
        if (!match)
            return null;
        const yamlContent = match[1];
        const metadata = {};
        // Simple YAML parser (handles basic key: value and key: [array] formats)
        const lines = yamlContent.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#'))
                continue;
            // Handle key: value
            const colonIndex = trimmed.indexOf(':');
            if (colonIndex === -1)
                continue;
            const key = trimmed.substring(0, colonIndex).trim();
            let value = trimmed.substring(colonIndex + 1).trim();
            // Handle arrays: key: [item1, item2]
            if (value.startsWith('[') && value.endsWith(']')) {
                const arrayContent = value.substring(1, value.length - 1);
                metadata[key] = arrayContent.split(',').map(item => item.trim().replace(/^["']|["']$/g, ''));
            }
            // Handle quoted strings
            else if (value.startsWith('"') || value.startsWith("'")) {
                metadata[key] = value.replace(/^["']|["']$/g, '');
            }
            // Handle plain values
            else {
                metadata[key] = value;
            }
        }
        return Object.keys(metadata).length > 0 ? metadata : null;
    }
    /**
     * Parse JSON metadata blocks from code files
     * Formats:
     * - /** @metadata {...} *\/ (JSDoc-style)
     * - /* @metadata {...} *\/ (C-style comment)
     */
    parseJSONMetadata(content) {
        // Try to find @metadata JSON blocks in comments
        const patterns = [
            /\/\*\*?\s*\n?\s*@metadata\s*(\{[\s\S]*?\})\s*\*\//g, // /** @metadata {...} */
            /\/\*\s*\n?\s*@metadata\s*(\{[\s\S]*?\})\s*\*\//g, // /* @metadata {...} */
        ];
        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match && match[1]) {
                try {
                    const metadata = JSON.parse(match[1]);
                    return metadata;
                }
                catch (error) {
                    // Invalid JSON, continue
                }
            }
        }
        return null;
    }
    /**
     * Parse HTML/XML style comment tags
     * Format: <!-- key: value -->
     * Also handles multi-line: <!--\n key: value\n key2: value2\n -->
     */
    parseCommentTags(content) {
        const commentRegex = /<!--([\s\S]*?)-->/g;
        const matches = content.matchAll(commentRegex);
        const metadata = {};
        for (const match of matches) {
            const commentContent = match[1].trim();
            const lines = commentContent.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed)
                    continue;
                // Parse key: value pairs
                const colonIndex = trimmed.indexOf(':');
                if (colonIndex === -1)
                    continue;
                const key = trimmed.substring(0, colonIndex).trim();
                let value = trimmed.substring(colonIndex + 1).trim();
                // Handle arrays: [item1, item2, item3]
                if (value.startsWith('[') && value.endsWith(']')) {
                    const arrayContent = value.substring(1, value.length - 1);
                    metadata[key] = arrayContent.split(',').map(item => item.trim());
                }
                else {
                    metadata[key] = value;
                }
            }
        }
        return Object.keys(metadata).length > 0 ? metadata : null;
    }
    /**
     * Extract all metadata from content using all available parsers
     */
    extractAllMetadata(content, fileExtension) {
        let metadata = null;
        // Try YAML frontmatter (markdown files)
        if (fileExtension === '.md') {
            metadata = this.parseYAMLFrontmatter(content);
            if (metadata)
                return metadata;
        }
        // Try JSON metadata (code files)
        if (['.js', '.ts', '.jsx', '.tsx', '.java', '.cpp', '.c', '.go', '.rs'].includes(fileExtension)) {
            metadata = this.parseJSONMetadata(content);
            if (metadata)
                return metadata;
        }
        // Try comment tags (HTML, XML, markdown)
        if (['.md', '.html', '.xml', '.svg'].includes(fileExtension)) {
            metadata = this.parseCommentTags(content);
            if (metadata)
                return metadata;
        }
        return null;
    }
    /**
     * Batch analyze multiple files
     */
    async analyzeFiles(filePaths) {
        const results = new Map();
        for (const filePath of filePaths) {
            try {
                const analysis = await this.analyzeFile(filePath);
                results.set(filePath, analysis);
            }
            catch (error) {
                console.error(`Error analyzing ${filePath}:`, error);
            }
        }
        return results;
    }
}
//# sourceMappingURL=content-analyzer.js.map