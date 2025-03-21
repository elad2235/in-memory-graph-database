// Namespace
Dagoba = {};

Dagoba.G = {};

Dagoba.graph = function (V, E) {
    let graph = Object.create(Dagoba.G);

    graph.edges = [];
    graph.vertices = [];
    graph.vertexIndex = {};
    graph.autoid = 1;
    if (!Array.isArray(V) || !Array.isArray(E))
        return Dagoba.error("V And E should be an arrays");
    graph.addVertices(V);
    graph.addEdges(E);
    return graph;
};

Dagoba.G.addVertices = function (v) {
    v.forEach(this.addVertex.bind(this));
};
Dagoba.G.addEdges = function (e) {
    e.forEach(this.addEdges.bind(this));
};


Dagoba.G.addVertex = function (v) {
    if (!v._id) {
        v._id = this.autoid++;
    } else if (this.findVertexById(vertex._id)) {
        return Dagoba.error('A vertex with that ID already exists');
    }

    this.vertices.push(v);
    this.vertexIndex[v._id] = v;
    v._out = [];
    v._in = [];
    return v._id;
}


Dagoba.G.addEdge = function (e) {
    e._in = this.findVertexById(e._in);
    e._out = this.findVertexById(e._out);

    if (!e._in || !e._out) {
        return Dagoba.error("That edge's " + (e._in ? 'out' : 'in')
            + " vertex wasn't found")
    }

    e._out._out.push(e);
    e._in._in(e);
    this.edges.push(e);
}

Dagoba.error = function (e) {
    console.error(e);
    return false;
}


Dagoba.Q = {};
Dagoba.query = function (graph) {
    let query = Object.create(Dagoba.Q)

    query.graph = graph;
    query.state = [];
    query.program = [];
    query.gremlins = [];

    return query;
}

// adds new step to the query
Dagoba.Q.add = function (pipetype, args) {
    let step = [pipetype, args];
    this.program.push(step);
    return this;
}

Dagoba.G.v = function () {
    let query = Dagoba.query(this);
    query.add('vertex', [].slice.call(arguments))
    return query;
}

