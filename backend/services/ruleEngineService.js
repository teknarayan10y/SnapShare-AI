class RuleEngineService {
  constructor() {
    this.allowedFields = [
      'faceCount',
      'memberCount',
      'memberProfiles',
      'detectionConfidence',
      'matchingConfidence',
      'hasUnknownPerson',
      'collection',
      'existingFolder',
    ];

    this.allowedOperators = [
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
    ];

    this.allowedActions = [
      'send_to_group_photos',
      'match_or_create_exact_group',
      'add_to_individual_folder',
      'send_to_review',
      'categorize_non_human',
      'exclude_from_organization',
      'custom_folder',
    ];
  }

  /**
   * Validate structured rule against strict allowlist schema
   */
  validateRule(ruleJSON) {
    if (!ruleJSON || typeof ruleJSON !== 'object') {
      return { valid: false, error: 'Rule must be a valid JSON object' };
    }

    if (!Array.isArray(ruleJSON.conditions) || ruleJSON.conditions.length === 0) {
      return { valid: false, error: 'Rule must contain at least one condition' };
    }

    for (const [idx, cond] of ruleJSON.conditions.entries()) {
      if (!this.allowedFields.includes(cond.field)) {
        return { valid: false, error: `Condition ${idx + 1} uses invalid field '${cond.field}'` };
      }
      if (!this.allowedOperators.includes(cond.operator)) {
        return { valid: false, error: `Condition ${idx + 1} uses invalid operator '${cond.operator}'` };
      }
      if (cond.value === undefined || cond.value === null) {
        return { valid: false, error: `Condition ${idx + 1} missing target value` };
      }
    }

    if (!Array.isArray(ruleJSON.actions) || ruleJSON.actions.length === 0) {
      return { valid: false, error: 'Rule must contain at least one action' };
    }

    for (const [idx, act] of ruleJSON.actions.entries()) {
      if (!this.allowedActions.includes(act.type)) {
        return { valid: false, error: `Action ${idx + 1} uses unsupported action type '${act.type}'` };
      }
    }

    return { valid: true };
  }

  /**
   * Natural Language Command Interpreter (Section 9)
   * Translates plain English into a validated structured rule with expected behavior explanations.
   */
  interpretCommand(commandText) {
    if (!commandText || typeof commandText !== 'string' || commandText.trim().length === 0) {
      return { valid: false, error: 'Please enter a natural language organization instruction.' };
    }

    const text = commandText.toLowerCase().trim();

    // Pattern 1: More than 4 people -> Group Photos
    if (text.includes('more than 4') || text.includes('more than four') || text.includes('> 4') || text.includes('>4') || (text.includes('group') && text.includes('>'))) {
      const rule = {
        name: 'Large Group Rule (> 4 People)',
        naturalLanguagePrompt: commandText,
        conditions: [
          { field: 'faceCount', operator: 'greater_than', value: 4 },
        ],
        logicGate: 'AND',
        actions: [
          { type: 'send_to_group_photos', targetFolderName: 'Group Photos' },
        ],
      };
      return {
        valid: true,
        rule,
        expectedBehavior: 'Any photo containing 5 or more detected people will be placed into the "Group Photos" smart folder without creating combination subfolders.',
        example: 'A photo with 7 people at a celebration will be routed strictly to Group Photos.',
      };
    }

    // Pattern 2: Exactly 4 people combination
    if ((text.includes('four') || text.includes('4') || text.includes('quartet')) && (text.includes('people') || text.includes('person') || text.includes('member'))) {
      const rule = {
        name: 'Four-Member Combinations',
        naturalLanguagePrompt: commandText,
        conditions: [
          { field: 'faceCount', operator: 'equals', value: 4 },
          { field: 'hasUnknownPerson', operator: 'equals', value: false },
        ],
        logicGate: 'AND',
        actions: [
          { type: 'match_or_create_exact_group', targetFolderName: 'Four Member Groups', params: { groupSize: 4 } },
        ],
      };
      return {
        valid: true,
        rule,
        expectedBehavior: 'Photos containing exactly 4 recognized people will be grouped together into a unique combination folder. Order of faces is ignored and existing matching folders are automatically reused.',
        example: 'A photo of Person A, B, C, D will be placed into "Person A - Person B - Person C - Person D".',
      };
    }

    // Pattern 3: Exactly 3 people combination
    if ((text.includes('three') || text.includes('3') || text.includes('trio')) && (text.includes('people') || text.includes('person') || text.includes('member'))) {
      const rule = {
        name: 'Three-Member Combinations',
        naturalLanguagePrompt: commandText,
        conditions: [
          { field: 'faceCount', operator: 'equals', value: 3 },
          { field: 'hasUnknownPerson', operator: 'equals', value: false },
        ],
        logicGate: 'AND',
        actions: [
          { type: 'match_or_create_exact_group', targetFolderName: 'Three Member Groups', params: { groupSize: 3 } },
        ],
      };
      return {
        valid: true,
        rule,
        expectedBehavior: 'Photos containing exactly 3 recognized people will be grouped together into a unique combination folder. Matching folders are automatically reused.',
        example: 'A photo of Person A, B, and C will be stored in "Person A - Person B - Person C".',
      };
    }

    // Pattern 4: Exactly 2 people combination
    if (((text.includes('two') || text.includes('2')) && (text.includes('people') || text.includes('person') || text.includes('member'))) || text.includes('duo') || text.includes('pair') || text.includes('couple')) {
      const rule = {
        name: 'Two-Member Duo Combinations',
        naturalLanguagePrompt: commandText,
        conditions: [
          { field: 'faceCount', operator: 'equals', value: 2 },
          { field: 'hasUnknownPerson', operator: 'equals', value: false },
        ],
        logicGate: 'AND',
        actions: [
          { type: 'match_or_create_exact_group', targetFolderName: 'Two Member Groups', params: { groupSize: 2 } },
        ],
      };
      return {
        valid: true,
        rule,
        expectedBehavior: 'Photos with two recognized people will be routed to a dedicated two-member folder, reusing existing folders when the same pair appears.',
        example: 'A photo of Person A and Person B will be organized into "Person A - Person B".',
      };
    }

    // Pattern 5: Individual photos (1 person)
    if (text.includes('individual') || text.includes('single') || text.includes('solo') || text.includes('each recognized person') || text.includes('1 person') || text.includes('one person')) {
      const rule = {
        name: 'Individual Person Folders',
        naturalLanguagePrompt: commandText,
        conditions: [
          { field: 'faceCount', operator: 'equals', value: 1 },
          { field: 'hasUnknownPerson', operator: 'equals', value: false },
        ],
        logicGate: 'AND',
        actions: [
          { type: 'add_to_individual_folder', targetFolderName: 'Individual Photos' },
        ],
      };
      return {
        valid: true,
        rule,
        expectedBehavior: 'Photos containing a single recognized person will be sorted into that individual\'s personal smart folder.',
        example: 'Solo portraits of Person A will automatically go to "Individual Photos/Person A".',
      };
    }

    // Pattern 6: High confidence threshold filter (e.g. 95% or 90%)
    if (text.includes('confidence') && (text.includes('below') || text.includes('under') || text.includes('least'))) {
      const numMatch = text.match(/\d+/);
      const thresholdVal = numMatch ? parseInt(numMatch[0], 10) / 100 : 0.95;
      const rule = {
        name: `Strict Confidence Threshold (${Math.round(thresholdVal * 100)}%)`,
        naturalLanguagePrompt: commandText,
        conditions: [
          { field: 'matchingConfidence', operator: 'less_than', value: thresholdVal },
        ],
        logicGate: 'AND',
        actions: [
          { type: 'send_to_review', targetFolderName: 'Needs Review' },
        ],
      };
      return {
        valid: true,
        rule,
        expectedBehavior: `Photos where face matching confidence is below ${Math.round(thresholdVal * 100)}% will be held in "Needs Review" for human verification.`,
        example: 'A blurry or ambiguous face with 82% confidence will not be auto-grouped.',
      };
    }

    // Pattern 7: Unknown people to Needs Review
    if (text.includes('unknown') && (text.includes('review') || text.includes('keep') || text.includes('hold'))) {
      const rule = {
        name: 'Review Unrecognized Faces',
        naturalLanguagePrompt: commandText,
        conditions: [
          { field: 'hasUnknownPerson', operator: 'equals', value: true },
        ],
        logicGate: 'AND',
        actions: [
          { type: 'send_to_review', targetFolderName: 'Needs Review' },
        ],
      };
      return {
        valid: true,
        rule,
        expectedBehavior: 'Any photograph containing one or more unconfirmed or unrecognized faces will be held in "Needs Review".',
        example: 'Photos with unidentified guests will await manual profile confirmation.',
      };
    }

    // Default Fallback: Full Master Smart Organization Rule
    const defaultMasterRule = {
      name: 'Master Smart Face Organization',
      naturalLanguagePrompt: commandText,
      conditions: [
        { field: 'faceCount', operator: 'greater_or_equal', value: 0 },
      ],
      logicGate: 'AND',
      actions: [
        { type: 'match_or_create_exact_group', targetFolderName: 'People' },
      ],
    };

    return {
      valid: true,
      rule: defaultMasterRule,
      expectedBehavior: 'Master organization engine will route photos based on face count: >4 people to Group Photos, 1-4 people to deterministic member combination folders, and 0 people to semantic scene folders.',
      example: 'All photos are automatically organized into their matching People, Group, and Category folders.',
    };
  }

  /**
   * Evaluate a rule condition against photo analysis data
   */
  evaluateCondition(condition, data) {
    const { field, operator, value } = condition;
    const actual = data[field];

    switch (operator) {
      case 'equals':
        return actual === value;
      case 'not_equals':
        return actual !== value;
      case 'greater_than':
        return Number(actual) > Number(value);
      case 'less_than':
        return Number(actual) < Number(value);
      case 'greater_or_equal':
        return Number(actual) >= Number(value);
      case 'less_or_equal':
        return Number(actual) <= Number(value);
      case 'contains':
        return Array.isArray(actual) ? actual.includes(value) : String(actual).includes(String(value));
      case 'not_contains':
        return Array.isArray(actual) ? !actual.includes(value) : !String(actual).includes(String(value));
      default:
        return false;
    }
  }

  /**
   * Evaluate complete rule against photo data
   */
  evaluateRule(rule, photoData) {
    const { conditions, logicGate = 'AND' } = rule.ruleJSON || rule;
    if (!conditions || conditions.length === 0) return true;

    if (logicGate === 'OR') {
      return conditions.some((cond) => this.evaluateCondition(cond, photoData));
    }
    return conditions.every((cond) => this.evaluateCondition(cond, photoData));
  }
}

export const ruleEngineService = new RuleEngineService();