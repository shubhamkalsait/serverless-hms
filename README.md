# 🏨 Hotel Management System - AWS Serverless Application

A simple, beginner-friendly Hotel Management System built entirely on AWS Serverless infrastructure. This application demonstrates how to build microservices using AWS Lambda, API Gateway, and DynamoDB.

## 📋 Table of Contents

1. [What This Project Does](#what-this-project-does)
2. [Architecture Overview](#architecture-overview)
3. [Prerequisites](#prerequisites)
4. [Project Structure](#project-structure)
5. [Step-by-Step Deployment Guide](#step-by-step-deployment-guide)
6. [Testing the APIs](#testing-the-apis)
7. [Frontend Setup](#frontend-setup)
8. [Cleanup Guide](#cleanup-guide)

---

## What This Project Does

This Hotel Management System helps you manage:
- **Rooms**: Add, list, and check room availability
- **Bookings**: Create and view hotel bookings
- **Payments**: Create and process payments for bookings

It's built using three independent microservices that communicate via REST APIs. Each microservice can be deployed, updated, and scaled independently.

---

## Architecture Overview

The application consists of three microservices:

### 1. **Room Service**
- Manages hotel rooms (add, list, check availability)
- Uses DynamoDB table: `hotel-rooms-{env}`
- Lambda functions: `getAllRooms`, `getRoomById`, `createRoom`, `checkAvailability`

### 2. **Booking Service**
- Manages hotel bookings (create, view, associate with rooms)
- Uses DynamoDB table: `hotel-bookings-{env}`
- Lambda functions: `getAllBookings`, `getBookingById`, `createBooking`, `getBookingsByRoom`

### 3. **Payment Service**
- Simulates payment processing (create, process, check status)
- Uses DynamoDB table: `hotel-payments-{env}`
- Lambda functions: `getAllPayments`, `getPaymentById`, `createPayment`, `processPayment`, `getPaymentsByBooking`

### Architecture Flow:
```
Frontend (S3) → API Gateway (HTTP API) → Lambda Functions → DynamoDB Tables
```

**Key Features:**
- Each service is independent
- No shared database
- RESTful API design
- CORS enabled for frontend access
- Environment-based configuration

---

## Prerequisites

Before you begin, make sure you have:

1. **AWS Account** with appropriate permissions
   - Access to AWS Console
   - Permissions to create: Lambda, API Gateway, DynamoDB, S3, IAM roles

2. **AWS CLI** installed and configured
   ```bash
   aws --version
   aws configure
   ```

3. **Node.js** (v16 or higher) for local development
   ```bash
   node --version
   ```

4. **npm** or **yarn** for package management

5. **Basic knowledge** of:
   - AWS Console navigation
   - REST APIs
   - JavaScript/Node.js basics

---

## Project Structure

```
hotel-management-system/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Rooms.js
│   │   │   ├── Bookings.js
│   │   │   └── Payments.js
│   │   ├── App.js
│   │   ├── config.js
│   │   └── index.js
│   └── package.json
├── services/
│   ├── room-service/
│   │   ├── index.js
│   │   └── package.json
│   ├── booking-service/
│   │   ├── index.js
│   │   └── package.json
│   └── payment-service/
│       ├── index.js
│       └── package.json
├── env/
│   ├── dev.env.example
│   └── prod.env.example
└── README.md
```

---

## Step-by-Step Deployment Guide

### Step 1: Create DynamoDB Tables

We'll create three DynamoDB tables, one for each service.

#### 1.1 Room Service Table

1. Go to AWS Console → DynamoDB
2. Click **"Create table"**
3. Configure:
   - **Table name**: `hotel-rooms-dev`
   - **Partition key**: `roomId` (String)
   - **Table settings**: Use default settings
   - **Capacity settings**: 
     - Select "On-demand" (recommended for beginners)
4. Click **"Create table"**
5. Wait for table status to become "Active"

#### 1.2 Booking Service Table

1. Click **"Create table"**
2. Configure:
   - **Table name**: `hotel-bookings-dev`
   - **Partition key**: `bookingId` (String)
   - **Table settings**: Use default settings
   - **Capacity settings**: On-demand
3. Click **"Create table"**

#### 1.3 Payment Service Table

1. Click **"Create table"**
2. Configure:
   - **Table name**: `hotel-payments-dev`
   - **Partition key**: `paymentId` (String)
   - **Table settings**: Use default settings
   - **Capacity settings**: On-demand
3. Click **"Create table"**

---

### Step 2: Create IAM Role for Lambda Functions

We'll create a single IAM role that all Lambda functions can use.

1. Go to AWS Console → IAM
2. Click **"Roles"** → **"Create role"**
3. Select **"AWS service"** → **"Lambda"** → **"Next"**
4. Search for and attach these policies:
   - `AWSLambdaBasicExecutionRole` (for CloudWatch logs)
   - `AmazonDynamoDBFullAccess` (for DynamoDB access)
   - Note: In production, use least-privilege policies
5. Click **"Next"**
6. **Role name**: `HotelManagementLambdaRole`
7. Click **"Create role"**

---

### Step 3: Create Lambda Functions

We'll create Lambda functions for each microservice.

#### 3.1 Prepare Lambda Deployment Packages

First, let's prepare the Lambda function code:

**For Room Service:**
```bash
cd services/room-service
npm install
zip -r room-service.zip .
```

**For Booking Service:**
```bash
cd services/booking-service
npm install
zip -r booking-service.zip .
```

**For Payment Service:**
```bash
cd services/payment-service
npm install
zip -r payment-service.zip .
```

#### 3.2 Create Room Service Lambda Functions

**3.2.1 Create getAllRooms Function**

1. Go to AWS Console → Lambda
2. Click **"Create function"**
3. Select **"Author from scratch"**
4. Configure:
   - **Function name**: `room-service-getAllRooms`
   - **Runtime**: Node.js 18.x or 20.x
   - **Architecture**: x86_64
   - **Execution role**: Use existing role → `HotelManagementLambdaRole`
5. Click **"Create function"**
6. Scroll down to **"Code source"**
7. Upload the `room-service.zip` file
8. In the code editor, replace the handler code with:
   ```javascript
   // Make sure handler is set to: index.getAllRooms
   ```
9. Set **Handler** to: `index.getAllRooms`
10. Click **"Deploy"**
11. Go to **"Configuration"** → **"Environment variables"**
12. Add environment variable:
    - Key: `ROOMS_TABLE_NAME`
    - Value: `hotel-rooms-dev`
13. Click **"Save"**

**3.2.2 Create getRoomById Function**

1. Click **"Create function"** again
2. Function name: `room-service-getRoomById`
3. Runtime: Node.js 18.x or 20.x
4. Execution role: `HotelManagementLambdaRole`
5. Upload `room-service.zip`
6. Handler: `index.getRoomById`
7. Add environment variable: `ROOMS_TABLE_NAME` = `hotel-rooms-dev`

**3.2.3 Create createRoom Function**

1. Function name: `room-service-createRoom`
2. Runtime: Node.js 18.x or 20.x
3. Execution role: `HotelManagementLambdaRole`
4. Upload `room-service.zip`
5. Handler: `index.createRoom`
6. Add environment variable: `ROOMS_TABLE_NAME` = `hotel-rooms-dev`

**3.2.4 Create checkAvailability Function**

1. Function name: `room-service-checkAvailability`
2. Runtime: Node.js 18.x or 20.x
3. Execution role: `HotelManagementLambdaRole`
4. Upload `room-service.zip`
5. Handler: `index.checkAvailability`
6. Add environment variable: `ROOMS_TABLE_NAME` = `hotel-rooms-dev`

#### 3.3 Create Booking Service Lambda Functions

Repeat the same process for booking service:

1. `booking-service-getAllBookings` (Handler: `index.getAllBookings`)
2. `booking-service-getBookingById` (Handler: `index.getBookingById`)
3. `booking-service-createBooking` (Handler: `index.createBooking`)
4. `booking-service-getBookingsByRoom` (Handler: `index.getBookingsByRoom`)

**Environment variable for all booking functions:**
- Key: `BOOKINGS_TABLE_NAME`
- Value: `hotel-bookings-dev`

#### 3.4 Create Payment Service Lambda Functions

Repeat for payment service:

1. `payment-service-getAllPayments` (Handler: `index.getAllPayments`)
2. `payment-service-getPaymentById` (Handler: `index.getPaymentById`)
3. `payment-service-createPayment` (Handler: `index.createPayment`)
4. `payment-service-processPayment` (Handler: `index.processPayment`)
5. `payment-service-getPaymentsByBooking` (Handler: `index.getPaymentsByBooking`)

**Environment variable for all payment functions:**
- Key: `PAYMENTS_TABLE_NAME`
- Value: `hotel-payments-dev`

---

### Step 4: Create API Gateway HTTP APIs

We'll create three HTTP APIs, one for each microservice.

#### 4.1 Create Room Service API

1. Go to AWS Console → API Gateway
2. Click **"Create API"**
3. Select **"HTTP API"** → **"Build"**
4. **API name**: `room-service-api`
5. Click **"Next"**
6. Click **"Add integration"**
7. Configure:
   - **Integration type**: Lambda
   - **Lambda function**: `room-service-getAllRooms`
   - **Integration name**: `getAllRooms`
8. Click **"Add route"**
   - **Method**: GET
   - **Path**: `/rooms`
   - **Integration**: `getAllRooms`
9. Click **"Add"**
10. Repeat steps 6-9 for other routes:

    | Method | Path | Lambda Function |
    |--------|------|----------------|
    | GET | `/rooms` | `room-service-getAllRooms` |
    | GET | `/rooms/{id}` | `room-service-getRoomById` |
    | POST | `/rooms` | `room-service-createRoom` |
    | GET | `/rooms/availability` | `room-service-checkAvailability` |

11. Click **"Next"** (skip stages)
12. Click **"Next"** (skip CORS for now, we'll add it later)
13. Review and click **"Create"**
14. Note the **Invoke URL** (e.g., `https://xxxxx.execute-api.us-east-1.amazonaws.com`)

**Enable CORS:**
1. Go to your API → **"Develop"** → **"Routes"**
2. Click on each route → **"CORS"**
3. Click **"Enable CORS"**
4. Configure:
   - **Access-Control-Allow-Origin**: `*`
   - **Access-Control-Allow-Methods**: GET, POST, PUT, DELETE, OPTIONS
   - **Access-Control-Allow-Headers**: `*`
5. Click **"Save"**

#### 4.2 Create Booking Service API

1. Create new HTTP API: `booking-service-api`
2. Add routes:

    | Method | Path | Lambda Function |
    |--------|------|----------------|
    | GET | `/bookings` | `booking-service-getAllBookings` |
    | GET | `/bookings/{id}` | `booking-service-getBookingById` |
    | POST | `/bookings` | `booking-service-createBooking` |
    | GET | `/bookings/room/{roomId}` | `booking-service-getBookingsByRoom` |

3. Enable CORS for all routes
4. Note the **Invoke URL**

#### 4.3 Create Payment Service API

1. Create new HTTP API: `payment-service-api`
2. Add routes:

    | Method | Path | Lambda Function |
    |--------|------|----------------|
    | GET | `/payments` | `payment-service-getAllPayments` |
    | GET | `/payments/{id}` | `payment-service-getPaymentById` |
    | POST | `/payments` | `payment-service-createPayment` |
    | POST | `/payments/{id}/process` | `payment-service-processPayment` |
    | GET | `/payments/booking/{bookingId}` | `payment-service-getPaymentsByBooking` |

3. Enable CORS for all routes
4. Note the **Invoke URL**

---

### Step 5: Update Frontend Configuration

Update the frontend to use your API Gateway endpoints. Since each microservice has its own API Gateway, you need to configure three separate URLs.

1. Create a `.env` file in the `frontend` directory:
   ```
   REACT_APP_ROOM_SERVICE_URL=https://your-room-service-api-id.execute-api.us-east-1.amazonaws.com
   REACT_APP_BOOKING_SERVICE_URL=https://your-booking-service-api-id.execute-api.us-east-1.amazonaws.com
   REACT_APP_PAYMENT_SERVICE_URL=https://your-payment-service-api-id.execute-api.us-east-1.amazonaws.com
   ```

2. Replace the URLs with your actual API Gateway invoke URLs from Step 4.

**Note:** The frontend makes calls to:
- Room Service: `${ROOM_SERVICE_URL}/rooms`
- Booking Service: `${BOOKING_SERVICE_URL}/bookings`
- Payment Service: `${PAYMENT_SERVICE_URL}/payments`

Make sure your API Gateway routes match these paths exactly.

---

## Testing the APIs

### Using AWS Console Test Feature

1. Go to Lambda → Select any function
2. Click **"Test"** tab
3. Create a new test event:

**For getAllRooms:**
```json
{
  "httpMethod": "GET",
  "path": "/rooms"
}
```

**For createRoom:**
```json
{
  "httpMethod": "POST",
  "path": "/rooms",
  "body": "{\"roomNumber\":\"101\",\"type\":\"standard\",\"price\":100,\"status\":\"available\"}"
}
```

### Using cURL

Replace `YOUR_API_URL` with your actual API Gateway URL:

```bash
# Get all rooms
curl https://YOUR_API_URL/rooms

# Create a room
curl -X POST https://YOUR_API_URL/rooms \
  -H "Content-Type: application/json" \
  -d '{"roomNumber":"101","type":"standard","price":100}'

# Create a booking
curl -X POST https://YOUR_BOOKING_API_URL/bookings \
  -H "Content-Type: application/json" \
  -d '{"roomId":"room-id-here","guestName":"John Doe","guestEmail":"john@example.com","checkInDate":"2024-01-15","checkOutDate":"2024-01-20"}'
```

### Using Postman

1. Import your API or create requests manually
2. Set method and URL
3. Add headers: `Content-Type: application/json`
4. Add body (for POST requests) in JSON format
5. Click **"Send"**

---

## Frontend Setup

### Local Development

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with your API Gateway URLs:
   ```bash
   REACT_APP_ROOM_SERVICE_URL=https://your-room-service-api-id.execute-api.us-east-1.amazonaws.com
   REACT_APP_BOOKING_SERVICE_URL=https://your-booking-service-api-id.execute-api.us-east-1.amazonaws.com
   REACT_APP_PAYMENT_SERVICE_URL=https://your-payment-service-api-id.execute-api.us-east-1.amazonaws.com
   ```
   Replace the URLs with your actual API Gateway invoke URLs from Step 4.

4. Start development server:
   ```bash
   npm start
   ```

5. Open browser to `http://localhost:3000`

### Build for Production

1. Build the React app:
   ```bash
   npm run build
   ```

2. This creates a `build` folder with static files

### Deploy to S3

1. **Create S3 Bucket:**
   - Go to S3 Console → **"Create bucket"**
   - **Bucket name**: `hotel-management-frontend` (must be globally unique)
   - **Region**: Same as your Lambda functions
   - **Block Public Access**: Uncheck all (for static website hosting)
   - Click **"Create bucket"**

2. **Enable Static Website Hosting:**
   - Go to your bucket → **"Properties"** tab
   - Scroll to **"Static website hosting"**
   - Click **"Edit"** → **"Enable"**
   - **Index document**: `index.html`
   - **Error document**: `index.html` (for React Router)
   - Click **"Save changes"**

3. **Set Bucket Policy:**
   - Go to **"Permissions"** tab → **"Bucket policy"**
   - Add this policy (replace `BUCKET_NAME`):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::BUCKET_NAME/*"
       }
     ]
   }
   ```
   - Click **"Save changes"**

4. **Upload Files:**
   - Go to **"Objects"** tab
   - Click **"Upload"**
   - Select all files from `frontend/build` folder
   - Click **"Upload"**

5. **Access Your Website:**
   - Go to **"Properties"** tab → **"Static website hosting"**
   - Copy the **Bucket website endpoint** URL
   - Open in browser

### Optional: CloudFront Setup

1. Go to CloudFront Console → **"Create distribution"**
2. **Origin domain**: Select your S3 bucket
3. **Viewer protocol policy**: Redirect HTTP to HTTPS
4. **Default root object**: `index.html`
5. Click **"Create distribution"**
6. Wait for deployment (15-20 minutes)
7. Use CloudFront URL to access your website

---

## Cleanup Guide

To avoid AWS charges, delete all resources:

### 1. Delete Lambda Functions

1. Go to Lambda Console
2. Select each function → **"Delete"** → Confirm
3. Delete all 12 functions

### 2. Delete API Gateway APIs

1. Go to API Gateway Console
2. Select each API → **"Delete"** → Type API name → Confirm
3. Delete all 3 APIs

### 3. Delete DynamoDB Tables

1. Go to DynamoDB Console
2. Select each table → **"Delete"** → Type table name → Confirm
3. Delete all 3 tables

### 4. Delete S3 Bucket

1. Go to S3 Console
2. Select bucket → **"Delete"**
3. Type bucket name → Confirm

### 5. Delete IAM Role

1. Go to IAM Console → **"Roles"**
2. Select `HotelManagementLambdaRole` → **"Delete"**
3. Confirm deletion

### 6. Delete CloudFront Distribution (if created)

1. Go to CloudFront Console
2. Select distribution → **"Disable"** → Wait
3. Then **"Delete"** → Confirm

---

## Troubleshooting

### Lambda Function Errors

- **Check CloudWatch Logs**: Lambda → Function → Monitor → Logs
- **Verify IAM Role**: Ensure role has DynamoDB permissions
- **Check Environment Variables**: Ensure table names are correct

### API Gateway Errors

- **Check Lambda Integration**: Ensure Lambda function names match
- **Verify CORS**: Check CORS settings if frontend can't access API
- **Check Route Configuration**: Ensure routes match frontend calls

### Frontend Errors

- **CORS Issues**: Enable CORS in API Gateway
- **API URL**: Verify API Gateway URLs in config.js
- **Network Errors**: Check browser console for detailed error messages

---

## Next Steps

- Add authentication (AWS Cognito)
- Implement proper error handling
- Add input validation
- Set up monitoring (CloudWatch Dashboards)
- Add automated testing
- Implement CI/CD pipeline
- Add more features (reviews, notifications, etc.)

---

## License

This project is for educational purposes.

---

## Support

For issues or questions:
1. Check AWS CloudWatch Logs for Lambda errors
2. Verify all environment variables are set correctly
3. Ensure IAM roles have proper permissions
4. Review API Gateway logs for integration issues

---

**Happy Learning! 🚀**

