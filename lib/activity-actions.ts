// Every kind of event recorded in the admin activity history (/admin/activity,
// owner-only), with its French label and the filter group it belongs to.
// Pure — shared by the logging code and the history page.

export const ACTIVITY_GROUPS = {
  auth: "Connexions",
  menu: "Menu",
  pricing: "Tarifs",
  hours_contact: "Horaires & contact",
  orders: "Commandes",
  approvals: "Validations",
  team: "Équipe",
  navigation: "Pages consultées",
} as const;
export type ActivityGroup = keyof typeof ACTIVITY_GROUPS;

export const ACTIVITY_ACTIONS = {
  login: { label: "Connexion", group: "auth" },
  login_failed: { label: "Échec de connexion", group: "auth" },
  login_locked: { label: "Compte verrouillé (trop d'essais)", group: "auth" },
  logout: { label: "Déconnexion", group: "auth" },

  page_view: { label: "A consulté une page", group: "navigation" },

  menu_create: { label: "Ajout d'un article", group: "menu" },
  menu_update: { label: "Modification d'un article", group: "menu" },
  menu_delete: { label: "Suppression d'un article", group: "menu" },
  menu_publish: { label: "Publication d'un article", group: "menu" },
  menu_unpublish: { label: "Masquage d'un article", group: "menu" },
  menu_reorder: { label: "Réorganisation du menu", group: "menu" },
  coming_soon: { label: "Section « Bientôt disponible »", group: "menu" },

  pricing_update: { label: "Modification des tarifs", group: "pricing" },

  hours_schedule: { label: "Modification des horaires", group: "hours_contact" },
  hours_override: { label: "Ouverture / fermeture exceptionnelle", group: "hours_contact" },
  contact_update: { label: "Modification des coordonnées", group: "hours_contact" },
  reviews_refresh: { label: "Actualisation des avis Google", group: "hours_contact" },

  order_confirm: { label: "Commande marquée confirmée", group: "orders" },
  order_unconfirm: { label: "Commande marquée non confirmée", group: "orders" },
  review_requested: { label: "Demande d'avis marquée envoyée", group: "orders" },
  review_unrequested: { label: "Demande d'avis annulée", group: "orders" },
  order_delete: { label: "Suppression d'une commande", group: "orders" },
  draft_delete: { label: "Suppression d'un panier non envoyé", group: "orders" },
  orders_export: { label: "Export Excel des commandes", group: "orders" },

  change_approve: { label: "Proposition validée", group: "approvals" },
  change_reject: { label: "Proposition refusée", group: "approvals" },
  change_withdraw: { label: "Proposition retirée", group: "approvals" },

  staff_create: { label: "Création d'un compte", group: "team" },
  staff_deactivate: { label: "Désactivation d'un compte", group: "team" },
  staff_reactivate: { label: "Réactivation d'un compte", group: "team" },
  staff_role: { label: "Changement de rôle", group: "team" },
  staff_password: { label: "Mot de passe changé", group: "team" },
} as const satisfies Record<string, { label: string; group: ActivityGroup }>;

export type ActivityAction = keyof typeof ACTIVITY_ACTIONS;

export const isActivityAction = (a: string): a is ActivityAction => a in ACTIVITY_ACTIONS;

export const actionsInGroup = (g: ActivityGroup): ActivityAction[] =>
  (Object.keys(ACTIVITY_ACTIONS) as ActivityAction[]).filter((a) => ACTIVITY_ACTIONS[a].group === g);
