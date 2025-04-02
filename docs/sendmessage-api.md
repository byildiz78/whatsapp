# WhatsApp Direct Message API Documentation

This document describes how to use the WhatsApp Direct Message API to send messages to phone numbers directly.

## Endpoint

```
POST /api/venom/sendmessage
```

## Request Format

The API accepts JSON requests with the following structure:

```json
{
  "phoneNumber": "905551234567",
  "message": "Your message text here"
}
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| phoneNumber | string | **Required**. The recipient's phone number with country code, without any special characters or spaces (e.g., 905551234567) |
| message | string | **Required**. The text message to send |

## Response Format

### Success Response

```json
{
  "success": true,
  "messageId": "3EB0xxxx",
  "recipient": "905551234567@c.us"
}
```

### Error Response

```json
{
  "error": "Error message",
  "details": "Additional error details (if available)"
}
```

## Example Usage

### Using fetch (JavaScript)

```javascript
const sendWhatsAppMessage = async (phoneNumber, message) => {
  try {
    const response = await fetch('https://your-domain.com/whatsapp/api/venom/sendmessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber, message }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send message');
    }
    
    return data;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
};

// Example usage
sendWhatsAppMessage('905551234567', 'Hello from the API!')
  .then(result => console.log('Message sent:', result))
  .catch(error => console.error('Error:', error));
```

### Using axios (JavaScript)

```javascript
import axios from 'axios';

const sendWhatsAppMessage = async (phoneNumber, message) => {
  try {
    const response = await axios.post('https://your-domain.com/whatsapp/api/venom/sendmessage', {
      phoneNumber,
      message
    });
    
    return response.data;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error.response?.data || error.message);
    throw error;
  }
};
```

### Using curl (Command Line)

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"905551234567","message":"Hello from curl!"}' \
  https://your-domain.com/whatsapp/api/venom/sendmessage
```

## Notes

1. The WhatsApp client must be authenticated and running for this API to work.
2. Phone numbers should include the country code (e.g., 90 for Turkey).
3. The API will format the phone number by removing any non-digit characters.
4. The recipient must have WhatsApp installed on their device.
