# Portfolio2 API

Backend indépendant du portfolio Astro. Il expose quatre opérations métier et une documentation Swagger.

## Démonstration en ligne

- API : https://portfolio2-api.vercel.app/api/projects
- Swagger : https://portfolio2-api.vercel.app/docs/
- OpenAPI : https://portfolio2-api.vercel.app/openapi.json
- Frontend distinct : https://portfolio2-api-demo.vercel.app/

Le catalogue contient dix projets. Les cinq fiches récentes ont une page statique, une image et le même slug dans le dépôt frontend ; Pédago'Up est crédité comme projet d'équipe.

## Lancer localement

Node.js 22 ou plus récent est recommandé. Dans PowerShell, utilisez `npm.cmd` si la politique d'exécution bloque `npm.ps1`.

```powershell
cd C:\Users\malik\Developpement\PortFolio2-API
Copy-Item .env.example .env
npm.cmd ci
npm.cmd run dev
```

Les routes fonctionnent sur `http://localhost:3000`. Documentation : `http://localhost:3000/docs/` et `http://localhost:3000/openapi.json`.

| Méthode | Route | Usage |
| --- | --- | --- |
| GET | `/api/projects` | Projets publiés, triés du plus récent au plus ancien |
| GET | `/api/projects/:slug` | Un projet ; encoder les `/` des slugs imbriqués avec `%2F` |
| GET | `/api/profile` | Profil public et technologies |
| POST | `/api/contact` | Valider et transmettre un message à Formspree |

Exemple de contact :

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/contact -ContentType 'application/json' -Body '{"name":"Ada Lovelace","email":"ada@example.com","message":"Bonjour, je souhaite discuter de votre travail."}'
```

Sans `FORMSPREE_FORM_ID`, le POST retourne `503` : il n'annonce jamais un envoi qui n'a pas eu lieu. Créez un formulaire dans [Formspree](https://formspree.io/), vérifiez l'adresse destinataire dans son tableau de bord, puis copiez l'identifiant visible dans l'URL `https://formspree.io/f/IDENTIFIANT` vers la variable `FORMSPREE_FORM_ID`. Le formulaire collecte uniquement nom, email et message. Formspree conserve un historique selon le forfait choisi.

## Configuration

- `PORT` : port local, par défaut `3000`.
- `FRONTEND_ORIGIN` : `https://portfolio2-api-demo.vercel.app` en production, sans slash final. `http://localhost:4321` est autorisé pour le développement.
- `FORMSPREE_FORM_ID` : identifiant du formulaire Formspree. Ne pas utiliser d'URL arbitraire ; le backend construit lui-même l'URL du fournisseur.

La limitation CORS empêche un autre site d'appeler l'API depuis un navigateur ; elle ne remplace pas une protection contre les requêtes directes. Pour un formulaire public, ajoutez dans Vercel Firewall une limite de débit sur `/api/contact` selon votre trafic réel. Le backend utilise un champ piège `website`, limite la taille JSON et valide toutes les entrées.

## Déploiement Vercel

Importez le dépôt GitHub `PortFolio2-API` comme **nouveau projet Vercel**, avec le dossier racine `.`. Vercel détecte `src/index.ts` comme application Express. Définissez `FRONTEND_ORIGIN` et `FORMSPREE_FORM_ID` pour Production dans les variables d'environnement, puis redéployez après toute modification de ces variables. Les fichiers sous `public/` fournissent Swagger sur `/docs/` et le document OpenAPI sur `/openapi.json`. Les assets Swagger UI 5.33.0 sont inclus avec leurs licences dans `public/docs/`, sans CDN à l'exécution.

Si le frontend affiche `L'envoi a échoué`, vérifiez d'abord l'en-tête `Access-Control-Allow-Origin` des réponses de l'API pour son origine exacte, puis le code de réponse du POST dans l'onglet Réseau. Sans `FRONTEND_ORIGIN`, le navigateur bloque l'appel ; sans `FORMSPREE_FORM_ID`, le serveur répond `503`.

`npm.cmd run typecheck` et `npm.cmd test` vérifient respectivement les types et le contrat de l'API. Les données des projets sont dans `src/data.ts` ; lors de l'ajout d'un projet, conservez le même slug et la même page dans le dépôt frontend avant de le publier ici.
