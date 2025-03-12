const margin = { top: 20, right: 20, bottom: 20, left: 20 };
const width = 700;  // Increase from 400
const height = 600; // Increase from 500

const svg = d3.select('#vis')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

// Update the projection scale
const projection = d3.geoAlbersUsa()
    .scale(1000)     // Increase from 700 to make the map bigger
    .translate([width / 2, height / 2]);

// Add loading indicator
svg.append('text')
    .attr('x', width / 2)
    .attr('y', height / 2)
    .attr('text-anchor', 'middle')
    .text('Loading data...');

Promise.all([
    d3.csv('https://fumeng-yang.github.io/CMSC471/handouts/weather.csv'),
    d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
]).then(([weatherData, usMap]) => {
    // Take only first 2000 valid data points
    const cleanData = weatherData
        .filter(d => {
            const lat = +d.latitude;
            const lon = +d.longitude;
            const temp = +d.TAVG;
            const prcp = +d.PRCP;
            const wind = +d.AWND;
            
            return !isNaN(lat) && !isNaN(lon) && !isNaN(temp) && 
                   !isNaN(prcp) && !isNaN(wind) && 
                   projection([lon, lat]) !== null;
        })
        .slice(0, 2000); // Only take first 2000 points

    console.log('Clean data count:', cleanData.length);

    // Create scales
    const rScale = d3.scaleSqrt()
        .domain(d3.extent(cleanData, d => +d.PRCP))
        .range([2, 15]); // Slightly smaller bubbles

    // Option 1: Using custom light colors
    const colorScale = d3.scaleLinear()
        .domain([d3.min(cleanData, d => +d.TAVG), d3.max(cleanData, d => +d.TAVG)])
        .range(['#ADD8E6', '#FFB6C1']);  // Light blue to light pink

    // OR Option 2: Using interpolate with opacity
    // const colorScale = d3.scaleSequential()
    //     .domain([d3.min(data, d => d.temp), d3.max(data, d => d.temp)])
    //     .interpolator(t => d3.interpolateRdYlBu(t).replace('rgb', 'rgba').replace(')', ',0.7)'));

    // Clear loading message
    svg.selectAll('text').remove();

    // Draw the map
    svg.append('g')
        .selectAll('path')
        .data(topojson.feature(usMap, usMap.objects.states).features)
        .join('path')
        .attr('fill', 'white')
        .attr('stroke', '#2f4858')
        .attr('stroke-width', 1)
        .attr('d', d3.geoPath().projection(projection));

    // Add US outline
    svg.append('path')
        .datum(topojson.mesh(usMap, usMap.objects.states, (a, b) => a === b))
        .attr('fill', 'none')
        .attr('stroke', '#2f4858')
        .attr('stroke-width', 1)
        .attr('d', d3.geoPath().projection(projection));

    // Add bubbles
    svg.selectAll('circle')
        .data(cleanData)
        .join('circle')
        .attr('cx', d => {
            const pos = projection([+d.longitude, +d.latitude]);
            return pos ? pos[0] : 0;
        })
        .attr('cy', d => {
            const pos = projection([+d.longitude, +d.latitude]);
            return pos ? pos[1] : 0;
        })
        .attr('r', d => rScale(+d.PRCP))
        .attr('fill', d => colorScale(+d.TAVG))
        .attr('opacity', 0.6)
        .attr('stroke', '#f28482')
        .attr('stroke-width', 0.5)
        .on('mouseover', (event, d) => {
            d3.select('#tooltip')
                .style('display', 'block')
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px')
                .html(`
                    <strong>Station:</strong> ${d.station}<br>
                    <strong>Date:</strong> ${d.date}<br>
                    <strong>Temperature:</strong> ${(+d.TAVG).toFixed(1)}°F<br>
                    <strong>Precipitation:</strong> ${(+d.PRCP).toFixed(2)} inches<br>
                    <strong>Wind Speed:</strong> ${(+d.AWND).toFixed(1)} mph
                `);
        })
        .on('mouseout', () => {
            d3.select('#tooltip').style('display', 'none');
        });

    // Add a scatter plot SVG next to the map
    const scatterSvg = d3.select('#vis')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('class', 'scatter');

    // Create scales for scatter plot
    const xScale = d3.scaleLinear()
        .domain(d3.extent(cleanData, d => +d.TAVG))
        .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
        .domain(d3.extent(cleanData, d => +d.AWND))
        .range([height - margin.bottom, margin.top]);

    // Add axes
    scatterSvg.append('g')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale))
        .append('text')
        .attr('x', width / 2)
        .attr('y', 40)
        .attr('fill', '#FF4B4B')
        .text('Temperature (°F)');

    scatterSvg.append('g')
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -40)
        .attr('fill', '#FF4B4B')
        .text('Wind Speed (mph)');

    // Add scatter plot points
    const scatterPoints = scatterSvg.selectAll('circle')
        .data(cleanData)
        .join('circle')
        .attr('cx', d => xScale(+d.TAVG))
        .attr('cy', d => yScale(+d.AWND))
        .attr('r', 5)
        .attr('fill', d => colorScale(+d.TAVG))
        .attr('opacity', 0.7);

    // Add brushing interaction
    function brushed(event) {
        if (event.selection === null) {
            svg.selectAll('circle').attr('opacity', 0.7);
            scatterPoints.attr('opacity', 0.7);
            return;
        }
        
        const [[x0, y0], [x1, y1]] = event.selection;
        const selected = cleanData.filter(d => {
            const x = xScale(d.TAVG);
            const y = yScale(d.AWND);
            return x >= x0 && x <= x1 && y >= y0 && y <= y1;
        });
        
        // Highlight selected points in both views
        svg.selectAll('circle').attr('opacity', d => 
            selected.some(s => s.station === d.station) ? 0.7 : 0.1);
        scatterPoints.attr('opacity', d => 
            selected.some(s => s.station === d.station) ? 0.7 : 0.1);
    }

    const brush = d3.brush()
        .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
        .on('brush end', brushed);

    scatterSvg.append('g')
        .attr('class', 'brush')
        .call(brush);

    // Store reference to map points for brushing
    const mapPoints = svg.selectAll('circle');

    // Add this after your existing SVG setup
    const annotations = svg.append('g').attr('class', 'annotations');
    const scatterAnnotations = scatterSvg.append('g').attr('class', 'annotations');

    let selectedStation = null;

    // Update map points with click interaction
    mapPoints
        .style('cursor', 'pointer')
        .on('click', (event, d) => {
            // Clear previous selection
            if (selectedStation === d.station) {
                selectedStation = null;
                clearHighlights();
                return;
            }

            selectedStation = d.station;
            highlightStation(d);
        });

    // Update scatter points with click interaction
    scatterPoints
        .style('cursor', 'pointer')
        .on('click', (event, d) => {
            // Clear previous selection
            if (selectedStation === d.station) {
                selectedStation = null;
                clearHighlights();
                return;
            }

            selectedStation = d.station;
            highlightStation(d);
        });

    function highlightStation(d) {
        // Clear previous highlights
        clearHighlights();

        // Highlight selected point in both views
        mapPoints
            .attr('r', p => p.station === d.station ? 8 : 5)
            .attr('stroke-width', p => p.station === d.station ? 2 : 0.5)
            .attr('opacity', p => p.station === d.station ? 1 : 0.6);

        scatterPoints
            .attr('r', p => p.station === d.station ? 8 : 5)
            .attr('stroke-width', p => p.station === d.station ? 2 : 0.5)
            .attr('opacity', p => p.station === d.station ? 1 : 0.6);

        // Add annotation to map
        const annotation = annotations
            .append('g')
            .attr('transform', `translate(${projection([d.lon, d.lat])})`);

        annotation.append('rect')
            .attr('x', 10)
            .attr('y', -40)
            .attr('width', 140)
            .attr('height', 60)
            .attr('fill', 'white')
            .attr('stroke', '#774C60')
            .attr('rx', 4);

        annotation.append('text')
            .attr('x', 15)
            .attr('y', -25)
            .attr('fill', '#774C60')
            .text(`Station: ${d.station}`);

        annotation.append('text')
            .attr('x', 15)
            .attr('y', -10)
            .attr('fill', '#774C60')
            .text(`Temp: ${d.temp}°F`);

        annotation.append('text')
            .attr('x', 15)
            .attr('y', 5)
            .attr('fill', '#774C60')
            .text(`Wind: ${d.wind} mph`);

        // Add annotation to scatter plot
        const scatterAnnotation = scatterAnnotations
            .append('g')
            .attr('transform', `translate(${xScale(d.temp)},${yScale(d.wind)})`);

        scatterAnnotation.append('rect')
            .attr('x', 10)
            .attr('y', -40)
            .attr('width', 140)
            .attr('height', 60)
            .attr('fill', 'white')
            .attr('stroke', '#774C60')
            .attr('rx', 4);

        scatterAnnotation.append('text')
            .attr('x', 15)
            .attr('y', -25)
            .attr('fill', '#774C60')
            .text(`Station: ${d.station}`);

        scatterAnnotation.append('text')
            .attr('x', 15)
            .attr('y', -10)
            .attr('fill', '#774C60')
            .text(`Temp: ${d.temp}°F`);

        scatterAnnotation.append('text')
            .attr('x', 15)
            .attr('y', 5)
            .attr('fill', '#774C60')
            .text(`Wind: ${d.wind} mph`);
    }

    function clearHighlights() {
        // Remove annotations
        annotations.selectAll('*').remove();
        scatterAnnotations.selectAll('*').remove();

        // Reset point styles
        mapPoints
            .attr('r', 5)
            .attr('stroke-width', 0.5)
            .attr('opacity', 0.8);

        scatterPoints
            .attr('r', 5)
            .attr('stroke-width', 0.5)
            .attr('opacity', 0.8);
    }

}).catch(error => {
    console.error('Error loading data:', error);
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', 'red')
        .text('Error loading data. Please check console.');
});

