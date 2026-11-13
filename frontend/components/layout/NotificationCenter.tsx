"use client";

import React, { useState } from "react";
import { X, Check, BellRing, AlertTriangle, ShieldCheck, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NotificationCenterProps {
  onClose: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: "alert" | "info" | "success";
  read: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Synonymous Shuffling Attack Neutralized",
    desc: "RS(16,8) ECC decoder recovered all 16 symbols under 15% adversarial codon shuffle.",
    time: "4 mins ago",
    type: "alert",
    read: false,
  },
  {
    id: "notif-2",
    title: "Ripser Codon Homology Verified",
    desc: "Construct pUC19-lacZ verified with 16 persistent H₁ degeneracy loops with sequence fidelity.",
    time: "25 mins ago",
    type: "success",
    read: false,
  },
  {
    id: "notif-3",
    title: "E. coli K-12 MG1655 RefSeq CDS Synced",
    desc: "4,312 annotated open reading frames indexed from NCBI RefSeq (NC_000913.3).",
    time: "1 hour ago",
    type: "info",
    read: true,
  },
];

export function NotificationCenter({ onClose }: NotificationCenterProps) {
  const [items, setItems] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const markAllRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const removeNotification = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const unreadCount = items.filter((i) => !i.read).length;

  return (
    <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-xl border border-border bg-card p-4 shadow-2xl animate-in fade-in-50 slide-in-from-top-2">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-foreground">Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
              {unreadCount} new
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={markAllRead} className="h-7 text-xs">
            Mark all read
          </Button>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 max-h-80 overflow-y-auto space-y-2">
        {items.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No active notifications
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-lg border transition-colors relative flex items-start gap-3 ${
                item.read
                  ? "bg-muted/20 border-border/50 text-muted-foreground"
                  : "bg-muted/60 border-border text-foreground"
              }`}
            >
              <div className="mt-0.5">
                {item.type === "alert" && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                {item.type === "success" && <ShieldCheck className="h-4 w-4 text-zinc-300" />}
                {item.type === "info" && <Info className="h-4 w-4 text-blue-500" />}
              </div>
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground text-xs leading-none">
                    {item.title}
                  </h4>
                  <button
                    onClick={() => removeNotification(item.id)}
                    className="text-muted-foreground/60 hover:text-foreground p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <p className="mt-1 text-muted-foreground text-[11px] leading-relaxed">
                  {item.desc}
                </p>
                <span className="mt-1.5 block text-[10px] text-muted-foreground/70 font-mono">
                  {item.time}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

