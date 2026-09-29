(function () {
  if (document.body.dataset.profileKind !== 'pessoa_fisica') return;

  function notify(message) {
    if (window.showToast) window.showToast(message);
  }

  function applyValuesToSection(sectionKey, values) {
    const section = profileData?.pessoa_fisica?.sections?.[sectionKey];
    if (!section) return;
    section.fields.forEach((field) => {
      const key = field[4];
      if (key) field[2] = values[key] ?? '';
    });
  }

  function refreshVisible() {
    const sectionKey = document.querySelector('[data-profile-section].active')?.dataset.profileSection || 'gerais';
    if (typeof renderProfileView === 'function') renderProfileView(sectionKey);
    if (!document.querySelector('#profile-dynamic-form').classList.contains('is-hidden') && typeof renderProfileSection === 'function') {
      renderProfileSection(sectionKey);
    }
  }

  function iniciais(nome) {
    return String(nome || 'PF').split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase() || 'PF';
  }

  function applyPerfil(perfil) {
    const cpf = typeof maskCpf === 'function' ? maskCpf(perfil.cpf || '') : perfil.cpf;
    const telefone = typeof maskPhone === 'function' ? maskPhone(perfil.telefone || '') : perfil.telefone;
    applyValuesToSection('gerais', { nome: perfil.nome, cpf });
    applyValuesToSection('contato', { email: perfil.email, telefone });
    const titulo = document.querySelector('.profile-head h1');
    if (titulo && perfil.nome) titulo.textContent = perfil.nome;
    const avatar = document.querySelector('[data-profile-avatar]');
    if (avatar) avatar.textContent = iniciais(perfil.nome);
  }

  async function loadPerfil() {
    try {
      applyPerfil(await window.UsinaLinkApi.get('/pessoas-fisicas/perfil'));
      refreshVisible();
    } catch (error) {
      notify('Não foi possível carregar os dados do perfil: ' + error.message);
    }
  }

  function readFormValues(form) {
    const values = {};
    form.querySelectorAll('[name]').forEach((input) => { values[input.name] = input.value; });
    return values;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const sectionKey = document.querySelector('[data-profile-section].active')?.dataset.profileSection || 'gerais';
    const values = readFormValues(form);
    const button = form.querySelector('button[type="submit"]');
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Salvando...';

    try {
      if (sectionKey === 'seguranca') {
        if (!values.novaSenha) throw new Error('Informe a nova senha.');
        if (values.novaSenha !== values.confirmarSenha) throw new Error('A nova senha e a confirmação não coincidem.');
        await window.UsinaLinkApi.patch('/usuarios/senha', values);
        notify('Senha atualizada com sucesso.');
        form.reset();
      } else {
        if (sectionKey === 'gerais' && !String(values.nome || '').trim()) throw new Error('Informe o nome completo.');
        if (sectionKey === 'contato' && values.email && typeof isValidEmail === 'function' && !isValidEmail(values.email)) throw new Error('Informe um e-mail válido.');
        const payload = sectionKey === 'gerais' ? { nome: values.nome } : { email: values.email, telefone: values.telefone };
        applyPerfil(await window.UsinaLinkApi.patch('/pessoas-fisicas/perfil', payload));
        // Mantem o nome exibido nas outras telas em dia.
        try {
          const session = JSON.parse(sessionStorage.getItem('usinalinkSession') || 'null');
          if (session && payload.nome) { session.nome = payload.nome; sessionStorage.setItem('usinalinkSession', JSON.stringify(session)); }
        } catch { /* sem sessao em sessionStorage */ }
        notify('Perfil atualizado com sucesso.');
      }
      toggleProfileEdit(true);
    } catch (error) {
      notify(error.message);
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  document.addEventListener('submit', (event) => {
    if (event.target.id === 'profile-dynamic-form') handleSubmit(event);
  });

  loadPerfil();
}());
