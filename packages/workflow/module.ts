import { InlineNodeService } from './inline/inline.service';
import { WorkflowPluginService } from './plugin/plugin.service';
import { ContextBuildService } from './preset/context-build.service';
import { InlineBuilderService } from './preset/inline-build.service';
import { InlineParametersService } from './preset/inline-runner.service';
import { WorkflowRunnerService } from './runner/workflow-runner.service';
import { WorkflowFileService } from './workflow-file.service';
import { ChatServiceToken, WorkflowConfigToken } from './token';
import { WorkflowExecService } from './workflow-exec.service';
import { WorkflowParserService } from './workflow-parser.service';
import { WorkflowSelectService } from './workflow-select.service';

export const WORKFLOW_MODULE = {
  provider: [
    WorkflowExecService,
    WorkflowParserService,
    WorkflowSelectService,
    WorkflowFileService,
    ContextBuildService,
    InlineBuilderService,
    WorkflowRunnerService,
    InlineParametersService,
    WorkflowPluginService,
    InlineNodeService,
  ],
  token: {
    ChatServiceToken,
    WorkflowConfigToken,
  },
};
