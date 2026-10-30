import { intentNormalizer } from './intent.normalizer';
import { promptManager } from '../prompt-manager';
import { AiService } from '../ai.service';
import {
  INTENT_ANALYSIS_JSON_SCHEMA,
  rawIntentAnalysisSchema,
} from './intent.schema';
import { INTENT_VALUES } from './intent.types';
import type { AiOrchestrationContext } from '../ai.context';
import type { IntentAnalysis } from './intent.normalizer';

export class IntentParser {
  constructor(private readonly aiService: AiService) {}

  async parse(context: AiOrchestrationContext): Promise<IntentAnalysis> {
    const messages = promptManager.buildIntentMessages(context, INTENT_VALUES);
    const response = await this.aiService.generateStructured(messages, {
      name: 'penniwise_intent_analysis',
      schema: INTENT_ANALYSIS_JSON_SCHEMA,
      validator: rawIntentAnalysisSchema,
    });

    return intentNormalizer.normalize(response.result);
  }
}
