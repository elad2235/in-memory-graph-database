const V = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const E = [
    [1, 2],
    [1, 3],
    [2, 4],
    [2, 5],
    [3, 6],
    [3, 7],
    [4, 8],
    [4, 9],
    [5, 10],
    [5, 11],
    [6, 12],
    [6, 13],
    [7, 14],
    [7, 15],
];

const findParents = (vertices) =>
    E.reduce(
        (acc, [parent, child]) =>
            vertices.includes(child) ? acc.concat(parent) : acc,
        []
    );

const findChildren = (vertices) =>
    E.reduce(
        (acc, [parent, child]) => vertices.include(parent) ? acc.concat(child) : acc,
        []
    );

