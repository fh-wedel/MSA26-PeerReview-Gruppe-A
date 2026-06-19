with open('web-ui/src/api/communication.ts', 'r') as f:
    content = f.read()

content = content.replace('export const fetchWorkflowPlugins = async (): Promise<WorkflowPlugin[]> => {\n  const response = await workflowApiClient.plugins.listPlugins();\n  return response.data as any;\n};', '')
content = content.replace('export interface WorkflowPlugin {\n  name: string;\n  title: string;\n  description: string;\n  rules: WorkflowRules;\n}', '')

with open('web-ui/src/api/communication.ts', 'w') as f:
    f.write(content)
