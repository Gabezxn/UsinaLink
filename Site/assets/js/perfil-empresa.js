(function () {
  if (document.body.dataset.profileKind !== 'empresa') return;

  function notify(message) {
    if (window.showToast) window.showToast(message);
  }

  function applyValuesToSection(sectionKey, values) {
    const section = profileData?.empresa?.sections?.[sectionKey];
    if (!section) return;
    section.fields.forEach((field) => {
      const key = field[4];
      if (key) field[2] = values[key] ?? (field[1] === 'checkbox' ? false : '');
    });
  }

  function refreshVisible() {
    const sectionKey = document.querySelector('[data-profile-section].active')?.dataset.profileSection || 'gerais';
    if (typeof renderProfileView === 'function') renderProfileView(sectionKey);
    if (!document.querySelector('#profile-dynamic-form').classList.contains('is-hidden') && typeof renderProfileSection === 'function') {
      renderProfileSection(sectionKey);
    }
  }

  function applyPerfil(perfil) {
    const flat = { ...perfil, ...(perfil.endereco || {}) };
    applyValuesToSection('gerais', flat);
    applyValuesToSection('contato', flat);
    applyValuesToSection('endereco', flat);
    applyValuesToSection('documentos', {
      cnpj: perfil.cnpj,
      inscricaoEstadual: perfil.inscricaoEstadual,
      certificacoes: perfil.certificacoes,
      contratoSocial: perfil.contratoSocialNome,
      alvara: perfil.alvaraNome,
    });
    applyValuesToSection('notificacoes', perfil.notificacoes || {});
  }

  async function loadPerfil() {
    try {
      const perfil = await window.UsinaLinkApi.get('/empresas/perfil');
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

  function readFile(input) {
    return new Promise((resolve, reject) => {
      const file = input.files?.[0];
      if (!file) { resolve(null); return; }
      const reader = new FileReader();
      reader.onload = () => resolve({ arquivo: reader.result, nome: file.name });
      reader.onerror = () => reject(new Error('Não foi possível ler o arquivo ' + file.name));
      reader.readAsDataURL(file);
    });
  }

  async function readFileFields(form) {
    const payload = {};
    const inputs = [...form.querySelectorAll('input[type="file"][data-file-key]')];
    for (const input of inputs) {
      const result = await readFile(input);
      if (result) {
        const key = input.dataset.fileKey;
        payload[`${key}Arquivo`] = result.arquivo;
        payload[`${key}Nome`] = result.nome;
      }
    }
    return payload;
  }

  function buildNotificacoesPayload(values) {
    const notificacoes = {};
    profileData.empresa.sections.notificacoes.fields.forEach((field) => {
      if (field[4]) notificacoes[field[4]] = !!values[field[4]];
    });
    return { notificacoes };
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
      } else if (sectionKey === 'gerais' || sectionKey === 'contato' || sectionKey === 'endereco') {
        const atualizado = await window.UsinaLinkApi.patch('/empresas/perfil', values);
        applyPerfil(atualizado);
        notify('Perfil atualizado com sucesso.');
      } else if (sectionKey === 'documentos') {
        const fileFields = await readFileFields(form);
        const payload = { inscricaoEstadual: values.inscricaoEstadual, certificacoes: values.certificacoes, ...fileFields };
        const atualizado = await window.UsinaLinkApi.patch('/empresas/perfil', payload);
        applyPerfil(atualizado);
        notify('Documentos atualizados com sucesso.');
      } else if (sectionKey === 'notificacoes') {
        const atualizado = await window.UsinaLinkApi.patch('/empresas/perfil', buildNotificacoesPayload(values));
        applyPerfil(atualizado);
        notify('Preferências de notificação salvas.');
      } else {
        notify('Alterações salvas.');
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
