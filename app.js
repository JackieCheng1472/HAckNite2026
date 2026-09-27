(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const localDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const parseDate = (value) => { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day); };
  const prettyDate = (value, options = { weekday: 'short', month: 'short', day: 'numeric' }) => parseDate(value).toLocaleDateString('en-US', options);
  const dateOffset = (days) => { const date = new Date(); date.setDate(date.getDate() + days); return localDate(date); };
  const store = {
    read(key, fallback) { try { return JSON.parse(localStorage.getItem(`daymark-${key}`)) ?? fallback; } catch { return fallback; } },
    write(key, value) { localStorage.setItem(`daymark-${key}`, JSON.stringify(value)); }
  };
  const defaultEvents = [
    { id: 'e1', title: 'Design sync', date: dateOffset(0), time: '09:30', duration: 45, notes: '', source: 'Work', color: 'green' },
    { id: 'e2', title: 'Lunch with Maya', date: dateOffset(0), time: '12:00', duration: 60, notes: '', source: 'Personal', color: 'peach' },
    { id: 'e3', title: 'Product review', date: dateOffset(0), time: '14:00', duration: 60, notes: '', source: 'Work', color: 'blue' },
    { id: 'e4', title: 'Send the project brief', date: dateOffset(1), time: '10:00', duration: 30, notes: '', source: 'Work', color: 'green' },
    { id: 'e5', title: 'Coffee with Sam', date: dateOffset(2), time: '11:30', duration: 60, notes: '', source: 'Personal', color: 'peach' },
    { id: 'e6', title: 'Focus time', date: dateOffset(3), time: '09:00', duration: 90, notes: '', source: 'Work', color: 'blue' },
    { id: 'e7', title: 'Pick up a prescription', date: dateOffset(4), time: '16:00', duration: 30, notes: '', source: 'Personal', color: 'green' },
    { id: 'e8', title: 'Weekly check-in', date: dateOffset(5), time: '10:30', duration: 30, notes: '', source: 'Work', color: 'blue' },
    { id: 'e9', title: 'Computer science lecture', date: dateOffset(1), time: '11:00', duration: 90, notes: '', source: 'School calendar · demo', color: 'blue', kind: 'class' },
    { id: 'e10', title: 'Free campus lunch', date: dateOffset(2), time: '12:00', duration: 60, notes: 'Vegetarian options available', source: 'Campus events · demo', color: 'green', kind: 'food' }
  ];
  const defaultSuggestions = [
    { id: 's1', title: 'Coffee with Jordan', source: 'Gmail', sender: 'Jordan Lee', detail: '“Are you free to catch up over coffee Thursday morning? My treat.”', date: dateOffset(4), time: '10:00', duration: 60, provider: 'google' },
    { id: 's2', title: 'Quarterly planning session', source: 'Outlook', sender: 'Priya Shah', detail: '“Let’s block some time for our Q4 planning session next week.”', date: dateOffset(6), time: '13:00', duration: 90, provider: 'microsoft' },
    { id: 's3', title: 'Dentist appointment', source: 'Gmail', sender: 'Brightside Dental', detail: '“Your appointment is confirmed. Please arrive 10 minutes early.”', date: dateOffset(8), time: '14:30', duration: 60, provider: 'google' },
    { id: 's4', title: 'Free pizza after the club meeting', source: 'Campus Events', sender: 'Student Activities', detail: '“Join us after the robotics meeting—pizza and vegetarian options are on us.”', date: dateOffset(1), time: '17:30', duration: 60, provider: 'google', kind: 'food' },
    { id: 's5', title: 'Maya’s birthday', source: 'Contacts', sender: 'Maya', detail: 'A birthday from your favorite contacts. Add a reminder or celebration.', date: dateOffset(3), time: '00:00', duration: 60, provider: 'contacts', kind: 'birthday', allDay: true },
    { id: 's6', title: 'Family dinner at Grandma’s', source: 'Messages · demo', sender: 'Mom', detail: '“Can everyone come over for dinner Saturday? Grandma would love to see you.”', date: dateOffset(4), time: '18:00', duration: 120, provider: 'messages', kind: 'family' },
    { id: 's7', title: 'Regional holiday · sample', source: 'Holiday calendar · demo', sender: 'Local calendar', detail: 'A sample all-day holiday entry. Choose your region when connecting a real calendar.', date: dateOffset(6), time: '00:00', duration: 60, provider: 'local', kind: 'holiday', allDay: true }
  ];
  const defaultReminders = [
    { id: 'r1', title: 'Send the project notes to Maya', date: dateOffset(0), source: 'Work', done: false },
    { id: 'r2', title: 'Pick up oat milk', date: dateOffset(1), source: 'Errands', done: false },
    { id: 'r3', title: 'Book a haircut', date: dateOffset(3), source: 'Personal', done: false },
    { id: 'r4', title: 'Renew library books', date: dateOffset(-1), source: 'Personal', done: true }
  ];
  let events = store.read('events', defaultEvents);
  let suggestions = store.read('suggestions', defaultSuggestions);
  let reminders = store.read('reminders', defaultReminders);
  let preferences = store.read('preferences', { name: 'Carmen', weekStartsOn: 0, food: '', favorites: [], watch: ['food', 'birthday', 'holiday', 'family'] });
  let currentWeek = new Date(); currentWeek.setHours(0, 0, 0, 0); currentWeek.setDate(currentWeek.getDate() - ((currentWeek.getDay() - Number(preferences.weekStartsOn || 0) + 7) % 7));
  let reminderFilter = 'all';
  let calendarSearch = '';
  let showSpecialEvents = true;
  let syllabusCandidates = [];
  let syllabusFileName = '';
  let activeResize = null;
  let toastTimer;

  function toast(message) { const node = $('#toast'); node.textContent = message; node.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('show'), 2800); }
  function updateDateLabels() {
    const now = new Date();
    $('#today-label').textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    $('#welcome-date').textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
    $('#today-heading').textContent = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    $('#agenda-date').textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }
  function renderAgenda() {
    const todayEvents = events.filter(event => event.date === localDate(new Date())).sort((a, b) => a.time.localeCompare(b.time));
    $('#agenda-list').innerHTML = todayEvents.length ? todayEvents.map(event => `<div class="agenda-row"><span class="agenda-time">${formatTime(event.time)}</span><i class="agenda-line ${event.color === 'green' ? '' : event.color}" aria-hidden="true"></i><div class="agenda-copy"><strong>${escapeHtml(event.title)}</strong><span>${event.duration} min · ${escapeHtml(event.source || 'Personal')}</span></div><span class="agenda-tag">${event.source === 'Work' ? 'WORK' : 'PERSONAL'}</span></div>`).join('') : '<div class="empty-agenda">Nothing on the calendar yet. Enjoy the space.</div>';
  }
  function isSuggestionVisible(item) {
    if (item.kind && !(preferences.watch || []).includes(item.kind)) return false;
    if (item.kind === 'birthday' && (preferences.favorites || []).length) {
      const people = `${item.title} ${item.sender}`.toLowerCase();
      if (!(preferences.favorites || []).some(name => people.includes(name.toLowerCase()))) return false;
    }
    return true;
  }
  const kindPriority = { deadline: 'urgent', appointment: 'high', birthday: 'high', family: 'high', holiday: 'high', event: 'normal', class: 'normal', food: 'normal', focus: 'low' };
  const priorityRank = { low: 1, normal: 2, high: 3, urgent: 4 };
  function defaultPriorityForKind(kind, special = false) { return special ? 'low' : (kindPriority[kind] || 'normal'); }
  function eventPriority(item) {
    const priority = priorityRank[item.priority] ? item.priority : defaultPriorityForKind(item.kind || 'event', item.special);
    return priorityRank[priority];
  }
  function renderSuggestions() {
    const visibleSuggestions = suggestions.filter(isSuggestionVisible);
    $('#suggestion-count').textContent = visibleSuggestions.length;
    const preview = visibleSuggestions.slice(0, 2);
    $('#suggestion-list').innerHTML = preview.length ? preview.map(suggestion => `<div class="suggestion-mini"><i class="source-dot ${suggestion.provider}" aria-hidden="true"></i><div class="suggestion-mini-copy"><strong>${escapeHtml(suggestion.title)}</strong><span>${escapeHtml(suggestion.source)} · ${prettyDate(suggestion.date)}</span></div><button class="mini-add" data-approve="${suggestion.id}" aria-label="Add ${escapeHtml(suggestion.title)}">＋ Add</button></div>`).join('') : '<div class="empty-agenda">All caught up. Nothing needs your attention.</div>';
    $('#inbox-suggestions').innerHTML = visibleSuggestions.length ? visibleSuggestions.map(suggestion => `<article class="inbox-card"><div class="inbox-card-icon ${suggestion.provider}">${suggestion.provider === 'google' ? '✉' : (suggestion.provider === 'contacts' ? '♡' : '▣')}</div><div class="inbox-card-body"><div class="inbox-card-top"><strong>${escapeHtml(suggestion.title)}</strong><span>${escapeHtml(suggestion.source)}</span></div><p>${escapeHtml(suggestion.detail)}${suggestion.kind === 'food' && preferences.food ? ` · Preference: ${escapeHtml(preferences.food)}` : ''}</p><div class="inbox-event-meta"><span>◷ ${suggestion.allDay ? 'All day · ' : ''}${prettyDate(suggestion.date)}${suggestion.allDay ? '' : `, ${formatTime(suggestion.time)}`}</span><span>${suggestion.kind ? escapeHtml(suggestion.kind) : `${suggestion.duration} min`}</span><span>From ${escapeHtml(suggestion.sender)}</span></div></div><div class="inbox-actions"><button class="dismiss-button" data-dismiss="${suggestion.id}">Dismiss</button><button class="approve-button" data-approve="${suggestion.id}">Add to calendar</button></div></article>`).join('') : '<div class="card reminder-empty">No matching suggestions. Adjust your personal filters to see more.</div>';
  }
  function renderCalendar() {
    const calendar = $('#calendar-view');
    if ($('#calendar-tools').parentElement !== calendar) calendar.insertBefore($('#calendar-tools'), $('#week-calendar'));
    if (!$('#calendar-priority-help')) {
      const help = document.createElement('small'); help.id = 'calendar-priority-help'; help.className = 'calendar-priority-help';
      help.textContent = 'Overlaps show the highest priority. Drag an event’s bottom edge to resize it.';
      $('#calendar-tools').append(help);
    }
    const days = Array.from({ length: 7 }, (_, index) => { const d = new Date(currentWeek); d.setDate(d.getDate() + index); return d; });
    const first = days[0]; const last = days[6];
    $('#week-label').textContent = first.getMonth() === last.getMonth() ? first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : `${first.toLocaleDateString('en-US', { month: 'short' })} – ${last.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    const startHour = 0; const endHour = 24; const hourHeight = 60;
    const hours = Array.from({ length: endHour - startHour }, (_, index) => index + startHour);
    const headers = `<div class="time-column"><div class="time-head"></div><div class="all-day-row">All day</div>${hours.map(hour => `<div class="time-label">${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}</div>`).join('')}</div>`;
    const query = calendarSearch.trim().toLowerCase();
    const matchesQuery = item => !query || `${item.title} ${item.source || ''} ${item.notes || ''} ${item.detail || ''} ${item.sender || ''}`.toLowerCase().includes(query);
    const visibleEvents = events.filter(item => matchesQuery(item) && (showSpecialEvents || !item.special));
    const visibleDrafts = suggestions.filter(item => isSuggestionVisible(item) && matchesQuery(item));
    const columns = days.map(day => {
      const dayId = localDate(day); const isToday = dayId === localDate(new Date());
      const dayStart = new Date(`${dayId}T00:00:00`);
      const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);
      const allItems = [
        ...visibleEvents.map(item => ({ ...item, isDraft: false })),
        ...visibleDrafts.map(item => ({ ...item, isDraft: true }))
      ];
      const dayItems = allItems.filter(item => {
        if (item.allDay) return item.date === dayId;
        const starts = new Date(`${item.date}T${item.time || '00:00'}:00`);
        const ends = new Date(starts.getTime() + Math.max(1, Number(item.duration) || 60) * 60000);
        return starts < dayEnd && ends > dayStart;
      });
      const allDay = dayItems.filter(item => item.allDay).map(item => `<div class="all-day-pill ${item.isDraft ? 'calendar-draft' : ''} ${item.special ? 'special-event' : ''}" ${item.isDraft ? `data-review-suggestion="${item.id}"` : ''}>${escapeHtml(item.title)}</div>`).join('');
      const timedEvents = dayItems.filter(item => !item.allDay).map(item => {
        const starts = new Date(`${item.date}T${item.time || '00:00'}:00`);
        const ends = new Date(starts.getTime() + Math.max(1, Number(item.duration) || 60) * 60000);
        const visibleStart = new Date(dayStart); visibleStart.setHours(startHour, 0, 0, 0);
        const visibleEnd = new Date(dayStart); visibleEnd.setHours(endHour, 0, 0, 0);
        return { ...item, starts, ends, segmentStart: Math.max(starts.getTime(), visibleStart.getTime()), segmentEnd: Math.min(ends.getTime(), visibleEnd.getTime()) };
      }).filter(item => item.segmentEnd > item.segmentStart).sort((a, b) => a.segmentStart - b.segmentStart);
      const cutPoints = [...new Set(timedEvents.flatMap(item => [item.segmentStart, item.segmentEnd]))].sort((a, b) => a - b);
      const priorityFragments = [];
      for (let point = 0; point < cutPoints.length - 1; point += 1) {
        const segmentStart = cutPoints[point]; const segmentEnd = cutPoints[point + 1];
        const active = timedEvents.filter(item => item.segmentStart < segmentEnd && item.segmentEnd > segmentStart);
        if (!active.length) continue;
        const highest = Math.max(...active.map(eventPriority));
        for (const item of active.filter(entry => eventPriority(entry) === highest)) {
          const previous = priorityFragments.find(fragment => String(fragment.id) === String(item.id) && fragment.segmentEnd === segmentStart);
          if (previous) previous.segmentEnd = segmentEnd;
          else priorityFragments.push({ ...item, segmentStart, segmentEnd });
        }
      }
      priorityFragments.sort((a, b) => a.segmentStart - b.segmentStart);
      const lanes = [];
      const cards = priorityFragments.map(item => {
        let lane = lanes.findIndex(end => end <= item.segmentStart);
        if (lane < 0) lane = lanes.length;
        lanes[lane] = item.segmentEnd;
        const laneCount = Math.max(1, lanes.length);
        const kind = item.kind || (item.title.toLowerCase().includes('class') ? 'class' : (item.color === 'peach' ? 'appointment' : (item.color === 'blue' ? 'focus' : 'event')));
        const top = (item.segmentStart - dayStart.getTime()) / 60000 * hourHeight / 60;
        const height = Math.max(23, (item.segmentEnd - item.segmentStart) / 60000 * hourHeight / 60 - 3);
        const left = 3 + lane * (94 / laneCount); const width = 94 / laneCount;
        const favorite = (preferences.favorites || []).some(name => `${item.title} ${item.sender || ''}`.toLowerCase().includes(name.toLowerCase()));
        const continued = item.starts.getTime() < dayStart.getTime();
        const segmentDate = new Date(item.segmentStart);
        const segmentClock = `${String(segmentDate.getHours()).padStart(2, '0')}:${String(segmentDate.getMinutes()).padStart(2, '0')}`;
        const priorityName = Object.keys(priorityRank).find(name => priorityRank[name] === eventPriority(item));
        const eventSource = item.source || (item.isDraft ? 'Suggestion' : 'Personal calendar');
        const detailData = `data-event-details data-event-id="${escapeHtml(item.id)}" data-event-title="${escapeHtml(item.title)}" data-event-date="${item.date}" data-event-time="${item.time || '00:00'}" data-event-duration="${Number(item.duration) || 60}" data-event-kind="${escapeHtml(kind)}" data-event-priority="${priorityName}" data-event-source="${escapeHtml(eventSource)}" data-event-notes="${escapeHtml(item.notes || item.detail || '')}" data-event-special="${item.special ? 'true' : 'false'}" data-event-draft="${item.isDraft ? 'true' : 'false'}"`;
        const controls = item.isDraft ? '' : `<span class="calendar-event-controls"><button type="button" data-toggle-special="${item.id}" aria-label="${item.special ? 'Remove special marking' : 'Mark as special'}">${item.special ? '★' : '☆'}</button><button type="button" data-delete-event="${item.id}" aria-label="Remove ${escapeHtml(item.title)}">×</button></span><button type="button" class="resize-grip" data-resize-event="${item.id}" aria-label="Drag to change duration for ${escapeHtml(item.title)}" title="Drag to change duration"></button>`;
        return `<div class="calendar-event priority-${priorityName} kind-${kind} ${item.isDraft ? 'calendar-draft' : ''} ${item.special ? 'special-event' : ''} ${favorite ? 'favorite-event' : ''}" style="top:${top}px;height:${height}px;left:${left}%;width:${width}%" ${detailData} ${item.isDraft ? `data-review-suggestion="${item.id}"` : ''} title="${priorityName[0].toUpperCase()}${priorityName.slice(1)} priority"><strong>${escapeHtml(item.title)}</strong><span>${item.isDraft ? 'Draft · ' : ''}${continued ? 'Continues · ' : ''}${formatTime(continued ? segmentClock : item.time)}${item.source ? ` · ${escapeHtml(item.source)}` : ''}</span>${controls}</div>`;
      }).join('');
      return `<div class="day-column"><div class="day-head ${isToday ? 'is-today' : ''}">${day.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}<strong>${day.getDate()}</strong></div><div class="all-day-row">${allDay}</div><div class="day-body" style="height:${hours.length * hourHeight}px">${cards}</div></div>`;
    }).join('');
    $('#week-calendar').innerHTML = headers + columns;
  }
  function updateEventDuration(id, duration) {
    const item = events.find(entry => String(entry.id) === String(id));
    if (!item) return;
    item.duration = Math.max(15, Math.min(7 * 24 * 60, Math.round(duration / 15) * 15));
    store.write('events', events); renderAgenda(); renderCalendar();
  }
  function openEventDetails(card) {
    const data = card.dataset;
    const date = parseDate(data.eventDate);
    const dateLabel = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    $('#event-details-title').textContent = data.eventTitle;
    $('#event-details-when').textContent = data.eventTime === '00:00' && data.eventDuration === '60' && data.eventKind === 'birthday' ? `${dateLabel} · All day` : `${dateLabel} · ${formatTime(data.eventTime)}`;
    $('#event-details-duration').textContent = data.eventTime === '00:00' && data.eventKind === 'birthday' ? 'All day' : `${data.eventDuration} minutes`;
    $('#event-details-kind').textContent = data.eventKind.replace(/\b\w/g, letter => letter.toUpperCase());
    $('#event-details-priority').textContent = data.eventPriority.replace(/\b\w/g, letter => letter.toUpperCase());
    $('#event-details-source').textContent = data.eventSource;
    $('#event-details-notes').textContent = data.eventNotes || 'No description or notes.';
    $('#event-details-notes-row').hidden = false;
    const deleteButton = $('#event-details-delete');
    deleteButton.hidden = data.eventDraft === 'true';
    deleteButton.dataset.eventId = data.eventId;
    $('#event-details-dialog').showModal();
  }
  function renderReminders() {
    const open = reminders.filter(item => !item.done).length;
    $('#all-reminder-count').textContent = reminders.length;
    $('#open-reminder-count').textContent = open;
    const visible = reminders.filter(item => reminderFilter === 'all' || (reminderFilter === 'open' && !item.done) || (reminderFilter === 'done' && item.done));
    $('#reminder-list').innerHTML = visible.length ? visible.map(item => `<div class="reminder-row ${item.done ? 'done' : ''}"><button class="reminder-check" data-toggle-reminder="${item.id}" aria-label="${item.done ? 'Mark as not done' : 'Mark as done'}">${item.done ? '✓' : ''}</button><span class="reminder-title">${escapeHtml(item.title)}</span><span class="reminder-due">${item.date ? prettyDate(item.date, { month: 'short', day: 'numeric' }) : 'No date'}</span><span class="reminder-source">${escapeHtml(item.source)}</span></div>`).join('') : '<div class="reminder-empty">A clean slate. Add a reminder whenever you need one.</div>';
  }
  function renderConnections() {
    for (const provider of ['google', 'microsoft']) {
      $(`#${provider === 'google' ? 'gmail' : 'outlook'}-status`).textContent = 'OAuth setup required';
      $$(`[data-connect="${provider}"]`).forEach(button => { button.textContent = button.classList.contains('provider-connect') ? 'Setup needed' : 'Connect'; button.classList.remove('is-connected'); });
    }
  }
  function renderAll() { renderAgenda(); renderSuggestions(); renderCalendar(); renderReminders(); renderConnections(); }
  function formatTime(value) { const [hour, minute] = value.split(':').map(Number); return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`; }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
  function saveEvents() { store.write('events', events); renderAgenda(); renderCalendar(); }
  function navigate(view) {
    const valid = ['home', 'calendar', 'inbox', 'reminders'].includes(view) ? view : 'home';
    $$('.page-view').forEach(section => section.classList.toggle('active-view', section.id === `${valid}-view`));
    $$('.nav-item').forEach(link => link.classList.toggle('active', link.dataset.view === valid));
    const title = { home: 'Overview', calendar: 'Calendar', inbox: 'Suggestions', reminders: 'Reminders' }[valid];
    $('#current-section').textContent = title;
    if (location.hash !== `#${valid}`) history.replaceState(null, '', `#${valid}`);
    if (valid === 'calendar') renderCalendar();
  }
  function openEventDialog({ title = '', date = localDate(new Date()), time = '10:00', notes = '' } = {}) {
    $('#event-form').reset(); $('#event-title').value = title; $('#event-date').value = date; $('#event-time').value = time; $('#event-notes').value = notes; $('#event-duration').value = '60'; syncCustomDuration(); $('#event-dialog').showModal(); $('#event-title').focus();
  }
  function syncCustomDuration() {
    const custom = $('#event-duration').value === 'custom';
    $('#custom-duration-field').hidden = !custom;
    $('#custom-duration-hours').required = custom;
    if (!custom) $('#custom-duration-hours').value = '';
  }
  function createEvent(title, date, time, duration = 60, source = 'Personal', color = 'green', notes = '', kind = 'event', allDay = false, priority = null) {
    events.push({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), title, date, time, duration: Number(duration), source, color, notes, kind, allDay, priority: priority || defaultPriorityForKind(kind) });
    saveEvents();
  }
  function handlePlanner() {
    const input = $('#planner-input'); const text = input.value.trim(); if (!text) { input.focus(); return; }
    const lower = text.toLowerCase(); let date = localDate(new Date());
    if (lower.includes('tomorrow')) date = dateOffset(1);
    else if (lower.includes('next week')) date = dateOffset(7);
    else {
      const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const weekdayIndex = weekdays.findIndex(day => lower.includes(day));
      if (weekdayIndex >= 0) { const todayIndex = new Date().getDay(); let delta = (weekdayIndex - todayIndex + 7) % 7; if (!delta || lower.includes('next ' + weekdays[weekdayIndex])) delta += 7; date = dateOffset(delta); }
    }
    let time = '10:00'; const match = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
    if (match) { let hour = Number(match[1]) % 12; if (match[3] === 'pm') hour += 12; time = `${String(hour).padStart(2, '0')}:${match[2] || '00'}`; }
    let title = text.replace(/\b(?:today|tomorrow|next week|next\s+)?(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/gi, '').replace(/\b(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi, '').replace(/\b(?:next week|tomorrow|today)\b/gi, '').replace(/\s+/g, ' ').trim();
    title = title.replace(/^(?:please\s+)?(?:schedule|add|plan|block|remind me to)\s+/i, '').replace(/\s+(?:for|on|at)\s*$/i, '').trim();
    if (!title) title = text;
    openEventDialog({ title: title[0].toUpperCase() + title.slice(1), date, time });
    input.value = '';
  }
  function approveSuggestion(id) {
    const suggestion = suggestions.find(item => item.id === id); if (!suggestion) return;
    createEvent(suggestion.title, suggestion.date, suggestion.time, suggestion.duration, suggestion.source, 'green', suggestion.detail, suggestion.kind || 'event', Boolean(suggestion.allDay), suggestion.priority || null);
    suggestions = suggestions.filter(item => item.id !== id); store.write('suggestions', suggestions); renderSuggestions(); toast(`“${suggestion.title}” added to your calendar.`);
  }
  let pdfLibraryPromise;
  let docxLibraryPromise;
  function loadScriptOnce(source, globalName, cachedPromise) {
    if (window[globalName]) return Promise.resolve(window[globalName]);
    if (cachedPromise) return cachedPromise;
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = source; script.async = true;
      script.onload = () => window[globalName] ? resolve(window[globalName]) : reject(new Error('The document reader did not initialize.'));
      script.onerror = () => reject(new Error('Could not load the document reader. Check your internet connection and try again.'));
      document.head.append(script);
    });
    return promise;
  }
  async function readSyllabusFile(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    if (['txt', 'md', 'csv'].includes(extension)) return file.text();
    if (extension === 'pdf') {
      pdfLibraryPromise ||= loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', 'pdfjsLib', pdfLibraryPromise);
      const pdfjs = await pdfLibraryPromise;
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      const pages = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const items = (await page.getTextContent()).items;
        const rows = [];
        for (const item of items) {
          if (!item.str?.trim()) continue;
          const y = Math.round(item.transform?.[5] || 0);
          let row = rows.find(entry => Math.abs(entry.y - y) <= 2);
          if (!row) { row = { y, text: [] }; rows.push(row); }
          row.text.push(item.str.trim());
        }
        pages.push(rows.sort((a, b) => b.y - a.y).map(row => row.text.join(' ')).join('\n'));
      }
      return pages.join('\n');
    }
    if (extension === 'docx') {
      docxLibraryPromise ||= loadScriptOnce('https://unpkg.com/mammoth@1.8.0/mammoth.browser.min.js', 'mammoth', docxLibraryPromise);
      const mammoth = await docxLibraryPromise;
      return (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value;
    }
    throw new Error('Use a .txt, .md, .csv, searchable .pdf, or .docx syllabus.');
  }
  function syllabusDate(line) {
    let match = line.match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/);
    if (match) {
      const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
      if (parsed.getFullYear() === Number(match[1]) && parsed.getMonth() === Number(match[2]) - 1 && parsed.getDate() === Number(match[3])) return { value: localDate(parsed), token: match[0] };
      return null;
    }
    match = line.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
    if (match) {
      const year = match[3] ? Number(match[3].length === 2 ? `20${match[3]}` : match[3]) : new Date().getFullYear();
      const parsed = new Date(year, Number(match[1]) - 1, Number(match[2]));
      if (parsed.getFullYear() === year && parsed.getMonth() === Number(match[1]) - 1 && parsed.getDate() === Number(match[2])) return { value: localDate(parsed), token: match[0] };
      return null;
    }
    const months = 'january february march april may june july august september october november december'.split(' ');
    const monthPattern = '(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)';
    match = line.match(new RegExp(`\\b${monthPattern}\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(20\\d{2}))?\\b`, 'i'));
    if (!match) match = line.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+${monthPattern}\\.?[,]?\\s*(20\\d{2})?\\b`, 'i'));
    if (match) {
      const monthWord = /^\d/.test(match[1]) ? match[2] : match[1];
      const day = Number(/^\d/.test(match[1]) ? match[1] : match[2]);
      const year = Number((/^\d/.test(match[1]) ? match[3] : match[3]) || new Date().getFullYear());
      const month = months.findIndex(name => name.startsWith(monthWord.toLowerCase().slice(0, 3))) + 1;
      const validDate = new Date(year, month - 1, day);
      if (month && validDate.getMonth() === month - 1 && validDate.getDate() === day) return { value: localDate(validDate), token: match[0] };
    }
    return null;
  }
  function syllabusTime(line) {
    let match = line.match(/\b(\d{1,2})(?::([0-5]\d))?\s*(a\.?m\.?|p\.?m\.?)\b/i);
    if (match) {
      let hour = Number(match[1]) % 12;
      if (match[3].toLowerCase().startsWith('p')) hour += 12;
      return { value: `${String(hour).padStart(2, '0')}:${match[2] || '00'}`, token: match[0] };
    }
    match = line.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    return match ? { value: `${String(match[1]).padStart(2, '0')}:${match[2]}`, token: match[0] } : { value: '09:00', token: '' };
  }
  function parseSyllabus(text) {
    const candidates = [];
    const eventWords = /\b(exam|midterm|final|quiz|test|homework|assignment|problem set|project|due|submit|office hours?|lecture|class|meeting|appointment|lab|review|presentation|registration)\b/i;
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.replace(/\s+/g, ' ').trim();
      if (!line || !eventWords.test(line)) continue;
      const date = syllabusDate(line);
      if (!date) continue;
      const time = syllabusTime(line);
      const title = line.replace(date.token, ' ').replace(time.token, ' ').replace(/\b(?:on|at|due|by)\b/gi, ' ').replace(/[|•–—]+/g, ' ').replace(/\s+/g, ' ').replace(/^[\s:;,.-]+|[\s:;,.-]+$/g, '').slice(0, 140);
      const officeHours = /office hours?|drop[- ]?in|tutoring/i.test(line);
      const kind = /exam|midterm|final|quiz|test/i.test(line) ? 'deadline' : /homework|assignment|problem set|due|submit/i.test(line) ? 'deadline' : officeHours ? 'focus' : 'class';
      candidates.push({ title: title || line.slice(0, 140), date: date.value, time: time.value, duration: 60, kind, special: officeHours, selected: true, sourceLine: line });
    }
    return candidates;
  }
  function renderSyllabusCandidates() {
    $('#syllabus-candidates').innerHTML = syllabusCandidates.map((item, index) => `<article class="syllabus-candidate" data-candidate="${index}"><label class="candidate-select"><input type="checkbox" data-candidate-selected="${index}" ${item.selected ? 'checked' : ''}> Include</label><label>Event name<input class="form-input" data-candidate-title="${index}" value="${escapeHtml(item.title)}"></label><div class="form-two"><label>Date<input class="form-input" type="date" data-candidate-date="${index}" value="${item.date}"></label><label>Time<input class="form-input" type="time" data-candidate-time="${index}" value="${item.time}"></label></div><label class="special-toggle"><input type="checkbox" data-candidate-special="${index}" ${item.special ? 'checked' : ''}> Mark special (can be hidden)</label><small>${escapeHtml(item.sourceLine)}</small></article>`).join('');
    $('#add-syllabus-events').disabled = !syllabusCandidates.some(item => item.selected);
  }
  async function scanSyllabus(file) {
    syllabusFileName = file.name;
    $('#syllabus-dialog').showModal();
    $('#syllabus-status').textContent = `Reading ${file.name} locally…`;
    $('#syllabus-candidates').replaceChildren();
    $('#add-syllabus-events').disabled = true;
    try {
      const text = await readSyllabusFile(file);
      syllabusCandidates = parseSyllabus(text);
      $('#syllabus-status').textContent = syllabusCandidates.length ? `Found ${syllabusCandidates.length} possible dated item(s) in ${file.name}. Review and edit before adding; scanned documents are not uploaded.` : 'No dated exam, assignment, class, or office-hour items were recognized. For scanned-image PDFs, paste or type the schedule as text instead.';
      renderSyllabusCandidates();
    } catch (error) {
      $('#syllabus-status').textContent = error.message || 'Could not read this file.';
    }
  }
  function closeSyllabusDialog() { $('#syllabus-dialog').close(); $('#syllabus-file').value = ''; }
  function bindEvents() {
    document.addEventListener('click', event => {
      const detailsCard = event.target.closest('[data-event-details]');
      if (detailsCard && !event.target.closest('button')) { event.preventDefault(); openEventDetails(detailsCard); return; }
      const nav = event.target.closest('[data-view]'); if (nav) { event.preventDefault(); navigate(nav.dataset.view); return; }
      const viewLink = event.target.closest('[data-view-link]'); if (viewLink) { navigate(viewLink.dataset.viewLink); return; }
      if (event.target.closest('[data-open-settings]')) { $('#settings-dialog').showModal(); return; }
      if (event.target.closest('[data-open-preferences]')) { applyPreferences(); $('#preferences-dialog').showModal(); return; }
      if (event.target.closest('[data-open-text-import]')) { $('#text-import-form').reset(); $('#text-appointment-date').value = localDate(new Date()); $('#text-appointment-time').value = '10:00'; $('#text-import-dialog').showModal(); $('#text-message-input').focus(); return; }
      if (event.target.closest('[data-delete-event]')) {
        const id = event.target.closest('[data-delete-event]').dataset.deleteEvent;
        events = events.filter(item => String(item.id) !== id); store.write('events', events); renderAgenda(); renderCalendar(); toast('Event removed.'); return;
      }
      if (event.target.closest('[data-toggle-special]')) {
        const id = event.target.closest('[data-toggle-special]').dataset.toggleSpecial;
        const item = events.find(entry => String(entry.id) === id);
        if (item) item.special = !item.special;
        store.write('events', events); renderCalendar(); return;
      }
      if (event.target.closest('#close-syllabus-dialog, #cancel-syllabus-import')) { closeSyllabusDialog(); return; }
      if (event.target.closest('#close-event-details, #event-details-done')) { $('#event-details-dialog').close(); return; }
      if (event.target.closest('#event-details-delete')) {
        const id = event.target.closest('#event-details-delete').dataset.eventId;
        events = events.filter(item => String(item.id) !== id); store.write('events', events);
        renderAgenda(); renderCalendar(); $('#event-details-dialog').close(); toast('Event removed.'); return;
      }
      if (event.target.closest('#add-syllabus-events')) {
        const selected = syllabusCandidates.filter(item => item.selected && item.title && item.date);
        for (const item of selected) events.push({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, title: item.title, date: item.date, time: item.time || '09:00', duration: Number(item.duration) || 60, source: `Syllabus · ${syllabusFileName}`, color: item.special ? 'blue' : 'green', notes: item.sourceLine, kind: item.kind || 'class', special: Boolean(item.special) });
        store.write('events', events); renderAgenda(); renderCalendar();
        closeSyllabusDialog(); toast(`${selected.length} syllabus event(s) added to the calendar.`); return;
      }
      const connect = event.target.closest('[data-connect]'); if (connect) { toast(connect.dataset.connect === 'google' ? 'Google sign-in is not configured. OAuth setup is required; no account data was accessed.' : 'Microsoft sign-in is not configured. OAuth setup is required; no account data was accessed.'); return; }
      const approve = event.target.closest('[data-approve]'); if (approve) { approveSuggestion(approve.dataset.approve); return; }
      const review = event.target.closest('[data-review-suggestion]'); if (review) { navigate('inbox'); return; }
      const dismiss = event.target.closest('[data-dismiss]'); if (dismiss) { suggestions = suggestions.filter(item => item.id !== dismiss.dataset.dismiss); store.write('suggestions', suggestions); renderSuggestions(); toast('Suggestion dismissed.'); return; }
      const toggle = event.target.closest('[data-toggle-reminder]'); if (toggle) { const item = reminders.find(reminder => reminder.id === toggle.dataset.toggleReminder); if (item) item.done = !item.done; store.write('reminders', reminders); renderReminders(); return; }
      const filter = event.target.closest('[data-filter]'); if (filter) { reminderFilter = filter.dataset.filter; $$('.reminder-tab').forEach(tab => tab.classList.toggle('selected', tab === filter)); renderReminders(); return; }
      const hint = event.target.closest('[data-prompt]'); if (hint) { $('#planner-input').value = hint.dataset.prompt; handlePlanner(); return; }
    });
    document.addEventListener('pointerdown', event => {
      const grip = event.target.closest('[data-resize-event]');
      if (!grip || event.button !== 0) return;
      const item = events.find(entry => String(entry.id) === grip.dataset.resizeEvent);
      const card = grip.closest('.calendar-event');
      if (!item || !card) return;
      activeResize = { id: item.id, startY: event.screenY, startDuration: Number(item.duration) || 60, initialHeight: card.getBoundingClientRect().height, card, delta: 0 };
      event.preventDefault();
      grip.setPointerCapture?.(event.pointerId);
    });
    document.addEventListener('pointermove', event => {
      if (!activeResize) return;
      activeResize.delta = Math.round((event.screenY - activeResize.startY) / 15) * 15;
      const body = activeResize.card.closest('.day-body');
      const maxHeight = body ? body.clientHeight - activeResize.card.offsetTop : 1440;
      activeResize.card.style.height = `${Math.max(23, Math.min(maxHeight, activeResize.initialHeight + activeResize.delta))}px`;
    });
    const finishResize = () => {
      if (!activeResize) return;
      const { id, startDuration, delta } = activeResize;
      activeResize = null;
      if (delta) { updateEventDuration(id, startDuration + delta); toast('Event duration updated in 15-minute increments.'); }
      else renderCalendar();
    };
    document.addEventListener('pointerup', finishResize);
    document.addEventListener('pointercancel', finishResize);
    document.addEventListener('keydown', event => {
      const grip = event.target.closest('[data-resize-event]');
      if (!grip || !['ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      const item = events.find(entry => String(entry.id) === grip.dataset.resizeEvent);
      if (item) { updateEventDuration(item.id, (Number(item.duration) || 60) + (event.key === 'ArrowDown' ? 15 : -15)); toast('Event duration updated by 15 minutes.'); }
    });
    $('#planner-submit').addEventListener('click', handlePlanner);
    $('#planner-input').addEventListener('keydown', event => { if (event.key === 'Enter') handlePlanner(); });
    $('#calendar-search').addEventListener('input', event => { calendarSearch = event.currentTarget.value; renderCalendar(); });
    $('#show-special-events').addEventListener('change', event => { showSpecialEvents = event.currentTarget.checked; renderCalendar(); });
    $('#syllabus-file').addEventListener('change', event => { const [file] = event.currentTarget.files; if (file) scanSyllabus(file); });
    $('#syllabus-candidates').addEventListener('input', event => {
      const input = event.target;
      const index = Number(input.dataset.candidateTitle ?? input.dataset.candidateDate ?? input.dataset.candidateTime);
      if (!Number.isInteger(index) || !syllabusCandidates[index]) return;
      if (input.matches('[data-candidate-title]')) syllabusCandidates[index].title = input.value;
      else if (input.matches('[data-candidate-date]')) syllabusCandidates[index].date = input.value;
      else if (input.matches('[data-candidate-time]')) syllabusCandidates[index].time = input.value;
    });
    $('#syllabus-candidates').addEventListener('change', event => {
      const input = event.target;
      const index = Number(input.dataset.candidateSelected ?? input.dataset.candidateSpecial);
      if (!Number.isInteger(index) || !syllabusCandidates[index]) return;
      if (input.matches('[data-candidate-selected]')) syllabusCandidates[index].selected = input.checked;
      if (input.matches('[data-candidate-special]')) syllabusCandidates[index].special = input.checked;
      renderSyllabusCandidates();
    });
    $('#new-event-button').addEventListener('click', () => openEventDialog());
    $('#calendar-new-event').addEventListener('click', () => openEventDialog());
    $('#event-duration').addEventListener('change', syncCustomDuration);
    $('#event-kind').addEventListener('change', event => { $('#event-priority').value = defaultPriorityForKind(event.currentTarget.value); });
    $('#event-form').addEventListener('submit', event => {
      event.preventDefault();
      if (event.submitter?.value === 'cancel') { $('#event-dialog').close(); return; }
      const form = new FormData(event.currentTarget);
      const duration = form.get('duration') === 'custom' ? Number(form.get('customDurationHours')) * 60 : Number(form.get('duration'));
      const kind = form.get('kind') || 'event';
      createEvent(form.get('title').trim(), form.get('date'), form.get('time'), duration, 'Personal', 'green', form.get('notes').trim(), kind, false, form.get('priority'));
      $('#event-dialog').close(); toast('Your event is on the calendar.');
    });
    $('#text-import-form').addEventListener('submit', event => {
      event.preventDefault();
      suggestions.unshift({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        title: $('#text-appointment-title').value.trim(),
        source: 'Phone text',
        sender: $('#text-sender-input').value.trim() || 'Imported message',
        detail: $('#text-message-input').value.trim(),
        date: $('#text-appointment-date').value,
        time: $('#text-appointment-time').value,
        duration: 60,
        provider: 'messages'
      });
      store.write('suggestions', suggestions);
      renderSuggestions();
      renderCalendar();
      $('#text-import-dialog').close();
      toast('Text saved as a draft. Review it in Suggestions before adding it.');
    });
    $('#previous-week').addEventListener('click', () => { currentWeek.setDate(currentWeek.getDate() - 7); renderCalendar(); });
    $('#next-week').addEventListener('click', () => { currentWeek.setDate(currentWeek.getDate() + 7); renderCalendar(); });
    $('#today-button').addEventListener('click', () => { currentWeek = new Date(); currentWeek.setHours(0, 0, 0, 0); currentWeek.setDate(currentWeek.getDate() - ((currentWeek.getDay() - Number(preferences.weekStartsOn || 0) + 7) % 7)); renderCalendar(); });
    $('#new-reminder-button').addEventListener('click', () => { $('#reminder-form').reset(); $('#reminder-date').value = localDate(new Date()); $('#reminder-dialog').showModal(); });
    $('#reminder-form').addEventListener('submit', event => {
      event.preventDefault();
      reminders.unshift({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), title: $('#reminder-title').value.trim(), date: $('#reminder-date').value, source: $('#reminder-source').value, done: false });
      store.write('reminders', reminders);
      renderReminders();
      $('#reminder-dialog').close();
      toast('Reminder saved. One less thing to hold in your head.');
    });
    $('#preferences-form').addEventListener('submit', event => {
      event.preventDefault();
      preferences = {
        name: $('#profile-name-input').value.trim() || 'Carmen',
        weekStartsOn: Number($('#week-start-input').value),
        food: $('#diet-input').value.trim(),
        favorites: $('#favorites-input').value.split(',').map(name => name.trim()).filter(Boolean),
        watch: $$('input[name="watch"]:checked').map(input => input.value)
      };
      store.write('preferences', preferences);
      currentWeek = new Date(); currentWeek.setHours(0, 0, 0, 0);
      currentWeek.setDate(currentWeek.getDate() - ((currentWeek.getDay() - preferences.weekStartsOn + 7) % 7));
      applyPreferences(); renderCalendar(); $('#preferences-dialog').close(); toast('Your calendar is personalized.');
    });
    $('#add-buffer').addEventListener('click', () => { const now = new Date(); now.setHours(now.getHours() + 1, 0, 0, 0); const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`; createEvent('Breathing room', localDate(new Date()), time, 15, 'Personal', 'green'); toast('A 15-minute buffer was added for later today.'); });
    window.addEventListener('hashchange', () => navigate(location.hash.slice(1)));
    $('#event-dialog').addEventListener('click', event => {
      if (event.target.closest('button[value="cancel"]')) { event.preventDefault(); event.currentTarget.close(); return; }
      if (event.target === event.currentTarget) event.currentTarget.close();
    });
    $('#settings-dialog').addEventListener('click', event => { if (event.target === event.currentTarget) event.currentTarget.close(); });
    $('#text-import-dialog').addEventListener('click', event => { if (event.target === event.currentTarget) event.currentTarget.close(); });
    $('#syllabus-dialog').addEventListener('click', event => { if (event.target === event.currentTarget) closeSyllabusDialog(); });
    $('#event-details-dialog').addEventListener('click', event => { if (event.target === event.currentTarget) event.currentTarget.close(); });
    $('#reminder-dialog').addEventListener('click', event => { if (event.target === event.currentTarget) event.currentTarget.close(); });
  }
  function applyPreferences() {
    const name = preferences.name || 'Carmen';
    $$('.profile-name').forEach(node => { node.textContent = name; });
    $$('.avatar').forEach(node => { node.textContent = name.trim().charAt(0).toUpperCase() || 'C'; });
    $('#profile-name-input').value = preferences.name || '';
    $('#week-start-input').value = String(preferences.weekStartsOn ?? 0);
    $('#diet-input').value = preferences.food || '';
    $('#favorites-input').value = (preferences.favorites || []).join(', ');
    $$('input[name="watch"]').forEach(input => { input.checked = (preferences.watch || []).includes(input.value); });
  }
  updateDateLabels(); applyPreferences(); bindEvents(); renderAll();
})();
