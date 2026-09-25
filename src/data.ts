export interface Project {
  slug: string;
  title: string;
  description: string;
  publishDate: string;
  tags: string[];
  imagePath: string;
  imageAlt: string;
  pagePath: string;
  demoUrl?: string;
}

// Page paths and metadata mirror the existing Astro content collection.
// Update both repositories when publishing a new project page.
const projects: Project[] = [
  {
    slug: "projet-wordpress-création-site-calvados",
    title: "Projet WordPress mon site",
    description: "Création d'un site WordPress pour promouvoir une activité de vente de site internet.",
    publishDate: "2024-07-24",
    tags: ["Design", "Wordpress", "SEO"],
    imagePath: "/assets/Mon Site.png",
    imageAlt: "Capture d'écran de la page d'accueil de mon site",
    pagePath: "/work/projet-wordpress-création-site-calvados/",
    demoUrl: "https://macd-dev.com/",
  },
  {
    slug: "nested/duvet-genius",
    title: "Next.JS Dashboard",
    description: "Développement d'une page Web full stack à l'aide du cours officiel de Next.js.",
    publishDate: "2023-12-05",
    tags: ["Design", "Dev", "Next.JS"],
    imagePath: "/assets/stock-3.jpg",
    imageAlt: "Image décrivant le back-office du projet Next.js",
    pagePath: "/work/nested/duvet-genius/",
  },
  {
    slug: "markdown-mystery-tour",
    title: "Projet React.js",
    description: "Développement d'une fonctionnalité du back-office Citykomi pour personnaliser des modèles de QR Code.",
    publishDate: "2023-11-10",
    tags: ["Design", "Dev", "React.JS"],
    imagePath: "/assets/back-office Citykomi React.webp",
    imageAlt: "Capture d'écran de la personnalisation de QR Code dans le back-office Citykomi",
    pagePath: "/work/markdown-mystery-tour/",
  },
  {
    slug: "h20",
    title: "Todolist",
    description: "Projet TodoList en React.js pour comprendre les composants, les états et les hooks.",
    publishDate: "2023-09-20",
    tags: ["React.js", "Training"],
    imagePath: "/assets/stock-4.jpg",
    imageAlt: "Interface du site de gestion de tâches",
    pagePath: "/work/h20/",
    demoUrl: "https://todolist-kohl-two.vercel.app/",
  },
  {
    slug: "bloom-box",
    title: "SpeedWriting",
    description: "Mini-projet réalisé pour consolider mes bases en JavaScript.",
    publishDate: "2019-12-01",
    tags: ["Dev", "JavaScript"],
    imagePath: "/assets/stock-2.jpg",
    imageAlt: "Interface du site d'apprentissage de l'écriture au clavier",
    pagePath: "/work/bloom-box/",
    demoUrl: "https://projet-react-js-speed-writing.vercel.app/",
  },
];

export const projectCatalog: readonly Project[] = Object.freeze(projects);

export const profile = Object.freeze({
  name: "Cheikh Malik",
  role: "Développeur Web Junior",
  location: "Caen, Normandie, France",
  technologies: ["Java", "PHP", "HTML/CSS", "JavaScript", "React.js", "Node.js", "Angular", "Symfony"],
});

export function findProject(slug: string): Project | undefined {
  return projectCatalog.find((project) => project.slug === slug);
}
