/**
 * Booking Service - AWS Lambda Handler
 * Handles booking-related operations: create, view, and associate with rooms
 */

/**
 * Get all bookings
 * GET /bookings
 */
exports.getAllBookings = async (event) => {
    const AWS = require('aws-sdk');
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    
    const tableName = process.env.BOOKINGS_TABLE_NAME;
    
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
        console.error('Error getting bookings:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: 'Failed to fetch bookings'
            })
        };
    }
};

/**
 * Get a single booking by ID
 * GET /bookings/{id}
 */
exports.getBookingById = async (event) => {
    const AWS = require('aws-sdk');
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    
    const tableName = process.env.BOOKINGS_TABLE_NAME;
    const bookingId = event.pathParameters?.id;
    
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
            Key: {
                bookingId: bookingId
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
                    error: 'Booking not found'
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
        console.error('Error getting booking:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: 'Failed to fetch booking'
            })
        };
    }
};

/**
 * Create a new booking
 * POST /bookings
 */
exports.createBooking = async (event) => {
    const AWS = require('aws-sdk');
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    const { v4: uuidv4 } = require('uuid');
    
    const tableName = process.env.BOOKINGS_TABLE_NAME;
    
    try {
        const body = JSON.parse(event.body || '{}');
        const { roomId, guestName, guestEmail, checkInDate, checkOutDate } = body;
        
        // Validation
        if (!roomId || !guestName || !guestEmail || !checkInDate || !checkOutDate) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Missing required fields: roomId, guestName, guestEmail, checkInDate, checkOutDate'
                })
            };
        }
        
        const bookingId = uuidv4();
        const booking = {
            bookingId: bookingId,
            roomId: roomId,
            guestName: guestName,
            guestEmail: guestEmail,
            checkInDate: checkInDate,
            checkOutDate: checkOutDate,
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };
        
        const params = {
            TableName: tableName,
            Item: booking
        };
        
        await dynamodb.put(params).promise();
        
        // Trigger payment creation (in a real system, you'd use SQS or EventBridge)
        // For simplicity, we'll just return the booking
        
        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                data: booking,
                message: 'Booking created. Please complete payment.'
            })
        };
    } catch (error) {
        console.error('Error creating booking:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: 'Failed to create booking'
            })
        };
    }
};

/**
 * Get bookings by room ID
 * GET /bookings/room/{roomId}
 */
exports.getBookingsByRoom = async (event) => {
    const AWS = require('aws-sdk');
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    
    const tableName = process.env.BOOKINGS_TABLE_NAME;
    const roomId = event.pathParameters?.roomId;
    
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
            FilterExpression: 'roomId = :roomId',
            ExpressionAttributeValues: {
                ':roomId': roomId
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
        console.error('Error getting bookings by room:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: false,
                error: 'Failed to fetch bookings'
            })
        };
    }
};

