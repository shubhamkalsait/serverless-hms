/**
 * Payment Service - AWS Lambda Handler
 * Handles payment-related operations: create, process, and check status
 */

/**
 * Get all payments
 * GET /payments
 */
exports.getAllPayments = async (event) => {
    const AWS = require('aws-sdk');
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    
    const tableName = process.env.PAYMENTS_TABLE_NAME;
    
    try {
        const params = {
            TableName: tableName
        };
        
        const result = await dynamodb.scan(params).promise();
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                data: result.Items || []
            })
        };
    } catch (error) {
        console.error('Error getting payments:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: 'Failed to fetch payments'
            })
        };
    }
};

/**
 * Get a single payment by ID
 * GET /payments/{id}
 */
exports.getPaymentById = async (event) => {
    const AWS = require('aws-sdk');
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    
    const tableName = process.env.PAYMENTS_TABLE_NAME;
    const paymentId = event.pathParameters?.id;
    
    if (!paymentId) {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: 'Payment ID is required'
            })
        };
    }
    
    try {
        const params = {
            TableName: tableName,
            Key: {
                paymentId: paymentId
            }
        };
        
        const result = await dynamodb.get(params).promise();
        
        if (!result.Item) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Payment not found'
                })
            };
        }
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                data: result.Item
            })
        };
    } catch (error) {
        console.error('Error getting payment:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: 'Failed to fetch payment'
            })
        };
    }
};

/**
 * Create a new payment
 * POST /payments
 */
exports.createPayment = async (event) => {
    const AWS = require('aws-sdk');
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    const { v4: uuidv4 } = require('uuid');
    
    const tableName = process.env.PAYMENTS_TABLE_NAME;
    
    try {
        const body = JSON.parse(event.body || '{}');
        const { bookingId, amount, paymentMethod = 'card' } = body;
        
        // Validation
        if (!bookingId || !amount) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Missing required fields: bookingId, amount'
                })
            };
        }
        
        const paymentId = uuidv4();
        const payment = {
            paymentId: paymentId,
            bookingId: bookingId,
            amount: parseFloat(amount),
            paymentMethod: paymentMethod,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            processedAt: null
        };
        
        const params = {
            TableName: tableName,
            Item: payment
        };
        
        await dynamodb.put(params).promise();
        
        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                data: payment,
                message: 'Payment created. Use process endpoint to complete payment.'
            })
        };
    } catch (error) {
        console.error('Error creating payment:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: 'Failed to create payment'
            })
        };
    }
};

/**
 * Process a payment (simulated)
 * POST /payments/{id}/process
 */
exports.processPayment = async (event) => {
    const AWS = require('aws-sdk');
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    
    const tableName = process.env.PAYMENTS_TABLE_NAME;
    const paymentId = event.pathParameters?.id;
    
    if (!paymentId) {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: 'Payment ID is required'
            })
        };
    }
    
    try {
        // Get the payment first
        const getParams = {
            TableName: tableName,
            Key: {
                paymentId: paymentId
            }
        };
        
        const getResult = await dynamodb.get(getParams).promise();
        
        if (!getResult.Item) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Payment not found'
                })
            };
        }
        
        // Simulate payment processing
        // In a real system, this would call a payment gateway
        // For this demo, we'll simulate success
        const simulateFailure = Math.random() < 0.1; // 10% failure rate for demo
        
        const updateParams = {
            TableName: tableName,
            Key: {
                paymentId: paymentId
            },
            UpdateExpression: 'SET #status = :status, processedAt = :processedAt',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': simulateFailure ? 'FAILED' : 'PAID',
                ':processedAt': new Date().toISOString()
            },
            ReturnValues: 'ALL_NEW'
        };
        
        const updateResult = await dynamodb.update(updateParams).promise();
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                data: updateResult.Attributes,
                message: simulateFailure 
                    ? 'Payment processing failed. Please try again.' 
                    : 'Payment processed successfully!'
            })
        };
    } catch (error) {
        console.error('Error processing payment:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: 'Failed to process payment'
            })
        };
    }
};

/**
 * Get payments by booking ID
 * GET /payments/booking/{bookingId}
 */
exports.getPaymentsByBooking = async (event) => {
    const AWS = require('aws-sdk');
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    
    const tableName = process.env.PAYMENTS_TABLE_NAME;
    const bookingId = event.pathParameters?.bookingId;
    
    if (!bookingId) {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: 'Booking ID is required'
            })
        };
    }
    
    try {
        const params = {
            TableName: tableName,
            FilterExpression: 'bookingId = :bookingId',
            ExpressionAttributeValues: {
                ':bookingId': bookingId
            }
        };
        
        const result = await dynamodb.scan(params).promise();
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                data: result.Items || []
            })
        };
    } catch (error) {
        console.error('Error getting payments by booking:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: 'Failed to fetch payments'
            })
        };
    }
};

