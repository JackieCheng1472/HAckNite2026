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
  let connections = store.read('connections', {});
  let preferences = store.read('preferences', { name: 'Carmen', weekStartsOn: 0, food: '', favorites: [], watch: ['food', 'birthday', 'holiday', 'family'] });
  let currentWeek = new Date(); currentWeek.setHours(0, 0, 0, 0); currentWeek.setDate(currentWeek.getDate() - ((currentWeek.getDay() - Number(preferences.weekStartsOn || 0) + 7) % 7));
  let reminderFilter = 'all';
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
  function renderSuggestions() {
    const visibleSuggestions = suggestions.filter(isSuggestionVisible);
    $('#suggestion-count').textContent = visibleSuggestions.length;
    const preview = visibleSuggestions.slice(0, 2);
    $('#suggestion-list').innerHTML = preview.length ? preview.map(suggestion => `<div class="suggestion-mini"><i class="source-dot ${suggestion.provider}" aria-hidden="true"></i><div class="suggestion-mini-copy"><strong>${escapeHtml(suggestion.title)}</strong><span>${escapeHtml(suggestion.source)} · ${prettyDate(suggestion.date)}</span></div><button class="mini-add" data-approve="${suggestion.id}" aria-label="Add ${escapeHtml(suggestion.title)}">＋ Add</button></div>`).join('') : '<div class="empty-agenda">All caught up. Nothing needs your attention.</div>';
    $('#inbox-suggestions').innerHTML = visibleSuggestions.length ? visibleSuggestions.map(suggestion => `<article class="inbox-card"><div class="inbox-card-icon ${suggestion.provider}">${suggestion.provider === 'google' ? '✉' : (suggestion.provider === 'contacts' ? '♡' : '▣')}</div><div class="inbox-card-body"><div class="inbox-card-top"><strong>${escapeHtml(suggestion.title)}</strong><span>${escapeHtml(suggestion.source)}</span></div><p>${escapeHtml(suggestion.detail)}${suggestion.kind === 'food' && preferences.food ? ` · Preference: ${escapeHtml(preferences.food)}` : ''}</p><div class="inbox-event-meta"><span>◷ ${suggestion.allDay ? 'All day · ' : ''}${prettyDate(suggestion.date)}${suggestion.allDay ? '' : `, ${formatTime(suggestion.time)}`}</span><span>${suggestion.kind ? escapeHtml(suggestion.kind) : `${suggestion.duration} min`}</span><span>From ${escapeHtml(suggestion.sender)}</span></div></div><div class="inbox-actions"><button class="dismiss-button" data-dismiss="${suggestion.id}">Dismiss</button><button class="approve-button" data-approve="${suggestion.id}">Add to calendar</button></div></article>`).join('') : '<div class="card reminder-empty">No matching suggestions. Adjust your personal filters to see more.</div>';
  }
  function renderCalendar() {
    const days = Array.from({ length: 7 }, (_, index) => { const d = new Date(currentWeek); d.setDate(d.getDate() + index); return d; });
    const first = days[0]; const last = days[6];
    $('#week-label').textContent = first.getMonth() === last.getMonth() ? first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : `${first.toLocaleDateString('en-US', { month: 'short' })} – ${last.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    const startHour = 7; const endHour = 22; const hourHeight = 60;
    const hours = Array.from({ length: endHour - startHour }, (_, index) => index + startHour);
    const headers = `<div class="time-column"><div class="time-head"></div><div class="all-day-row">All day</div>${hours.map(hour => `<div class="time-label">${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}</div>`).join('')}</div>`;
    const columns = days.map(day => {
      const dayId = localDate(day); const isToday = dayId === localDate(new Date());
      const dayEvents = events.filter(item => item.date === dayId);
      const dayDrafts = suggestions.filter(item => item.date === dayId && isSuggestionVisible(item)).map(item => ({ ...item, isDraft: true }));
      const allDay = [...dayEvents, ...dayDrafts].filter(item => item.allDay).map(item => `<div class="all-day-pill ${item.isDraft ? 'calendar-draft' : ''}" ${item.isDraft ? `data-review-suggestion="${item.id}"` : ''}>${escapeHtml(item.title)}</div>`).join('');
      const timedEvents = [...dayEvents.filter(item => !item.allDay), ...dayDrafts.filter(item => !item.allDay)].sort((a, b) => a.time.localeCompare(b.time));
      const lanes = [];
      const cards = timedEvents.map(item => {
        const [hour, minute] = item.time.split(':').map(Number);
        const start = hour * 60 + minute;
        let lane = lanes.findIndex(end => end <= start);
        if (lane < 0) lane = lanes.length;
        lanes[lane] = start + Number(item.duration || 60);
        const laneCount = Math.max(1, lanes.length);
        const kind = item.kind || (item.title.toLowerCase().includes('class') ? 'class' : (item.color === 'peach' ? 'appointment' : (item.color === 'blue' ? 'focus' : 'event')));
        const top = Math.max(0, (start - startHour * 60) * hourHeight / 60);
        const height = Math.max(23, Number(item.duration || 60) * hourHeight / 60 - 3);
        const left = 3 + lane * (94 / laneCount); const width = 94 / laneCount;
        const favorite = (preferences.favorites || []).some(name => `${item.title} ${item.sender || ''}`.toLowerCase().includes(name.toLowerCase()));
        return `<div class="calendar-event kind-${kind} ${item.isDraft ? 'calendar-draft' : ''} ${favorite ? 'favorite-event' : ''}" style="top:${top}px;height:${height}px;left:${left}%;width:${width}%" ${item.isDraft ? `data-review-suggestion="${item.id}"` : ''}><strong>${escapeHtml(item.title)}</strong><span>${item.isDraft ? 'Draft · ' : ''}${formatTime(item.time)}${item.source ? ` · ${escapeHtml(item.source)}` : ''}</span></div>`;
      }).join('');
      return `<div class="day-column"><div class="day-head ${isToday ? 'is-today' : ''}">${day.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}<strong>${day.getDate()}</strong></div><div class="all-day-row">${allDay}</div><div class="day-body" style="height:${hours.length * hourHeight}px">${cards}</div></div>`;
    }).join('');
    $('#week-calendar').innerHTML = headers + columns;
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
      const connected = Boolean(connections[provider]);
      const label = provider === 'google' ? 'Gmail' : 'Outlook';
      $(`#${provider === 'google' ? 'gmail' : 'outlook'}-status`).textContent = connected ? 'Demo connected' : 'Not connected';
      $$(`[data-connect="${provider}"]`).forEach(button => { button.textContent = connected ? 'Disconnect' : (button.classList.contains('provider-connect') ? 'Connect account' : 'Connect'); button.classList.toggle('is-connected', connected); });
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
    $('#event-form').reset(); $('#event-title').value = title; $('#event-date').value = date; $('#event-time').value = time; $('#event-notes').value = notes; $('#event-duration').value = '60'; $('#event-dialog').showModal(); $('#event-title').focus();
  }
  function createEvent(title, date, time, duration = 60, source = 'Personal', color = 'green', notes = '', kind = 'event', allDay = false) {
    events.push({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), title, date, time, duration: Number(duration), source, color, notes, kind, allDay });
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
    createEvent(suggestion.title, suggestion.date, suggestion.time, suggestion.duration, suggestion.source, 'green', suggestion.detail, suggestion.kind || 'event', Boolean(suggestion.allDay));
    suggestions = suggestions.filter(item => item.id !== id); store.write('suggestions', suggestions); renderSuggestions(); toast(`“${suggestion.title}” added to your calendar.`);
  }
  function bindEvents() {
    document.addEventListener('click', event => {
      const nav = event.target.closest('[data-view]'); if (nav) { event.preventDefault(); navigate(nav.dataset.view); return; }
      const viewLink = event.target.closest('[data-view-link]'); if (viewLink) { navigate(viewLink.dataset.viewLink); return; }
      if (event.target.closest('[data-open-settings]')) { $('#settings-dialog').showModal(); return; }
      if (event.target.closest('[data-open-preferences]')) { applyPreferences(); $('#preferences-dialog').showModal(); return; }
      const connect = event.target.closest('[data-connect]'); if (connect) { const provider = connect.dataset.connect; connections[provider] = !connections[provider]; store.write('connections', connections); renderConnections(); toast(connections[provider] ? 'Demo connection enabled. OAuth setup is needed for real account access.' : 'Demo connection disconnected.'); return; }
      const approve = event.target.closest('[data-approve]'); if (approve) { approveSuggestion(approve.dataset.approve); return; }
      const review = event.target.closest('[data-review-suggestion]'); if (review) { navigate('inbox'); return; }
      const dismiss = event.target.closest('[data-dismiss]'); if (dismiss) { suggestions = suggestions.filter(item => item.id !== dismiss.dataset.dismiss); store.write('suggestions', suggestions); renderSuggestions(); toast('Suggestion dismissed.'); return; }
      const toggle = event.target.closest('[data-toggle-reminder]'); if (toggle) { const item = reminders.find(reminder => reminder.id === toggle.dataset.toggleReminder); if (item) item.done = !item.done; store.write('reminders', reminders); renderReminders(); return; }
      const filter = event.target.closest('[data-filter]'); if (filter) { reminderFilter = filter.dataset.filter; $$('.reminder-tab').forEach(tab => tab.classList.toggle('selected', tab === filter)); renderReminders(); return; }
      const hint = event.target.closest('[data-prompt]'); if (hint) { $('#planner-input').value = hint.dataset.prompt; handlePlanner(); return; }
    });
    $('#planner-submit').addEventListener('click', handlePlanner);
    $('#planner-input').addEventListener('keydown', event => { if (event.key === 'Enter') handlePlanner(); });
    $('#new-event-button').addEventListener('click', () => openEventDialog());
    $('#calendar-new-event').addEventListener('click', () => openEventDialog());
    $('#event-form').addEventListener('submit', event => {
      event.preventDefault(); const form = new FormData(event.currentTarget); createEvent(form.get('title').trim(), form.get('date'), form.get('time'), form.get('duration'), 'Personal', 'green', form.get('notes').trim(), form.get('kind') || 'event');
      $('#event-dialog').close(); toast('Your event is on the calendar.');
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
    $('#event-dialog').addEventListener('click', event => { if (event.target === event.currentTarget) event.currentTarget.close(); });
    $('#settings-dialog').addEventListener('click', event => { if (event.target === event.currentTarget) event.currentTarget.close(); });
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
