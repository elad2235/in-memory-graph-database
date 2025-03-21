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
        return Dagoba.error("A vertex with that ID already exists");
    }

    this.vertices.push(v);
    this.vertexIndex[v._id] = v;
    v._out = [];
    v._in = [];
    return v._id;
};

Dagoba.G.addEdge = function (e) {
    e._in = this.findVertexById(e._in);
    e._out = this.findVertexById(e._out);

    if (!e._in || !e._out) {
        return Dagoba.error(
            "That edge's " + (e._in ? "out" : "in") + " vertex wasn't found"
        );
    }

    e._out._out.push(e);
    e._in._in(e);
    this.edges.push(e);
};

Dagoba.error = function (e) {
    console.error(e);
    return false;
};

Dagoba.Q = {};
Dagoba.query = function (graph) {
    let query = Object.create(Dagoba.Q);

    query.graph = graph;
    query.state = [];
    query.program = [];
    query.gremlins = [];

    return query;
};

// adds new step to the query
Dagoba.Q.add = function (pipetype, args) {
    let step = [pipetype, args];
    this.program.push(step);
    return this;
};

Dagoba.G.v = function () {
    let query = Dagoba.query(this);
    query.add("vertex", [].slice.call(arguments));
    return query;
};

Dagoba.Pipetypes = {};
Dagoba.addPipetype = function (name, func) {
    Dagoba.Pipetypes[name] = func;
    Dagoba.Q[name] = function () {
        return this.add(name, [].slice.apply(arguments));
    };
};

Dagoba.getPipetype = function (name) {
    let pipetype = Dagoba.Pipetypes[name];

    if (!pipetype) Dagoba.error('Unknown pipetype ' + name);

    return pipetype || Dagoba.fauxPipetype;
}

Dagoba.fauxPipetype = function (_, _, maybeGremlin) {
    return maybeGremlin || 'pull';
}

Dagoba.addPipetype('vertex', function (graph, args, gremlin, state) {
    if (!state.vertices) {
        state.vertices = graph.findVertices(args);
    }

    if (!state.vertices.length) {
        return 'done';
    }

    let vertex = state.vertices.pop();
    return Dagoba.makeGremlin(vertex, gremlin.state);
});

Dagoba.addPipetype('out', Dagoba.simpleTraversal('out'));
Dagoba.addPipetype('in', Dagoba.simpleTraversal('in'));


Dagoba.simpleTraversal = function (dir) {
    let findMethod = dir == 'out' ? 'findOutEdges' : 'findInEdges';
    let edgeList = dir == 'out' ? '_in' : '_out';
    return function (graph, args, gremlin, state) {
        state.gremlin = gremlin;
        state.edges = graph[findMethod](gremlin.vertex).filter(Dagoba.filterEdges(args[0]))

        if (!state.edges.length) {
            return 'pull';
        }

        let vertex = state.edges.pop()[edgeList];
        return Dagoba.gotoVertex(state.gremlin, vertex);
    }
}

Dagoba.addPipetype('property', function (graph, args, gremlin, state) {
    if (!gremlin) {
        return 'pull';
    }
    gremlin.result = gremlin.vertex[args[0]];
    return gremlin.result == null ? false : gremlin;
})

Dagoba.addPipetype('unique', function (graph, args, gremlin, state) {
    if (!gremlin) {
        return 'pull';
    }
    if (state[gremlin.vertex._id]) return 'pull';
    state[gremlin.vertex._id] = true;
    return gremlin;
})

Dagoba.addPipetype('filter', function (graph, args, gremlin, state) {
    if (!gremlin) {
        return 'pull';
    }
    if (typeof args[0] == 'object') {
        return Dagoba.objectFilter(gremlin.vertex, args[0]) ? gremlin : 'pull';
    }

    if (typeof args[0] != 'function') {
        Dagoba.error('Filter is not a function: ' + args[0]);
        return gremlin;
    }

    if (!args[0](gremlin.vertex, gremlin)) return 'pull';

    return gremlin;
})

Dagoba.addPipetype('take', function (graph, args, gremlin, state) {
    state.taken = state.taken || 0;

    if (state.taken == args[0]) {
        state.taken = 0;
        return 'done'
    }

    if (!gremlin) return 'pull';

    state.taken++;
    return gremlin;
})


Dagoba.addPipetype('as', function (graph, args, gremlin, state) {
    if (!gremlin) {
        return 'pull';
    }

    gremlin.state.as = gremlin.state.as || {};
    gremlin.state.as[args[0]] = gremlin.vertex;
    return gremlin;
})

Dagoba.addPipetype('merge', function (graph, args, gremlin, state) {
    if (!state.vertices && !gremlin) {
        return 'pull';
    }

    if (!state.vertices || !state.vertices.length) {
        let obj = (gremlin.state || {}).as || {};
        state.vertices = args.map(function (id) { return obj[id] }).filter(Boolean);
    }

    if (!state.vertices.length) {
        return 'pull';
    }

    let vertex = state.vertices.pop();
    return Dagoba.makeGremlin(vertex, gremlin.state);
})

Dagoba.addPipetype('except', function (graph, args, gremlin, state) {
    if (!gremlin) {
        return 'pull';
    }
    if (gremlin.vertex == gremlin.state.as[args[0]]) {
        return 'pull';
    }
    return gremlin;
})

Dagoba.addPipetype('back', function (graph, args, gremlin, state) {
    if (!gremlin) {
        return 'pull';
    }

    return Dagoba.gotoVertex(gremlin, gremlin.state.as[args[0]]);
})

Dagoba.makeGremlin = function (vertex, state) {
    return { vertex: vertex, state: state || {} };
}

Dagoba.gotoVertex = function (gremlin, vertex) {
    return Dagoba.makeGremlin(vertex, gremlin.state)
}

Dagoba.G.findVertices = function (args) {
    if (typeof args[0] == 'object') {
        return this.searchVertices(args[0]);
    } else if (args.length == 0) {
        return this.vertices.slice();
    }
    return this.findVerticesByIds(args);
}


Dagoba.G.findVertexByIds = function (ids) {
    if (ids.length == 1) {
        let maybeVertex = this.findVertexById(ids[0]);
        return maybeVertex ? [maybeVertex] : [];
    }
    return ids.map(this.findVertexById.bind(this)).filter(Boolean);
}

Dagoba.G.findVertexById = function (id) {
    return this.vertexIndex[id];
}

Dagoba.G.searchVertices = function (filter) {
    return this.vertices.filter(function (v) {
        return Dagoba.objectFilter(v, filter);
    })
}

Dagoba.filterEdges = function (filter) {
    return function (edge) {
        if (!filter) {
            return true;
        }

        if (typeof filter == 'string') {
            return edge._label == filter;
        }

        if (Array.isArray(filter)) {
            return !!~filter.indexOf(edge._label);
        }
        return Dagoba.objectFilter(edge, filter);
    }
}