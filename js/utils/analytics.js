/* ============================================================
   analytics.js — 统计埋点（page_view / calculator_use / consult_click）
   与 server.py 的 POST /api/track 配合，数据写入 data/events.jsonl
   ============================================================ */
(function (global) {
  'use strict';

  var STORAGE_KEY_LAST_TOOLS = 'avc_last_tools';
  var THROTTLE_MS = 5000;
  var _lastTrack = {};

  function getToolIdFromPath() {
    var path = (typeof location !== 'undefined' && location.pathname) || '';
    var match = path.match(/\/tools\/([^/]+)/);
    return match ? match[1] : null;
  }

  function getLastTools() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY_LAST_TOOLS);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function addLastTool(toolId) {
    if (!toolId) return;
    try {
      var arr = getLastTools();
      if (arr.indexOf(toolId) === -1) arr.push(toolId);
      sessionStorage.setItem(STORAGE_KEY_LAST_TOOLS, JSON.stringify(arr));
    } catch (e) {}
  }

  function clearLastTools() {
    try {
      sessionStorage.removeItem(STORAGE_KEY_LAST_TOOLS);
    } catch (e) {}
  }

  function throttleKey(event, toolId) {
    return event + ':' + (toolId || '');
  }

  function isThrottled(event, toolId) {
    var key = throttleKey(event, toolId);
    var now = Date.now();
    if (_lastTrack[key] && now - _lastTrack[key] < THROTTLE_MS) return true;
    _lastTrack[key] = now;
    return false;
  }

  function track(event, data) {
    if (!event || typeof event !== 'string') return;
    var payload = {
      event: event,
      ts: new Date().toISOString(),
      path: (typeof location !== 'undefined' && location.pathname) || ''
    };
    if (data && typeof data === 'object') {
      if (data.tool_id != null) payload.tool_id = data.tool_id;
      if (data.source != null) payload.source = data.source;
      if (data.last_tools != null) payload.last_tools = data.last_tools;
      if (data.result_summary != null) payload.result_summary = data.result_summary;
    }

    if (event === 'calculator_use' && payload.tool_id && isThrottled(event, payload.tool_id)) return;
    if (event === 'calculator_use' && payload.tool_id) addLastTool(payload.tool_id);

    var body = JSON.stringify(payload);
    if (typeof navigator !== 'undefined' && navigator.sendBeacon && navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }))) return;
    if (typeof fetch !== 'undefined') {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body
      }).catch(function () {});
    }
  }

  function trackPageView(overrides) {
    var toolId = getToolIdFromPath();
    var data = overrides && typeof overrides === 'object' ? overrides : {};
    if (toolId != null) data.tool_id = toolId;
    track('page_view', data);
  }

  function trackConsultClick(overrides) {
    var data = { source: getToolIdFromPath() ? (typeof location !== 'undefined' ? location.pathname : '') : 'home', last_tools: getLastTools() };
    if (overrides && typeof overrides === 'object') {
      if (overrides.source != null) data.source = overrides.source;
      if (overrides.last_tools != null) data.last_tools = overrides.last_tools;
    }
    track('consult_click', data);
    clearLastTools();
  }

  global.Analytics = {
    track: track,
    trackPageView: trackPageView,
    trackConsultClick: trackConsultClick,
    getToolIdFromPath: getToolIdFromPath,
    getLastTools: getLastTools,
    addLastTool: addLastTool,
    clearLastTools: clearLastTools
  };
}(typeof window !== 'undefined' ? window : this));
