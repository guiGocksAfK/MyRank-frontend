import api from './api';

/**
 * Tutorial pós-cadastro. Etapas no backend (users.onboarding_step):
 * TABLES → FIRST_WORK → DONE. Boas-vindas e tela final são só do front.
 */

/** Cria uma tabela por template escolhido (pelo menos um, sem "custom") e avança pra FIRST_WORK. */
export async function chooseOnboardingTables(templates) {
  const res = await api.post('/onboarding/tables', { templates });
  return res.data;
}

/** Marca DONE, tenha a pessoa cadastrado a primeira obra ou pulado. Repetir não dá erro. */
export async function finishOnboarding() {
  await api.post('/onboarding/finish');
}
