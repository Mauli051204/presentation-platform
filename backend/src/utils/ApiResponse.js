class ApiResponse {
  constructor(statusCode, data = null, message = 'Success', pagination = null) {
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
    if (pagination) this.pagination = pagination;
    this.timestamp = new Date().toISOString();
  }
}

export default ApiResponse;
