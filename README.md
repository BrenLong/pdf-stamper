# PDF Stamper

A tiny PDF-stamping proof-of-concept web app that adds licensing information and QR codes to PDF documents.

## Features

- **PDF Stamping**: Add licensing information to every page of a PDF
- **QR Code Generation**: Embed QR codes with license details
- **Two Footer Styles**: Bottom footer or diagonal watermark
- **Web Interface**: Simple HTML form for easy upload and processing
- **API Endpoint**: RESTful API for programmatic access
- **Input Validation**: Comprehensive validation using Zod
- **File Upload**: Support for PDF files up to 10MB

## Tech Stack

- **Node.js 20** + **TypeScript**
- **Express** for web server
- **pdf-lib** for PDF manipulation
- **qrcode** for QR code generation
- **multer** for file upload handling
- **zod** for input validation
- **vitest** for testing

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pdf-stamper
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`

## Usage

### Web Interface

1. Visit `http://localhost:3000`
2. Upload a PDF file
3. Fill in the required fields:
   - **Customer Name** (required)
   - **Order Number** (required)
   - **Licensed Quantity** (required)
4. Optionally fill in:
   - **Organization**
   - **License ID** (auto-generated if not provided)
   - **Date** (defaults to today)
   - **Footer Position** (bottom or diagonal)
5. Click "Stamp PDF" to download the stamped document

### API Usage

#### POST /api/stamp

**Content-Type**: `multipart/form-data`

**Required Fields**:
- `file`: PDF file to stamp
- `customer_name`: Customer name
- `order_number`: Order number
- `licensed_quantity`: Number of licensed copies

**Optional Fields**:
- `organization`: Organization name
- `license_id`: License ID (auto-generated if not provided)
- `date`: Date in ISO format (defaults to today)
- `footer_position`: "bottom" or "diagonal" (defaults to "bottom")

**Example cURL**:
```bash
curl -X POST http://localhost:3000/api/stamp \
  -F "file=@/path/to/input.pdf" \
  -F "customer_name=Jane Smith" \
  -F "order_number=CAIL-1234" \
  -F "licensed_quantity=35" \
  -F "organization=Limerick Cathedral Choir" \
  -F "footer_position=bottom" \
  --output stamped.pdf
```

**Response**: The stamped PDF file with `Content-Disposition: attachment; filename="stamped.pdf"`

## Footer Format

The stamped PDF includes a footer with the following format:

```
Licensed to: {customer_name} ({organization})
Order {order_number} • License {license_id} • Up to {licensed_quantity} copies • {date}
```

If no organization is provided, the organization part is omitted.

## QR Code

A QR code is embedded in the bottom-right corner of each page containing:
```
license:{license_id};order:{order_number};qty:{licensed_quantity}
```

## Footer Positions

### Bottom Footer
- Light gray footer line
- Small font (9pt) text at bottom margin
- QR code in bottom-right corner

### Diagonal Footer
- Semi-transparent diagonal text across the page
- 35° angle (configurable via `DIAGONAL_ANGLE` env var)
- QR code in bottom-right corner

## Environment Variables

- `PORT`: Server port (default: 3000)
- `FOOTER_OPACITY`: Footer opacity (default: 0.6)
- `DIAGONAL_ANGLE`: Diagonal text angle in degrees (default: 35)

## Development

### Available Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Build for production
- `npm run test`: Run tests in watch mode
- `npm run test:run`: Run tests once
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm run type-check`: Run TypeScript type checking

### Project Structure

```
/src
  /pdf/stamp.ts          # Core PDF stamping logic
  /routes/stamp.ts       # API route handler
  /server.ts            # Express server setup
  /views/index.html     # Web interface
  /lib/validation.ts    # Zod validation schemas
/tests
  stamp.spec.ts         # Unit tests
```

## Testing

Run the test suite:

```bash
npm test
```

The tests include:
- PDF stamping functionality validation
- License ID generation
- Different footer positioning
- Optional field handling
- Large quantity handling

## Docker

Build and run with Docker:

```bash
# Build the image
docker build -t pdf-stamper .

# Run the container
docker run -p 3000:3000 pdf-stamper
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200`: Success - returns stamped PDF
- `400`: Bad Request - validation errors or non-PDF file
- `500`: Internal Server Error - processing errors

Error responses include JSON with error details:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["customer_name"],
      "message": "Required"
    }
  ]
}
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 