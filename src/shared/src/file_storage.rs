// File Storage System for Multi-Tenant LMS
// Handles chunked uploads, streaming downloads, and metadata management

#[cfg(feature = "stable-storage")]
use ic_stable_structures::{Storable, storable::Bound};

use candid::{CandidType, Deserialize};
use serde::Serialize;
use std::borrow::Cow;
use crate::error::{LMSError, LMSResult};
use crate::utils::current_time;

// File metadata structure
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct FileMetadata {
    pub file_id: String,
    pub file_name: String,
    pub file_size: u64,
    pub file_type: String,
    pub content_type: String,
    pub uploader_id: String,
    pub upload_date: u64,
    pub last_modified: u64,
    pub checksum: String, // SHA-256 hash for integrity
    pub chunk_count: u32,
    pub privacy_level: PrivacyLevel,
    pub owner_type: OwnerType,
    pub tags: Vec<String>,
    pub description: Option<String>,
    pub is_public: bool,
    pub download_count: u64,
    pub version: u32,
}

#[derive(CandidType, Deserialize, Serialize, Clone, Copy, Debug, PartialEq)]
pub enum PrivacyLevel {
    Public,     // Anyone can access
    TenantOnly, // Only users in the same tenant
    Private,    // Only owner and admins
    Assignment, // Only for specific assignment
}

#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub enum OwnerType {
    User(String),
    Assignment(String),
    System,
}

// File chunk for streaming uploads/downloads
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct FileChunk {
    pub chunk_id: String,
    pub file_id: String,
    pub chunk_index: u32,
    pub data: Vec<u8>,
    pub checksum: String,
    pub upload_date: u64,
}

// Upload session for managing chunked uploads
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct UploadSession {
    pub session_id: String,
    pub file_id: String,
    pub uploader_id: String,
    pub total_chunks: u32,
    pub uploaded_chunks: Vec<u32>,
    pub file_metadata: FileMetadata,
    pub created_at: u64,
    pub expires_at: u64,
    pub is_complete: bool,
}

// Download stream configuration
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct DownloadStream {
    pub stream_id: String,
    pub file_id: String,
    pub requester_id: String,
    pub start_chunk: u32,
    pub end_chunk: u32,
    pub created_at: u64,
    pub expires_at: u64,
}

// File access permissions
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct FilePermissions {
    pub can_read: bool,
    pub can_write: bool,
    pub can_delete: bool,
    pub can_share: bool,
}

// File operation result
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct FileOperationResult {
    pub success: bool,
    pub file_id: Option<String>,
    pub session_id: Option<String>,
    pub stream_id: Option<String>,
    pub message: String,
    pub bytes_processed: u64,
}

// Cache configuration for CDN-style optimization
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct CacheConfig {
    pub cache_duration: u64, // seconds
    pub max_cache_size: u64, // bytes
    pub cache_public_only: bool,
    pub enable_compression: bool,
}

// File statistics for analytics
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub struct FileStats {
    pub total_files: u64,
    pub total_size: u64,
    pub files_by_type: Vec<(String, u64)>,
    pub most_downloaded: Vec<(String, u64)>,
    pub storage_usage_by_user: Vec<(String, u64)>,
    pub cache_hit_ratio: f64,
}

// Constants
pub const MAX_CHUNK_SIZE: usize = 1_000_000; // 1MB per chunk
pub const MAX_FILE_SIZE: u64 = 100_000_000_000; // 100GB max file size
pub const UPLOAD_SESSION_TIMEOUT: u64 = 3600; // 1 hour
pub const DOWNLOAD_STREAM_TIMEOUT: u64 = 1800; // 30 minutes
pub const MAX_FILES_PER_USER: u64 = 10000;
pub const MAX_STORAGE_PER_USER: u64 = 10_000_000_000; // 10GB per user

impl Storable for FileMetadata {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: 2048,
        is_fixed_size: false,
    };
}

impl Storable for FileChunk {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: 1_048_576,
        is_fixed_size: false,
    };
}

impl Storable for UploadSession {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: 4096,
        is_fixed_size: false,
    };
}

impl Storable for DownloadStream {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: 1024,
        is_fixed_size: false,
    };
}

impl Storable for FileStats {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: 8192,
        is_fixed_size: false,
    };
}

impl FileMetadata {
    /// Create new file metadata
    pub fn new(
        file_name: String,
        file_size: u64,
        content_type: String,
        uploader_id: String,
        privacy_level: PrivacyLevel,
        owner_type: OwnerType,
    ) -> Self {
        let file_id = Self::generate_file_id(&file_name, &uploader_id);
        let chunk_count = Self::calculate_chunk_count(file_size);
        
        Self {
            file_id,
            file_name,
            file_size,
            file_type: Self::extract_file_type(&content_type),
            content_type,
            uploader_id,
            upload_date: current_time(),
            last_modified: current_time(),
            checksum: String::new(), // Will be set after upload
            chunk_count,
            privacy_level,
            owner_type,
            tags: Vec::new(),
            description: None,
            is_public: privacy_level == PrivacyLevel::Public,
            download_count: 0,
            version: 1,
        }
    }

    /// Generate unique file ID
    fn generate_file_id(file_name: &str, uploader_id: &str) -> String {
        let timestamp = current_time();
        format!("file_{}_{}__{}", uploader_id, timestamp, file_name.len())
    }

    /// Calculate number of chunks needed
    fn calculate_chunk_count(file_size: u64) -> u32 {
        ((file_size + MAX_CHUNK_SIZE as u64 - 1) / MAX_CHUNK_SIZE as u64) as u32
    }

    /// Extract file type from content type
    fn extract_file_type(content_type: &str) -> String {
        match content_type {
            s if s.starts_with("image/") => "image".to_string(),
            s if s.starts_with("video/") => "video".to_string(),
            s if s.starts_with("audio/") => "audio".to_string(),
            s if s.starts_with("application/pdf") => "pdf".to_string(),
            s if s.contains("document") => "document".to_string(),
            s if s.contains("spreadsheet") => "spreadsheet".to_string(),
            s if s.contains("presentation") => "presentation".to_string(),
            _ => "other".to_string(),
        }
    }

    /// Check if file can be cached
    pub fn is_cacheable(&self) -> bool {
        matches!(
            self.privacy_level,
            PrivacyLevel::Public | PrivacyLevel::TenantOnly
        ) && self.file_size < 10_000_000 // Cache files under 10MB
    }

    /// Update download count
    pub fn increment_download_count(&mut self) {
        self.download_count += 1;
        self.last_modified = current_time();
    }
}

impl UploadSession {
    /// Create new upload session
    pub fn new(
        uploader_id: String,
        file_metadata: FileMetadata,
    ) -> Self {
        let session_id = Self::generate_session_id(&uploader_id);
        let now = current_time();
        
        Self {
            session_id,
            file_id: file_metadata.file_id.clone(),
            uploader_id,
            total_chunks: file_metadata.chunk_count,
            uploaded_chunks: Vec::new(),
            file_metadata,
            created_at: now,
            expires_at: now + UPLOAD_SESSION_TIMEOUT * 1_000_000_000, // Convert to nanoseconds
            is_complete: false,
        }
    }

    /// Generate unique session ID
    fn generate_session_id(uploader_id: &str) -> String {
        let timestamp = current_time();
        format!("session_{}_{}", uploader_id, timestamp)
    }

    /// Check if session is expired
    pub fn is_expired(&self) -> bool {
        current_time() > self.expires_at
    }

    /// Add uploaded chunk
    pub fn add_chunk(&mut self, chunk_index: u32) -> LMSResult<()> {
        if self.is_expired() {
            return Err(LMSError::ValidationError("Upload session expired".to_string()));
        }

        if !self.uploaded_chunks.contains(&chunk_index) {
            self.uploaded_chunks.push(chunk_index);
            self.uploaded_chunks.sort();
        }

        // Check if upload is complete
        if self.uploaded_chunks.len() == self.total_chunks as usize {
            self.is_complete = true;
        }

        Ok(())
    }

    /// Get missing chunks
    pub fn get_missing_chunks(&self) -> Vec<u32> {
        (0..self.total_chunks)
            .filter(|i| !self.uploaded_chunks.contains(i))
            .collect()
    }

    /// Get upload progress percentage
    pub fn get_progress(&self) -> f64 {
        if self.total_chunks == 0 {
            return 100.0;
        }
        (self.uploaded_chunks.len() as f64 / self.total_chunks as f64) * 100.0
    }
}

impl FileChunk {
    /// Create new file chunk
    pub fn new(
        file_id: String,
        chunk_index: u32,
        data: Vec<u8>,
    ) -> Self {
        let chunk_id = Self::generate_chunk_id(&file_id, chunk_index);
        let checksum = Self::calculate_checksum(&data);
        
        Self {
            chunk_id,
            file_id,
            chunk_index,
            data,
            checksum,
            upload_date: current_time(),
        }
    }

    /// Generate unique chunk ID
    fn generate_chunk_id(file_id: &str, chunk_index: u32) -> String {
        format!("{}_chunk_{}", file_id, chunk_index)
    }

    /// Calculate chunk checksum (simplified)
    fn calculate_checksum(data: &[u8]) -> String {
        // In production, use proper SHA-256
        format!("sha256_{}", data.len())
    }

    /// Verify chunk integrity
    pub fn verify_integrity(&self) -> bool {
        let expected_checksum = Self::calculate_checksum(&self.data);
        self.checksum == expected_checksum
    }
}

/// File access control utilities
pub mod access_control {
    use super::*;

    /// Check if user has permission to access file
    pub fn check_file_access(
        file_metadata: &FileMetadata,
        user_id: &str,
        user_role: &str,
    ) -> FilePermissions {
        match file_metadata.privacy_level {
            PrivacyLevel::Public => FilePermissions {
                can_read: true,
                can_write: false,
                can_delete: false,
                can_share: true,
            },
            PrivacyLevel::Private => {
                let is_owner = file_metadata.uploader_id == user_id;
                let is_admin = user_role == "admin";
                FilePermissions {
                    can_read: is_owner || is_admin,
                    can_write: is_owner || is_admin,
                    can_delete: is_owner || is_admin,
                    can_share: is_owner,
                }
            },
            PrivacyLevel::TenantOnly => FilePermissions {
                can_read: true, // Assume same tenant
                can_write: file_metadata.uploader_id == user_id,
                can_delete: file_metadata.uploader_id == user_id || user_role == "admin",
                can_share: true,
            },
            
            PrivacyLevel::Assignment => {
                let is_owner = file_metadata.uploader_id == user_id;
                let is_instructor = user_role == "instructor" || user_role == "admin";
                FilePermissions {
                    can_read: is_owner || is_instructor,
                    can_write: is_owner,
                    can_delete: is_owner || is_instructor,
                    can_share: is_instructor,
                }
            },
        }
    }
}

/// Utility functions for file operations
pub mod utils {
    use super::*;

    /// Validate file name
    pub fn validate_file_name(file_name: &str) -> LMSResult<()> {
        if file_name.is_empty() || file_name.len() > 255 {
            return Err(LMSError::ValidationError("Invalid file name length".to_string()));
        }

        let forbidden_chars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|'];
        if file_name.chars().any(|c| forbidden_chars.contains(&c)) {
            return Err(LMSError::ValidationError("File name contains forbidden characters".to_string()));
        }

        Ok(())
    }

    /// Validate file size
    pub fn validate_file_size(file_size: u64) -> LMSResult<()> {
        if file_size == 0 {
            return Err(LMSError::ValidationError("File cannot be empty".to_string()));
        }

        if file_size > MAX_FILE_SIZE {
            return Err(LMSError::ValidationError(format!("File size exceeds maximum of {} bytes", MAX_FILE_SIZE)));
        }

        Ok(())
    }

    /// Get MIME type from file extension
    pub fn get_mime_type(file_name: &str) -> String {
        let extension = file_name.split('.').last().unwrap_or("").to_lowercase();
        match extension.as_str() {
            "jpg" | "jpeg" => "image/jpeg",
            "png" => "image/png",
            "gif" => "image/gif",
            "pdf" => "application/pdf",
            "doc" => "application/msword",
            "docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "xls" => "application/vnd.ms-excel",
            "xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "ppt" => "application/vnd.ms-powerpoint",
            "pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "txt" => "text/plain",
            "html" => "text/html",
            "css" => "text/css",
            "js" => "application/javascript",
            "json" => "application/json",
            "xml" => "application/xml",
            "zip" => "application/zip",
            "mp4" => "video/mp4",
            "mp3" => "audio/mpeg",
            "wav" => "audio/wav",
            _ => "application/octet-stream",
        }.to_string()
    }

    /// Calculate optimal chunk size for file
    pub fn get_optimal_chunk_size(file_size: u64) -> usize {
        if file_size < 10_000_000 { // < 10MB
            500_000 // 500KB chunks
        } else if file_size < 100_000_000 { // < 100MB
            1_000_000 // 1MB chunks
        } else {
            2_000_000 // 2MB chunks for large files
        }
    }
}
