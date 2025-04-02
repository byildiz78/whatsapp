"use client";

import { Message } from "@/app/types/chat";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useEffect, useRef, useState, useLayoutEffect } from "react";

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  // Create a ref for the message container
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const totalImagesRef = useRef(0);

  // Mesajlardaki toplam resim sayısını hesapla
  useEffect(() => {
    if (messages && messages.length > 0) {
      totalImagesRef.current = messages.filter(msg => msg.type === 'image' && msg.mediaUrl).length;
    }
  }, [messages]);

  // Function to scroll to bottom
  const scrollToBottom = (force = false) => {
    if (containerRef.current) {
      // Doğrudan container'ı en alta kaydır
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      
      // Eğer force ise, birkaç kez daha deneyelim
      if (force) {
        const scrollAttempts = [10, 50, 100, 300, 500, 1000, 2000];
        scrollAttempts.forEach(delay => {
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.scrollTop = containerRef.current.scrollHeight;
            }
          }, delay);
        });
      }
    }
  };

  // Resim yüklendiğinde çağrılacak fonksiyon
  const handleImageLoad = () => {
    setImagesLoaded(prev => {
      const newCount = prev + 1;
      // Eğer tüm resimler yüklendiyse, scroll yap
      if (newCount >= totalImagesRef.current) {
        scrollToBottom(true);
      }
      return newCount;
    });
  };

  // Scroll to bottom when messages change (new message received or sent)
  useEffect(() => {
    // Mesajlar değiştiğinde, resim sayacını sıfırla
    setImagesLoaded(0);
    
    // İlk yükleme veya mesajlar değiştiğinde scroll yap
    scrollToBottom();
    
    // Biraz gecikme ile tekrar deneyelim
    setTimeout(() => {
      scrollToBottom();
    }, 300);
  }, [messages]);

  // Scroll to bottom when component mounts (chat is selected)
  useLayoutEffect(() => {
    // Component mount olduğunda scroll yap
    scrollToBottom(true);
    
    // İlk yükleme sonrası flag'i kaldır
    setTimeout(() => {
      setIsFirstLoad(false);
    }, 2000);
  }, []);

  // Tüm resimler yüklendiğinde scroll yap
  useEffect(() => {
    if (imagesLoaded > 0 && imagesLoaded >= totalImagesRef.current) {
      scrollToBottom(true);
    }
  }, [imagesLoaded]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex",
            message.sender === "me" ? "justify-end" : "justify-start"
          )}
        >
          <div
            className={cn(
              "rounded-lg px-4 py-2 max-w-[70%]",
              message.sender === "me"
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            )}
          >
            {message.type === "text" || !message.type ? (
              <p className="text-sm">{message.content}</p>
            ) : message.type === "image" && message.mediaUrl ? (
              <div className="space-y-2">
                <div className="relative">
                  <img 
                    src={message.mediaUrl} 
                    alt="Image" 
                    className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                    onLoad={handleImageLoad}
                    onError={(e) => {
                      const target = e.currentTarget;
                      
                      // Base64 formatını kontrol et
                      if (message.mediaUrl?.startsWith('data:')) {
                        try {
                          const [header, base64] = message.mediaUrl.split(',');
                          const isValidHeader = header.includes('base64') && header.includes('image/');
                          const isValidBase64 = /^[A-Za-z0-9+/=]+$/.test(base64 || '');
                          
                          console.log("Base64 validation:", {
                            hasValidHeader: isValidHeader,
                            headerParts: header.split(';'),
                            base64Length: base64?.length,
                            isValidBase64,
                            firstChars: base64?.substring(0, 20) + '...',
                            lastChars: base64?.substring(base64.length - 20) + '...'
                          });

                          // Base64'ü manuel olarak çözmeyi dene
                          if (isValidBase64) {
                            try {
                              const binary = atob(base64);
                              const bytes = new Uint8Array(binary.length);
                              for (let i = 0; i < binary.length; i++) {
                                bytes[i] = binary.charCodeAt(i);
                              }
                              
                              // JPEG magic number kontrolü
                              const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
                              console.log("Binary validation:", {
                                length: bytes.length,
                                isJpeg,
                                firstBytes: Array.from(bytes.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' ')
                              });

                              // Eğer geçerli bir JPEG değilse, yeni bir Blob oluştur ve URL'yi güncelle
                              if (!isJpeg) {
                                const blob = new Blob([bytes], { type: 'image/jpeg' });
                                const url = URL.createObjectURL(blob);
                                target.src = url;
                                return;
                              }
                            } catch (binaryError) {
                              console.error("Binary conversion error:", binaryError);
                            }
                          }
                        } catch (error) {
                          console.error("Base64 validation error:", error);
                        }
                      }

                      console.error("Image load error:", {
                        src: target.src.substring(0, 100) + '...',
                        naturalWidth: target.naturalWidth,
                        naturalHeight: target.naturalHeight,
                        event: e,
                        type: message.type,
                        hasMediaUrl: !!message.mediaUrl,
                        mediaUrlLength: message.mediaUrl?.length
                      });

                      target.src = "/placeholder-image.svg";
                      target.alt = message.content || "Failed to load image";
                      target.classList.remove("cursor-pointer", "hover:opacity-90");
                      target.onclick = null;
                    }}
                    onClick={() => {
                      if (message.mediaUrl) {
                        const img = new Image();
                        img.src = message.mediaUrl;
                        img.onload = () => {
                          console.log("Image preview loaded:", {
                            width: img.width,
                            height: img.height,
                            src: img.src.substring(0, 100) + '...'
                          });
                          const newWindow = window.open("", "_blank");
                          if (newWindow) {
                            newWindow.document.write(`
                              <html>
                                <head>
                                  <title>Image Preview</title>
                                  <style>
                                    body {
                                      margin: 0;
                                      display: flex;
                                      justify-content: center;
                                      align-items: center;
                                      min-height: 100vh;
                                      background: #000;
                                    }
                                    img {
                                      max-width: 100%;
                                      max-height: 100vh;
                                      object-fit: contain;
                                    }
                                  </style>
                                </head>
                                <body>
                                  <img src="${message.mediaUrl}" alt="Full size image" />
                                </body>
                              </html>
                            `);
                          }
                        };
                        img.onerror = (error) => {
                          console.error("Image preview error:", error);
                        };
                      }
                    }}
                    loading="lazy"
                  />
                  {message.content !== '[Media]' && message.content !== '[Media Error]' && message.content !== '[Media Unavailable]' && (
                    <p className="text-sm mt-1">{message.content}</p>
                  )}
                </div>
              </div>
            ) : message.type === "video" && message.mediaUrl ? (
              <div className="space-y-2">
                <video 
                  src={message.mediaUrl} 
                  controls 
                  className="rounded-lg max-w-full"
                  onError={(e) => {
                    e.currentTarget.src = "";
                    e.currentTarget.poster = "/placeholder-image.svg";
                  }}
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>
                {message.content !== '[Media]' && message.content !== '[Media Error]' && message.content !== '[Media Unavailable]' && (
                  <p className="text-sm">{message.content}</p>
                )}
              </div>
            ) : message.type === "document" && message.mediaUrl ? (
              <div className="space-y-2 flex items-center gap-2">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <div>
                  <a
                    href={message.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm underline hover:text-primary"
                  >
                    {message.content !== '[Media]' ? message.content : 'Download Document'}
                  </a>
                  {message.content === '[Media Error]' && (
                    <p className="text-xs text-destructive">Failed to load document</p>
                  )}
                  {message.content === '[Media Unavailable]' && (
                    <p className="text-xs text-destructive">Document is no longer available</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm">{message.content}</p>
            )}
            <p className="text-xs opacity-50 mt-1">
              {message.timestamp ? format(new Date(message.timestamp), "HH:mm") : 'Unknown Time'}
            </p>
          </div>
        </div>
      ))}
      {/* This empty div is used as a reference to scroll to the bottom */}
      <div ref={messagesEndRef} />
    </div>
  );
}