import api from "./axios";

interface PublicConfig {
  platformFeePercent: number;
}

export const getPublicConfig = async (): Promise<PublicConfig> => {
  const response = await api.get<{ data: PublicConfig }>("/public/config");
  return response.data.data;
};
