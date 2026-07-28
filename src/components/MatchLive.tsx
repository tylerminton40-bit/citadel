"use client"

import { useEffect, useState } from "react"

const ADMIN_STEAM_ID = "76561199480856629"

type Message = {
  id: string
  message: string
  sender: { steam_name: string; steam_id?: string } | null
  created_at: string
}

export default function MatchLive({
  matchId,
  initialCode,
  initialMessages,
  isCreator,
  isAccepted,
  isParticipant,
  isAdmin = false,
  ruleset,
}: {
  matchId: string
  initialCode: string | null
  initialMessages: Message[]
  isCreator: boolean
  isAccepted: boolean
  isParticipant: boolean
  isAdmin?: boolean
  ruleset: string
}) {
  const [code, setCode] = useState(initialCode)
  const [messages, setMessages] = useState(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const [codeInput, setCodeInput] = useState("")
  const [copied, setCopied] = useState(false)

  const isNormal = ruleset?.startsWith("Normal")
  const canChat = isParticipant || isAdmin

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

  async function copyConnect() {
    if (!code) return
    const text = isNormal
      ? code.toLowerCase().startsWith("connect ")
        ? code
        : `connect ${code}`
      : code
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
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
          <div className="space-y-3">
            <div className="text-2xl font-mono font-bold tracking-widest text-center py-4 bg-[#08080d] rounded-xl">
              {code}
            </div>
            <button
              onClick={copyConnect}
              className="w-full py-2.5 rounded-xl text-sm bg-[#FF5C00]/15 text-[#FF5C00] hover:bg-[#FF5C00]/25 transition font-medium"
            >
              {copied ? "Copied!" : isNormal ? "Copy connect CODE" : "Copy Code"}
            </button>
            {isCreator && isAccepted && (
              <div className="space-y-2 pt-2">
                <input
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  type="text"
                  placeholder="Enter new code..."
                  className="w-full bg-[#08080d] border border-[#1c1c28] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FF5C00]"
                />
                <button
                  onClick={postCode}
                  className="w-full py-2 rounded-xl text-sm border border-[#1c1c28] hover:border-[#FF5C00]/50 transition"
                >
                  Update Code
                </button>
              </div>
            )}
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
            {isAccepted
              ? "Waiting for host to post the code..."
              : "Code appears after match is accepted."}
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
            messages.map((msg) => {
              const isAdminMsg = msg.sender?.steam_id === ADMIN_STEAM_ID
              return (
                <div key={msg.id} className="text-sm">
                  <span
                    className={`font-medium ${
                      isAdminMsg ? "text-cyan-400" : "text-[#FF5C00]"
                    }`}
                  >
                    {isAdminMsg ? "Admin" : msg.sender?.steam_name || "Unknown"}:{" "}
                  </span>
                  <span className={isAdminMsg ? "text-cyan-200" : "text-gray-300"}>
                    {msg.message}
                  </span>
                </div>
              )
            })
          ) : (
            <div className="text-gray-500 text-sm text-center py-8">No messages yet</div>
          )}
        </div>

        {canChat && (
          <div className="flex gap-3">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              type="text"
              placeholder={isAdmin && !isParticipant ? "Admin message..." : "Type a message..."}
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