(function() {
  const AUTH = { user: 'admin', pass: 'senha123' };
  let currentDate  = new Date();
  let currentMonth = currentDate.getMonth();
  let currentYear  = currentDate.getFullYear();

  const content    = document.querySelector('.content');
  const NAV        = {
    dashboard: document.getElementById('navDashboard'),
    clients:   document.getElementById('navClients'),
    tasks:     document.getElementById('navTasks'),
    calendar:  document.getElementById('navCalendar')
  };
  const LOGOUT_BTN = document.getElementById('logoutBtn');
  const PAGE_TITLE = document.getElementById('pageTitle');

  let clients = JSON.parse(localStorage.getItem('clients') || '[]');
  clients = clients.map(c => ({ ...c, active: c.active !== false }));

  const OBR = {
    MEI: ['DAS Mensal', 'DASN-SIMEI Anual'],
    Simples: ['DAS Mensal', 'PGDAS-D', 'DEFIS Anual', 'SPED Contribuições'],
    Presumido: ['IRPJ Trimestral', 'CSLL Trimestral', 'DCTF Mensal', 'SPED Contribuições']
  };

  function save() {
    localStorage.setItem('clients', JSON.stringify(clients));
  }
  function setActiveNav(key) {
    Object.entries(NAV).forEach(([k, el]) =>
      el.classList.toggle('active', k === key)
    );
  }

  // Dashboard
  function renderDashboard() {
    setActiveNav('dashboard');
    PAGE_TITLE.innerText = 'Dashboard';
    const totCli  = clients.filter(c => c.active).length;
    const totTask = clients.filter(c => c.active)
                           .reduce((sum, c) => sum + (c.tasks?.length || 0), 0);
    document.getElementById('totalClients').innerText = totCli;
    document.getElementById('totalTasks').innerText   = totTask;
  }

  // Clientes
  function renderClients() {
    setActiveNav('clients');
    PAGE_TITLE.innerText = 'Clientes';
    let html = `<div class="card"><h2>Adicionar Cliente</h2>
      <form id="form-client">
        <input type="text" id="client-name" placeholder="Nome do cliente" required>
        <input type="text" id="client-cnpj" placeholder="CNPJ/CPF">
        <select id="client-regime" required>
          <option value="">Selecione regime</option>
          <option value="MEI">MEI</option>
          <option value="Simples">Simples Nacional</option>
          <option value="Presumido">Lucro Presumido</option>
        </select>
        <button type="submit">Salvar Cliente</button>
      </form>
    </div>`;
    if (clients.length) {
      html += `<div class="card"><h2>Lista de Clientes</h2><ul>`;
      clients.forEach((c, i) => {
        html += `<li>
          <strong>${c.nome} (${c.regime})</strong>
          <label>Ativo <input type="checkbox" data-action="toggle-active" data-idx="${i}" ${c.active ? 'checked' : ''}></label>
          <button data-action="delete-client" data-idx="${i}">Excluir</button>
        </li>`;
      });
      html += `</ul></div>`;
    }
    content.innerHTML = html;

    document.getElementById('form-client').addEventListener('submit', e => {
      e.preventDefault();
      const name   = document.getElementById('client-name').value;
      const cnpj   = document.getElementById('client-cnpj').value;
      const regime = document.getElementById('client-regime').value;
      clients.push({ nome: name, cnpj, regime, tasks: [], active: true });
      save(); renderClients();
    });

    content.querySelectorAll('[data-action="toggle-active"]').forEach(ch => {
      ch.addEventListener('change', e => {
        clients[e.target.dataset.idx].active = e.target.checked;
        save(); renderClients();
      });
    });
    content.querySelectorAll('[data-action="delete-client"]').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = e.target.dataset.idx;
        const pwd = prompt('Digite a senha para excluir:');
        if (pwd === AUTH.pass) {
          clients.splice(idx, 1);
          save(); renderClients();
        } else alert('Senha incorreta');
      });
    });
  }

  // Tarefas
  function renderTasks() {
    setActiveNav('tasks');
    PAGE_TITLE.innerText = 'Tarefas';
    let html = `<div class="card"><h2>Gerenciar Tarefas</h2></div>`;

    clients.filter(c => c.active).forEach((c, idx) => {
      html += `<div class="card"><h3>${c.nome}</h3><ul>`;
      // marca quais obrigações padrão já foram vistas
      const seen = [];
      // obrigações padrão
      OBR[c.regime].forEach(ob => {
        seen.push(ob);
        let t = c.tasks.find(t => t.ob === ob);
        if (!t) {
          t = { ob, date: '', note: '', done: false, recurring: false };
          c.tasks.push(t);
        }
        html += `<li>
          <label><input type="checkbox" data-client="${idx}" data-ob="${t.ob}" ${t.done?'checked':''}> ${t.ob}</label>
          <input type="date" data-client="${idx}" data-ob-date="${t.ob}" value="${t.date}">
          <input type="text" data-client="${idx}" data-ob-note="${t.ob}" placeholder="Anotações…" value="${t.note}">
          <label><input type="checkbox" data-client="${idx}" data-ob-rec="${t.ob}" ${t.recurring?'checked':''}> Recorrente</label>
          <button data-action="del-task" data-client="${idx}" data-ob="${t.ob}">Excluir</button>
        </li>`;
      });
      // tarefas customizadas
      c.tasks.filter(t => !seen.includes(t.ob)).forEach(t => {
        html += `<li>
          <label><input type="checkbox" data-client="${idx}" data-ob="${t.ob}" ${t.done?'checked':''}> ${t.ob}</label>
          <input type="date" data-client="${idx}" data-ob-date="${t.ob}" value="${t.date}">
          <input type="text" data-client="${idx}" data-ob-note="${t.ob}" placeholder="Anotações…" value="${t.note}">
          <label><input type="checkbox" data-client="${idx}" data-ob-rec="${t.ob}" ${t.recurring?'checked':''}> Recorrente</label>
          <button data-action="del-task" data-client="${idx}" data-ob="${t.ob}">Excluir</button>
        </li>`;
      });
      html += `</ul></div>`;
    });

    html += `<div class="card"><h2>Nova Obrigação</h2>
      <form id="form-new-task">
        <select id="new-task-client" required>
          <option value="">Selecione cliente</option>
          ${clients.filter(c => c.active).map((c,i) => `<option value="${i}">${c.nome}</option>`).join('')}
        </select>
        <input type="text" id="new-task-name" placeholder="Nome da obrigação" required>
        <input type="date" id="new-task-date" required>
        <input type="text" id="new-task-note" placeholder="Anotações…">
        <label><input type="checkbox" id="new-task-rec"> Recorrente</label>
        <button type="submit">Salvar</button>
      </form>
    </div>
    <button id="save-tasks-btn">Salvar Alterações</button>`;

    content.innerHTML = html;

    document.getElementById('form-new-task').addEventListener('submit', e => {
      e.preventDefault();
      const i   = document.getElementById('new-task-client').value;
      const ob  = document.getElementById('new-task-name').value;
      const dt  = document.getElementById('new-task-date').value;
      const nt  = document.getElementById('new-task-note').value;
      const rc  = document.getElementById('new-task-rec').checked;
      clients[i].tasks.push({ ob, date: dt, note: nt, done: false, recurring: rc });
      save(); renderTasks();
    });
    document.getElementById('save-tasks-btn').addEventListener('click', saveTasks);
    content.querySelectorAll('[data-action="del-task"]').forEach(btn => {
      btn.addEventListener('click', e => {
        const ci = e.target.dataset.client;
        const ob = e.target.dataset.ob;
        clients[ci].tasks = clients[ci].tasks.filter(t => t.ob !== ob);
        save(); renderTasks();
      });
    });
  }

  function saveTasks() {
    content.querySelectorAll('input[data-ob]').forEach(el => {
      const ci = el.dataset.client, ob = el.dataset.ob;
      const t  = clients[ci].tasks.find(x => x.ob === ob);
      t.done = el.checked;
      if (t.done && t.recurring) {
        const dateVal = el.closest('li').querySelector('input[type="date"]').value;
        const d = new Date(dateVal);
        d.setMonth(d.getMonth()+1);
        clients[ci].tasks.push({
          ob,
          date: d.toISOString().slice(0,10),
          note: '',
          done: false,
          recurring: true
        });
      }
    });
    content.querySelectorAll('input[data-ob-date]').forEach(el => {
      const ci = el.dataset.client, ob = el.dataset.obDate;
      clients[ci].tasks.find(x => x.ob === ob).date = el.value;
    });
    content.querySelectorAll('input[data-ob-note]').forEach(el => {
      const ci = el.dataset.client, ob = el.dataset.obNote;
      clients[ci].tasks.find(x => x.ob === ob).note = el.value;
    });
    content.querySelectorAll('input[data-ob-rec]').forEach(el => {
      const ci = el.dataset.client, ob = el.dataset.obRec;
      clients[ci].tasks.find(x => x.ob === ob).recurring = el.checked;
    });
    save();
    alert('Tarefas atualizadas!');
    renderTasks();
  }

  // Calendário
  function renderCalendar() {
    setActiveNav('calendar');
    PAGE_TITLE.innerText = 'Calendário';
    const firstDay    = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth+1, 0).getDate();
    let html = `<div class="card"><div class="calendar-nav">
      <button id="prevMonth">&#8592;</button>
      <div class="month-year">${new Date(currentYear, currentMonth)
        .toLocaleString('pt-BR',{month:'long',year:'numeric'})}</div>
      <button id="nextMonth">&#8594;</button>
    </div></div><div class="calendar">`;
    ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].forEach(d => html += `<div class="calendar-day"><strong>${d}</strong></div>`);
    for (let i = 0; i < firstDay; i++) html += '<div class="calendar-day"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      html += `<div class="calendar-day"><div class="date">${d}</div>`;
      clients.filter(c => c.active).forEach(c => {
        c.tasks.forEach(t => {
          if (t.date === dayStr) {
            html += `<div class="calendar-event">${c.nome}: ${t.ob}</div>`;
          }
        });
      });
      html += '</div>';
    }
    html += '</div>';
    content.innerHTML = html;
    document.getElementById('prevMonth').onclick = () => {
      currentMonth--; if (currentMonth < 0) { currentYear--; currentMonth = 11; }
      renderCalendar();
    };
    document.getElementById('nextMonth').onclick = () => {
      currentMonth++; if (currentMonth > 11) { currentYear++; currentMonth = 0; }
      renderCalendar();
    };
  }

  // Navegação e logout
  NAV.dashboard.addEventListener('click', e => { e.preventDefault(); renderDashboard(); });
  NAV.clients.addEventListener('click',   e => { e.preventDefault(); renderClients(); });
  NAV.tasks.addEventListener('click',     e => { e.preventDefault(); renderTasks(); });
  NAV.calendar.addEventListener('click',  e => { e.preventDefault(); renderCalendar(); });
  LOGOUT_BTN.addEventListener('click',    () => { localStorage.removeItem('logado'); location.href = 'index.html'; });

  // Inicialização
  renderDashboard();
})();
