"use client"

import { useEffect, useState } from "react"
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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`match-${matchId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${matchId}` },
        (payload) => {
          if (payload.new.private_code) {
            setCode(payload.new.private_code)
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "match_messages", filter: `match_id=eq.${matchId}` },
        async (payload) => {
          // Fetch the sender name
          const { data } = await supabase
            .from("profiles")
            .select("steam_name")
            .eq("id", payload.new.sender_id)
            .single()

          setMessages((prev) => [
            ...prev,
            {
              id: payload.new.id,
              message: payload.new.message,
              sender: data,
              created_at: payload.new.created_at,
            },
          ])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [matchId])

  async function postCode() {
    if (!codeInput.trim()) return
    await fetch("/api/match-code", {
      method: "POST",
      body: JSON.stringify({ matchId, code: codeInput }),
    })
    setCodeInput("")
  }

  async function sendChat() {
    if (!newMessage.trim()) return
    await fetch("/api/match-chat", {
      method: "POST",
      body: JSON.stringify({ matchId, message: newMessage }),
    })
    setNewMessage("")
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

        <div className="h-48 overflow-y-auto bg-[#08080d] rounded-xl p-4 mb-4 space-y-3">
          {messages.length > 0 ? (
            messages.map((msg) => (
              <div key={msg.id} className="text-sm">
                <span className="font-medium text-[#FF5C00]">{msg.sender?.steam_name}: </span>
                <span className="text-gray-300">{msg.message}</span>
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-sm text-center py-8">No messages yet</div>
          )}
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