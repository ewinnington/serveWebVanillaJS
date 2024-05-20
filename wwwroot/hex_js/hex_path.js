let reachableHexes = new Map();
let startHex = {};



function getNeighbor(hex, direction) {
    const directions_even = [
        [0, -1],   // N
        [1, -1],   // NE
        [1, 0],    // SE
        [0, 1],    // S
        [-1, 0],   // SW
        [-1, -1]   // NW
    ];

    const directions_odd = [
        [0, -1],   // N
        [1, 0],    // NE
        [1, 1],    // SE
        [0, 1],    // S
        [-1, 1],   // SW
        [-1, 0]    // NW
    ];

    const [dCol, dRow] = hex[0] % 2 === 0 ? directions_even[direction] : directions_odd[direction];
    return [hex[0] + dCol, hex[1] + dRow];
}

function calculateReachable(hex, speed, turn_number, moved, remaining_moves, current_direction, reachable = new Map()) {
    const key = `${hex[0]},${hex[1]}`;
    if (remaining_moves === 0) {
        reachable.set(key, { hex, moved, remaining_moves, is_end: true });
        return reachable;
    }

    if (!reachable.has(key) || reachable.get(key).is_end === false) {
        reachable.set(key, { hex, moved, remaining_moves, is_end: remaining_moves === 0 });
    }

    const forward_hex = getNeighbor(hex, current_direction);
    if (isValidHex(forward_hex)) {
        calculateReachable(forward_hex, speed, turn_number, moved + 1, remaining_moves - 1, current_direction, reachable);
    }

    if ((moved % turn_number === 0) && (moved > 0)) {
        const left_direction = (current_direction - 1 + 6) % 6;
        const right_direction = (current_direction + 1) % 6;

        const left_hex = getNeighbor(hex, left_direction);
        if (isValidHex(left_hex)) {
            calculateReachable(left_hex, speed, turn_number, moved + 1, remaining_moves - 1, left_direction, reachable);
        }

        const right_hex = getNeighbor(hex, right_direction);
        if (isValidHex(right_hex)) {
            calculateReachable(right_hex, speed, turn_number, moved + 1, remaining_moves - 1, right_direction, reachable);
        }
    }

    return reachable;
}


function isValidHex(hex) {
    return hex[1] >= 0 && hex[1] < gridSizeHeight && hex[0] >= 0 && hex[0] < gridSizeWidth;
}

function handleHexClick(row, col) {
    removeReachableHexes(reachableHexes, startHex);
    startHex = { hex: [col, row], moved: 0, remaining_moves: parseInt(speedInput.value), is_end: false };
    const speed = parseInt(speedInput.value);
    const turn_number = parseInt(turnInput.value);
    const direction = parseInt(directionInput.value);

    reachableHexes = calculateReachable([col, row], speed, turn_number, 0, speed, direction);

    drawReachableHexes(reachableHexes, startHex);
}

function handleFiringArcClick(row, col) {
    removeReachableHexes(reachableHexes, startHex);
    startHex = { hex: [col, row], moved: 0, remaining_moves: parseInt(distanceInput.value), is_end: false };
    const firingDirection = parseInt(firingDirectionInput.value);
    const firingArc = parseInt(firingArcInput.value);
    const distance = parseInt(distanceInput.value);

    reachableHexes = calculateFiringArc(startHex.hex, firingDirection, firingArc, distance);
    drawFiringArcHexes(reachableHexes, startHex.hex);
}

//axial
const firingArcPatterns = [
    [{q: 0, r: -1},{q: -1, r: -1},{q: +1, r: -1},{q: 0, r: -2},{q: -1, r: -2},{q: +1, r: -2},{q: 0, r: -3},{q: -1, r: -3},{q: +1, r: -3},{q: 0, r: -4},{q: -2, r: -3},{q: +2, r: -3},{q: -1, r: -4},{q: +1, r: -4},{q: 0, r: -5},{q: -2, r: -4},{q: +2, r: -4}], //"ForwardCenter": 
    [{q: 1, r: -1}, {q: 1, r: -2}, {q: 1, r: -3}], //"ForwardRight": 
    [{q: 1, r: 0}, {q: 1, r: 1}, {q: 1, r: 2}], //"RearRight":
    [{q: 0, r: 1}, {q: 0, r: 2}, {q: 0, r: 3}], //"RearCenter": 
    [{q: -1, r: 0}, {q: -1, r: 1}, {q: -1, r: 2}], //"RearLeft":
    [{q: -1, r: -1}, {q: -1, r: -2}, {q: -1, r: -3}] //"ForwardLeft": 
];

function rotateHex(q, r, direction) {
    for (let i = 0; i < direction; i++) {
        const temp = q;
        q = -r;
        r = temp + q;
    }
    return {q, r};
}

function adjustForEvenColumns(pattern) {
    return pattern.map(hex => {
        if (hex.q % 2 !== 0) {
            return {
                 q: hex.q,
                 r: hex.r - 1
            };
        }
        return hex;
    });
}

function rotatePattern(pattern, direction) {
    return pattern.map(point => rotateHex(point.q, point.r, direction));
}

function calculateFiringArc(startHex, direction, arc, distance) {
    let localFiringArcPatterns = firingArcPatterns;
    if (startHex[0] % 2 == 0) { 
        localFiringArcPatterns = firingArcPatterns.map(pattern => adjustForEvenColumns(pattern));
    } 
    const pattern = rotatePattern(localFiringArcPatterns[arc], direction);
    const reachableHexes = new Map();

    for (let point of pattern) {
        //for (let step = 1; step <= distance; step++) {
            const targetHex = [startHex[0] + point.q, startHex[1] + point.r];
            if (isValidHex(targetHex)) {
                reachableHexes.set(`${targetHex[0]},${targetHex[1]}`, { hex: targetHex, is_end: true });
            }
        //}
    }

    return reachableHexes;
}
 /*function getNeighborAxial(hex, direction) {
    const directions = [
        {q: 0, r: -1},  // N
        {q: 1, r: -1},  // NE
        {q: 1, r: 0},   // SE
        {q: 0, r: 1},   // S
        {q: -1, r: 1},  // SW
        {q: -1, r: 0}   // NW
    ];

    const { q, r } = directions[direction];
    return { q: hex.q + q, r: hex.r + r };
}*/

function isValidHex(hex) {
    return hex[1] >= 0 && hex[1] < gridSizeHeight && hex[0] >= 0 && hex[0] < gridSizeWidth;
}

