# TaskFlow

TaskFlow est une application Web de gestion de tâches, conçue avec HTML, CSS, JavaScript, Node.js et Express. Les tâches sont sauvegardées dans le `localStorage` du navigateur : elles sont conservées sur cet appareil et dans ce navigateur après actualisation.

## Prérequis

- Node.js 18 ou ultérieur
- npm

## Installation et lancement

```bash
npm ci
npm start
```

Ouvrez ensuite <http://localhost:3000>. Le serveur utilise le port fourni par `PORT` lorsqu’il est défini, et le port `3000` sinon.

## Fonctionnalités

- Créer, modifier, supprimer et terminer une tâche.
- Définir un titre, une description, une priorité et une date limite.
- Filtrer les tâches par état et les rechercher par titre ou description.
- Consulter les statistiques et la progression.
- Sauvegarder automatiquement les tâches dans le navigateur.

## Vérification

Exécutez les tests automatisés avec :

```bash
npm test
```

L’endpoint de santé est disponible à <http://localhost:3000/health> et renvoie :

```json
{"status":"ok","version":"1.0.0"}
```

## Intégration continue

Le workflow GitHub Actions `.github/workflows/ci.yml` lance `npm ci` et `npm test` à chaque push et à chaque pull request.

## Déploiement sur Render

1. Publiez le projet dans un dépôt GitHub.
2. Dans Render, créez un **Web Service** connecté à ce dépôt.
3. Sélectionnez **Node** comme environnement.
4. Configurez la commande de build `npm ci` et la commande de démarrage `npm start`.
5. Déployez le service. Render fournit la variable `PORT`; aucune clé ni aucun secret n’est requis par TaskFlow.

Pour vérifier le déploiement, ouvrez `https://<votre-service>.onrender.com/health` et contrôlez que la réponse indique `status: "ok"`.
