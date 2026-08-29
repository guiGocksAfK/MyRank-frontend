import { createContext, useContext, useEffect, useMemo, useState } from 'react';

/**
 * i18n mínimo, sem lib. Só a Home está traduzida por enquanto.
 * O idioma escolhido no seletor do Navbar fica em localStorage (myrank_lang).
 */

const STORAGE_KEY = 'myrank_lang';
export const LANGUAGES = ['PT', 'EN', 'ES'];

const TRANSLATIONS = {
  PT: {
    nav: { home: 'Home', login: 'Entrar', signup: 'Cadastrar' },
    home: {
      hero: {
        title1: 'Seu gosto.',
        title2: 'Seu ranking.',
        title3: 'Sua identidade.',
        subtitle:
          'Avalie filmes, séries, jogos, livros e animes em um só lugar. Compare com amigos e descubra seu perfil de consumo.',
        cta: 'Criar conta grátis',
      },
      medias: ['Filmes', 'Séries', 'Jogos', 'Livros', 'Animes'],
      how: {
        title: 'Como funciona?',
        steps: [
          {
            title: 'Crie sua conta',
            desc: 'Comece de graça, sem cartão e sem pegadinha. Acesso completo a todas as funcionalidades — suas tabelas, seu ranking e sua identidade, tudo seu desde o primeiro login.',
          },
          {
            title: 'Monte suas tabelas',
            desc: 'Crie tabelas do jeito que fizer sentido pra você — uma só de séries, uma só de animes, ou misture os dois. Prefere separar por categoria? Animes Shonen, Animes de Sci-Fi, Filmes de Máfia. Você define a estrutura, sem limites.',
          },
          {
            title: 'Avalie do seu jeito',
            desc: 'Dê notas de 0 a 10 para qualquer obra. Se quiser ir além, registre o tempo que dedicou — e a gente cria uma média ponderada especial, valorizando o que você realmente consumiu com atenção.',
          },
          {
            title: 'Unifique tudo',
            desc: 'Junte as tabelas que quiser num ranking unificado com média ponderada — opcional, mas poderoso. Compare filmes com jogos, séries com animes, e descubra o que realmente te marcou.',
          },
        ],
      },
      impact: [
        { num: '100%', label: 'Gratuito' },
        { num: '99+', label: 'Tabelas por usuário' },
        { num: '5', label: 'Categorias de mídia' },
        { num: '99+', label: 'Obras por tabela' },
        { num: '0–10', label: 'Escala de avaliação' },
      ],
      faq: {
        title: 'Perguntas frequentes',
        items: [
          {
            q: 'O MyRank é gratuito?',
            a: 'Sim, 100% gratuito e sem anúncios. Criar conta, montar tabelas, avaliar obras, usar o ranking unificado e comparar com amigos não custa nada. Sempre.',
          },
          {
            q: 'Como funciona o ranking unificado?',
            a: 'Você escolhe quais tabelas quer unir — pode ser todas de uma vez ou só uma seleção específica, como suas tabelas de filmes e séries juntas, ou filmes e jogos. O MyRank funde tudo em uma única lista ordenada, onde cada obra recebe sua posição com base na nota — e opcionalmente na média ponderada por tempo consumido. O resultado é um ranking personalizado que cruza mídias diferentes e mostra o que realmente ficou no topo da sua história como consumidor.',
          },
          {
            q: 'Como funciona a média ponderada por tempo?',
            a: 'Quando você registra o tempo dedicado a uma obra, a nota recebe um bônus proporcional. Um filme de 2h com nota 8.0 praticamente não é afetado — continua quase o mesmo 8.0. Já uma série que você maratonou por 30h com nota 8.0 sobe para 8.3, reconhecendo o tempo real que você investiu. O bônus é calibrado para não distorcer as notas — obras longas sobem com justiça, obras curtas não são punidas.',
          },
          {
            q: 'Posso comparar meu ranking com o de amigos?',
            a: 'Sim! Você pode seguir outros usuários e comparar suas notas individuais, rankings gerais e ver as últimas alterações que eles fizeram nas tabelas públicas deles. É a melhor forma de descobrir o que seus amigos estão consumindo e onde vocês concordam ou discordam.',
          },
          {
            q: 'As tabelas são públicas ou privadas?',
            a: 'Você decide. Cada tabela pode ser configurada como pública — visível para seus seguidores — ou privada, visível só para você. Seu perfil também pode ser público ou privado, te dando controle total sobre o que compartilha.',
          },
          {
            q: 'Como é o dashboard visual?',
            a: 'Suas obras são exibidas em um grid de posters — visual, organizado e fácil de navegar. Você também conta com filtros para ordenar por data de lançamento, data em que adicionou a obra, e até ver o que seus amigos mais consumiram.',
          },
          {
            q: 'Como as informações das obras são cadastradas?',
            a: 'Automaticamente. O MyRank usa APIs externas para buscar os metadados de cada obra assim que você a adiciona — diretor do filme, produtora do jogo, autor do livro, estúdio do anime e muito mais. Você não precisa preencher nada na mão.',
          },
          {
            q: 'Existe um ranking por autor ou empresa?',
            a: 'Sim! O MyRank gera rankings automáticos por criador — seja um diretor, uma produtora de jogos ou um autor de livros. Cada um recebe uma nota média ponderada, que favorece criadores com mais obras avaliadas por você. É a forma mais honesta de descobrir quem realmente domina o seu gosto.',
          },
          {
            q: 'Conquistas e badges',
            a: 'O MyRank gera badges automáticos baseados no seu consumo. Maratonou mais de 500 horas em jogos? Você é um "Maratonista de Elite". Consumiu mais de 50 obras de ficção científica? Vira "Explorador do Futuro". Seu perfil vira um reflexo real do que você consome.',
          },
          {
            q: 'O que é o MyRank Pro?',
            a: 'O MyRank Pro é o plano premium para quem quer ir além. Com ele, uma IA analisa seu perfil completo — suas notas, mídias favoritas e padrões de consumo — e gera insights personalizados: seu estilo como consumidor, suas tendências, e sugestões de próxima obra baseadas no seu ranking atual. O restante do site permanece 100% gratuito.',
          },
        ],
      },
      footer: {
        tagline: 'Tudo em um só lugar.',
        colProduct: 'Produto',
        productLinks: ['Sobre', 'Contato', 'Termos de uso', 'Privacidade'],
        colPro: 'MyRank Pro',
        proText: 'IA que analisa seu perfil e sugere obras baseadas no seu ranking.',
        proCta: 'Saiba mais →',
        colSocial: 'Redes',
        copyright: '© 2026 MyRank. Todos os direitos reservados.',
      },
    },
  },

  EN: {
    nav: { home: 'Home', login: 'Sign in', signup: 'Sign up' },
    home: {
      hero: {
        title1: 'Your taste.',
        title2: 'Your ranking.',
        title3: 'Your identity.',
        subtitle:
          'Rate movies, series, games, books and anime all in one place. Compare with friends and discover your consumption profile.',
        cta: 'Create free account',
      },
      medias: ['Movies', 'Series', 'Games', 'Books', 'Anime'],
      how: {
        title: 'How it works',
        steps: [
          {
            title: 'Create your account',
            desc: 'Start for free, no card and no catch. Full access to every feature — your tables, your ranking and your identity, all yours from the first login.',
          },
          {
            title: 'Build your tables',
            desc: 'Create tables however makes sense to you — one just for series, one just for anime, or mix the two. Prefer to split by category? Shonen Anime, Sci-Fi Anime, Mafia Movies. You define the structure, no limits.',
          },
          {
            title: 'Rate your way',
            desc: 'Give scores from 0 to 10 to any title. Want to go further? Log the time you spent — and we build a special weighted average that rewards what you truly consumed with attention.',
          },
          {
            title: 'Unify everything',
            desc: 'Merge any tables into a unified ranking with a weighted average — optional, but powerful. Compare movies with games, series with anime, and discover what really left a mark on you.',
          },
        ],
      },
      impact: [
        { num: '100%', label: 'Free' },
        { num: '99+', label: 'Tables per user' },
        { num: '5', label: 'Media categories' },
        { num: '99+', label: 'Titles per table' },
        { num: '0–10', label: 'Rating scale' },
      ],
      faq: {
        title: 'Frequently asked questions',
        items: [
          {
            q: 'Is MyRank free?',
            a: 'Yes, 100% free and ad-free. Creating an account, building tables, rating titles, using the unified ranking and comparing with friends costs nothing. Ever.',
          },
          {
            q: 'How does the unified ranking work?',
            a: 'You choose which tables to merge — all at once or a specific selection, like your movie and series tables together, or movies and games. MyRank fuses everything into a single ordered list, where each title gets its position based on its score — and optionally on the average weighted by time consumed. The result is a personalized ranking that crosses different media and shows what truly rose to the top of your history as a consumer.',
          },
          {
            q: 'How does the time-weighted average work?',
            a: 'When you log the time spent on a title, its score gets a proportional bonus. A 2-hour movie rated 8.0 is barely affected — it stays almost the same 8.0. But a series you binged for 30 hours rated 8.0 rises to 8.3, acknowledging the real time you invested. The bonus is calibrated not to distort scores — long titles rise fairly, short ones aren\'t punished.',
          },
          {
            q: "Can I compare my ranking with friends'?",
            a: 'Yes! You can follow other users and compare individual scores, overall rankings, and see the latest changes they made to their public tables. It\'s the best way to find out what your friends are consuming and where you agree or disagree.',
          },
          {
            q: 'Are tables public or private?',
            a: 'You decide. Each table can be set as public — visible to your followers — or private, visible only to you. Your profile can also be public or private, giving you full control over what you share.',
          },
          {
            q: 'What is the visual dashboard like?',
            a: 'Your titles are shown in a poster grid — visual, organized and easy to browse. You also get filters to sort by release date, the date you added the title, and even see what your friends consumed the most.',
          },
          {
            q: 'How is title information added?',
            a: "Automatically. MyRank uses external APIs to fetch each title's metadata as soon as you add it — the movie's director, the game's studio, the book's author, the anime's studio and much more. You don't have to fill in anything by hand.",
          },
          {
            q: 'Is there a ranking by author or company?',
            a: 'Yes! MyRank generates automatic rankings by creator — whether a director, a game studio or a book author. Each one gets a weighted average score that favors creators with more titles rated by you. It\'s the most honest way to find out who really rules your taste.',
          },
          {
            q: 'Achievements and badges',
            a: 'MyRank generates automatic badges based on your consumption. Binged more than 500 hours of games? You\'re an "Elite Marathoner". Consumed more than 50 sci-fi titles? You become a "Future Explorer". Your profile turns into a real reflection of what you consume.',
          },
          {
            q: 'What is MyRank Pro?',
            a: 'MyRank Pro is the premium plan for those who want to go further. With it, an AI analyzes your full profile — your scores, favorite media and consumption patterns — and generates personalized insights: your style as a consumer, your trends, and next-title suggestions based on your current ranking. The rest of the site stays 100% free.',
          },
        ],
      },
      footer: {
        tagline: 'Everything in one place.',
        colProduct: 'Product',
        productLinks: ['About', 'Contact', 'Terms of use', 'Privacy'],
        colPro: 'MyRank Pro',
        proText: 'AI that analyzes your profile and suggests titles based on your ranking.',
        proCta: 'Learn more →',
        colSocial: 'Social',
        copyright: '© 2026 MyRank. All rights reserved.',
      },
    },
  },

  ES: {
    nav: { home: 'Inicio', login: 'Iniciar sesión', signup: 'Registrarse' },
    home: {
      hero: {
        title1: 'Tu gusto.',
        title2: 'Tu ranking.',
        title3: 'Tu identidad.',
        subtitle:
          'Puntúa películas, series, juegos, libros y animes en un solo lugar. Compara con amigos y descubre tu perfil de consumo.',
        cta: 'Crear cuenta gratis',
      },
      medias: ['Películas', 'Series', 'Juegos', 'Libros', 'Animes'],
      how: {
        title: '¿Cómo funciona?',
        steps: [
          {
            title: 'Crea tu cuenta',
            desc: 'Empieza gratis, sin tarjeta y sin trampas. Acceso completo a todas las funciones — tus tablas, tu ranking y tu identidad, todo tuyo desde el primer inicio de sesión.',
          },
          {
            title: 'Arma tus tablas',
            desc: 'Crea tablas como tenga sentido para ti — una solo de series, una solo de animes, o mezcla las dos. ¿Prefieres separar por categoría? Animes Shonen, Animes de Sci-Fi, Películas de Mafia. Tú defines la estructura, sin límites.',
          },
          {
            title: 'Puntúa a tu manera',
            desc: 'Da notas de 0 a 10 a cualquier obra. Si quieres ir más allá, registra el tiempo que le dedicaste — y creamos un promedio ponderado especial que valora lo que realmente consumiste con atención.',
          },
          {
            title: 'Unifica todo',
            desc: 'Une las tablas que quieras en un ranking unificado con promedio ponderado — opcional, pero poderoso. Compara películas con juegos, series con animes, y descubre lo que de verdad te marcó.',
          },
        ],
      },
      impact: [
        { num: '100%', label: 'Gratis' },
        { num: '99+', label: 'Tablas por usuario' },
        { num: '5', label: 'Categorías de medios' },
        { num: '99+', label: 'Obras por tabla' },
        { num: '0–10', label: 'Escala de puntuación' },
      ],
      faq: {
        title: 'Preguntas frecuentes',
        items: [
          {
            q: '¿MyRank es gratis?',
            a: 'Sí, 100% gratis y sin anuncios. Crear una cuenta, armar tablas, puntuar obras, usar el ranking unificado y comparar con amigos no cuesta nada. Nunca.',
          },
          {
            q: '¿Cómo funciona el ranking unificado?',
            a: 'Eliges qué tablas quieres unir — pueden ser todas a la vez o solo una selección específica, como tus tablas de películas y series juntas, o películas y juegos. MyRank fusiona todo en una única lista ordenada, donde cada obra recibe su posición según la nota — y opcionalmente según el promedio ponderado por tiempo consumido. El resultado es un ranking personalizado que cruza medios distintos y muestra lo que de verdad quedó en la cima de tu historia como consumidor.',
          },
          {
            q: '¿Cómo funciona el promedio ponderado por tiempo?',
            a: 'Cuando registras el tiempo dedicado a una obra, la nota recibe un bono proporcional. Una película de 2h con nota 8.0 casi no se ve afectada — se queda casi en el mismo 8.0. En cambio, una serie que maratoneaste durante 30h con nota 8.0 sube a 8.3, reconociendo el tiempo real que invertiste. El bono está calibrado para no distorsionar las notas — las obras largas suben con justicia, las cortas no se penalizan.',
          },
          {
            q: '¿Puedo comparar mi ranking con el de amigos?',
            a: '¡Sí! Puedes seguir a otros usuarios y comparar sus notas individuales, rankings generales y ver los últimos cambios que hicieron en sus tablas públicas. Es la mejor forma de descubrir qué están consumiendo tus amigos y en qué coinciden o discrepan.',
          },
          {
            q: '¿Las tablas son públicas o privadas?',
            a: 'Tú decides. Cada tabla se puede configurar como pública — visible para tus seguidores — o privada, visible solo para ti. Tu perfil también puede ser público o privado, dándote control total sobre lo que compartes.',
          },
          {
            q: '¿Cómo es el panel visual?',
            a: 'Tus obras se muestran en una cuadrícula de pósters — visual, organizada y fácil de navegar. También cuentas con filtros para ordenar por fecha de estreno, fecha en que agregaste la obra, e incluso ver lo que tus amigos más consumieron.',
          },
          {
            q: '¿Cómo se registran los datos de las obras?',
            a: 'Automáticamente. MyRank usa APIs externas para buscar los metadatos de cada obra en cuanto la agregas — director de la película, desarrolladora del juego, autor del libro, estudio del anime y mucho más. No necesitas rellenar nada a mano.',
          },
          {
            q: '¿Existe un ranking por autor o empresa?',
            a: '¡Sí! MyRank genera rankings automáticos por creador — ya sea un director, una desarrolladora de juegos o un autor de libros. Cada uno recibe una nota media ponderada que favorece a los creadores con más obras puntuadas por ti. Es la forma más honesta de descubrir quién domina de verdad tu gusto.',
          },
          {
            q: 'Logros y badges',
            a: 'MyRank genera badges automáticos según tu consumo. ¿Maratoneaste más de 500 horas de juegos? Eres un "Maratonista de Élite". ¿Consumiste más de 50 obras de ciencia ficción? Te conviertes en "Explorador del Futuro". Tu perfil se vuelve un reflejo real de lo que consumes.',
          },
          {
            q: '¿Qué es MyRank Pro?',
            a: 'MyRank Pro es el plan premium para quien quiere ir más allá. Con él, una IA analiza tu perfil completo — tus notas, medios favoritos y patrones de consumo — y genera insights personalizados: tu estilo como consumidor, tus tendencias y sugerencias de próxima obra basadas en tu ranking actual. El resto del sitio sigue siendo 100% gratis.',
          },
        ],
      },
      footer: {
        tagline: 'Todo en un solo lugar.',
        colProduct: 'Producto',
        productLinks: ['Acerca de', 'Contacto', 'Términos de uso', 'Privacidad'],
        colPro: 'MyRank Pro',
        proText: 'IA que analiza tu perfil y sugiere obras basadas en tu ranking.',
        proCta: 'Saber más →',
        colSocial: 'Redes',
        copyright: '© 2026 MyRank. Todos los derechos reservados.',
      },
    },
  },
};

const LanguageContext = createContext(null);

function readStoredLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGUAGES.includes(saved)) return saved;
  } catch {
    /* localStorage indisponível */
  }
  return 'PT';
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readStoredLang);

  const setLang = (next) => {
    if (!LANGUAGES.includes(next)) return;
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignora */
    }
  };

  useEffect(() => {
    document.documentElement.lang = lang.toLowerCase();
  }, [lang]);

  const value = useMemo(
    () => ({ lang, setLang, t: TRANSLATIONS[lang] || TRANSLATIONS.PT }),
    [lang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback seguro se algum componente for montado fora do provider.
    return { lang: 'PT', setLang: () => {}, t: TRANSLATIONS.PT };
  }
  return ctx;
}
