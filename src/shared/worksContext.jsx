import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getUnifiedWorks } from '../services/WorkService';
import { mapWorkToItem } from '../utils/mapWork';

/**
 * Carimbo de versão das obras do usuário. Cada tela do dashboard (Rankings,
 * Home, rodapé, perfil) busca as obras por conta própria e fica montada o
 * tempo todo (display:none). Sem isso, adicionar/editar/excluir uma obra numa
 * aba só aparecia nas outras depois de F5.
 *
 * Ponto de mutação chama `bumpWorks()`; quem exibe obras põe `worksVersion`
 * nas deps do useEffect que faz o fetch. Mesmo padrão do refresh das badges.
 *
 * A lista unificada (GET /works/unified) é buscada aqui, uma vez por versão, e
 * repartida pelo `useUnifiedItems`: antes cada tela que usava o hook fazia a
 * própria chamada.
 */
const WorksContext = createContext(null);

export function WorksProvider({ children }) {
  const [worksVersion, setWorksVersion] = useState(0);
  const bumpWorks = useCallback(() => setWorksVersion((v) => v + 1), []);
  // items: null = carregando
  const [unified, setUnified] = useState({ items: null, error: null });

  useEffect(() => {
    let active = true;
    getUnifiedWorks()
      .then((data) => {
        if (!active) return;
        const items = (Array.isArray(data) ? data : []).map((w) => ({
          ...mapWorkToItem(w),
          categoryName: w.categoryName,
          creator: (w.creator || '').trim(),
        }));
        setUnified({ items, error: null });
      })
      .catch((error) => {
        if (active) setUnified({ items: [], error });
      });
    return () => { active = false; };
  }, [worksVersion]);

  return (
    <WorksContext.Provider value={{ worksVersion, bumpWorks, unified }}>
      {children}
    </WorksContext.Provider>
  );
}

export function useWorks() {
  return useContext(WorksContext) ?? { worksVersion: 0, bumpWorks: () => {}, unified: { items: [], error: null } };
}
