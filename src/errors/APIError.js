class APIError extends Error {
    constructor(statusCode = 500, message) {
        super(message);
        this.statusCode = statusCode;         
        this.name = "APIError";
    }
}

module.exports = APIError;