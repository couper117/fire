export const fetchOpenApi = async (servicePrefix: string): Promise<any> => {
  const response: Response = await fetch(`/${servicePrefix}/api/openapi.json`);
  return response.json();
};
