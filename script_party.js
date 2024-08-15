function loadCSV(url) {
    return d3.csv(url).then(data => {
        return data.map(d => ({
            city: d.city,
            tone: d.tone ? d.tone.toLowerCase() : 'neutral',
            comment: d.comment ? d.comment.trim() : ''
        }));
    });
}

loadCSV('reviews.csv').then(reviews => {
    const cities = [...new Set(reviews.map(review => review.city))];
    const nodes = [];
    const links = [];

    const width = document.getElementById('graph-container').clientWidth;
    const height = document.getElementById('graph-container').clientHeight;
    const centerX = width / 2;
    const centerY = height / 2;

    // Добавляем узлы для городов
    cities.forEach(city => {
        nodes.push({ id: city, group: 1, x: centerX, y: centerY });
    });

    // Добавляем узлы для отзывов и связи
    reviews.forEach((review, index) => {
        const reviewNodeId = `review-${index}`;
        nodes.push({
            id: reviewNodeId,
            group: review.tone === 'positive' ? 2 :
                   review.tone === 'neutral' ? 3 : 4,
            comment: review.comment
        });

        links.push({
            source: review.city,
            target: reviewNodeId
        });
    });

    const svg = d3.select("#graph-container").append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("width", "100%")
        .attr("height", "100%");

    const link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("class", "link");

    const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("class", "node")
        .attr("r", 5)
        .attr("fill", d => {
            switch(d.group) {
                case 1: return '#1f77b4'; // города
                case 2: return '#4caf50'; // позитивные отзывы (зеленый)
                case 3: return '#ffeb3b'; // нейтральные отзывы (желтый)
                case 4: return '#f44336'; // негативные отзывы (красный)
            }
        })
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    node.on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", .9);
        tooltip.html(d.comment ? d.comment : d.id)
            .style("left", (event.pageX + 5) + "px")
            .style("top", (event.pageY - 28) + "px");
    }).on("mouseout", () => {
        tooltip.transition().duration(500).style("opacity", 0);
    });

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id))
        .force("charge", d3.forceManyBody().strength(500))
        .force("center", d3.forceCenter(centerX, centerY)) // Центрируем узлы
        .force("x", d3.forceX(centerX).strength(0.05)) // Притягиваем все узлы к центру по оси X
        .force("y", d3.forceY(centerY).strength(0.05)); // Притягиваем все узлы к центру по оси Y

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    });

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
});