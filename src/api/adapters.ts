// Maps backend API shapes (src/api/types.ts) onto the existing UI-facing model (src/types.ts).
// The two models don't line up 1:1 — see the connect-frontend-to-api plan for the full list of gaps.

import { PC, PCStatus, PCGroup, Session } from "../types";
import { ApiSession, ApiSystem, ApiSystemStatus } from "./types";

const STATUS_MAP: Record<ApiSystemStatus, PCStatus> = {
  available: PCStatus.AVAILABLE,
  in_use: PCStatus.IN_USE,
  maintenance: PCStatus.MAINTENANCE,
  offline: PCStatus.OFFLINE,
};

export function apiStatusToPCStatus(status: ApiSystemStatus): PCStatus {
  return STATUS_MAP[status] ?? PCStatus.OFFLINE;
}

export function pcStatusToApiStatus(status: PCStatus): ApiSystemStatus {
  switch (status) {
    case PCStatus.AVAILABLE:
      return "available";
    case PCStatus.IN_USE:
      return "in_use";
    case PCStatus.MAINTENANCE:
      return "maintenance";
    case PCStatus.OFFLINE:
      return "offline";
  }
}

// The backend has no "zone" concept — only System Types (Part 6) with their own hourly
// rate, which isn't wired in this pass. This is a best-effort placeholder mapping.
export function platformToPCGroup(platform: ApiSystem["platform"]): PCGroup {
  switch (platform) {
    case "ps5":
    case "ps4":
    case "xbox":
      return PCGroup.CONSOLE;
    case "vr":
      return PCGroup.STREAMING;
    case "pc":
    case "other":
    default:
      return PCGroup.STANDARD;
  }
}

export function adaptSystemToPC(system: ApiSystem, activeSession?: ApiSession | null): PC {
  const specs = system.specs || {};
  let timeRemaining: number | undefined;

  const targetCap = activeSession?.targetCapMinutes ?? system.currentSession?.targetCapMinutes;
  const capChoiceMade = activeSession?.capChoiceMade ?? system.currentSession?.capChoiceMade;
  const startedAt = activeSession?.startedAt ?? system.currentSession?.startedAt;

  if (system.currentSession?.remainingMinutes != null) {
    // Backend-computed, funded-balance/gamepass-aware, and already clamped
    // to the player's target cap when one is set -- prefer this whenever
    // it's available rather than recomputing a cruder estimate here.
    timeRemaining = Math.max(0, system.currentSession.remainingMinutes * 60);
  } else if (activeSession && activeSession.durationMinutes != null) {
    const startedAtMs = new Date(activeSession.startedAt).getTime();
    const endsAtMs = startedAtMs + activeSession.durationMinutes * 60 * 1000;
    timeRemaining = Math.max(0, Math.round((endsAtMs - Date.now()) / 1000));
  } else if (targetCap != null && startedAt) {
    // Last-resort estimate when only a bare session (no live system.currentSession
    // data) is available -- this can't account for funded balance running out
    // before the cap does, since that isn't part of this shape.
    const startedAtMs = new Date(startedAt).getTime();
    const endsAtMs = startedAtMs + targetCap * 60 * 1000;
    timeRemaining = Math.max(0, Math.round((endsAtMs - Date.now()) / 1000));
  }

  return {
    id: system.id,
    name: system.name,
    group: platformToPCGroup(system.platform),
    status: apiStatusToPCStatus(system.status),
    ip: system.ipAddress || "—",
    specs: {
      cpu: specs.cpu || "Unknown",
      gpu: specs.gpu || "Unknown",
      ram: specs.ram || "Unknown",
      monitor: specs.monitor || "Unknown",
    },
    activeSessionId: activeSession?.id ?? system.currentSession?.sessionId,
    currentUser: activeSession
      ? activeSession.walkInPhone || activeSession.userId || "Guest"
      : system.currentSession?.userName || (system.currentSession ? "Guest" : undefined),
    timeRemaining,
    systemTypeId: system.systemTypeId,
    stationNumber: system.stationNumber != null && system.stationNumber !== "" ? Number(system.stationNumber) : null,
    platform: system.platform ?? null,
    targetCapMinutes: targetCap,
    capChoiceMade: capChoiceMade,
  };
}

export function adaptSessionToUI(
  session: ApiSession,
  pcName: string,
  ratePerHour: number,
  customerName: string
): Session {
  const durationMinutes = session.durationMinutes ?? 60;
  const startedAtMs = new Date(session.startedAt).getTime();
  const elapsedSeconds = Math.max(0, Math.round((Date.now() - startedAtMs) / 1000));
  const remainingSeconds =
    session.status === "in_progress" ? Math.max(0, durationMinutes * 60 - elapsedSeconds) : undefined;
  const totalCost = (durationMinutes / 60) * ratePerHour;

  const status: Session["status"] =
    session.status === "in_progress" ? "Active" : session.status === "cancelled" ? "Cancelled" : "Completed";

  return {
    id: session.id,
    pcId: session.systemId,
    pcName,
    customerName,
    customerId: session.userId || undefined,
    startTime: session.startedAt,
    endTime: session.endedAt || undefined,
    durationMinutes,
    remainingSeconds,
    ratePerHour,
    totalCost: parseFloat(totalCost.toFixed(2)),
    status,
    paymentStatus: session.isBilled ? "Paid" : "Unpaid",
  };
}
