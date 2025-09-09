# 📖 Carnet de Voyage Numérique

Carnet de Voyage Numérique est une **application web progressive (PWA)** et desktop développée avec **Next.js** (front + back), permettant aux utilisateurs de créer, gérer et partager leurs voyages en toute sécurité.  

Fonctionnalités principales :  
- ✈️ Création et gestion de voyages + étapes  
- 🗺️ Carte interactive (Leaflet / Mapbox)  
- 📸 Galerie médias (images/vidéos)  
- 🔐 Partage sécurisé (48h + code PIN chiffré)  
- 🤖 IA Premium (API OpenAI)  
- 🛠️ Interface administrateur (logs, statistiques, gestion comptes)  

---

## 🚀 Technologies utilisées

- **Frontend & Backend** : Next.js (React + API Routes)  
- **Base de données SQL** : MySQL / PostgreSQL (Prisma ORM)  
- **Base NoSQL** : MongoDB (logs, stats, feedbacks, IA history)  
- **Authentification** : NextAuth (JWT, Email & OAuth Google/Apple)  
- **Stockage médias** : Firebase / Cloudinary  
- **Carte interactive** : Leaflet / Mapbox  
- **IA générative** : API OpenAI  
- **Déploiement** : Vercel / VPS (Docker, CI/CD GitHub Actions, monitoring Grafana)  

---

## ⚙️ Installation locale

### 1. Pré-requis

- Node.js (>= 18.x)  
- npm ou yarn  
- Docker (recommandé pour SQL + MongoDB)  
- Compte Cloudinary ou Firebase (stockage médias)  
- Compte OpenAI (API Key pour IA)  

### 2. Cloner le projet

```bash
git clone https://github.com/DayanaKeo/travelbook.git
cd travelbook/frontend
```

### 3. Installer les dépendances

```bash
npm install
# ou
yarn install
```

### 4. Configuration des bases de données

#### Lancer SQL + Mongo via Docker :

```bash
docker compose up -d
```

Cela démarre :  
- MySQL/PostgreSQL (base relationnelle)  
- MongoDB (logs, stats, feedbacks)  

#### Migration Prisma (SQL) :

```bash
npx prisma migrate dev
```

---

### 5. Variables d’environnement

Créer un fichier `.env.local` à la racine du projet :

```env
# --- Authentification ---
NEXTAUTH_SECRET=xxxx
NEXTAUTH_URL=http://localhost:3000

# --- Base SQL ---
DATABASE_URL="mysql://root:password@localhost:3306/travelbook"

# --- MongoDB ---
MONGODB_URI="mongodb://localhost:27017/travelbook"

# --- Cloudinary ---
CLOUDINARY_CLOUD_NAME=xxxx
CLOUDINARY_API_KEY=xxxx
CLOUDINARY_API_SECRET=xxxx

# --- OpenAI ---
OPENAI_API_KEY=xxxx
```

---

### 6. Lancer l’application

```bash
npm run dev
```

Accès local : 👉 [http://localhost:3000](http://localhost:3000)

---

## 🌍 Déploiement (Vercel / VPS)

### Déploiement sur Vercel

1. Pousser le projet sur GitHub (branche `main`).  
2. Connecter le repo sur [Vercel](https://vercel.com).  
3. Ajouter les variables d’environnement via le dashboard Vercel.  
4. Déployer 🚀.  

### Déploiement via Docker + VPS

```bash
docker build -t travelbook .
docker run -p 3000:3000 travelbook
```

Ajouter un reverse proxy **NGINX** + certificat SSL (**Let’s Encrypt**).  

---

## 🧪 Tests

- **Unitaires** : Jest pour la logique métier.  
- **Intégration** : Tests API avec Supertest.  
- **Postman** : Collection pour valider les endpoints CRUD (Voyages, Étapes, Médias, Partages).  

---

## 🔐 Sécurité

- Authentification JWT + NextAuth  
- Validation des entrées utilisateurs (Prisma & middlewares)  
- Hashage des mots de passe (bcrypt)  
- Partage via lien temporaire + PIN chiffré  
- Logs et audits (MongoDB)  

---

## 📊 Administration

- Tableau de bord avec statistiques SQL + Mongo  
- Gestion des utilisateurs et voyages  
- Logs des erreurs et accès  
- Export des statistiques (CSV, JSON)  
