// .

async function loadXPOverTimeChart() {
  const query = `
    {
      transaction(
        where: { type: { _eq: "xp" } }
        order_by: { createdAt: asc }
      ) {
        amount
        createdAt
      }
    }
  `;
  const data = await graphqlQuery(query);

  // turn individual XP events into a running cumulative total
  let running = 0;
  const points = data.transaction.map(t => {
    running += t.amount;
    return { date: new Date(t.createdAt), total: running };
  });

  drawLineChart(points);
}

function drawLineChart(points) {
  const svg = document.getElementById("xpChart");
  svg.innerHTML = "";

  const width = 600;
  const height = 300;
  const padding = 40;

  const maxY = Math.max(...points.map(p => p.total));
  const minDate = points[0].date.getTime();
  const maxDate = points[points.length - 1].date.getTime();

  // map a data point to an actual pixel coordinate
  function scaleX(date) {
    return padding + ((date.getTime() - minDate) / (maxDate - minDate)) * (width - padding * 2);
  }
  function scaleY(value) {
    return height - padding - (value / maxY) * (height - padding * 2);
  }

  // build a single polyline path from all points
  const pointsAttr = points
    .map(p => `${scaleX(p.date)},${scaleY(p.total)}`)
    .join(" ");

  const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  polyline.setAttribute("points", pointsAttr);
  polyline.setAttribute("fill", "none");
  polyline.setAttribute("stroke", "steelblue");
  polyline.setAttribute("stroke-width", "2");
  svg.appendChild(polyline);

  // axis lines (basic)
  const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
  xAxis.setAttribute("x1", padding);
  xAxis.setAttribute("y1", height - padding);
  xAxis.setAttribute("x2", width - padding);
  xAxis.setAttribute("y2", height - padding);
  xAxis.setAttribute("stroke", "#ccc");
  svg.appendChild(xAxis);
}


async function loadPassFailChart() {
  const query = `
    {
      result {
        grade
      }
    }
  `;
  const data = await graphqlQuery(query);

  let pass = 0, fail = 0;
  data.result.forEach(r => {
    if (r.grade > 0) pass++;
    else fail++;
  });

  drawBarChart({ Pass: pass, Fail: fail });
}

function drawBarChart(counts) {
  const svg = document.getElementById("passFailChart");
  svg.innerHTML = "";

  const labels = Object.keys(counts);
  const values = Object.values(counts);
  const maxVal = Math.max(...values);

  const chartHeight = 200;
  const chartWidth = 300;
  const barWidth = chartWidth / labels.length - 20;

  labels.forEach((label, i) => {
    const value = counts[label];
    const barHeight = (value / maxVal) * chartHeight;
    const x = i * (chartWidth / labels.length) + 10;
    const y = chartHeight - barHeight;

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", barWidth);
    rect.setAttribute("height", barHeight);
    rect.setAttribute("fill", label === "Pass" ? "seagreen" : "indianred");
    svg.appendChild(rect);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x + barWidth / 2);
    text.setAttribute("y", chartHeight + 20);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", "12");
    text.textContent = `${label} (${value})`;
    svg.appendChild(text);
  });
}