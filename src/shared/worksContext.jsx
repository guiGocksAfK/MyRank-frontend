import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getUnifiedWorks } from '../services/WorkService';
import { getGroups } from '../services/masterTableGroupService';
import { mapWorkToItem } from '../utils/mapWork';

/**
 * Carimbo de versão das obras do usuário. Cada tela do dashboard (Rankings,
 * Home, rodapé, perfil) lê daqui e fica sincronizada quando alguém muta uma obra.
 *
 * Ponto de mutação chama `bumpWorks()`; o WorksProvider busca `/works/unified` e
 * `/master-table-groups` em paralelo uma vez por versão, compartilhando o
 * resultado entre Home, rodapé, Rankings, Criadores, IA e Perfil.
 */
const WorksContext = createContext(null);

export function WorksProvider({ children }) {
  const [worksVersion, setWorksVersion] = useState(0);
  // items: null = carregando; groups: null = carregando
  const [unified, setUnified] = useState({ items: null, error: null });
  const [groups, setGroups] = useState(null);
  const bumpWorks = useCallback(() => {
    setUnified((prev) => (prev.error ? { items: null, error: null } : prev));
    setWorksVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    let active = true;
    getUnifiedWorks()
      .then((data) => {
        if (!active) return;
        const items = (Array.isArray(data) ? data : []).map((w) => ({
          ...mapWorkToItem(w),
          creator: (w.creator || '').trim(),
        }));
        setUnified({ items, error: null });
      })
      .catch((error) => {
        if (active) setUnified({ items: [], error });
      });
    getGroups()
      .then((data) => {
        if (active) setGroups(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setGroups([]);
      });
    return () => { active = false; };
  }, [worksVersion]);

  return (
    <WorksContext.Provider value={{ worksVersion, bumpWorks, unified, groups }}>
      {children}
    </WorksContext.Provider>
  );
}

export function useWorks() {
  return useContext(WorksContext) ?? { worksVersion: 0, bumpWorks: () => {}, unified: { items: [], error: null }, groups: [] };
}
