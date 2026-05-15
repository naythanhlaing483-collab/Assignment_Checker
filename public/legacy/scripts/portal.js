const WEBHOOK_URL = 'https://n8n.srv1326411.hstgr.cloud/webhook-test/assignment-checker';
const SUPABASE_URL = 'https://iqitcwiybbwjodveuovi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxaXRjd2l5YmJ3am9kdmV1b3ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NDUzOTUsImV4cCI6MjA5MzEyMTM5NX0.k7vEW0kZFxfwYvZTQyuE1nWUDRnyvbWIIfrhhIteAnI';
const SUPABASE_HISTORY_TABLE = 'assignment_results';
const SUPABASE_POM_HISTORY_TABLE = 'pom_assignment_results';
    let debugLogs = [];
    let lastFeedbackData = null;
    let historyRecords = [];
    let selectedModule = 'EOM';
    let dashboardView = 'overall';
    let dashboardCheckedListQuery = '';
    let dashboardCheckedListSort = 'date-desc';
const MODULE_CONFIGS = {
  EOM: {
    code: 'EOM',
    shortName: 'EOM',
    fileToken: 'EOM',
    fileNameKeywords: [
      'EOM',
      'Essentials of Management'
    ],
    fullName: 'Essentials of Management',
    uploadTitle: 'Submit EOM Assignment',
    uploadDescription: 'Upload your answer file (Word DOCX format only). Referencing and word count are checked strictly.',
    accentClass: 'bg-blue-50 border-blue-200 text-blue-800',
    headingClass: 'text-blue-900',
    noteClass: 'text-blue-600 border-blue-200',
    guidanceTitle: '📋 Assignment Questions (Essentials of Management)',
    guidanceHtml: `
                    <div class="space-y-4 text-sm text-blue-800">
                        <div>
                            <p class="font-semibold">Task 1 (25 marks)</p>
                            <p class="mt-1 ml-4">a) According to Robert L. Katz (1955), discuss essential management skills using workplace examples and appropriate theories. (10 marks)</p>
                            <p class="mt-1 ml-4">b) Assess the characteristics of your chosen organisation and decide whether it aligns more closely with a traditional or new organisation. (15 marks)</p>
                        </div>
                        <div>
                            <p class="font-semibold">Task 2 (25 marks)</p>
                            <p class="mt-1 ml-4">a) Conduct a detailed SWOT analysis and identify main strategic challenges. (10 marks)</p>
                            <p class="mt-1 ml-4">b) Explore one strategic challenge, explain strategic goal-setting steps, and recommend action. (15 marks)</p>
                        </div>
                        <div>
                            <p class="font-semibold">Task 3 (25 marks)</p>
                            <p class="mt-1 ml-4">a) Explore budgeting and forecasting for resource allocation and control. (15 marks)</p>
                            <p class="mt-1 ml-4">b) Explain the importance of accurate information in decision-making. (10 marks)</p>
                        </div>
                        <div>
                            <p class="font-semibold">Task 4 (25 marks)</p>
                            <p class="mt-1 ml-4">a) Identify five Woodcock building blocks and apply them to team performance. (15 marks)</p>
                            <p class="mt-1 ml-4">b) Discuss leadership importance and demonstrate three leadership styles. (10 marks)</p>
                        </div>
                    </div>
                    <div class="mt-4 pt-3 border-t border-blue-200 text-xs text-blue-600">
                        <span class="font-semibold">⚠️ Note:</span> EOM remains marks-based. Maximum total marks: 100.
                    </div>`
  },
  POM: {
    code: 'POM',
    shortName: 'POM',
    fileToken: 'POM',
    fileNameKeywords: [
      'POM',
      'Principles of Operations Management',
      'Principles of Operation Management',
      'Pinciples of Operation Manangement',
      'Pinciples of Operations Manangement'
    ],
    fullName: 'Principles of Operations Management',
    uploadTitle: 'Submit POM Assignment',
    uploadDescription: 'Upload your POM answer file. The AI marker uses activity-based Pass/Merit/Distinction grading and the lowest-achieved-grade final rule.',
    accentClass: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    headingClass: 'text-emerald-900',
    noteClass: 'text-emerald-700 border-emerald-200',
    guidanceTitle: '📋 Assignment Activities (Principles of Operations Management)',
    guidanceHtml: `
                    <div class="space-y-4 text-sm text-emerald-800">
                        <div>
                            <p class="font-semibold">Activity 1 - LO1 (900 words)</p>
                            <p class="mt-1 ml-4">Critically analyse operations management at 24 O’Clock, compare with another sector, and address P1, P2, M1 and D1.</p>
                        </div>
                        <div>
                            <p class="font-semibold">Activity 2 - LO2 (600 words)</p>
                            <p class="mt-1 ml-4">Evaluate operations techniques/frameworks and digital technology for solving 24 O’Clock operational challenges, covering P3, P4, M2 and D2.</p>
                        </div>
                        <div>
                            <p class="font-semibold">Activity 3 - LO3 (700 words)</p>
                            <p class="mt-1 ml-4">Produce a continuous quality improvement plan using theoretical concepts, costs, benefits and sustainable performance, covering P5, P6, M3 and D3.</p>
                        </div>
                        <div>
                            <p class="font-semibold">Activity 4 - LO4 (800 words)</p>
                            <p class="mt-1 ml-4">Evaluate Strategic Risk Analysis using PESTLE, SWOT, risk mapping and contingency planning, covering P7, P8, M4 and D4.</p>
                        </div>
                    </div>
                    <div class="mt-4 pt-3 border-t border-emerald-200 text-xs text-emerald-700 space-y-1">
                        <p><span class="font-semibold">🎓 Grade rule:</span> Each activity receives Pass, Merit or Distinction. The final grade is the lowest achieved activity grade.</p>
                        <p><span class="font-semibold">📚 Academic rule:</span> Real, verifiable Harvard references are required. Fake, unverifiable, mismatched or missing citations prevent Distinction-level grading.</p>
                    </div>`
  }
};

function isSupabaseConfigured() {
  return SUPABASE_URL && SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('YOUR-PROJECT') &&
    !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY');
}

function openHistorySidebar() {
  document.getElementById('history-sidebar').classList.remove('translate-x-full');
  document.getElementById('history-overlay').classList.remove('hidden');
  renderModuleContent();
  loadHistory(false);
}

function closeHistorySidebar() {
  document.getElementById('history-sidebar').classList.add('translate-x-full');
  document.getElementById('history-overlay').classList.add('hidden');
}

function normalizeWorkflowData(data) {
  const moduleCode = data.moduleCode || data.module_code || 'EOM';
  const moduleName = data.moduleName || data.module_name || (moduleCode === 'POM' ? 'Principles of Operations Management' : 'Essentials of Management');
  return {
    moduleCode,
    moduleName,
    criterionResults: data.criterion_results || data.criterionResults || [],
    activityResults: data.activityResults || data.activity_results || [],
    finalGrade: data.finalGrade || data.final_grade || '',
    finalGradeReason: data.finalGradeReason || data.final_grade_reason || '',
    referenceAudit: data.referenceAudit || data.reference_audit || null,
    overallFeedback: data.overallFeedback || data.overall_feedback || '',
    priorityImprovements: data.priorityImprovements || data.priority_improvements || [],
    taskTotals: data.taskTotals || data.task_totals || [],
    overallTotal: data.overallTotal || data.overall_total || 0,
    overallMax: data.overallMax || data.overall_max || (moduleCode === 'POM' ? 3 : 100),
    report: data.report || '',
    message: data.message || '',
    wordCount: data.wordCount || data.word_count || 0,
    studentName: data.studentName || data.student_name || '',
    studentId: data.studentId || data.student_id || '',
    excelExport: data.excelExport || data.excel_export || null,
    success: data.success,
    supabaseStored: data.supabaseStored,
    supabaseStoreError: data.supabaseStoreError
  };
}

function gradePercent(grade) {
  return ({
    Pass: 50,
    Merit: 70,
    Distinction: 90
  }[grade] || 0);
}

function gradeBadge(grade) {
  const normalized = grade || 'Pass';
  const cls = normalized === 'Distinction' ?
    'bg-emerald-100 text-emerald-700' :
    normalized === 'Merit' ?
      'bg-blue-100 text-blue-700' :
      'bg-amber-100 text-amber-700';
  return `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${cls}">${escapeHtml(normalized)}</span>`;
}

function getRecordSummary(record) {
  const overview = record.overview || {};
  const normalized = normalizeWorkflowData(record.result || {});
  const moduleCode = normalized.moduleCode || overview.moduleCode || 'EOM';
  const moduleName = normalized.moduleName || overview.moduleName || (moduleCode === 'POM' ? 'Principles of Operations Management' : 'Essentials of Management');
  const finalGrade = normalized.finalGrade || overview.finalGrade || '';
  const scoreParts = typeof overview.score === 'string' ? overview.score.split('/') : [];
  const total = Number(record.overall_total ?? normalized.overallTotal ?? scoreParts[0] ?? 0);
  const max = Number(record.overall_max ?? normalized.overallMax ?? scoreParts[1] ?? (finalGrade ? 3 : 100)) || (finalGrade ? 3 : 100);
  const percent = finalGrade ? gradePercent(finalGrade) : (max > 0 ? Math.round((total / max) * 100) : 0);
  return {
    moduleCode,
    moduleName,
    finalGrade,
    displayScore: finalGrade || `${total}/${max}`,
    name: record.student_name || normalized.studentName || overview.studentName || 'Unknown Student',
    id: record.student_id || normalized.studentId || overview.studentId || 'No ID',
    total,
    max,
    percent,
    date: record.created_at ? new Date(record.created_at) : null,
    preview: overview.feedbackPreview || normalized.overallFeedback || record.message || 'Click to view detailed feedback.',
    normalized
  };
}

/**
 * Narrows dashboard history rows for the Checked Students List tables.
 * Matches name, student ID, module code, or module name (case-insensitive substring).
 * @param {Array} records
 * @param {string} queryText
 * @returns {Array}
 */
function filterCheckedStudentsListRecords(records, queryText) {
  const q = (queryText || '').toLowerCase().trim();
  if (!q) return records.slice();
  return records.filter((record) => {
    const s = getRecordSummary(record);
    const haystack = [s.name, s.id, s.moduleCode, s.moduleName].join(' ').toLowerCase();
    return haystack.includes(q);
  });
}

function getDashboardRecords() {
  const query = document.getElementById('dashboard-search')?.value || '';
  return filterCheckedStudentsListRecords(historyRecords, query);
}

function onDashboardCheckedListSearchInput(el) {
  if (!el) return;
  dashboardCheckedListQuery = el.value || '';
  const pairId = el.id === 'dashboard-checked-list-search-overall' ?
    'dashboard-checked-list-search-subject' :
    'dashboard-checked-list-search-overall';
  const pair = document.getElementById(pairId);
  if (pair && pair.value !== dashboardCheckedListQuery) {
    pair.value = dashboardCheckedListQuery;
  }
  renderDashboardOverview();
}

const DASHBOARD_CHECKED_LIST_SORT_MODES = new Set([
  'date-desc',
  'date-asc',
  'name-asc',
  'name-desc',
  'id-asc',
  'id-desc',
  'module-asc',
  'module-desc',
  'result-desc',
  'result-asc'
]);

function dedupeToLatestSubmissionPerStudent(records) {
  const bestByKey = new Map();
  records.forEach((record) => {
    const s = getRecordSummary(record);
    const key = (s.id || '').trim().toLowerCase() || `name:${(s.name || '').trim().toLowerCase()}`;
    if (!key) return;
    const t = new Date(record.created_at || 0).getTime();
    const prev = bestByKey.get(key);
    if (!prev || t > new Date(prev.created_at || 0).getTime()) {
      bestByKey.set(key, record);
    }
  });
  return Array.from(bestByKey.values());
}

/**
 * Stable ordering for Checked Students List rows (after any list filter).
 * @param {Array} records
 * @param {string} sortMode
 * @returns {Array}
 */
function orderCheckedStudentsListRecords(records, sortMode) {
  const mode = DASHBOARD_CHECKED_LIST_SORT_MODES.has(sortMode) ? sortMode : 'date-desc';
  const copy = records.slice();
  const time = (r) => new Date(r.created_at || 0).getTime();
  copy.sort((a, b) => {
    const sa = getRecordSummary(a);
    const sb = getRecordSummary(b);
    let cmp = 0;
    switch (mode) {
      case 'date-desc':
        cmp = time(b) - time(a);
        break;
      case 'date-asc':
        cmp = time(a) - time(b);
        break;
      case 'name-asc':
        cmp = (sa.name || '').localeCompare(sb.name || '', undefined, { sensitivity: 'base' });
        break;
      case 'name-desc':
        cmp = (sb.name || '').localeCompare(sa.name || '', undefined, { sensitivity: 'base' });
        break;
      case 'id-asc':
        cmp = (sa.id || '').localeCompare(sb.id || '', undefined, { numeric: true, sensitivity: 'base' });
        break;
      case 'id-desc':
        cmp = (sb.id || '').localeCompare(sa.id || '', undefined, { numeric: true, sensitivity: 'base' });
        break;
      case 'module-asc':
        cmp = (sa.moduleCode || '').localeCompare(sb.moduleCode || '', undefined, { sensitivity: 'base' });
        break;
      case 'module-desc':
        cmp = (sb.moduleCode || '').localeCompare(sa.moduleCode || '', undefined, { sensitivity: 'base' });
        break;
      case 'result-desc':
        cmp = sb.percent - sa.percent;
        break;
      case 'result-asc':
        cmp = sa.percent - sb.percent;
        break;
      default:
        cmp = time(b) - time(a);
    }
    if (cmp !== 0) return cmp;
    return time(b) - time(a);
  });
  return copy;
}

function onDashboardCheckedListSortChange(el) {
  if (!el || !DASHBOARD_CHECKED_LIST_SORT_MODES.has(el.value)) return;
  dashboardCheckedListSort = el.value;
  const pairId = el.id === 'dashboard-checked-list-sort-overall' ?
    'dashboard-checked-list-sort-subject' :
    'dashboard-checked-list-sort-overall';
  const pair = document.getElementById(pairId);
  if (pair && pair.value !== dashboardCheckedListSort) {
    pair.value = dashboardCheckedListSort;
  }
  renderDashboardOverview();
}

function getDashboardRecordsByModule(moduleCode) {
  const records = getDashboardRecords();
  if (!moduleCode || moduleCode === 'overall') return records;
  return records.filter(record => getRecordSummary(record).moduleCode === moduleCode);
}

function withModuleCode(record, moduleCode) {
  const overview = record.overview && typeof record.overview === 'object' ? {
    ...record.overview,
    moduleCode: record.overview.moduleCode || moduleCode,
    moduleName: record.overview.moduleName || (moduleCode === 'POM' ? 'Principles of Operations Management' : 'Essentials of Management')
  } : {
    moduleCode,
    moduleName: moduleCode === 'POM' ? 'Principles of Operations Management' : 'Essentials of Management'
  };
  const result = record.result && typeof record.result === 'object' ? {
    ...record.result,
    moduleCode: record.result.moduleCode || record.result.module_code || moduleCode,
    moduleName: record.result.moduleName || record.result.module_name || (moduleCode === 'POM' ? 'Principles of Operations Management' : 'Essentials of Management')
  } : {
    moduleCode,
    moduleName: moduleCode === 'POM' ? 'Principles of Operations Management' : 'Essentials of Management'
  };
  return {
    ...record,
    overview,
    result
  };
}

async function fetchHistoryTable(tableName, moduleCode) {
  const url = `${SUPABASE_URL}/rest/v1/${tableName}?select=id,created_at,student_name,student_id,overall_total,overall_max,word_count,success,message,overview,result&order=created_at.desc&limit=50`;
  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    }
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${tableName} ${response.status}: ${text || response.statusText}`);
  }
  const rows = JSON.parse(text || '[]');
  return Array.isArray(rows) ? rows.map(record => withModuleCode(record, moduleCode)) : [];
}

function setDashboardView(view) {
  dashboardView = ['overall', 'EOM', 'POM'].includes(view) ? view : 'overall';
  renderDashboardOverview();
}

function renderDashboardFilterState() {
  const filterConfigs = {
    overall: {
      buttonId: 'dashboard-filter-overall',
      activeClass: 'bg-slate-900 text-white',
      inactiveClass: 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
    },
    EOM: {
      buttonId: 'dashboard-filter-eom',
      activeClass: 'bg-blue-600 text-white',
      inactiveClass: 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
    },
    POM: {
      buttonId: 'dashboard-filter-pom',
      activeClass: 'bg-emerald-600 text-white',
      inactiveClass: 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
    }
  };
  Object.entries(filterConfigs).forEach(([key, config]) => {
    const button = document.getElementById(config.buttonId);
    if (!button) return;
    const isActive = dashboardView === key;
    const [activeBg, activeText] = config.activeClass.split(' ');
    button.classList.toggle(activeBg, isActive);
    button.classList.toggle(activeText, isActive);
    config.inactiveClass.split(' ').forEach(cls => button.classList.toggle(cls, !isActive));
  });
  const overallView = document.getElementById('dashboard-overall-view');
  const subjectView = document.getElementById('dashboard-subject-view');
  if (overallView) overallView.classList.toggle('hidden-view', dashboardView !== 'overall');
  if (subjectView) subjectView.classList.toggle('hidden-view', dashboardView === 'overall');
}

function renderDashboardEmpty(container, message) {
  if (!container) return;
  container.innerHTML = `
                <div class="h-full min-h-[220px] flex items-center justify-center text-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-6">
                    <p class="text-sm text-slate-500">${escapeHtml(message)}</p>
                </div>
            `;
}

function renderDashboardLoading() {
  [
    'dashboard-overall-summary',
    'dashboard-latest-list',
    'dashboard-eom-ranking-list',
    'dashboard-pom-ranking-list',
    'dashboard-subject-latest-list',
    'dashboard-subject-ranking-list',
    'dashboard-subject-mistake-chart'
  ].forEach(id => {
    const container = document.getElementById(id);
    if (!container) return;
    container.innerHTML = `
                    <div class="h-full min-h-[220px] flex items-center justify-center text-center rounded-xl border border-slate-200 bg-slate-50 px-6">
                        <p class="text-sm text-slate-500">Loading dashboard data...</p>
                    </div>
                `;
  });
}

function openDashboardRecord(index) {
  const record = historyRecords[index];
  if (!record) return;
  const normalized = normalizeWorkflowData(record.result || {});
  if (!normalized.criterionResults.length && record.overview) {
    normalized.studentName = record.student_name || record.overview.studentName || '';
    normalized.studentId = record.student_id || record.overview.studentId || '';
    normalized.overallTotal = record.overall_total || 0;
    normalized.overallMax = record.overall_max || 100;
    normalized.wordCount = record.word_count || 0;
    normalized.message = record.message || '';
  }
  renderFeedback(normalized);
  navigateTo('feedback');
}

function renderDashboardLatest(container, records, emptyMessage, options = {}) {
  if (!container) return;
  if (!records.length) {
    renderDashboardEmpty(container, emptyMessage);
    return;
  }
  const {
    limit = 5,
    clickable = false,
    uniqueByStudent = false,
    sortMode = 'date-desc'
  } = options;
  let latest = records.slice();
  if (uniqueByStudent) {
    latest = dedupeToLatestSubmissionPerStudent(latest);
  }
  latest = orderCheckedStudentsListRecords(latest, sortMode);
  if (Number.isFinite(limit)) {
    latest = latest.slice(0, Number(limit));
  }
  container.innerHTML = `
                <div class="overflow-x-auto rounded-xl border border-slate-200">
                    <table class="w-full text-left text-sm">
                        <thead class="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th class="px-4 py-3 font-bold text-slate-600">No.</th>
                                <th class="px-4 py-3 font-bold text-slate-600">Name</th>
                                <th class="px-4 py-3 font-bold text-slate-600">ID</th>
                                <th class="px-4 py-3 font-bold text-slate-600">Module</th>
                                <th class="px-4 py-3 font-bold text-slate-600 text-right">Result</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 bg-white">
                            ${latest.map((record, index) => {
    const recordIndex = historyRecords.indexOf(record);
    const summary = getRecordSummary(record);
    const rowClass = clickable && recordIndex >= 0 ? 'cursor-pointer hover:bg-slate-50 transition-colors' : '';
    const rowAttrs = clickable && recordIndex >= 0 ?
      `onclick="openDashboardRecord(${recordIndex})" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openDashboardRecord(${recordIndex});}"` :
      '';
    return `
                                    <tr class="${rowClass}" ${rowAttrs}>
                                        <td class="px-4 py-3 text-slate-600">${index + 1}</td>
                                        <td class="px-4 py-3 font-semibold text-slate-900">${escapeHtml(summary.name)}</td>
                                        <td class="px-4 py-3 text-slate-600">${escapeHtml(summary.id)}</td>
                                        <td class="px-4 py-3 text-slate-600">${escapeHtml(summary.moduleCode)}</td>
                                        <td class="px-4 py-3 text-right font-bold text-slate-900">${escapeHtml(summary.displayScore)}</td>
                                    </tr>
                                `;
  }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
}

function renderDashboardRanking(container, records, emptyMessage) {
  if (!container) return;
  if (!records.length) {
    renderDashboardEmpty(container, emptyMessage);
    return;
  }
  const ranked = records
    .slice()
    .sort((a, b) => getRecordSummary(b).percent - getRecordSummary(a).percent || new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 5);
  container.innerHTML = ranked.map((record, index) => {
    const recordIndex = historyRecords.indexOf(record);
    const summary = getRecordSummary(record);
    const barColor = summary.percent >= 70 ? 'bg-emerald-500' : summary.percent >= 40 ? 'bg-amber-500' : 'bg-red-500';
    return `
                    <button onclick="openDashboardRecord(${recordIndex})" class="w-full text-left rounded-2xl border border-slate-200 hover:border-slate-400 p-4 transition-colors">
                        <div class="flex items-center justify-between gap-3 mb-3">
                            <div class="flex items-center gap-3 min-w-0">
                                <div class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold">${index + 1}</div>
                                <div class="min-w-0">
                                    <div class="font-bold text-slate-900 truncate">${escapeHtml(summary.name)}</div>
                                    <div class="text-xs text-slate-500 truncate">${escapeHtml(summary.id)}</div>
                                </div>
                            </div>
                            <div class="text-right shrink-0">
                                <div class="font-bold text-slate-900">${summary.finalGrade ? escapeHtml(summary.finalGrade) : `${summary.percent}%`}</div>
                                <div class="text-xs text-slate-500">${escapeHtml(summary.moduleCode)}${summary.finalGrade ? '' : ` • ${summary.total}/${summary.max}`}</div>
                            </div>
                        </div>
                        <div class="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div class="h-full ${barColor}" style="width:${Math.max(0, Math.min(100, summary.percent))}%"></div>
                        </div>
                    </button>
                `;
  }).join('');
}

function renderDashboardSummary(container, records) {
  if (!container) return;
  const uniqueStudents = new Set(records.map(record => {
    const summary = getRecordSummary(record);
    return `${summary.id}::${summary.name}`;
  })).size;
  const eomCount = records.filter(record => getRecordSummary(record).moduleCode === 'EOM').length;
  const pomCount = records.filter(record => getRecordSummary(record).moduleCode === 'POM').length;
  const cards = [
    {
      label: 'Students',
      value: uniqueStudents,
      note: 'Unique students in the filtered history.'
    },
    {
      label: 'EOM Submissions',
      value: eomCount,
      note: 'Saved EOM results currently in history.'
    },
    {
      label: 'POM Submissions',
      value: pomCount,
      note: 'Saved POM results currently in history.'
    }
  ];
  container.innerHTML = cards.map(card => `
                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div class="text-xs font-bold uppercase tracking-wider text-slate-500">${escapeHtml(card.label)}</div>
                    <div class="mt-3 text-3xl font-bold text-slate-900">${escapeHtml(String(card.value))}</div>
                    <div class="mt-2 text-xs text-slate-500">${escapeHtml(card.note)}</div>
                </div>
            `).join('');
}

function renderDashboardMistakes(container, records, emptyMessage) {
  if (!container) return;
  const mistakeCounts = {};
  records.forEach(record => {
    const summary = getRecordSummary(record);
    const criteria = Array.isArray(summary.normalized.criterionResults) ? summary.normalized.criterionResults : [];
    criteria.forEach(item => {
      const grade = item.grade || item.activityGrade || '';
      if (grade) {
        if (grade !== 'Pass') return;
      } else {
        const mark = Number(item.awardedMark || item.awarded_mark || 0);
        const maxMark = Number(item.maxMark || item.max_mark || 0);
        if (!maxMark || mark / maxMark >= 0.7) return;
      }
      const label = grade ? `${item.task || 'Activity'} graded Pass` : (item.criterion || item.task || 'Unspecified criterion');
      mistakeCounts[label] = (mistakeCounts[label] || 0) + 1;
    });
  });
  const allMistakes = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1]);
  if (!allMistakes.length) {
    const searchEl = document.getElementById('mistakes-search');
    if (searchEl) searchEl.value = '';
    renderDashboardEmpty(container, emptyMessage);
    return;
  }
  const [topMistakeLabel, topMistakeCount] = allMistakes[0];
  const issueText = topMistakeCount === 1 ? 'student had this issue' : 'students had this issue';
  const encodeFilterKey = (label) => encodeURIComponent(String(label || '').toLowerCase());
  container.innerHTML = `
                <div class="space-y-4">
                    <p class="text-sm text-slate-600 leading-6">
                        Based on weaker criteria (&lt; 70% of available marks where marks apply), or graded activities marked Pass. Use search to locate a topic quickly.
                    </p>

                    <div class="rounded-2xl bg-red-50 border border-red-100 p-4">
                        <div class="text-xs font-bold uppercase tracking-wider text-red-600">Needs attention first</div>
                        <div class="mt-2 text-base font-bold text-slate-900 leading-6">${escapeHtml(topMistakeLabel)}</div>
                        <div class="mt-2 text-sm text-red-700">${topMistakeCount} ${issueText}</div>
                    </div>
                    <div class="flex items-center justify-between gap-1">
                        <div class="rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-2">
                            <div class="text-sm font-semibold text-slate-800">${allMistakes.length} mistake area${allMistakes.length === 1 ? '' : 's'}</div>
                            <span id="mistakes-search-hint" class="text-xs text-slate-500">${allMistakes.length} shown</span>
                        </div>
                        <div class="w-[50%] lg:max-w-sm mx-6 shrink-0">
                            <label for="mistakes-search" class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Find mistake area</label>
                            <input id="mistakes-search" type="search" oninput="filterMistakeAreas()" autocomplete="off" placeholder="Keyword (e.g. SWOT, Task 2…)" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>
                    <div>
                        <div class="flex items-end justify-between gap-2 mb-2">
                            <div class="text-sm font-bold text-slate-900">All mistake areas</div>
                        </div>
                        <div id="mistakes-list" class="space-y-2 max-h-[min(360px,50vh)] overflow-y-auto overscroll-contain pr-1">
                            ${allMistakes.map(([label, count], index) => {
    const fk = encodeFilterKey(label);
    return `
                                <div data-mistake-label="${fk}" class="mistake-area-row flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
                                    <div class="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">${index + 1}</div>
                                    <div class="min-w-0 flex-1">
                                        <div class="text-sm font-semibold text-slate-800 leading-5">${escapeHtml(label)}</div>
                                        <div class="text-xs text-slate-500 mt-1">${count} ${count === 1 ? 'student needs' : 'students need'} improvement here</div>
                                    </div>
                                </div>
                            `;
  }).join('')}
                        </div>
                    </div>
                </div>
            `;
  const searchEl = document.getElementById('mistakes-search');
  if (searchEl) searchEl.value = '';
  filterMistakeAreas();
}

function renderDashboardOverview() {
  renderDashboardFilterState();
  const description = document.getElementById('dashboard-description');
  const overallSummary = document.getElementById('dashboard-overall-summary');
  const latestContainer = document.getElementById('dashboard-latest-list');
  const eomRankingContainer = document.getElementById('dashboard-eom-ranking-list');
  const pomRankingContainer = document.getElementById('dashboard-pom-ranking-list');
  const subjectLatestContainer = document.getElementById('dashboard-subject-latest-list');
  const subjectRankingContainer = document.getElementById('dashboard-subject-ranking-list');
  const subjectMistakesContainer = document.getElementById('dashboard-subject-mistake-chart');
  if (!description || !overallSummary || !latestContainer || !eomRankingContainer || !pomRankingContainer || !subjectLatestContainer || !subjectRankingContainer || !subjectMistakesContainer) return;
  const query = (document.getElementById('dashboard-search')?.value || '').trim();
  const records = getDashboardRecords();
  const recordsForCheckedList = filterCheckedStudentsListRecords(records, dashboardCheckedListQuery);
  const listQ = (dashboardCheckedListQuery || '').trim();
  const emptyMessage = !historyRecords.length ?
    'No checked assignment results are available yet.' :
    !records.length ?
      (query ?
        'No checked results match that name or student ID.' :
        'No checked assignment results are available yet.') :
      !recordsForCheckedList.length ?
        (listQ ?
          'No students in this list match the list filter.' :
          'No checked assignment results are available yet.') :
        '';
  const eomRecords = getDashboardRecordsByModule('EOM');
  const pomRecords = getDashboardRecordsByModule('POM');
  renderDashboardSummary(overallSummary, records);
  renderDashboardLatest(latestContainer, recordsForCheckedList, emptyMessage, { sortMode: dashboardCheckedListSort });
  renderDashboardRanking(eomRankingContainer, eomRecords, query ? 'No EOM results match that student search.' : 'No EOM results are available yet.');
  renderDashboardRanking(pomRankingContainer, pomRecords, query ? 'No POM results match that student search.' : 'No POM results are available yet.');

  if (dashboardView === 'overall') {
    description.textContent = 'Monitor checked assignments across both modules, with separate top five rankings for EOM and POM.';
    syncDashboardCheckedListSearchInputs();
    return;
  }

  const subjectCode = dashboardView === 'POM' ? 'POM' : 'EOM';
  const subjectLabel = subjectCode === 'POM' ? 'Principles of Operations Management' : 'Essentials of Management';
  const subjectRecords = getDashboardRecordsByModule(subjectCode);
  const subjectLatestTitle = document.getElementById('dashboard-subject-latest-title');
  const subjectLatestDescription = document.getElementById('dashboard-subject-latest-description');
  const subjectRankingTitle = document.getElementById('dashboard-subject-ranking-title');
  const subjectRankingDescription = document.getElementById('dashboard-subject-ranking-description');
  const subjectMistakesTitle = document.getElementById('dashboard-subject-mistakes-title');
  const subjectMistakesDescription = document.getElementById('dashboard-subject-mistakes-description');
  if (subjectLatestTitle) subjectLatestTitle.textContent = `Checked Students List - ${subjectCode}`;
  if (subjectLatestDescription) subjectLatestDescription.textContent = `All checked students for ${subjectLabel}. Click any row to open detailed feedback.`;
  if (subjectRankingTitle) subjectRankingTitle.textContent = `Top Ranking - ${subjectCode}`;
  if (subjectRankingDescription) subjectRankingDescription.textContent = `Sorted by percentage score within ${subjectLabel}.`;
  if (subjectMistakesTitle) subjectMistakesTitle.textContent = `Common Mistakes - ${subjectCode}`;
  if (subjectMistakesDescription) subjectMistakesDescription.textContent = `Areas that often need more focus in ${subjectLabel} submissions you filtered.`;
  description.textContent = `Focused ${subjectCode} dashboard with a full checked-student list, ranking, and common mistakes.`;
  const subjectForCheckedList = filterCheckedStudentsListRecords(subjectRecords, dashboardCheckedListQuery);
  const subjectListEmpty = !historyRecords.length ?
    `No ${subjectCode} results are available yet.` :
    !subjectRecords.length ?
      (query ?
        `No ${subjectCode} results match that student search.` :
        `No ${subjectCode} results are available yet.`) :
      !subjectForCheckedList.length ?
        (listQ ?
          'No students in this list match the list filter.' :
          `No ${subjectCode} results are available yet.`) :
        '';
  renderDashboardLatest(
    subjectLatestContainer,
    subjectForCheckedList,
    subjectListEmpty,
    { limit: null, clickable: true, uniqueByStudent: true, sortMode: dashboardCheckedListSort }
  );
  renderDashboardRanking(subjectRankingContainer, subjectRecords, query ? `No ${subjectCode} results match that student search.` : `No ${subjectCode} results are available yet.`);
  renderDashboardMistakes(subjectMistakesContainer, subjectRecords, query ? `No weaker ${subjectCode} criteria matched that search.` : `No weaker criteria or Pass-level activity grades were found for ${subjectCode}.`);
  syncDashboardCheckedListSearchInputs();
}

function syncDashboardCheckedListSearchInputs() {
  ['dashboard-checked-list-search-overall', 'dashboard-checked-list-search-subject'].forEach((id) => {
    const el = document.getElementById(id);
    if (el && el.value !== dashboardCheckedListQuery) {
      el.value = dashboardCheckedListQuery;
    }
  });
  ['dashboard-checked-list-sort-overall', 'dashboard-checked-list-sort-subject'].forEach((id) => {
    const el = document.getElementById(id);
    if (el && el.value !== dashboardCheckedListSort) {
      el.value = dashboardCheckedListSort;
    }
  });
}

function filterMistakeAreas() {
  const list = document.getElementById('mistakes-list');
  const hint = document.getElementById('mistakes-search-hint');
  const input = document.getElementById('mistakes-search');
  if (!list) return;
  const rows = Array.from(list.querySelectorAll('.mistake-area-row[data-mistake-label]'));
  const qRaw = (input?.value || '').trim();
  const q = qRaw.toLowerCase();
  let visible = 0;
  rows.forEach((row) => {
    try {
      const label = decodeURIComponent(row.getAttribute('data-mistake-label') || '');
      const match = !q || label.includes(q);
      row.classList.toggle('hidden', !match);
      if (match) visible++;
    } catch (_) {
      row.classList.remove('hidden');
      visible++;
    }
  });
  if (hint && rows.length) {
    hint.textContent = q ?
      visible === 0 ?
        'No mistake areas match that search.' :
        `Showing ${visible} of ${rows.length}` :
      `${rows.length} shown`;
  }
}
async function loadHistory(force = false) {
  const status = document.getElementById('history-status');
  const list = document.getElementById('history-list');
  if (!status || !list) return;
  if (force) {
    dashboardCheckedListQuery = '';
    dashboardCheckedListSort = 'date-desc';
  }
  if (!isSupabaseConfigured()) {
    status.innerHTML = '<span class="font-semibold text-amber-700">Supabase is not configured.</span><br><span class="text-xs">Set SUPABASE_URL and SUPABASE_ANON_KEY in index.html, then enable SELECT access for the EOM and POM history tables.</span>';
    list.innerHTML = '';
    historyRecords = [];
    renderDashboardOverview();
    return;
  }
  if (historyRecords.length && !force) {
    renderHistoryList();
    return;
  }
  status.textContent = 'Loading history...';
  list.innerHTML = '';
  renderDashboardLoading();
  try {
    const [eomRecords, pomRecords] = await Promise.all([
      fetchHistoryTable(SUPABASE_HISTORY_TABLE, 'EOM'),
      fetchHistoryTable(SUPABASE_POM_HISTORY_TABLE, 'POM')
    ]);
    historyRecords = [...eomRecords, ...pomRecords]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    renderHistoryList();
  } catch (error) {
    debugLog('History load failed', error.message);
    status.innerHTML = `<span class="font-semibold text-red-700">Could not load history.</span><br><span class="text-xs">${escapeHtml(error.message)}</span>`;
    renderDashboardOverview();
  }
}

function renderHistoryList() {
  const status = document.getElementById('history-status');
  const list = document.getElementById('history-list');
  const query = (document.getElementById('history-search')?.value || '').toLowerCase().trim();
  if (!status || !list) return;
  const filtered = historyRecords.filter(record => {
    const overview = record.overview || {};
    const normalized = normalizeWorkflowData(record.result || {});
    const haystack = [
      record.student_name,
      record.student_id,
      record.overall_total,
      record.overall_max,
      overview.title,
      overview.feedbackPreview,
      overview.moduleCode,
      overview.finalGrade,
      normalized.moduleCode,
      normalized.finalGrade,
      record.message
    ].join(' ').toLowerCase();
    return !query || haystack.includes(query);
  });
  status.textContent = filtered.length ? `${filtered.length} saved result${filtered.length === 1 ? '' : 's'}` : 'No matching saved results.';
  list.innerHTML = filtered.map((record) => {
    const recordIndex = historyRecords.indexOf(record);
    const overview = record.overview || {};
    const summary = getRecordSummary(record);
    const date = record.created_at ? new Date(record.created_at).toLocaleString() : 'Unknown date';
    const percent = summary.percent;
    const name = summary.name;
    const id = summary.id;
    const preview = summary.preview;
    return `
                    <button onclick="openHistoryRecord(${recordIndex})" class="history-card w-full text-left rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-300 p-4 shadow-sm">
                        <div class="flex items-start justify-between gap-3">
                            <div class="min-w-0">
                                <div class="font-bold text-slate-900 truncate">${escapeHtml(name)}</div>
                                <div class="text-xs text-slate-500 truncate">${escapeHtml(id)} • ${escapeHtml(date)}</div>
                            </div>
                            <div class="shrink-0 text-right">
                                <div class="text-lg font-bold text-slate-900">${escapeHtml(summary.displayScore)}</div>
                                <div class="text-xs text-slate-500">${escapeHtml(summary.moduleCode)}${summary.finalGrade ? '' : ` • ${percent}%`}</div>
                            </div>
                        </div>
                        <p class="mt-3 text-sm text-slate-600 line-clamp-3">${escapeHtml(preview)}</p>
                    </button>
                `;
  }).join('');
  renderDashboardOverview();
}

function openHistoryRecord(index) {
  const record = historyRecords[index];
  if (!record) return;
  const result = record.result || {};
  const normalized = normalizeWorkflowData(result);
  if (!normalized.criterionResults.length && record.overview) {
    normalized.studentName = record.student_name || record.overview.studentName || '';
    normalized.studentId = record.student_id || record.overview.studentId || '';
    normalized.overallTotal = record.overall_total || 0;
    normalized.overallMax = record.overall_max || 100;
    normalized.wordCount = record.word_count || 0;
    normalized.message = record.message || '';
  }
  renderFeedback(normalized);
  navigateTo('feedback');
  if (window.innerWidth < 1024) closeHistorySidebar();
}

function debugLog(message, data = null) {
  const timestamp = new Date().toLocaleTimeString();
  const suffix = data === null ? '' : ': ' + (typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  const logEntry = `[${timestamp}] ${message}${suffix}`;
  debugLogs.unshift(logEntry);
  if (debugLogs.length > 25) debugLogs.pop();
  const debugDiv = document.getElementById('debug-log');
  if (debugDiv) {
    debugDiv.innerHTML = debugLogs.map(log => `<div style="border-bottom:1px solid #333;padding:4px 0;white-space:pre-wrap;">${escapeHtml(log)}</div>`).join('');
  }
  console.log(message, data || '');
}
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'D') {
    document.getElementById('debug-console').classList.toggle('show');
  }
});

function renderModuleContent() {
  const config = MODULE_CONFIGS[selectedModule] || MODULE_CONFIGS.EOM;
  const title = document.getElementById('upload-title');
  const description = document.getElementById('upload-description');
  const card = document.getElementById('assignment-guidance-card');
  if (title) title.textContent = config.uploadTitle;
  if (description) description.textContent = config.uploadDescription;
  if (card) {
    card.className = `mb-8 border rounded-xl p-6 ${config.accentClass}`;
    card.innerHTML = `
                    <h2 class="text-lg font-bold ${config.headingClass} mb-3">${config.guidanceTitle}</h2>
                    ${config.guidanceHtml}
                `;
  }
}

function detectModuleFromFileName(fileName) {
  const normalizedName = fileName.toUpperCase();
  const compactName = normalizedName.replace(/[^A-Z0-9]/g, '');
  const moduleCodes = Object.keys(MODULE_CONFIGS);
  return moduleCodes.find((moduleCode) => {
    const config = MODULE_CONFIGS[moduleCode];
    const keywords = config.fileNameKeywords || [config.fileToken || moduleCode];
    return keywords.some((keyword) => {
      const normalizedKeyword = keyword.toUpperCase();
      const compactKeyword = normalizedKeyword.replace(/[^A-Z0-9]/g, '');
      if (compactKeyword === moduleCode) {
        const tokenPattern = new RegExp(`(^|[^A-Z0-9])${moduleCode}([^A-Z0-9]|$)`, 'i');
        return tokenPattern.test(normalizedName);
      }
      return compactName.includes(compactKeyword);
    });
  }) || null;
}

function getWrongFileUploadMessage(fileModuleCode, expectedModuleCode) {
  const fileModule = MODULE_CONFIGS[fileModuleCode];
  const expectedModule = MODULE_CONFIGS[expectedModuleCode];
  if (!fileModule || !expectedModule) {
    return 'Wrong file uploaded. Please choose the answer file for the selected module.';
  }
  return `Wrong file uploaded. You selected a ${fileModule.shortName} answer file from the ${expectedModule.shortName} input tab. Please upload the ${expectedModule.shortName} answer file.`;
}

function validateAnswerFileForSelectedModule(file) {
  const detectedModule = detectModuleFromFileName(file.name);
  if (detectedModule && detectedModule !== selectedModule) {
    showNotification(getWrongFileUploadMessage(detectedModule, selectedModule));
    return false;
  }
  return true;
}

function navigateToModule(moduleCode) {
  selectedModule = MODULE_CONFIGS[moduleCode] ? moduleCode : 'EOM';
  renderModuleContent();
  navigateTo('upload');
}

function navigateTo(viewId) {
  ['dashboard', 'upload', 'loading', 'feedback'].forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (!el) return;
    el.classList.toggle('hidden-view', v !== viewId);
  });
  const dashboardBtn = document.getElementById('sidebar-dashboard-btn');
  const eomBtn = document.getElementById('sidebar-eom-btn');
  const pomBtn = document.getElementById('sidebar-pom-btn');
  const setActive = (button, isActive) => {
    if (!button) return;
    button.classList.toggle('bg-slate-900', isActive);
    button.classList.toggle('text-white', isActive);
    button.classList.toggle('text-slate-700', !isActive);
    button.classList.toggle('hover:bg-blue-50', !isActive);
    button.classList.toggle('hover:text-blue-700', !isActive);
  };
  setActive(dashboardBtn, viewId === 'dashboard');
  setActive(eomBtn, viewId !== 'dashboard' && selectedModule === 'EOM');
  setActive(pomBtn, viewId !== 'dashboard' && selectedModule === 'POM');
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}
const answerInput = document.getElementById('answerFile');
const answerDisplay = document.getElementById('answerFileName');
answerInput.addEventListener('change', () => {
  const file = answerInput.files[0];
  if (!file) {
    answerDisplay.classList.add('hidden');
    answerDisplay.textContent = '';
    return;
  }
  if (file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' && !file.name.toLowerCase().endsWith('.docx')) {
    showNotification('Only Word DOCX files are accepted. Please upload a DOCX file.');
    answerInput.value = '';
    answerDisplay.classList.add('hidden');
    return;
  }
  if (!validateAnswerFileForSelectedModule(file)) {
    answerInput.value = '';
    answerDisplay.classList.add('hidden');
    return;
  }
  answerDisplay.innerText = `Selected: ${file.name}`;
  answerDisplay.classList.remove('hidden');
});

function showNotification(message, isError = true) {
  const notif = document.getElementById('notification');
  const msg = document.getElementById('notification-msg');
  msg.innerText = message;
  notif.classList.remove('bg-emerald-600', 'bg-red-600');
  notif.classList.add(isError ? 'bg-red-600' : 'bg-emerald-600');
  notif.classList.remove('translate-y-20', 'opacity-0');
  notif.classList.add('translate-y-0', 'opacity-100');
  setTimeout(() => {
    notif.classList.add('translate-y-20', 'opacity-0');
    notif.classList.remove('translate-y-0', 'opacity-100');
  }, 6000);
}
document.getElementById('upload-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const aFile = answerInput.files[0];
  if (!aFile) {
    showNotification('Please select your answer file (DOCX) before submitting.');
    return;
  }
  if (aFile.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' && !aFile.name.toLowerCase().endsWith('.docx')) {
    showNotification('Only Word DOCX files are accepted. Please upload a DOCX file.');
    return;
  }
  if (!validateAnswerFileForSelectedModule(aFile)) {
    answerInput.value = '';
    answerDisplay.classList.add('hidden');
    return;
  }
  debugLog('Starting submission', {
    fileName: aFile.name,
    fileSize: aFile.size,
    webhook: WEBHOOK_URL
  });
  navigateTo('loading');
  try {
    const formData = new FormData();
    formData.append('answerFile', aFile);
    formData.append('subject', selectedModule);
    formData.append('moduleCode', selectedModule);
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: formData,
    });
    const rawText = await response.text();
    debugLog('Response status', response.status);
    debugLog('Raw response text', rawText.slice(0, 4000));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${rawText || response.statusText}`);
    }
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      throw new Error('Server did not return valid JSON');
    }
    debugLog('Parsed response', data);
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format from server');
    }
    if (data.success === false) {
      throw new Error(data.message || 'Workflow reported failure');
    }
    // Normalize the response fields - handle both snake_case and camelCase
    const normalizedData = normalizeWorkflowData(data);
    if (!Array.isArray(normalizedData.criterionResults) || normalizedData.criterionResults.length === 0) {
      debugLog('Warning: No criterion results found', normalizedData);
      throw new Error('No assessment results returned from the workflow. Please check the LLM output format.');
    }
    renderFeedback(normalizedData);
    navigateTo('feedback');
    showNotification('Analysis complete!', false);
    if (data.supabaseStored === false) {
      showNotification(`Feedback generated, but history was not saved: ${data.supabaseStoreError || 'Supabase store failed'}`);
    }
    loadHistory(true);
  } catch (err) {
    debugLog('Submission error', {
      message: err.message,
      stack: err.stack
    });
    console.error('Submission Error:', err);
    navigateTo('upload');
    showNotification(`Submission Failed: ${err.message}`);
  }
});

function renderFeedback(data) {
  debugLog('Rendering feedback', data);
  lastFeedbackData = data;
  const moduleCode = MODULE_CONFIGS[data.moduleCode] ? data.moduleCode : 'EOM';
  selectedModule = moduleCode;
  renderModuleContent();
  const excelBtn = document.getElementById('download-excel-btn');
  if (excelBtn) {
    const allowExcelExport = moduleCode !== 'POM' && !!data.excelExport;
    excelBtn.classList.toggle('hidden', moduleCode === 'POM');
    excelBtn.disabled = !allowExcelExport;
  }
  const tbody = document.getElementById('feedback-table-body');
  const emptyState = document.getElementById('empty-feedback');
  const feedbackSection = document.getElementById('view-feedback');
  if (!tbody || !feedbackSection) return;
  tbody.innerHTML = '';
  const criterionResults = Array.isArray(data.criterionResults) ? data.criterionResults : [];
  const taskTotals = Array.isArray(data.taskTotals) ? data.taskTotals : [];
  const moduleName = data.moduleName || (moduleCode === 'POM' ? 'Principles of Operations Management' : 'Essentials of Management');
  const finalGrade = data.finalGrade || '';
  const finalGradeReason = data.finalGradeReason || '';
  const overallFeedback = data.overallFeedback || '';
  const priorityImprovements = Array.isArray(data.priorityImprovements) ? data.priorityImprovements : [];
  const overallTotal = Number(data.overallTotal || 0);
  const overallMax = Number(data.overallMax || 100);
  const report = data.report || '';
  const errorMessage = data.message || '';
  const wordCount = data.wordCount || 0;
  const feedbackModuleLabel = document.getElementById('feedback-module-label');
  if (feedbackModuleLabel) {
    feedbackModuleLabel.textContent = `Module: ${moduleCode} - ${moduleName}${finalGrade ? ` • Final grade: ${finalGrade}` : ''}`;
  }
  // Remove existing summary boxes if they exist
  const existingSummary = document.getElementById('result-summary');
  const existingReport = document.getElementById('plain-report');
  if (existingSummary) existingSummary.remove();
  if (existingReport) existingReport.remove();
  if (!criterionResults.length) {
    emptyState.classList.remove('hidden');
    const summaryBox = document.createElement('div');
    summaryBox.id = 'result-summary';
    summaryBox.className = 'mb-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm';
    summaryBox.innerHTML = `
                    <div class="text-sm font-semibold text-slate-700 mb-2">Workflow Response</div>
                    <p class="text-sm text-slate-600">${escapeHtml(errorMessage || 'No criterion results were returned by the workflow.')}</p>
                    <pre class="mt-4 text-xs bg-slate-50 p-3 rounded overflow-auto">${escapeHtml(JSON.stringify(data, null, 2))}</pre>
                `;
    feedbackSection.insertBefore(summaryBox, feedbackSection.children[1]);
    return;
  }
  emptyState.classList.add('hidden');
  // Calculate reference audit from the answer text if available
  const referenceAudit = {
    hasInTextCitations: false,
    hasReferenceList: false,
    citationCount: 0,
    referenceStrength: 'unknown'
  };
  const summaryBox = document.createElement('div');
  summaryBox.id = 'result-summary';
  summaryBox.className = 'mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4';
  const scorePanel = finalGrade ? `
                <div class="text-sm text-slate-500 mb-1">Final Grade</div>
                <div class="text-3xl font-bold text-slate-900">${escapeHtml(finalGrade)}</div>
                <div class="text-xs text-slate-500 mt-2">Name: ${escapeHtml(data.studentName || 'Not found')}</div>
                <div class="text-xs text-slate-500">ID: ${escapeHtml(data.studentId || 'Not found')}</div>
            ` : `
                <div class="text-sm text-slate-500 mb-1">Overall Score</div>
                <div class="text-3xl font-bold text-slate-900">${overallTotal}/${overallMax}</div>
                <div class="text-xs text-slate-400 mt-1">${overallMax > 0 ? Math.round((overallTotal / overallMax) * 100) : 0}%</div>
                <div class="text-xs text-slate-500 mt-2">Name: ${escapeHtml(data.studentName || 'Not found')}</div>
                <div class="text-xs text-slate-500">ID: ${escapeHtml(data.studentId || 'Not found')}</div>
            `;
  summaryBox.innerHTML = `
                <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    ${scorePanel}
                </div>
                <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm lg:col-span-2">
                    <div class="text-sm font-semibold text-slate-700 mb-2">${finalGrade ? 'Activity Grades' : 'Task Totals'}</div>
                    <div class="flex flex-wrap gap-3">
                        ${taskTotals.length ? taskTotals.map(t => `
                            <div class="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm">
                                <span class="font-semibold text-slate-800">${escapeHtml(t.task || 'Task')}:</span>
                                <span class="text-slate-600">${escapeHtml(t.display || t.grade || `${Number(t.total || 0)}/${Number(t.max || 25)}`)}</span>
                            </div>
                        `).join('') : '<p class="text-sm text-slate-500">No task/activity totals provided.</p>'}
                    </div>
                </div>
                <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div class="text-sm font-semibold text-slate-700 mb-2">Overall Feedback</div>
                    <p class="text-sm text-slate-600 leading-6">${escapeHtml(overallFeedback) || 'No summary feedback provided.'}</p>
                </div>
                <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm lg:col-span-2">
                    <div class="text-sm font-semibold text-slate-700 mb-2">Priority Improvements</div>
                    ${priorityImprovements.length
      ? `<ul class="list-disc ml-5 text-sm text-slate-600 space-y-1">${priorityImprovements.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
      : `<p class="text-sm text-slate-500">No priority improvements provided.</p>`}
                </div>
            `;
  feedbackSection.insertBefore(summaryBox, feedbackSection.children[1]);
  if (report) {
    const reportBox = document.createElement('div');
    reportBox.id = 'plain-report';
    reportBox.className = 'mb-6 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm';
    reportBox.innerHTML = `
                    <div class="text-sm font-semibold text-slate-700 mb-2">Full Report</div>
                    <pre class="whitespace-pre-wrap text-sm text-slate-600 leading-6 font-mono bg-slate-50 p-4 rounded-lg max-h-96 overflow-auto">${escapeHtml(report)}</pre>
                `;
    feedbackSection.insertBefore(reportBox, summaryBox.nextSibling);
  }
  criterionResults.forEach((item) => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-slate-50 transition-colors';
    const grade = item.grade || item.activityGrade || '';
    const mark = Number(item.awardedMark || item.awarded_mark || 0);
    const maxMark = Number(item.maxMark || item.max_mark || 0);
    const ratio = maxMark > 0 ? mark / maxMark : 0;
    const statusBadge = grade ? gradeBadge(grade) : (ratio >= 0.7 ?
      '<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">GOOD</span>' :
      ratio >= 0.4 ?
        '<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">FAIR</span>' :
        '<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">WEAK</span>');
    const markOrGrade = grade ? `Grade: ${grade}` : `Mark: ${mark}/${maxMark}`;
    const evidenceLine = item.evidenceStrength || item.referenceQuality ?
      `<div class="mt-2 text-xs text-slate-500"><span class="font-semibold">Evidence:</span> ${escapeHtml(item.evidenceStrength || 'N/A')} • <span class="font-semibold">References:</span> ${escapeHtml(item.referenceQuality || 'N/A')}</div>` :
      '';
    row.innerHTML = `
                    <td class="py-5 px-6 align-top">
                        <div class="font-semibold text-slate-900">${escapeHtml(item.task || 'N/A')}</div>
                        <div class="text-xs text-slate-500 mt-1">${escapeHtml(markOrGrade)}</div>
                    </td>
                    <td class="py-5 px-6 text-sm text-slate-600 align-top">${escapeHtml(item.criterion || 'N/A')}</td>
                    <td class="py-5 px-6 text-sm text-slate-700 leading-relaxed align-top">
                        <div><span class="font-semibold">Justification:</span> ${escapeHtml(item.justification || 'No justification.')}</div>
                        <div class="mt-2"><span class="font-semibold">Improvement:</span> ${escapeHtml(item.improvement || 'No suggestion.')}</div>
                        ${evidenceLine}
                    </td>
                    <td class="py-5 px-6 text-center align-top">${statusBadge}</td>
                `;
    tbody.appendChild(row);
  });
}

function setCellValue(ws, cellAddress, value) {
  if (!ws[cellAddress]) ws[cellAddress] = {
    t: 's',
    v: ''
  };
  if (typeof value === 'number') {
    ws[cellAddress].t = 'n';
    ws[cellAddress].v = value;
  } else {
    ws[cellAddress].t = 's';
    ws[cellAddress].v = value || '';
  }
}

function buildFallbackWorkbook(excelExport) {
  const aoa = [
    ['Autumn 2025 - Essentials of Management Marking Scheme', '', '', '', ''],
    ['Student Name:', excelExport.studentName || '', 'Student ID:', excelExport.studentId || '', ''],
    ['Task', 'Guideline', 'Max', 'Marks Awarded', 'Remark'],
    ['', '', 'Marks', '', ''],
    ['1 (a)', 'Explanation the importance and application of essential skills to chosen organisation', 4, '', ''],
    ['', 'Using the workplace examples to demonstrate a practical understanding', 6, '', ''],
    ['1 (b)', 'Identifying the characteristics of chosen organisation', 5, '', ''],
    ['', 'Explanation of traditional organisation and modern organisation', 4, '', ''],
    ['', 'Rational evaluation: The chosen organisation is aligned with a traditional organisation or a new organisation', 6, '', ''],
    ['Task-1', '', 25, '', ''],
    ['2 (a)', 'Conducting a detailed SWOT analysis on the chosen organisation', 6, '', ''],
    ['', 'Identifying the main strategic challenges faced', 4, '', ''],
    ['2 (b)', 'Exploration about more detail of a strategic challenge in the chosen organisation', 4, '', ''],
    ['', 'Explanation of the steps in effective strategic goal setting', 5, '', ''],
    ['', 'Recommendation on a course of action to resolve the strategic challenge', 6, '', ''],
    ['Task-2', '', 25, '', ''],
    ['3(a)', 'Exploration of how budgeting enables a manager to allocate and control resources', 5, '', ''],
    ['', 'Exploration of how forecasting techniques enable a manager to allocate and control resources.', 5, '', ''],
    ['', 'Application to chosen organisation', 5, '', ''],
    ['3 (b)', 'Explanation of the importance of accurate information can aid the decision-making process', 4, '', ''],
    ['', 'Understanding how the results of budgeting and forecasting can aid decision making', 6, '', ''],
    ['Task-3', '', 25, '', ''],
    ['4(a)', "Identification of Five of Woodcock's building blocks", 5, '', ''],
    ['', 'Explanation of the application of the building blocks at the chosen organisation to aid team performance', 5, '', ''],
    ['', 'The use of workplace examples in the explanation', 5, '', ''],
    ['4(b)', 'Discussion of the importance of leadership to the chosen organisation', 2, '', ''],
    ['', 'Sufficient application of an appropriate leadership model', 2, '', ''],
    ['', 'Demonstration of how effective leadership styles (Three different styles) can be used in the chosen organisation with specific examples', 6, '', ''],
    ['Task-4', '', 25, '', ''],
    ['Total Marks from Task 1 to Task 4', '', 100, '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', 'Marker Comment:', '', '', ''],
    ['', excelExport.markerComment || '', '', '', '']
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{
    wch: 14
  }, {
    wch: 78
  }, {
    wch: 10
  }, {
    wch: 14
  }, {
    wch: 70
  }];
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  return wb;
}

function fillExcelWorkbook(wb, excelExport) {
  const wsName = wb.SheetNames[0];
  const ws = wb.Sheets[wsName];
  setCellValue(ws, 'B2', excelExport.studentName || '');
  setCellValue(ws, 'D2', excelExport.studentId || '');
  (excelExport.rows || []).forEach(row => {
    if (!row.excelRow) return;
    setCellValue(ws, `D${row.excelRow}`, Number(row.awardedMark || 0));
    setCellValue(ws, `E${row.excelRow}`, row.remark || '');
  });
  (excelExport.taskTotals || []).forEach(t => {
    if (t.excelRow) setCellValue(ws, `D${t.excelRow}`, Number(t.total || 0));
  });
  setCellValue(ws, 'D30', Number(excelExport.overallTotal || 0));
  setCellValue(ws, 'B33', 'Marker Comment:');
  setCellValue(ws, 'B34', excelExport.markerComment || '');
  ws['!cols'] = ws['!cols'] || [{
    wch: 14
  }, {
    wch: 78
  }, {
    wch: 10
  }, {
    wch: 14
  }, {
    wch: 70
  }];
  return wb;
}
async function downloadExcelReport() {
  if (!lastFeedbackData || !lastFeedbackData.excelExport) {
    showNotification('Excel export data is not available yet.');
    return;
  }
  if ((lastFeedbackData.moduleCode || 'EOM') === 'POM') {
    showNotification('Excel export is not available for POM results.');
    return;
  }
  if (typeof XLSX === 'undefined') {
    showNotification('Excel library did not load. Please check your internet connection and try again.');
    return;
  }
  const excelExport = lastFeedbackData.excelExport;
  let workbook;
  try {
    const templateResponse = await fetch('./EOM Marking Scheme 2024.xlsx');
    if (!templateResponse.ok) throw new Error('Template file not found beside index.html');
    const arrayBuffer = await templateResponse.arrayBuffer();
    workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      cellStyles: true
    });
    debugLog('Loaded Excel template for export');
  } catch (templateError) {
    debugLog('Template load failed, using fallback workbook', templateError.message);
    workbook = buildFallbackWorkbook(excelExport);
  }
  workbook = fillExcelWorkbook(workbook, excelExport);
  const fileName = excelExport.outputFileName || 'EOM_Marking_Scheme_Completed.xlsx';
  XLSX.writeFile(workbook, fileName);
  showNotification('Excel file downloaded.', false);
}

function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}
renderModuleContent();
loadHistory(false);
