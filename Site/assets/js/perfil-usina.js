(function () {
  if (document.body.dataset.profileKind !== 'usina') return;

  function notify(message) {
    if (window.showToast) window.showToast(message);
  }

  function applyValuesToSection(sectionKey, values) {
    const section = profileData?.usina?.sections?.[sectionKey];
    if (!section) return;
    section.fields.forEach((field) => {
      const key = field[4];
      if (key) field[2] = values[key] ?? (field[1] === 'checkbox' ? false : '');
    });
  }

  function refreshVisible() {
    const sectionKey = document.querySelector('[data-profile-section].active')?.dataset.profileSection || 'gerais';
    if (typeof renderProfileSection === 'function') renderProfileSection(sectionKey);
  }

  function certArrayToValues(certificacoes) {
    const values = {};
    (profileData?.usina?.sections?.certificacoes?.fields || []).forEach((field) => {
      if (field[4]) values[field[4]] = (certificacoes || []).includes(field[0]);
    });
    return values;
  }

  function applyPerfil(perfil) {
    const flat = { ...perfil, ...(perfil.endereco || {}) };
    applyValuesToSection('gerais', flat);
    applyValuesToSection('contato', flat);
    applyValuesToSection('endereco', flat);
    applyValuesToSection('producao', flat);
    applyValuesToSection('certificacoes', certArrayToValues(perfil.certificacoes));
    applyValuesToSection('notificacoes', perfil.notificacoes || {});
  }

  async function loadPerfil() {
    try {
      const perfil = await window.UsinaLinkApi.get('/usinas/perfil');
      applyPerfil(perfil);
      refreshVisible();
    } catch (error) {
      notify('Não foi possível carregar os dados do perfil: ' + error.message);
    }
  }

  function readFormValues(form) {
    const values = {};
    form.querySelectorAll('[name]').forEach((input) => {
      values[input.name] = input.type === 'checkbox' ? input.checked : input.value;
    });
    return values;
  }

  function buildNotificacoesPayload(values) {
    const notificacoes = {};
    profileData.usina.sections.notificacoes.fields.forEach((field) => {
      if (field[4]) notificacoes[field[4]] = !!values[field[4]];
    });
    return { notificacoes };
  }

  function buildCertificacoesPayload(values) {
    const certificacoes = profileData.usina.sections.certificacoes.fields
      .filter((field) => field[4] && values[field[4]])
      .map((field) => field[0]);
    return { certificacoes };
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
      } else if (sectionKey === 'gerais' || sectionKey === 'contato' || sectionKey === 'endereco' || sectionKey === 'producao') {
        const atualizado = await window.UsinaLinkApi.patch('/usinas/perfil', values);
        applyPerfil(atualizado);
        notify('Perfil atualizado com sucesso.');
      } else if (sectionKey === 'certificacoes') {
        const atualizado = await window.UsinaLinkApi.patch('/usinas/perfil', buildCertificacoesPayload(values));
        applyPerfil(atualizado);
        notify('Certificações atualizadas com sucesso.');
      } else if (sectionKey === 'notificacoes') {
        const atualizado = await window.UsinaLinkApi.patch('/usinas/perfil', buildNotificacoesPayload(values));
        applyPerfil(atualizado);
        notify('Preferências de notificação salvas.');
      } else {
        notify('Alterações salvas.');
      }
      refreshVisible();
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
