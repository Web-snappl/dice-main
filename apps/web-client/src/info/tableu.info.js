// src/info/tableu.info.js

export const stats = [
    { label: 'Propriétés totales', value: '24', change: '+5% ce mois dernier', icon: '🏠' },
    { label: 'Locataires actifs', value: '89', change: '+2% ce mois dernier', icon: '👤' },
    { label: 'Loyer mensuel moyen', value: '$56,845', change: '+4% ce mois dernier', icon: '💰' },
    { label: 'Entrant en attente', value: '7', change: '+2% ce mois dernier', icon: '⏳' },
    { label: 'Renouvellements à venir', value: '12', change: '+10% ce mois dernier', icon: '🔄' },
];

export const payments = [
    { name: 'Emma Wilson', amount: '$1,500', due: '16/01/2024' },
    { name: 'Emma Wilson', amount: '$1,500', due: '16/01/2024' },
    { name: 'Emma Wilson', amount: '$1,500', due: '16/01/2024' },
    { name: 'Emma Wilson', amount: '$1,500', due: '16/01/2024' },
];

export const properties = [
    {
        id: 1,
        image: '/assets/tableu/tableu-apercu-image.png',
        address: '123, rue Oak, centre-ville',
        price: '$2,400',
        status: 'Actif',
        tenants: '2 Locataires',
    },
    {
        id: 2,
        image: '/assets/tableu/tableu-apercu-image.png',
        address: '456, avenue Pine, Midtown',
        price: '$2,400',
        status: 'Vacant',
        tenants: '0 Locataire',
    },
    {
        id: 3,
        image: '/assets/tableu/tableu-apercu-image.png',
        address: '123, rue Oak, centre-ville',
        price: '$2,400',
        status: 'Actif',
        tenants: '1 Locataire',
    },
];

export const recentActivity = [
    { user: 'John Smith', action: 'a payé 1200 $ pour l’appartement 4B', time: 'Il y a 2 heures' },
    { user: 'Ball renouvelé au 246', action: 'pour Sarah Johnson', time: 'Il y a 4 heures' },
    { user: 'Demande de maintenance soumise', action: 'pour le 789, avenue Oak', time: 'Il y a 6 heures' },
    { user: 'Nouvelle demande de locataire reçue', action: 'pour l’unité 12', time: 'Il y a 8 heures' },
    { user: 'Emma Wilson', action: 'a payé 1800 $ pour le loft du centre-ville', time: 'Il y a 1 jour' },
];

export const topTenants = [
    { name: 'Sarah Johnson', amount: '$2400', rank: 1 },
    { name: 'Michael Clark', amount: '$2200', rank: 2 },
    { name: 'Emma Wilson', amount: '$1800', rank: 3 },
    { name: 'David Brown', amount: '$1500', rank: 4 },
];

export const monthlyExpenses = [
    { category: 'Maintenance', amount: '$3500', percentage: 30 },
    { category: 'Assurance', amount: '$1800', percentage: 15 },
    { category: 'Taxes foncières', amount: '$9400', percentage: 50 },
    { category: 'Salaire et profits', amount: '$800', percentage: 5 },
];

export const smartReports = [
    { title: 'Renouvellements de bail', status: 'En cours', priority: 'Haute', icon: '📅' },
    { title: 'Inspections de propriété', status: 'À faire', priority: 'Moyenne', icon: '🔍' },
    { title: `Renouvellements d'assurance`, status: 'Terminé', priority: 'Basse', icon: '✅' },
    { title: 'Sortie de maintenance', status: 'En attente', priority: 'Haute', icon: '🔧' },
];

export const quickActions = [
    {
        label: 'Ajouter une nouvelle propriété',
        color: '#2196F3',
        icon: '+',
        textColor: 'white',
    },
    {
        label: 'Générer un rapport',
        color: 'white',
        icon: '📊',
        textColor: 'black',

    },
    {
        label: 'Inviter un copropriétaire',
        color: 'white',
        icon: '👤',
        textColor: '#222',

    },
    {
        label: 'Planifier la maintenance',
        color: 'green',
        icon: '🔧',
        textColor: 'white',
    },
];