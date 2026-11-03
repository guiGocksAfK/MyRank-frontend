import {
  Archive, Award, Bone, BookCopy, BookOpen, Bookmark, Brain, Cake, CalendarCheck,
  Clapperboard, Clock, Dices, Feather, Film, Flame, FolderPlus, Gamepad2, Gem, Gift,
  History, Hourglass, IdCard, Joystick, Landmark, Library, Medal, MountainSnow, Orbit,
  Palette, Pencil, Popcorn, Puzzle, RadioTower, Repeat, Scale, Scroll, Skull, Sofa,
  Sprout, Star, Swords, Timer, TrendingUp, Trophy, Tv, Video, WandSparkles, Zap,
} from 'lucide-react';

/**
 * Ícone de cada conquista, por `code`. O back ainda manda um emoji, mas emoji
 * colorido briga com o preto e dourado: aqui cada uma ganha um ícone de traço
 * próprio (os 48 são diferentes entre si).
 */
const BADGE_ICONS = {
  JOGO_5: Joystick,
  JOGO_25: Gamepad2,
  JOGO_HORAS_500: Hourglass,
  JOGO_NOTA_10: Trophy,
  JOGO_MARATONA: Swords,
  JOGO_ESTUDIOS_10: Dices,
  FILME_10: Popcorn,
  FILME_50: Clapperboard,
  FILME_CLASSICO: Film,
  FILME_NOTA_10: Star,
  FILME_DIRETORES_10: Video,
  FILME_LONGO: Timer,
  SERIE_5: Tv,
  SERIE_20: Sofa,
  SERIE_HORAS_300: RadioTower,
  SERIE_NOTA_10: Award,
  SERIE_MEDIA_8: Brain,
  SERIE_VICIANTE: Repeat,
  LIVRO_5: Bookmark,
  LIVRO_20: Library,
  LIVRO_AUTORES_10: Feather,
  LIVRO_NOTA_10: BookOpen,
  LIVRO_CLASSICO: Landmark,
  LIVRO_50: BookCopy,
  ANIME_5: WandSparkles,
  ANIME_25: Flame,
  ANIME_HORAS_200: Orbit,
  ANIME_NOTA_10: Zap,
  ANIME_ESTUDIOS_5: Palette,
  ANIME_CLASSICO: Scroll,
  TOTAL_50: TrendingUp,
  TOTAL_100: Medal,
  HORAS_1000: Clock,
  CRITICO_RIGOROSO: Scale,
  POLIVALENTE: Puzzle,
  GENEROSO: Gift,
  SOFRI_ATE_O_FIM: Skull,
  ARQUEOLOGO: Bone,
  TOP_HEAVY: MountainSnow,
  TOTAL_250: Archive,
  NOTA_PERFEITA_10: Gem,
  DECADAS: History,
  PRIMEIRA_OBRA: Sprout,
  PERFIL_COMPLETO: IdCard,
  CATEGORIA_CUSTOM: FolderPlus,
  REVISOR: Pencil,
  VETERANO: Cake,
  MADRUGADOR: CalendarCheck,
};

/** Herda cor e tamanho do texto em volta; conquista nova sem ícone cai na medalha. */
export default function BadgeIcon({ code, size = '1.15em', className }) {
  const Icon = BADGE_ICONS[code] ?? Medal;
  return <Icon size={size} strokeWidth={1.6} className={className} aria-hidden="true" />;
}
