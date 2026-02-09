(function () {
  if (window.streamLeader) return;

  const CHANNEL_NAME = "spotify_stream_all";
  const LEADER_KEY = "spotify_stream_leader";
  const PAYLOAD_KEY = "spotify_stream_payload";
  const LEADER_TTL_MS = 40000;
  const PAYLOAD_STALE_MS = 12000;
  const HEARTBEAT_MS = 5000;
  const CHECK_MS = 3000;
  const RETRY_MS = 2000;

  const tabId =
    (window.crypto && window.crypto.randomUUID && window.crypto.randomUUID()) ||
    `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const channel = typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel(CHANNEL_NAME)
    : null;

  const listeners = new Set();
  let started = false;
  let isLeader = false;
  let leaderHeartbeatId = null;
  let leaderCheckId = null;
  let pollAbort = null;
  let since = null;
  let lastPayload = null;

  function safeParse(json) {
    try {
      return JSON.parse(json);
    } catch (err) {
      return null;
    }
  }

  function getLeaderEntry() {
    return safeParse(localStorage.getItem(LEADER_KEY));
  }

  function setLeaderEntry(entry) {
    localStorage.setItem(LEADER_KEY, JSON.stringify(entry));
  }

  function clearLeaderEntry() {
    const entry = getLeaderEntry();
    if (entry && entry.id === tabId) {
      localStorage.removeItem(LEADER_KEY);
    }
  }

  function isEntryExpired(entry) {
    return !entry || typeof entry.expiresAt !== "number" || entry.expiresAt <= Date.now();
  }

  function getPayloadEntry() {
    const stored = safeParse(localStorage.getItem(PAYLOAD_KEY));
    if (!stored || typeof stored.at !== "number") return null;
    return stored;
  }

  function isPayloadStale(entry) {
    if (!entry) return true;
    return Date.now() - entry.at > PAYLOAD_STALE_MS;
  }

  function claimLeadership() {
    const entry = getLeaderEntry();
    if (!entry || isEntryExpired(entry)) {
      setLeaderEntry({ id: tabId, expiresAt: Date.now() + LEADER_TTL_MS });
    }
    const current = getLeaderEntry();
    return current && current.id === tabId;
  }

  function refreshLeaderLease() {
    setLeaderEntry({ id: tabId, expiresAt: Date.now() + LEADER_TTL_MS });
  }

  function notifyListeners(payload) {
    lastPayload = payload;
    listeners.forEach((handler) => {
      try {
        handler(payload);
      } catch (err) {
        // swallow to keep other listeners running
      }
    });
  }

  function persistPayload(payload) {
    try {
      localStorage.setItem(
        PAYLOAD_KEY,
        JSON.stringify({ at: Date.now(), payload })
      );
    } catch (err) {
      // ignore quota/storage errors
    }
  }

  function broadcastPayload(payload) {
    if (!channel) return;
    channel.postMessage({ type: "payload", payload });
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function pollLoop() {
    while (isLeader) {
      const query = since ? `?since=${encodeURIComponent(since)}` : "";
      try {
        const response = await fetch(`/api/stream/all${query}`);
        if (!response.ok) {
          await sleep(RETRY_MS);
          continue;
        }
        const data = await response.json();
        since = data.updatedAt || new Date().toISOString();
        notifyListeners(data);
        persistPayload(data);
        broadcastPayload(data);
      } catch (err) {
        await sleep(RETRY_MS);
      }
    }
  }

  function stopLeader() {
    isLeader = false;
    if (pollAbort) {
      pollAbort.abort();
      pollAbort = null;
    }
    if (leaderHeartbeatId) {
      clearInterval(leaderHeartbeatId);
      leaderHeartbeatId = null;
    }
  }

  function startLeader() {
    if (isLeader) return;
    isLeader = true;
    refreshLeaderLease();
    leaderHeartbeatId = setInterval(refreshLeaderLease, HEARTBEAT_MS);
    pollLoop();
  }

  function checkLeadership() {
    const entry = getLeaderEntry();
    const payloadEntry = getPayloadEntry();
    if (entry && entry.id === tabId) {
      if (!isLeader) {
        startLeader();
      }
      return;
    }

    if (isLeader) {
      stopLeader();
    }

    if (!entry || isEntryExpired(entry) || isPayloadStale(payloadEntry)) {
      if (entry && !isEntryExpired(entry) && isPayloadStale(payloadEntry)) {
        localStorage.removeItem(LEADER_KEY);
      }
      if (claimLeadership()) {
        startLeader();
      }
    }
  }

  function handleStorageEvent(event) {
    if (event.key === LEADER_KEY) {
      const entry = getLeaderEntry();
      if (!entry || entry.id !== tabId) {
        if (isLeader) {
          stopLeader();
        }
      }
      return;
    }
    if (event.key === PAYLOAD_KEY) {
      const stored = safeParse(event.newValue);
      if (stored && stored.payload) {
        notifyListeners(stored.payload);
      }
    }
  }

  function handleChannelMessage(event) {
    if (!event || !event.data || event.data.type !== "payload") return;
    const payload = event.data.payload;
    if (payload && payload.updatedAt) {
      since = payload.updatedAt;
    }
    notifyListeners(payload);
  }

  function start() {
    if (started) return;
    started = true;
    const payloadEntry = getPayloadEntry();
    if (payloadEntry && payloadEntry.payload) {
      notifyListeners(payloadEntry.payload);
    }
    checkLeadership();
    leaderCheckId = setInterval(checkLeadership, CHECK_MS);
    window.addEventListener("storage", handleStorageEvent);
    if (channel) {
      channel.addEventListener("message", handleChannelMessage);
    }
    window.addEventListener("beforeunload", () => {
      if (isLeader) {
        clearLeaderEntry();
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        checkLeadership();
      }
    });
  }

  function subscribe(handler) {
    if (typeof handler !== "function") return () => {};
    listeners.add(handler);
    if (lastPayload) {
      handler(lastPayload);
    }
    return () => {
      listeners.delete(handler);
    };
  }

  function stop() {
    if (!started) return;
    started = false;
    stopLeader();
    if (leaderCheckId) {
      clearInterval(leaderCheckId);
      leaderCheckId = null;
    }
    window.removeEventListener("storage", handleStorageEvent);
    if (channel) {
      channel.removeEventListener("message", handleChannelMessage);
    }
    clearLeaderEntry();
  }

  window.streamLeader = {
    start,
    stop,
    subscribe
  };
})();
