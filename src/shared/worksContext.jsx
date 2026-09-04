import { createContext, useCallback, useContext, useState } from 'react';

/**
 * Carimbo de versão das obras do usuário. Cada tela do dashboard (Rankings,
 * Home, rodapé, perfil) busca as obras por conta própria e fica montada o
 * tempo todo (display:none). Sem isso, adicionar/editar/excluir uma obra numa
 * aba só aparecia nas outras depois de F5.
 *
 * Ponto de mutação chama `bumpWorks()`; quem exibe obras põe `worksVersion`
 * nas deps do useEffect que faz o fetch. Mesmo padrão do refresh das badges.
 */
const WorksContext = createContext(null);

export function WorksProvider({ children }) {
  const [worksVersion, setWorksVersion] = useState(0);
  const bumpWorks = useCallback(() => setWorksVersion((v) => v + 1), []);

  return (
    <WorksContext.Provider value={{ worksVersion, bumpWorks }}>
      {children}
    </WorksContext.Provider>
  );
}

export function useWorks() {
  return useContext(WorksContext) ?? { worksVersion: 0, bumpWorks: () => {} };
}
