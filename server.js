const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Product Weights from the document
const productWeights = {
    'A': 2,
    'B': 2,
    'C': 8,
    'D': 12,
    'E': 25,
    'F': 1.5,
    'G': 0.5,
    'H': 1,
    'I': 2
};

// All distances (undirected graph)
const distances = {
    'C1': { 'L1': 2.5, 'C2': 2.5, 'C3': 3 },
    'C2': { 'L1': 3, 'C1': 2.5, 'C3': 2 },
    'C3': { 'L1': 2, 'C1': 3, 'C2': 2 },
    'L1': { 'C1': 2.5, 'C2': 3, 'C3': 2 }
};

// Cost calculator
function calculateCost(weight, distance) {
    if (weight === 0) return 0;
    let cost = 10;
    if (weight > 5) {
        cost += Math.ceil((weight - 5) / 5) * 7.2;
    }
    return cost * distance;
}

// Find which center has which products
const productLocations = {
    'A': 'C1',
    'B': 'C1',
    'C': 'C1',
    'D': 'C2',
    'E': 'C2',
    'F': 'C2',
    'G': 'C3',
    'H': 'C3',
    'I': 'C3'
};

// Main API
app.post('/calculateCost', (req, res) => {
    const order = req.body;

    // Generate all valid pickup centers based on the order
    let centersInvolved = new Set();
    let totalWeight = 0;

    for (const product in order) {
        if (productWeights[product] && productLocations[product]) {
            totalWeight += productWeights[product] * order[product];
            centersInvolved.add(productLocations[product]);
        }
    }

    centersInvolved = Array.from(centersInvolved);

    // Generate all possible pickup orders
    function generateRoutes(centers) {
        if (centers.length === 1) return [centers];
        const routes = [];
        for (let i = 0; i < centers.length; i++) {
            const remaining = [...centers.slice(0, i), ...centers.slice(i + 1)];
            const subroutes = generateRoutes(remaining);
            subroutes.forEach(sr => routes.push([centers[i], ...sr]));
        }
        return routes;
    }

    const possibleRoutes = generateRoutes(centersInvolved);

    let minCost = Infinity;
    let bestRoute = [];

    for (const route of possibleRoutes) {
        let distance = 0;

        // From first pickup center to next centers
        for (let i = 0; i < route.length - 1; i++) {
            distance += distances[route[i]][route[i + 1]];
        }

        // From last center to L1
        distance += distances[route[route.length - 1]]['L1'];

        const cost = calculateCost(totalWeight, distance);
        if (cost < minCost) {
            minCost = cost;
            bestRoute = [...route, 'L1'];
        }
    }

    res.json({
        minimum_cost: minCost,
        route: bestRoute.join(' -> ')
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});