import api from "./axios";

interface PublicConfig {
  platformFeePercent: number;
}

export const getPublicConfig = async (): Promise<PublicConfig> => {
  const response = await api.get<{ data: PublicConfig }>("/public/config");
  const data = response.data.data;
  // Handle Prisma Decimal object returned as { s, e, d } or string
  return {
    ...data,
    platformFeePercent: data.platformFeePercent && typeof data.platformFeePercent === "object"
      ? Number((data.platformFeePercent as any).d ? (data.platformFeePercent as any).d.join('') : data.platformFeePercent)
      : Number(data.platformFeePercent)
  };
};
