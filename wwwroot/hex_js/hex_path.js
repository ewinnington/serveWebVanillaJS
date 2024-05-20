let reachableHexes = new Map();
let startHex = {};



function getNeighbor(hex, direction) {
    const directions_even = [ //column, row dimension data
        [0, -1],   // N
        [1, -1],   // NE
        [1, 0],    // SE
        [0, 1],    // S
        [-1, 0],   // SW
        [-1, -1]   // NW
    ];

    const directions_odd = [ //column, row dimension data
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

function handlePatternClick(row, col) {
    if (!startHex.hex) {
        startHex = { hex: [col, row]};
        const [c, r] = startHex.hex;
        const x = c * hexWidth * 0.75;
        const y = r * hexHeight + (c % 2 === 0 ? 0 : hexHeight / 2);
        ctx.save();
        ctx.scale(zoomLevel, zoomLevel);
        drawHexOutline(ctx, x + hexWidth / 2, y + hexHeight / 2, hexWidth / 2, 'start');
        ctx.restore();
    } else {
        console.log("{col: " + (col - startHex.hex[0]) + ", row: " + (row - startHex.hex[1]) + "},");
    }
    ctx.save();
    ctx.scale(zoomLevel, zoomLevel);
    const c = col; const r = row;
    const x = c * hexWidth * 0.75;
    const y = r * hexHeight + (c % 2 === 0 ? 0 : hexHeight / 2);
    drawHexOutline(ctx, x + hexWidth / 2, y + hexHeight / 2, hexWidth / 2, 'fire');
    ctx.restore();
}

//axial
const firingArcPatterns = [
    [{col: 0, row: -1},{col: -1, row: -1},{col: +1, row: -1},{col: 0, row: -2},{col: -1, row: -2},{col: +1, row: -2},{col: 0, row: -3},{col: -1, row: -3},{col: +1, row: -3},{col: 0, row: -4},{col: -2, row: -3},{col: +2, row: -3},{col: -1, row: -4},{col: +1, row: -4},{col: 0, row: -5},{col: -2, row: -4},{col: +2, row: -4}], //"ForwardCenter":
    [{col: 1, row: 0},{col: 2, row: 0},{col: 2, row: -1},{col: 2, row: -2},{col: 3, row: -1},{col: 3, row: -2},{col: 3, row: -3},{col: 3, row: 0},{col: 4, row: 0},{col: 4, row: -1},{col: 4, row: -2},{col: 4, row: -3},{col: 5, row: 0},{col: 5, row: -1},{col: 5, row: -2}], //"ForwardRight": 
    [{col: 1, row: 0}, {col: 1, row: 1}, {col: 1, row: 2}], //"RearRight":
    [{col: 0, row: 1},{col: 1, row: 2},{col: -1, row: 2},{col: 0, row: 2},{col: -1, row: 3},{col: 1, row: 3},{col: 0, row: 3},{col: -1, row: 4},{col: 1, row: 4},{col: 0, row: 4},{col: -2, row: 3},{col: 2, row: 3},{col: -1, row: 5},{col: 1, row: 5},{col: 0, row: 5},{col: -2, row: 4},{col: 2, row: 4}], //"RearCenter": 
    [{col: -1, row: 0}, {col: -1, row: 1}, {col: -1, row: 2}], //"RearLeft":
    [{col: -1, row: -1}, {col: -1, row: -2}, {col: -1, row: -3}] //"ForwardLeft": 
];

function adjustForEvenColumns(pattern) {
    return pattern.map(hex => {
        if (hex.col % 2 !== 0) {
            return {
                 col: hex.col,
                 row: hex.row - 1
            };
        }
        return hex;
    });
}

function rotatePattern(pattern, direction) {
    return pattern.map(hex => {
        axial = col_row_to_axial(hex.col, hex.row); 
        axial = axial_rotate_by_direction(axial.q, axial.r, direction);
        hex = axial_to_col_row(axial.q, axial.r);
        return hex; 
    });
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
            const targetHex = [startHex[0] + point.col, startHex[1] + point.row];
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


function col_row_to_axial(col, row) {
    q = col;
    r = row - Math.floor(col / 2);
    return {q, r};
}

function axial_rotate_by_direction(q, r, direction) {
    // N => function (q,r)→(q,r)
    // NE => function (q,r)→(−r,q+r)
    // SE => function (q,r)→(−q−r,q)
    // S => function (q,r)→(−q,−r) 
    // SW => function (q,r)→(r,−q-r)
    // NW => function (q,r)→(q+r,−q)

    switch(direction) {
        case 0: return { q, r };
        case 1: return { q: -r, r: q + r };
        case 2: return { q: -q - r, r: q };
        case 3: return { q: -q, r: -r };
        case 4: return { q: r, r: -q - r };
        case 5: return { q: q + r, r: -q };
    }
}

function axial_to_col_row(q,r){
    col = q; 
    row = r + Math.floor(q / 2);
    return {col, row};
}