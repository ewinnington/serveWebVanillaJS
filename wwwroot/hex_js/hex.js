const hexgrid = document.getElementById('hexgrid');
const directionInput = document.getElementById('direction');
const speedInput = document.getElementById('speed');
const turnInput = document.getElementById('turn');

const gridSize = 8; // Change to 8 tiles wide
const hexHeight = 52;
const hexWidth = 60;
const hexes = [];

// Create hex grid
for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
        const hex = document.createElement('div');
        hex.classList.add('hex');
        hex.dataset.row = row;
        hex.dataset.col = col;
        hex.innerHTML = `(${col},${row})`;
        hex.style.left = `${col * hexWidth * 0.75}px`;
        hex.style.top = `${row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2)}px`;
        hex.addEventListener('click', () => handleHexClick(row, col));
        hexgrid.appendChild(hex);
        hexes.push(hex);
    }
}

// Directions for movement in a hex grid
const directions_even = [
    [0, -1],   // N
    [1, -1],   // NE
    [1, 0],    // SE
    [0, 1],    // S
    [-1, 0],   // SW
    [-1, -1]    // NW
];

const directions_odd = [
    [0, -1],   // N
    [1, 0],   // NE
    [1, 1],    // SE
    [0, 1],    // S
    [-1, 1],   // SW
    [-1, 0]    // NW
];

function getNeighbor(hex, direction) {
    const [dCol, dRow] = hex[0] % 2 === 0 ? directions_even[direction] : directions_odd[direction];
    return [hex[0] + dCol, hex[1] + dRow];
}

function calculateReachable(hex, speed, turn_number, moved, remaining_moves, current_direction) {
    if (remaining_moves === 0) {
        return [{ hex: hex, moved: moved, remaining_moves: remaining_moves, is_end: true }];
    }

    let reachable = [{ hex: hex, moved: moved, remaining_moves: remaining_moves, is_end: false }];
    
    // Move forward in the current direction
    let forward_hex = getNeighbor(hex, current_direction);
    if (isValidHex(forward_hex)) {
        reachable = reachable.concat(calculateReachable(forward_hex, speed, turn_number, moved + 1, remaining_moves - 1, current_direction));
    }
    
    // Check if the ship can turn
    if ((moved % turn_number === 0) && (moved > 0)) {
        // Turn left and right
        let left_direction = (current_direction - 1 + 6) % 6;
        let right_direction = (current_direction + 1) % 6
        
        let left_hex = getNeighbor(hex, left_direction);
        let right_hex = getNeighbor(hex, right_direction);
        
        if (isValidHex(left_hex)) {
            reachable = reachable.concat(calculateReachable(left_hex, speed, turn_number, moved + 1, remaining_moves - 1, left_direction));
        }
        if (isValidHex(right_hex)) {
            reachable = reachable.concat(calculateReachable(right_hex, speed, turn_number, moved + 1, remaining_moves - 1, right_direction));
        }
    }

    return reachable;
}

function isValidHex(hex) {
    return hex[1] >= 0 && hex[1] < gridSize && hex[0] >= 0 && hex[0] < gridSize;
}

function handleHexClick(row, col) {
    // Clear previous highlights
    hexes.forEach(hex => hex.classList.remove('blue', 'yellow', 'green'));

    // Mark the start hex
    const startHex = document.querySelector(`.hex[data-row='${row}'][data-col='${col}']`);

    const speed = parseInt(speedInput.value);
    const turn_number = parseInt(turnInput.value);
    const direction = parseInt(directionInput.value);

    const reachableHexes = calculateReachable([col, row], speed, turn_number, 0, speed, direction);

    // Mark reachable hexes
    reachableHexes.forEach(({ hex, is_end }) => {
        const [c, r] = hex;
        const hexElement = document.querySelector(`.hex[data-row='${r}'][data-col='${c}']`);
        hexElement.classList.add(is_end ? 'green' : 'yellow');
    });

    // Mark the start hex again (to ensure it is not overwritten)
    startHex.classList.remove('yellow');
    startHex.classList.remove('green');
    startHex.classList.add('blue');
    }