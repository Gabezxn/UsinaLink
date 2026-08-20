(function () {
  if (document.body.dataset.profileKind !== 'empresa') return;

  function notify(message, type) {
    if (window.showToast) window.showToast(message);
  }

  function applyValuesToSection(sectionKey, values) {
    const section = profileData?.empresa?.sections?.[sectionKey];
    if (!section) return;
    section.fields.forEach((field) => {
      const key = field[4];
      if (key && values[key] !== undefined && values[key] !== null) field[2] = values[key];
    });
  }

  function refreshVisible() {
    const sectionKey = document.querySelector('[data-profile-section].active')?.dataset.profileSection || 'gerais';
    if (typeof renderProfileView === 'function') renderProfileView(sectionKey);
    if (!document.querySelector('#profile-dynamic-form').classList.contains('is-hidden') && typeof renderProfileSection === 'function') {
      renderProfileSection(sectionKey);
    }
  }

  async function loadPerfil() {
    try {
      const perfil = await window.UsinaLinkApi.get('/empresas/perfil');
      const flat = { ...perfil, ...(perfil.endereco || {}) };
      applyValuesToSection('gerais', flat);
      applyValuesToSection('contato', flat);
      applyValuesToSection('endereco', flat);
      refreshVisible();
    } catch (error) {
      notify('Não foi possível carregar os dados do perfil: ' + error.message, 'error');
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
        notify('Senha atualizada com sucesso.', 'success');
        form.reset();
      } else if (sectionKey === 'gerais' || sectionKey === 'contato' || sectionKey === 'endereco') {
        const atualizado = await window.UsinaLinkApi.patch('/empresas/perfil', values);
        const flat = { ...atualizado, ...(atualizado.endereco || {}) };
        applyValuesToSection('gerais', flat);
        applyValuesToSection('contato', flat);
        applyValuesToSection('endereco', flat);
        notify('Perfil atualizado com sucesso.', 'success');
      } else {
        notify('Alterações salvas.', 'success');
      }
      toggleProfileEdit(true);
    } catch (error) {
      notify(error.message, 'error');
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
