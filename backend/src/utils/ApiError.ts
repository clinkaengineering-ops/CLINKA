class ApiError extends Error {
    statusCode: number;

    constructor(statusCode:number, message: string){
        super(message);
        Object.setPrototypeOf(this, ApiError.prototype);
        this.statusCode = statusCode;
    }
}
export default ApiError;