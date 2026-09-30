# Améliorer la typographie et les revenus

## Résultat attendu
- Remplacer l’aspect très « informatique » par une police plus douce, proche d’Aptos/Calibri.
- Ajouter dans les réglages un choix entre quelques familles lisibles, avec aperçu direct et mémorisation du choix.
- Ajouter au parcours initial deux avantages en nature : remboursement transport et titres-restaurant.
- Inclure ces avantages dans le revenu annuel et mensuel servant au calcul 50/30/20.

## Mise en œuvre
1. **Typographie**
   - Utiliser Aptos/Calibri quand elles sont disponibles, avec une alternative web proche et fiable.
   - Harmoniser titres, texte et montants afin d’éviter la rupture actuelle entre trois polices très typées.
   - Proposer trois choix sobres dans Réglages : Moderne, Classique et Arrondie.
2. **Préférences**
   - Ajouter la police aux préférences existantes et l’appliquer immédiatement à toute l’application.
   - Conserver le choix sur l’appareil et, pour les comptes connectés, dans le profil.
3. **Avantages en nature**
   - Ajouter les champs annuels « Remboursement transport » et « Titres-restaurant » à la première étape.
   - Les sauvegarder avec les revenus et les intégrer au total partagé par tous les écrans.
   - Préserver les valeurs existantes lors de la modification des revenus.
4. **Contrôles**
   - Vérifier le parcours des revenus, le changement de police et l’affichage mobile/bureau.
   - Contrôler que le calcul 50/30/20 et l’enregistrement restent cohérents.

## Détails techniques
- Mise à jour compatible de la base Lovable Cloud pour les deux nouveaux montants et la préférence de police.
- Les calculs restent centralisés dans le module budgétaire partagé.
- Aucun changement de navigation, d’authentification ou de logique de dépenses.
