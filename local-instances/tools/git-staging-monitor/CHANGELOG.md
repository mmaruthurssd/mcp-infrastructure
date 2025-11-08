---
type: reference
tags: [changelog, version-history]
---

# Git Staging Monitor - Changelog

All notable changes to this tool will be documented in this file.

## [2.0.0] - 2025-10-28

### Added - Enhanced Forensics
- **8 forensic analysis categories** (up from 5)
  - Git State Analysis
  - Process Analysis
  - File Access Analysis (NEW)
  - VS Code Extension Analysis (NEW)
  - Network Activity (NEW)
  - Shell History Analysis
  - System State
  - Configuration Analysis (NEW)

- **Real-time git index tracking** - Logs every index modification, not just mass staging
- **VS Code process tree analysis** - Shows open file handles per process
- **Extension analysis** - Lists all installed VS Code extensions with git-related filtering
- **File access tracking** - Uses `lsof` to identify which process is accessing .git/index
- **Network activity capture** - Shows VS Code network connections at time of incident
- **Configuration analysis** - Captures workspace and git config settings
- **Incident numbering system** - Each detection gets unique ID (#1, #2, etc.)
- **Dual log files** - Detailed forensics + condensed summary
- **Trigger analysis log** - Quick incident summaries for pattern analysis

### Changed
- **Check interval** reduced from 3 seconds to 2 seconds (faster detection)
- **Log structure** - Organized into 8 clear sections vs mixed output
- **Notification messages** - Include incident number
- **Process capture** - Full command lines (`ps auxww`) vs truncated (`ps aux`)
- **Script organization** - Moved to proper tool directory structure

### Improved
- **Baseline capture** on startup - Records initial state for comparison
- **Better error handling** - Graceful fallbacks if commands fail
- **More detailed process tracking** - Captures process tree hierarchy
- **Enhanced logging** - Structured sections with clear headers

### Fixed
- Log path handling for relocated tool
- Process filtering (removes grep/monitor from results)

---

## [1.0.0] - 2025-10-26

### Added - Initial Release
- Basic mass staging detection (>100 file deletions)
- Auto-unstaging functionality (`git restore --staged .`)
- Desktop notifications (macOS)
- Process snapshot capture
- Git status and reflog capture
- MCP server process listing
- Git open files detection
- Recent terminal commands
- Git index file stats
- System load monitoring
- Safety check counter (every 20 checks)
- Configurable threshold
- Background monitoring with 3-second intervals

### Features
- Real-time monitoring every 3 seconds
- Automatic file recovery
- Sound alerts (Basso for alert, Hero for recovery)
- Daily log rotation
- Process list capture
- VS Code process detection
- Git state analysis

### Documentation
- Basic README
- Pre-commit hook reference
- Log location guidance

---

## Historical Context

**Problem Statement:**
Starting October 26, 2025, mass git staging incidents were detected where 8000+ files were being staged for deletion unintentionally. Initial incidents occurred 17 times over 2 days before the enhanced monitoring was implemented.

**Evolution:**
- v1.0.0 (Oct 26): Created to detect and prevent incidents, with basic process logging
- v2.0.0 (Oct 28): Enhanced with comprehensive forensics to identify root cause

**Known Incidents:**
- Oct 26: 6 incidents (8038-8051 files each)
- Oct 27: 7 incidents (8136-8231 files)
- Oct 28: 4 incidents (8231 files) before enhanced monitoring deployed

**Outcome:**
All incidents were auto-recovered. No data loss occurred. Enhanced monitoring v2.0 deployed to identify trigger source.

---

## Roadmap

### Planned - v2.1 (Q1 2026)
- [ ] Web dashboard for log viewing
- [ ] Historical pattern detection
- [ ] Automatic trigger identification
- [ ] Weekly summary reports
- [ ] Email notifications

### Planned - v2.2 (Q2 2026)
- [ ] Slack integration
- [ ] Custom alert thresholds per file type
- [ ] Whitelist for known safe operations
- [ ] Integration with git-assistant MCP

### Planned - v3.0 (Q3 2026)
- [ ] Machine learning trigger prediction
- [ ] Preventive alerts (before staging occurs)
- [ ] Multi-repo monitoring
- [ ] Team analytics dashboard

---

## Migration Notes

### From v1.0 to v2.0

**Breaking Changes:**
- Log files moved from `.git-monitor-logs/` (root) to `local-instances/tools/git-staging-monitor/logs/`
- Script paths changed - now in `scripts/` subdirectory
- Symlink created for backward compatibility

**Migration Steps:**
1. Stop old monitor: `pkill -f monitor-git-staging`
2. Run install script: `./local-instances/tools/git-staging-monitor/scripts/install.sh`
3. Old logs automatically migrated to new location
4. New monitor starts with enhanced forensics

**Compatibility:**
- Old log files readable by new monitor
- Symlink maintains root-level `.git-monitor-logs/` access
- Git hooks unchanged

---

## Version Format

This project uses [Semantic Versioning](https://semver.org/):
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

---

**Last Updated:** 2025-10-28
