import type { Risk, GuardPolicy, GuardDecision, GuardContext } from './types.js';

/**
 * Create a simple policy with allowlist/denylist
 */
export function createSimplePolicy(options: {
  allowlist?: string[];
  denylist?: string[];
  requireApprovalForRisk?: Risk[];
}): GuardPolicy {
  const { allowlist, denylist, requireApprovalForRisk = ['write', 'admin'] } = options;

  return {
    classify(toolName: string) {
      // Classify based on tool name patterns
      const lowered = toolName.toLowerCase();

      if (
        lowered.includes('delete') ||
        lowered.includes('remove') ||
        lowered.includes('destroy') ||
        lowered.includes('drop')
      ) {
        return { risk: 'admin', reason: 'destructive operation' };
      }

      if (
        lowered.includes('create') ||
        lowered.includes('write') ||
        lowered.includes('update') ||
        lowered.includes('modify') ||
        lowered.includes('insert') ||
        lowered.includes('send') ||
        lowered.includes('post')
      ) {
        return { risk: 'write', reason: 'write operation' };
      }

      return { risk: 'read', reason: 'read-only operation' };
    },

    decide({ toolName, risk, ctx }): GuardDecision {
      // Check denylist first
      if (denylist && denylist.includes(toolName)) {
        return { allow: false, reason: `Tool '${toolName}' is in denylist` };
      }

      // Check allowlist if provided
      if (allowlist && !allowlist.includes(toolName)) {
        return { allow: false, reason: `Tool '${toolName}' is not in allowlist` };
      }

      // Check if approval is required for this risk level
      if (requireApprovalForRisk.includes(risk)) {
        return {
          allow: true,
          needsApproval: true,
          reason: `${risk} operation requires approval`,
        };
      }

      return { allow: true };
    },
  };
}

/**
 * Create a composable policy builder
 */
export class PolicyBuilder {
  private classifiers: Array<(toolName: string, input: unknown) => { risk: Risk; reason?: string } | null> = [];
  private rules: Array<
    (args: {
      toolName: string;
      input: unknown;
      ctx: GuardContext;
      risk: Risk;
      reason?: string;
    }) => GuardDecision | null
  > = [];

  /**
   * Add a classifier function
   */
  addClassifier(
    classifier: (toolName: string, input: unknown) => { risk: Risk; reason?: string } | null
  ): this {
    this.classifiers.push(classifier);
    return this;
  }

  /**
   * Add a decision rule
   */
  addRule(
    rule: (args: {
      toolName: string;
      input: unknown;
      ctx: GuardContext;
      risk: Risk;
      reason?: string;
    }) => GuardDecision | null
  ): this {
    this.rules.push(rule);
    return this;
  }

  /**
   * Build the final policy
   */
  build(): GuardPolicy {
    return {
      classify: (toolName: string, input: unknown) => {
        // Try each classifier in order
        for (const classifier of this.classifiers) {
          const result = classifier(toolName, input);
          if (result) return result;
        }
        // Default to read if no classifier matches
        return { risk: 'read' };
      },

      decide: args => {
        // Try each rule in order
        for (const rule of this.rules) {
          const decision = rule(args);
          if (decision) return decision;
        }
        // Default to allow if no rule blocks
        return { allow: true };
      },
    };
  }
}
