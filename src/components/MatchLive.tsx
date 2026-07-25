"use client"

import { useEffect, useState, useRef } from "react"

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
  const prevMessageCount = useRef(initialMessages.length)

  // Only scroll when a NEW message actually arrives
  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
    prevMessageCount.current = messages.length
  }, [messages])

  // Poll every 2 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/match-live?matchId=${matchId}&t=${Date.now()}`)
        const data = await res.json()

        if (data.code !== undefined) setCode(data.code)
        if (data.messages) setMessages(data.messages)
      } catch (err) {
        console.error("Live update failed", err)
      }
    }, 2000)

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
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-purple-400">Private Match Code</h3>
          <span className="text-xs text-gray-500">Live</span>
        </div>

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
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Match Chat</h3>
          <span className="text-xs text-gray-500">Live</span>
        </div>

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