// File Storage Module for Tenant Canister
// Implements chunked upload/download and file management

use candid::candid_method;
use ic_cdk::{query, update};
use ic_stable_structures::StableBTreeMap;
use std::cell::RefCell;
use shared::file_storage::{
    FileMetadata, FileChunk, UploadSession, DownloadStream, FileOperationResult,
    FileStats, PrivacyLevel, OwnerType, access_control, utils,
    MAX_CHUNK_SIZE
};
use shared::{LMSError, LMSResult, current_time};
use crate::rbac::{require_authenticated, get_caller_role};
use crate::storage::{MEMORY_MANAGER, Memory};

// File storage maps using the existing memory manager
thread_local! {
    static FILE_METADATA: RefCell<StableBTreeMap<String, FileMetadata, Memory>> = 
        RefCell::new(StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(ic_stable_structures::memory_manager::MemoryId::new(8)))
        ));
    
    static FILE_CHUNKS: RefCell<StableBTreeMap<String, FileChunk, Memory>> = 
        RefCell::new(StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(ic_stable_structures::memory_manager::MemoryId::new(9)))
        ));
    
    static UPLOAD_SESSIONS: RefCell<StableBTreeMap<String, UploadSession, Memory>> = 
        RefCell::new(StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(ic_stable_structures::memory_manager::MemoryId::new(10)))
        ));
    
    static DOWNLOAD_STREAMS: RefCell<StableBTreeMap<String, DownloadStream, Memory>> = 
        RefCell::new(StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(ic_stable_structures::memory_manager::MemoryId::new(11)))
        ));
    
    static FILE_CACHE: RefCell<StableBTreeMap<String, Vec<u8>, Memory>> = 
        RefCell::new(StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(ic_stable_structures::memory_manager::MemoryId::new(12)))
        ));
    
    static STORAGE_STATS: RefCell<ic_stable_structures::StableCell<FileStats, Memory>> = 
        RefCell::new(ic_stable_structures::StableCell::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(ic_stable_structures::memory_manager::MemoryId::new(13))),
            FileStats {
                total_files: 0,
                total_size: 0,
                files_by_type: Vec::new(),
                most_downloaded: Vec::new(),
                storage_usage_by_user: Vec::new(),
                cache_hit_ratio: 0.0,
            }
        ).unwrap());
}

/// Initiate a new file upload session
#[update]
#[candid_method(update)]
pub fn initiate_file_upload(
    file_name: String,
    file_size: u64,
    content_type: String,
    privacy_level: PrivacyLevel,
    owner_type: OwnerType,
    description: Option<String>,
    tags: Vec<String>,
) -> LMSResult<FileOperationResult> {
    let caller_user = require_authenticated()?;
    let caller_id = caller_user.id.clone();
    
    // Validate inputs
    utils::validate_file_name(&file_name)?;
    utils::validate_file_size(file_size)?;
    
    // Check user storage quota
    check_user_storage_quota(&caller_id, file_size)?;
    
    // Create file metadata
    let mut file_metadata = FileMetadata::new(
        file_name,
        file_size,
        content_type,
        caller_id.clone(),
        privacy_level,
        owner_type,
    );
    
    file_metadata.description = description;
    file_metadata.tags = tags;
    
    // Create upload session
    let upload_session = UploadSession::new(caller_id, file_metadata.clone());
    let session_id = upload_session.session_id.clone();
    let file_id = upload_session.file_id.clone();
    
    // Store session and metadata
    UPLOAD_SESSIONS.with(|sessions| {
        sessions.borrow_mut().insert(session_id.clone(), upload_session);
    });
    
    FILE_METADATA.with(|metadata| {
        metadata.borrow_mut().insert(file_id.clone(), file_metadata);
    });
    
    Ok(FileOperationResult {
        success: true,
        file_id: Some(file_id),
        session_id: Some(session_id),
        stream_id: None,
        message: "Upload session initiated successfully".to_string(),
        bytes_processed: 0,
    })
}

/// Upload a file chunk
#[update]
#[candid_method(update)]
pub fn upload_file_chunk(
    session_id: String,
    chunk_index: u32,
    chunk_data: Vec<u8>,
) -> LMSResult<FileOperationResult> {
    let caller_user = require_authenticated()?;
    let caller_id = caller_user.id.clone();
    
    // Validate chunk size
    if chunk_data.len() > MAX_CHUNK_SIZE {
        return Err(LMSError::ValidationError("Chunk size exceeds maximum".to_string()));
    }
    
    // Get and validate upload session
    let mut upload_session = UPLOAD_SESSIONS.with(|sessions| {
        sessions.borrow().get(&session_id).ok_or(LMSError::NotFound("Upload session not found".to_string()))
    })?;
    
    if upload_session.uploader_id != caller_id {
        return Err(LMSError::Unauthorized("Not authorized for this upload session".to_string()));
    }
    
    if upload_session.is_expired() {
        return Err(LMSError::ValidationError("Upload session expired".to_string()));
    }
    
    // Create and store chunk
    let file_chunk = FileChunk::new(
        upload_session.file_id.clone(),
        chunk_index,
        chunk_data,
    );
    
    let bytes_processed = file_chunk.data.len() as u64;
    
    FILE_CHUNKS.with(|chunks| {
        chunks.borrow_mut().insert(file_chunk.chunk_id.clone(), file_chunk);
    });
    
    // Update upload session
    upload_session.add_chunk(chunk_index)?;
    
    let is_complete = upload_session.is_complete;
    let progress = upload_session.get_progress();
    let file_id_clone = upload_session.file_id.clone();
    
    UPLOAD_SESSIONS.with(|sessions| {
        sessions.borrow_mut().insert(session_id.clone(), upload_session.clone());
    });
    
    // If upload is complete, finalize the file
    if is_complete {
        finalize_file_upload(upload_session)?;
    }
    
    Ok(FileOperationResult {
        success: true,
        file_id: Some(file_id_clone),
        session_id: Some(session_id),
        stream_id: None,
        message: if is_complete {
            "File upload completed successfully".to_string()
        } else {
            format!("Chunk uploaded successfully. Progress: {:.1}%", progress)
        },
        bytes_processed,
    })
}

/// Get upload session status
#[query]
#[candid_method(query)]
pub fn get_upload_status(session_id: String) -> LMSResult<UploadSession> {
    let caller_user = require_authenticated()?;
    let caller_id = caller_user.id.clone();
    
    let upload_session = UPLOAD_SESSIONS.with(|sessions| {
        sessions.borrow().get(&session_id).ok_or(LMSError::NotFound("Upload session not found".to_string()))
    })?;
    
    if upload_session.uploader_id != caller_id {
        return Err(LMSError::Unauthorized("Not authorized for this upload session".to_string()));
    }
    
    Ok(upload_session)
}

/// Initiate file download stream
#[update]
#[candid_method(update)]
pub fn initiate_file_download(
    file_id: String,
    start_chunk: Option<u32>,
    end_chunk: Option<u32>,
) -> LMSResult<FileOperationResult> {
    let caller_user = require_authenticated()?;
    let caller_id = caller_user.id.clone();
    let caller_role = get_caller_role().unwrap_or_default();
    
    // Get file metadata
    let file_metadata = FILE_METADATA.with(|metadata| {
        metadata.borrow().get(&file_id).ok_or(LMSError::NotFound("File not found".to_string()))
    })?;
    
    // Check access permissions
    let permissions = access_control::check_file_access(
        &file_metadata,
        &caller_id,
        caller_role.as_str(),
    );
    
    if !permissions.can_read {
        return Err(LMSError::Unauthorized("Access denied to this file".to_string()));
    }
    
    // Check cache first for small files
    if file_metadata.is_cacheable() {
        if let Some(cached_data) = check_file_cache(&file_id) {
            update_cache_stats(true);
            return Ok(FileOperationResult {
                success: true,
                file_id: Some(file_id),
                session_id: None,
                stream_id: None,
                message: "File retrieved from cache".to_string(),
                bytes_processed: cached_data.len() as u64,
            });
        }
    }
    
    update_cache_stats(false);
    
    // Create download stream
    let stream_id = generate_stream_id(&caller_id, &file_id);
    let download_stream = DownloadStream {
        stream_id: stream_id.clone(),
        file_id: file_id.clone(),
        requester_id: caller_id,
        start_chunk: start_chunk.unwrap_or(0),
        end_chunk: end_chunk.unwrap_or(file_metadata.chunk_count - 1),
        created_at: current_time(),
        expires_at: current_time() + 1800_000_000_000, // 30 minutes
    };
    
    DOWNLOAD_STREAMS.with(|streams| {
        streams.borrow_mut().insert(stream_id.clone(), download_stream);
    });
    
    // Update download count
    let mut updated_metadata = file_metadata;
    updated_metadata.increment_download_count();
    FILE_METADATA.with(|metadata| {
        metadata.borrow_mut().insert(file_id.clone(), updated_metadata);
    });
    
    Ok(FileOperationResult {
        success: true,
        file_id: Some(file_id),
        session_id: None,
        stream_id: Some(stream_id),
        message: "Download stream initiated".to_string(),
        bytes_processed: 0,
    })
}

/// Download file chunk by stream
#[query]
#[candid_method(query)]
pub fn download_file_chunk(
    stream_id: String,
    chunk_index: u32,
) -> LMSResult<FileChunk> {
    let caller_user = require_authenticated()?;
    let caller_id = caller_user.id.clone();
    
    // Validate download stream
    let download_stream = DOWNLOAD_STREAMS.with(|streams| {
        streams.borrow().get(&stream_id).ok_or(LMSError::NotFound("Download stream not found".to_string()))
    })?;
    
    if download_stream.requester_id != caller_id {
        return Err(LMSError::Unauthorized("Not authorized for this download stream".to_string()));
    }
    
    if current_time() > download_stream.expires_at {
        return Err(LMSError::ValidationError("Download stream expired".to_string()));
    }
    
    if chunk_index < download_stream.start_chunk || chunk_index > download_stream.end_chunk {
        return Err(LMSError::ValidationError("Chunk index out of stream range".to_string()));
    }
    
    // Get chunk
    let chunk_id = format!("{}_chunk_{}", download_stream.file_id, chunk_index);
    let file_chunk = FILE_CHUNKS.with(|chunks| {
        chunks.borrow().get(&chunk_id).ok_or(LMSError::NotFound("File chunk not found".to_string()))
    })?;
    
    Ok(file_chunk)
}

/// Get file metadata
#[query]
#[candid_method(query)]
pub fn get_file_metadata(file_id: String) -> LMSResult<FileMetadata> {
    let caller_user = require_authenticated()?;
    let caller_id = caller_user.id.clone();
    let caller_role = get_caller_role().unwrap_or_default();
    
    let file_metadata = FILE_METADATA.with(|metadata| {
        metadata.borrow().get(&file_id).ok_or(LMSError::NotFound("File not found".to_string()))
    })?;
    
    // Check access permissions
    let permissions = access_control::check_file_access(
        &file_metadata,
        &caller_id,
        caller_role.as_str(),
    );
    
    if !permissions.can_read {
        return Err(LMSError::Unauthorized("Access denied to this file".to_string()));
    }
    
    Ok(file_metadata)
}

/// List files for user
#[query]
#[candid_method(query)]
pub fn list_user_files(
    user_id: Option<String>,
    privacy_filter: Option<PrivacyLevel>,
    file_type_filter: Option<String>,
    limit: Option<u32>,
    offset: Option<u32>,
) -> LMSResult<Vec<FileMetadata>> {
    let caller_user = require_authenticated()?;
    let caller_id = caller_user.id.clone();
    let caller_role = get_caller_role().unwrap_or_default();
    
    let target_user = user_id.unwrap_or(caller_id.clone());
    let limit = limit.unwrap_or(50).min(100) as usize;
    let offset = offset.unwrap_or(0) as usize;
    
    let mut accessible_files = Vec::new();
    
    FILE_METADATA.with(|metadata| {
        for (_, file_metadata) in metadata.borrow().iter() {
            // Apply user filter
            if file_metadata.uploader_id != target_user && target_user != caller_id {
                continue;
            }
            
            // Check access permissions
            let permissions = access_control::check_file_access(
                &file_metadata,
                &caller_id,
                caller_role.as_str(),
            );
            
            if !permissions.can_read {
                continue;
            }
            
            // Apply privacy filter
            if let Some(ref filter) = privacy_filter {
                if file_metadata.privacy_level != *filter {
                    continue;
                }
            }
            
            // Apply file type filter
            if let Some(ref filter) = file_type_filter {
                if file_metadata.file_type != *filter {
                    continue;
                }
            }
            
            accessible_files.push(file_metadata);
        }
    });
    
    // Sort by upload date (newest first)
    accessible_files.sort_by(|a, b| b.upload_date.cmp(&a.upload_date));
    
    // Apply pagination
    let paginated_files = accessible_files
        .into_iter()
        .skip(offset)
        .take(limit)
        .collect();
    
    Ok(paginated_files)
}

/// Delete file
#[update]
#[candid_method(update)]
pub fn delete_file(file_id: String) -> LMSResult<FileOperationResult> {
    let caller_user = require_authenticated()?;
    let caller_id = caller_user.id.clone();
    let caller_role = get_caller_role().unwrap_or_default();
    
    let file_metadata = FILE_METADATA.with(|metadata| {
        metadata.borrow().get(&file_id).ok_or(LMSError::NotFound("File not found".to_string()))
    })?;
    
    // Check delete permissions
    let permissions = access_control::check_file_access(
        &file_metadata,
        &caller_id,
        caller_role.as_str(),
    );
    
    if !permissions.can_delete {
        return Err(LMSError::Unauthorized("Access denied to delete this file".to_string()));
    }
    
    let file_size = file_metadata.file_size;
    
    // Delete all chunks
    for chunk_index in 0..file_metadata.chunk_count {
        let chunk_id = format!("{}_chunk_{}", file_id, chunk_index);
        FILE_CHUNKS.with(|chunks| {
            chunks.borrow_mut().remove(&chunk_id);
        });
    }
    
    // Remove from cache if present
    FILE_CACHE.with(|cache| {
        cache.borrow_mut().remove(&file_id);
    });
    
    // Delete metadata
    FILE_METADATA.with(|metadata| {
        metadata.borrow_mut().remove(&file_id);
    });
    
    // Update storage stats
    update_storage_stats(&file_metadata.uploader_id, -(file_size as i64));
    
    Ok(FileOperationResult {
        success: true,
        file_id: Some(file_id),
        session_id: None,
        stream_id: None,
        message: "File deleted successfully".to_string(),
        bytes_processed: file_size,
    })
}

/// Get storage statistics
#[query]
#[candid_method(query)]
pub fn get_storage_stats() -> LMSResult<FileStats> {
    require_authenticated()?;
    
    STORAGE_STATS.with(|stats| {
        Ok(stats.borrow().get().clone())
    })
}

/// Update file tags and description
#[update]
#[candid_method(update)]
pub fn update_file_metadata(
    file_id: String,
    new_description: Option<String>,
    new_tags: Option<Vec<String>>,
    new_privacy_level: Option<PrivacyLevel>,
) -> LMSResult<FileOperationResult> {
    let caller_user = require_authenticated()?;
    let caller_id = caller_user.id.clone();
    let caller_role = get_caller_role().unwrap_or_default();
    
    let mut file_metadata = FILE_METADATA.with(|metadata| {
        metadata.borrow().get(&file_id).ok_or(LMSError::NotFound("File not found".to_string()))
    })?;
    
    // Check write permissions
    let permissions = access_control::check_file_access(
        &file_metadata,
        &caller_id,
        caller_role.as_str(),
    );
    
    if !permissions.can_write {
        return Err(LMSError::Unauthorized("Access denied to modify this file".to_string()));
    }
    
    // Update metadata
    if let Some(description) = new_description {
        file_metadata.description = if description.is_empty() { None } else { Some(description) };
    }
    
    if let Some(tags) = new_tags {
        file_metadata.tags = tags;
    }
    
    if let Some(privacy_level) = new_privacy_level {
        file_metadata.privacy_level = privacy_level;
        file_metadata.is_public = matches!(privacy_level, PrivacyLevel::Public);
    }
    
    file_metadata.last_modified = current_time();
    file_metadata.version += 1;
    
    FILE_METADATA.with(|metadata| {
        metadata.borrow_mut().insert(file_id.clone(), file_metadata);
    });
    
    Ok(FileOperationResult {
        success: true,
        file_id: Some(file_id),
        session_id: None,
        stream_id: None,
        message: "File metadata updated successfully".to_string(),
        bytes_processed: 0,
    })
}

// Helper functions

/// Finalize file upload after all chunks are received
fn finalize_file_upload(upload_session: UploadSession) -> LMSResult<()> {
    // Calculate final file checksum (simplified)
    let mut combined_data = Vec::new();
    for chunk_index in 0..upload_session.total_chunks {
        let chunk_id = format!("{}_chunk_{}", upload_session.file_id, chunk_index);
        if let Some(chunk) = FILE_CHUNKS.with(|chunks| chunks.borrow().get(&chunk_id)) {
            combined_data.extend_from_slice(&chunk.data);
        }
    }
    
    let final_checksum = format!("sha256_{}", combined_data.len());
    
    // Update file metadata with checksum
    FILE_METADATA.with(|metadata| {
        if let Some(mut file_metadata) = metadata.borrow().get(&upload_session.file_id) {
            file_metadata.checksum = final_checksum;
            file_metadata.last_modified = current_time();
            metadata.borrow_mut().insert(upload_session.file_id.clone(), file_metadata.clone());
            
            // Cache small public files
            if file_metadata.is_cacheable() && combined_data.len() < 1_000_000 {
                FILE_CACHE.with(|cache| {
                    cache.borrow_mut().insert(upload_session.file_id.clone(), combined_data);
                });
            }
            
            // Update storage stats
            update_storage_stats(&file_metadata.uploader_id, file_metadata.file_size as i64);
        }
    });
    
    // Clean up upload session
    UPLOAD_SESSIONS.with(|sessions| {
        sessions.borrow_mut().remove(&upload_session.session_id);
    });
    
    Ok(())
}

/// Check user storage quota
fn check_user_storage_quota(user_id: &str, additional_size: u64) -> LMSResult<()> {
    let mut current_usage = 0u64;
    let mut file_count = 0u64;
    
    FILE_METADATA.with(|metadata| {
        for (_, file_metadata) in metadata.borrow().iter() {
            if file_metadata.uploader_id == user_id {
                current_usage += file_metadata.file_size;
                file_count += 1;
            }
        }
    });
    
    if file_count >= shared::file_storage::MAX_FILES_PER_USER {
        return Err(LMSError::ValidationError("Maximum number of files reached".to_string()));
    }
    
    if current_usage + additional_size > shared::file_storage::MAX_STORAGE_PER_USER {
        return Err(LMSError::ValidationError("Storage quota exceeded".to_string()));
    }
    
    Ok(())
}

/// Check file cache
fn check_file_cache(file_id: &str) -> Option<Vec<u8>> {
    FILE_CACHE.with(|cache| {
        cache.borrow().get(&file_id.to_string())
    })
}

/// Update cache hit/miss statistics
fn update_cache_stats(cache_hit: bool) {
    STORAGE_STATS.with(|stats| {
        let mut current_stats = stats.borrow().get().clone();
        // Simplified cache ratio calculation
        if cache_hit {
            current_stats.cache_hit_ratio = (current_stats.cache_hit_ratio + 1.0) / 2.0;
        } else {
            current_stats.cache_hit_ratio = current_stats.cache_hit_ratio / 2.0;
        }
        let _ = stats.borrow_mut().set(current_stats);
    });
}

/// Update storage statistics
fn update_storage_stats(user_id: &str, size_delta: i64) {
    STORAGE_STATS.with(|stats| {
        let mut current_stats = stats.borrow().get().clone();
        
        if size_delta > 0 {
            current_stats.total_files += 1;
            current_stats.total_size += size_delta as u64;
        } else {
            current_stats.total_files = current_stats.total_files.saturating_sub(1);
            current_stats.total_size = current_stats.total_size.saturating_sub((-size_delta) as u64);
        }
        
        // Update user storage usage
        let mut found = false;
        for (existing_user, usage) in &mut current_stats.storage_usage_by_user {
            if existing_user == user_id {
                if size_delta > 0 {
                    *usage += size_delta as u64;
                } else {
                    *usage = usage.saturating_sub((-size_delta) as u64);
                }
                found = true;
                break;
            }
        }
        
        if !found && size_delta > 0 {
            current_stats.storage_usage_by_user.push((user_id.to_string(), size_delta as u64));
        }
        
        let _ = stats.borrow_mut().set(current_stats);
    });
}

/// Generate unique stream ID
fn generate_stream_id(user_id: &str, file_id: &str) -> String {
    let timestamp = current_time();
    format!("stream_{}_{}_{}", user_id, file_id, timestamp)
}

/// Clean up expired sessions and streams (should be called periodically)
#[update]
#[candid_method(update)]
pub fn cleanup_expired_sessions() -> LMSResult<String> {
    require_authenticated()?; // Only authenticated users can trigger cleanup
    
    let now = current_time();
    let mut cleaned_sessions = 0;
    let mut cleaned_streams = 0;
    
    // Clean up expired upload sessions
    UPLOAD_SESSIONS.with(|sessions| {
        let mut to_remove = Vec::new();
        for (session_id, session) in sessions.borrow().iter() {
            if session.expires_at < now {
                to_remove.push(session_id);
            }
        }
        
        for session_id in to_remove {
            sessions.borrow_mut().remove(&session_id);
            cleaned_sessions += 1;
        }
    });
    
    // Clean up expired download streams
    DOWNLOAD_STREAMS.with(|streams| {
        let mut to_remove = Vec::new();
        for (stream_id, stream) in streams.borrow().iter() {
            if stream.expires_at < now {
                to_remove.push(stream_id);
            }
        }
        
        for stream_id in to_remove {
            streams.borrow_mut().remove(&stream_id);
            cleaned_streams += 1;
        }
    });
    
    Ok(format!("Cleaned up {} expired upload sessions and {} expired download streams", 
               cleaned_sessions, cleaned_streams))
}
