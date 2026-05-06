// Database alimenti italiani — Coop / IperCoop Ferrara
// Usato per tap rapido nel check-in serale.
// Macro per 100g (riferimento etichette nutrizionali italiane).
// "common_g" = porzione tipica Alex (per stima rapida).

const FOODS_DB = [
  // PROTEINE — CARNI
  { id: 'pollo-petto', name: 'Pollo petto (crudo)', cat: 'carne', kcal: 110, prot: 23, carb: 0, fat: 1.5, common_g: 200, traffic: 'verde' },
  { id: 'bistecca-scottona', name: 'Bistecca scottona', cat: 'carne', kcal: 250, prot: 26, carb: 0, fat: 17, common_g: 200, traffic: 'verde' },
  { id: 'bresaola', name: 'Bresaola della Valtellina', cat: 'carne', kcal: 152, prot: 33, carb: 0, fat: 2, common_g: 60, traffic: 'verde' },
  { id: 'prosciutto-crudo', name: 'Prosciutto crudo San Daniele', cat: 'carne', kcal: 224, prot: 26, carb: 0, fat: 13, common_g: 60, traffic: 'giallo' },
  { id: 'tacchino-petto', name: 'Tacchino petto', cat: 'carne', kcal: 105, prot: 24, carb: 0, fat: 1, common_g: 200, traffic: 'verde' },
  { id: 'manzo-macinato', name: 'Manzo macinato magro', cat: 'carne', kcal: 145, prot: 21, carb: 0, fat: 7, common_g: 150, traffic: 'verde' },

  // PROTEINE — PESCE
  { id: 'tonno-scatola', name: 'Tonno scatola al naturale', cat: 'pesce', kcal: 116, prot: 26, carb: 0, fat: 1, common_g: 80, traffic: 'verde' },
  { id: 'tonno-olio', name: 'Tonno scatola olio oliva', cat: 'pesce', kcal: 196, prot: 24, carb: 0, fat: 11, common_g: 80, traffic: 'giallo' },
  { id: 'salmone', name: 'Salmone fresco', cat: 'pesce', kcal: 208, prot: 20, carb: 0, fat: 13, common_g: 150, traffic: 'verde' },
  { id: 'merluzzo', name: 'Merluzzo / Nasello', cat: 'pesce', kcal: 82, prot: 18, carb: 0, fat: 0.7, common_g: 200, traffic: 'verde' },
  { id: 'orata', name: 'Orata', cat: 'pesce', kcal: 121, prot: 20, carb: 0, fat: 4, common_g: 200, traffic: 'verde' },
  { id: 'gamberetti', name: 'Gamberetti', cat: 'pesce', kcal: 99, prot: 24, carb: 0, fat: 0.3, common_g: 150, traffic: 'verde' },

  // PROTEINE — UOVA E LATTICINI
  { id: 'uova', name: 'Uova intere', cat: 'latticini', kcal: 155, prot: 13, carb: 1, fat: 11, common_g: 60, traffic: 'verde' },
  { id: 'albume', name: 'Albume d\'uovo', cat: 'latticini', kcal: 52, prot: 11, carb: 0.7, fat: 0, common_g: 120, traffic: 'verde' },
  { id: 'ricotta', name: 'Ricotta vaccina', cat: 'latticini', kcal: 138, prot: 8, carb: 3, fat: 11, common_g: 100, traffic: 'verde' },
  { id: 'yogurt-greco', name: 'Yogurt greco 0%', cat: 'latticini', kcal: 59, prot: 10, carb: 4, fat: 0.4, common_g: 170, traffic: 'verde' },
  { id: 'mozzarella', name: 'Mozzarella vaccina', cat: 'latticini', kcal: 254, prot: 19, carb: 2, fat: 19, common_g: 100, traffic: 'giallo' },
  { id: 'parmigiano', name: 'Parmigiano Reggiano', cat: 'latticini', kcal: 392, prot: 33, carb: 0, fat: 28, common_g: 30, traffic: 'giallo' },
  { id: 'grana', name: 'Grana Padano', cat: 'latticini', kcal: 384, prot: 33, carb: 0, fat: 28, common_g: 30, traffic: 'giallo' },
  { id: 'fiocchi-latte', name: 'Fiocchi di latte (cottage)', cat: 'latticini', kcal: 98, prot: 11, carb: 3, fat: 4, common_g: 150, traffic: 'verde' },
  { id: 'skyr', name: 'Skyr', cat: 'latticini', kcal: 63, prot: 11, carb: 4, fat: 0.2, common_g: 170, traffic: 'verde' },

  // CARBS — PASTA / RISO / PANE
  { id: 'pasta-secca', name: 'Pasta di semola (secca)', cat: 'carbs', kcal: 358, prot: 13, carb: 72, fat: 1.5, common_g: 120, traffic: 'giallo' },
  { id: 'pasta-integrale', name: 'Pasta integrale (secca)', cat: 'carbs', kcal: 343, prot: 13, carb: 65, fat: 2.5, common_g: 120, traffic: 'giallo' },
  { id: 'riso-bianco', name: 'Riso bianco (crudo)', cat: 'carbs', kcal: 360, prot: 7, carb: 80, fat: 0.5, common_g: 90, traffic: 'giallo' },
  { id: 'riso-integrale', name: 'Riso integrale (crudo)', cat: 'carbs', kcal: 349, prot: 7.5, carb: 73, fat: 2.6, common_g: 90, traffic: 'giallo' },
  { id: 'pane-integrale', name: 'Pane integrale', cat: 'carbs', kcal: 240, prot: 9, carb: 45, fat: 3, common_g: 80, traffic: 'giallo' },
  { id: 'pane-bianco', name: 'Pane bianco', cat: 'carbs', kcal: 285, prot: 9, carb: 56, fat: 1, common_g: 80, traffic: 'giallo' },
  { id: 'pancarre', name: 'Pancarrè', cat: 'carbs', kcal: 295, prot: 8, carb: 53, fat: 5, common_g: 60, traffic: 'giallo' },
  { id: 'avena', name: 'Fiocchi avena', cat: 'carbs', kcal: 379, prot: 13, carb: 67, fat: 7, common_g: 80, traffic: 'verde' },
  { id: 'cous-cous', name: 'Cous cous (crudo)', cat: 'carbs', kcal: 376, prot: 13, carb: 73, fat: 1.5, common_g: 80, traffic: 'giallo' },
  { id: 'patate', name: 'Patate (lesse)', cat: 'carbs', kcal: 78, prot: 2, carb: 17, fat: 0.1, common_g: 200, traffic: 'giallo' },

  // VERDURE
  { id: 'zucchine', name: 'Zucchine', cat: 'verdura', kcal: 19, prot: 1.5, carb: 3, fat: 0.3, common_g: 250, traffic: 'verde' },
  { id: 'pomodorini', name: 'Pomodorini', cat: 'verdura', kcal: 18, prot: 0.9, carb: 4, fat: 0.2, common_g: 150, traffic: 'verde' },
  { id: 'insalata-mista', name: 'Insalata mista', cat: 'verdura', kcal: 17, prot: 1.2, carb: 3, fat: 0.2, common_g: 100, traffic: 'verde' },
  { id: 'broccoli', name: 'Broccoli (cotti)', cat: 'verdura', kcal: 35, prot: 2.4, carb: 7, fat: 0.4, common_g: 200, traffic: 'verde' },
  { id: 'spinaci', name: 'Spinaci (cotti)', cat: 'verdura', kcal: 23, prot: 3, carb: 4, fat: 0.4, common_g: 200, traffic: 'verde' },
  { id: 'asparagi', name: 'Asparagi', cat: 'verdura', kcal: 20, prot: 2.2, carb: 4, fat: 0.1, common_g: 200, traffic: 'verde' },
  { id: 'melanzane', name: 'Melanzane', cat: 'verdura', kcal: 25, prot: 1, carb: 6, fat: 0.2, common_g: 200, traffic: 'verde' },
  { id: 'peperoni', name: 'Peperoni', cat: 'verdura', kcal: 31, prot: 1, carb: 6, fat: 0.3, common_g: 150, traffic: 'verde' },
  { id: 'carote', name: 'Carote', cat: 'verdura', kcal: 35, prot: 1, carb: 8, fat: 0.2, common_g: 100, traffic: 'verde' },
  { id: 'rucola', name: 'Rucola', cat: 'verdura', kcal: 25, prot: 2.6, carb: 4, fat: 0.7, common_g: 80, traffic: 'verde' },

  // FRUTTA
  { id: 'banana', name: 'Banana', cat: 'frutta', kcal: 89, prot: 1.1, carb: 23, fat: 0.3, common_g: 120, traffic: 'giallo' },
  { id: 'mela', name: 'Mela', cat: 'frutta', kcal: 52, prot: 0.3, carb: 14, fat: 0.2, common_g: 180, traffic: 'verde' },
  { id: 'pera', name: 'Pera', cat: 'frutta', kcal: 57, prot: 0.4, carb: 15, fat: 0.1, common_g: 180, traffic: 'verde' },
  { id: 'fragole', name: 'Fragole', cat: 'frutta', kcal: 32, prot: 0.7, carb: 8, fat: 0.3, common_g: 150, traffic: 'verde' },
  { id: 'arancia', name: 'Arancia', cat: 'frutta', kcal: 47, prot: 0.9, carb: 12, fat: 0.1, common_g: 200, traffic: 'verde' },
  { id: 'kiwi', name: 'Kiwi', cat: 'frutta', kcal: 61, prot: 1.1, carb: 15, fat: 0.5, common_g: 100, traffic: 'verde' },
  { id: 'mirtilli', name: 'Mirtilli', cat: 'frutta', kcal: 57, prot: 0.7, carb: 14, fat: 0.3, common_g: 100, traffic: 'verde' },
  { id: 'uva', name: 'Uva', cat: 'frutta', kcal: 69, prot: 0.7, carb: 18, fat: 0.2, common_g: 150, traffic: 'giallo' },

  // LEGUMI
  { id: 'ceci', name: 'Ceci (lessi)', cat: 'legumi', kcal: 164, prot: 9, carb: 27, fat: 2.6, common_g: 150, traffic: 'verde' },
  { id: 'lenticchie', name: 'Lenticchie (lesse)', cat: 'legumi', kcal: 116, prot: 9, carb: 20, fat: 0.4, common_g: 150, traffic: 'verde' },
  { id: 'fagioli-cannellini', name: 'Fagioli cannellini (lessi)', cat: 'legumi', kcal: 114, prot: 8, carb: 20, fat: 0.5, common_g: 150, traffic: 'verde' },
  { id: 'fagioli-borlotti', name: 'Fagioli borlotti (lessi)', cat: 'legumi', kcal: 132, prot: 9, carb: 22, fat: 0.5, common_g: 150, traffic: 'verde' },
  { id: 'piselli', name: 'Piselli (lessi)', cat: 'legumi', kcal: 84, prot: 5.4, carb: 14, fat: 0.4, common_g: 150, traffic: 'verde' },

  // GRASSI BUONI
  { id: 'olio-oliva', name: 'Olio extra vergine oliva', cat: 'grassi', kcal: 884, prot: 0, carb: 0, fat: 100, common_g: 10, traffic: 'verde' },
  { id: 'mandorle', name: 'Mandorle', cat: 'grassi', kcal: 579, prot: 21, carb: 22, fat: 50, common_g: 30, traffic: 'verde' },
  { id: 'noci', name: 'Noci', cat: 'grassi', kcal: 654, prot: 15, carb: 14, fat: 65, common_g: 30, traffic: 'verde' },
  { id: 'avocado', name: 'Avocado', cat: 'grassi', kcal: 160, prot: 2, carb: 9, fat: 15, common_g: 100, traffic: 'verde' },

  // ROSSI / OCCASIONALI
  { id: 'pizza-margherita', name: 'Pizza margherita', cat: 'altro', kcal: 270, prot: 11, carb: 33, fat: 11, common_g: 350, traffic: 'rosso' },
  { id: 'gelato', name: 'Gelato (vasca)', cat: 'altro', kcal: 207, prot: 4, carb: 24, fat: 11, common_g: 100, traffic: 'rosso' },
  { id: 'cioccolato-fondente', name: 'Cioccolato fondente 70%', cat: 'altro', kcal: 598, prot: 8, carb: 46, fat: 43, common_g: 25, traffic: 'giallo' },
  { id: 'birra', name: 'Birra (lager)', cat: 'altro', kcal: 43, prot: 0.5, carb: 3.6, fat: 0, common_g: 330, traffic: 'rosso' },
  { id: 'vino-rosso', name: 'Vino rosso', cat: 'altro', kcal: 85, prot: 0.1, carb: 2.6, fat: 0, common_g: 150, traffic: 'rosso' },
];

const FOOD_CATEGORIES = [
  { id: 'all', label: 'Tutti', icon: '🍽️' },
  { id: 'carne', label: 'Carne', icon: '🥩' },
  { id: 'pesce', label: 'Pesce', icon: '🐟' },
  { id: 'latticini', label: 'Uova/Latte', icon: '🥚' },
  { id: 'carbs', label: 'Pasta/Riso', icon: '🍝' },
  { id: 'verdura', label: 'Verdure', icon: '🥗' },
  { id: 'frutta', label: 'Frutta', icon: '🍎' },
  { id: 'legumi', label: 'Legumi', icon: '🌱' },
  { id: 'grassi', label: 'Grassi', icon: '🫒' },
  { id: 'altro', label: 'Altro', icon: '🍕' },
];

window.FOODS_DB = FOODS_DB;
window.FOOD_CATEGORIES = FOOD_CATEGORIES;
