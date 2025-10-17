import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';
import { FaBarcode, FaCamera, FaUpload, FaCheckCircle, FaTimesCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { getAllClasses } from '../../api/classes';

const BarcodeAttendanceScanner = () => {
  // UI mode: camera = continuous camera scanning; image = single-image upload with confirm
  const [mode, setMode] = useState('image'); // default to image-first (mobile friendly)

  const [scannedData, setScannedData] = useState(null);
  const [previewFileName, setPreviewFileName] = useState('');
  const [message, setMessage] = useState(null);
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]);
  const [todayName, setTodayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentDetails, setStudentDetails] = useState(null);
  const [studentEnrollmentsPreview, setStudentEnrollmentsPreview] = useState([]);
  const [isEnrolledPreview, setIsEnrolledPreview] = useState(null);
  const [prevAttendances, setPrevAttendances] = useState([]);
  const [prevAttendancesLoading, setPrevAttendancesLoading] = useState(false);
  const [manualSingle, setManualSingle] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [scanningActive, setScanningActive] = useState(false);
  const [counters, setCounters] = useState({});
  const [panelOpen, setPanelOpen] = useState(true);

  const [imageProcessing, setImageProcessing] = useState(false);
  const [imageReadyToMark, setImageReadyToMark] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [hwListening, setHwListening] = useState(true);
  const [autoMark, setAutoMark] = useState(true);
  const [imageAutoConfirm, setImageAutoConfirm] = useState(() => {
    try {
      const v = localStorage.getItem('imageAutoConfirm');
      return v === null ? true : v === 'true';
    } catch (e) { return true; }
  });
  const [lastMethodUsed, setLastMethodUsed] = useState('');
  const [autoClearDelay, setAutoClearDelay] = useState(0); // ms; 0 = immediate
  const [successPattern, setSuccessPattern] = useState('single');

  const lastScannedRef = useRef(null);
  const lastDecodedRef = useRef(null);
  const inFlightAutoConfirmRef = useRef(false);
  const manualSingleRef = useRef(manualSingle);
  const selectedClassesRef = useRef(selectedClasses);
  const classIdRef = useRef(classId);
  const scanningActiveRef = useRef(scanningActive);
  const recentScansRef = useRef({}); // { barcode -> timestampMillis }
  const successfullyMarkedRef = useRef({}); // { barcode: Set(classId) }
  const scanBufferRef = useRef('');
  const lastCharTsRef = useRef(0);
  const successBeep = useRef(typeof window !== 'undefined' ? new window.Audio('/assets/success-beep.mp3') : { play: () => {} });
  const [toasts, setToasts] = useState([]);
  const [flashSuccess, setFlashSuccess] = useState(false);
  // network logging removed

  // Server-backed session helpers
  const sessionIdRef = useRef(null);
  const getSessionId = () => {
    if (!sessionIdRef.current) {
      try { sessionIdRef.current = localStorage.getItem('scannerSessionId') || (`scanner-${window.location.hostname}`); localStorage.setItem('scannerSessionId', sessionIdRef.current); } catch (e) { sessionIdRef.current = `scanner-${Date.now()}`; }
    }
    return sessionIdRef.current;
  };

  const saveSessionToServer = async () => {
    try {
      const sid = getSessionId();
      // serialize successfullyMarked (Sets -> arrays)
      const serializableMarked = {};
      try {
        const sm = successfullyMarkedRef.current || {};
        Object.keys(sm).forEach(k => {
          const s = sm[k];
          if (s && typeof s === 'object' && typeof s.has === 'function') serializableMarked[k] = Array.from(s);
          else if (Array.isArray(s)) serializableMarked[k] = s.slice();
          else serializableMarked[k] = [];
        });
      } catch (e) { /* ignore */ }
      const payload = { sessionId: sid, data: { counters, selectedClasses, successfullyMarked: serializableMarked } };
      const res = await fetch(`${process.env.REACT_APP_ATTENDANCE_BACKEND_URL}/session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      return res.ok;
  } catch (e) { console.warn('saveSessionToServer failed', e); return false; }
  };

  const loadSessionFromServer = async () => {
    try {
      const sid = getSessionId();
  const res = await fetch(`${process.env.REACT_APP_ATTENDANCE_BACKEND_URL}/session/${sid}`);
  if (!res.ok) return null;
  const data = await res.json(); if (data && data.success && data.data) {
    const d = data.data;
    // reconstruct successfullyMarked Sets from arrays
    if (d.successfullyMarked) {
      try {
        const obj = {};
        Object.entries(d.successfullyMarked).forEach(([k, v]) => { obj[k] = new Set(Array.isArray(v) ? v : (v ? Object.keys(v) : [])); });
        d.successfullyMarked = obj;
      } catch (e) { /* ignore */ }
    }
    return d;
  }
  return null;
  } catch (e) { console.warn('loadSessionFromServer failed', e); return null; }
  };

  // Ensure session is persisted when the user refreshes/closes the page — use sendBeacon if available
  useEffect(() => {
    const handler = () => {
      try {
        const sid = getSessionId();
        const sm = successfullyMarkedRef.current || {};
        const serializableMarked = {};
        Object.keys(sm).forEach(k => { const s = sm[k]; serializableMarked[k] = (s && typeof s.has === 'function') ? Array.from(s) : (Array.isArray(s) ? s.slice() : []); });
        const payload = { sessionId: sid, data: { counters: counters || {}, selectedClasses: selectedClasses || [], successfullyMarked: serializableMarked } };
        const body = JSON.stringify(payload);
        if (navigator && typeof navigator.sendBeacon === 'function') {
          const blob = new Blob([body], { type: 'application/json' });
          navigator.sendBeacon(`${process.env.REACT_APP_ATTENDANCE_BACKEND_URL}/session`, blob);
        } else {
          // best-effort: synchronous XHR is deprecated; skip if not supported
        }
      } catch (e) { /* ignore */ }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [counters, selectedClasses]);

  // helper: toggle class selection
  const toggleClassSelection = (id, checked) => {
    setSelectedClasses(prev => {
      const cur = Array.isArray(prev) ? prev.slice() : [];
      if (checked) {
        if (!cur.includes(id)) cur.push(id);
      } else {
        const idx = cur.indexOf(id);
        if (idx >= 0) cur.splice(idx, 1);
      }
      return cur;
    });
  };

  const addToast = (type, text) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, type, text }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500);
  };

  const playSuccessPattern = async (pattern) => {
    try {
      if (!successBeep.current || typeof successBeep.current.play !== 'function') return;
      if (pattern === 'single') {
        await successBeep.current.play().catch(() => {});
      } else if (pattern === 'double') {
        await successBeep.current.play().catch(() => {});
        setTimeout(() => { successBeep.current.play().catch(() => {}); }, 180);
      }
    } catch (e) { /* ignore */ }
  };

  const getClassName = (cid) => {
    const found = classes.find(x => String(x.id) === String(cid));
    return found ? (found.className || found.name) : String(cid);
  };

  // Robustly interpret various shapes returned by /is-enrolled endpoints
  const parseEnrolled = (enrollData) => {
    try {
      if (!enrollData && enrollData !== false) return false;
      // direct boolean
      if (typeof enrollData === 'boolean') return enrollData;
      // common explicit fields
      if (typeof enrollData.enrolled !== 'undefined') return !!enrollData.enrolled;
      if (typeof enrollData.isEnrolled !== 'undefined') return !!enrollData.isEnrolled;
      if (typeof enrollData.success !== 'undefined' && typeof enrollData.enrolled !== 'undefined') return !!enrollData.enrolled;
      // sometimes the API returns { data: { enrolled: true } }
      if (enrollData.data && typeof enrollData.data.enrolled !== 'undefined') return !!enrollData.data.enrolled;
      // last resort: truthy fields
      if (enrollData.enrolled === true || enrollData.isEnrolled === true) return true;
      return false;
    } catch (e) { return false; }
  };

  // Wrapper to call /is-enrolled and push the raw request/response to networkLog
  const fetchIsEnrolled = async (studentId, cid) => {
    const url = `${process.env.REACT_APP_ATTENDANCE_BACKEND_URL}/is-enrolled/${encodeURIComponent(studentId)}/${cid}`;
    try {
      const res = await fetch(url);
      let text = null; try { text = await res.clone().text(); } catch (e) { text = null; }
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
      return { enrolled: parseEnrolled(data), raw: data, ok: res.ok, status: res.status };
    } catch (err) {
      return { enrolled: false, raw: null, ok: false, status: 0 };
    }
  };

  // fetch last 3 attendances for a student (best-effort; backend may return different shape)
  const fetchPrevAttendances = async (studentId) => {
    if (!studentId) { setPrevAttendances([]); return; }
    setPrevAttendancesLoading(true);
    try {
      // Resolve backend base URL with safe fallbacks
      let base = process.env.REACT_APP_ATTENDANCE_BACKEND_URL || (typeof window !== 'undefined' && window._env && window._env.REACT_APP_ATTENDANCE_BACKEND_URL) || '';
      if (!base) {
        // fallback to same origin (useful for dev without env set)
        try { base = (typeof window !== 'undefined' && window.location && window.location.origin) || ''; } catch (e) { base = ''; }
      }
      // strip trailing slash for consistent concatenation
      if (base && base.endsWith('/')) base = base.slice(0, -1);

      const tryPaths = [
        `/student-attendance/${encodeURIComponent(studentId)}?limit=3`,
        `/recent-attendance/${encodeURIComponent(studentId)}?limit=3`,
        `/attendances/${encodeURIComponent(studentId)}?limit=3`,
        `/students/${encodeURIComponent(studentId)}/attendances?limit=3`
      ];
      let success = false;
      for (const p of tryPaths) {
        const url = base ? `${base}${p}` : p; // if no base, try relative path
        try {
          const res = await fetch(url);
          if (!res.ok) {
            if (res.status === 404) continue; // try next fallback
            else continue;
          }
          let data = null;
          try { data = await res.json(); } catch (parseErr) { continue; }
          // common shapes: { success: true, data: [...] } OR { records: [...] } OR raw array
          const normalizeRecord = (r) => {
            try {
              const cid = r.classId || r.class_id || (r.class && (r.class.id || r.class.classId)) || r.class || null;
              const className = r.className || r.class_name || (r.class && (r.class.className || r.class.name)) || (cid ? getClassName(cid) : undefined);
              const timestamp = r.timestamp || r.time || r.join_time || r.created_at || r.createdAt || r.date || null;
              return Object.assign({}, r, { classId: cid, className, timestamp });
            } catch (e) { return r; }
          };
          if (data && data.success && Array.isArray(data.data)) { setPrevAttendances(data.data.map(normalizeRecord).slice(0,3)); success = true; break; }
          if (data && Array.isArray(data.records)) { setPrevAttendances(data.records.map(normalizeRecord).slice(0,3)); success = true; break; }
          if (Array.isArray(data)) { setPrevAttendances(data.map(normalizeRecord).slice(0,3)); success = true; break; }
          // unknown shape, try next
        } catch (inner) {
          // network or CORS error — try next fallback
          continue;
        }
      }
      if (!success) {
        setPrevAttendances([]);
        addToast('error', 'Could not load recent attendance (no endpoint responded)');
      }
    } catch (err) { setPrevAttendances([]); addToast('error', 'Error fetching recent attendance'); }
    finally { setPrevAttendancesLoading(false); }
  };

  useEffect(() => {
    try { localStorage.setItem('imageAutoConfirm', imageAutoConfirm); } catch (e) {}
  }, [imageAutoConfirm]);

  useEffect(() => {
    try { setTodayName(new Date().toLocaleDateString('en-US', { weekday: 'long' })); } catch (e) { setTodayName(''); }
    // Collapse right panel by default on small screens for a mobile-first layout
    try { if (typeof window !== 'undefined' && window.innerWidth < 900) setPanelOpen(false); } catch (e) {}

    const computeDefaultSelection = (list) => {
      try {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const todays = (list || []).filter(c => ((c.schedule_day || c.scheduleDay || '')).toString().toLowerCase() === today.toString().toLowerCase());
        if (todays && todays.length) {
          const now = new Date();
          const parseTime = (timeStr) => {
            if (!timeStr) return null;
            const parts = timeStr.split(':').map(p => parseInt(p, 10));
            return new Date(now.getFullYear(), now.getMonth(), now.getDate(), parts[0] || 0, parts[1] || 0, parts[2] || 0);
          };
          let chosen = null;
          for (const c of todays) {
            const s = parseTime(c.schedule_start_time || (c.schedule && c.schedule.startTime) || '');
            const e = parseTime(c.schedule_end_time || (c.schedule && c.schedule.endTime) || '');
            if (s && e && now >= s && now <= e) { chosen = c; break; }
          }
          if (!chosen) {
            let best = null; let bestDiff = Number.POSITIVE_INFINITY;
            for (const c of todays) {
              const s = parseTime(c.schedule_start_time || (c.schedule && c.schedule.startTime) || '');
              if (!s) continue;
              const diff = Math.abs(s - now);
              if (diff < bestDiff) { bestDiff = diff; best = c; }
            }
            chosen = best;
          }
          if (chosen) {
            const idStr = String(chosen.id);
            if (!manualSingleRef.current) setSelectedClasses([idStr]);
            setClassId(idStr);
          }
        }
      } catch (err) { /* ignore */ }
    };

    getAllClasses().then(data => {
      let allClasses = [];
      if (data && Array.isArray(data.data)) { allClasses = data.data; }
      else if (Array.isArray(data)) { allClasses = data; }
      
      // Filter to only show physical and hybrid classes (not online-only)
      const physicalClasses = allClasses.filter(c => {
        const method = (c.delivery_method || c.deliveryMethod || '').toLowerCase();
        return method === 'physical' || method.startsWith('hybrid');
      });
      
      setClasses(physicalClasses);
      computeDefaultSelection(physicalClasses);
    }).catch(() => setClasses([]));
  }, []);

  // Load saved session on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await loadSessionFromServer();
        if (!mounted) return;
        if (s) {
          if (s.counters) setCounters(s.counters);
          if (Array.isArray(s.selectedClasses)) setSelectedClasses(s.selectedClasses);
          if (s.successfullyMarked) {
            try { successfullyMarkedRef.current = s.successfullyMarked; } catch (e) {}
          }
        }
      } catch (e) {}
    })();
    return () => { mounted = false; };
  }, []);

  // Auto-save session when counters or selectedClasses change (debounced)
  useEffect(() => {
    const iv = setTimeout(() => { saveSessionToServer().catch(() => {}); }, 600);
    return () => clearTimeout(iv);
  }, [counters, selectedClasses]);

  // Camera scanner lifecycle (only active in camera mode)
  useEffect(() => {
    if (mode !== 'camera') return undefined;
    // when entering camera mode auto-start scanning for cashier flow
    try { setScanningActive(true); scanningActiveRef.current = true; } catch (e) {}
    // use a slightly higher FPS for faster detection and ensure the preview area is flexible
    const scanner = new Html5QrcodeScanner('barcode-reader', { fps: 15, qrbox: { width: 300, height: 90 } }, false);
    scanner.render(async (decodedText) => {
      const normalized = (decodedText || '').toString().trim();
      if (!scanningActiveRef.current) return;
      const nowTs = Date.now(); const DEDUPE_MS = 10000;
      const prev = recentScansRef.current[normalized];
      if (prev && (nowTs - prev) < DEDUPE_MS) { setMessage({ type: 'error', text: '⚠️ Duplicate scan ignored' }); return; }
      recentScansRef.current[normalized] = nowTs;
      // camera mode behaves as before: auto-mark for selected classes
      const targetClassIds = manualSingleRef.current
        ? (classIdRef.current ? [classIdRef.current] : [])
        : (selectedClassesRef.current && selectedClassesRef.current.length ? selectedClassesRef.current : (classIdRef.current ? [classIdRef.current] : []));
      const hasSelection = Array.isArray(targetClassIds) && targetClassIds.length > 0;
      if (!hasSelection) { setMessage({ type: 'error', text: '⚠️ Please select at least one class first' }); return; }
      if (normalized !== lastScannedRef.current) {
        lastScannedRef.current = normalized; setScannedData(normalized); setLoading(true);
        const markedSet = successfullyMarkedRef.current[normalized] || new Set();
        const toProcess = targetClassIds.filter(cid => !markedSet.has(String(cid)));
        if (toProcess.length === 0) { setLoading(false); setMessage({ type: 'error', text: '⚠️ Already marked for selected classes' }); return; }
        try {
          const detailsRes = await fetch(`${process.env.REACT_APP_ATTENDANCE_BACKEND_URL}/student-details/${encodeURIComponent(normalized)}`);
          const detailsData = await detailsRes.json();
          if (!detailsData.success) { setMessage({ type: 'error', text: `❌ Invalid student barcode: ${normalized}` }); setStudentDetails(null); setStudentEnrollmentsPreview([]); setLoading(false); return; }
          setStudentDetails(detailsData.student);
            fetchPrevAttendances(normalized);
          // if autoMark enabled, use unified routine; else proceed with inline marking
          if (autoMark) {
            await processAutoMark(normalized, toProcess, 'barcode');
          } else {
            const results = [];
            for (const cid of toProcess) {
              try {
                const enrollRes = await fetch(`${process.env.REACT_APP_ATTENDANCE_BACKEND_URL}/is-enrolled/${encodeURIComponent(normalized)}/${cid}`);
                const enrollData = await enrollRes.json();
                const enrolled = parseEnrolled(enrollData);
                if (!enrolled) { results.push({ classId: cid, ok: false, message: 'Not enrolled' }); continue; }
                const response = await fetch(`${process.env.REACT_APP_ATTENDANCE_BACKEND_URL}/mark-attendance`, {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ classId: cid, studentId: normalized, attendanceData: { method: 'barcode', status: 'present', join_time: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace('T', ' ') } })
                });
                if (response.ok) {
                  results.push({ classId: cid, ok: true, message: 'Marked' });
                  setCounters(prev => { const key = String(cid); const next = Object.assign({}, prev); next[key] = (next[key] || 0) + 1; return next; });
                  if (!successfullyMarkedRef.current[normalized]) successfullyMarkedRef.current[normalized] = new Set();
                  successfullyMarkedRef.current[normalized].add(String(cid));
                  // persist session after successful mark
                  saveSessionToServer().catch(() => {});
                } else results.push({ classId: cid, ok: false, message: 'Server error' });
              } catch (err) { results.push({ classId: cid, ok: false, message: 'Network error' }); }
            }
            setLoading(false); const allOk = results.length > 0 && results.every(r => r.ok);
            setMessage({ type: allOk ? 'success' : 'error', text: allOk ? '✅ Attendance updated for:' : '⚠️ Results:', summary: results });
            setLastMethodUsed('camera');
            if (results.some(r => r.ok)) { successBeep.current.play().catch(() => {}); }
          }
        } catch (error) { setLoading(false); setMessage({ type: 'error', text: '⚠️ Network error' }); }
      }
    }, () => {});

  return () => { scanner.clear().catch(() => {}); try { setScanningActive(false); scanningActiveRef.current = false; } catch (e) {} };
  }, [mode]);

  // sync refs
  useEffect(() => { manualSingleRef.current = manualSingle; }, [manualSingle]);
  useEffect(() => { selectedClassesRef.current = selectedClasses; }, [selectedClasses]);
  useEffect(() => { classIdRef.current = classId; }, [classId]);
  useEffect(() => { scanningActiveRef.current = scanningActive; }, [scanningActive]);

  // prune recent scans
  useEffect(() => {
    const iv = setInterval(() => {
      const now = Date.now(); const DEDUPE_MS = 10000;
      Object.keys(recentScansRef.current).forEach(k => { if ((now - recentScansRef.current[k]) > (DEDUPE_MS * 2)) delete recentScansRef.current[k]; });
    }, 15000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
  return () => {};
  }, []);

  useEffect(() => { if (manualSingle && selectedClasses && selectedClasses.length) setClassId(selectedClasses[0]); }, [manualSingle, selectedClasses]);

  const todaysClasses = classes.filter(c => { const sd = (c.schedule_day || c.scheduleDay || '').toString().toLowerCase(); return todayName && sd === todayName.toString().toLowerCase(); });

  // Process a scanned barcode for preview (used by image flow and hardware scanner)
  const processScannedBarcodeForPreview = async (rawBarcode) => {
    if (!rawBarcode) return;
    const normalized = (rawBarcode || '').toString().trim();
    setScannedData(normalized);
    setImageReadyToMark(false);
    setMessage(null);
    setStudentEnrollmentsPreview([]);
    try {
      setImageProcessing(true);
      const detailsRes = await fetch(`${process.env.REACT_APP_ATTENDANCE_BACKEND_URL}/student-details/${encodeURIComponent(normalized)}`);
      const detailsData = await detailsRes.json();
      if (!detailsData.success) { setMessage({ type: 'error', text: `❌ Invalid barcode: ${normalized}` }); setStudentDetails(null); setImageProcessing(false); return; }
      setStudentDetails(detailsData.student);
  fetchPrevAttendances(normalized);
      const targetClassIds = manualSingle
        ? (classId ? [classId] : [])
        : (selectedClasses && selectedClasses.length ? selectedClasses : (classId ? [classId] : []));
      const preview = [];
      for (const cid of targetClassIds) {
        try {
          const r = await fetchIsEnrolled(normalized, cid);
          preview.push({ classId: cid, enrolled: r.enrolled, markedInSession: (successfullyMarkedRef.current[normalized] || new Set()).has(String(cid)), enrollRaw: r.raw });
        } catch (err) { preview.push({ classId: cid, enrolled: false, markedInSession: false }); }
      }
      setStudentEnrollmentsPreview(preview);
      setImageReadyToMark(true);
      // if autoMark is enabled, proceed to mark immediately using 'hardware' method
      if (autoMark) {
        const toMark = targetClassIds;
        // when auto-marking from an image flow, pass method='image' so the routine
        // will reset the image preview UI after marking.
        if (toMark && toMark.length) await processAutoMark(normalized, toMark, 'image');
      }
    } catch (err) {
      setMessage({ type: 'error', text: '⚠️ Network or decode error' });
    } finally { setImageProcessing(false); }
  };

  // unified auto-mark routine
  const processAutoMark = async (normalized, targetClassIds, method) => {
    if (!normalized || !targetClassIds || !targetClassIds.length) return;
    setLoading(true);
    const results = [];
    for (const cid of targetClassIds) {
      try {
        const markedSet = successfullyMarkedRef.current[normalized] || new Set();
        if (markedSet.has(String(cid))) { results.push({ classId: cid, ok: false, message: 'Already marked (session)' }); continue; }
                const r = await fetchIsEnrolled(normalized, cid);
                if (!r.enrolled) { 
                  const reason = r.raw?.reason || 'unknown';
                  let message = 'Not enrolled';
                  
                  // Match MyClasses.jsx payment logic
                  if (reason === 'free_card') {
                    message = 'Free Card - Access granted';
                    // Allow access even though enrolled=false (this shouldn't happen, but handle it)
                  } else if (reason === 'half_card_paid') {
                    message = 'Half Card - Paid';
                  } else if (reason === 'half_payment_required') {
                    message = 'Half Card - 50% payment required';
                  } else if (reason === 'grace_period_expired') {
                    message = 'Payment required - grace period expired';
                  } else if (reason === 'payment_required') {
                    message = 'Payment required';
                  } else if (reason === 'not_enrolled') {
                    message = 'Not enrolled';
                  }
                  
                  results.push({ classId: cid, ok: false, message, raw: r.raw }); 
                  continue; 
                }
        const payload = { classId: cid, studentId: normalized, attendanceData: { method, status: 'present', join_time: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace('T', ' ') } };
        const response = await fetch(`${process.env.REACT_APP_ATTENDANCE_BACKEND_URL}/mark-attendance`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        let text = null; try { text = await response.clone().text(); } catch (e) { text = null; }
        let parsed = null; try { parsed = text ? JSON.parse(text) : null; } catch (e) { parsed = text; }
        const serverSaysAlready = (parsed && (parsed.alreadyMarked === true || (typeof parsed.message === 'string' && parsed.message.toLowerCase().includes('already')) || (parsed.success === true && parsed.already === true)));
        if (response.ok) {
          if (serverSaysAlready) {
            if (!successfullyMarkedRef.current[normalized]) successfullyMarkedRef.current[normalized] = new Set();
            successfullyMarkedRef.current[normalized].add(String(cid));
            // persist session after detecting persisted mark
            saveSessionToServer().catch(() => {});
            results.push({ classId: cid, ok: false, message: 'Already marked (persisted)', className: getClassName(cid) });
          } else {
            results.push({ classId: cid, ok: true, message: 'Marked', className: getClassName(cid) });
            setCounters(prev => { const key = String(cid); const next = Object.assign({}, prev); next[key] = (next[key] || 0) + 1; return next; });
            if (!successfullyMarkedRef.current[normalized]) successfullyMarkedRef.current[normalized] = new Set();
            successfullyMarkedRef.current[normalized].add(String(cid));
          }
        } else {
          const nonOkAlready = parsed && (parsed.alreadyMarked === true || (typeof parsed.message === 'string' && parsed.message.toLowerCase().includes('already')));
          if (nonOkAlready) {
            if (!successfullyMarkedRef.current[normalized]) successfullyMarkedRef.current[normalized] = new Set();
            successfullyMarkedRef.current[normalized].add(String(cid));
            saveSessionToServer().catch(() => {});
            results.push({ classId: cid, ok: false, message: 'Already marked (persisted)', className: getClassName(cid) });
          } else {
            results.push({ classId: cid, ok: false, message: 'Server error' });
          }
        }
      } catch (err) { results.push({ classId: cid, ok: false, message: 'Network error' }); }
    }
    setLoading(false);
    const allOk = results.length > 0 && results.every(r => r.ok);
    // translate classIds to class names in summary and schedule retries for failures
    const summary = results.map(r => ({ ...r, className: r.className || getClassName(r.classId) }));
    setMessage({ type: allOk ? 'success' : 'error', text: allOk ? '✅ Attendance updated for:' : '⚠️ Results:', summary });
    if (results.some(r => r.ok)) {
      playSuccessPattern(successPattern); setFlashSuccess(true); setTimeout(() => setFlashSuccess(false), 700); addToast('success', `Marked ${summary.filter(s=>s.ok).map(s=>s.className).join(', ')}`);
      // prepare UI for next scan: immediate clear when autoClearDelay === 0, otherwise wait
      if (method === 'image') {
        if (autoClearDelay <= 0) resetForNextImage(); else setTimeout(() => { resetForNextImage(); }, autoClearDelay);
      } else {
        if (autoClearDelay <= 0) { setScannedData(null); setStudentDetails(null); setStudentEnrollmentsPreview([]); } else setTimeout(() => { setScannedData(null); setStudentDetails(null); setStudentEnrollmentsPreview([]); }, autoClearDelay);
      }
    }
    if (results.some(r => !r.ok)) {
      addToast('error', `Some marks failed: ${summary.filter(s=>!s.ok).map(s=>`${s.className}:${s.message}`).join(', ')}`);
    }

    // Always prepare UI for the next scan (no manual retry). Honor autoClearDelay.
    const clearForNext = () => {
      if (method === 'image') resetForNextImage();
      else { setScannedData(null); setStudentDetails(null); setStudentEnrollmentsPreview([]); }
    };
    if (autoClearDelay <= 0) clearForNext(); else setTimeout(() => clearForNext(), autoClearDelay);

    setLastMethodUsed(method);
    // Emit a global event so other parts of the app (dashboard) can refresh immediately
    try {
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('attendance:updated', { detail: { studentId: normalized, classes: targetClassIds, results: summary } }));
      }
    } catch (e) { /* ignore */ }
  };

  // Hardware/USB keyboard HID scanner capture (timing-based)
  useEffect(() => {
    if (!hwListening) return undefined;
    const SCAN_CHAR_MAX_GAP = 40; // ms
    const SCAN_END_TIMEOUT = 80; // ms
    let timer = null;

    const onKey = (e) => {
      // ignore modifier keys
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;
      const now = Date.now();
      if (e.key.length === 1) {
        const gap = now - (lastCharTsRef.current || 0);
        if (gap > SCAN_CHAR_MAX_GAP) scanBufferRef.current = '';
        lastCharTsRef.current = now;
        scanBufferRef.current += e.key;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          const barcode = scanBufferRef.current.trim();
          scanBufferRef.current = '';
          lastCharTsRef.current = 0;
          if (barcode) processScannedBarcodeForPreview(barcode);
        }, SCAN_END_TIMEOUT);
      } else if (e.key === 'Enter') {
        if (timer) { clearTimeout(timer); timer = null; }
        const barcode = scanBufferRef.current.trim();
        scanBufferRef.current = '';
        lastCharTsRef.current = 0;
        if (barcode) processScannedBarcodeForPreview(barcode);
      }
    };

    window.addEventListener('keydown', onKey, true);
    return () => { window.removeEventListener('keydown', onKey, true); if (timer) clearTimeout(timer); };
  }, [hwListening, manualSingle, selectedClasses, classId]);

  // When an image is decoded and ready, auto-run the mark flow using the last decoded
  // value if the relevant toggles are enabled. Use a ref guard to avoid duplicate runs.
  useEffect(() => {
    const run = async () => {
      if (!imageReadyToMark) return;
      const val = lastDecodedRef.current;
      if (!val) return;
      if (!imageAutoConfirm && !autoMark) return;
      if (inFlightAutoConfirmRef.current) return;
      inFlightAutoConfirmRef.current = true;
      try {
        const targetClassIds = manualSingle
          ? (classId ? [classId] : [])
          : (selectedClasses && selectedClasses.length ? selectedClasses : (classId ? [classId] : []));
        if (!targetClassIds || !targetClassIds.length) {
          setMessage({ type: 'error', text: '⚠️ No class selected — cannot auto-mark.' });
          return;
        }
        if (autoMark) {
          // If we're in image mode, attribute the method as 'image' so
          // processAutoMark will execute image-specific reset behavior.
          const method = (mode === 'image') ? 'image' : 'barcode';
          await processAutoMark(val, targetClassIds, method);
        } else if (imageAutoConfirm) {
          await markAttendanceForImage(val);
        }
      } catch (e) {
        console.error('Auto-confirm effect failed', e);
      } finally { inFlightAutoConfirmRef.current = false; }
    };
    run();
  }, [imageReadyToMark, imageAutoConfirm, autoMark, manualSingle, selectedClasses, classId]);

  // ----- Image upload -> preview (no mark) flow -----
  const handleImageFile = async (file) => {
    if (!file) return;
    setImageProcessing(true); setImageReadyToMark(false); setMessage(null); setPreviewFileName(file.name || 'image');
    try {
      // provide a quick local preview for the user while we decode
      try {
        if (previewImageUrl) { URL.revokeObjectURL(previewImageUrl); }
      } catch (e) {}
      const url = URL.createObjectURL(file);
      setPreviewImageUrl(url);
      // use html5-qrcode's scanFile if available
      const tempId = 'barcode-temp';
      // create offscreen element required by library
      let tempEl = document.getElementById(tempId);
      if (!tempEl) { tempEl = document.createElement('div'); tempEl.id = tempId; tempEl.style.display = 'none'; document.body.appendChild(tempEl); }
      const html5Qr = new Html5Qrcode(tempId);
      // scanFile returns decodedText on success
      const res = await html5Qr.scanFile(file, /* showImage= */ false);
      await html5Qr.clear();
      const normalized = (res || '').toString().trim();
      // If decode returned nothing, treat as decode failure and bail out so UI doesn't get stuck
      if (!normalized) {
        setImageProcessing(false);
        setMessage({ type: 'error', text: '⚠️ No barcode decoded from image' });
        // keep preview visible for user to re-check image
        try { await html5Qr.clear(); } catch (e) {}
        return;
      }
      // keep a non-react ref of the last decoded value so debug UI can show it immediately
      lastDecodedRef.current = normalized;
      setScannedData(normalized);
      // fetch student preview details and enrollment status for selected classes
      const detailsRes = await fetch(`${process.env.REACT_APP_ATTENDANCE_BACKEND_URL}/student-details/${encodeURIComponent(normalized)}`);
      const detailsData = await detailsRes.json();
      if (!detailsData.success) { setMessage({ type: 'error', text: `❌ Invalid barcode in image: ${normalized}` }); setStudentDetails(null); setStudentEnrollmentsPreview([]); setImageProcessing(false); return; }
      setStudentDetails(detailsData.student);
  fetchPrevAttendances(normalized);
      // check enrollment for preview target classes (respect manualSingle)
      const targetClassIds = manualSingle
        ? (classId ? [classId] : [])
        : (selectedClasses && selectedClasses.length ? selectedClasses : (classId ? [classId] : []));
      const preview = [];
      for (const cid of targetClassIds) {
        try {
          const enrollRes = await fetch(`${process.env.REACT_APP_ATTENDANCE_BACKEND_URL}/is-enrolled/${encodeURIComponent(normalized)}/${cid}`);
          const enrollData = await enrollRes.json();
          const enrolled = parseEnrolled(enrollData);
          preview.push({ classId: cid, enrolled, markedInSession: (successfullyMarkedRef.current[normalized] || new Set()).has(String(cid)) });
        } catch (err) { preview.push({ classId: cid, enrolled: false, markedInSession: false }); }
      }
      setStudentEnrollmentsPreview(preview);
  setImageReadyToMark(true);
  // show a visible UI message when decoding succeeds so user doesn't rely on console
  try { setMessage({ type: 'info', text: `Decoded barcode: ${normalized}` }); } catch (e) {}
      setImageProcessing(false);
      // We intentionally do NOT call the marking routines directly here. Instead we
      // rely on the effect that watches `imageReadyToMark` to perform auto-mark or
      // auto-confirm using `lastDecodedRef` and `inFlightAutoConfirmRef` as guards.
      // Calling processAutoMark/markAttendanceForImage here and also relying on the
      // effect caused duplicate POSTs in some runs (state update + immediate call).
      // If neither autoMark nor imageAutoConfirm is enabled, the user will press
      // Confirm manually. If an auto flow is enabled, the effect will schedule it.
      if (autoMark || imageAutoConfirm) {
        try { setMessage({ type: 'info', text: `Scheduling auto flow for ${normalized}` }); } catch (e) {}
      }
    } catch (err) {
      setImageProcessing(false); setMessage({ type: 'error', text: '⚠️ Could not decode image (no barcode found or unsupported format)' });
  // keep preview visible so user can re-check image
    }
  };

  const onDropFile = (e) => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) handleImageFile(f); };

  const onPickFile = (e) => { const f = e.target.files && e.target.files[0]; if (f) handleImageFile(f); };
  // Prevent selecting a new file while current image is awaiting confirmation
  const safeOnPickFile = (e) => {
    if (imageReadyToMark || imageProcessing) return; const f = e.target.files && e.target.files[0]; if (f) handleImageFile(f);
  };

  const markAttendanceForImage = async (barcodeParam = null) => {
  const normalized = barcodeParam || scannedData;
  // If called from the auto-confirm path we pass barcodeParam; allow proceeding even if
  // imageReadyToMark state hasn't flushed yet (setImageReadyToMark is async).
  const canProceed = barcodeParam ? true : imageReadyToMark;
  if (!normalized || !canProceed) return;
    setLoading(true);
    const targetClassIds = manualSingle
      ? (classId ? [classId] : [])
      : (selectedClasses && selectedClasses.length ? selectedClasses : (classId ? [classId] : []));
    // If there are no target classes selected, inform the user and reset the image UI so it
    // doesn't remain stuck in 'Waiting to confirm'. This commonly happens when neither a
    // manual class nor today's classes are selected.
    if (!Array.isArray(targetClassIds) || targetClassIds.length === 0) {
      setLoading(false);
      setImageReadyToMark(false);
      setMessage({ type: 'error', text: '⚠️ No class selected — please select at least one class to mark attendance.' });
      // Reset preview so user can pick another image immediately
      setTimeout(() => { try { resetForNextImage(); } catch (e) {} }, 300);
      return;
    }
    const results = [];
  for (const cid of targetClassIds) {
      try {
        // skip if already marked in session
        const markedSet = successfullyMarkedRef.current[normalized] || new Set();
        if (markedSet.has(String(cid))) { results.push({ classId: cid, ok: false, message: 'Already marked (session)' }); continue; }
  const r = await fetchIsEnrolled(normalized, cid);
  if (!r.enrolled) { 
    const reason = r.raw?.reason || 'unknown';
    let message = 'Not enrolled';
    
    // Match MyClasses.jsx payment logic
    if (reason === 'free_card') {
      message = 'Free Card - Access granted';
      // Allow access even though enrolled=false (this shouldn't happen, but handle it)
    } else if (reason === 'half_card_paid') {
      message = 'Half Card - Paid';
    } else if (reason === 'half_payment_required') {
      message = 'Half Card - 50% payment required';
    } else if (reason === 'grace_period_expired') {
      message = 'Payment required - grace period expired';
    } else if (reason === 'payment_required') {
      message = 'Payment required';
    } else if (reason === 'not_enrolled') {
      message = 'Not enrolled';
    }
    
    results.push({ classId: cid, ok: false, message, raw: r.raw }); 
    continue; 
  }
        const payload = { classId: cid, studentId: normalized, attendanceData: { method: 'barcode', status: 'present', join_time: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace('T', ' ') } };
        const response = await fetch(`${process.env.REACT_APP_ATTENDANCE_BACKEND_URL}/mark-attendance`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        let text = null; try { text = await response.clone().text(); } catch (e) { text = null; }
        let parsed = null; try { parsed = text ? JSON.parse(text) : null; } catch (e) { parsed = text; }
        const serverSaysAlready = (parsed && (parsed.alreadyMarked === true || (typeof parsed.message === 'string' && parsed.message.toLowerCase().includes('already')) || (parsed.success === true && parsed.already === true)));
        if (response.ok) {
          if (serverSaysAlready) {
            if (!successfullyMarkedRef.current[normalized]) successfullyMarkedRef.current[normalized] = new Set();
            successfullyMarkedRef.current[normalized].add(String(cid));
            saveSessionToServer().catch(() => {});
            results.push({ classId: cid, ok: false, message: 'Already marked (persisted)' });
          } else {
            results.push({ classId: cid, ok: true, message: 'Marked' });
            setCounters(prev => { const key = String(cid); const next = Object.assign({}, prev); next[key] = (next[key] || 0) + 1; return next; });
            if (!successfullyMarkedRef.current[normalized]) successfullyMarkedRef.current[normalized] = new Set();
            successfullyMarkedRef.current[normalized].add(String(cid));
          }
        } else {
          const nonOkAlready = parsed && (parsed.alreadyMarked === true || (typeof parsed.message === 'string' && parsed.message.toLowerCase().includes('already')));
          if (nonOkAlready) {
            if (!successfullyMarkedRef.current[normalized]) successfullyMarkedRef.current[normalized] = new Set();
            successfullyMarkedRef.current[normalized].add(String(cid));
            results.push({ classId: cid, ok: false, message: 'Already marked (persisted)' });
          } else {
            results.push({ classId: cid, ok: false, message: 'Server error' });
          }
        }
      } catch (err) { results.push({ classId: cid, ok: false, message: 'Network error' }); }
    }
    setLoading(false);
    const allOk = results.length > 0 && results.every(r => r.ok);
    setMessage({ type: allOk ? 'success' : 'error', text: allOk ? '✅ Attendance updated for:' : '⚠️ Results:', summary: results });
    if (results.some(r => r.ok)) { successBeep.current.play().catch(() => {}); }
    setImageReadyToMark(false); // require new upload before marking again
    const autoTriggered = !!barcodeParam || !!imageAutoConfirm;
    if (results.some(r => r.ok)) {
      playSuccessPattern(successPattern);
      addToast('success', `Marked ${results.filter(r=>r.ok).map(r=>getClassName(r.classId)).join(', ')}`);
      // If this was an auto-confirm/auto-mark flow, reset immediately so user can upload next image.
      if (autoTriggered) {
        try { resetForNextImage(); } catch (e) {}
      } else {
        setTimeout(() => { resetForNextImage(); }, autoClearDelay);
      }
    }
  setLastMethodUsed('image');
  // Notify other parts of the app
  try {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('attendance:updated', { detail: { studentId: normalized, classes: targetClassIds, results } }));
    }
  } catch (e) {}
  };

  const resetForNextImage = () => {
    setScannedData(null);
    setPreviewFileName('');
    setStudentDetails(null);
    setStudentEnrollmentsPreview([]);
    setMessage(null);
    setImageReadyToMark(false);
    setImageProcessing(false);
    try {
      if (previewImageUrl) { URL.revokeObjectURL(previewImageUrl); }
    } catch (e) {}
    setPreviewImageUrl(null);
  try { lastDecodedRef.current = null; } catch (e) {}
    // Clear the file input so selecting the same file again will fire change event
    try {
      const inp = document.getElementById('file-input');
      if (inp) inp.value = '';
    } catch (e) {}
  };

  return (
    <div className="barcode-page" style={{ maxWidth: 1100, margin: 'auto', padding: 12 }}>
  <style>{`
        /* Base */
        .barcode-page { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: #0f172a; background: linear-gradient(180deg, rgba(14,165,164,0.03), rgba(99,102,241,0.01)); padding-bottom:28px; }
        .layout { display:flex; gap:18px; align-items:flex-start; }
        .left { flex:1; }
        .right { width:360px; }

        /* Glass cards */
        .scanner, .upload-drop, .class-row, .summary-list > div, .btn { backdrop-filter: blur(6px) saturate(120%); -webkit-backdrop-filter: blur(6px) saturate(120%); }

        .scanner { margin:auto; width:100%; height:520px; min-height:320px; border-radius:14px; overflow:hidden; display:flex; align-items:center; justify-content:center; position:relative; border:1px solid rgba(255,255,255,0.06); background: linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0.08)); box-shadow: 0 8px 30px rgba(12, 34, 56, 0.08); }

        .upload-drop { border-radius:12px; padding:14px; text-align:center; border:1px solid rgba(255,255,255,0.06); background: linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04)); box-shadow: 0 6px 20px rgba(2,6,23,0.04); }

        /* Buttons: larger touch targets and subtle glass */
        .btn { padding:14px 18px; border-radius:14px; font-size:16px; border:1px solid rgba(255,255,255,0.08); cursor:pointer; box-shadow: 0 6px 18px rgba(2,6,23,0.06); background: rgba(255,255,255,0.06); color: #07203b; }
        .btn-prim { background: linear-gradient(90deg, rgba(14,165,164,0.95), rgba(6,95,70,0.95)); color:white; border: none; }
        .btn-muted { background: rgba(255,255,255,0.06); color:#0f172a; }

  /* top controls wrap and min-width for visibility on small screens */
  .top-controls { display:flex; gap:8px; justify-content:center; align-items:center; flex-wrap:wrap; }
  .top-controls .btn { min-width:120px; }

        .class-list { max-height:420px; overflow:auto; }
        .class-row { display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid rgba(255,255,255,0.03); border-radius:10px; margin-bottom:6px; }
        .class-row .meta { font-size:13px; color:#6b7280; }
        .summary-list { margin-top:10px; }
  .spinner { width:18px; height:18px; border-radius:50%; border:3px solid rgba(0,0,0,0.08); border-top-color: rgba(6,95,70,0.95); animation: spin 900ms linear infinite; display:inline-block; vertical-align:middle; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .small { font-size:13px; color:#6b7280; }

        /* Camera and preview should be responsive and fill the glass card */
        .scanner .camera, .scanner video, .scanner canvas { width:100% !important; height:100% !important; object-fit:cover; }
        .upload-drop img { max-height:420px !important; border-radius:10px; }

        /* Mobile-first responsiveness */
        @media (max-width: 900px) {
          .layout { display:block; padding:12px; }
          .right { width:100%; margin-top:12px; }
          .scanner { height:60vh; min-height:420px; border-radius:12px; }
          .btn { width:100%; display:block; text-align:center; }
          .upload-drop img { max-height:320px !important; }
          .class-row { padding:14px; }
          h2 { font-size:18px; }
        }

        /* small screens / narrow phones */
        @media (max-width: 420px) {
          .scanner { height:56vh; min-height:360px; }
          .upload-drop img { max-height:260px !important; }
          .btn { padding:12px 14px; font-size:15px; }
        }
  `}</style>

      <h2 style={{ textAlign: 'center', margin: '6px 0 12px', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}><FaBarcode /> TCMS Barcode Attendance</h2>

      {/* Flash overlay for success */}
      {flashSuccess && <div style={{ position:'fixed', left:0, right:0, top:0, bottom:0, background:'rgba(4,120,87,0.06)', pointerEvents:'none', zIndex:9999 }} />}

      {/* Toasts */}
      <div style={{ position:'fixed', right:16, top:16, zIndex:10000 }} aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} style={{ background: t.type === 'success' ? '#ecfdf5' : '#fff1f2', color: t.type === 'success' ? '#064e3b' : '#b91c1c', padding:'8px 12px', borderRadius:8, boxShadow:'0 6px 18px rgba(2,6,23,0.08)', marginBottom:8 }}>{t.text}</div>
        ))}
      </div>

  <div className="top-controls" style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:12, alignItems:'center', flexWrap:'wrap' }}>
        <button className={`btn ${mode === 'image' ? 'btn-prim' : 'btn-muted'}`} onClick={() => setMode('image')} aria-pressed={mode === 'image'}><FaUpload style={{ marginRight:8 }} /> Image (single)</button>
        <button className={`btn ${mode === 'camera' ? 'btn-prim' : 'btn-muted'}`} onClick={() => setMode('camera')} aria-pressed={mode === 'camera'}><FaCamera style={{ marginRight:8 }} /> Camera (continuous)</button>
        <button className="btn" onClick={() => { setCounters({}); successfullyMarkedRef.current = {}; setMessage(null); resetForNextImage(); }} style={{ background:'#fb923c', color:'#fff' }}>Reset session</button>

        <div style={{ width:12 }} />
        <button className={`btn ${autoMark ? 'btn-prim' : 'btn-muted'}`} onClick={() => setAutoMark(a => !a)} aria-pressed={autoMark} title="Toggle Auto-Mark">{autoMark ? 'Auto-Mark: ON' : 'Auto-Mark: OFF'}</button>
  <button className={`btn ${hwListening ? 'btn-prim' : 'btn-muted'}`} onClick={() => setHwListening(h => !h)} aria-pressed={hwListening} title="Toggle hardware scanner listening">{hwListening ? 'HW Listen: ON' : 'HW Listen: OFF'}</button>
  {/* Image Auto-Confirm toggle removed per UI preference; setting persists in localStorage and defaults to true */}

        <div style={{ marginLeft:8, fontSize:13, color:'#374151' }} title={`Last method used: ${lastMethodUsed}`}>Last: <strong style={{ marginLeft:6 }}>{lastMethodUsed || '—'}</strong></div>
        <div style={{ width:12 }} />
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <label className="small">Auto-clear</label>
          <select value={autoClearDelay} onChange={e => setAutoClearDelay(parseInt(e.target.value,10))} style={{ padding:8, borderRadius:8 }}>
            <option value={0}>Immediate</option>
            <option value={300}>300ms</option>
            <option value={600}>600ms</option>
            <option value={1000}>1s</option>
            <option value={1500}>1.5s</option>
          </select>
          <label className="small">Beep</label>
          <select value={successPattern} onChange={e => setSuccessPattern(e.target.value)} style={{ padding:8, borderRadius:8 }}>
            <option value="single">Single</option>
            <option value="double">Double</option>
          </select>
        </div>
      </div>

      <div className="layout">
        <div className="left">
          <div style={{ marginBottom:10, display:'flex', gap:8, alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', gap:8 }} role="tablist" aria-label="Selection mode">
              <button className={`btn ${!manualSingle ? 'btn-prim' : 'btn-muted'}`} onClick={() => setManualSingle(false)} aria-pressed={!manualSingle}>Today's classes</button>
              <button className={`btn ${manualSingle ? 'btn-prim' : 'btn-muted'}`} onClick={() => setManualSingle(true)} aria-pressed={manualSingle}>Manual single</button>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }} />
          </div>

          {manualSingle && (
            <div style={{ marginBottom:12 }}>
              <select value={classId} onChange={e => setClassId(e.target.value)} style={{ width: '100%', padding:12, fontSize:16, borderRadius:10 }} aria-label="Manual class select">
                <option value="">Select a class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.id} - {c.className || c.name}</option>)}
              </select>
            </div>
          )}

          <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
            <div style={{ width: '100%', maxWidth:520 }}>
              <div className="scanner" aria-live="polite">
                {mode === 'camera' ? (
                  <div id="barcode-reader" style={{ width:'100%', height:'100%' }} className="camera" />
                ) : (
                  <div onDrop={onDropFile} onDragOver={e => { e.preventDefault(); }} className="upload-drop">
                    <div style={{ fontWeight:700, marginBottom:8 }}>{previewFileName || 'Drop PNG/JPG here or tap to choose'}</div>
                    <div className="small">The UI will decode one image at a time. After preview you must confirm to mark attendance.</div>
                    <div style={{ marginTop:12, display:'flex', gap:8, alignItems:'center', justifyContent:'center' }}> 
                      <label htmlFor="file-input" className="btn btn-prim" style={{ display:'inline-flex', alignItems:'center', gap:8, cursor: (imageReadyToMark && !(imageAutoConfirm || autoMark)) ? 'not-allowed' : 'pointer', opacity: (imageReadyToMark && !(imageAutoConfirm || autoMark)) ? 0.6 : 1 }} aria-disabled={imageReadyToMark && !(imageAutoConfirm || autoMark)}><FaUpload /> {(imageReadyToMark && !(imageAutoConfirm || autoMark)) ? 'Waiting to confirm' : (imageProcessing ? 'Decoding…' : 'Choose image')}</label>
                      <input id="file-input" accept="image/png,image/jpeg" type="file" onChange={safeOnPickFile} style={{ display:'none' }} disabled={(imageReadyToMark && !(imageAutoConfirm || autoMark)) || imageProcessing} />
                    </div>
                    {previewImageUrl && (
                      <div style={{ marginTop:12, display:'flex', justifyContent:'center' }}>
                        <img src={previewImageUrl} alt="preview" style={{ maxWidth:'100%', maxHeight:220, borderRadius:8, objectFit:'cover', boxShadow:'0 6px 18px rgba(2,6,23,0.06)' }} />
                      </div>
                    )}
                    {/* Debug panel: show internal flags to diagnose Waiting-to-confirm issues */}
                    {previewImageUrl && (
                      <div style={{ marginTop:8, padding:8, borderRadius:8, background:'#fff7ed', color:'#92400e', fontSize:13 }}>
                        <div style={{ fontWeight:700, marginBottom:6 }}>Debug</div>
                        <div style={{ fontSize:13 }}>
                          imageProcessing: <strong>{String(imageProcessing)}</strong> · imageReadyToMark: <strong>{String(imageReadyToMark)}</strong>
                        </div>
                        <div style={{ fontSize:13, marginTop:6 }}>
                          imageAutoConfirm: <strong>{String(imageAutoConfirm)}</strong> · autoMark: <strong>{String(autoMark)}</strong>
                        </div>
                        <div style={{ fontSize:13, marginTop:6 }}>decoded: <strong>{lastDecodedRef.current || scannedData || '-'}</strong></div>
                      </div>
                    )}
                    {/* show info messages such as Decoded barcode */}
                    {message && message.type === 'info' && (
                      <div style={{ marginTop:8, padding:8, borderRadius:8, background:'#eef2ff', color:'#3730a3' }}>{message.text}</div>
                    )}
                    {/* Network log removed per request */}
                    {imageProcessing && <div style={{ marginTop:8 }} className="small">Decoding image…</div>}
                    {message && message.type === 'error' && <div style={{ marginTop:8, color:'#b91c1c' }}>{message.text}</div>}
                  </div>
                )}
              </div>

              <div style={{ marginTop:12, padding:12, borderRadius:10, background:'#fff', boxShadow:'0 2px 8px rgba(2,6,23,0.04)' }}>
                <div style={{ fontSize:14, fontWeight:700 }}>{scannedData || 'No scan yet'}</div>
                {studentDetails && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ fontWeight:700 }}>{studentDetails.name || studentDetails.fullname || studentDetails.username || ''} <small style={{ color:'#6b7280', marginLeft:8 }}>{studentDetails.id || studentDetails.userid || ''}</small></div>
                    {/* Recent attendance records (show up to 3) */}
                    <div style={{ marginTop:8, padding:8, borderRadius:8, background:'#f8fafc' }}>
                      <div style={{ fontWeight:700, marginBottom:6 }}>Recent attendance {prevAttendancesLoading && <span className="spinner" aria-hidden="true" style={{ marginLeft:8 }} />}</div>
                      <div className="summary-list">
                        {prevAttendancesLoading ? (
                          <div className="small">Loading…</div>
                        ) : prevAttendances && prevAttendances.length > 0 ? (
                          prevAttendances.slice(0,3).map((r, idx) => (
                            <div key={idx} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0' }}>
                              <div style={{ fontSize:13 }}>{r.className || getClassName(r.classId) || `Class ${r.classId}`}</div>
                              <div style={{ fontSize:13, color:'#6b7280' }}>{r.timestamp ? new Date(r.timestamp).toLocaleString() : (r.time || r.join_time || '')}</div>
                            </div>
                          ))
                        ) : (
                          <div className="small">No recent records</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview enrollment statuses for image mode */}
                {mode === 'image' && studentEnrollmentsPreview && studentEnrollmentsPreview.length > 0 && (
                  <div style={{ marginTop:10 }}>
                    <div style={{ fontWeight:700 }}>Preview</div>
                    <div className="summary-list">
                      {studentEnrollmentsPreview.map((p) => {
                        const found = classes.find(x => String(x.id) === String(p.classId));
                        const paymentStatus = p.enrollRaw?.payment_status;
                        const reason = p.enrollRaw?.reason;
                        
                        let statusText = 'Not enrolled';
                        let statusColor = '#b91c1c';
                        let statusDetail = '';
                        
                        if (p.enrolled) {
                          // Successfully enrolled cases
                          if (reason === 'free_card') {
                            statusText = 'Free Card';
                            statusColor = '#9333ea'; // Purple
                            statusDetail = 'No payment required';
                          } else if (reason === 'half_card_paid') {
                            statusText = 'Half Card';
                            statusColor = '#2563eb'; // Blue
                            statusDetail = '50% paid';
                          } else if (reason === 'within_grace_period') {
                            statusText = 'Enrolled & Paid';
                            statusColor = '#059669'; // Green
                            const daysRemaining = p.enrollRaw?.days_remaining;
                            statusDetail = daysRemaining ? `${daysRemaining} days grace` : 'Within grace period';
                          } else {
                            statusText = 'Enrolled & Paid';
                            statusColor = '#059669'; // Green
                          }
                        } else {
                          // Blocked cases
                          if (reason === 'half_payment_required') {
                            statusText = 'Half Card';
                            statusColor = '#ea580c'; // Orange
                            statusDetail = '50% payment required';
                          } else if (reason === 'grace_period_expired') {
                            statusText = 'Grace Period Expired';
                            statusColor = '#dc2626'; // Red
                            statusDetail = 'Payment required';
                          } else if (reason === 'payment_required') {
                            statusText = 'Payment Required';
                            statusColor = '#d97706'; // Amber
                          } else if (reason === 'not_enrolled') {
                            statusText = 'Not Enrolled';
                            statusColor = '#b91c1c'; // Red
                          }
                        }
                        
                        return (
                          <div key={p.classId} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0' }}>
                            <div>
                              <div style={{ fontWeight:700 }}>{found ? (found.className || found.name) : `Class ${p.classId}`}</div>
                              <div className="small">{found ? `${found.schedule_start_time || ''} - ${found.schedule_end_time || ''}` : ''}</div>
                            </div>
                            <div style={{ textAlign:'right' }}>
                              <div style={{ color: statusColor, fontWeight:700 }}>{statusText}</div>
                              {statusDetail && <div className="small" style={{ color: '#6b7280' }}>{statusDetail}</div>}
                              {paymentStatus && <div className="small" style={{ color: '#9ca3af', fontSize: '11px' }}>Status: {paymentStatus}</div>}
                              <div className="small">{p.markedInSession ? 'Marked (session)' : 'Not marked'}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ marginTop:10, display:'flex', gap:8, alignItems:'center' }}>
                      {!autoMark ? (
                        <button className="btn btn-prim" onClick={() => markAttendanceForImage()} disabled={!imageReadyToMark || imageProcessing || loading} aria-disabled={!imageReadyToMark || imageProcessing || loading}>{loading ? 'Marking…' : 'Confirm & Mark'}</button>
                      ) : (
                        <div style={{ padding: '8px 12px', borderRadius:8, background:'#ecfeff', color:'#065f46', fontWeight:700 }}>Auto‑Mark is ON — will mark automatically</div>
                      )}
                      <button className="btn btn-muted" onClick={resetForNextImage}>Reset</button>
                    </div>
                  </div>
                )}

                {message && (message.type === 'success' || message.type === 'error') && (
                  <div style={{ marginTop:10, color: message.type === 'success' ? '#059669' : '#b91c1c' }}>
                    <div style={{ fontWeight:700 }}>{message.text}</div>
                    {message.summary && <div className="summary-list">{message.summary.map((r, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', padding:'6px 0' }}>
                        <div>{r.className || getClassName(r.classId)}: <strong style={{ marginLeft:6 }}>{r.ok ? 'OK' : r.message}</strong></div>
                      </div>
                    ))}</div>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

  <div className="right" aria-hidden={!(panelOpen && !manualSingle)} style={{ display: (panelOpen && !manualSingle) ? 'block' : 'none' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
            <div style={{ fontWeight:700 }}>Today's classes</div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-muted" onClick={() => setPanelOpen(p => !p)} aria-expanded={panelOpen}>{panelOpen ? <><FaChevronUp /></> : <><FaChevronDown /></>}</button>
            </div>
          </div>
          <div style={{ fontSize:12, color:'#6b7280', marginBottom:8, fontStyle:'italic' }}>
            Showing only physical & hybrid classes
          </div>

          <div className="class-list" style={{ display: (panelOpen && !manualSingle) ? 'block' : 'none' }}>
            {todaysClasses.length === 0 && <div style={{ color:'#6b7280' }}>No classes scheduled for today</div>}
            {todaysClasses.map(c => (
              <div key={c.id} className="class-row" onClick={() => toggleClassSelection(String(c.id), !selectedClasses.includes(String(c.id)))} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') toggleClassSelection(String(c.id), !selectedClasses.includes(String(c.id))); }}>
                <label style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer', flex:1 }}>
                  <input type="checkbox" checked={selectedClasses.includes(String(c.id))} onChange={e => toggleClassSelection(String(c.id), e.target.checked)} aria-label={`Select class ${c.name}`} />
                  <div>
                    <div style={{ fontWeight:700 }}>{c.className || c.name}</div>
                    <div className="meta">{c.schedule_start_time} - {c.schedule_end_time}</div>
                  </div>
                </label>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontWeight:700 }}>{counters[String(c.id)] || 0}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Session summary intentionally hidden per user request */}
        </div>
      </div>
    </div>
  );
};

export default BarcodeAttendanceScanner;
