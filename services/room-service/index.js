/**
 * Room Service - AWS Lambda Handler
 * Handles room-related operations: add, list, and check availability
 */

/**
 * Get all rooms
 * GET /rooms
 */
exports.getAllRooms = async (event) => {
    const AWS = require('aws-sdk');
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    
    const tableName = process.env.ROOMS_TABLE_NAME;
    
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
        console.error('Error getting rooms:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: 'Failed to fetch rooms'
            })
        };
    }
};

/**
 * Get a single room by ID
 * GET /rooms/{id}
 */
exports.getRoomById = async (event) => {
    const AWS = require('aws-sdk');
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    
    const tableName = process.env.ROOMS_TABLE_NAME;
    const roomId = event.pathParameters?.id;
    
    if (!roomId) {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: 'Room ID is required'
            })
        };
    }
    
    try {
        const params = {
            TableName: tableName,
            Key: {
                roomId: roomId
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
                    error: 'Room not found'
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
        console.error('Error getting room:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: 'Failed to fetch room'
            })
        };
    }
};

/**
 * Create a new room
 * POST /rooms
 */
exports.createRoom = async (event) => {
    const AWS = require('aws-sdk');
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    const { v4: uuidv4 } = require('uuid');
    
    const tableName = process.env.ROOMS_TABLE_NAME;
    
    try {
        const body = JSON.parse(event.body || '{}');
        const { roomNumber, type, price, status = 'available' } = body;
        
        // Validation
        if (!roomNumber || !type || !price) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Missing required fields: roomNumber, type, price'
                })
            };
        }
        
        const roomId = uuidv4();
        const room = {
            roomId: roomId,
            roomNumber: roomNumber,
            type: type,
            price: parseFloat(price),
            status: status,
            createdAt: new Date().toISOString()
        };
        
        const params = {
            TableName: tableName,
            Item: room
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
                data: room
            })
        };
    } catch (error) {
        console.error('Error creating room:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: 'Failed to create room'
            })
        };
    }
};

/**
 * Check room availability
 * GET /rooms/availability?startDate=...&endDate=...
 */
exports.checkAvailability = async (event) => {
    const AWS = require('aws-sdk');
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    
    const tableName = process.env.ROOMS_TABLE_NAME;
    const queryParams = event.queryStringParameters || {};
    const startDate = queryParams.startDate;
    const endDate = queryParams.endDate;
    
    // For simplicity, we'll check all rooms with status 'available'
    // In a real system, you'd check against bookings table
    try {
        const params = {
            TableName: tableName,
            FilterExpression: '#status = :status',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': 'available'
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
                data: {
                    availableRooms: result.Items || [],
                    count: result.Items?.length || 0,
                    startDate: startDate || null,
                    endDate: endDate || null
                }
            })
        };
    } catch (error) {
        console.error('Error checking availability:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: 'Failed to check availability'
            })
        };
    }
};

