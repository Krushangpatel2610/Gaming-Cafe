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

export function adaptSystemToPC(system: ApiSystem, activeSession?: ApiSession | null, customers?: any[]): PC {
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

  const isUUID = (val: string | null | undefined): boolean =>
    Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim()));

  const targetUserId = activeSession?.userId || system.currentSession?.userId;
  const matchedCustomer = targetUserId && Array.isArray(customers)
    ? customers.find((c: any) => c.userId === targetUserId || c.id === targetUserId)
    : undefined;

  const candidateNames = [
    matchedCustomer?.name,
    system.currentSession?.userName,
    (activeSession as any)?.userName,
  ];

  let resolvedUserName: string | undefined = undefined;
  for (const cand of candidateNames) {
    if (cand && typeof cand === "string" && cand.trim() && !isUUID(cand)) {
      resolvedUserName = cand.trim();
      break;
    }
  }

  if (!resolvedUserName && (activeSession || system.currentSession)) {
    if (matchedCustomer?.phone) {
      resolvedUserName = matchedCustomer.phone;
    } else if (activeSession?.walkInPhone) {
      resolvedUserName = activeSession.walkInPhone;
    } else if (targetUserId) {
      resolvedUserName = `Member ${targetUserId.slice(0, 6)}`;
    } else {
      resolvedUserName = "Guest";
    }
  }

  const resolvedUserPhone =
    matchedCustomer?.phone ||
    (activeSession as any)?.userPhone ||
    activeSession?.walkInPhone ||
    null;

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
    currentUser: resolvedUserName,
    currentUserPhone: resolvedUserPhone,
    timeRemaining,
    systemTypeId: system.systemTypeId,
    stationNumber: system.stationNumber != null && system.stationNumber !== "" ? Number(system.stationNumber) : null,
    platform: system.platform ?? null,
    targetCapMinutes: targetCap,
    initialCapMinutes: (activeSession as any)?.initialCapMinutes ?? system.currentSession?.initialCapMinutes ?? null,
    extensionMinutes: (activeSession as any)?.extensionMinutes ?? (system.currentSession as any)?.extensionMinutes ?? null,
    capChoiceMade: capChoiceMade,
    inBreak: activeSession?.inBreak ?? system.currentSession?.inBreak ?? Boolean(activeSession?.breakStartedAt || system.currentSession?.breakStartedAt),
    breakStartedAt: activeSession?.breakStartedAt ?? system.currentSession?.breakStartedAt ?? null,
  };
}

export function adaptSessionToUI(
  session: ApiSession,
  pcName: string,
  ratePerHour: number,
  customerName: string,
  customerPhone?: string | null,
  pc?: PC
): Session {
  const durationMinutes = session.durationMinutes ?? 60;
  const startedAtMs = new Date(session.startedAt).getTime();
  const elapsedSeconds = Math.max(0, Math.round((Date.now() - startedAtMs) / 1000));
  const remainingSeconds =
    session.status === "in_progress" ? Math.max(0, durationMinutes * 60 - elapsedSeconds) : undefined;
  const totalCost = (durationMinutes / 60) * ratePerHour;

  const status: Session["status"] =
    session.status === "in_progress" ? "Active" : session.status === "cancelled" ? "Cancelled" : "Completed";

  const unpaid = session.unpaidAmount ? parseFloat(session.unpaidAmount) : 0;
  const paymentStatus: Session["paymentStatus"] =
    unpaid > 0 ? "Unpaid" : session.isBilled ? "Paid" : "Unpaid";

  const initialCapMinutes = session.initialCapMinutes ?? pc?.initialCapMinutes ?? null;
  const targetCapMinutes = session.targetCapMinutes ?? pc?.targetCapMinutes ?? null;
  const extensionMinutes = session.extensionMinutes ?? pc?.extensionMinutes ?? (
    targetCapMinutes && initialCapMinutes && targetCapMinutes > initialCapMinutes
      ? targetCapMinutes - initialCapMinutes
      : null
  );

  return {
    id: session.id,
    pcId: session.systemId,
    pcName,
    customerName,
    customerId: session.userId || undefined,
    customerPhone: customerPhone ?? null,
    startTime: session.startedAt,
    endTime: session.endedAt || undefined,
    durationMinutes,
    remainingSeconds,
    ratePerHour,
    totalCost: parseFloat(totalCost.toFixed(2)),
    status,
    paymentStatus,
    unpaidAmount: unpaid > 0 ? unpaid : undefined,
    initialCapMinutes,
    targetCapMinutes,
    extensionMinutes,
  };
}
