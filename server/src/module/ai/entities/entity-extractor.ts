import { rawIntentAnalysisSchema } from '../intent/intent.schema';
import { INTENT_POLICY } from '../intent/intent.policy';
import type { RawIntentAnalysis } from '../intent/intent.schema';
import type { AiIntent, RequiredEntity } from '../intent/intent.types';

export interface IntentAnalysis {
  intent: AiIntent;
  sourceIntent: AiIntent;
  confidence: number;
  requiresTool: boolean;
  requiresConfirmation: boolean;
  entities: RawIntentAnalysis['entities'];
  missingEntities: RequiredEntity[];
  requiresClarification: boolean;
}

function hasEntity(
  entities: RawIntentAnalysis['entities'],
  entity: RequiredEntity,
): boolean {
  return entities[entity] !== undefined;
}

export const entityExtractor = {
  normalize(raw: unknown): IntentAnalysis {
    const analysis = rawIntentAnalysisSchema.parse(raw);
    const policy = INTENT_POLICY[analysis.intent];
    const missingEntities = policy.requiredEntities.filter(
      (entity) => !hasEntity(analysis.entities, entity),
    );
    const requiresClarification =
      analysis.intent === 'clarification_required' ||
      missingEntities.length > 0;
    const effectivePolicy = requiresClarification
      ? INTENT_POLICY.clarification_required
      : policy;

    return {
      intent:
        requiresClarification && analysis.intent !== 'clarification_required'
          ? 'clarification_required'
          : analysis.intent,
      sourceIntent: analysis.intent,
      confidence: analysis.confidence,
      // These are application policy decisions, not model-controlled values.
      requiresTool: effectivePolicy.requiresTool,
      requiresConfirmation: effectivePolicy.requiresConfirmation,
      entities: analysis.entities,
      missingEntities,
      requiresClarification,
    };
  },
};
