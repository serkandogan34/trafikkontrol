/**
 * Database Seed Script
 * Populates database with sample data for testing
 */

import { getInstance } from '../connection.js';
import DomainRepository from '../../repositories/DomainRepository.js';
import TrafficLogRepository from '../../repositories/TrafficLogRepository.js';

class Seeder {
  constructor(dbConnection) {
    this.db = dbConnection.getDB();
    this.domainRepo = new DomainRepository(this.db);
    this.trafficLogRepo = new TrafficLogRepository(this.db);
  }

  /**
   * Seed domains
   */
  seedDomains() {
    console.log('🌱 Seeding domains...');
    
    const domains = [
      {
        name: 'example.com',
        status: 'active',
        clean_backend: 'https://clean.backend.com',
        gray_backend: 'https://gray.backend.com',
        aggressive_backend: 'https://aggressive.backend.com',
        traffic_split: { clean: 70, gray: 20, aggressive: 10 },
        ssl_enabled: true,
        ssl_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        rate_limit_enabled: true,
        rate_limit_requests: 1000,
        rate_limit_window: 3600,
        total_requests: 0,
        total_bot_blocks: 0
      },
      {
        name: 'testdomain.net',
        status: 'active',
        clean_backend: 'https://clean2.backend.com',
        gray_backend: 'https://gray2.backend.com',
        aggressive_backend: 'https://aggressive2.backend.com',
        traffic_split: { clean: 60, gray: 30, aggressive: 10 },
        ssl_enabled: true,
        ssl_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        rate_limit_enabled: true,
        rate_limit_requests: 500,
        rate_limit_window: 3600,
        total_requests: 0,
        total_bot_blocks: 0
      },
      {
        name: 'demo.org',
        status: 'paused',
        clean_backend: 'https://clean3.backend.com',
        gray_backend: 'https://gray3.backend.com',
        aggressive_backend: 'https://aggressive3.backend.com',
        traffic_split: { clean: 80, gray: 15, aggressive: 5 },
        ssl_enabled: false,
        rate_limit_enabled: false,
        total_requests: 0,
        total_bot_blocks: 0
      }
    ];

    for (const domainData of domains) {
      const domain = this.domainRepo.create(domainData);
      console.log(`   ✅ Created domain: ${domain.get('name')} (ID: ${domain.getId()})`);
    }
  }

  /**
   * Seed traffic logs
   */
  seedTrafficLogs() {
    console.log('🌱 Seeding traffic logs...');
    
    const domains = this.domainRepo.findAll();
    const backendTypes = ['clean', 'gray', 'aggressive'];
    const countries = ['US', 'UK', 'DE', 'FR', 'JP', 'BR', 'AU', 'CA', 'IN', 'TR'];
    const cities = ['New York', 'London', 'Berlin', 'Paris', 'Tokyo', 'São Paulo', 'Sydney', 'Toronto', 'Mumbai', 'Istanbul'];
    const methods = ['GET', 'POST', 'PUT', 'DELETE'];
    const paths = ['/', '/api/users', '/api/products', '/dashboard', '/settings', '/profile'];
    
    let count = 0;
    
    for (const domain of domains) {
      // Generate 20 logs per domain
      for (let i = 0; i < 20; i++) {
        const logData = {
          domain_id: domain.getId(),
          visitor_ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          request_method: methods[Math.floor(Math.random() * methods.length)],
          request_path: paths[Math.floor(Math.random() * paths.length)],
          backend_used: backendTypes[Math.floor(Math.random() * backendTypes.length)],
          backend_url: domain.getBackend(backendTypes[Math.floor(Math.random() * backendTypes.length)]),
          response_time: Math.floor(Math.random() * 2000) + 50,
          response_status: Math.random() > 0.9 ? 404 : (Math.random() > 0.95 ? 500 : 200),
          is_bot: Math.random() > 0.85,
          bot_score: Math.random() * 100,
          country: countries[Math.floor(Math.random() * countries.length)],
          city: cities[Math.floor(Math.random() * cities.length)],
          request_time: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString()
        };
        
        this.trafficLogRepo.create(logData);
        count++;
      }
    }
    
    console.log(`   ✅ Created ${count} traffic logs`);
  }

  /**
   * Seed campaigns
   */
  seedCampaigns() {
    console.log('🌱 Seeding campaigns...');
    
    const domains = this.domainRepo.findAll();
    
    const campaigns = [
      {
        domain_id: domains[0].getId(),
        name: 'Summer Sale 2024',
        description: 'Summer promotional campaign',
        platform: 'facebook',
        utm_source: 'facebook',
        utm_medium: 'cpc',
        utm_campaign: 'summer_sale',
        budget: 5000.00,
        budget_currency: 'USD',
        spend: 1250.50,
        status: 'active',
        start_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        domain_id: domains[0].getId(),
        name: 'Google Ads - Brand',
        description: 'Brand awareness campaign',
        platform: 'google',
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'brand_awareness',
        budget: 3000.00,
        budget_currency: 'USD',
        spend: 800.25,
        status: 'active',
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    for (const campaignData of campaigns) {
      const sql = `
        INSERT INTO campaigns (
          domain_id, name, description, platform, utm_source, utm_medium, 
          utm_campaign, budget, budget_currency, spend, status, start_date, end_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      this.db.prepare(sql).run(
        campaignData.domain_id, campaignData.name, campaignData.description,
        campaignData.platform, campaignData.utm_source, campaignData.utm_medium,
        campaignData.utm_campaign, campaignData.budget, campaignData.budget_currency,
        campaignData.spend, campaignData.status, campaignData.start_date,
        campaignData.end_date
      );
    }
    
    console.log(`   ✅ Created ${campaigns.length} campaigns`);
  }

  /**
   * Seed videos
   */
  seedVideos() {
    console.log('🌱 Seeding videos...');
    
    const videos = [
      {
        title: 'Product Demo Video',
        description: 'Demonstration of our flagship product',
        category: 'product',
        tags: 'demo,product,tutorial',
        original_filename: 'product_demo.mp4',
        original_path: '/videos/originals/product_demo.mp4',
        original_size: 52428800, // 50MB
        original_format: 'mp4',
        duration: 180,
        width: 1920,
        height: 1080,
        aspect_ratio: '16:9',
        framerate: 30,
        bitrate: 5000000,
        codec: 'h264',
        processing_status: 'completed',
        processing_progress: 100,
        status: 'published',
        visibility: 'public',
        view_count: 1234
      },
      {
        title: 'Company Introduction',
        description: 'Get to know our company and team',
        category: 'about',
        tags: 'company,introduction,team',
        original_filename: 'company_intro.mp4',
        original_path: '/videos/originals/company_intro.mp4',
        original_size: 31457280, // 30MB
        original_format: 'mp4',
        duration: 120,
        width: 1920,
        height: 1080,
        aspect_ratio: '16:9',
        framerate: 30,
        bitrate: 4000000,
        codec: 'h264',
        processing_status: 'processing',
        processing_progress: 65,
        status: 'draft',
        visibility: 'unlisted',
        view_count: 0
      }
    ];
    
    for (const videoData of videos) {
      const sql = `
        INSERT INTO videos (
          title, description, category, tags, original_filename, original_path,
          original_size, original_format, duration, width, height, aspect_ratio,
          framerate, bitrate, codec, processing_status, processing_progress,
          status, visibility, view_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      this.db.prepare(sql).run(
        videoData.title, videoData.description, videoData.category, videoData.tags,
        videoData.original_filename, videoData.original_path, videoData.original_size,
        videoData.original_format, videoData.duration, videoData.width, videoData.height,
        videoData.aspect_ratio, videoData.framerate, videoData.bitrate, videoData.codec,
        videoData.processing_status, videoData.processing_progress, videoData.status,
        videoData.visibility, videoData.view_count
      );
    }
    
    console.log(`   ✅ Created ${videos.length} videos`);
  }

  /**
   * Run all seeders
   */
  async run() {
    console.log('\n🌱 Starting database seeding...\n');
    
    try {
      this.seedDomains();
      this.seedTrafficLogs();
      this.seedCampaigns();
      this.seedVideos();
      
      console.log('\n✅ Database seeding completed successfully!\n');
    } catch (error) {
      console.error('\n❌ Seeding failed:', error.message);
      throw error;
    }
  }
}

/**
 * CLI Interface
 */
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  const dbConnection = getInstance();
  const seeder = new Seeder(dbConnection);
  
  try {
    await seeder.run();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    dbConnection.close();
  }
}

export default Seeder;
