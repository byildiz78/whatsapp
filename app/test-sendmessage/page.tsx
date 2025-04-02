"use client";

import { useState } from 'react';

export default function TestSendMessage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<{
    success?: boolean;
    message?: string;
    details?: any;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASEPATH}/api/venom/sendmessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, message }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          success: true,
          message: 'Message sent successfully!',
          details: data,
        });
        // Clear form after successful send
        setMessage('');
      } else {
        setStatus({
          success: false,
          message: data.error || 'Failed to send message',
          details: data,
        });
      }
    } catch (error) {
      setStatus({
        success: false,
        message: 'An error occurred while sending the message',
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Send WhatsApp Message</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium mb-1">
            Phone Number (with country code)
          </label>
          <input
            id="phoneNumber"
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="905551234567"
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Format: Country code + number without spaces or special characters (e.g., 905551234567)
          </p>
        </div>
        
        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1">
            Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message here..."
            className="w-full p-2 border border-gray-300 rounded h-32"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full p-2 rounded text-white ${
            isLoading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isLoading ? 'Sending...' : 'Send Message'}
        </button>
      </form>
      
      {status && (
        <div className={`mt-4 p-3 rounded ${status.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <p className="font-medium">{status.message}</p>
          {status.details && (
            <pre className="mt-2 text-xs overflow-x-auto">
              {JSON.stringify(status.details, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
