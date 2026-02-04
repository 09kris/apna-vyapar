class ApiResponse<T> {
  status: number;
  message: string;
  data: T | null;
  success: boolean;

  constructor(status: number, data: T | null = null, message: string = 'Operation successful') {
    this.status = status;
    this.message = message;
    this.data = data;
    this.success = status < 400;
  }
}

export default ApiResponse;
