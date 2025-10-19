/**
 * Campaign Model
 * Represents a marketing campaign (Facebook, Google Ads, etc.)
 */

import BaseModel from './BaseModel.js';

class Campaign extends BaseModel {
  static get tableName() {
    return 'campaigns';
  }

  static get schema() {
    return {
      id: { type: 'INTEGER', nullable: false },
      domain_id: { type: 'INTEGER', required: true },
      name: { type: 'TEXT', required: true },
      description: { type: 'TEXT', nullable: true },
      platform: {
        type: 'TEXT',
        required: true,
        enum: ['facebook', 'google', 'tiktok', 'twitter', 'custom']
      },
      campaign_id_external: { type: 'TEXT', nullable: true },
      utm_source: { type: 'TEXT', nullable: true },
      utm_medium: { type: 'TEXT', nullable: true },
      utm_campaign: { type: 'TEXT', nullable: true },
      budget: { type: 'REAL', default: 0.0 },
      budget_currency: { type: 'TEXT', default: 'USD' },
      spend: { type: 'REAL', default: 0.0 },
      status: {
        type: 'TEXT',
        default: 'active',
        enum: ['draft', 'active', 'paused', 'completed']
      },
      start_date: { type: 'TEXT', nullable: true },
      end_date: { type: 'TEXT', nullable: true },
      created_at: { type: 'TEXT', default: null },
      updated_at: { type: 'TEXT', default: null }
    };
  }

  isActive() {
    return this.get('status') === 'active';
  }

  getRemainingBudget() {
    return this.get('budget') - this.get('spend');
  }

  getBudgetUtilization() {
    const budget = this.get('budget');
    if (budget === 0) return 0;
    return (this.get('spend') / budget) * 100;
  }
}

export default Campaign;
