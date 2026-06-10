import { expect } from 'chai';
import { createRootInjector } from 'static-injector';
import { WORKFLOW_MODULE } from '../module';
import { SingleNodeRunnerService } from '../runner/single-node-runner.service';
import { TextMainConfig } from '../inline/node/text/main/index';
import { ChatMainConfig } from '../inline/node/chat/main/index';
import { WorkflowParserService } from '../workflow-parser.service';
import { LogFactoryToken, LogService } from '@cyia/external-call';
import * as v from 'valibot';
import { fauxAssistantMessage, registerMockProvider } from '@shenghuabi/openai';
import { ModelOptionsToken } from '../token';

describe('SingleNodeRunnerService', () => {
  let mockProvider: ReturnType<typeof registerMockProvider>;
  beforeEach(() => {
    mockProvider = registerMockProvider({});
    const injector = createRootInjector({
      providers: [
        SingleNodeRunnerService,
        ...WORKFLOW_MODULE.provider,
        // Mock chat API to return deterministic results

        {
          provide: LogFactoryToken,
          useValue: () => ({
            info: () => {},
            warn: () => {},
            error: () => {},
          }),
        },
        {
          provide: ModelOptionsToken,
          useValue: {
            provider: mockProvider.model.provider,
            config: mockProvider.model,
          },
        },
        LogService,
      ],
    });
    // Ensure inline nodes are registered via WorkflowParserService constructor
    injector.get(WorkflowParserService);
    service = injector.get(SingleNodeRunnerService);
  });
  afterEach(() => {
    mockProvider.unregister();
  });
  let service: SingleNodeRunnerService;

  describe('textarea node', () => {
    it('should return plain text', async () => {
      const input = v.parse(TextMainConfig.configDefine, {
        value: [[{ type: 'text', text: 'Hello World' }]],
      });

      const result = await service.run(TextMainConfig, input);

      expect(result).to.equal('Hello World');
    });

    it('should return empty string for empty input', async () => {
      const input = v.parse(TextMainConfig.configDefine, {
        value: [[]],
      });

      const result = await service.run(TextMainConfig, input);

      expect(result).to.equal('');
    });

    it('should concatenate multiple segments', async () => {
      const input = v.parse(TextMainConfig.configDefine, {
        value: [
          [
            { type: 'text', text: 'Hello' },
            { type: 'text', text: ' ' },
            { type: 'text', text: 'World' },
          ],
        ],
      });

      const result = await service.run(TextMainConfig, input);

      expect(result).to.equal('Hello World');
    });
  });

  describe('chat node', () => {
    it('should return streamed content', async () => {
      const input = v.parse(ChatMainConfig.configDefine, {
        value: [{ role: 'user', content: [{ type: 'text', text: 'Hi' }] }],
      });
      mockProvider.setResponses([fauxAssistantMessage('01234')]);

      const result = await service.run(ChatMainConfig, input, {
        providers: [],
      });

      // Mock streams 0, 01, 012, 0123, 01234 -> final is '01234'
      expect(result).to.equal('01234');
    });

    it('should return historyList output', async () => {
      const input = v.parse(ChatMainConfig.configDefine, {
        value: [{ role: 'user', content: [{ type: 'text', text: 'Hi' }] }],
      });
      mockProvider.setResponses([fauxAssistantMessage('0123456789')]);

      const historyList = await service.run(ChatMainConfig, input, {
        outputId: 'historyList',
        providers: [],
      });

      expect(Array.isArray(historyList)).to.be.true;
      expect(historyList.length).to.equal(2);
      expect(historyList[0].role).to.equal('user');
      expect(historyList[1].role).to.equal('assistant');
    });
  });
});
