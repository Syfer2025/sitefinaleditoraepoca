export interface Book {
  id: number;
  title: string;
  slug?: string;
  author: string;
  genre: string;
  rating: number;
  year: number;
  description: string;
  image: string;
  photos?: string[];
}

export const genres = ["Todos", "Romance", "Ficção", "Contos", "Poesia", "Ensaios", "Suspense", "Crônicas"];

export const allBooks: Book[] = [
  {
    id: 1,
    title: "O Silêncio das Águas",
    slug: "o-silencio-das-aguas",
    author: "Marina Alves",
    genre: "Romance",
    rating: 4.8,
    year: 2024,
    description:
      "Uma história envolvente sobre reencontros e a força dos laços invisíveis que nos conectam ao passado. Marina Alves tece uma narrativa delicada e poderosa.",
    image:
      "https://images.unsplash.com/photo-1758796629109-4f38e9374f45?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rJTIwY292ZXIlMjBmaWN0aW9uJTIwbm92ZWx8ZW58MXx8fHwxNzcyNDAyNzExfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 2,
    title: "Crônicas do Amanhecer",
    slug: "cronicas-do-amanhecer",
    author: "Rafael Mendes",
    genre: "Contos",
    rating: 4.6,
    year: 2023,
    description:
      "Uma coletânea de contos que capturam os pequenos milagres do cotidiano, com a prosa afiada e sensível de Rafael Mendes.",
    image:
      "https://images.unsplash.com/photo-1758279771969-2cc6bcac3fd1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGFjayUyMGJvb2tzJTIwbGl0ZXJhcnklMjBhZXN0aGV0aWN8ZW58MXx8fHwxNzcyNDU3MzE5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 3,
    title: "A Última Estação",
    slug: "a-ultima-estacao",
    author: "Lúcia Ferreira",
    genre: "Ficção",
    rating: 4.9,
    year: 2024,
    description:
      "Vencedora do Prêmio Jabuti, esta obra explora os limites entre memória e invenção em uma narrativa de tirar o fôlego.",
    image:
      "https://images.unsplash.com/photo-1692742593528-ad97f591ff3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwYm9vayUyMHBhZ2VzJTIwY2xhc3NpY3xlbnwxfHx8fDE3NzI0NTczMjB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 4,
    title: "Versos ao Vento",
    slug: "versos-ao-vento",
    author: "Camila Duarte",
    genre: "Poesia",
    rating: 4.7,
    year: 2022,
    description:
      "Poemas que celebram a natureza, o amor e a existência com uma linguagem ao mesmo tempo acessível e profundamente lírica.",
    image:
      "https://images.unsplash.com/photo-1513094116080-a9255c930d1a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb2V0cnklMjBib29rJTIwcGFnZXMlMjBhZXN0aGV0aWN8ZW58MXx8fHwxNzcyNDYwMzQwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 5,
    title: "O Peso das Ideias",
    slug: "o-peso-das-ideias",
    author: "André Cavalcanti",
    genre: "Ensaios",
    rating: 4.5,
    year: 2023,
    description:
      "Ensaios provocadores sobre filosofia, política e cultura contemporânea que desafiam o leitor a pensar além do óbvio.",
    image:
      "https://images.unsplash.com/photo-1698080054260-511e9cbcdc05?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlc3NheSUyMGJvb2slMjBsaXRlcmFyeSUyMG5vbmZpY3Rpb258ZW58MXx8fHwxNzcyNDYwMzQxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 6,
    title: "Noites de Outono",
    slug: "noites-de-outono",
    author: "Beatriz Lemos",
    genre: "Romance",
    rating: 4.4,
    year: 2022,
    description:
      "Um romance intimista sobre amor maduro, segundas chances e a coragem de recomeçar quando tudo parece perdido.",
    image:
      "https://images.unsplash.com/photo-1699153308423-c12a18b739cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb21hbmNlJTIwYm9vayUyMHJlYWRpbmclMjBjb3p5fGVufDF8fHx8MTc3MjQ2MDM0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 7,
    title: "Fragmentos do Real",
    slug: "fragmentos-do-real",
    author: "Pedro Bastos",
    genre: "Contos",
    rating: 4.3,
    year: 2021,
    description:
      "Contos curtos e impactantes que revelam as fraturas da sociedade brasileira com humor e crueza.",
    image:
      "https://images.unsplash.com/photo-1647529735054-9b68c881fdc9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaG9ydCUyMHN0b3JpZXMlMjBib29rJTIwY29sbGVjdGlvbnxlbnwxfHx8fDE3NzI0NjAzNDN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 8,
    title: "Espelhos Invisíveis",
    slug: "espelhos-invisiveis",
    author: "Lúcia Ferreira",
    genre: "Ficção",
    rating: 4.8,
    year: 2025,
    description:
      "O mais recente lançamento de Lúcia Ferreira é uma fábula moderna sobre identidade, virtualidade e o que nos torna humanos.",
    image:
      "https://images.unsplash.com/photo-1759910546935-cfffa7aaf1fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxub3ZlbCUyMGZpY3Rpb24lMjBib29rJTIwY292ZXIlMjBkYXJrfGVufDF8fHx8MTc3MjQ2MDM0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 9,
    title: "Raízes e Asas",
    slug: "raizes-e-asas",
    author: "Camila Duarte",
    genre: "Poesia",
    rating: 4.6,
    year: 2024,
    description:
      "Uma antologia poética sobre pertencimento e liberdade, celebrando as raízes que nos firmam e os sonhos que nos elevam.",
    image:
      "https://images.unsplash.com/photo-1767596657164-1ec901bf24f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaXRlcmFyeSUyMGZpY3Rpb24lMjBoYXJkY292ZXIlMjBib29rfGVufDF8fHx8MTc3MjQ2MDM0Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 10,
    title: "Sombras no Espelho",
    slug: "sombras-no-espelho",
    author: "Thiago Monteiro",
    genre: "Suspense",
    rating: 4.7,
    year: 2024,
    description:
      "Um thriller psicológico que prende o leitor da primeira à última página. Nada é o que parece nesta trama repleta de reviravoltas.",
    image:
      "https://images.unsplash.com/photo-1563818072824-ed3d6ff52955?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwbXlzdGVyeSUyMG5vdmVsJTIwYm9vayUyMGNvdmVyfGVufDF8fHx8MTc3MjQ2MTQ1MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 11,
    title: "Memórias de Além-Mar",
    slug: "memorias-de-alem-mar",
    author: "Helena Barbosa",
    genre: "Romance",
    rating: 4.5,
    year: 2023,
    description:
      "Uma saga familiar que atravessa oceanos e gerações, conectando Portugal e Brasil através de cartas e segredos revelados.",
    image:
      "https://images.unsplash.com/photo-1771313121019-4d0ce055b9a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbnRpcXVlJTIwbGVhdGhlciUyMGJvdW5kJTIwYm9vayUyMGNsYXNzaWN8ZW58MXx8fHwxNzcyNDYxNDQ4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 12,
    title: "Luz entre Linhas",
    slug: "luz-entre-linhas",
    author: "Sofia Alencar",
    genre: "Crônicas",
    rating: 4.4,
    year: 2025,
    description:
      "Crônicas que iluminam o cotidiano com leveza e sabedoria, revelando a poesia escondida nos gestos mais simples.",
    image:
      "https://images.unsplash.com/photo-1762978315877-bc6f8ba8b6b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcGVuJTIwYm9vayUyMGdvbGRlbiUyMGxpZ2h0JTIwcmVhZGluZ3xlbnwxfHx8fDE3NzI0NjE0NDh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 13,
    title: "O Labirinto Interior",
    slug: "o-labirinto-interior",
    author: "Thiago Monteiro",
    genre: "Suspense",
    rating: 4.6,
    year: 2023,
    description:
      "Quando um professor de filosofia desaparece, seus alunos descobrem que suas aulas escondiam pistas para um segredo perturbador.",
    image:
      "https://images.unsplash.com/photo-1764923687062-0ec055ff7772?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rc2hlbGYlMjBsaXRlcmFyeSUyMGFlc3RoZXRpYyUyMHdhcm18ZW58MXx8fHwxNzcyNDYxNDQ4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 14,
    title: "Diário de Cinzas",
    slug: "diario-de-cinzas",
    author: "Marina Alves",
    genre: "Ficção",
    rating: 4.3,
    year: 2021,
    description:
      "Uma narrativa experimental que mistura prosa e poesia para contar a história de uma cidade que desaparece lentamente.",
    image:
      "https://images.unsplash.com/photo-1721492134958-b192339c7821?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbGQlMjBtYW51c2NyaXB0JTIwaGFuZHdyaXRpbmclMjBsaXRlcmFyeXxlbnwxfHx8fDE3NzI0NjE0NDl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 15,
    title: "Páginas em Branco",
    slug: "paginas-em-branco",
    author: "André Cavalcanti",
    genre: "Ensaios",
    rating: 4.2,
    year: 2022,
    description:
      "Reflexões sobre o processo criativo, o medo da página em branco e a coragem necessária para transformar silêncio em literatura.",
    image:
      "https://images.unsplash.com/photo-1527176930608-09cb256ab504?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwYm9vayUyMGNvdmVyJTIwd2hpdGUlMjBwYWdlc3xlbnwxfHx8fDE3NzI0NjE0NDh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
];

// First 9 books for the homepage preview
export const featuredBooks = allBooks.slice(0, 9);
