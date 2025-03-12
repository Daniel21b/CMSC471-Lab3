
document.addEventListener('DOMContentLoaded', async () => {
    try {

        const weatherData = await loadWeatherData();
        const processedData = processWeatherData(weatherData);
        

        const { stationData, stationGroups } = analyzeStationData(processedData);
        

        const colorScale = d3.scaleSequential(d3.interpolateRdYlBu)
            .domain([d3.max(stationData, d => d.avgTemperature), d3.min(stationData, d => d.avgTemperature)]);
        

        const { map, markers } = initializeMap(stationData, processedData, colorScale);
        

        addLegendToMap(map, stationData, colorScale);
        

        setupStateFilter(stationData, markers, map, processedData, colorScale);
        

        handleWindowResize(map);
        
    } catch (error) {
        console.error('Error initializing application:', error);
        showErrorMessage('map-visualization');
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
            displayTemperatureChart(stationData, station.avgTemperature, colorScale);
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
        <h3>${station.station}, ${station.state}</h3>
        <p>Average Temperature: ${station.avgTemperature.toFixed(1)}°C</p>
        <p>Latitude: ${station.latitude.toFixed(4)}, Longitude: ${station.longitude.toFixed(4)}</p>
        <p>Elevation: ${station.elevation}m</p>
        <p>Number of readings: ${filteredData.length}</p>
    `;
}


function addLegendToMap(map, stationData, colorScale) {
    const legend = L.control({position: 'bottomright'});
    
    legend.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'info legend');
        const tempRange = d3.range(
            Math.floor(d3.min(stationData, d => d.avgTemperature)),
            Math.ceil(d3.max(stationData, d => d.avgTemperature)),
            (Math.ceil(d3.max(stationData, d => d.avgTemperature)) - Math.floor(d3.min(stationData, d => d.avgTemperature))) / 5
        );
        
        div.innerHTML += '<h4>Avg. Temp (°C)</h4>';
        

        for (let i = 0; i < tempRange.length; i++) {
            div.innerHTML += 
                '<i style="background:' + colorScale(tempRange[i]) + '"></i> ' +
                tempRange[i].toFixed(1) + (tempRange[i + 1] ? '&ndash;' + tempRange[i + 1].toFixed(1) + '<br>' : '+');
        }
        
        return div;
    };
    
    legend.addTo(map);
}


function displayTemperatureChart(stationData, avgTemperature, colorScale) {
    const tempContainer = document.getElementById('temperature-visualization');
    tempContainer.innerHTML = '';
    
    if (stationData.length === 0) {
        tempContainer.innerHTML = '<div class="error-message">No data available for this station.</div>';
        return;
    }
    

    stationData.sort((a, b) => a.date - b.date);
    

    const margin = {top: 20, right: 30, bottom: 50, left: 60};
    const width = tempContainer.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    

    const svg = d3.select('#temperature-visualization')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    

    const xScale = d3.scaleTime()
        .domain(d3.extent(stationData, d => d.date))
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .domain([
            d3.min(stationData, d => d.temperature) - 2,
            d3.max(stationData, d => d.temperature) + 2
        ])
        .range([height, 0]);
    

    createChartAxes(svg, xScale, yScale, height, width, margin);
    

    const lineColor = colorScale(avgTemperature);
    

    addTemperatureLine(svg, stationData, xScale, yScale, lineColor);
    

    addTemperaturePoints(svg, stationData, xScale, yScale, lineColor);
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


function addTemperatureLine(svg, stationData, xScale, yScale, lineColor) {
    const line = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.temperature))
        .curve(d3.curveMonotoneX);
    
    svg.append('path')
        .datum(stationData)
        .attr('class', 'temp-line')
        .attr('fill', 'none')
        .attr('stroke', lineColor)
        .attr('stroke-width', 2.5)
        .attr('d', line);
}


function addTemperaturePoints(svg, stationData, xScale, yScale, lineColor) {
    svg.selectAll('.temp-point')
        .data(stationData)
        .enter()
        .append('circle')
        .attr('class', 'temp-point')
        .attr('cx', d => xScale(d.date))
        .attr('cy', d => yScale(d.temperature))
        .attr('r', 4)
        .attr('fill', lineColor)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .on('mouseover', function(event, d) {
            d3.select(this)
                .attr('r', 6)
                .attr('fill', d3.color(lineColor).darker(0.5));
            
            showTooltip(event, d);
        })
        .on('mouseout', function() {
            d3.select(this)
                .attr('r', 4)
                .attr('fill', lineColor);
            
            d3.select('.tooltip').remove();
        });
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


function setupStateFilter(stationData, markers, map, processedData, colorScale) {
    const stateSelect = document.createElement('div');
    stateSelect.className = 'filter-control';
    stateSelect.innerHTML = `
        <label for="state-filter">Filter by State:</label>
        <div class="filter-control-wrapper">
            <select id="state-filter" multiple>
                <option value="all" selected>All States</option>
                ${[...new Set(stationData.map(d => d.state))].sort().map(state => 
                    `<option value="${state}">${state}</option>`
                ).join('')}
            </select>
            <button id="clear-state-filter" class="filter-button">Reset</button>
        </div>
    `;
    document.querySelector('.filter-controls').appendChild(stateSelect);
    

    document.getElementById('state-filter').addEventListener('change', function() {
        applyStateFilter(this, stationData, markers, map, processedData, colorScale);
    });
    

    document.getElementById('clear-state-filter').addEventListener('click', function() {
        resetStateFilter();
    });
}


function applyStateFilter(selectElement, stationData, markers, map, processedData, colorScale) {
    const selectedOptions = Array.from(selectElement.selectedOptions);
    const selectedStates = selectedOptions.map(option => option.value);
    const hasAll = selectedStates.includes('all');
    

    if (hasAll && selectedOptions.length > 1) {
        Array.from(selectElement.options).forEach(option => {
            option.selected = option.value === 'all';
        });
        selectedStates.length = 0;
        selectedStates.push('all');
    }
    

    if (selectedStates.length === 0) {
        Array.from(selectElement.options).forEach(option => {
            if (option.value === 'all') {
                option.selected = true;
            }
        });
        selectedStates.push('all');
    }
    
    console.log(`Filtering to states: ${selectedStates.join(', ')}`);
    
    let visibleCount = 0;
    let hiddenCount = 0;
    

    stationData.forEach(station => {
        const marker = markers[station.station];
        
        if (!marker) {
            console.error(`Marker not found for station: ${station.station}`);
            return;
        }
        
        if (hasAll || selectedStates.includes(station.state)) {
            if (!map.hasLayer(marker)) {
                map.addLayer(marker);
            }
            visibleCount++;
        } else {
            if (map.hasLayer(marker)) {
                map.removeLayer(marker);
            }
            hiddenCount++;
        }
    });
    
    console.log(`Filter applied: ${visibleCount} stations visible, ${hiddenCount} stations hidden`);
    

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
                <p>Select a location on the map to see details.</p>
            `;
            document.getElementById('temperature-visualization').innerHTML = '';
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
