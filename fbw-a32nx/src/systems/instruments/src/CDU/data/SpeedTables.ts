/**
 * Correct input function for cg
 * @param mass {number} gross weight (t)
 * @param f {(mass: Tonnes, cg: Percent) => number} function to be called with cg variable
 * @param cg {number} center of gravity
 * @returns {number} cg corrected velocity (CAS)
 */
function correctCg(
  mass: Tonnes,
  f: (mass: Tonnes, cg: Percent) => number,
  cg: number = SimVar.GetSimVarValue('CG PERCENT', 'percent'),
) {
  return f(mass, isNaN(cg) ? 24 : cg);
}

/**
 * Stall speed table
 * calls function(gross weight (t), landing gear) which returns CAS.
 * Indexes: 0 - Clean config, 1 - Config 1 + F, 2 - Config 2, 3 - Config 3, 4 - Config Full, 5 - Config 1.
 * Sub-Indexes: 0 to 9 represent gross weight (t) in 5t steps from 40 to 80.
 */
export const vsTable = [
  [
    () => 124,
    (mass: Tonnes) => 124 + 1.4 * (mass - 40),
    (mass: Tonnes) => 131 + 1.4 * (mass - 45),
    (mass: Tonnes) => 138 + 1.4 * (mass - 50),
    (mass: Tonnes) => 145 + mass - 55,
    (mass: Tonnes) => 150 + 1.2 * (mass - 60),
    (mass: Tonnes) => 155 + 1.2 * (mass - 65),
    (mass: Tonnes) => 161 + mass - 70,
    (mass: Tonnes) => 166 + 1.2 * (mass - 75),
    () => 172,
  ], // Clean Conf
  [
    () => 93,
    (mass: Tonnes) => 93 + mass - 40,
    (mass: Tonnes) => 98 + mass - 45,
    (mass: Tonnes) => 103 + mass - 50,
    (mass: Tonnes) => 108 + 0.8 * (mass - 55),
    (mass: Tonnes) => 112 + mass - 60,
    (mass: Tonnes) => 117 + 0.8 + (mass - 65),
    (mass: Tonnes) => 121 + 0.8 + (mass - 70),
    (mass: Tonnes) => 125 + mass - 75,
    () => 130,
  ], // Conf 1 + F
  [
    () => 91,
    (mass: Tonnes) => 91 + mass - 40,
    (mass: Tonnes) => 96 + mass - 45,
    (mass: Tonnes) => 101 + 0.8 * (mass - 50),
    (mass: Tonnes) => 105 + mass - 55,
    (mass: Tonnes) => 110 + 0.8 * (mass - 60),
    (mass: Tonnes) => 114 + mass - 65,
    (mass: Tonnes) => 119 + 0.6 * (mass - 70),
    (mass: Tonnes) => 122 + 0.8 * (mass - 75),
    () => 126,
  ], // Conf 2
  [
    (_, ldg) => 91 - ldg * 2,
    (mass, ldg) => 91 + mass - 40 - ldg * 2,
    (mass, ldg) => 96 + mass - 45 - ldg * 2,
    (mass, ldg) => 101 + 0.8 * (mass - 50) - ldg * 2,
    (mass, ldg) => 105 + mass - 55 - ldg * 2,
    (mass, ldg) => 110 + 0.8 * (mass - 60) - ldg * 2,
    (mass, ldg) => 114 + mass - 65 - ldg * 2,
    (mass, ldg) => 119 + 0.6 * (mass - 70) - ldg * 2,
    (mass, ldg) => 122 + 0.8 * (mass - 75) - ldg * 2,
    (_, ldg) => 126 - ldg * 2,
  ], // Conf 3
  [
    () => 84,
    (mass: Tonnes) => 84 + 0.8 * (mass - 40),
    (mass: Tonnes) => 88 + mass - 45,
    (mass: Tonnes) => 93 + 0.8 * (mass - 50),
    (mass: Tonnes) => 97 + 0.8 * (mass - 55),
    (mass: Tonnes) => 101 + 0.8 * (mass - 60),
    (mass: Tonnes) => 105 + 0.8 * (mass - 65),
    (mass: Tonnes) => 109 + 0.8 * (mass - 70),
    (mass: Tonnes) => 113 + 0.6 * (mass - 75),
    () => 116,
  ], // Conf Full
  [
    () => 102,
    (mass: Tonnes) => 102 + mass - 40,
    (mass: Tonnes) => 107 + mass - 45,
    (mass: Tonnes) => 112 + mass - 50,
    (mass: Tonnes) => 117 + 1.2 * (mass - 55),
    (mass: Tonnes) => 123 + 0.8 * (mass - 60),
    (mass: Tonnes) => 127 + mass - 65,
    (mass: Tonnes) => 132 + mass - 70,
    (mass: Tonnes) => 137 + 0.8 * (mass - 75),
    () => 141,
  ], // Conf 1
];

/**
 * Lowest selectable Speed Table
 * calls function(gross weigh (t), landing gear) which returns CAS, automatically compensates for cg.
 * Indexes: 0 - Clean config, 1 - Config 1 + F, 2 - Config 2, 3 - Config 3, 4 - Config Full, 5 - Config 1.
 * Sub-Indexes: 0 to 9 represent gross weight (t) in 5t steps from 40 to 80.
 */
export const vlsTable = [
  [
    () => 159,
    (mass: Tonnes) => 159 + 1.8 * (mass - 40),
    (mass: Tonnes) => 168 + 1.8 * (mass - 45),
    (mass: Tonnes) => 177 + 1.8 * (mass - 50),
    (mass: Tonnes) => 186 + 1.2 * (mass - 55),
    (mass: Tonnes) => 192 + 1.2 * (mass - 60),
    (mass: Tonnes) => 198 + 1.6 * (mass - 65),
    (mass: Tonnes) => 206 + 1.2 * (mass - 70),
    (mass: Tonnes) => 212 + 1.6 * (mass - 75),
    () => 220,
  ], // Clean Config
  [
    () => 114,
    (mass: Tonnes) => 114 + 1.4 * (mass - 40),
    (mass: Tonnes) => 121 + 1.2 * (mass - 45),
    (mass: Tonnes) => 127 + 1.2 * (mass - 50),
    (mass: Tonnes) => 133 + mass - 55,
    (mass: Tonnes) => 138 + 1.2 * (mass - 60),
    (mass: Tonnes) => 144 + mass - 65,
    (mass: Tonnes) => 149 + mass - 70,
    (mass: Tonnes) => 154 + 1.2 * (mass - 75),
    () => 160,
  ], // Config 1 + F
  [
    () => 110,
    (mass: Tonnes) => 110 + 1.8 * (mass - 40),
    (mass: Tonnes) => 119 + 1.2 * (mass - 45),
    (mass: Tonnes) => 125 + 1.2 * (mass - 50),
    (mass: Tonnes) => 131 + 1.2 * (mass - 55),
    (mass: Tonnes) => 137 + mass - 60,
    (mass: Tonnes) => 142 + 0.6 * (mass - 65),
    (mass: Tonnes) => 145 + 0.8 * (mass - 70),
    (mass: Tonnes) => 149 + mass - 75,
    () => 154,
  ], // Config 2
  [
    (_, ldg) => 117 - ldg,
    (mass, ldg) => correctCg(mass, (mass, cg) => (cg < 25 ? 117 + 0.4 * (mass - 40) : 117)) - ldg,
    (mass, ldg) => correctCg(mass, (mass, cg) => (cg < 25 ? 119 + 1.2 * (mass - 45) : 117 + 1.4 * (mass - 45))) - ldg,
    (mass, ldg) => correctCg(mass, (mass, cg) => (cg < 25 ? 125 + 1.2 * (mass - 50) : 124 + 1.2 * (mass - 50))) - ldg,
    (mass, ldg) => correctCg(mass, (mass, cg) => (cg < 25 ? 131 + 1.2 * (mass - 55) : 130 + mass - 55)) - ldg,
    (mass, ldg) => correctCg(mass, (mass, cg) => (cg < 25 ? 137 + mass - 60 : 135 + 1.2 * (mass - 60))) - ldg,
    (mass, ldg) => correctCg(mass, (mass, cg) => (cg < 25 ? 142 : 141) + mass - 65) - ldg,
    (mass, ldg) => correctCg(mass, (mass, cg) => (cg < 25 ? 147 : 146) + mass - 70) - ldg,
    (mass, ldg) => correctCg(mass, (mass, cg) => (cg < 25 ? 152 + 0.8 * (mass - 75) : 151 + mass - 65)) - ldg,
    (_, ldg) => 156 - ldg,
  ], // Config 3
  [
    () => 116,
    () => 116,
    () => 116,
    (mass: Tonnes) => 116 + correctCg(mass, (mass, cg) => (cg < 25 ? 0.8 : 0.6) * (mass - 50)),
    (mass: Tonnes) => correctCg(mass, (mass, cg) => (cg < 25 ? 120 : 119) + mass - 55),
    (mass: Tonnes) => correctCg(mass, (mass, cg) => (cg < 25 ? 125 : 124) + mass - 60),
    (mass: Tonnes) => correctCg(mass, (mass, cg) => (cg < 25 ? 130 : 129) + mass - 65),
    (mass: Tonnes) => correctCg(mass, (mass, cg) => (cg < 25 ? 135 + 0.8 * (mass - 70) : 134 + mass - 70)),
    (mass: Tonnes) => 139 + 0.8 * (mass - 75),
    () => 143,
  ], // Config Full
  [
    () => 125,
    (mass: Tonnes) => 125 + 1.4 * (mass - 40),
    (mass: Tonnes) => 132 + 1.2 * (mass - 45),
    (mass: Tonnes) => 138 + 1.2 * (mass - 50),
    (mass: Tonnes) => 144 + 1.4 * (mass - 55),
    (mass: Tonnes) => 151 + mass - 60,
    (mass: Tonnes) => 156 + 1.2 * (mass - 65),
    (mass: Tonnes) => 162 + 1.4 * (mass - 70),
    (mass: Tonnes) => 169 + 0.8 * (mass - 75),
    () => 173,
  ], // Config 1
];

/**
 * Lowest selectable Speed Table for TakeOff ONLY
 * calls function(gross weight (t)) which returns CAS.
 * Indexes: 0 - Clean config, 1 - Config 1 + F, 2 - Config 2, 3 - Config 3, 4 - Config Full, 5 - Config 1.
 * Sub-Indexes: 0 to 9 represent gross weight (t) in 5t steps from 40 to 80.
 */
export const vlsTakeoffTable = [
  vlsTable[0], // Clean Config
  [
    () => 105,
    (mass: Tonnes) => 105 + 1.2 * (mass - 40),
    (mass: Tonnes) => 111 + mass - 45,
    (mass: Tonnes) => 116 + 1.2 * (mass - 50),
    (mass: Tonnes) => 122 + mass - 55,
    (mass: Tonnes) => 127 + mass - 60,
    (mass: Tonnes) => 132 + mass - 65,
    (mass: Tonnes) => 137 + 0.8 * (mass - 70),
    (mass: Tonnes) => 141 + 1.2 * (mass - 75),
    () => 147,
  ], // Config 1 + F
  [
    (_) => 101,
    (mass: Tonnes) => 101 + 1.4 * (mass - 40),
    (mass: Tonnes) => 108 + 1.2 * (mass - 45),
    (mass: Tonnes) => 114 + mass - 50,
    (mass: Tonnes) => 119 + 1.2 * (mass - 55),
    (mass: Tonnes) => 125 + mass - 60,
    (mass: Tonnes) => 130 + 0.4 * (mass - 65),
    (mass: Tonnes) => 132 + 0.8 * (mass - 70),
    (mass: Tonnes) => 136 + 0.8 * (mass - 75),
    () => 140,
  ], // Config 2
  [
    () => 101,
    (mass: Tonnes) => 101 + mass - 40,
    (mass: Tonnes) => 106 + 1.2 * (mass - 45),
    (mass: Tonnes) => 112 + 0.8 * (mass - 50),
    (mass: Tonnes) => 116 + 1.2 * (mass - 55),
    (mass: Tonnes) => 122 + mass - 60,
    (mass: Tonnes) => 127 + mass - 65,
    (mass: Tonnes) => 132 + 0.8 * (mass - 70),
    (mass: Tonnes) => 136 + 0.8 * (mass - 75),
    () => 140,
  ], // Config 3
  vlsTable[4], // Config Full
  vlsTable[5], // Config 1
];

/**
 * F-Speed Table
 * calls function(gross weight (t)) which returns CAS.
 * Indexes: 0 to 9 represent gross weight (t) in 5t steps from 40 to 80.
 */
export const fTable = [
  () => 131,
  () => 131,
  () => 131,
  (mass: Tonnes) => 131 + 1.2 * (mass - 50),
  (mass: Tonnes) => 137 + 1.4 * (mass - 55),
  (mass: Tonnes) => 144 + mass - 60,
  (mass: Tonnes) => 149 + 1.2 * (mass - 65),
  (mass: Tonnes) => 155 + mass - 70,
  (mass: Tonnes) => 160 + 1.2 * (mass - 75),
  () => 166,
];

/**
 * S-Speed Table
 * calls function(gross weight (t)) which returns CAS.
 * Indexes: 0 to 9 represent gross weight (t) in 5t steps from 40 to 80.
 */
export const sTable = [
  () => 152,
  (mass: Tonnes) => 152 + 1.8 * (mass - 40),
  (mass: Tonnes) => 161 + 1.6 * (mass - 45),
  (mass: Tonnes) => 169 + 1.8 * (mass - 50),
  (mass: Tonnes) => 178 + 1.6 * (mass - 55),
  (mass: Tonnes) => 186 + 1.4 * (mass - 60),
  (mass: Tonnes) => 193 + 1.4 * (mass - 65),
  (mass: Tonnes) => 200 + 1.4 * (mass - 70),
  (mass: Tonnes) => 207 + 1.4 * (mass - 75),
  () => 214,
];

export const vmcaTable = [
  [-2000, 115],
  [0, 114],
  [2000, 114],
  [4000, 113],
  [6000, 112],
  [8000, 109],
  [10000, 106],
  [12000, 103],
  [14100, 99],
  [15100, 97],
];

export const vmcgTable = [
  // 1+F, 2, 3 all the same
  [-2000, 117],
  [0, 116],
  [2000, 116],
  [4000, 115],
  [6000, 114],
  [8000, 112],
  [10000, 109],
  [12000, 106],
  [14100, 102],
  [15100, 101],
];

/**
 * Vfe for Flaps/Slats
 * @type {number[]}
 */
export const vfeFlapsSlatsTable = [
  215, // Config 1 + F
  200, // Config 2
  185, // Config 3
  177, // Config Full
  230, // Config 1
];

export const Vmo = 350;
export const Mmo = 0.82;
