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
    $(document).on('click', 'ul.pagination li a',  function(e){
        e.preventDefault();
        $('#pagination').val($(this).data('pagination'));
        $('form#our-properties-list').submit();
    });

    // Initialize Leaflet map if container exists
    var mapEl = document.getElementById('map');
    if (!mapEl || typeof L === 'undefined' || typeof hotelLocationArray === 'undefined') return;

    var locations = typeof hotelLocationArray === 'string' ? JSON.parse(hotelLocationArray) : hotelLocationArray;
    if (!locations || !locations.length) return;

    var map = L.map('map');

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
    }).addTo(map);

    var markersGroup = L.featureGroup();

    $.each(locations, function(i, location) {
        var iconOptions = {};
        if (typeof PS_STORES_ICON !== 'undefined' && PS_STORES_ICON) {
            iconOptions = {
                icon: L.icon({
                    iconUrl: PS_STORES_ICON,
                    iconSize: [24, 24],
                    iconAnchor: [12, 24],
                    popupAnchor: [0, -24],
                })
            };
        }

        var marker = L.marker(
            [location.latitude, location.longitude],
            iconOptions
        );

        var directionsLink = 'https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=;' +
            location.latitude + ',' + location.longitude;

        var content = '<div><strong>' + location.hotel_name + '</strong></div>' +
            (location.map_formated_address || '') +
            '<div class="view-link"><a class="gm-btn-get-directions" href="' +
            directionsLink + '" target="_blank" tabindex="-1"><span>' +
            (typeof contact_map_get_dirs !== 'undefined' ? contact_map_get_dirs : 'Get Directions') +
            '</span></a></div>';

        marker.bindPopup(content);
        markersGroup.addLayer(marker);
    });

    markersGroup.addTo(map);
    map.fitBounds(markersGroup.getBounds(), {padding: [30, 30]});
});
