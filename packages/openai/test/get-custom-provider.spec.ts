import { expect } from 'chai';
import { getModelConfig } from '../chat/util/get-custom-provider';

describe('getModelConfig', () => {
  describe('faux provider', () => {
    it('should return faux config with model as input.config', () => {
      const modelConfig = {
        provider: 'openai',
        baseUrl: 'https://api.openai.com/v1',
      };
      const result = getModelConfig({
        provider: 'faux' as any,
        model: 'test-model',
        config: modelConfig,
      });
      expect(result.model).to.equal(modelConfig);
      expect(result.config.provider).to.equal('faux');
      expect(result.config.model).to.equal('test-model');
    });
  });

  describe('known provider (openai)', () => {
    it('should return model from getModel for known provider', () => {
      const result = getModelConfig({
        provider: 'openai',
        model: 'gpt-4o',
      });
      expect(result.config.provider).to.equal('openai');
      expect(result.config.model).to.equal('gpt-4o');
      expect(result.config.name).to.equal('gpt-4o');
      // getModel returns a Model object with id, api, name
      expect((result.model as any).id).to.equal('gpt-4o');
      // openai provider maps to responses API by default
      expect((result.model as any).api).to.equal('openai-responses');
    });

    it('should accept custom config for known provider', () => {
      const result = getModelConfig({
        provider: 'openai',
        model: 'gpt-4o',
        apiKey: 'sk-test-key',
        config: {
          baseUrl: 'https://custom.example.com/v1',
        },
      });
      expect(result.config.provider).to.equal('openai');
      expect(result.config.apiKey).to.equal('sk-test-key');
      expect(result.config.config?.baseUrl).to.equal(
        'https://custom.example.com/v1',
      );
    });
  });

  describe('custom provider (openai-completions)', () => {
    it('should create custom provider model with compat api', () => {
      const result = getModelConfig({
        provider: 'openai-completions',
        model: 'my-custom-model',
        name: 'My Custom Model',
        config: {
          baseUrl: 'https://api.example.com/v1',
        },
      });
      expect(result.config.provider).to.equal('openai-completions');
      expect(result.config.model).to.equal('my-custom-model');
      expect(result.config.name).to.equal('My Custom Model');
      // Check custom model structure
      expect((result.model as any).id).to.equal('my-custom-model');
      expect((result.model as any).api).to.equal('openai-completions');
      expect((result.model as any).name).to.equal('My Custom Model');
      expect((result.model as any).baseUrl).to.equal(
        'https://api.example.com/v1',
      );
    });

    it('should include compat fields in custom model', () => {
      const result = getModelConfig({
        provider: 'openai-completions',
        model: 'model-with-compat',
        config: {
          baseUrl: 'https://api.example.com/v1',
          reasoning: true,
          contextWindow: 128000,
          maxTokens: 4096,
          compat: { supportsDeveloperRole: true },
        },
      });
      expect((result.model as any).compat.supportsDeveloperRole).to.equal(true);
      expect((result.model as any).reasoning).to.equal(true);
      expect((result.model as any).contextWindow).to.equal(128000);
      expect((result.model as any).maxTokens).to.equal(4096);
    });
  });

  describe('custom provider (openai-responses)', () => {
    it('should create custom provider model with responses api', () => {
      const result = getModelConfig({
        provider: 'openai-responses',
        model: 'gpt-4o-responses',
        config: {
          baseUrl: 'https://api.openai.com/v1/responses',
        },
      });
      expect(result.config.provider).to.equal('openai-responses');
      expect((result.model as any).api).to.equal('openai-responses');
    });
  });

  describe('custom provider (anthropic-messages)', () => {
    it('should create custom provider model with anthropics api', () => {
      const result = getModelConfig({
        provider: 'anthropic-messages',
        model: 'claude-sonnet-4-20250514',
        config: {
          baseUrl: 'https://api.anthropic.com/v1/messages',
          reasoning: true,
        },
      });
      expect(result.config.provider).to.equal('anthropic-messages');
      expect((result.model as any).api).to.equal('anthropic-messages');
    });

    it('should include compat options for anthropic-messages', () => {
      const result = getModelConfig({
        provider: 'anthropic-messages',
        model: 'claude-test',
        config: {
          baseUrl: 'https://api.anthropic.com/v1/messages',
          reasoning: true,
        },
      });
      const compat = (result.model as any).compat;
      expect(compat).to.be.an('object');
      // default compat from ModelSchema includes supportsDeveloperRole: false
      expect(compat.supportsDeveloperRole).to.equal(false);
    });
  });

  describe('validation', () => {
    it('should throw on invalid provider', () => {
      expect(() =>
        getModelConfig({
          provider: 'invalid-provider' as any,
          model: 'test-model',
        }),
      ).to.throw();
    });

    it('should use model name as default name', () => {
      const result = getModelConfig({
        provider: 'openai',
        model: 'gpt-3.5-turbo',
      });
      expect(result.config.name).to.equal('gpt-3.5-turbo');
    });
  });

  describe('other known providers', () => {
    it('should work with anthropic provider', () => {
      const result = getModelConfig({
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
      });
      expect(result.config.provider).to.equal('anthropic');
      expect((result.model as any).api).to.equal('anthropic-messages');
    });

    it('should work with google provider', () => {
      const result = getModelConfig({
        provider: 'google',
        model: 'gemini-2.5-flash-preview-05-20',
      });
      expect(result.config.provider).to.equal('google');
    });

    it('should work with deepseek provider', () => {
      const result = getModelConfig({
        provider: 'deepseek',
        model: 'deepseek-chat',
      });
      expect(result.config.provider).to.equal('deepseek');
    });

    it('should work with openrouter provider', () => {
      const result = getModelConfig({
        provider: 'openrouter',
        model: 'meta-llama/llama-3.1-70b-instruct',
      });
      expect(result.config.provider).to.equal('openrouter');
    });

    it('should work with xai provider', () => {
      const result = getModelConfig({
        provider: 'xai',
        model: 'grok-2-latest',
      });
      expect(result.config.provider).to.equal('xai');
    });
  });
});
