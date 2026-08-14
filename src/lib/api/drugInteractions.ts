import { apiClient } from './client';

export interface DrugInteraction {
  id: number;
  organizationId: number;
  activeIngredientAId: number;
  activeIngredientBId: number;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CONTRAINDICATED';
  description?: string;
  descriptionKh?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DrugInteractionRequest {
  organizationId: number;
  activeIngredientAId: number;
  activeIngredientBId: number;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CONTRAINDICATED';
  description?: string;
  descriptionKh?: string;
}

export interface DrugInteractionResponse extends DrugInteraction {}

export interface DrugInteractionCheckRequest {
  productIds: number[];
}

export interface DrugInteractionCheckResponse {
  interactions: DrugInteraction[];
}

export const drugInteractionsApi = {
  listAll: async () => {
    return apiClient.get<DrugInteractionResponse[]>('/drug-interactions');
  },

  getByOrganization: async (organizationId: number) => {
    return apiClient.get<DrugInteractionResponse[]>(`/drug-interactions/organization/${organizationId}`);
  },

  getById: async (id: number) => {
    return apiClient.get<DrugInteractionResponse>(`/drug-interactions/${id}`);
  },

  create: async (data: DrugInteractionRequest) => {
    return apiClient.post<DrugInteractionResponse>('/drug-interactions', data);
  },

  update: async (id: number, data: DrugInteractionRequest) => {
    return apiClient.put<DrugInteractionResponse>(`/drug-interactions/${id}`, data);
  },

  delete: async (id: number) => {
    await apiClient.delete(`/drug-interactions/${id}`);
  },

  check: async (data: DrugInteractionCheckRequest): Promise<DrugInteractionCheckResponse> => {
    return apiClient.post<DrugInteractionCheckResponse>('/drug-interactions/check', data);
  },
};