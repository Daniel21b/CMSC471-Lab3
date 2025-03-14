document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Set up the SVG dimensions and margins
        const margin = { top: 0, right: 20, bottom: 20, left: 20 };
        const width = document.getElementById('vis').clientWidth - margin.left - margin.right;
        const height = 450 - margin.top - margin.bottom;

        const svg = d3.select('#vis')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Set up the projection
        const projection = d3.geoAlbersUsa()
            .scale(width)
            .translate([width / 2, height / 2]);

        // Add loading indicator
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height / 2)
            .attr('text-anchor', 'middle')
            .text('Loading data...');

        // Load both data sources
        const [weatherData, usMap] = await Promise.all([
            d3.csv('data/weather_subset.csv'),
            d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
        ]);

        // Process the weather data
        const processedData = processWeatherData(weatherData);
        const { stationData, stationGroups } = analyzeStationData(processedData);

        // Create color scale
        const colorScale = d3.scaleSequential(d3.interpolateRdYlBu)
            .domain([d3.max(stationData, d => d.avgTemperature), 
                    d3.min(stationData, d => d.avgTemperature)]);

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

        // Add weather stations
        svg.selectAll('circle')
            .data(stationData)
            .join('circle')
            .attr('cx', d => {
                const pos = projection([d.longitude, d.latitude]);
                return pos ? pos[0] : 0;
            })
            .attr('cy', d => {
                const pos = projection([d.longitude, d.latitude]);
                return pos ? pos[1] : 0;
            })
            .attr('r', d => Math.min(8, 4 + d.readings / 150))
            .attr('fill', d => colorScale(d.avgTemperature))
            .attr('opacity', 0.7)
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .on('click', (event, d) => {
                const stationData = processedData
                    .filter(pd => pd.station === d.station)
                    .map(d => ({
                        date: new Date(d.date),
                        temperature: d.temperature
                    }))
                    .sort((a, b) => a.date - b.date);

                updateDetailsPanel(d, stationData);
                createTemperatureTrends(
                    document.getElementById('temperature-visualization'),
                    stationData
                );
                createSecondPlot(
                    document.getElementById('second-plot'),
                    stationData
                );
            });

        // Add legend
        addLegendToMap(svg, stationData, colorScale, width, height);

        // Set up filtering
        setupStateFilter(stationData, svg.selectAll('circle'), processedData, colorScale);

        // Initialize empty temperature trends
        const tempContainer = document.getElementById('temperature-visualization');
        createTemperatureTrends(tempContainer, []);

    } catch (error) {
        console.error('Error initializing application:', error);
        showErrorMessage('vis');
        showErrorMessage('temperature-visualization');
    }
});


async function loadWeatherData() {
    return await d3.csv('data/weather_subset.csv', d => ({
        station: d.station,
        state: d.state,
        latitude: +d.latitude,
        longitude: +d.longitude,
        elevation: +d.elevation,
        date: new Date(d.date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')),
        TMIN: +d.TMIN,
        TMAX: +d.TMAX,
        TAVG: d.TAVG ? +d.TAVG : null,
        AWND: d.AWND ? +d.AWND : null,
        SNOW: d.SNOW ? +d.SNOW : null,
        SNWD: d.SNWD ? +d.SNWD : null,
        PRCP: d.PRCP ? +d.PRCP : null
    }));
}


function processWeatherData(weatherData) {
    return weatherData.map(d => ({
        ...d,
        temperature: d.TAVG ? (d.TAVG - 32) * 5/9 : ((d.TMAX + d.TMIN) / 2 - 32) * 5/9
    }));
}


function analyzeStationData(processedData) {
    const stationGroups = d3.group(processedData, d => d.station);
    
    const stationData = Array.from(stationGroups).map(([station, data]) => {
        const avgTemp = d3.mean(data, d => d.temperature);
        return {
            station,
            latitude: data[0].latitude,
            longitude: data[0].longitude,
            state: data[0].state,
            elevation: data[0].elevation,
            avgTemperature: avgTemp,
            readings: data.length
        };
    });
    
    return { stationData, stationGroups };
}


function initializeMap(stationData, processedData, colorScale) {

    const map = L.map('map-visualization').setView([39.8283, -98.5795], 4);
    

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);
    

    const markers = {};
    

    stationData.forEach(station => {
        const color = colorScale(station.avgTemperature);
        

        const marker = L.circleMarker([station.latitude, station.longitude], {
            radius: Math.min(8, 4 + station.readings / 150),
            fillColor: color,
            color: '#fff',
            weight: 1.5,
            opacity: 0.9,
            fillOpacity: 0.7,
            className: 'station-marker'
        }).addTo(map);
        

        markers[station.station] = marker;
        

        marker.bindPopup(createStationPopup(station));
        

        addMarkerHoverEffects(marker);
        

        marker.on('click', function() {
            const stationData = processedData.filter(d => d.station === station.station);
            updateDetailsPanel(station, stationData);
        });
    });
    
    console.log(`Created ${Object.keys(markers).length} markers for ${stationData.length} stations`);
    
    return { map, markers };
}


function createStationPopup(station) {
    return `
        <div class="popup-content">
            <h4>${station.station}, ${station.state}</h4>
            <p>Avg. Temperature: ${station.avgTemperature.toFixed(1)}°C</p>
            <p>Elevation: ${station.elevation}m</p>
            <p>Data points: ${station.readings}</p>
        </div>
    `;
}


function addMarkerHoverEffects(marker) {
    marker.on('mouseover', function() {
        this.openPopup();
        this.setStyle({
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
        });
    });
    
    marker.on('mouseout', function() {
        this.closePopup();
        this.setStyle({
            weight: 1.5,
            opacity: 0.9,
            fillOpacity: 0.7
        });
    });
}


function updateDetailsPanel(station, filteredData) {
    document.getElementById('details-panel').innerHTML = `
        <h3>Weather Details</h3>
        <p>Select a weather station on the map (you can filter by state above) to explore temperature trends, or interact with the temperature chart to analyze seasonal patterns and daily variations.</p>
    `;
}


function addLegendToMap(svg, stationData, colorScale, width, height) {
    const legendGroup = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width - 120}, ${height - 150})`);

    const tempRange = d3.range(
        Math.floor(d3.min(stationData, d => d.avgTemperature)),
        Math.ceil(d3.max(stationData, d => d.avgTemperature)),
        (Math.ceil(d3.max(stationData, d => d.avgTemperature)) - 
         Math.floor(d3.min(stationData, d => d.avgTemperature))) / 5
    );

    legendGroup.append('rect')
        .attr('width', 110)
        .attr('height', 140)
        .attr('fill', 'white')
        .attr('rx', 5)
        .attr('ry', 5)
        .style('opacity', 0.9);

    legendGroup.append('text')
        .attr('x', 55)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .text('Avg. Temp (°C)');

    const legendItems = legendGroup.selectAll('.legend-item')
        .data(tempRange)
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(10, ${i * 20 + 30})`);

    legendItems.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', d => colorScale(d));

    legendItems.append('text')
        .attr('x', 25)
        .attr('y', 12)
        .style('font-size', '11px')
        .text(d => d.toFixed(1) + '°C');
}


function createChartAxes(svg, xScale, yScale, height, width, margin) {
    const xAxis = d3.axisBottom(xScale)
        .ticks(7)
        .tickFormat(d3.timeFormat("%b %d, %Y"));
    
    const yAxis = d3.axisLeft(yScale);
    
    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis)
        .selectAll("text")  
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");
    
    svg.append('g')
        .attr('class', 'y-axis')
        .call(yAxis);
    

    svg.append('text')
        .attr('class', 'x-label')
        .attr('text-anchor', 'middle')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 5)
        .text('Date');
    
    svg.append('text')
        .attr('class', 'y-label')
        .attr('text-anchor', 'middle')
        .attr('transform', `translate(${-margin.left + 15},${height/2}) rotate(-90)`)
        .text('Temperature (°C)');
}


function showTooltip(event, d) {
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 15) + 'px');
    
    tooltip.transition()
        .duration(200)
        .style('opacity', .9);
    
    tooltip.html(`
        <div class="tooltip-date">${d.date.toLocaleDateString()}</div>
        <div class="tooltip-temp">Temperature: ${d.temperature.toFixed(1)}°C</div>
        <div class="tooltip-temp">Min: ${((d.TMIN - 32) * 5/9).toFixed(1)}°C</div>
        <div class="tooltip-temp">Max: ${((d.TMAX - 32) * 5/9).toFixed(1)}°C</div>
    `);
}


function setupStateFilter(stationData, circles, processedData, colorScale) {
    // Create the filter control container
    const filterControl = document.createElement('div');
    filterControl.className = 'filter-control';
    
    // Add a label
    const label = document.createElement('label');
    label.textContent = 'Filter States';
    filterControl.appendChild(label);
    
    // Create checkbox container
    const checkboxContainer = document.createElement('div');
    checkboxContainer.className = 'checkbox-container';
    
    // Define the exact order we want
    const orderedStates = ['all', 'CA', 'FL', 'IL', 'NY', 'TX'];
    
    // Create checkboxes in specific order
    orderedStates.forEach(state => {
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = state === 'all' ? 'all-states' : `state-${state}`;
        input.value = state;
        input.checked = state === 'all';
        
        const label = document.createElement('label');
        label.htmlFor = input.id;
        label.textContent = state === 'all' ? 'All States' : state;
        
        div.appendChild(input);
        div.appendChild(label);
        checkboxContainer.appendChild(div);
    });
    
    filterControl.appendChild(checkboxContainer);
    
    // Add event listeners
    checkboxContainer.addEventListener('change', (event) => {
        const allStatesCheckbox = document.getElementById('all-states');
        const stateCheckboxes = Array.from(checkboxContainer.querySelectorAll('input[type="checkbox"]:not(#all-states)'));
        
        if (event.target.id === 'all-states') {
            if (allStatesCheckbox.checked) {
                stateCheckboxes.forEach(cb => cb.checked = false);
            }
        } else {
            const anyStateChecked = stateCheckboxes.some(cb => cb.checked);
            allStatesCheckbox.checked = !anyStateChecked;
            
            if (!anyStateChecked) {
                allStatesCheckbox.checked = true;
            }
        }
        
        const selectedStates = [];
        if (allStatesCheckbox.checked) {
            selectedStates.push('all');
        } else {
            stateCheckboxes.forEach(cb => {
                if (cb.checked) selectedStates.push(cb.value);
            });
        }
        
        applyStateFilter({ selectedStates }, stationData, circles.nodes(), processedData, colorScale);
    });
    
    // Add to the filter controls
    const filterControls = document.querySelector('#vis-container .filter-controls');
    filterControls.appendChild(filterControl);
    
    // Initial filter application
    applyStateFilter({ selectedStates: ['all'] }, stationData, circles.nodes(), processedData, colorScale);
}


function applyStateFilter(filter, stationData, circleNodes, processedData, colorScale) {
    const selectedStates = filter.selectedStates || [];
    const hasAll = selectedStates.includes('all');
    
    stationData.forEach((station, i) => {
        const circle = circleNodes[i];
        if (!circle) {
            console.error(`Circle not found for station: ${station.station}`);
            return;
        }
        
        if (hasAll || selectedStates.includes(station.state)) {
            d3.select(circle).style('display', null);
        } else {
            d3.select(circle).style('display', 'none');
        }
    });
    
    updateDetailsIfFiltered(stationData, selectedStates, hasAll, processedData, colorScale);
}


function resetStateFilter() {
    const stateFilter = document.getElementById('state-filter');
    

    Array.from(stateFilter.options).forEach(option => {
        option.selected = option.value === 'all';
    });
    

    stateFilter.dispatchEvent(new Event('change'));
}


function updateDetailsIfFiltered(stationData, selectedStates, hasAll, processedData, colorScale) {
    const selectedStation = document.querySelector('.details-panel h3')?.textContent.split(',')[0];
    if (selectedStation) {
        const station = stationData.find(s => s.station === selectedStation);
        if (station && !(hasAll || selectedStates.includes(station.state))) {

            document.getElementById('details-panel').innerHTML = `
                <h3>Weather Details</h3>
                <p>Select a weather station on the map (you can filter by state above) to explore temperature trends, or interact with the temperature chart to analyze seasonal patterns and daily variations.</p>
            `;
        }
    }
}


function handleWindowResize(map) {
    window.addEventListener('resize', () => {
        map.invalidateSize();
    });
}


function showErrorMessage(containerId) {
    document.getElementById(containerId).innerHTML = 
        '<div class="error-message">Error loading data. Please check the console for details.</div>';
}

function createTemperatureTrends(container, data) {
    // Clear the container
    container.innerHTML = '';
    
    // Ensure data is properly formatted
    const formattedData = data.map(d => ({
        date: d.date instanceof Date ? d.date : new Date(d.date),
        temperature: +d.temperature
    })).sort((a, b) => a.date - b.date);

    // Further increase margins to prevent cutoff
    const margin = { top: 20, right: 30, bottom: 80, left: 80 };  // Increased bottom and left margins
    const width = container.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create SVG with adjusted dimensions
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales with proper domains
    const xScale = d3.scaleTime()
        .domain(d3.extent(formattedData, d => d.date))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([
            d3.min(formattedData, d => d.temperature) - 1,
            d3.max(formattedData, d => d.temperature) + 1
        ])
        .range([height, 0]);

    // Add axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    // Add X axis with rotated labels
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .attr('class', 'x-axis')
        .call(xAxis)
        .selectAll("text")  
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    // Add Y axis
    svg.append('g')
        .attr('class', 'y-axis')
        .call(yAxis);

    // Add axis labels with further adjusted positions
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 60)  // Increased distance from axis
        .style('text-anchor', 'middle')
        .style('font-size', '12px')  // Added font size
        .text('Date');

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -60)  // Increased distance from axis
        .style('text-anchor', 'middle')
        .style('font-size', '12px')  // Added font size
        .text('Temperature (°C)');

    // Create and add the line
    const line = d3.line()
        .defined(d => !isNaN(d.temperature)) // Handle missing values
        .x(d => xScale(d.date))
        .y(d => yScale(d.temperature))
        .curve(d3.curveMonotoneX);

    // Add the line path
    svg.append('path')
        .datum(formattedData)
        .attr('class', 'temperature-line')
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', '#2171b5')
        .attr('stroke-width', 1.5);

    // Add data points
    svg.selectAll('.temperature-point')
        .data(formattedData)
        .join('circle')
        .attr('class', 'temperature-point')
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d.temperature))
        .attr('r', 3)
        .attr('fill', '#2171b5')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1);

    // Add hover interactions
    const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

    svg.selectAll('.temperature-point')
        .on('mouseover', function(event, d) {
            d3.select(this)
                .attr('r', 5)
                .attr('fill', '#08519c');

            tooltip.transition()
                .duration(200)
                .style('opacity', .9);

            tooltip.html(`
                <div class="tooltip-date">${d.date.toLocaleDateString()}</div>
                <div class="tooltip-temp">${d.temperature.toFixed(1)}°C</div>
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 15) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this)
                .attr('r', 3)
                .attr('fill', '#2171b5');

            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        });
}

function createSecondPlot(container, data) {
    // Clear the container
    container.innerHTML = '';
    
    // Ensure data is properly formatted
    const formattedData = data.map(d => ({
        date: d.date instanceof Date ? d.date : new Date(d.date),
        temperature: +d.temperature
    })).sort((a, b) => a.date - b.date);

    // Use the same margin setup that worked for the temperature trends
    const margin = { top: 20, right: 30, bottom: 80, left: 80 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3.scaleTime()
        .domain(d3.extent(formattedData, d => d.date))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([
            d3.min(formattedData, d => d.temperature) - 1,
            d3.max(formattedData, d => d.temperature) + 1
        ])
        .range([height, 0]);

    // Add X axis with rotated labels
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .attr('class', 'x-axis')
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    // Add Y axis
    svg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(yScale));

    // Add axis labels
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 60)
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .text('Date');

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -60)
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .text('Temperature (°C)');

    // Add scatter plot points
    svg.selectAll('.point')
        .data(formattedData)
        .join('circle')
        .attr('class', 'point')
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d.temperature))
        .attr('r', 4)
        .attr('fill', '#e57373')
        .attr('opacity', 0.6)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1);

    // Add hover interactions
    const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

    svg.selectAll('.point')
        .on('mouseover', function(event, d) {
            d3.select(this)
                .attr('r', 6)
                .attr('opacity', 1);

            tooltip.transition()
                .duration(200)
                .style('opacity', .9);

            tooltip.html(`
                <div class="tooltip-date">${d.date.toLocaleDateString()}</div>
                <div class="tooltip-temp">${d.temperature.toFixed(1)}°C</div>
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 15) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this)
                .attr('r', 4)
                .attr('opacity', 0.6);

            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        });
}
