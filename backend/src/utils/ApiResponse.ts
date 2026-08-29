import { serializeMediaUrls } from "./serializeMediaUrls";

function ApiResponse(statusCode: number, message: string, data?: unknown) {
  return {
    success: statusCode >= 200 && statusCode < 400,
    message,
    data: data === undefined ? data : serializeMediaUrls(data),
  };
}

export default ApiResponse;
