function ApiResponse(statusCode: number, message: string , data?:any) {
    return {
        success: statusCode >= 200 && statusCode < 400,
        message,
        data
    }



}
export default ApiResponse;