"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@supabase/supabase-js"

type Message = {
  id: string
  message: string
  sender: { steam_name: string } | null
  created_at: string
}

export default function MatchLive({
  matchId,
  initialCode,
  initialMessages,
  isCreator,
  isAccepted,
  isParticipant,
}: {
  matchId: string
  initialCode: string | null
  initialMessages: Message[]
  isCreator: boolean
  isAccepted: boolean
  isParticipant: boolean
}) {
  const [code, setCode] = useState(initialCode)
  const [messages, setMessages] = useState(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const [codeInput, setCodeInput] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Auto scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Poll for new messages + code every 3 seconds (reliable)
  useEffect(() => {
    const interval = setInterval(async () => {
      // Get latest messages
      const { data: newMessages } = await supabase
        .from("match_messages")
        .select("*, sender:profiles(steam_name)")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true })

      if (newMessages) {
        setMessages(newMessages)
      }

      // Get latest code
      const { data: matchData } = await supabase
        .from("matches")
        .select("private_code")
        .eq("id", matchId)
        .single()

      if (matchData?.private_code) {
        setCode(matchData.private_code)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [matchId])

  async function postCode() {
    if (!codeInput.trim()) return
    await fetch("/api/match-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, code: codeInput }),
    })
    setCode(codeInput)
    setCodeInput("")
  }

  async function sendChat() {
    if (!newMessage.trim()) return

    const text = newMessage
    setNewMessage("")

    // Optimistic update
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        message: text,
        sender: { steam_name: "You" },
        created_at: new Date().toISOString(),
      },
    ])

    await fetch("/api/match-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, message: text }),
    })
  }

  return (
    <div className="space-y-6">
      {/* Private Code */}
      <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6">
        <h3 className="font-bold mb-4 text-purple-400">Private Match Code</h3>
        {code ? (
          <div className="text-2xl font-mono font-bold tracking-widest text-center py-4 bg-[#08080d] rounded-xl">
            {code}
          </div>
        ) : isCreator && isAccepted ? (
          <div className="space-y-3">
            <input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              type="text"
              placeholder="Enter private match code..."
              className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FF5C00]"
            />
            <button onClick={postCode} className="btn-primary w-full py-2 rounded-xl text-sm">
              Post Code
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">
            {isAccepted ? "Waiting for host to post the code..." : "Code appears after match is accepted."}
          </p>
        )}
      </div>

      {/* Chat */}
      <div className="bg-[#111118] border border-[#1c1c28] rounded-2xl p-6">
        <h3 className="font-bold mb-4">Match Chat</h3>

        <div className="h-52 overflow-y-auto bg-[#08080d] rounded-xl p-4 mb-4 space-y-3">
          {messages.length > 0 ? (
            messages.map((msg) => (
              <div key={msg.id} className="text-sm">
                <span className="font-medium text-[#FF5C00]">
                  {msg.sender?.steam_name || "Unknown"}:{" "}
                </span>
                <span className="text-gray-300">{msg.message}</span>
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-sm text-center py-8">No messages yet</div>
          )}
          <div ref={bottomRef} />
        </div>

        {isParticipant && (
          <div className="flex gap-3">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              type="text"
              placeholder="Type a message..."
              className="flex-1 bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FF5C00]"
            />
            <button onClick={sendChat} className="btn-primary px-5 py-2.5 rounded-xl text-sm">
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  )
}