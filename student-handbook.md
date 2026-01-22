# AWS Serverless Hotel Management System
## Student Handbook & Implementation Guide

**Version**: 1.0  
**Last Updated**: January 2026  
**Target Audience**: Computer Science & Software Engineering Students  
**Project Type**: Capstone / Advanced Cloud Architecture

---

## Table of Contents

1. [Introduction](#introduction)
2. [Learning Objectives](#learning-objectives)
3. [Project Overview](#project-overview)
4. [Architecture Deep Dive](#architecture-deep-dive)
5. [Microservices Explained](#microservices-explained)
6. [AWS Services Breakdown](#aws-services-breakdown)
7. [Security Concepts](#security-concepts)
8. [Step-by-Step Implementation](#step-by-step-implementation)
9. [Hands-On Exercises](#hands-on-exercises)
10. [Troubleshooting Guide](#troubleshooting-guide)
11. [Interview Preparation](#interview-preparation)
12. [Capstone Submission Checklist](#capstone-submission-checklist)

---

## Introduction

Welcome to the AWS Serverless Hotel Management System student handbook. This project demonstrates production-grade cloud architecture using only managed AWS services—no servers to manage, no infrastructure to maintain.

**What makes this different from traditional hotel systems?**

Traditional systems require:
- Dedicated servers (expensive, wasteful during off-peak)
- Database administrators (24/7 monitoring)
- Infrastructure scaling expertise
- Complex deployment pipelines

**Serverless approach:**
- Pay only for what you use (millisecond billing)
- Auto-scaling without configuration
- Deployment through simple CLI commands
- Focus on business logic, not infrastructure

---

## Learning Objectives

By completing this project, you will understand:

**Cloud Architecture**
- Microservices design principles
- Decoupled service communication
- Independent deployment pipelines
- Fault isolation and resilience

**AWS Services**
- Lambda execution model (cold starts, warm execution)
- API Gateway request/response transformation
- DynamoDB design patterns (partition keys, GSI)
- CloudFront caching strategies
- Route 53 DNS routing

**Production Practices**
- Security at every layer (IAM, CORS, WAF)
- Observability through CloudWatch and X-Ray
- Cost optimization techniques
- Disaster recovery and cleanup procedures

**Capstone Skills**
- Project documentation for GitHub
- System design justification
- Technical writing
- Architecture decision explanations

---

## Project Overview

### What is this Hotel Management System?

A complete backend + frontend system managing:
- Room inventory and availability
- Guest booking workflows
- Payment processing with transaction security
- Real-time room status updates
- Booking history and analytics

### Why Three Microservices?

**Separation of Concerns**:
- **Room Service**: Room inventory, availability, floor/capacity management
- **Booking Service**: Reservation lifecycle, guest interactions, date conflicts
- **Payment Service**: Transaction processing, PCI compliance, financial audit logs

**Benefits of this design**:
- Each service scales independently (payments peak != room searches peak)
- Deployment isolation (update room service without affecting bookings)
- Clear domain boundaries (easier to reason about)
- Team parallelization (different teams own each service)

### Technology Choices Explained

**Why Lambda?**
- No server management overhead
- Automatic scaling from 0 to thousands
- Cost-effective for unpredictable workloads
- Built-in monitoring and logging

**Why DynamoDB?**
- Millisecond latency
- Automatic partitioning (no sharding logic)
- Perfect for access pattern-driven design
- TTL support for data expiration

**Why not traditional databases?**
- RDS requires provisioned capacity (wasted during off-peak)
- Scaling is manual and complex
- DynamoDB's pay-per-request model aligns with serverless

**Why CloudFront?**
- Global distribution (latency reduction)
- DDoS protection at edge
- Caching reduces backend load
- Bandwidth cost optimization

---

## Architecture Deep Dive

### Complete System Diagram

![AWS Serverless Architecture](images/aws-serverless-architecture.png)

**Key Components**:
1. **Browser** (User's device)
2. **Route 53** (DNS resolution)
3. **CloudFront** (CDN for frontend, SSL termination)
4. **S3** (Static React files)
5. **API Gateway** (HTTP API endpoint per service)
6. **Lambda** (Business logic execution)
7. **DynamoDB** (Persistent data storage)
8. **CloudWatch** (Logs and metrics)
9. **X-Ray** (Distributed tracing)

### Request Flow Diagram

![Request Flow Diagram](images/request-flow-diagram.png)

**Example: User searches for available rooms**

```
1. Browser request → https://api-room.yourdomain.com/rooms
2. Route 53 resolves DNS → API Gateway endpoint
3. API Gateway validates request, adds auth headers
4. Lambda cold-start (or warm from pool)
5. Lambda queries DynamoDB with GSI filter
6. DynamoDB returns available rooms
7. Lambda formats response
8. Response travels back through API Gateway
9. Browser receives JSON, React renders rooms
10. X-Ray traces entire request (timing, errors)
11. CloudWatch records metrics
```

**Timing breakdown** (production conditions):
- DNS resolution: 10-50ms
- API Gateway processing: 5-20ms
- Lambda cold start: 100-500ms (first request) / 1-5ms (warm)
- DynamoDB query: 10-50ms
- Total: 125-625ms first request, 26-75ms subsequent

---

## Microservices Explained

### Room Service

**Responsibility**: Room inventory management

**Database Schema (DynamoDB)**:
```
PrimaryKey: roomId (e.g., "R-101-DELUXE")
Attributes:
  - roomId: String (Partition Key)
  - roomType: String (Deluxe, Standard, Suite)
  - floorNumber: Number
  - capacity: Number (beds/guests)
  - status: String (available, occupied, maintenance)
  - pricePerNight: Number
  - amenities: List (AC, WiFi, TV, etc.)
  - lastUpdated: String (ISO-8601 timestamp)

GlobalSecondaryIndex (GSI1):
  - GSI1PK: roomType-floorNumber
  - Query pattern: "Find all Deluxe rooms on floor 3"
```

**API Endpoints**:
```
GET /rooms
  Returns: All rooms with current status
  Queries DynamoDB: Table Scan (limits apply)
  Use case: Display room list on homepage

GET /rooms/{roomId}
  Returns: Specific room details
  Queries DynamoDB: Direct key lookup
  Response time: ~15-50ms

POST /rooms/availability
  Request body:
    {
      "checkIn": "2026-02-01",
      "checkOut": "2026-02-05",
      "roomType": "Deluxe",
      "guestCount": 2
    }
  Logic: Query booking-service to find overlaps
  Returns: List of available rooms for date range
```

**Why separate from booking?**
- Room changes (add amenity, change price) don't require booking restarts
- Room searches happen 10x more often than bookings
- Can scale room-service horizontally independent of booking-service

---

### Booking Service

**Responsibility**: Reservation lifecycle management

**Database Schema (DynamoDB)**:
```
PrimaryKey: bookingId (e.g., "BK-20260201-001")
Attributes:
  - bookingId: String (Partition Key)
  - guestId: String
  - roomId: String (links to room-service)
  - checkInDate: String (ISO-8601)
  - checkOutDate: String (ISO-8601)
  - status: String (pending, confirmed, checked-in, checked-out, cancelled)
  - totalPrice: Number
  - createdAt: String (booking creation timestamp)
  - expiresAt: Number (TTL for uncompleted bookings, 48 hours)

GlobalSecondaryIndex (GSI1):
  - GSI1PK: guestId
  - GSI1SK: createdAt
  - Query pattern: "Get all bookings for guest, sorted by date"
```

**Booking Lifecycle**:
```
Pending (0-48 hours)
  ↓ (Payment received)
Confirmed
  ↓ (Check-in day)
Checked-In
  ↓ (Check-out day)
Checked-Out
  (End)

Alternative path:
Pending → Cancelled (if payment fails or guest cancels)
```

**API Endpoints**:
```
POST /bookings
  Request body:
    {
      "guestName": "John Doe",
      "guestEmail": "john@example.com",
      "roomId": "R-101-DELUXE",
      "checkIn": "2026-02-01",
      "checkOut": "2026-02-05",
      "guests": 2
    }
  Business logic:
    1. Validate dates (checkOut > checkIn)
    2. Call room-service API to verify availability
    3. Generate bookingId
    4. Store in DynamoDB with status=pending
    5. Trigger payment-service (async via EventBridge)
    6. Return bookingId to client
  Response time: ~200-500ms (external API call)

GET /bookings/{bookingId}
  Returns: Booking details and status
  Use case: Guest checks booking confirmation

PUT /bookings/{bookingId}/status
  Admin endpoint to update status
  Triggers room-service to mark occupied/available
```

**Why EventBridge (implicit orchestration)?**
Instead of direct REST calls, use Event-Driven Architecture:
- Booking created → DynamoDB Stream → Lambda → EventBridge
- Payment service subscribes to "BookingCreated" events
- Decoupled, can handle partial failures

---

### Payment Service

**Responsibility**: Financial transactions and audit

**Database Schema (DynamoDB)**:
```
PrimaryKey: transactionId (e.g., "TXN-20260201-ABC123")
Attributes:
  - transactionId: String (Partition Key)
  - bookingId: String (links to booking-service)
  - amount: Number
  - currency: String (USD, INR, etc.)
  - paymentMethod: String (credit_card, debit_card, net_banking)
  - status: String (pending, completed, failed, refunded)
  - stripePaymentIntentId: String (PCI compliance: Stripe handles cards)
  - createdAt: String (ISO-8601)
  - completedAt: String (ISO-8601, null if pending)

GlobalSecondaryIndex (GSI1):
  - GSI1PK: bookingId
  - Query pattern: "Get payment history for booking"
```

**PCI Compliance Strategy**:
```
What we DO store:
  ✓ Transaction ID
  ✓ Amount
  ✓ Booking reference
  ✓ Payment status

What we NEVER store:
  ✗ Credit card numbers
  ✗ CVV codes
  ✗ Cardholder names
  (Stripe handles these via tokenization)
```

**API Endpoints**:
```
POST /payments
  Request body:
    {
      "bookingId": "BK-20260201-001",
      "amount": 5000,
      "currency": "INR",
      "stripeToken": "tok_visa_abc123"  (from Stripe.js on frontend)
    }
  Business logic:
    1. Validate amount matches booking total
    2. Call Stripe to process payment
    3. Store transaction in DynamoDB
    4. Update booking status to confirmed
    5. Send confirmation email (SES)
    6. Return transactionId

POST /webhooks/stripe
  Stripe calls this when payment state changes
  Handles:
    - Payment succeeded
    - Payment failed
    - Refund requested
    - Chargeback filed
```

**Why Stripe instead of direct processing?**
- PCI compliance (avoid storing cards)
- Fraud detection (built-in rules)
- Webhook support (async updates)
- Multi-currency support
- Refund management

---

## AWS Services Breakdown

### Lambda: Serverless Compute

**What is Lambda?**

Think of it as "rent a computer by the millisecond." You upload code, set memory allocation, and AWS handles everything else.

**Cold Start vs Warm Execution**:
```
First invocation (Cold Start):
1. AWS boots isolated container
2. Loads your code zip file
3. Initializes runtime
4. Executes handler function
Total: 100-500ms overhead

Subsequent invocations (Warm):
1. Container already running
2. Handler executes immediately
Total: 1-5ms

Production strategy:
- Provisioned Concurrency = keep N containers warm (prevents cold starts)
- For hotel system: ~5 warm containers per service
- Cost tradeoff: $0.50/hour per provisioned unit
```

**Lambda Pricing**:
```
You pay for:
- Request count: $0.0000002 per request
- Compute: $0.0000166667 per GB-second

Example: 1M requests, 256MB Lambda, 1sec duration
= 1,000,000 × $0.0000002 + (256/1024) × 1,000,000 × $0.0000166667
= $0.20 + $4.27 = $4.47/month
```

**When Lambda fails**:
```
Lambda timeouts after 15 minutes
Common causes:
  - DynamoDB throttling (unprovisioned capacity)
  - External API timeout (Stripe, email service)
  - Cold start during spike

Fallback strategy:
  - Return 503 (Service Unavailable)
  - Client retries with exponential backoff
  - CloudWatch alarm triggers investigation
```

---

### DynamoDB: NoSQL Database

**Key concept: Access Pattern-Driven Design**

Traditional databases: Design schema, then query  
DynamoDB: Define queries first, design schema around them

**Hotel Management Access Patterns**:
```
1. "Get room by ID" → Direct lookup
   Solution: Use roomId as Partition Key

2. "Find available rooms by type" → Range query
   Solution: Add GSI with (roomType, floorNumber)

3. "Get all bookings for guest" → Range query
   Solution: Add GSI with (guestId, createdAt)

4. "Find payments for booking" → Direct lookup
   Solution: bookingId as Partition Key in payment table
```

**Partition Keys Explained**:
```
roomId = "R-101-DELUXE"
↓
DynamoDB hashes this to determine partition
All queries for R-101-DELUXE go to same partition
↓
Supports:
  ✓ Direct lookups (fast)
  ✓ Fast updates
  ✗ Filtering (scans are slow)

Bad partition key example:
  status = "available"  (all available rooms in 1 partition = bottleneck)
```

**DynamoDB Capacity Modes**:
```
On-Demand (recommended for unpredictable):
  - No capacity planning
  - Pay per request: $1.25/M reads, $6.25/M writes
  - Auto-scales infinitely
  - Perfect for startup/student projects

Provisioned (for predictable, sustained):
  - Reserve capacity: 10 RCU = 10 strong reads/sec
  - Fixed cost even if unused
  - Must manage burst capacity
  - Cost advantage if consistent load
```

**TTL (Time To Live)**:
```
Set TTL on uncompleted bookings:
expiresAt = currentTime + 48 hours

DynamoDB automatically deletes after TTL
No manual cleanup needed
Saves storage costs
```

---

### API Gateway: HTTP Endpoint Manager

**Flow**:
```
Client request
  ↓
API Gateway (validates, transforms)
  ↓
Lambda (business logic)
  ↓
API Gateway (transforms response)
  ↓
Client response
```

**API Gateway responsibilities**:
```
1. Request Validation
   - Check HTTP method
   - Validate path parameters
   - Check Content-Type header

2. Authorization
   - JWT tokens
   - IAM roles
   - Custom authorizers

3. Request Transformation
   - Map query parameters to Lambda event
   - Add headers (CORS, tracking-id)

4. Response Transformation
   - Convert Lambda response to HTTP
   - Add headers
   - Handle errors (500 errors need reformatting)

5. Throttling
   - 10,000 RPS burst
   - 5,000 RPS steady-state
   - Returns 429 if exceeded
```

**CORS (Cross-Origin Resource Sharing)**:
```
Problem: Browser blocks requests from app.yourdomain.com
         to api-room.yourdomain.com (different domain)

Solution: API Gateway sends CORS headers:
  Access-Control-Allow-Origin: https://app.yourdomain.com
  Access-Control-Allow-Methods: GET, POST, PUT
  Access-Control-Allow-Headers: Content-Type, Authorization

Production: Never use wildcard (*) origin
            Always specify exact domain
```

**HTTP API vs REST API**:
```
HTTP API (recommended):
  - Faster (fewer features)
  - Cheaper ($0.35/M)
  - Good for simple operations
  - What we use in hotel system

REST API (legacy):
  - More features
  - More expensive ($1.35/M)
  - Better for complex transformations
```

---

### CloudFront: Content Delivery Network

**Why CDN?**

```
Without CloudFront:
User in Singapore requests app.yourdomain.com
  ↓
DNS resolves to S3 in us-east-1 (Virginia)
  ↓
Request travels 16,000km (8,000 km * 2 for latency)
  ↓
Response: 500-1000ms latency

With CloudFront:
User in Singapore requests app.yourdomain.com
  ↓
DNS resolves to CloudFront (nearest edge location)
  ↓
CloudFront serves cached copy
  ↓
Response: 50-100ms latency
```

**CloudFront with Origin Access Control (OAC)**:
```
S3 bucket is PRIVATE (no direct access)
  ↓
CloudFront has special permission to access S3
  ↓
User requests through CloudFront
  ↓
Only CloudFront can fetch from S3
  ↓
Direct S3 URLs don't work (prevents hotlinking)

Bucket policy example:
{
  "Effect": "Allow",
  "Principal": {
    "Service": "cloudfront.amazonaws.com"
  },
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::bucket-name/*",
  "Condition": {
    "StringEquals": {
      "AWS:SourceArn": "arn:aws:cloudfront::123456789:distribution/ABCD"
    }
  }
}
```

**Cache Headers**:
```
Static assets (images, CSS, JS):
  Cache-Control: max-age=31536000, immutable
  (Cache forever because files have content hash)

HTML files:
  Cache-Control: max-age=3600, must-revalidate
  (Cache 1 hour, check with origin daily)

API responses:
  Cache-Control: private, no-cache
  (Don't cache, keep fresh from origin)
```

---

### Route 53: DNS Management

**DNS Resolution Process**:
```
User enters: app.yourdomain.com
  ↓
1. Local DNS resolver (ISP)
   Asks: Where is app.yourdomain.com?
  ↓
2. Route 53 (AWS authoritative nameserver)
   Responds: That's a CloudFront alias
   Alias target: d111111abcdef8.cloudfront.net
  ↓
3. Local resolver returns CloudFront endpoint
  ↓
4. Browser connects to CloudFront
  ↓
5. CloudFront serves content from S3
```

**Alias Records vs Traditional CNAME**:
```
Traditional CNAME:
  app.yourdomain.com CNAME → d111111abcdef8.cloudfront.net
  Problem: Can't use CNAME for root domain (yourdomain.com)

Route 53 Alias (AWS feature):
  app.yourdomain.com Alias → CloudFront distribution
  Works for any domain level
  No additional DNS lookups (faster)
  Free (CNAME queries cost $0.40/M)
```

**Health Checks**:
```
Route 53 can monitor endpoint health
If Lambda API returns errors:
  1. Route 53 detects unhealthy
  2. Removes from DNS rotation
  3. Traffic routes to backup
  
For hotel system: Not needed (single region)
Useful for multi-region failover
```

---

### CloudWatch: Observability

**What CloudWatch does**:
```
1. Logs
   - Lambda prints → CloudWatch Logs
   - 5 free GB/month, then $0.50/GB
   - 15-month retention

2. Metrics
   - Lambda duration, errors, throttles
   - DynamoDB consumed capacity
   - API Gateway latency
   - Create dashboards

3. Alarms
   - Alert when metrics exceed thresholds
   - Send SNS notification
   - Trigger auto-scaling
```

**Log Insights Queries**:
```
Find errors in last hour:
fields @timestamp, @message
| filter @message like /ERROR/
| stats count(*) by @message
| sort count() descending

Analyze Lambda performance:
fields @duration, @maxMemoryUsed
| stats avg(@duration), max(@duration), pct(@duration, 99)

Track DynamoDB throttles:
fields @timestamp, userError
| filter userError = true
| stats count() by @timestamp
```

---

### X-Ray: Distributed Tracing

**Problem**: Lambda calls DynamoDB, DynamoDB slow. Where's the bottleneck?

**X-Ray Solution**:
```
Request ID: 1-5e6722a7-cc2xmpl46db7ae5d6d6 (generated by API Gateway)
  ↓
Lambda execution:
  Subsegment 1: DynamoDB query (45ms)
  Subsegment 2: Stripe API call (120ms)
  Subsegment 3: S3 upload (30ms)
  Total Lambda: 200ms
  ↓
API Gateway returns request with timing breakdown
  ↓
X-Ray console shows:
  - Request timeline (visual)
  - Latency per service
  - Errors with stack traces
  - Call dependencies (service map)
```

**X-Ray Pricing**:
```
Free: First 100K traces/month
Paid: $5 per million traces

For hotel system:
~1M requests/month
100k traced (10% sampling)
Cost: $0.50/month
```

---

## Security Concepts

### Defense in Depth

Multiple security layers prevent single points of failure:

```
Layer 1: Network
  - CloudFront blocks DDoS at edge
  - WAF rules block malicious requests
  - HTTPS enforces encryption

Layer 2: API Gateway
  - Validates Content-Type headers
  - Enforces CORS origin restrictions
  - Rate limiting (throttling)

Layer 3: Lambda
  - Validates input data
  - Checks permissions (IAM)
  - Logs all actions

Layer 4: Database
  - Encrypted at rest (default)
  - Encrypted in transit (HTTPS)
  - Item-level permissions (fine-grained)

Layer 5: Audit
  - CloudTrail logs all AWS API calls
  - CloudWatch logs Lambda execution
  - X-Ray traces requests end-to-end
```

### Least-Privilege IAM

**Bad (overpermissive)**:
```json
{
  "Effect": "Allow",
  "Action": "dynamodb:*",
  "Resource": "*"
}
```
*Allows everything in DynamoDB (wrong!)*

**Good (least-privilege)**:
```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:GetItem",
    "dynamodb:Query"
  ],
  "Resource": "arn:aws:dynamodb:us-east-1:123456789:table/room-service-prod"
}
```
*Allows only needed operations on specific table (right!)*

**Per-service IAM policy**:
```
Room Service Lambda:
  ✓ Read/Write room-service table
  ✓ Read booking-service table (for availability checks)
  ✗ Access payment-service table
  ✗ Delete any tables
  ✗ Create users

Booking Service Lambda:
  ✓ Read/Write booking-service table
  ✓ Query room-service (API call, not direct DB)
  ✓ Invoke payment-service Lambda
  ✗ Modify room table
```

---

### CORS and Same-Origin Policy

**Browser security**: Prevent scripts on evil.com from accessing your API

**Without CORS**:
```
Browser check:
"This JS came from app.yourdomain.com"
"Request to api-room.yourdomain.com"
"Different domain? BLOCKED!"
Error: CORS policy violation
```

**With CORS headers**:
```
Browser check:
"This JS came from app.yourdomain.com"
"Request to api-room.yourdomain.com"
"API Gateway header says: Access-Control-Allow-Origin: https://app.yourdomain.com"
"Domain matches? ALLOWED"
Request succeeds
```

**CORS implementation in API Gateway**:
```
Preflight request (OPTIONS):
Browser sends: Origin: https://app.yourdomain.com
API Gateway checks CORS config
Returns headers:
  Access-Control-Allow-Origin: https://app.yourdomain.com
  Access-Control-Allow-Methods: GET, POST, PUT
  Access-Control-Allow-Headers: Content-Type, Authorization

If CORS check passes:
Actual request (GET/POST/etc) is sent
```

---

### AWS WAF Rules

**Web Application Firewall**: Block malicious traffic patterns

**Common attacks prevented**:
```
SQL Injection:
  Pattern: "SELECT * FROM users WHERE id=' OR '1'='1"
  WAF Rule: If request contains SQL keywords + quotes → Block

XSS (Cross-Site Scripting):
  Pattern: "<script>alert('hacked')</script>"
  WAF Rule: If request contains <script> tags → Block

Rate-Based:
  Pattern: 100 requests/minute from same IP
  WAF Rule: If IP exceeds threshold → Block

Geo-Blocking:
  Pattern: Request from country not in whitelist
  WAF Rule: If country != allowed → Block
```

**WAF Pricing**: $5/month + $0.60/M requests

---

### HTTPS and TLS

**Without HTTPS**:
```
User types password
  ↓
Browser sends: POST /login password=securepass123
  ↓
Network packet travels unencrypted
  ↓
Hacker on coffee shop WiFi captures: password=securepass123
  ↓
Account compromised
```

**With HTTPS/TLS**:
```
User types password
  ↓
Browser encrypts with public key:
  password=securepass123 → kJ2!@#$%^&*()
  ↓
Network packet travels encrypted
  ↓
Hacker on WiFi captures: kJ2!@#$%^&*()
  ↓
Useless without private key (stored on server)
  ↓
Account safe
```

**ACM Certificate**:
```
AWS Certificate Manager provides free TLS certs
Auto-renewal via Route 53 validation
Installs on CloudFront + API Gateway automatically
Standard: 1 cert per domain
Wildcard: *.yourdomain.com covers all subdomains
```

---

## Step-by-Step Implementation

### Phase 1: Foundation (Week 1-2)

**Prerequisites**:
- AWS account (free tier eligible)
- AWS CLI configured locally
- Terminal/Command line knowledge
- Python 3.12 installed locally

**Step 1: Create AWS Account**

```bash
# Sign up: https://aws.amazon.com/free/
# Create root user account
# Verify email
# Set billing alert (prevents surprise charges)

# After creation:
1. Go to IAM console
2. Create new IAM user (avoid using root)
3. Attach AdministratorAccess policy (for learning)
4. Generate access key ID + secret key
5. Configure AWS CLI:
   aws configure
   # Enter Access Key ID
   # Enter Secret Access Key
   # Enter region: us-east-1
   # Enter output format: json
```

**Step 2: Set Up Route 53**

```bash
# Register or transfer domain to Route 53
# (Examples: GoDaddy, Namecheap have transfer processes)

# Create hosted zone
aws route53 create-hosted-zone \
  --name yourdomain.com \
  --caller-reference $(date +%s)

# Output will contain:
# - Hosted Zone ID (save this)
# - 4 nameserver addresses

# Update domain registrar to use Route 53 nameservers
# (Confirm DNS propagation: ~30 minutes)

# Test:
nslookup yourdomain.com
# Should return Route 53 nameservers
```

**Step 3: Request ACM Certificates**

```bash
# Request certificate for main domain
aws acm request-certificate \
  --domain-name yourdomain.com \
  --subject-alternative-names \
    app.yourdomain.com \
    api-room.yourdomain.com \
    api-booking.yourdomain.com \
    api-payment.yourdomain.com \
  --validation-method DNS

# Output: Certificate ARN (save this)

# Complete DNS validation:
# AWS console → ACM → Pending certificates
# Create Route 53 record for DNS validation
# Wait for ISSUED status (~2 minutes)
```

---

### Phase 2: DynamoDB Tables (Week 2)

```bash
# Create room-service table
aws dynamodb create-table \
  --table-name room-service-prod \
  --attribute-definitions \
    AttributeName=roomId,AttributeType=S \
    AttributeName=roomType,AttributeType=S \
    AttributeName=floorNumber,AttributeType=N \
  --key-schema \
    AttributeName=roomId,KeyType=HASH \
  --global-secondary-indexes \
    "[{
      \"IndexName\": \"roomType-floor-index\",
      \"KeySchema\": [
        {\"AttributeName\": \"roomType\", \"KeyType\": \"HASH\"},
        {\"AttributeName\": \"floorNumber\", \"KeyType\": \"RANGE\"}
      ],
      \"Projection\": {\"ProjectionType\": \"ALL\"},
      \"ProvisionedThroughput\": {
        \"ReadCapacityUnits\": 5,
        \"WriteCapacityUnits\": 5
      }
    }]" \
  --billing-mode PAY_PER_REQUEST

# Wait for table to be ACTIVE:
aws dynamodb describe-table \
  --table-name room-service-prod \
  --query 'Table.TableStatus'
```

**Repeat for booking-service and payment-service tables**

---

### Phase 3: Lambda Functions (Week 2-3)

**Local development**:

```python
# room_service/lambda_function.py
import json
import boto3
import os

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def lambda_handler(event, context):
    """Handle GET /rooms request"""
    
    try:
        # Parse request
        path = event['rawPath']
        method = event['requestContext']['http']['method']
        
        if method == 'GET' and path == '/rooms':
            # Scan all rooms
            response = table.scan(Limit=100)
            items = response['Items']
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'rooms': items,
                    'count': len(items)
                })
            }
        
        return {
            'statusCode': 404,
            'body': json.dumps({'error': 'Not Found'})
        }
    
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal Server Error'})
        }
```

**Deploy to AWS**:

```bash
# Create deployment package
cd room-service
pip install -r requirements.txt -t ./
zip -r function.zip . -x "*.pyc"

# Create Lambda function
aws lambda create-function \
  --function-name room-service-prod \
  --runtime python3.12 \
  --role arn:aws:iam::123456789:role/lambda-room-service-role \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://function.zip \
  --timeout 15 \
  --memory-size 256 \
  --environment Variables="{TABLE_NAME=room-service-prod,ENVIRONMENT=prod}"

# Update function (after changes)
zip -r function.zip .
aws lambda update-function-code \
  --function-name room-service-prod \
  --zip-file fileb://function.zip
```

---

### Phase 4: API Gateway (Week 3)

```bash
# Create HTTP API
aws apigatewayv2 create-api \
  --name room-service-api \
  --protocol-type HTTP \
  --target arn:aws:lambda:us-east-1:123456789:function:room-service-prod

# Output: ApiId (save this)

# Create integration
aws apigatewayv2 create-integration \
  --api-id [ApiId] \
  --integration-type AWS_LAMBDA \
  --payload-format-version '2.0' \
  --integration-subtype Lambda \
  --integration-method POST \
  --target-uri arn:aws:lambda:us-east-1:123456789:function:room-service-prod

# Create routes
aws apigatewayv2 create-route \
  --api-id [ApiId] \
  --route-key 'GET /rooms' \
  --target [IntegrationId]

# Deploy to $default stage
aws apigatewayv2 create-stage \
  --api-id [ApiId] \
  --stage-name '$default' \
  --auto-deploy

# Output: API Endpoint (e.g., https://abc123.execute-api.us-east-1.amazonaws.com)
```

---

### Phase 5: S3 + CloudFront (Week 4)

```bash
# Create S3 bucket
aws s3api create-bucket \
  --bucket hotel-frontend-prod-[account-id] \
  --region us-east-1

# Block public access (security)
aws s3api put-public-access-block \
  --bucket hotel-frontend-prod-[account-id] \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Build React app locally
cd frontend
npm run build
# Output: dist/ folder with HTML/CSS/JS

# Upload to S3
aws s3 sync dist/ \
  s3://hotel-frontend-prod-[account-id]/ \
  --delete

# Create CloudFront distribution (use AWS console)
# 1. Origin: S3 bucket
# 2. Origin Access Control: Create new OAC
# 3. Default cache behavior: HTTPS only
# 4. Custom SSL cert: ACM certificate
# 5. Alternative domain names: app.yourdomain.com
# 6. Create distribution

# Update S3 bucket policy to allow CloudFront OAC access
# (AWS console generates automatically)

# Map Route 53
aws route53 change-resource-record-sets \
  --hosted-zone-id [ZoneId] \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "app.yourdomain.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "d123.cloudfront.net",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'
```

---

## Hands-On Exercises

### Exercise 1: Add Room to DynamoDB

**Objective**: Create a room record in DynamoDB

```bash
# Add room using AWS CLI
aws dynamodb put-item \
  --table-name room-service-prod \
  --item '{
    "roomId": {"S": "R-101-DELUXE"},
    "roomType": {"S": "Deluxe"},
    "floorNumber": {"N": "1"},
    "capacity": {"N": "2"},
    "status": {"S": "available"},
    "pricePerNight": {"N": "5000"},
    "amenities": {"L": [
      {"S": "AC"},
      {"S": "WiFi"},
      {"S": "Smart TV"}
    ]},
    "lastUpdated": {"S": "2026-01-23T04:57:00Z"}
  }'

# Query room
aws dynamodb get-item \
  --table-name room-service-prod \
  --key '{"roomId": {"S": "R-101-DELUXE"}}'
```

### Exercise 2: Test Lambda Function Locally

```bash
# Install SAM CLI (serverless testing tool)
pip install aws-sam-cli

# Create test event
cat > events/get_rooms.json
{
  "version": "2.0",
  "routeKey": "GET /rooms",
  "rawPath": "/rooms",
  "headers": {
    "content-type": "application/json"
  },
  "requestContext": {
    "http": {
      "method": "GET",
      "path": "/rooms"
    }
  }
}

# Test locally
sam local start-api --port 3001
# In another terminal:
curl http://localhost:3001/rooms
```

### Exercise 3: Trace Request with X-Ray

```bash
# Enable X-Ray on Lambda
aws lambda update-function-configuration \
  --function-name room-service-prod \
  --tracing-config Mode=Active

# Make request
curl https://api-room.yourdomain.com/rooms

# View trace
aws xray get-trace-summaries \
  --start-time 2026-01-23T00:00:00Z \
  --end-time 2026-01-23T23:59:59Z \
  --query 'TraceSummaries[0].Id'
```

### Exercise 4: Create CloudWatch Dashboard

**Using AWS Console**:
1. Go to CloudWatch
2. Dashboards → Create Dashboard
3. Add widgets:
   - Lambda invocations (room-service)
   - Lambda duration (avg, max, p99)
   - API Gateway 4xx/5xx errors
   - DynamoDB consumed capacity
4. Set refresh to 1 minute
5. Monitor during peak hours

---

## Troubleshooting Guide

### Problem: Lambda says "permission denied"

```
Error: User: arn:aws:iam::123456789:role/lambda-role
       is not authorized to perform: dynamodb:GetItem
```

**Solution**: Update IAM role policy

```bash
# Get current policy
aws iam get-role-policy \
  --role-name lambda-room-service-role \
  --policy-name DynamoDB-Access

# Update to include DynamoDB actions
aws iam put-role-policy \
  --role-name lambda-room-service-role \
  --policy-name DynamoDB-Access \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:123456789:table/room-service-prod"
    }]
  }'
```

### Problem: "CORS policy block"

```
Error: Access to XMLHttpRequest from https://app.yourdomain.com
       blocked by CORS policy
```

**Solution**: Configure API Gateway CORS

```bash
aws apigatewayv2 update-api \
  --api-id [ApiId] \
  --cors-configuration '{
    "AllowOrigins": ["https://app.yourdomain.com"],
    "AllowMethods": ["GET", "POST", "PUT", "DELETE"],
    "AllowHeaders": ["Content-Type", "Authorization"],
    "MaxAge": 300
  }'
```

### Problem: DynamoDB returns "ProvisionedThroughputExceededException"

```
Error: Item collection size has exceeded the limit
```

**Solution**: Switch to on-demand billing

```bash
aws dynamodb update-billing-mode \
  --table-name room-service-prod \
  --billing-mode PAY_PER_REQUEST
```

### Problem: CloudFront serves old website

```
Uploaded new version but users still see old page
```

**Solution**: Invalidate CloudFront cache

```bash
aws cloudfront create-invalidation \
  --distribution-id [DistributionId] \
  --paths "/*"

# Wait for invalidation to complete:
aws cloudfront list-invalidations \
  --distribution-id [DistributionId]
```

---

## Interview Preparation

### Common Questions for Cloud Interviews

**Q: What's the difference between Lambda and EC2?**

A: Lambda is managed/serverless (pay per invocation, auto-scale), EC2 is IaaS (pay per hour, manual scaling). For unpredictable workloads, Lambda costs less.

**Q: How does DynamoDB differ from SQL databases?**

A: DynamoDB is NoSQL, schemaless, designed for access patterns. SQL requires schema design first. DynamoDB is faster for simple queries, SQL better for complex joins.

**Q: Why use CloudFront when users could access Lambda directly?**

A: CloudFront caches, reduces origin load, provides DDoS protection, and serves from edge locations (lower latency). CloudFront can serve global users quickly without needing multi-region Lambda.

**Q: How would you handle a spike in bookings?**

A: Lambda and DynamoDB auto-scale. API Gateway throttling might trigger 429s. Solution: Provisioned concurrency on Lambda, on-demand DynamoDB mode, or queue requests (SQS) for async processing.

**Q: What if a booking fails halfway through (booked room but payment failed)?**

A: Distributed transaction problem. Solutions:
- Compensating transaction (delete booking if payment fails)
- Saga pattern (Step Functions orchestrates rollback)
- Event sourcing (log all state changes, replay on failure)

**Q: How do you secure sensitive data in Lambda?**

A: Use AWS Secrets Manager to store API keys/passwords, fetch at runtime, never hardcode in code.

---

## Capstone Submission Checklist

### Documentation (30% grade)

- [ ] README.md is comprehensive (architecture, deployment, testing)
- [ ] Includes architecture diagrams with explanations
- [ ] Security section explains rationale for each choice
- [ ] Cost analysis (monthly estimates)
- [ ] Future enhancement suggestions

### Code Quality (30% grade)

- [ ] Python code follows PEP 8 (linting with `pylint`)
- [ ] Error handling (try/except blocks with logging)
- [ ] Lambda functions <500 lines (single responsibility)
- [ ] Configuration in environment variables (no hardcoding)
- [ ] React frontend properly handles API errors

### Infrastructure (25% grade)

- [ ] All three microservices deployed and working
- [ ] Custom domains configured for all endpoints
- [ ] HTTPS on all endpoints (verified in browser)
- [ ] IAM roles follow least-privilege
- [ ] No hardcoded AWS credentials in code

### Testing (15% grade)

- [ ] Unit tests for Lambda functions
- [ ] Integration tests (Lambda + DynamoDB)
- [ ] API testing (curl/Postman examples provided)
- [ ] Test coverage >70%
- [ ] GitHub Actions CI/CD (optional advanced)

### Presentation (Interview component)

- [ ] Explain architecture decisions (why Lambda over EC2?)
- [ ] Discuss trade-offs (on-demand vs provisioned DynamoDB)
- [ ] Demonstrate system (show each endpoint working)
- [ ] Discuss security (what attacks does WAF prevent?)
- [ ] Cost analysis (how much does this cost monthly?)
- [ ] Future work (multi-region, caching strategies)

---

## Appendix: Useful Commands Reference

```bash
# AWS CLI Configuration
aws configure list              # Show current config
aws sts get-caller-identity    # Verify AWS account

# Lambda Management
aws lambda list-functions --query 'Functions[].FunctionName'
aws lambda invoke --function-name room-service-prod \
  --payload '{"rawPath":"/rooms"}' response.json && cat response.json
aws logs tail /aws/lambda/room-service-prod --follow

# DynamoDB Operations
aws dynamodb list-tables
aws dynamodb describe-table --table-name room-service-prod
aws dynamodb scan --table-name room-service-prod --limit 10

# API Gateway
aws apigatewayv2 get-apis
aws apigatewayv2 get-routes --api-id [ApiId]

# CloudWatch
aws logs describe-log-groups
aws logs get-log-events --log-group-name /aws/lambda/room-service-prod \
  --log-stream-name '[latest]'
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=room-service-prod \
  --start-time 2026-01-23T00:00:00Z \
  --end-time 2026-01-23T23:59:59Z \
  --period 3600 \
  --statistics Average,Maximum

# Cost Estimation
aws ce get-cost-and-usage \
  --time-period Start=2026-01-01,End=2026-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

---

## Conclusion

This project teaches you modern cloud architecture. Implement systematically:
- Start with single microservice, expand to three
- Test locally before deploying
- Monitor from day one
- Document decisions (helps interviews)
- Focus on security fundamentals

**Good luck with your capstone!**

---

**Document Version**: 1.0  
**Created**: January 2026  
**Last Updated**: January 23, 2026  
**Author**: AWS Serverless Learning Team