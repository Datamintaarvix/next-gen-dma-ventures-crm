"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuditLogRecord, AuditCategory, auditCategoryEnum } from "@/lib/validations/settings";
import {
  FileText,
  Search,
  Download,
  Filter,
  RefreshCw,
  Loader2,
  Calendar,
  User,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export function AuditLogsTab() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
      });
      if (search.trim()) params.set("search", search.trim());
      if (category !== "all") params.set("category", category);

      const res = await fetch(`/api/settings/audit-logs?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setLogs(json.data || []);
        if (json.pagination) {
          setTotalPages(json.pagination.totalPages || 1);
          setTotalCount(json.pagination.total || 0);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleExportCsv = () => {
    window.open("/api/settings/audit-logs/export", "_blank");
  };

  const getCategoryBadgeClass = (cat: AuditCategory) => {
    switch (cat) {
      case "Security":
        return "bg-rose-100 text-rose-800";
      case "Company":
        return "bg-teal-100 text-teal-800";
      case "Users":
      case "Permissions":
        return "bg-blue-100 text-blue-800";
      case "Departments":
        return "bg-purple-100 text-purple-800";
      case "Data & Backup":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search action, administrator, or details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#078783]"
            />
          </div>

          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="text-xs px-3 py-1.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#078783]"
          >
            <option value="all">All Categories ({totalCount})</option>
            {auditCategoryEnum.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <Button type="submit" size="sm" className="bg-[#078783] text-white text-xs h-8">
            Filter
          </Button>
        </form>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={isLoading}
            className="text-xs h-8 border-gray-300 text-gray-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoading ? "animate-spin text-[#078783]" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleExportCsv}
            className="bg-[#192C34] hover:bg-[#11232B] text-white text-xs h-8 gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export Audit Trail (CSV)
          </Button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <Card className="border border-gray-200 bg-white shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-[#11232B]">
                Administrative Activity & Governance Trail
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Immutable chronological log of configuration updates, role modifications, and system events
              </CardDescription>
            </div>
            <span className="text-xs text-gray-500 font-medium">
              Showing page {page} of {totalPages} ({totalCount} total entries)
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Administrator</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Action Event</th>
                  <th className="py-2.5 px-4">Operation Summary</th>
                  <th className="py-2.5 px-4 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      <Loader2 className="w-5 h-5 text-[#078783] animate-spin mx-auto mb-2" />
                      Loading audit records...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      No audit records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                        <div className="font-mono text-[11px] text-gray-700">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900 block">{log.user}</span>
                        <span className="text-[10px] text-gray-500">{log.userEmail}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getCategoryBadgeClass(
                            log.category
                          )}`}
                        >
                          {log.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-[11px] text-[#078783]">
                        {log.action}
                      </td>

                      <td className="py-3 px-4 text-gray-700 max-w-sm">
                        <p className="line-clamp-2">{log.details}</p>
                        {log.affectedRecordId && (
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            Ref: {log.affectedRecordId}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-[11px] text-gray-500">
                        {log.ipAddress || "127.0.0.1"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t border-gray-100 bg-gray-50/50 text-xs">
              <span className="text-gray-500 text-[11px]">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2 text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 px-2 text-xs"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
