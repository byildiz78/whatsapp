"use client";

import FilteredChat from "@/components/chat/filtered-chat";

export default function ChatPage({ params }: { params: { phone: string } }) {
  return <FilteredChat phone={params.phone} />;
}
