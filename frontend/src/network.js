import * as d3 from "d3";

export function renderNetwork(svgElement, data) {
  const svg = d3.select(svgElement);
  const width = svgElement.clientWidth;
  const height = svgElement.clientHeight;

  svg.attr("viewBox", [0, 0, width, height]);

  // Container group — this is what gets zoomed/panned, never the svg itself
  const g = svg.append("g");

  const linkGroup = g.append("g").attr("stroke", "#999").attr("stroke-opacity", 0.6);
  const nodeGroup = g.append("g").attr("stroke", "#fff").attr("stroke-width", 1);

  const simulation = d3
    .forceSimulation(data.nodes)
    .force(
      "link",
      d3.forceLink(data.links).id((d) => d.id).distance(20)
    )
    .force("charge", d3.forceManyBody().strength(-20))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX(width / 2).strength(0.02))
    .force("y", d3.forceY(height / 2).strength(0.02));

  const link = linkGroup
    .selectAll("line")
    .data(data.links)
    .join("line")
    .attr("stroke-width", (d) => Math.sqrt(d.value));

  const node = nodeGroup
    .selectAll("circle")
    .data(data.nodes)
    .join("circle")
    .attr("r", 4)
    .attr("fill", "#782F40")
    .call(drag(simulation));

  node.append("title").text((d) => d.id);

  simulation.on("tick", () => {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
  });

  // Pan + zoom on the whole svg, applied to the container group
  svg.call(
    d3.zoom().on("zoom", (event) => {
      g.attr("transform", event.transform);
    })
  );

  // Drag individual nodes
  function drag(simulation) {
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    return d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  // Zoom-to-fit once the simulation settles — fixes the "most nodes off-screen" problem
  simulation.on("end", () => {
    const xs = data.nodes.map((d) => d.x);
    const ys = data.nodes.map((d) => d.y);
    const xExtent = [Math.min(...xs), Math.max(...xs)];
    const yExtent = [Math.min(...ys), Math.max(...ys)];

    const fullWidth = xExtent[1] - xExtent[0];
    const fullHeight = yExtent[1] - yExtent[0];
    const midX = (xExtent[0] + xExtent[1]) / 2;
    const midY = (yExtent[0] + yExtent[1]) / 2;

    const scale = 0.9 / Math.max(fullWidth / width, fullHeight / height);
    const translateX = width / 2 - scale * midX;
    const translateY = height / 2 - scale * midY;

    svg
      .transition()
      .duration(750)
      .call(
        d3.zoom().transform,
        d3.zoomIdentity.translate(translateX, translateY).scale(scale)
      );
  });

  node.append("title").text((d) => d.id);
}