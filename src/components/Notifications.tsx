"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Notification = {
  id: string
  title: string
  message: string | null
  link: string | null
  read: boolean
  created_at: string
}

export default function Notifications({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const unreadCount = notifications.filter((n) => !n.read).length

  async function load() {
    try {
      const res = await fetch(`/api/notifications?t=${Date.now()}`)
      const data = await res.json()
      if (data.notifications) setNotifications(data.notifications)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [])

  async function markRead(id: string) {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-400 hover:text-white transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#FF5C00] text-black text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-[#111118] border border-[#1c1c28] rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1c1c28] font-medium text-sm">
            Notifications
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link || "#"}
                  onClick={() => {
                    markRead(n.id)
                    setOpen(false)
                  }}
                  className={`block px-4 py-3 hover:bg-[#1c1c28] transition border-b border-[#1c1c28]/50 ${
                    !n.read ? "bg-[#FF5C00]/5" : ""
                  }`}
                >
                  <div className="text-sm font-medium">{n.title}</div>
                  {n.message && (
                    <div className="text-xs text-gray-400 mt-0.5">{n.message}</div>
                  )}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}