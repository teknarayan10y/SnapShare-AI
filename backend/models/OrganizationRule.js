import mongoose from 'mongoose';

const organizationRuleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    naturalLanguagePrompt: {
      type: String,
      default: '',
    },
    ruleJSON: {
      conditions: [
        {
          field: {
            type: String,
            required: true,
            enum: [
              'faceCount',
              'memberCount',
              'memberProfiles',
              'detectionConfidence',
              'matchingConfidence',
              'hasUnknownPerson',
              'collection',
              'existingFolder',
            ],
          },
          operator: {
            type: String,
            required: true,
            enum: [
              'equals',
              'not_equals',
              'greater_than',
              'less_than',
              'greater_or_equal',
              'less_or_equal',
              'contains',
              'not_contains',
              'in',
              'not_in',
            ],
          },
          value: mongoose.Schema.Types.Mixed,
        },
      ],
      logicGate: {
        type: String,
        enum: ['AND', 'OR'],
        default: 'AND',
      },
      actions: [
        {
          type: {
            type: String,
            required: true,
            enum: [
              'send_to_group_photos',
              'match_or_create_exact_group',
              'add_to_individual_folder',
              'send_to_review',
              'categorize_non_human',
              'exclude_from_organization',
              'custom_folder',
            ],
          },
          targetFolderName: String,
          params: mongoose.Schema.Types.Mixed,
        },
      ],
    },
    version: {
      type: Number,
      default: 1,
    },
    priority: {
      type: Number,
      default: 1,
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

organizationRuleSchema.index({ userId: 1, priority: -1 });

export const OrganizationRule = mongoose.model('OrganizationRule', organizationRuleSchema);