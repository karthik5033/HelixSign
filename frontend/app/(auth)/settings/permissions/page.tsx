"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ShieldCheck, Save, Check, Lock, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CAPABILITIES = [
  { id: "read_telemetry", name: "Read Live Telemetry Streams", desc: "Access real-time feeds, graphs and alerts" },
  { id: "trigger_simulation", name: "Inject Crisis Simulations", desc: "Execute synthetic stress scenarios" },
  { id: "approve_mitigation", name: "Authorize Maneuver Burns", desc: "Approve delta-v mitigation commands" },
  { id: "upload_catalogs", name: "Ingest Data Catalogs", desc: "Upload batch TLE, CSV or JSON datasets" },
  { id: "modify_routing", name: "Mutate Routing Configuration", desc: "Change broker thresholds and node clusters" },
  { id: "manage_users", name: "Manage Roles & Access", desc: "Create operators and assign RBAC policies" },
];

export default function PermissionsPage() {
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({
    ADMIN: {
      read_telemetry: true,
      trigger_simulation: true,
      approve_mitigation: true,
      upload_catalogs: true,
      modify_routing: true,
      manage_users: true,
    },
    MANAGER: {
      read_telemetry: true,
      trigger_simulation: true,
      approve_mitigation: true,
      upload_catalogs: true,
      modify_routing: false,
      manage_users: false,
    },
    ANALYST: {
      read_telemetry: true,
      trigger_simulation: false,
      approve_mitigation: false,
      upload_catalogs: true,
      modify_routing: false,
      manage_users: false,
    },
    OPERATOR: {
      read_telemetry: true,
      trigger_simulation: false,
      approve_mitigation: false,
      upload_catalogs: false,
      modify_routing: false,
      manage_users: false,
    },
  });

  const [saved, setSaved] = useState(false);

  const togglePermission = (role: string, capId: string) => {
    setMatrix((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [capId]: !prev[role][capId],
      },
    }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Back button */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/settings" className="hover:text-foreground flex items-center gap-1 transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back to System Settings
        </Link>
        <span>/</span>
        <span className="font-mono text-foreground font-semibold">RBAC Permissions</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Role-Based Access Control (RBAC) Matrix
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure granular capability permissions for each operator persona
          </p>
        </div>

        <Button size="sm" onClick={handleSave} className="gap-1.5 text-xs font-semibold">
          <Save className="h-3.5 w-3.5" />
          Save Matrix
        </Button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-zinc-700 bg-zinc-800/80 text-zinc-200 text-xs font-medium animate-in fade-in-50">
          <Check className="h-4 w-4 text-zinc-300" />
          <span>RBAC capability matrix policy committed successfully!</span>
        </div>
      )}

      {/* Permissions Matrix Table */}
      <Card className="border border-border bg-card shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6 w-1/3">Capability Directive</TableHead>
                <TableHead className="text-center">Admin</TableHead>
                <TableHead className="text-center">Manager</TableHead>
                <TableHead className="text-center">Analyst</TableHead>
                <TableHead className="text-center pr-6">Operator</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CAPABILITIES.map((cap) => (
                <TableRow key={cap.id}>
                  <TableCell className="pl-6">
                    <span className="font-semibold text-xs text-foreground block">{cap.name}</span>
                    <span className="text-[11px] text-muted-foreground">{cap.desc}</span>
                  </TableCell>
                  {(["ADMIN", "MANAGER", "ANALYST", "OPERATOR"] as const).map((r) => (
                    <TableCell key={r} className="text-center">
                      <input
                        type="checkbox"
                        checked={matrix[r]?.[cap.id] || false}
                        onChange={() => togglePermission(r, cap.id)}
                        className="h-4 w-4 rounded border-input cursor-pointer"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

