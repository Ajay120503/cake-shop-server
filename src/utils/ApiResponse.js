// /**
//  * Standardized API Response
//  */
export class ApiResponse {
  constructor(statusCode, data, message = 'Success', meta = {}) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
    this.meta = meta;
  }

  static success(res, data, message = 'Success', meta = {}) {
    return res.status(200).json(new ApiResponse(200, data, message, meta));
  }

  static created(res, data, message = 'Created') {
    return res.status(201).json(new ApiResponse(201, data, message));
  }

  static accepted(res, data, message = 'Accepted') {
    return res.status(202).json(new ApiResponse(202, data, message));
  }

  static noContent(res, message = 'No Content') {
    return res.status(204).json(new ApiResponse(204, null, message));
  }

  static paginated(res, data, page, limit, total, message = 'Success') {
    return res.status(200).json({
      statusCode: 200,
      success: true,
      message,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  }
}

export default ApiResponse;

/**
 * Standardized API Response
 */