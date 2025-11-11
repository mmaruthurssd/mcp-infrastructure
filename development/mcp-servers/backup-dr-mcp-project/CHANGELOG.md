# Changelog - Backup & Disaster Recovery MCP

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-11-07

### Added
- **SECURITY.md** - Critical security policy for backup and disaster recovery operations
  - PHI scanning and detection security measures (CRITICAL)
  - Backup encryption security requirements (AES-256)
  - Backup storage security best practices
  - Restore operation security guidelines
  - Backup scheduling security considerations
  - HIPAA compliance requirements and procedures
  - Disaster recovery security procedures
  - Backup testing requirements (weekly, monthly, quarterly)

### Documentation
- Enhanced security documentation for CRITICAL security infrastructure component
- Added HIPAA compliance requirements for PHI backups
- Documented encryption key management procedures
- Added disaster recovery testing schedules
- Documented incident response procedures for backup failures

### Security
- Emphasized **NEVER disable encryption** for medical practice backups
- Added PHI exposure response procedures
- Documented backup verification and integrity checking requirements
- Added retention policy security considerations

## [1.0.0] - 2025-11-07

### Initial Release
- Full and incremental backup support
- PHI detection and scanning with configurable sensitivity
- Backup scheduling with cron expressions
- AES-256 encryption for all backups
- Gzip compression with integrity checks
- SHA-256 checksums and manifest files
- Restore with dry-run preview and conflict detection
- Retention policy management (7 daily, 4 weekly, 12 monthly)
- Pre-restore safety backups

### Tools (9)
1. `create_backup` - Create backups with PHI scanning and encryption
2. `restore_backup` - Restore with dry-run, conflict detection, and safety backup
3. `list_backups` - Query and filter backups with statistics
4. `verify_backup` - Integrity verification with checksums
5. `schedule_backup` - Manage backup schedules with cron
6. `get_backup_status` - System status with health checks
7. `cleanup_old_backups` - Apply retention policies with dry-run
8. `export_backup_config` - Export configuration (JSON/YAML)
9. `archive_old_data` - Archive data with gzip compression
