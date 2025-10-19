/**
 * Video Model
 * Represents a video file with processing and metadata
 */

import BaseModel from './BaseModel.js';

class Video extends BaseModel {
  static get tableName() {
    return 'videos';
  }

  static get schema() {
    return {
      id: { type: 'INTEGER', nullable: false },
      title: { type: 'TEXT', required: true },
      description: { type: 'TEXT', nullable: true },
      category: { type: 'TEXT', nullable: true },
      tags: { type: 'TEXT', nullable: true },
      original_filename: { type: 'TEXT', required: true },
      original_path: { type: 'TEXT', required: true },
      original_size: { type: 'INTEGER', required: true },
      original_format: { type: 'TEXT', nullable: true },
      duration: { type: 'INTEGER', nullable: true },
      width: { type: 'INTEGER', nullable: true },
      height: { type: 'INTEGER', nullable: true },
      aspect_ratio: { type: 'TEXT', nullable: true },
      framerate: { type: 'REAL', nullable: true },
      bitrate: { type: 'INTEGER', nullable: true },
      codec: { type: 'TEXT', nullable: true },
      processing_status: {
        type: 'TEXT',
        default: 'pending',
        enum: ['pending', 'processing', 'completed', 'failed']
      },
      processing_progress: { type: 'INTEGER', default: 0 },
      processing_error: { type: 'TEXT', nullable: true },
      thumbnail_url: { type: 'TEXT', nullable: true },
      storage_path: { type: 'TEXT', nullable: true },
      total_storage_size: { type: 'INTEGER', default: 0 },
      hls_playlist_url: { type: 'TEXT', nullable: true },
      dash_manifest_url: { type: 'TEXT', nullable: true },
      status: {
        type: 'TEXT',
        default: 'draft',
        enum: ['draft', 'published', 'archived']
      },
      visibility: {
        type: 'TEXT',
        default: 'public',
        enum: ['public', 'unlisted', 'private']
      },
      view_count: { type: 'INTEGER', default: 0 },
      uploaded_by: { type: 'TEXT', nullable: true },
      created_at: { type: 'TEXT', default: null },
      updated_at: { type: 'TEXT', default: null },
      published_at: { type: 'TEXT', nullable: true }
    };
  }

  isProcessed() {
    return this.get('processing_status') === 'completed';
  }

  isPublished() {
    return this.get('status') === 'published';
  }

  incrementViews() {
    const current = this.get('view_count') || 0;
    this.set('view_count', current + 1);
  }

  getFormattedDuration() {
    const seconds = this.get('duration');
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

export default Video;
