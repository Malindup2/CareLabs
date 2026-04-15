"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Check, Trash2, Calendar, CreditCard, UserPlus, Info, X } from "lucide-react";
import { apiGetAuth, apiPutAuth, apiDeleteAuth, getToken, getUserIdFromToken } from "@/lib/api";
import toast from "react-hot-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  event: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = async () => {
    const token = getToken();
    const userId = getUserIdFromToken();
    if (!token || !userId) return;

    try {
      const data = await apiGetAuth<Notification[]>(`/notifications?userId=${userId}`, token);
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications");
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh every 2 minutes simple polling
    const interval = setInterval(fetchNotifications, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = getToken();
    if (!token) return;

    try {
      await apiPutAuth(`/notifications/${id}/read`, {}, token);
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = getToken();
    if (!token) return;

    try {
      await apiDeleteAuth(`/notifications/${id}`, token);
      setNotifications(notifications.filter((n) => n.id !== id));
      toast.success("Notification removed");
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  const getEventIcon = (event: string) => {
    switch (event) {
      case "APPOINTMENT_BOOKED":
      case "APPOINTMENT_ACCEPTED":
      case "APPOINTMENT_REMINDER":
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case "PAYMENT_SUCCESS":
      case "PAYMENT_FAILED":
        return <CreditCard className="h-4 w-4 text-emerald-500" />;
      case "DOC_APPROVED":
      case "DOC_REJECTED":
        return <UserPlus className="h-4 w-4 text-purple-500" />;
      default:
        return <Info className="h-4 w-4 text-slate-400" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all duration-200"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-sm text-slate-500">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    onClick={(e) => !n.read && handleMarkAsRead(n.id, e)}
                    className={`p-4 hover:bg-slate-50 transition-colors group relative cursor-pointer ${!n.read ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className="mt-1 h-8 w-8 rounded-full bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                        {getEventIcon(n.event)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-0.5">
                          <p className={`text-sm truncate ${!n.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                            {formatTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                          {n.message}
                        </p>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!n.read && (
                            <button
                              onClick={(e) => handleMarkAsRead(n.id, e)}
                              className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <Check className="h-3 w-3" /> Mark as read
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(n.id, e)}
                            className="text-[10px] font-bold text-red-500 hover:text-red-600 flex items-center gap-1 ml-auto"
                          >
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <button 
                onClick={fetchNotifications}
                className="text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Refresh feed
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
