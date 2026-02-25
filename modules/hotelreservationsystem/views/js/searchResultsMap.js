/**
* NOTICE OF LICENSE
*
* This source file is subject to the Open Software License version 3.0
* that is bundled with this package in the file LICENSE.md
* It is also available through the world-wide-web at this URL:
* https://opensource.org/license/osl-3-0-php
*
* @author Webkul IN
* @copyright Since 2010 Webkul
* @license https://opensource.org/license/osl-3-0-php Open Software License version 3.0
*/

$(document).ready(function() {
    var mapContainer = $('#search-results-wrap .map-wrap');
    if (!mapContainer.length || typeof L === 'undefined') return;

    var lat = Number(hotel_location.latitude);
    var lng = Number(hotel_location.longitude);

    // Ensure map container has height
    mapContainer.css('min-height', '300px');

    var map = L.map(mapContainer.get(0), {
        zoomControl: true,
    }).setView([lat, lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
    }).addTo(map);

    var iconOptions = {};
    if (typeof PS_STORES_ICON !== 'undefined' && PS_STORES_ICON) {
        iconOptions = L.icon({
            iconUrl: PS_STORES_ICON,
            iconSize: [24, 24],
            iconAnchor: [12, 24],
            popupAnchor: [0, -24],
        });
    }

    var marker = L.marker([lat, lng], iconOptions.iconUrl ? {icon: iconOptions} : {}).addTo(map);

    if (typeof hotel_name !== 'undefined' && hotel_name) {
        marker.bindPopup('<strong>' + hotel_name + '</strong>');
    }

    marker.on('click', function() {
        var query = '';
        if (hotel_location.map_input_text) {
            query = hotel_location.map_input_text;
        } else {
            query = lat + ',' + lng;
        }
        window.open('https://www.openstreetmap.org/search?query=' + encodeURIComponent(query), '_blank');
    });

    // Fix Leaflet rendering in hidden/tabbed containers
    setTimeout(function() { map.invalidateSize(); }, 200);
});
