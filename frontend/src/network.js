import * as d3 from "d3";

export function renderNetwork(svgElement, data) {
  const svg = d3.select(svgElement);
  const width = svgElement.clientWidth;
  const height = svgElement.clientHeight;

  svg.attr("viewBox", [0, 0, width, height]);

  // Container group — this is what gets zoomed/panned, never the svg itself
  const g = svg.append("g");

  const linkGroup = g
    .append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6);

  const nodeGroup = g
    .append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1);

  // Create tooltip
  const tooltip = d3
    .select("body")
    .append("div")
    .style("position", "fixed")
    .style("display", "none")
    .style("background", "white")
    .style("border", "1px solid #ccc")
    .style("border-radius", "8px")
    .style("padding", "10px 12px")
    .style("box-shadow", "0 2px 8px rgba(0,0,0,0.2)")
    .style("font-family", "Arial, sans-serif")
    .style("font-size", "14px")
    .style("max-width", "350px")
    .style("z-index", "1000")
    .style("pointer-events", "none");

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
    .style("cursor", "pointer")
    .call(drag(simulation));

  // Show paper information when hovering over a node
  node
    .on("mouseenter", function (event, d) {
      node.attr("opacity", 0.3);
      d3.select(this).attr("opacity", 1);

      tooltip
        .style("display", "block")
        .html(`
          <strong>${d.title || "Unknown title"}</strong>
          <br>
          <b>Year:</b> ${d.publication_year || "Unknown"}
          <br>
          <b>Venue:</b> ${d.venue || "Unknown venue"}
          <br>
          <b>Authors:</b> ${d.authors || "Unknown authors"}
        `);
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", `${event.clientX + 15}px`)
        .style("top", `${event.clientY + 15}px`);
    })
    .on("mouseleave", function () {
      node.attr("opacity", 1);
      tooltip.style("display", "none");
    });

  simulation.on("tick", () => {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y);
  });

  // Pan + zoom on the whole svg
  const zoom = d3
    .zoom()
    .on("zoom", (event) => {
      g.attr("transform", event.transform);
    });

  svg.call(zoom);

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

  // Zoom-to-fit once the simulation settles
  simulation.on("end", () => {
    const xs = data.nodes.map((d) => d.x);
    const ys = data.nodes.map((d) => d.y);

    const xExtent = [Math.min(...xs), Math.max(...xs)];
    const yExtent = [Math.min(...ys), Math.max(...ys)];

    const fullWidth = xExtent[1] - xExtent[0];
    const fullHeight = yExtent[1] - yExtent[0];

    const midX = (xExtent[0] + xExtent[1]) / 2;
    const midY = (yExtent[0] + yExtent[1]) / 2;

    const scale =
      0.9 / Math.max(fullWidth / width, fullHeight / height);

    const translateX = width / 2 - scale * midX;
    const translateY = height / 2 - scale * midY;

    svg
      .transition()
      .duration(750)
      .call(
        zoom.transform,
        d3.zoomIdentity
          .translate(translateX, translateY)
          .scale(scale)
      );
  });
}