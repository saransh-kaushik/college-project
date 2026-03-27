export const azureConfig = {
  speech: {
    key: process.env.AZURE_SPEECH_KEY || '',
    region: process.env.AZURE_SPEECH_REGION || 'eastus',
  },
  openai: {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
    apiKey: process.env.AZURE_OPENAI_API_KEY || '',
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1-mini',
    embeddingDeployment: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-3-small',
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-01',
  },
};

export default azureConfig;
