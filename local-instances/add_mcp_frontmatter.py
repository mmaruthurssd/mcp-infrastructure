#!/usr/bin/env python3
"""
Add YAML frontmatter to MCP server markdown files in local-instances.

This script intelligently adds metadata to markdown files based on:
- MCP server name (detected from path)
- File name patterns (README, guide, spec, etc.)
- Content analysis (first few lines)
"""

import os
import re
from pathlib import Path
from typing import Dict, List, Optional

class MCPFrontmatterAdder:
    def __init__(self, base_dir: str):
        self.base_dir = Path(base_dir)
        self.stats = {
            'processed': 0,
            'skipped': 0,
            'errors': 0
        }

    def has_frontmatter(self, content: str) -> bool:
        """Check if file already has YAML frontmatter."""
        return content.strip().startswith('---')

    def detect_project(self, file_path: Path) -> str:
        """Detect MCP server/project name from file path."""
        parts = file_path.parts

        # Find mcp-servers or tools directory index
        if 'mcp-servers' in parts:
            idx = parts.index('mcp-servers')
            if idx + 1 < len(parts):
                return parts[idx + 1]

        return 'local-instances'

    def infer_type(self, filename: str, content: str) -> str:
        """Infer document type from filename and content."""
        filename_lower = filename.lower()

        if filename_lower == 'readme.md':
            return 'readme'
        elif 'guide' in filename_lower:
            return 'guide'
        elif 'spec' in filename_lower or 'specification' in filename_lower:
            return 'specification'
        elif 'template' in filename_lower:
            return 'template'
        elif 'workflow' in filename_lower:
            return 'guide'
        elif 'troubleshooting' in filename_lower:
            return 'reference'
        elif 'installation' in filename_lower or 'setup' in filename_lower:
            return 'guide'
        elif 'test' in filename_lower:
            return 'specification'
        else:
            return 'reference'

    def extract_tags(self, filename: str, project: str, content: str) -> List[str]:
        """Extract relevant tags from filename, project, and content."""
        tags = set()

        # Add project-based tags
        if 'mcp' in project.lower():
            tags.add('MCP')

        # Common MCP server tags
        if 'server' in project.lower():
            tags.add('mcp-server')

        # Filename-based tags
        filename_lower = filename.lower()
        tag_patterns = {
            'installation': ['installation', 'setup'],
            'workflow': ['workflow', 'process'],
            'guide': ['guide', 'tutorial'],
            'specification': ['specification', 'spec'],
            'troubleshooting': ['troubleshooting', 'debugging'],
            'template': ['template', 'pattern'],
            'test': ['testing', 'validation'],
            'integration': ['integration', 'cross-server'],
            'verification': ['verification', 'validation'],
            'quick': ['quick-start', 'getting-started'],
        }

        for tag, keywords in tag_patterns.items():
            if any(kw in filename_lower for kw in keywords):
                tags.add(tag)

        # Content-based tags (first 500 chars)
        content_sample = content[:500].lower()
        content_keywords = {
            'automation': ['automat', 'script'],
            'configuration': ['config', 'settings'],
            'deployment': ['deploy', 'production'],
            'documentation': ['document', 'readme'],
            'API': ['api', 'endpoint'],
            'workflow': ['workflow', 'process'],
        }

        for tag, keywords in content_keywords.items():
            if any(kw in content_sample for kw in keywords):
                tags.add(tag)

        # Add project name as tag
        project_clean = project.replace('-mcp-server', '').replace('-', ' ').title()
        tags.add(project_clean.lower().replace(' ', '-'))

        return sorted(list(tags))[:8]  # Limit to 8 most relevant tags

    def determine_status(self, content: str, filename: str) -> str:
        """Determine document status from content and filename."""
        if 'wip' in filename.lower() or 'draft' in filename.lower():
            return 'draft'

        content_lower = content.lower()

        # Check for completion indicators
        if 'complete' in content_lower or 'production ready' in content_lower:
            return 'completed'

        # READMEs are typically completed
        if filename.lower() == 'readme.md':
            return 'completed'

        # Templates and tests might be in-progress
        if 'template' in filename.lower() or 'test' in filename.lower():
            return 'in-progress'

        return 'completed'  # Default for stable local instances

    def determine_priority(self, filename: str, doc_type: str) -> str:
        """Determine priority based on filename and type."""
        filename_lower = filename.lower()

        # Critical files
        if filename_lower == 'readme.md':
            return 'high'
        if 'installation' in filename_lower or 'setup' in filename_lower:
            return 'high'
        if 'troubleshooting' in filename_lower:
            return 'high'

        # High priority
        if doc_type in ['guide', 'specification']:
            return 'high'

        # Medium priority
        if 'template' in filename_lower or 'example' in filename_lower:
            return 'medium'

        return 'medium'

    def generate_frontmatter(self, file_path: Path, content: str) -> str:
        """Generate appropriate YAML frontmatter for a file."""
        filename = file_path.name
        project = self.detect_project(file_path)
        doc_type = self.infer_type(filename, content)
        tags = self.extract_tags(filename, project, content)
        status = self.determine_status(content, filename)
        priority = self.determine_priority(filename, doc_type)

        # Determine category
        if 'mcp-server' in project:
            category = 'mcp-servers'
        else:
            category = 'tools'

        frontmatter = f"""---
type: {doc_type}
phase: stable
project: {project}
tags: [{', '.join(tags)}]
category: {category}
status: {status}
priority: {priority}
---

"""
        return frontmatter

    def process_file(self, file_path: Path) -> bool:
        """Process a single markdown file."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Skip if already has frontmatter
            if self.has_frontmatter(content):
                self.stats['skipped'] += 1
                return False

            # Generate and add frontmatter
            frontmatter = self.generate_frontmatter(file_path, content)
            new_content = frontmatter + content

            # Write back
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)

            self.stats['processed'] += 1
            print(f"✓ Added frontmatter to: {file_path.relative_to(self.base_dir)}")
            return True

        except Exception as e:
            self.stats['errors'] += 1
            print(f"✗ Error processing {file_path}: {e}")
            return False

    def find_markdown_files(self) -> List[Path]:
        """Find all markdown files, excluding node_modules."""
        md_files = []
        for md_file in self.base_dir.rglob('*.md'):
            # Skip node_modules
            if 'node_modules' in md_file.parts:
                continue
            md_files.append(md_file)
        return md_files

    def run(self):
        """Process all markdown files in the directory."""
        print(f"Scanning for markdown files in: {self.base_dir}")
        md_files = self.find_markdown_files()

        print(f"\nFound {len(md_files)} markdown files (excluding node_modules)")
        print("Processing files...\n")

        for md_file in sorted(md_files):
            self.process_file(md_file)

        print("\n" + "="*60)
        print("PROCESSING COMPLETE")
        print("="*60)
        print(f"Files processed: {self.stats['processed']}")
        print(f"Files skipped (already have frontmatter): {self.stats['skipped']}")
        print(f"Errors: {self.stats['errors']}")
        print(f"Total files: {len(md_files)}")


if __name__ == '__main__':
    import sys

    # Base directory
    base_dir = '/Users/mmaruthurnew/Desktop/medical-practice-workspace/local-instances'

    # Check for dry-run flag
    if '--dry-run' in sys.argv:
        print("DRY RUN MODE - No files will be modified")
        print("Remove --dry-run flag to actually process files")
        sys.exit(0)

    # Run the processor
    processor = MCPFrontmatterAdder(base_dir)
    processor.run()
