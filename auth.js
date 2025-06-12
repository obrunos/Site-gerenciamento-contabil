// 1) Bloqueia acesso direto ao dashboard sem login
if (location.pathname.endsWith('dashboard.html') 
    && localStorage.getItem('logado') !== 'true') {
  location.href = 'index.html';
}

// 2) Se estivermos na tela de login, configura o listener de submit
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  // Ajuste aqui para seu usuário/senha preferidos:
  const USUARIO = 'bruno';
  const SENHA    = 'senha123';

  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    if (u === USUARIO && p === SENHA) {
      localStorage.setItem('logado', 'true');
      location.href = 'dashboard.html';
    } else {
      alert('Credenciais inválidas');
    }
  });
}
