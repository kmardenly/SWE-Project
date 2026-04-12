export const EXPLORE_ITEMS = [
  { id: '1', craftType: 'Knitting', title: 'Cozy cable scarf' },
  { id: '2', craftType: 'Crochet', title: 'Granny square tote' },
  { id: '3', craftType: 'Embroidery', title: 'Floral hoop art' },
  { id: '4', craftType: 'Weaving', title: 'Wall hanging study' },
  { id: '5', craftType: 'Sewing', title: 'Linen napkin set' },
  { id: '6', craftType: 'Knitting', title: 'Fair Isle mittens' },
  { id: '7', craftType: 'Crochet', title: 'Amigurumi fox' },
  { id: '8', craftType: 'Embroidery', title: 'Monogram pillowcase' },
];

export function getExploreItem(id) {
  return EXPLORE_ITEMS.find((x) => String(x.id) === String(id));
}
