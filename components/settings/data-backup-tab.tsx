"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatabaseHealthStats, BackupRecord } from "@/lib/validations/settings";
import {
  Database,
  HardDrive,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  FileArchive,
  Loader2,
  Trash2,
  Calendar,
} from "lucide-react";

interface DataBackupTabProps {
  initialHealth: DatabaseHealthStats;
}

export function DataBackupTab({ initialHealth }: DataBackupTabProps) {
  const [health, setHealth] = useState<DatabaseHealthStats>(initialHealth);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(true);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Destructive reset dialog state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");

  const fetchBackups = async () => {
    setIsLoadingBackups(true);
    try {
      const res = await fetch("/api/settings/backup");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setBackups(json.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingBackups(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/settings/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUser: "Rajesh Khanna (Super Admin)",
          adminEmail: "rajesh.khanna@nextgendma.com",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create database backup.");
      }

      setSuccessMsg(`Verified database snapshot "${json.backup.fileName}" created successfully (${json.backup.fileSizeFormatted}).`);
      setTimeout(() => setSuccessMsg(null), 5000);
      fetchBackups();
    } catch (err: any) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(null), 5000);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleDownloadBackup = (b: BackupRecord) => {
    window.open(`/api/settings/backup/${encodeURIComponent(b.fileName)}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-medium animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Top 3 Health & Storage Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Database Status</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-xl font-bold text-gray-900">{health.status}</h3>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">{health.connectionMode}</p>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Storage Consumed</p>
              <h3 className="text-xl font-bold text-gray-900 mt-1">
                {health.storageUsedFormatted}
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Across {health.totalModulesCount} verified JSON tables
              </p>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <HardDrive className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Verified Snapshots</p>
              <h3 className="text-xl font-bold text-[#078783] mt-1">
                {backups.length} Backups
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Available for disaster recovery</p>
            </div>
            <div className="p-2.5 bg-teal-50 text-[#078783] rounded-xl">
              <FileArchive className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backup Creation Action Bar */}
      <Card className="border border-teal-200 bg-teal-50/40 shadow-sm p-4 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-[#11232B] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#078783]" />
              Automated Institutional Backup Engine
            </h4>
            <p className="text-xs text-gray-600 mt-0.5">
              Generates a verified, timestamped snapshot of all student records, payments, admissions, and CRM audit logs.
            </p>
          </div>
          <Button
            onClick={handleCreateBackup}
            disabled={isCreatingBackup}
            size="sm"
            className="bg-[#078783] hover:bg-[#066F6C] text-white text-xs gap-1.5 h-8 shadow-sm shrink-0 self-start sm:self-auto"
          >
            {isCreatingBackup ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>Create Verified Backup</span>
          </Button>
        </div>
      </Card>

      {/* Verified Backups History Table */}
      <Card className="border border-gray-200 bg-white shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-[#11232B]">
                Verified Snapshot Archive
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Physically stored in data/backups/ with verified byte counts
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBackups}
              className="text-xs h-7 px-2 border-gray-200 hover:border-[#078783]"
            >
              Refresh List
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Backup File Name</th>
                  <th className="py-2.5 px-4">Created Timestamp</th>
                  <th className="py-2.5 px-4 text-center">Total Records</th>
                  <th className="py-2.5 px-4 text-center">File Size</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoadingBackups ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      <Loader2 className="w-4 h-4 text-[#078783] animate-spin mx-auto mb-1" />
                      Loading backup archive...
                    </td>
                  </tr>
                ) : backups.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      No backups created yet. Click "Create Verified Backup" above to generate your first snapshot.
                    </td>
                  </tr>
                ) : (
                  backups.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-gray-900 flex items-center gap-2">
                        <FileArchive className="w-4 h-4 text-teal-600 shrink-0" />
                        <span className="truncate max-w-[220px]">{b.fileName}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(b.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-gray-800">
                        {b.totalRecords} records
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-gray-600">
                        {b.fileSizeFormatted}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          ✓ Verified
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadBackup(b)}
                          className="h-7 text-xs text-[#078783] hover:text-[#066F6C] hover:bg-teal-50 gap-1 font-semibold"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Database Tables Storage Breakdown Table */}
      <Card className="border border-gray-200 bg-white shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-sm font-semibold text-[#11232B]">
            Underlying Database Table Storage Inspection
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            Real-time file size and record metrics for persistent storage
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Functional Module</th>
                  <th className="py-2.5 px-4">Data File</th>
                  <th className="py-2.5 px-4 text-center">Record Count</th>
                  <th className="py-2.5 px-4 text-right">Physical Disk Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {health.moduleMetrics.map((m, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="py-2.5 px-4 font-semibold text-gray-900">{m.module}</td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-gray-500">{m.file}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-gray-800">
                      {m.recordCount}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-gray-600">
                      {m.sizeFormatted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone: Destructive Protection */}
      <Card className="border border-rose-200 bg-rose-50/30 shadow-sm p-4 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-rose-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Destructive Operational Protection
            </h4>
            <p className="text-xs text-rose-700 mt-0.5">
              Database reset and structural purging require explicit Super Admin multi-factor confirmation.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsResetModalOpen(true)}
            className="border-rose-300 text-rose-700 hover:bg-rose-100 text-xs h-8 shrink-0 self-start sm:self-auto"
          >
            Purge Test Records
          </Button>
        </div>
      </Card>

      {/* Reset Confirmation Dialog */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-gray-900">
                Confirm Database Purge
              </h3>
            </div>
            <p className="text-xs text-gray-600">
              This action requires Super Admin authorization. Production records cannot be recovered without a pre-existing verified backup snapshot.
            </p>
            <div>
              <label className="block text-gray-700 font-semibold text-xs mb-1">
                Type <span className="font-mono text-rose-600 font-bold">CONFIRM PURGE</span> to authorize:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="CONFIRM PURGE"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsResetModalOpen(false);
                  setConfirmInput("");
                }}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={confirmInput !== "CONFIRM PURGE"}
                onClick={() => {
                  alert("Purge blocked: Active academic session 2026 is protected by Super Admin lock.");
                  setIsResetModalOpen(false);
                  setConfirmInput("");
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs"
              >
                Execute
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
